#region License
/*
 * HttpRequestHeader.cs
 *
 * This code is derived from HttpRequestHeader.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005 Novell, Inc. (http://www.novell.com)
 * Copyright (c) 2014-2020 sta.blockhead
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

namespace WebSocketSharp.Net
{
  /// <summary>
  /// Indicates the HTTP header that may be specified in a client request.
  /// </summary>
  /// <remarks>
  /// The headers of this enumeration are defined in
  /// <see href="http://tools.ietf.org/html/rfc2616#section-14">RFC 2616</see> or
  /// <see href="http://tools.ietf.org/html/rfc6455#section-11.3">RFC 6455</see>.
  /// </remarks>
  public enum HttpRequestHeader
  {
    /// <summary>
    /// Indicates the Cache-Control header.
    /// </summary>
    CacheControl,
    /// <summary>
    /// Indicates the Connection header.
    /// </summary>
    Connection,
    /// <summary>
    /// Indicates the Date header.
    /// </summary>
    Date,
    /// <summary>
    /// Indicates the Keep-Alive header.
    /// </summary>
    KeepAlive,
    /// <summary>
    /// Indicates the Pragma header.
    /// </summary>
    Pragma,
    /// <summary>
    /// Indicates the Trailer header.
    /// </summary>
    Trailer,
    /// <summary>
    /// Indicates the Transfer-Encoding header.
    /// </summary>
    TransferEncoding,
    /// <summary>
    /// Indicates the Upgrade header.
    /// </summary>
    Upgrade,
    /// <summary>
    /// Indicates the Via header.
    /// </summary>
    Via,
    /// <summary>
    /// Indicates the Warning header.
    /// </summary>
    Warning,
    /// <summary>
    /// Indicates the Allow header.
    /// </summary>
    Allow,
    /// <summary>
    /// Indicates the Content-Length header.
    /// </summary>
    ContentLength,
    /// <summary>
    /// Indicates the Content-Type header.
    /// </summary>
    ContentType,
    /// <summary>
    /// Indicates the Content-Encoding header.
    /// </summary>
    ContentEncoding,
    /// <summary>
    /// Indicates the Content-Language header.
    /// </summary>
    ContentLanguage,
    /// <summary>
    /// Indicates the Content-Location header.
    /// </summary>
    ContentLocation,
    /// <summary>
    /// Indicates the Content-MD5 header.
    /// </summary>
    ContentMd5,
    /// <summary>
    /// Indicates the Content-Range header.
    /// </summary>
    ContentRange,
    /// <summary>
    /// Indicates the Expires header.
    /// </summary>
    Expires,
    /// <summary>
    /// Indicates the Last-Modified header.
    /// </summary>
    LastModified,
    /// <summary>
    /// Indicates the Accept header.
    /// </summary>
    Accept,
    /// <summary>
    /// Indicates the Accept-Charset header.
    /// </summary>
    AcceptCharset,
    /// <summary>
    /// Indicates the Accept-Encoding header.
    /// </summary>
    AcceptEncoding,
    /// <summary>
    /// Indicates the Accept-Language header.
    /// </summary>
    AcceptLanguage,
    /// <summary>
    /// Indicates the Authorization header.
    /// </summary>
    Authorization,
    /// <summary>
    /// Indicates the Cookie header.
    /// </summary>
    Cookie,
    /// <summary>
    /// Indicates the Expect header.
    /// </summary>
    Expect,
    /// <summary>
    /// Indicates the From header.
    /// </summary>
    From,
    /// <summary>
    /// Indicates the Host header.
    /// </summary>
    Host,
    /// <summary>
    /// Indicates the If-Match header.
    /// </summary>
    IfMatch,
    /// <summary>
    /// Indicates the If-Modified-Since header.
    /// </summary>
    IfModifiedSince,
    /// <summary>
    /// Indicates the If-None-Match header.
    /// </summary>
    IfNoneMatch,
    /// <summary>
    /// Indicates the If-Range header.
    /// </summary>
    IfRange,
    /// <summary>
    /// Indicates the If-Unmodified-Since header.
    /// </summary>
    IfUnmodifiedSince,
    /// <summary>
    /// Indicates the Max-Forwards header.
    /// </summary>
    MaxForwards,
    /// <summary>
    /// Indicates the Proxy-Authorization header.
    /// </summary>
    ProxyAuthorization,
    /// <summary>
    /// Indicates the Referer header.
    /// </summary>
    Referer,
    /// <summary>
    /// Indicates the Range header.
    /// </summary>
    Range,
    /// <summary>
    /// Indicates the TE header.
    /// </summary>
    Te,
    /// <summary>
    /// Indicates the Translate header.
    /// </summary>
    Translate,
    /// <summary>
    /// Indicates the User-Agent header.
    /// </summary>
    UserAgent,
    /// <summary>
    /// Indicates the Sec-WebSocket-Key header.
    /// </summary>
    SecWebSocketKey,
    /// <summary>
    /// Indicates the Sec-WebSocket-Extensions header.
    /// </summary>
    SecWebSocketExtensions,
    /// <summary>
    /// Indicates the Sec-WebSocket-Protocol header.
    /// </summary>
    SecWebSocketProtocol,
    /// <summary>
    /// Indicates the Sec-WebSocket-Version header.
    /// </summary>
    SecWebSocketVersion
  }
}
