#region License
/*
 * HttpUtility.cs
 *
 * This code is derived from HttpUtility.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005-2009 Novell, Inc. (http://www.novell.com)
 * Copyright (c) 2012-2019 sta.blockhead
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
#endregion

#region Authors
/*
 * Authors:
 * - Patrik Torstensson <Patrik.Torstensson@labs2.com>
 * - Wictor Wilén (decode/encode functions) <wictor@ibizkit.se>
 * - Tim Coleman <tim@timcoleman.com>
 * - Gonzalo Paniagua Javier <gonzalo@ximian.com>
 */
#endregion

using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Security.Principal;
using System.Text;

namespace WebSocketSharp.Net
{
  internal static class HttpUtility
  {
    #region Private Fields

    private static Dictionary<string, char> _entities;
    private static char[]                   _hexChars;
    private static object                   _sync;

    #endregion

    #region Static Constructor

    static HttpUtility ()
    {
      _hexChars = "0123456789ABCDEF".ToCharArray ();
      _sync = new object ();
    }

    #endregion

    #region Private Methods

    private static Dictionary<string, char> getEntities ()
    {
      lock (_sync) {
        if (_entities == null)
          initEntities ();

        return _entities;
      }
    }

    private static int getNumber (char c)
    {
      return c >= '0' && c <= '9'
             ? c - '0'
             : c >= 'A' && c <= 'F'
               ? c - 'A' + 10
               : c >= 'a' && c <= 'f'
                 ? c - 'a' + 10
                 : -1;
    }

    private static int getNumber (byte[] bytes, int offset, int count)
    {
      var ret = 0;

      var end = offset + count - 1;
      for (var i = offset; i <= end; i++) {
        var num = getNumber ((char) bytes[i]);
        if (num == -1)
          return -1;

        ret = (ret << 4) + num;
      }

      return ret;
    }

    private static int getNumber (string s, int offset, int count)
    {
      var ret = 0;

      var end = offset + count - 1;
      for (var i = offset; i <= end; i++) {
        var num = getNumber (s[i]);
        if (num == -1)
          return -1;

        ret = (ret << 4) + num;
      }

      return ret;
    }

    private static string htmlDecode (string s)
    {
      var buff = new StringBuilder ();

      // 0: None
      // 1: Right after '&'
      // 2: Between '&' and ';' but no NCR
      // 3: '#' found after '&' and getting numbers
      // 4: 'x' found after '#' and getting numbers
      var state = 0;

      var reference = new StringBuilder ();
      var num = 0;

      foreach (var c in s) {
        if (state == 0) {
          if (c == '&') {
            reference.Append ('&');
            state = 1;

            continue;
          }

          buff.Append (c);
          continue;
        }

        if (c == '&') {
          buff.Append (reference.ToString ());

          reference.Length = 0;
          reference.Append ('&');
          state = 1;

          continue;
        }

        reference.Append (c);

        if (state == 1) {
          if (c == ';') {
            buff.Append (reference.ToString ());

            reference.Length = 0;
            state = 0;

            continue;
          }

          num = 0;
          state = c == '#' ? 3 : 2;

          continue;
        }

        if (state == 2) {
          if (c == ';') {
            var entity = reference.ToString ();
            var name = entity.Substring (1, entity.Length - 2);

            var entities = getEntities ();
            if (entities.ContainsKey (name))
              buff.Append (entities[name]);
            else
              buff.Append (entity);

            reference.Length = 0;
            state = 0;

            continue;
          }

          continue;
        }

        if (state == 3) {
          if (c == ';') {
            if (reference.Length > 3 && num < 65536)
              buff.Append ((char) num);
            else
              buff.Append (reference.ToString ());

            reference.Length = 0;
            state = 0;

            continue;
          }

          if (c == 'x') {
            state = reference.Length == 3 ? 4 : 2;
            continue;
          }

          if (!isNumeric (c)) {
            state = 2;
            continue;
          }

          num = num * 10 + (c - '0');
          continue;
        }

        if (state == 4) {
          if (c == ';') {
            if (reference.Length > 4 && num < 65536)
              buff.Append ((char) num);
            else
              buff.Append (reference.ToString ());

            reference.Length = 0;
            state = 0;

            continue;
          }

          var n = getNumber (c);
          if (n == -1) {
            state = 2;
            continue;
          }

          num = (num << 4) + n;
        }
      }

      if (reference.Length > 0)
        buff.Append (reference.ToString ());

      return buff.ToString ();
    }

    /// <summary>
    /// Converts the specified string to an HTML-encoded string.
    /// </summary>
    /// <remarks>
    ///   <para>
    ///   This method starts encoding with a NCR from the character code 160
    ///   but does not stop at the character code 255.
    ///   </para>
    ///   <para>
    ///   One reason is the unicode characters &#65308; and &#65310; that
    ///   look like &lt; and &gt;.
    ///   </para>
    /// </remarks>
    /// <returns>
    /// A <see cref="string"/> that represents an encoded string.
    /// </returns>
    /// <param name="s">
    /// A <see cref="string"/> to encode.
    /// </param>
    /// <param name="minimal">
    /// A <see cref="bool"/>: <c>true</c> if encodes without a NCR;
    /// otherwise, <c>false</c>.
    /// </param>
    private static string htmlEncode (string s, bool minimal)
    {
      var buff = new StringBuilder ();

      foreach (var c in s) {
        buff.Append (
          c == '"'
          ? "&quot;"
          : c == '&'
            ? "&amp;"
            : c == '<'
              ? "&lt;"
              : c == '>'
                ? "&gt;"
                : !minimal && c > 159
                  ? String.Format ("&#{0};", (int) c)
                  : c.ToString ()
        );
      }

      return buff.ToString ();
    }

    /// <summary>
    /// Initializes the _entities field.
    /// </summary>
    /// <remarks>
    /// This method builds a dictionary of HTML character entity references.
    /// This dictionary comes from the HTML 4.01 W3C recommendation.
    /// </remarks>
    private static void initEntities ()
    {
      _entities = new Dictionary<string, char> ();
      _entities.Add ("nbsp", '\u00A0');
      _entities.Add ("iexcl", '\u00A1');
      _entities.Add ("cent", '\u00A2');
      _entities.Add ("pound", '\u00A3');
      _entities.Add ("curren", '\u00A4');
      _entities.Add ("yen", '\u00A5');
      _entities.Add ("brvbar", '\u00A6');
      _entities.Add ("sect", '\u00A7');
      _entities.Add ("uml", '\u00A8');
      _entities.Add ("copy", '\u00A9');
      _entities.Add ("ordf", '\u00AA');
      _entities.Add ("laquo", '\u00AB');
      _entities.Add ("not", '\u00AC');
      _entities.Add ("shy", '\u00AD');
      _entities.Add ("reg", '\u00AE');
      _entities.Add ("macr", '\u00AF');
      _entities.Add ("deg", '\u00B0');
      _entities.Add ("plusmn", '\u00B1');
      _entities.Add ("sup2", '\u00B2');
      _entities.Add ("sup3", '\u00B3');
      _entities.Add ("acute", '\u00B4');
      _entities.Add ("micro", '\u00B5');
      _entities.Add ("para", '\u00B6');
      _entities.Add ("middot", '\u00B7');
      _entities.Add ("cedil", '\u00B8');
      _entities.Add ("sup1", '\u00B9');
      _entities.Add ("ordm", '\u00BA');
      _entities.Add ("raquo", '\u00BB');
      _entities.Add ("frac14", '\u00BC');
      _entities.Add ("frac12", '\u00BD');
      _entities.Add ("frac34", '\u00BE');
      _entities.Add ("iquest", '\u00BF');
      _entities.Add ("Agrave", '\u00C0');
      _entities.Add ("Aacute", '\u00C1');
      _entities.Add ("Acirc", '\u00C2');
      _entities.Add ("Atilde", '\u00C3');
      _entities.Add ("Auml", '\u00C4');
      _entities.Add ("Aring", '\u00C5');
      _entities.Add ("AElig", '\u00C6');
      _entities.Add ("Ccedil", '\u00C7');
      _entities.Add ("Egrave", '\u00C8');
      _entities.Add ("Eacute", '\u00C9');
      _entities.Add ("Ecirc", '\u00CA');
      _entities.Add ("Euml", '\u00CB');
      _entities.Add ("Igrave", '\u00CC');
      _entities.Add ("Iacute", '\u00CD');
      _entities.Add ("Icirc", '\u00CE');
      _entities.Add ("Iuml", '\u00CF');
      _entities.Add ("ETH", '\u00D0');
      _entities.Add ("Ntilde", '\u00D1');
      _entities.Add ("Ograve", '\u00D2');
      _entities.Add ("Oacute", '\u00D3');
      _entities.Add ("Ocirc", '\u00D4');
      _entities.Add ("Otilde", '\u00D5');
      _entities.Add ("Ouml", '\u00D6');
      _entities.Add ("times", '\u00D7');
      _entities.Add ("Oslash", '\u00D8');
      _entities.Add ("Ugrave", '\u00D9');
      _entities.Add ("Uacute", '\u00DA');
      _entities.Add ("Ucirc", '\u00DB');
      _entities.Add ("Uuml", '\u00DC');
      _entities.Add ("Yacute", '\u00DD');
      _entities.Add ("THORN", '\u00DE');
      _entities.Add ("szlig", '\u00DF');
      _entities.Add ("agrave", '\u00E0');
      _entities.Add ("aacute", '\u00E1');
      _entities.Add ("acirc", '\u00E2');
      _entities.Add ("atilde", '\u00E3');
      _entities.Add ("auml", '\u00E4');
      _entities.Add ("aring", '\u00E5');
      _entities.Add ("aelig", '\u00E6');
      _entities.Add ("ccedil", '\u00E7');
      _entities.Add ("egrave", '\u00E8');
      _entities.Add ("eacute", '\u00E9');
      _entities.Add ("ecirc", '\u00EA');
      _entities.Add ("euml", '\u00EB');
      _entities.Add ("igrave", '\u00EC');
      _entities.Add ("iacute", '\u00ED');
      _entities.Add ("icirc", '\u00EE');
      _entities.Add ("iuml", '\u00EF');
      _entities.Add ("eth", '\u00F0');
      _entities.Add ("ntilde", '\u00F1');
      _entities.Add ("ograve", '\u00F2');
      _entities.Add ("oacute", '\u00F3');
      _entities.Add ("ocirc", '\u00F4');
      _entities.Add ("otilde", '\u00F5');
      _entities.Add ("ouml", '\u00F6');
      _entities.Add ("divide", '\u00F7');
      _entities.Add ("oslash", '\u00F8');
      _entities.Add ("ugrave", '\u00F9');
      _entities.Add ("uacute", '\u00FA');
      _entities.Add ("ucirc", '\u00FB');
      _entities.Add ("uuml", '\u00FC');
      _entities.Add ("yacute", '\u00FD');
      _entities.Add ("thorn", '\u00FE');
      _entities.Add ("yuml", '\u00FF');
      _entities.Add ("fnof", '\u0192');
      _entities.Add ("Alpha", '\u0391');
      _entities.Add ("Beta", '\u0392');
      _entities.Add ("Gamma", '\u0393');
      _entities.Add ("Delta", '\u0394');
      _entities.Add ("Epsilon", '\u0395');
      _entities.Add ("Zeta", '\u0396');
      _entities.Add ("Eta", '\u0397');
      _entities.Add ("Theta", '\u0398');
      _entities.Add ("Iota", '\u0399');
      _entities.Add ("Kappa", '\u039A');
      _entities.Add ("Lambda", '\u039B');
      _entities.Add ("Mu", '\u039C');
      _entities.Add ("Nu", '\u039D');
      _entities.Add ("Xi", '\u039E');
      _entities.Add ("Omicron", '\u039F');
      _entities.Add ("Pi", '\u03A0');
      _entities.Add ("Rho", '\u03A1');
      _entities.Add ("Sigma", '\u03A3');
      _entities.Add ("Tau", '\u03A4');
      _entities.Add ("Upsilon", '\u03A5');
      _entities.Add ("Phi", '\u03A6');
      _entities.Add ("Chi", '\u03A7');
      _entities.Add ("Psi", '\u03A8');
      _entities.Add ("Omega", '\u03A9');
      _entities.Add ("alpha", '\u03B1');
      _entities.Add ("beta", '\u03B2');
      _entities.Add ("gamma", '\u03B3');
      _entities.Add ("delta", '\u03B4');
      _entities.Add ("epsilon", '\u03B5');
      _entities.Add ("zeta", '\u03B6');
      _entities.Add ("eta", '\u03B7');
      _entities.Add ("theta", '\u03B8');
      _entities.Add ("iota", '\u03B9');
      _entities.Add ("kappa", '\u03BA');
      _entities.Add ("lambda", '\u03BB');
      _entities.Add ("mu", '\u03BC');
      _entities.Add ("nu", '\u03BD');
      _entities.Add ("xi", '\u03BE');
      _entities.Add ("omicron", '\u03BF');
      _entities.Add ("pi", '\u03C0');
      _entities.Add ("rho", '\u03C1');
      _entities.Add ("sigmaf", '\u03C2');
      _entities.Add ("sigma", '\u03C3');
      _entities.Add ("tau", '\u03C4');
      _entities.Add ("upsilon", '\u03C5');
      _entities.Add ("phi", '\u03C6');
      _entities.Add ("chi", '\u03C7');
      _entities.Add ("psi", '\u03C8');
      _entities.Add ("omega", '\u03C9');
      _entities.Add ("thetasym", '\u03D1');
      _entities.Add ("upsih", '\u03D2');
      _entities.Add ("piv", '\u03D6');
      _entities.Add ("bull", '\u2022');
      _entities.Add ("hellip", '\u2026');
      _entities.Add ("prime", '\u2032');
      _entities.Add ("Prime", '\u2033');
      _entities.Add ("oline", '\u203E');
      _entities.Add ("frasl", '\u2044');
      _entities.Add ("weierp", '\u2118');
      _entities.Add ("image", '\u2111');
      _entities.Add ("real", '\u211C');
      _entities.Add ("trade", '\u2122');
      _entities.Add ("alefsym", '\u2135');
      _entities.Add ("larr", '\u2190');
      _entities.Add ("uarr", '\u2191');
      _entities.Add ("rarr", '\u2192');
      _entities.Add ("darr", '\u2193');
      _entities.Add ("harr", '\u2194');
      _entities.Add ("crarr", '\u21B5');
      _entities.Add ("lArr", '\u21D0');
      _entities.Add ("uArr", '\u21D1');
      _entities.Add ("rArr", '\u21D2');
      _entities.Add ("dArr", '\u21D3');
      _entities.Add ("hArr", '\u21D4');
      _entities.Add ("forall", '\u2200');
      _entities.Add ("part", '\u2202');
      _entities.Add ("exist", '\u2203');
      _entities.Add ("empty", '\u2205');
      _entities.Add ("nabla", '\u2207');
      _entities.Add ("isin", '\u2208');
      _entities.Add ("notin", '\u2209');
      _entities.Add ("ni", '\u220B');
      _entities.Add ("prod", '\u220F');
      _entities.Add ("sum", '\u2211');
      _entities.Add ("minus", '\u2212');
      _entities.Add ("lowast", '\u2217');
      _entities.Add ("radic", '\u221A');
      _entities.Add ("prop", '\u221D');
      _entities.Add ("infin", '\u221E');
      _entities.Add ("ang", '\u2220');
      _entities.Add ("and", '\u2227');
      _entities.Add ("or", '\u2228');
      _entities.Add ("cap", '\u2229');
      _entities.Add ("cup", '\u222A');
      _entities.Add ("int", '\u222B');
      _entities.Add ("there4", '\u2234');
      _entities.Add ("sim", '\u223C');
      _entities.Add ("cong", '\u2245');
      _entities.Add ("asymp", '\u2248');
      _entities.Add ("ne", '\u2260');
      _entities.Add ("equiv", '\u2261');
      _entities.Add ("le", '\u2264');
      _entities.Add ("ge", '\u2265');
      _entities.Add ("sub", '\u2282');
      _entities.Add ("sup", '\u2283');
      _entities.Add ("nsub", '\u2284');
      _entities.Add ("sube", '\u2286');
      _entities.Add ("supe", '\u2287');
      _entities.Add ("oplus", '\u2295');
      _entities.Add ("otimes", '\u2297');
      _entities.Add ("perp", '\u22A5');
      _entities.Add ("sdot", '\u22C5');
      _entities.Add ("lceil", '\u2308');
      _entities.Add ("rceil", '\u2309');
      _entities.Add ("lfloor", '\u230A');
      _entities.Add ("rfloor", '\u230B');
      _entities.Add ("lang", '\u2329');
      _entities.Add ("rang", '\u232A');
      _entities.Add ("loz", '\u25CA');
      _entities.Add ("spades", '\u2660');
      _entities.Add ("clubs", '\u2663');
      _entities.Add ("hearts", '\u2665');
      _entities.Add ("diams", '\u2666');
      _entities.Add ("quot", '\u0022');
      _entities.Add ("amp", '\u0026');
      _entities.Add ("lt", '\u003C');
      _entities.Add ("gt", '\u003E');
      _entities.Add ("OElig", '\u0152');
      _entities.Add ("oelig", '\u0153');
      _entities.Add ("Scaron", '\u0160');
      _entities.Add ("scaron", '\u0161');
      _entities.Add ("Yuml", '\u0178');
      _entities.Add ("circ", '\u02C6');
      _entities.Add ("tilde", '\u02DC');
      _entities.Add ("ensp", '\u2002');
      _entities.Add ("emsp", '\u2003');
      _entities.Add ("thinsp", '\u2009');
      _entities.Add ("zwnj", '\u200C');
      _entities.Add ("zwj", '\u200D');
      _entities.Add ("lrm", '\u200E');
      _entities.Add ("rlm", '\u200F');
      _entities.Add ("ndash", '\u2013');
      _entities.Add ("mdash", '\u2014');
      _entities.Add ("lsquo", '\u2018');
      _entities.Add ("rsquo", '\u2019');
      _entities.Add ("sbquo", '\u201A');
      _entities.Add ("ldquo", '\u201C');
      _entities.Add ("rdquo", '\u201D');
      _entities.Add ("bdquo", '\u201E');
      _entities.Add ("dagger", '\u2020');
      _entities.Add ("Dagger", '\u2021');
      _entities.Add ("permil", '\u2030');
      _entities.Add ("lsaquo", '\u2039');
      _entities.Add ("rsaquo", '\u203A');
      _entities.Add ("euro", '\u20AC');
    }

    private static bool isAlphabet (char c)
    {
      return (c >= 'A' && c <= 'Z')
             || (c >= 'a' && c <= 'z');
    }

    private static bool isNumeric (char c)
    {
      return c >= '0' && c <= '9';
    }

    private static bool isUnreserved (char c)
    {
      return c == '*'
             || c == '-'
             || c == '.'
             || c == '_';
    }

    private static bool isUnreservedInRfc2396 (char c)
    {
      return c == '!'
             || c == '\''
             || c == '('
             || c == ')'
             || c == '*'
             || c == '-'
             || c == '.'
             || c == '_'
             || c == '~';
    }

    private static bool isUnreservedInRfc3986 (char c)
    {
      return c == '-'
             || c == '.'
             || c == '_'
             || c == '~';
    }

    private static byte[] urlDecodeToBytes (byte[] bytes, int offset, int count)
    {
      using (var buff = new MemoryStream ()) {
        var end = offset + count - 1;
        for (var i = offset; i <= end; i++) {
          var b = bytes[i];

          var c = (char) b;
          if (c == '%') {
            if (i > end - 2)
              break;

            var num = getNumber (bytes, i + 1, 2);
            if (num == -1)
              break;

            buff.WriteByte ((byte) num);
            i += 2;

            continue;
          }

          if (c == '+') {
            buff.WriteByte ((byte) ' ');
            continue;
          }

          buff.WriteByte (b);
        }

        buff.Close ();
        return buff.ToArray ();
      }
    }

    private static void urlEncode (byte b, Stream output)
    {
      if (b > 31 && b < 127) {
        var c = (char) b;
        if (c == ' ') {
          output.WriteByte ((byte) '+');
          return;
        }

        if (isNumeric (c)) {
          output.WriteByte (b);
          return;
        }

        if (isAlphabet (c)) {
          output.WriteByte (b);
          return;
        }

        if (isUnreserved (c)) {
          output.WriteByte (b);
          return;
        }
      }

      var i = (int) b;
      var bytes = new byte[] {
                    (byte) '%',
                    (byte) _hexChars[i >> 4],
                    (byte) _hexChars[i & 0x0F]
                  };

      output.Write (bytes, 0, 3);
    }

    private static byte[] urlEncodeToBytes (byte[] bytes, int offset, int count)
    {
      using (var buff = new MemoryStream ()) {
        var end = offset + count - 1;
        for (var i = offset; i <= end; i++)
          urlEncode (bytes[i], buff);

        buff.Close ();
        return buff.ToArray ();
      }
    }

    #endregion

    #region Internal Methods

    internal static Uri CreateRequestUrl (
      string requestUri, string host, bool websocketRequest, bool secure
    )
    {
      if (requestUri == null || requestUri.Length == 0)
        return null;

      if (host == null || host.Length == 0)
        return null;

      string schm = null;
      string path = null;

      if (requestUri.IndexOf ('/') == 0) {
        path = requestUri;
      }
      else if (requestUri.MaybeUri ()) {
        Uri uri;

        if (!Uri.TryCreate (requestUri, UriKind.Absolute, out uri))
          return null;

        schm = uri.Scheme;
        var valid = websocketRequest
                    ? schm == "ws" || schm == "wss"
                    : schm == "http" || schm == "https";

        if (!valid)
          return null;

        host = uri.Authority;
        path = uri.PathAndQuery;
      }
      else if (requestUri == "*") {
      }
      else {
        // As the authority form.

        host = requestUri;
      }

      if (schm == null) {
        schm = websocketRequest
               ? (secure ? "wss" : "ws")
               : (secure ? "https" : "http");
      }

      if (host.IndexOf (':') == -1)
        host = String.Format ("{0}:{1}", host, secure ? 443 : 80);

      var url = String.Format ("{0}://{1}{2}", schm, host, path);
      Uri ret;

      return Uri.TryCreate (url, UriKind.Absolute, out ret) ? ret : null;
    }

    internal static IPrincipal CreateUser (
      string response,
      AuthenticationSchemes scheme,
      string realm,
      string method,
      Func<IIdentity, NetworkCredential> credentialsFinder
    )
    {
      if (response == null || response.Length == 0)
        return null;

      if (scheme == AuthenticationSchemes.Digest) {
        if (realm == null || realm.Length == 0)
          return null;

        if (method == null || method.Length == 0)
          return null;
      }
      else {
        if (scheme != AuthenticationSchemes.Basic)
          return null;
      }

      if (credentialsFinder == null)
        return null;

      var compType = StringComparison.OrdinalIgnoreCase;
      if (response.IndexOf (scheme.ToString (), compType) != 0)
        return null;

      var res = AuthenticationResponse.Parse (response);
      if (res == null)
        return null;

      var id = res.ToIdentity ();
      if (id == null)
        return null;

      NetworkCredential cred = null;
      try {
        cred = credentialsFinder (id);
      }
      catch {
      }

      if (cred == null)
        return null;

      if (scheme == AuthenticationSchemes.Basic) {
        var basicId = (HttpBasicIdentity) id;
        return basicId.Password == cred.Password
               ? new GenericPrincipal (id, cred.Roles)
               : null;
      }

      var digestId = (HttpDigestIdentity) id;
      return digestId.IsValid (cred.Password, realm, method, null)
             ? new GenericPrincipal (id, cred.Roles)
             : null;
    }

    internal static Encoding GetEncoding (string contentType)
    {
      var name = "charset=";
      var compType = StringComparison.OrdinalIgnoreCase;

      foreach (var elm in contentType.SplitHeaderValue (';')) {
        var part = elm.Trim ();

        if (!part.StartsWith (name, compType))
          continue;

        var val = part.GetValue ('=', true);

        if (val == null || val.Length == 0)
          return null;

        return Encoding.GetEncoding (val);
      }

      return null;
    }

    internal static bool TryGetEncoding (
      string contentType, out Encoding result
    )
    {
      result = null;

      try {
        result = GetEncoding (contentType);
      }
      catch {
        return false;
      }

      return result != null;
    }

    #endregion

    #region Public Methods

    public static string HtmlAttributeEncode (string s)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      return s.Length > 0 ? htmlEncode (s, true) : s;
    }

    public static void HtmlAttributeEncode (string s, TextWriter output)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      if (output == null)
        throw new ArgumentNullException ("output");

      if (s.Length == 0)
        return;

      output.Write (htmlEncode (s, true));
    }

    public static string HtmlDecode (string s)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      return s.Length > 0 ? htmlDecode (s) : s;
    }

    public static void HtmlDecode (string s, TextWriter output)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      if (output == null)
        throw new ArgumentNullException ("output");

      if (s.Length == 0)
        return;

      output.Write (htmlDecode (s));
    }

    public static string HtmlEncode (string s)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      return s.Length > 0 ? htmlEncode (s, false) : s;
    }

    public static void HtmlEncode (string s, TextWriter output)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      if (output == null)
        throw new ArgumentNullException ("output");

      if (s.Length == 0)
        return;

      output.Write (htmlEncode (s, false));
    }

    public static string UrlDecode (string s)
    {
      return UrlDecode (s, Encoding.UTF8);
    }

    public static string UrlDecode (byte[] bytes, Encoding encoding)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      return len > 0
             ? (encoding ?? Encoding.UTF8).GetString (
                 urlDecodeToBytes (bytes, 0, len)
               )
             : String.Empty;
    }

    public static string UrlDecode (string s, Encoding encoding)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      if (s.Length == 0)
        return s;

      var bytes = Encoding.ASCII.GetBytes (s);
      return (encoding ?? Encoding.UTF8).GetString (
               urlDecodeToBytes (bytes, 0, bytes.Length)
             );
    }

    public static string UrlDecode (
      byte[] bytes, int offset, int count, Encoding encoding
    )
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      if (len == 0) {
        if (offset != 0)
          throw new ArgumentOutOfRangeException ("offset");

        if (count != 0)
          throw new ArgumentOutOfRangeException ("count");

        return String.Empty;
      }

      if (offset < 0 || offset >= len)
        throw new ArgumentOutOfRangeException ("offset");

      if (count < 0 || count > len - offset)
        throw new ArgumentOutOfRangeException ("count");

      return count > 0
             ? (encoding ?? Encoding.UTF8).GetString (
                 urlDecodeToBytes (bytes, offset, count)
               )
             : String.Empty;
    }

    public static byte[] UrlDecodeToBytes (byte[] bytes)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      return len > 0
             ? urlDecodeToBytes (bytes, 0, len)
             : bytes;
    }

    public static byte[] UrlDecodeToBytes (string s)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      if (s.Length == 0)
        return new byte[0];

      var bytes = Encoding.ASCII.GetBytes (s);
      return urlDecodeToBytes (bytes, 0, bytes.Length);
    }

    public static byte[] UrlDecodeToBytes (byte[] bytes, int offset, int count)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      if (len == 0) {
        if (offset != 0)
          throw new ArgumentOutOfRangeException ("offset");

        if (count != 0)
          throw new ArgumentOutOfRangeException ("count");

        return bytes;
      }

      if (offset < 0 || offset >= len)
        throw new ArgumentOutOfRangeException ("offset");

      if (count < 0 || count > len - offset)
        throw new ArgumentOutOfRangeException ("count");

      return count > 0
             ? urlDecodeToBytes (bytes, offset, count)
             : new byte[0];
    }

    public static string UrlEncode (byte[] bytes)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      return len > 0
             ? Encoding.ASCII.GetString (urlEncodeToBytes (bytes, 0, len))
             : String.Empty;
    }

    public static string UrlEncode (string s)
    {
      return UrlEncode (s, Encoding.UTF8);
    }

    public static string UrlEncode (string s, Encoding encoding)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      var len = s.Length;
      if (len == 0)
        return s;

      if (encoding == null)
        encoding = Encoding.UTF8;

      var bytes = new byte[encoding.GetMaxByteCount (len)];
      var realLen = encoding.GetBytes (s, 0, len, bytes, 0);

      return Encoding.ASCII.GetString (urlEncodeToBytes (bytes, 0, realLen));
    }

    public static string UrlEncode (byte[] bytes, int offset, int count)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      if (len == 0) {
        if (offset != 0)
          throw new ArgumentOutOfRangeException ("offset");

        if (count != 0)
          throw new ArgumentOutOfRangeException ("count");

        return String.Empty;
      }

      if (offset < 0 || offset >= len)
        throw new ArgumentOutOfRangeException ("offset");

      if (count < 0 || count > len - offset)
        throw new ArgumentOutOfRangeException ("count");

      return count > 0
             ? Encoding.ASCII.GetString (
                 urlEncodeToBytes (bytes, offset, count)
               )
             : String.Empty;
    }

    public static byte[] UrlEncodeToBytes (byte[] bytes)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      return len > 0 ? urlEncodeToBytes (bytes, 0, len) : bytes;
    }

    public static byte[] UrlEncodeToBytes (string s)
    {
      return UrlEncodeToBytes (s, Encoding.UTF8);
    }

    public static byte[] UrlEncodeToBytes (string s, Encoding encoding)
    {
      if (s == null)
        throw new ArgumentNullException ("s");

      if (s.Length == 0)
        return new byte[0];

      var bytes = (encoding ?? Encoding.UTF8).GetBytes (s);
      return urlEncodeToBytes (bytes, 0, bytes.Length);
    }

    public static byte[] UrlEncodeToBytes (byte[] bytes, int offset, int count)
    {
      if (bytes == null)
        throw new ArgumentNullException ("bytes");

      var len = bytes.Length;
      if (len == 0) {
        if (offset != 0)
          throw new ArgumentOutOfRangeException ("offset");

        if (count != 0)
          throw new ArgumentOutOfRangeException ("count");

        return bytes;
      }

      if (offset < 0 || offset >= len)
        throw new ArgumentOutOfRangeException ("offset");

      if (count < 0 || count > len - offset)
        throw new ArgumentOutOfRangeException ("count");

      return count > 0 ? urlEncodeToBytes (bytes, offset, count) : new byte[0];
    }

    #endregion
  }
}
