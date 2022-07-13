#region License
/*
 * Ext.cs
 *
 * Some parts of this code are derived from Mono (http://www.mono-project.com):
 * - GetStatusDescription is derived from HttpListenerResponse.cs (System.Net)
 * - MaybeUri is derived from Uri.cs (System)
 * - isPredefinedScheme is derived from Uri.cs (System)
 *
 * The MIT License
 *
 * Copyright (c) 2001 Garrett Rooney
 * Copyright (c) 2003 Ian MacLean
 * Copyright (c) 2003 Ben Maurer
 * Copyright (c) 2003, 2005, 2009 Novell, Inc. (http://www.novell.com)
 * Copyright (c) 2009 Stephane Delcroix
 * Copyright (c) 2010-2022 sta.blockhead
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

#region Contributors
/*
 * Contributors:
 * - Liryna <liryna.stark@gmail.com>
 * - Nikola Kovacevic <nikolak@outlook.com>
 * - Chris Swiedler
 */
#endregion

using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.IO.Compression;
using System.Net.Sockets;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using WebSocketSharp.Net;
using WebSocketSharp.Net.WebSockets;
using WebSocketSharp.Server;

namespace WebSocketSharp
{
  /// <summary>
  /// Provides a set of static methods for websocket-sharp.
  /// </summary>
  public static class Ext
  {
    #region Private Fields

    private static readonly byte[] _last = new byte[] { 0x00 };
    private static readonly int    _maxRetry = 5;
    private const string           _tspecials = "()<>@,;:\\\"/[]?={} \t";

    #endregion

    #region Private Methods

    private static byte[] compress (this byte[] data)
    {
      if (data.LongLength == 0)
        return data;

      using (var input = new MemoryStream (data))
        return input.compressToArray ();
    }

    private static MemoryStream compress (this Stream stream)
    {
      var ret = new MemoryStream ();

      if (stream.Length == 0)
        return ret;

      stream.Position = 0;

      var mode = CompressionMode.Compress;

      using (var ds = new DeflateStream (ret, mode, true)) {
        stream.CopyTo (ds, 1024);
        ds.Close (); // BFINAL set to 1.
        ret.Write (_last, 0, 1);

        ret.Position = 0;

        return ret;
      }
    }

    private static byte[] compressToArray (this Stream stream)
    {
      using (var output = stream.compress ()) {
        output.Close ();

        return output.ToArray ();
      }
    }

    private static byte[] decompress (this byte[] data)
    {
      if (data.LongLength == 0)
        return data;

      using (var input = new MemoryStream (data))
        return input.decompressToArray ();
    }

    private static MemoryStream decompress (this Stream stream)
    {
      var ret = new MemoryStream ();

      if (stream.Length == 0)
        return ret;

      stream.Position = 0;

      var mode = CompressionMode.Decompress;

      using (var ds = new DeflateStream (stream, mode, true)) {
        ds.CopyTo (ret, 1024);

        ret.Position = 0;

        return ret;
      }
    }

    private static byte[] decompressToArray (this Stream stream)
    {
      using (var output = stream.decompress ()) {
        output.Close ();

        return output.ToArray ();
      }
    }

    private static bool isPredefinedScheme (this string value)
    {
      var c = value[0];

      if (c == 'h')
        return value == "http" || value == "https";

      if (c == 'w')
        return value == "ws" || value == "wss";

      if (c == 'f')
        return value == "file" || value == "ftp";

      if (c == 'g')
        return value == "gopher";

      if (c == 'm')
        return value == "mailto";

      if (c == 'n') {
        c = value[1];

        return c == 'e'
               ? value == "news" || value == "net.pipe" || value == "net.tcp"
               : value == "nntp";
      }

      return false;
    }

    #endregion

    #region Internal Methods

    internal static byte[] Append (this ushort code, string reason)
    {
      var codeAsBytes = code.ToByteArray (ByteOrder.Big);

      if (reason == null || reason.Length == 0)
        return codeAsBytes;

      var buff = new List<byte> (codeAsBytes);
      var reasonAsBytes = Encoding.UTF8.GetBytes (reason);

      buff.AddRange (reasonAsBytes);

      return buff.ToArray ();
    }

    internal static byte[] Compress (
      this byte[] data, CompressionMethod method
    )
    {
      return method == CompressionMethod.Deflate
             ? data.compress ()
             : data;
    }

    internal static Stream Compress (
      this Stream stream, CompressionMethod method
    )
    {
      return method == CompressionMethod.Deflate
             ? stream.compress ()
             : stream;
    }

    internal static bool Contains (this string value, params char[] anyOf)
    {
      return anyOf != null && anyOf.Length > 0
             ? value.IndexOfAny (anyOf) > -1
             : false;
    }

    internal static bool Contains (
      this NameValueCollection collection, string name
    )
    {
      return collection[name] != null;
    }

    internal static bool Contains (
      this NameValueCollection collection,
      string name,
      string value,
      StringComparison comparisonTypeForValue
    )
    {
      var val = collection[name];

      if (val == null)
        return false;

      foreach (var elm in val.Split (',')) {
        if (elm.Trim ().Equals (value, comparisonTypeForValue))
          return true;
      }

      return false;
    }

    internal static bool Contains<T> (
      this IEnumerable<T> source, Func<T, bool> condition
    )
    {
      foreach (T elm in source) {
        if (condition (elm))
          return true;
      }

      return false;
    }

    internal static bool ContainsTwice (this string[] values)
    {
      var len = values.Length;
      var end = len - 1;

      Func<int, bool> seek = null;
      seek = idx => {
               if (idx == end)
                 return false;

               var val = values[idx];

               for (var i = idx + 1; i < len; i++) {
                 if (values[i] == val)
                   return true;
               }

               return seek (++idx);
             };

      return seek (0);
    }

    internal static T[] Copy<T> (this T[] sourceArray, int length)
    {
      var dest = new T[length];

      Array.Copy (sourceArray, 0, dest, 0, length);

      return dest;
    }

    internal static T[] Copy<T> (this T[] sourceArray, long length)
    {
      var dest = new T[length];

      Array.Copy (sourceArray, 0, dest, 0, length);

      return dest;
    }

    internal static void CopyTo (
      this Stream sourceStream, Stream destinationStream, int bufferLength
    )
    {
      var buff = new byte[bufferLength];

      while (true) {
        var nread = sourceStream.Read (buff, 0, bufferLength);

        if (nread <= 0)
          break;

        destinationStream.Write (buff, 0, nread);
      }
    }

    internal static void CopyToAsync (
      this Stream sourceStream,
      Stream destinationStream,
      int bufferLength,
      Action completed,
      Action<Exception> error
    )
    {
      var buff = new byte[bufferLength];

      AsyncCallback callback = null;
      callback =
        ar => {
          try {
            var nread = sourceStream.EndRead (ar);

            if (nread <= 0) {
              if (completed != null)
                completed ();

              return;
            }

            destinationStream.Write (buff, 0, nread);

            sourceStream.BeginRead (buff, 0, bufferLength, callback, null);
          }
          catch (Exception ex) {
            if (error != null)
              error (ex);
          }
        };

      try {
        sourceStream.BeginRead (buff, 0, bufferLength, callback, null);
      }
      catch (Exception ex) {
        if (error != null)
          error (ex);
      }
    }

    internal static byte[] Decompress (
      this byte[] data, CompressionMethod method
    )
    {
      return method == CompressionMethod.Deflate
             ? data.decompress ()
             : data;
    }

    internal static Stream Decompress (
      this Stream stream, CompressionMethod method
    )
    {
      return method == CompressionMethod.Deflate
             ? stream.decompress ()
             : stream;
    }

    internal static byte[] DecompressToArray (
      this Stream stream, CompressionMethod method
    )
    {
      return method == CompressionMethod.Deflate
             ? stream.decompressToArray ()
             : stream.ToByteArray ();
    }

    internal static void Emit (
      this EventHandler eventHandler, object sender, EventArgs e
    )
    {
      if (eventHandler == null)
        return;

      eventHandler (sender, e);
    }

    internal static void Emit<TEventArgs> (
      this EventHandler<TEventArgs> eventHandler, object sender, TEventArgs e
    )
      where TEventArgs : EventArgs
    {
      if (eventHandler == null)
        return;

      eventHandler (sender, e);
    }

    internal static string GetAbsolutePath (this Uri uri)
    {
      if (uri.IsAbsoluteUri)
        return uri.AbsolutePath;

      var original = uri.OriginalString;

      if (original[0] != '/')
        return null;

      var idx = original.IndexOfAny (new[] { '?', '#' });

      return idx > 0 ? original.Substring (0, idx) : original;
    }

    internal static CookieCollection GetCookies (
      this NameValueCollection headers, bool response
    )
    {
      var val = headers[response ? "Set-Cookie" : "Cookie"];

      return val != null
             ? CookieCollection.Parse (val, response)
             : new CookieCollection ();
    }

    internal static string GetDnsSafeHost (this Uri uri, bool bracketIPv6)
    {
      return bracketIPv6 && uri.HostNameType == UriHostNameType.IPv6
             ? uri.Host
             : uri.DnsSafeHost;
    }

    internal static string GetMessage (this CloseStatusCode code)
    {
      switch (code) {
        case CloseStatusCode.ProtocolError:
          return "A protocol error has occurred.";
        case CloseStatusCode.UnsupportedData:
          return "Unsupported data has been received.";
        case CloseStatusCode.Abnormal:
          return "An abnormal error has occurred.";
        case CloseStatusCode.InvalidData:
          return "Invalid data has been received.";
        case CloseStatusCode.PolicyViolation:
          return "A policy violation has occurred.";
        case CloseStatusCode.TooBig:
          return "A too big message has been received.";
        case CloseStatusCode.MandatoryExtension:
          return "The client did not receive expected extension(s).";
        case CloseStatusCode.ServerError:
          return "The server got an internal error.";
        case CloseStatusCode.TlsHandshakeFailure:
          return "An error has occurred during a TLS handshake.";
        default:
          return String.Empty;
      }
    }

    internal static string GetName (this string nameAndValue, char separator)
    {
      var idx = nameAndValue.IndexOf (separator);

      return idx > 0 ? nameAndValue.Substring (0, idx).Trim () : null;
    }

    internal static string GetUTF8DecodedString (this byte[] bytes)
    {
      return Encoding.UTF8.GetString (bytes);
    }

    internal static byte[] GetUTF8EncodedBytes (this string s)
    {
      return Encoding.UTF8.GetBytes (s);
    }

    internal static string GetValue (this string nameAndValue, char separator)
    {
      return nameAndValue.GetValue (separator, false);
    }

    internal static string GetValue (
      this string nameAndValue, char separator, bool unquote
    )
    {
      var idx = nameAndValue.IndexOf (separator);

      if (idx < 0 || idx == nameAndValue.Length - 1)
        return null;

      var val = nameAndValue.Substring (idx + 1).Trim ();

      return unquote ? val.Unquote () : val;
    }

    internal static bool IsCompressionExtension (
      this string value, CompressionMethod method
    )
    {
      var val = method.ToExtensionString ();
      var compType = StringComparison.Ordinal;

      return value.StartsWith (val, compType);
    }

    internal static bool IsControl (this byte opcode)
    {
      return opcode > 0x7 && opcode < 0x10;
    }

    internal static bool IsControl (this Opcode opcode)
    {
      return opcode >= Opcode.Close;
    }

    internal static bool IsData (this byte opcode)
    {
      return opcode == 0x1 || opcode == 0x2;
    }

    internal static bool IsData (this Opcode opcode)
    {
      return opcode == Opcode.Text || opcode == Opcode.Binary;
    }

    internal static bool IsEqualTo (
      this int value, char c, Action<int> beforeComparing
    )
    {
      beforeComparing (value);

      return value == c - 0;
    }

    internal static bool IsHttpMethod (this string value)
    {
      return value == "GET"
             || value == "HEAD"
             || value == "POST"
             || value == "PUT"
             || value == "DELETE"
             || value == "CONNECT"
             || value == "OPTIONS"
             || value == "TRACE";
    }

    internal static bool IsPortNumber (this int value)
    {
      return value > 0 && value < 65536;
    }

    internal static bool IsReserved (this ushort code)
    {
      return code == 1004
             || code == 1005
             || code == 1006
             || code == 1015;
    }

    internal static bool IsReserved (this CloseStatusCode code)
    {
      return code == CloseStatusCode.Undefined
             || code == CloseStatusCode.NoStatus
             || code == CloseStatusCode.Abnormal
             || code == CloseStatusCode.TlsHandshakeFailure;
    }

    internal static bool IsSupported (this byte opcode)
    {
      return Enum.IsDefined (typeof (Opcode), opcode);
    }

    internal static bool IsText (this string value)
    {
      var len = value.Length;

      for (var i = 0; i < len; i++) {
        var c = value[i];

        if (c < 0x20) {
          if ("\r\n\t".IndexOf (c) == -1)
            return false;

          if (c == '\n') {
            i++;

            if (i == len)
              break;

            c = value[i];

            if (" \t".IndexOf (c) == -1)
              return false;
          }

          continue;
        }

        if (c == 0x7f)
          return false;
      }

      return true;
    }

    internal static bool IsToken (this string value)
    {
      foreach (var c in value) {
        if (c < 0x20)
          return false;

        if (c > 0x7e)
          return false;

        if (_tspecials.IndexOf (c) > -1)
          return false;
      }

      return true;
    }

    internal static bool KeepsAlive (
      this NameValueCollection headers, Version version
    )
    {
      var compType = StringComparison.OrdinalIgnoreCase;

      return version < HttpVersion.Version11
             ? headers.Contains ("Connection", "keep-alive", compType)
             : !headers.Contains ("Connection", "close", compType);
    }

    internal static bool MaybeUri (this string value)
    {
      var idx = value.IndexOf (':');

      if (idx < 2 || idx > 9)
        return false;

      var schm = value.Substring (0, idx);

      return schm.isPredefinedScheme ();
    }

    internal static string Quote (this string value)
    {
      var fmt = "\"{0}\"";
      var val = value.Replace ("\"", "\\\"");

      return String.Format (fmt, val);
    }

    internal static byte[] ReadBytes (this Stream stream, int length)
    {
      var ret = new byte[length];

      var offset = 0;
      var retry = 0;

      while (length > 0) {
        var nread = stream.Read (ret, offset, length);

        if (nread <= 0) {
          if (retry < _maxRetry) {
            retry++;

            continue;
          }

          return ret.SubArray (0, offset);
        }

        retry = 0;

        offset += nread;
        length -= nread;
      }

      return ret;
    }

    internal static byte[] ReadBytes (
      this Stream stream, long length, int bufferLength
    )
    {
      using (var dest = new MemoryStream ()) {
        var buff = new byte[bufferLength];
        var retry = 0;

        while (length > 0) {
          if (length < bufferLength)
            bufferLength = (int) length;

          var nread = stream.Read (buff, 0, bufferLength);

          if (nread <= 0) {
            if (retry < _maxRetry) {
              retry++;

              continue;
            }

            break;
          }

          retry = 0;

          dest.Write (buff, 0, nread);

          length -= nread;
        }

        dest.Close ();

        return dest.ToArray ();
      }
    }

    internal static void ReadBytesAsync (
      this Stream stream,
      int length,
      Action<byte[]> completed,
      Action<Exception> error
    )
    {
      var ret = new byte[length];

      var offset = 0;
      var retry = 0;

      AsyncCallback callback = null;
      callback =
        ar => {
          try {
            var nread = stream.EndRead (ar);

            if (nread <= 0) {
              if (retry < _maxRetry) {
                retry++;

                stream.BeginRead (ret, offset, length, callback, null);

                return;
              }

              if (completed != null)
                completed (ret.SubArray (0, offset));

              return;
            }

            if (nread == length) {
              if (completed != null)
                completed (ret);

              return;
            }

            retry = 0;

            offset += nread;
            length -= nread;

            stream.BeginRead (ret, offset, length, callback, null);
          }
          catch (Exception ex) {
            if (error != null)
              error (ex);
          }
        };

      try {
        stream.BeginRead (ret, offset, length, callback, null);
      }
      catch (Exception ex) {
        if (error != null)
          error (ex);
      }
    }

    internal static void ReadBytesAsync (
      this Stream stream,
      long length,
      int bufferLength,
      Action<byte[]> completed,
      Action<Exception> error
    )
    {
      var dest = new MemoryStream ();

      var buff = new byte[bufferLength];
      var retry = 0;

      Action<long> read = null;
      read =
        len => {
          if (len < bufferLength)
            bufferLength = (int) len;

          stream.BeginRead (
            buff,
            0,
            bufferLength,
            ar => {
              try {
                var nread = stream.EndRead (ar);

                if (nread <= 0) {
                  if (retry < _maxRetry) {
                    retry++;

                    read (len);

                    return;
                  }

                  if (completed != null) {
                    dest.Close ();

                    var ret = dest.ToArray ();
                    completed (ret);
                  }

                  dest.Dispose ();

                  return;
                }

                dest.Write (buff, 0, nread);

                if (nread == len) {
                  if (completed != null) {
                    dest.Close ();
                
                    var ret = dest.ToArray ();
                    completed (ret);
                  }

                  dest.Dispose ();

                  return;
                }

                retry = 0;

                read (len - nread);
              }
              catch (Exception ex) {
                dest.Dispose ();

                if (error != null)
                  error (ex);
              }
            },
            null
          );
        };

      try {
        read (length);
      }
      catch (Exception ex) {
        dest.Dispose ();

        if (error != null)
          error (ex);
      }
    }

    internal static T[] Reverse<T> (this T[] array)
    {
      var len = array.LongLength;
      var ret = new T[len];

      var end = len - 1;

      for (long i = 0; i <= end; i++)
        ret[i] = array[end - i];

      return ret;
    }

    internal static IEnumerable<string> SplitHeaderValue (
      this string value, params char[] separators
    )
    {
      var len = value.Length;
      var end = len - 1;

      var buff = new StringBuilder (32);
      var escaped = false;
      var quoted = false;

      for (var i = 0; i <= end; i++) {
        var c = value[i];
        buff.Append (c);

        if (c == '"') {
          if (escaped) {
            escaped = false;

            continue;
          }

          quoted = !quoted;

          continue;
        }

        if (c == '\\') {
          if (i == end)
            break;

          if (value[i + 1] == '"')
            escaped = true;

          continue;
        }

        if (Array.IndexOf (separators, c) > -1) {
          if (quoted)
            continue;

          buff.Length -= 1;

          yield return buff.ToString ();

          buff.Length = 0;

          continue;
        }
      }

      yield return buff.ToString ();
    }

    internal static byte[] ToByteArray (this Stream stream)
    {
      stream.Position = 0;

      using (var buff = new MemoryStream ()) {
        stream.CopyTo (buff, 1024);
        buff.Close ();

        return buff.ToArray ();
      }
    }

    internal static byte[] ToByteArray (this ushort value, ByteOrder order)
    {
      var ret = BitConverter.GetBytes (value);

      if (!order.IsHostOrder ())
        Array.Reverse (ret);

      return ret;
    }

    internal static byte[] ToByteArray (this ulong value, ByteOrder order)
    {
      var ret = BitConverter.GetBytes (value);

      if (!order.IsHostOrder ())
        Array.Reverse (ret);

      return ret;
    }

    internal static CompressionMethod ToCompressionMethod (this string value)
    {
      var methods = Enum.GetValues (typeof (CompressionMethod));

      foreach (CompressionMethod method in methods) {
        if (method.ToExtensionString () == value)
          return method;
      }

      return CompressionMethod.None;
    }

    internal static string ToExtensionString (
      this CompressionMethod method, params string[] parameters
    )
    {
      if (method == CompressionMethod.None)
        return String.Empty;

      var name = method.ToString ().ToLower ();
      var ename = String.Format ("permessage-{0}", name);

      if (parameters == null || parameters.Length == 0)
        return ename;

      var eparams = parameters.ToString ("; ");

      return String.Format ("{0}; {1}", ename, eparams);
    }

    internal static int ToInt32 (this string numericString)
    {
      return Int32.Parse (numericString);
    }

    internal static System.Net.IPAddress ToIPAddress (this string value)
    {
      if (value == null || value.Length == 0)
        return null;

      System.Net.IPAddress addr;

      if (System.Net.IPAddress.TryParse (value, out addr))
        return addr;

      try {
        var addrs = System.Net.Dns.GetHostAddresses (value);

        return addrs[0];
      }
      catch {
        return null;
      }
    }

    internal static List<TSource> ToList<TSource> (
      this IEnumerable<TSource> source
    )
    {
      return new List<TSource> (source);
    }

    internal static string ToString (
      this System.Net.IPAddress address, bool bracketIPv6
    )
    {
      return bracketIPv6
             && address.AddressFamily == AddressFamily.InterNetworkV6
             ? String.Format ("[{0}]", address)
             : address.ToString ();
    }

    internal static ushort ToUInt16 (this byte[] source, ByteOrder sourceOrder)
    {
      var val = source.ToHostOrder (sourceOrder);

      return BitConverter.ToUInt16 (val, 0);
    }

    internal static ulong ToUInt64 (this byte[] source, ByteOrder sourceOrder)
    {
      var val = source.ToHostOrder (sourceOrder);

      return BitConverter.ToUInt64 (val, 0);
    }

    internal static Version ToVersion (this string versionString)
    {
      return new Version (versionString);
    }

    internal static IEnumerable<string> TrimEach (
      this IEnumerable<string> source
    )
    {
      foreach (var elm in source)
        yield return elm.Trim ();
    }

    internal static string TrimSlashFromEnd (this string value)
    {
      var ret = value.TrimEnd ('/');

      return ret.Length > 0 ? ret : "/";
    }

    internal static string TrimSlashOrBackslashFromEnd (this string value)
    {
      var ret = value.TrimEnd ('/', '\\');

      return ret.Length > 0 ? ret : value[0].ToString ();
    }

    internal static bool TryCreateVersion (
      this string versionString, out Version result
    )
    {
      result = null;

      try {
        result = new Version (versionString);
      }
      catch {
        return false;
      }

      return true;
    }

    internal static bool TryCreateWebSocketUri (
      this string uriString, out Uri result, out string message
    )
    {
      result = null;
      message = null;

      var uri = uriString.ToUri ();

      if (uri == null) {
        message = "An invalid URI string.";

        return false;
      }

      if (!uri.IsAbsoluteUri) {
        message = "A relative URI.";

        return false;
      }

      var schm = uri.Scheme;
      var valid = schm == "ws" || schm == "wss";

      if (!valid) {
        message = "The scheme part is not 'ws' or 'wss'.";

        return false;
      }

      var port = uri.Port;

      if (port == 0) {
        message = "The port part is zero.";

        return false;
      }

      if (uri.Fragment.Length > 0) {
        message = "It includes the fragment component.";

        return false;
      }

      if (port == -1) {
        port = schm == "ws" ? 80 : 443;
        uriString = String.Format (
                      "{0}://{1}:{2}{3}",
                      schm,
                      uri.Host,
                      port,
                      uri.PathAndQuery
                    );

        result = new Uri (uriString);
      }
      else {
        result = uri;
      }

      return true;
    }

    internal static bool TryGetUTF8DecodedString (
      this byte[] bytes, out string s
    )
    {
      s = null;

      try {
        s = Encoding.UTF8.GetString (bytes);
      }
      catch {
        return false;
      }

      return true;
    }

    internal static bool TryGetUTF8EncodedBytes (
      this string s, out byte[] bytes
    )
    {
      bytes = null;

      try {
        bytes = Encoding.UTF8.GetBytes (s);
      }
      catch {
        return false;
      }

      return true;
    }

    internal static bool TryOpenRead (
      this FileInfo fileInfo, out FileStream fileStream
    )
    {
      fileStream = null;

      try {
        fileStream = fileInfo.OpenRead ();
      }
      catch {
        return false;
      }

      return true;
    }

    internal static string Unquote (this string value)
    {
      var first = value.IndexOf ('"');

      if (first == -1)
        return value;

      var last = value.LastIndexOf ('"');

      if (last == first)
        return value;

      var len = last - first - 1;

      return len > 0
             ? value.Substring (first + 1, len).Replace ("\\\"", "\"")
             : String.Empty;
    }

    internal static bool Upgrades (
      this NameValueCollection headers, string protocol
    )
    {
      var compType = StringComparison.OrdinalIgnoreCase;

      return headers.Contains ("Upgrade", protocol, compType)
             && headers.Contains ("Connection", "Upgrade", compType);
    }

    internal static string UrlDecode (this string value, Encoding encoding)
    {
      return value.IndexOfAny (new[] { '%', '+' }) > -1
             ? HttpUtility.UrlDecode (value, encoding)
             : value;
    }

    internal static string UrlEncode (this string value, Encoding encoding)
    {
      return HttpUtility.UrlEncode (value, encoding);
    }

    internal static void WriteBytes (
      this Stream stream, byte[] bytes, int bufferLength
    )
    {
      using (var src = new MemoryStream (bytes))
        src.CopyTo (stream, bufferLength);
    }

    internal static void WriteBytesAsync (
      this Stream stream,
      byte[] bytes,
      int bufferLength,
      Action completed,
      Action<Exception> error
    )
    {
      var src = new MemoryStream (bytes);

      src.CopyToAsync (
        stream,
        bufferLength,
        () => {
          if (completed != null)
            completed ();

          src.Dispose ();
        },
        ex => {
          src.Dispose ();

          if (error != null)
            error (ex);
        }
      );
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Gets the description of the specified HTTP status code.
    /// </summary>
    /// <returns>
    /// A <see cref="string"/> that represents the description of
    /// the HTTP status code.
    /// </returns>
    /// <param name="code">
    ///   <para>
    ///   One of the <see cref="HttpStatusCode"/> enum values.
    ///   </para>
    ///   <para>
    ///   It specifies the HTTP status code.
    ///   </para>
    /// </param>
    public static string GetDescription (this HttpStatusCode code)
    {
      return ((int) code).GetStatusDescription ();
    }

    /// <summary>
    /// Gets the description of the specified HTTP status code.
    /// </summary>
    /// <returns>
    ///   <para>
    ///   A <see cref="string"/> that represents the description of
    ///   the HTTP status code.
    ///   </para>
    ///   <para>
    ///   An empty string if the description is not present.
    ///   </para>
    /// </returns>
    /// <param name="code">
    /// An <see cref="int"/> that specifies the HTTP status code.
    /// </param>
    public static string GetStatusDescription (this int code)
    {
      switch (code) {
        case 100: return "Continue";
        case 101: return "Switching Protocols";
        case 102: return "Processing";
        case 200: return "OK";
        case 201: return "Created";
        case 202: return "Accepted";
        case 203: return "Non-Authoritative Information";
        case 204: return "No Content";
        case 205: return "Reset Content";
        case 206: return "Partial Content";
        case 207: return "Multi-Status";
        case 300: return "Multiple Choices";
        case 301: return "Moved Permanently";
        case 302: return "Found";
        case 303: return "See Other";
        case 304: return "Not Modified";
        case 305: return "Use Proxy";
        case 307: return "Temporary Redirect";
        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 402: return "Payment Required";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 405: return "Method Not Allowed";
        case 406: return "Not Acceptable";
        case 407: return "Proxy Authentication Required";
        case 408: return "Request Timeout";
        case 409: return "Conflict";
        case 410: return "Gone";
        case 411: return "Length Required";
        case 412: return "Precondition Failed";
        case 413: return "Request Entity Too Large";
        case 414: return "Request-Uri Too Long";
        case 415: return "Unsupported Media Type";
        case 416: return "Requested Range Not Satisfiable";
        case 417: return "Expectation Failed";
        case 422: return "Unprocessable Entity";
        case 423: return "Locked";
        case 424: return "Failed Dependency";
        case 500: return "Internal Server Error";
        case 501: return "Not Implemented";
        case 502: return "Bad Gateway";
        case 503: return "Service Unavailable";
        case 504: return "Gateway Timeout";
        case 505: return "Http Version Not Supported";
        case 507: return "Insufficient Storage";
      }

      return String.Empty;
    }

    /// <summary>
    /// Determines whether the specified ushort is in the range of
    /// the status code for the WebSocket connection close.
    /// </summary>
    /// <remarks>
    ///   <para>
    ///   The ranges are the following:
    ///   </para>
    ///   <list type="bullet">
    ///     <item>
    ///       <term>
    ///       1000-2999: These numbers are reserved for definition by
    ///       the WebSocket protocol.
    ///       </term>
    ///     </item>
    ///     <item>
    ///       <term>
    ///       3000-3999: These numbers are reserved for use by libraries,
    ///       frameworks, and applications.
    ///       </term>
    ///     </item>
    ///     <item>
    ///       <term>
    ///       4000-4999: These numbers are reserved for private use.
    ///       </term>
    ///     </item>
    ///   </list>
    /// </remarks>
    /// <returns>
    /// <c>true</c> if <paramref name="value"/> is in the range of
    /// the status code for the close; otherwise, <c>false</c>.
    /// </returns>
    /// <param name="value">
    /// A <see cref="ushort"/> to test.
    /// </param>
    public static bool IsCloseStatusCode (this ushort value)
    {
      return value > 999 && value < 5000;
    }

    /// <summary>
    /// Determines whether the specified string is enclosed in
    /// the specified character.
    /// </summary>
    /// <returns>
    /// <c>true</c> if <paramref name="value"/> is enclosed in
    /// <paramref name="c"/>; otherwise, <c>false</c>.
    /// </returns>
    /// <param name="value">
    /// A <see cref="string"/> to test.
    /// </param>
    /// <param name="c">
    /// A <see cref="char"/> to find.
    /// </param>
    public static bool IsEnclosedIn (this string value, char c)
    {
      if (value == null)
        return false;

      var len = value.Length;

      return len > 1 ? value[0] == c && value[len - 1] == c : false;
    }

    /// <summary>
    /// Determines whether the specified byte order is host (this computer
    /// architecture) byte order.
    /// </summary>
    /// <returns>
    /// <c>true</c> if <paramref name="order"/> is host byte order; otherwise,
    /// <c>false</c>.
    /// </returns>
    /// <param name="order">
    /// One of the <see cref="ByteOrder"/> enum values to test.
    /// </param>
    public static bool IsHostOrder (this ByteOrder order)
    {
      // true: !(true ^ true) or !(false ^ false)
      // false: !(true ^ false) or !(false ^ true)
      return !(BitConverter.IsLittleEndian ^ (order == ByteOrder.Little));
    }

    /// <summary>
    /// Determines whether the specified IP address is a local IP address.
    /// </summary>
    /// <remarks>
    /// This local means NOT REMOTE for the current host.
    /// </remarks>
    /// <returns>
    /// <c>true</c> if <paramref name="address"/> is a local IP address;
    /// otherwise, <c>false</c>.
    /// </returns>
    /// <param name="address">
    /// A <see cref="System.Net.IPAddress"/> to test.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="address"/> is <see langword="null"/>.
    /// </exception>
    public static bool IsLocal (this System.Net.IPAddress address)
    {
      if (address == null)
        throw new ArgumentNullException ("address");

      if (address.Equals (System.Net.IPAddress.Any))
        return true;

      if (address.Equals (System.Net.IPAddress.Loopback))
        return true;

      if (Socket.OSSupportsIPv6) {
        if (address.Equals (System.Net.IPAddress.IPv6Any))
          return true;

        if (address.Equals (System.Net.IPAddress.IPv6Loopback))
          return true;
      }

      var name = System.Net.Dns.GetHostName ();
      var addrs = System.Net.Dns.GetHostAddresses (name);

      foreach (var addr in addrs) {
        if (address.Equals (addr))
          return true;
      }

      return false;
    }

    /// <summary>
    /// Determines whether the specified string is <see langword="null"/> or
    /// an empty string.
    /// </summary>
    /// <returns>
    /// <c>true</c> if <paramref name="value"/> is <see langword="null"/> or
    /// an empty string; otherwise, <c>false</c>.
    /// </returns>
    /// <param name="value">
    /// A <see cref="string"/> to test.
    /// </param>
    public static bool IsNullOrEmpty (this string value)
    {
      return value == null || value.Length == 0;
    }

    /// <summary>
    /// Retrieves a sub-array from the specified array. A sub-array starts at
    /// the specified index in the array.
    /// </summary>
    /// <returns>
    /// An array of T that receives a sub-array.
    /// </returns>
    /// <param name="array">
    /// An array of T from which to retrieve a sub-array.
    /// </param>
    /// <param name="startIndex">
    /// An <see cref="int"/> that specifies the zero-based index in the array
    /// at which retrieving starts.
    /// </param>
    /// <param name="length">
    /// An <see cref="int"/> that specifies the number of elements to retrieve.
    /// </param>
    /// <typeparam name="T">
    /// The type of elements in the array.
    /// </typeparam>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="array"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    ///   <para>
    ///   <paramref name="startIndex"/> is less than zero.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="startIndex"/> is greater than the end of the array.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="length"/> is less than zero.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="length"/> is greater than the number of elements from
    ///   <paramref name="startIndex"/> to the end of the array.
    ///   </para>
    /// </exception>
    public static T[] SubArray<T> (this T[] array, int startIndex, int length)
    {
      if (array == null)
        throw new ArgumentNullException ("array");

      var len = array.Length;

      if (len == 0) {
        if (startIndex != 0)
          throw new ArgumentOutOfRangeException ("startIndex");

        if (length != 0)
          throw new ArgumentOutOfRangeException ("length");

        return array;
      }

      if (startIndex < 0 || startIndex >= len)
        throw new ArgumentOutOfRangeException ("startIndex");

      if (length < 0 || length > len - startIndex)
        throw new ArgumentOutOfRangeException ("length");

      if (length == 0)
        return new T[0];

      if (length == len)
        return array;

      var ret = new T[length];

      Array.Copy (array, startIndex, ret, 0, length);

      return ret;
    }

    /// <summary>
    /// Retrieves a sub-array from the specified array. A sub-array starts at
    /// the specified index in the array.
    /// </summary>
    /// <returns>
    /// An array of T that receives a sub-array.
    /// </returns>
    /// <param name="array">
    /// An array of T from which to retrieve a sub-array.
    /// </param>
    /// <param name="startIndex">
    /// A <see cref="long"/> that specifies the zero-based index in the array
    /// at which retrieving starts.
    /// </param>
    /// <param name="length">
    /// A <see cref="long"/> that specifies the number of elements to retrieve.
    /// </param>
    /// <typeparam name="T">
    /// The type of elements in the array.
    /// </typeparam>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="array"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    ///   <para>
    ///   <paramref name="startIndex"/> is less than zero.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="startIndex"/> is greater than the end of the array.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="length"/> is less than zero.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="length"/> is greater than the number of elements from
    ///   <paramref name="startIndex"/> to the end of the array.
    ///   </para>
    /// </exception>
    public static T[] SubArray<T> (this T[] array, long startIndex, long length)
    {
      if (array == null)
        throw new ArgumentNullException ("array");

      var len = array.LongLength;

      if (len == 0) {
        if (startIndex != 0)
          throw new ArgumentOutOfRangeException ("startIndex");

        if (length != 0)
          throw new ArgumentOutOfRangeException ("length");

        return array;
      }

      if (startIndex < 0 || startIndex >= len)
        throw new ArgumentOutOfRangeException ("startIndex");

      if (length < 0 || length > len - startIndex)
        throw new ArgumentOutOfRangeException ("length");

      if (length == 0)
        return new T[0];

      if (length == len)
        return array;

      var ret = new T[length];

      Array.Copy (array, startIndex, ret, 0, length);

      return ret;
    }

    /// <summary>
    /// Executes the specified delegate <paramref name="n"/> times.
    /// </summary>
    /// <param name="n">
    /// An <see cref="int"/> that specifies the number of times to execute.
    /// </param>
    /// <param name="action">
    ///   <para>
    ///   An <c>Action&lt;int&gt;</c> delegate to execute.
    ///   </para>
    ///   <para>
    ///   The <see cref="int"/> parameter is the zero-based count of iteration.
    ///   </para>
    /// </param>
    public static void Times (this int n, Action<int> action)
    {
      if (n <= 0)
        return;

      if (action == null)
        return;

      for (int i = 0; i < n; i++)
        action (i);
    }

    /// <summary>
    /// Executes the specified delegate <paramref name="n"/> times.
    /// </summary>
    /// <param name="n">
    /// A <see cref="long"/> that specifies the number of times to execute.
    /// </param>
    /// <param name="action">
    ///   <para>
    ///   An <c>Action&lt;long&gt;</c> delegate to execute.
    ///   </para>
    ///   <para>
    ///   The <see cref="long"/> parameter is the zero-based count of iteration.
    ///   </para>
    /// </param>
    public static void Times (this long n, Action<long> action)
    {
      if (n <= 0)
        return;

      if (action == null)
        return;

      for (long i = 0; i < n; i++)
        action (i);
    }

    /// <summary>
    /// Converts the order of elements in the specified byte array to
    /// host (this computer architecture) byte order.
    /// </summary>
    /// <returns>
    ///   <para>
    ///   An array of <see cref="byte"/> converted from
    ///   <paramref name="source"/>.
    ///   </para>
    ///   <para>
    ///   <paramref name="source"/> if the number of elements in
    ///   it is less than 2 or <paramref name="sourceOrder"/> is
    ///   same as host byte order.
    ///   </para>
    /// </returns>
    /// <param name="source">
    /// An array of <see cref="byte"/> to convert.
    /// </param>
    /// <param name="sourceOrder">
    ///   <para>
    ///   One of the <see cref="ByteOrder"/> enum values.
    ///   </para>
    ///   <para>
    ///   It specifies the order of elements in <paramref name="source"/>.
    ///   </para>
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="source"/> is <see langword="null"/>.
    /// </exception>
    public static byte[] ToHostOrder (this byte[] source, ByteOrder sourceOrder)
    {
      if (source == null)
        throw new ArgumentNullException ("source");

      if (source.Length < 2)
        return source;

      if (sourceOrder.IsHostOrder ())
        return source;

      return source.Reverse ();
    }

    /// <summary>
    /// Converts the specified array to a string.
    /// </summary>
    /// <returns>
    ///   <para>
    ///   A <see cref="string"/> converted by concatenating each element of
    ///   <paramref name="array"/> across <paramref name="separator"/>.
    ///   </para>
    ///   <para>
    ///   An empty string if <paramref name="array"/> is an empty array.
    ///   </para>
    /// </returns>
    /// <param name="array">
    /// An array of T to convert.
    /// </param>
    /// <param name="separator">
    /// A <see cref="string"/> used to separate each element of
    /// <paramref name="array"/>.
    /// </param>
    /// <typeparam name="T">
    /// The type of elements in <paramref name="array"/>.
    /// </typeparam>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="array"/> is <see langword="null"/>.
    /// </exception>
    public static string ToString<T> (this T[] array, string separator)
    {
      if (array == null)
        throw new ArgumentNullException ("array");

      var len = array.Length;

      if (len == 0)
        return String.Empty;

      var buff = new StringBuilder (64);
      var end = len - 1;

      for (var i = 0; i < end; i++)
        buff.AppendFormat ("{0}{1}", array[i], separator);

      buff.AppendFormat ("{0}", array[end]);

      return buff.ToString ();
    }

    /// <summary>
    /// Converts the specified string to a <see cref="Uri"/>.
    /// </summary>
    /// <returns>
    ///   <para>
    ///   A <see cref="Uri"/> converted from <paramref name="value"/>.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the conversion has failed.
    ///   </para>
    /// </returns>
    /// <param name="value">
    /// A <see cref="string"/> to convert.
    /// </param>
    public static Uri ToUri (this string value)
    {
      if (value == null || value.Length == 0)
        return null;

      var kind = value.MaybeUri () ? UriKind.Absolute : UriKind.Relative;
      Uri ret;

      Uri.TryCreate (value, kind, out ret);

      return ret;
    }

    #endregion
  }
}
