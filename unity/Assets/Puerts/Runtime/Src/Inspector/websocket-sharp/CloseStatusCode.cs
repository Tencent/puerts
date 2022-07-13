#region License
/*
 * CloseStatusCode.cs
 *
 * The MIT License
 *
 * Copyright (c) 2012-2016 sta.blockhead
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

using System;

namespace WebSocketSharp
{
  /// <summary>
  /// Indicates the status code for the WebSocket connection close.
  /// </summary>
  /// <remarks>
  ///   <para>
  ///   The values of this enumeration are defined in
  ///   <see href="http://tools.ietf.org/html/rfc6455#section-7.4">
  ///   Section 7.4</see> of RFC 6455.
  ///   </para>
  ///   <para>
  ///   "Reserved value" cannot be sent as a status code in
  ///   closing handshake by an endpoint.
  ///   </para>
  /// </remarks>
  public enum CloseStatusCode : ushort
  {
    /// <summary>
    /// Equivalent to close status 1000. Indicates normal close.
    /// </summary>
    Normal = 1000,
    /// <summary>
    /// Equivalent to close status 1001. Indicates that an endpoint is
    /// going away.
    /// </summary>
    Away = 1001,
    /// <summary>
    /// Equivalent to close status 1002. Indicates that an endpoint is
    /// terminating the connection due to a protocol error.
    /// </summary>
    ProtocolError = 1002,
    /// <summary>
    /// Equivalent to close status 1003. Indicates that an endpoint is
    /// terminating the connection because it has received a type of
    /// data that it cannot accept.
    /// </summary>
    UnsupportedData = 1003,
    /// <summary>
    /// Equivalent to close status 1004. Still undefined. A Reserved value.
    /// </summary>
    Undefined = 1004,
    /// <summary>
    /// Equivalent to close status 1005. Indicates that no status code was
    /// actually present. A Reserved value.
    /// </summary>
    NoStatus = 1005,
    /// <summary>
    /// Equivalent to close status 1006. Indicates that the connection was
    /// closed abnormally. A Reserved value.
    /// </summary>
    Abnormal = 1006,
    /// <summary>
    /// Equivalent to close status 1007. Indicates that an endpoint is
    /// terminating the connection because it has received a message that
    /// contains data that is not consistent with the type of the message.
    /// </summary>
    InvalidData = 1007,
    /// <summary>
    /// Equivalent to close status 1008. Indicates that an endpoint is
    /// terminating the connection because it has received a message that
    /// violates its policy.
    /// </summary>
    PolicyViolation = 1008,
    /// <summary>
    /// Equivalent to close status 1009. Indicates that an endpoint is
    /// terminating the connection because it has received a message that
    /// is too big to process.
    /// </summary>
    TooBig = 1009,
    /// <summary>
    /// Equivalent to close status 1010. Indicates that a client is
    /// terminating the connection because it has expected the server to
    /// negotiate one or more extension, but the server did not return
    /// them in the handshake response.
    /// </summary>
    MandatoryExtension = 1010,
    /// <summary>
    /// Equivalent to close status 1011. Indicates that a server is
    /// terminating the connection because it has encountered an unexpected
    /// condition that prevented it from fulfilling the request.
    /// </summary>
    ServerError = 1011,
    /// <summary>
    /// Equivalent to close status 1015. Indicates that the connection was
    /// closed due to a failure to perform a TLS handshake. A Reserved value.
    /// </summary>
    TlsHandshakeFailure = 1015
  }
}
