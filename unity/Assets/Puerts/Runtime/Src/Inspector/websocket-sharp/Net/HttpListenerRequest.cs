#region License
/*
 * HttpListenerRequest.cs
 *
 * This code is derived from HttpListenerRequest.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005 Novell, Inc. (http://www.novell.com)
 * Copyright (c) 2012-2022 sta.blockhead
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
 * - Gonzalo Paniagua Javier <gonzalo@novell.com>
 */
#endregion

using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace WebSocketSharp.Net
{
  /// <summary>
  /// Represents an incoming HTTP request to a <see cref="HttpListener"/>
  /// instance.
  /// </summary>
  /// <remarks>
  /// This class cannot be inherited.
  /// </remarks>
  public sealed class HttpListenerRequest
  {
    #region Private Fields

    private static readonly byte[]   _100continue;
    private string[]                 _acceptTypes;
    private bool                     _chunked;
    private HttpConnection           _connection;
    private Encoding                 _contentEncoding;
    private long                     _contentLength;
    private HttpListenerContext      _context;
    private CookieCollection         _cookies;
    private static readonly Encoding _defaultEncoding;
    private WebHeaderCollection      _headers;
    private string                   _httpMethod;
    private Stream                   _inputStream;
    private Version                  _protocolVersion;
    private NameValueCollection      _queryString;
    private string                   _rawUrl;
    private Guid                     _requestTraceIdentifier;
    private Uri                      _url;
    private Uri                      _urlReferrer;
    private bool                     _urlSet;
    private string                   _userHostName;
    private string[]                 _userLanguages;

    #endregion

    #region Static Constructor

    static HttpListenerRequest ()
    {
      _100continue = Encoding.ASCII.GetBytes ("HTTP/1.1 100 Continue\r\n\r\n");
      _defaultEncoding = Encoding.UTF8;
    }

    #endregion

    #region Internal Constructors

    internal HttpListenerRequest (HttpListenerContext context)
    {
      _context = context;

      _connection = context.Connection;
      _contentLength = -1;
      _headers = new WebHeaderCollection ();
      _requestTraceIdentifier = Guid.NewGuid ();
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets the media types that are acceptable for the client.
    /// </summary>
    /// <value>
    ///   <para>
    ///   An array of <see cref="string"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The array contains the names of the media types specified in
    ///   the value of the Accept header.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the header is not present.
    ///   </para>
    /// </value>
    public string[] AcceptTypes {
      get {
        var val = _headers["Accept"];

        if (val == null)
          return null;

        if (_acceptTypes == null) {
          _acceptTypes = val
                         .SplitHeaderValue (',')
                         .TrimEach ()
                         .ToList ()
                         .ToArray ();
        }

        return _acceptTypes;
      }
    }

    /// <summary>
    /// Gets an error code that identifies a problem with the certificate
    /// provided by the client.
    /// </summary>
    /// <value>
    /// An <see cref="int"/> that represents an error code.
    /// </value>
    /// <exception cref="NotSupportedException">
    /// This property is not supported.
    /// </exception>
    public int ClientCertificateError {
      get {
        throw new NotSupportedException ();
      }
    }

    /// <summary>
    /// Gets the encoding for the entity body data included in the request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="Encoding"/> converted from the charset value of the
    ///   Content-Type header.
    ///   </para>
    ///   <para>
    ///   <see cref="Encoding.UTF8"/> if the charset value is not available.
    ///   </para>
    /// </value>
    public Encoding ContentEncoding {
      get {
        if (_contentEncoding == null)
          _contentEncoding = getContentEncoding ();

        return _contentEncoding;
      }
    }

    /// <summary>
    /// Gets the length in bytes of the entity body data included in the
    /// request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="long"/> converted from the value of the Content-Length
    ///   header.
    ///   </para>
    ///   <para>
    ///   -1 if the header is not present.
    ///   </para>
    /// </value>
    public long ContentLength64 {
      get {
        return _contentLength;
      }
    }

    /// <summary>
    /// Gets the media type of the entity body data included in the request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The string represents the value of the Content-Type header.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the header is not present.
    ///   </para>
    /// </value>
    public string ContentType {
      get {
        return _headers["Content-Type"];
      }
    }

    /// <summary>
    /// Gets the cookies included in the request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="CookieCollection"/> that contains the cookies.
    ///   </para>
    ///   <para>
    ///   An empty collection if not included.
    ///   </para>
    /// </value>
    public CookieCollection Cookies {
      get {
        if (_cookies == null)
          _cookies = _headers.GetCookies (false);

        return _cookies;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the request has the entity body data.
    /// </summary>
    /// <value>
    /// <c>true</c> if the request has the entity body data; otherwise,
    /// <c>false</c>.
    /// </value>
    public bool HasEntityBody {
      get {
        return _contentLength > 0 || _chunked;
      }
    }

    /// <summary>
    /// Gets the headers included in the request.
    /// </summary>
    /// <value>
    /// A <see cref="NameValueCollection"/> that contains the headers.
    /// </value>
    public NameValueCollection Headers {
      get {
        return _headers;
      }
    }

    /// <summary>
    /// Gets the HTTP method specified by the client.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the HTTP method specified in
    /// the request line.
    /// </value>
    public string HttpMethod {
      get {
        return _httpMethod;
      }
    }

    /// <summary>
    /// Gets a stream that contains the entity body data included in
    /// the request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="Stream"/> that contains the entity body data.
    ///   </para>
    ///   <para>
    ///   <see cref="Stream.Null"/> if the entity body data is not available.
    ///   </para>
    /// </value>
    public Stream InputStream {
      get {
        if (_inputStream == null) {
          _inputStream = _contentLength > 0 || _chunked
                         ? _connection
                           .GetRequestStream (_contentLength, _chunked)
                         : Stream.Null;
        }

        return _inputStream;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the client is authenticated.
    /// </summary>
    /// <value>
    /// <c>true</c> if the client is authenticated; otherwise, <c>false</c>.
    /// </value>
    public bool IsAuthenticated {
      get {
        return _context.User != null;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the request is sent from the
    /// local computer.
    /// </summary>
    /// <value>
    /// <c>true</c> if the request is sent from the same computer as
    /// the server; otherwise, <c>false</c>.
    /// </value>
    public bool IsLocal {
      get {
        return _connection.IsLocal;
      }
    }

    /// <summary>
    /// Gets a value indicating whether a secure connection is used to send
    /// the request.
    /// </summary>
    /// <value>
    /// <c>true</c> if the connection is secure; otherwise, <c>false</c>.
    /// </value>
    public bool IsSecureConnection {
      get {
        return _connection.IsSecure;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the request is a WebSocket handshake
    /// request.
    /// </summary>
    /// <value>
    /// <c>true</c> if the request is a WebSocket handshake request; otherwise,
    /// <c>false</c>.
    /// </value>
    public bool IsWebSocketRequest {
      get {
        return _httpMethod == "GET" && _headers.Upgrades ("websocket");
      }
    }

    /// <summary>
    /// Gets a value indicating whether a persistent connection is requested.
    /// </summary>
    /// <value>
    /// <c>true</c> if the request specifies that the connection is kept open;
    /// otherwise, <c>false</c>.
    /// </value>
    public bool KeepAlive {
      get {
        return _headers.KeepsAlive (_protocolVersion);
      }
    }

    /// <summary>
    /// Gets the endpoint to which the request is sent.
    /// </summary>
    /// <value>
    /// A <see cref="System.Net.IPEndPoint"/> that represents the server
    /// IP address and port number.
    /// </value>
    public System.Net.IPEndPoint LocalEndPoint {
      get {
        return _connection.LocalEndPoint;
      }
    }

    /// <summary>
    /// Gets the HTTP version specified by the client.
    /// </summary>
    /// <value>
    /// A <see cref="Version"/> that represents the HTTP version specified in
    /// the request line.
    /// </value>
    public Version ProtocolVersion {
      get {
        return _protocolVersion;
      }
    }

    /// <summary>
    /// Gets the query string included in the request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="NameValueCollection"/> that contains the query
    ///   parameters.
    ///   </para>
    ///   <para>
    ///   Each query parameter is decoded in UTF-8.
    ///   </para>
    ///   <para>
    ///   An empty collection if not included.
    ///   </para>
    /// </value>
    public NameValueCollection QueryString {
      get {
        if (_queryString == null) {
          var url = Url;
          var query = url != null ? url.Query : null;

          _queryString = QueryStringCollection.Parse (query, _defaultEncoding);
        }

        return _queryString;
      }
    }

    /// <summary>
    /// Gets the raw URL specified by the client.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the request target specified in
    /// the request line.
    /// </value>
    public string RawUrl {
      get {
        return _rawUrl;
      }
    }

    /// <summary>
    /// Gets the endpoint from which the request is sent.
    /// </summary>
    /// <value>
    /// A <see cref="System.Net.IPEndPoint"/> that represents the client
    /// IP address and port number.
    /// </value>
    public System.Net.IPEndPoint RemoteEndPoint {
      get {
        return _connection.RemoteEndPoint;
      }
    }

    /// <summary>
    /// Gets the trace identifier of the request.
    /// </summary>
    /// <value>
    /// A <see cref="Guid"/> that represents the trace identifier.
    /// </value>
    public Guid RequestTraceIdentifier {
      get {
        return _requestTraceIdentifier;
      }
    }

    /// <summary>
    /// Gets the URL requested by the client.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="Uri"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The Uri represents the URL parsed from the request.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the URL cannot be parsed.
    ///   </para>
    /// </value>
    public Uri Url {
      get {
        if (!_urlSet) {
          _url = HttpUtility
                 .CreateRequestUrl (
                   _rawUrl,
                   _userHostName,
                   IsWebSocketRequest,
                   IsSecureConnection
                 );

          _urlSet = true;
        }

        return _url;
      }
    }

    /// <summary>
    /// Gets the URI of the resource from which the requested URL was obtained.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="Uri"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The Uri represents the value of the Referer header.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the header value is not available.
    ///   </para>
    /// </value>
    public Uri UrlReferrer {
      get {
        var val = _headers["Referer"];

        if (val == null)
          return null;

        if (_urlReferrer == null)
          _urlReferrer = val.ToUri ();

        return _urlReferrer;
      }
    }

    /// <summary>
    /// Gets the user agent from which the request is originated.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The string represents the value of the User-Agent header.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the header is not present.
    ///   </para>
    /// </value>
    public string UserAgent {
      get {
        return _headers["User-Agent"];
      }
    }

    /// <summary>
    /// Gets the IP address and port number to which the request is sent.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the server IP address and
    /// port number.
    /// </value>
    public string UserHostAddress {
      get {
        return _connection.LocalEndPoint.ToString ();
      }
    }

    /// <summary>
    /// Gets the server host name requested by the client.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the value of the Host header.
    ///   </para>
    ///   <para>
    ///   It includes the port number if provided.
    ///   </para>
    /// </value>
    public string UserHostName {
      get {
        return _userHostName;
      }
    }

    /// <summary>
    /// Gets the natural languages that are acceptable for the client.
    /// </summary>
    /// <value>
    ///   <para>
    ///   An array of <see cref="string"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The array contains the names of the natural languages specified in
    ///   the value of the Accept-Language header.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the header is not present.
    ///   </para>
    /// </value>
    public string[] UserLanguages {
      get {
        var val = _headers["Accept-Language"];

        if (val == null)
          return null;

        if (_userLanguages == null)
          _userLanguages = val.Split (',').TrimEach ().ToList ().ToArray ();

        return _userLanguages;
      }
    }

    #endregion

    #region Private Methods

    private Encoding getContentEncoding ()
    {
      var val = _headers["Content-Type"];

      if (val == null)
        return _defaultEncoding;

      Encoding ret;

      return HttpUtility.TryGetEncoding (val, out ret)
             ? ret
             : _defaultEncoding;
    }

    #endregion

    #region Internal Methods

    internal void AddHeader (string headerField)
    {
      var start = headerField[0];

      if (start == ' ' || start == '\t') {
        _context.ErrorMessage = "Invalid header field";

        return;
      }

      var colon = headerField.IndexOf (':');

      if (colon < 1) {
        _context.ErrorMessage = "Invalid header field";

        return;
      }

      var name = headerField.Substring (0, colon).Trim ();

      if (name.Length == 0 || !name.IsToken ()) {
        _context.ErrorMessage = "Invalid header name";

        return;
      }

      var val = colon < headerField.Length - 1
                ? headerField.Substring (colon + 1).Trim ()
                : String.Empty;

      _headers.InternalSet (name, val, false);

      var lower = name.ToLower (CultureInfo.InvariantCulture);

      if (lower == "host") {
        if (_userHostName != null) {
          _context.ErrorMessage = "Invalid Host header";

          return;
        }

        if (val.Length == 0) {
          _context.ErrorMessage = "Invalid Host header";

          return;
        }

        _userHostName = val;

        return;
      }

      if (lower == "content-length") {
        if (_contentLength > -1) {
          _context.ErrorMessage = "Invalid Content-Length header";

          return;
        }

        long len;

        if (!Int64.TryParse (val, out len)) {
          _context.ErrorMessage = "Invalid Content-Length header";

          return;
        }

        if (len < 0) {
          _context.ErrorMessage = "Invalid Content-Length header";

          return;
        }

        _contentLength = len;

        return;
      }
    }

    internal void FinishInitialization ()
    {
      if (_userHostName == null) {
        _context.ErrorMessage = "Host header required";

        return;
      }

      var transferEnc = _headers["Transfer-Encoding"];

      if (transferEnc != null) {
        var compType = StringComparison.OrdinalIgnoreCase;

        if (!transferEnc.Equals ("chunked", compType)) {
          _context.ErrorStatusCode = 501;
          _context.ErrorMessage = "Invalid Transfer-Encoding header";

          return;
        }

        _chunked = true;
      }

      if (_httpMethod == "POST" || _httpMethod == "PUT") {
        if (_contentLength == -1 && !_chunked) {
          _context.ErrorStatusCode = 411;
          _context.ErrorMessage = "Content-Length header required";

          return;
        }

        if (_contentLength == 0 && !_chunked) {
          _context.ErrorStatusCode = 411;
          _context.ErrorMessage = "Invalid Content-Length header";

          return;
        }
      }

      var expect = _headers["Expect"];

      if (expect != null) {
        var compType = StringComparison.OrdinalIgnoreCase;

        if (!expect.Equals ("100-continue", compType)) {
          _context.ErrorStatusCode = 417;
          _context.ErrorMessage = "Invalid Expect header";

          return;
        }

        var output = _connection.GetResponseStream ();

        output.InternalWrite (_100continue, 0, _100continue.Length);
      }
    }

    internal bool FlushInput ()
    {
      var input = InputStream;

      if (input == Stream.Null)
        return true;

      var len = 2048;

      if (_contentLength > 0 && _contentLength < len)
        len = (int) _contentLength;

      var buff = new byte[len];

      while (true) {
        try {
          var ares = input.BeginRead (buff, 0, len, null, null);

          if (!ares.IsCompleted) {
            var timeout = 100;

            if (!ares.AsyncWaitHandle.WaitOne (timeout))
              return false;
          }

          if (input.EndRead (ares) <= 0)
            return true;
        }
        catch {
          return false;
        }
      }
    }

    internal bool IsUpgradeRequest (string protocol)
    {
      return _headers.Upgrades (protocol);
    }

    internal void SetRequestLine (string requestLine)
    {
      var parts = requestLine.Split (new[] { ' ' }, 3);

      if (parts.Length < 3) {
        _context.ErrorMessage = "Invalid request line (parts)";

        return;
      }

      var method = parts[0];

      if (method.Length == 0) {
        _context.ErrorMessage = "Invalid request line (method)";

        return;
      }

      if (!method.IsHttpMethod ()) {
        _context.ErrorStatusCode = 501;
        _context.ErrorMessage = "Invalid request line (method)";

        return;
      }

      var target = parts[1];

      if (target.Length == 0) {
        _context.ErrorMessage = "Invalid request line (target)";

        return;
      }

      var rawVer = parts[2];

      if (rawVer.Length != 8) {
        _context.ErrorMessage = "Invalid request line (version)";

        return;
      }

      if (!rawVer.StartsWith ("HTTP/", StringComparison.Ordinal)) {
        _context.ErrorMessage = "Invalid request line (version)";

        return;
      }

      Version ver;

      if (!rawVer.Substring (5).TryCreateVersion (out ver)) {
        _context.ErrorMessage = "Invalid request line (version)";

        return;
      }

      if (ver != HttpVersion.Version11) {
        _context.ErrorStatusCode = 505;
        _context.ErrorMessage = "Invalid request line (version)";

        return;
      }

      _httpMethod = method;
      _rawUrl = target;
      _protocolVersion = ver;
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Begins getting the certificate provided by the client asynchronously.
    /// </summary>
    /// <returns>
    /// An <see cref="IAsyncResult"/> instance that indicates the status of
    /// the operation.
    /// </returns>
    /// <param name="requestCallback">
    /// An <see cref="AsyncCallback"/> delegate that invokes the method called
    /// when the operation is complete.
    /// </param>
    /// <param name="state">
    /// An <see cref="object"/> that specifies a user defined object to pass
    /// to the callback delegate.
    /// </param>
    /// <exception cref="NotSupportedException">
    /// This method is not supported.
    /// </exception>
    public IAsyncResult BeginGetClientCertificate (
      AsyncCallback requestCallback, object state
    )
    {
      throw new NotSupportedException ();
    }

    /// <summary>
    /// Ends an asynchronous operation to get the certificate provided by
    /// the client.
    /// </summary>
    /// <returns>
    /// A <see cref="X509Certificate2"/> that represents an X.509 certificate
    /// provided by the client.
    /// </returns>
    /// <param name="asyncResult">
    /// An <see cref="IAsyncResult"/> instance returned when the operation
    /// started.
    /// </param>
    /// <exception cref="NotSupportedException">
    /// This method is not supported.
    /// </exception>
    public X509Certificate2 EndGetClientCertificate (IAsyncResult asyncResult)
    {
      throw new NotSupportedException ();
    }

    /// <summary>
    /// Gets the certificate provided by the client.
    /// </summary>
    /// <returns>
    /// A <see cref="X509Certificate2"/> that represents an X.509 certificate
    /// provided by the client.
    /// </returns>
    /// <exception cref="NotSupportedException">
    /// This method is not supported.
    /// </exception>
    public X509Certificate2 GetClientCertificate ()
    {
      throw new NotSupportedException ();
    }

    /// <summary>
    /// Returns a string that represents the current instance.
    /// </summary>
    /// <returns>
    /// A <see cref="string"/> that contains the request line and headers
    /// included in the request.
    /// </returns>
    public override string ToString ()
    {
      var buff = new StringBuilder (64);

      var fmt = "{0} {1} HTTP/{2}\r\n";
      var headers = _headers.ToString ();

      buff
      .AppendFormat (fmt, _httpMethod, _rawUrl, _protocolVersion)
      .Append (headers);

      return buff.ToString ();
    }

    #endregion
  }
}
