#region License
/*
 * HttpListenerWebSocketContext.cs
 *
 * The MIT License
 *
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

using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Security.Principal;

namespace WebSocketSharp.Net.WebSockets
{
  /// <summary>
  /// Provides the access to the information in a WebSocket handshake request
  /// to a <see cref="HttpListener"/> instance.
  /// </summary>
  public class HttpListenerWebSocketContext : WebSocketContext
  {
    #region Private Fields

    private HttpListenerContext _context;
    private WebSocket           _websocket;

    #endregion

    #region Internal Constructors

    internal HttpListenerWebSocketContext (
      HttpListenerContext context, string protocol
    )
    {
      _context = context;
      _websocket = new WebSocket (this, protocol);
    }

    #endregion

    #region Internal Properties

    internal Logger Log {
      get {
        return _context.Listener.Log;
      }
    }

    internal Stream Stream {
      get {
        return _context.Connection.Stream;
      }
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets the HTTP cookies included in the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="WebSocketSharp.Net.CookieCollection"/> that contains
    ///   the cookies.
    ///   </para>
    ///   <para>
    ///   An empty collection if not included.
    ///   </para>
    /// </value>
    public override CookieCollection CookieCollection {
      get {
        return _context.Request.Cookies;
      }
    }

    /// <summary>
    /// Gets the HTTP headers included in the handshake request.
    /// </summary>
    /// <value>
    /// A <see cref="NameValueCollection"/> that contains the headers.
    /// </value>
    public override NameValueCollection Headers {
      get {
        return _context.Request.Headers;
      }
    }

    /// <summary>
    /// Gets the value of the Host header included in the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the server host name requested
    ///   by the client.
    ///   </para>
    ///   <para>
    ///   It includes the port number if provided.
    ///   </para>
    /// </value>
    public override string Host {
      get {
        return _context.Request.UserHostName;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the client is authenticated.
    /// </summary>
    /// <value>
    /// <c>true</c> if the client is authenticated; otherwise, <c>false</c>.
    /// </value>
    public override bool IsAuthenticated {
      get {
        return _context.Request.IsAuthenticated;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the handshake request is sent from
    /// the local computer.
    /// </summary>
    /// <value>
    /// <c>true</c> if the handshake request is sent from the same computer
    /// as the server; otherwise, <c>false</c>.
    /// </value>
    public override bool IsLocal {
      get {
        return _context.Request.IsLocal;
      }
    }

    /// <summary>
    /// Gets a value indicating whether a secure connection is used to send
    /// the handshake request.
    /// </summary>
    /// <value>
    /// <c>true</c> if the connection is secure; otherwise, <c>false</c>.
    /// </value>
    public override bool IsSecureConnection {
      get {
        return _context.Request.IsSecureConnection;
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
    public override bool IsWebSocketRequest {
      get {
        return _context.Request.IsWebSocketRequest;
      }
    }

    /// <summary>
    /// Gets the value of the Origin header included in the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the value of the Origin header.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if not included.
    ///   </para>
    /// </value>
    public override string Origin {
      get {
        return _context.Request.Headers["Origin"];
      }
    }

    /// <summary>
    /// Gets the query string included in the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="NameValueCollection"/> that contains the query
    ///   parameters.
    ///   </para>
    ///   <para>
    ///   An empty collection if not included.
    ///   </para>
    /// </value>
    public override NameValueCollection QueryString {
      get {
        return _context.Request.QueryString;
      }
    }

    /// <summary>
    /// Gets the URI requested by the client.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="Uri"/> that represents the URI parsed from the request.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the URI cannot be parsed.
    ///   </para>
    /// </value>
    public override Uri RequestUri {
      get {
        return _context.Request.Url;
      }
    }

    /// <summary>
    /// Gets the value of the Sec-WebSocket-Key header included in
    /// the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the value of
    ///   the Sec-WebSocket-Key header.
    ///   </para>
    ///   <para>
    ///   The value is used to prove that the server received
    ///   a valid WebSocket handshake request.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if not included.
    ///   </para>
    /// </value>
    public override string SecWebSocketKey {
      get {
        return _context.Request.Headers["Sec-WebSocket-Key"];
      }
    }

    /// <summary>
    /// Gets the names of the subprotocols from the Sec-WebSocket-Protocol
    /// header included in the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   An <see cref="T:System.Collections.Generic.IEnumerable{string}"/>
    ///   instance.
    ///   </para>
    ///   <para>
    ///   It provides an enumerator which supports the iteration over
    ///   the collection of the names of the subprotocols.
    ///   </para>
    /// </value>
    public override IEnumerable<string> SecWebSocketProtocols {
      get {
        var val = _context.Request.Headers["Sec-WebSocket-Protocol"];

        if (val == null || val.Length == 0)
          yield break;

        foreach (var elm in val.Split (',')) {
          var protocol = elm.Trim ();

          if (protocol.Length == 0)
            continue;

          yield return protocol;
        }
      }
    }

    /// <summary>
    /// Gets the value of the Sec-WebSocket-Version header included in
    /// the handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the WebSocket protocol
    ///   version specified by the client.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if not included.
    ///   </para>
    /// </value>
    public override string SecWebSocketVersion {
      get {
        return _context.Request.Headers["Sec-WebSocket-Version"];
      }
    }

    /// <summary>
    /// Gets the endpoint to which the handshake request is sent.
    /// </summary>
    /// <value>
    /// A <see cref="System.Net.IPEndPoint"/> that represents the server
    /// IP address and port number.
    /// </value>
    public override System.Net.IPEndPoint ServerEndPoint {
      get {
        return _context.Request.LocalEndPoint;
      }
    }

    /// <summary>
    /// Gets the client information.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="IPrincipal"/> instance that represents identity,
    ///   authentication, and security roles for the client.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the client is not authenticated.
    ///   </para>
    /// </value>
    public override IPrincipal User {
      get {
        return _context.User;
      }
    }

    /// <summary>
    /// Gets the endpoint from which the handshake request is sent.
    /// </summary>
    /// <value>
    /// A <see cref="System.Net.IPEndPoint"/> that represents the client
    /// IP address and port number.
    /// </value>
    public override System.Net.IPEndPoint UserEndPoint {
      get {
        return _context.Request.RemoteEndPoint;
      }
    }

    /// <summary>
    /// Gets the WebSocket instance used for two-way communication between
    /// the client and server.
    /// </summary>
    /// <value>
    /// A <see cref="WebSocketSharp.WebSocket"/>.
    /// </value>
    public override WebSocket WebSocket {
      get {
        return _websocket;
      }
    }

    #endregion

    #region Internal Methods

    internal void Close ()
    {
      _context.Connection.Close (true);
    }

    internal void Close (HttpStatusCode code)
    {
      _context.Response.StatusCode = (int) code;
      _context.Response.Close ();
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Returns a string that represents the current instance.
    /// </summary>
    /// <returns>
    /// A <see cref="string"/> that contains the request line and headers
    /// included in the handshake request.
    /// </returns>
    public override string ToString ()
    {
      return _context.Request.ToString ();
    }

    #endregion
  }
}
