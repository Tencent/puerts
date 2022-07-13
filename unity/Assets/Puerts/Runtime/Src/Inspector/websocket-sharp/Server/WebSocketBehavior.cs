#region License
/*
 * WebSocketBehavior.cs
 *
 * The MIT License
 *
 * Copyright (c) 2012-2021 sta.blockhead
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
using System.Collections.Specialized;
using System.IO;
using WebSocketSharp.Net;
using WebSocketSharp.Net.WebSockets;

namespace WebSocketSharp.Server
{
  /// <summary>
  /// Exposes a set of methods and properties used to define the behavior of
  /// a WebSocket service provided by the <see cref="WebSocketServer"/> or
  /// <see cref="HttpServer"/> class.
  /// </summary>
  /// <remarks>
  /// This class is an abstract class.
  /// </remarks>
  public abstract class WebSocketBehavior : IWebSocketSession
  {
    #region Private Fields

    private WebSocketContext                               _context;
    private Func<CookieCollection, CookieCollection, bool> _cookiesValidator;
    private bool                                           _emitOnPing;
    private string                                         _id;
    private bool                                           _ignoreExtensions;
    private Func<string, bool>                             _originValidator;
    private string                                         _protocol;
    private WebSocketSessionManager                        _sessions;
    private DateTime                                       _startTime;
    private WebSocket                                      _websocket;

    #endregion

    #region Protected Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="WebSocketBehavior"/> class.
    /// </summary>
    protected WebSocketBehavior ()
    {
      _startTime = DateTime.MaxValue;
    }

    #endregion

    #region Protected Properties

    /// <summary>
    /// Gets the HTTP headers included in a WebSocket handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="NameValueCollection"/> that contains the headers.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the session has not started yet.
    ///   </para>
    /// </value>
    protected NameValueCollection Headers {
      get {
        return _context != null ? _context.Headers : null;
      }
    }

    /// <summary>
    /// Gets the query string included in a WebSocket handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="NameValueCollection"/> that contains the query
    ///   parameters.
    ///   </para>
    ///   <para>
    ///   An empty collection if not included.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the session has not started yet.
    ///   </para>
    /// </value>
    protected NameValueCollection QueryString {
      get {
        return _context != null ? _context.QueryString : null;
      }
    }

    /// <summary>
    /// Gets the management function for the sessions in the service.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="WebSocketSessionManager"/> that manages the sessions in
    ///   the service.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the session has not started yet.
    ///   </para>
    /// </value>
    protected WebSocketSessionManager Sessions {
      get {
        return _sessions;
      }
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets the current state of the WebSocket connection for a session.
    /// </summary>
    /// <value>
    ///   <para>
    ///   One of the <see cref="WebSocketState"/> enum values.
    ///   </para>
    ///   <para>
    ///   It indicates the current state of the connection.
    ///   </para>
    ///   <para>
    ///   <see cref="WebSocketState.Connecting"/> if the session has not
    ///   started yet.
    ///   </para>
    /// </value>
    public WebSocketState ConnectionState {
      get {
        return _websocket != null
               ? _websocket.ReadyState
               : WebSocketState.Connecting;
      }
    }

    /// <summary>
    /// Gets the information in a WebSocket handshake request to the service.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="WebSocketContext"/> instance that provides the access to
    ///   the information in the handshake request.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the session has not started yet.
    ///   </para>
    /// </value>
    public WebSocketContext Context {
      get {
        return _context;
      }
    }

    /// <summary>
    /// Gets or sets the delegate used to validate the HTTP cookies included in
    /// a WebSocket handshake request to the service.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <c>Func&lt;CookieCollection, CookieCollection, bool&gt;</c> delegate
    ///   or <see langword="null"/> if not needed.
    ///   </para>
    ///   <para>
    ///   The delegate invokes the method called when the WebSocket instance
    ///   for a session validates the handshake request.
    ///   </para>
    ///   <para>
    ///   1st <see cref="CookieCollection"/> parameter passed to the method
    ///   contains the cookies to validate if present.
    ///   </para>
    ///   <para>
    ///   2nd <see cref="CookieCollection"/> parameter passed to the method
    ///   receives the cookies to send to the client.
    ///   </para>
    ///   <para>
    ///   The method must return <c>true</c> if the cookies are valid.
    ///   </para>
    ///   <para>
    ///   The default value is <see langword="null"/>.
    ///   </para>
    /// </value>
    public Func<CookieCollection, CookieCollection, bool> CookiesValidator {
      get {
        return _cookiesValidator;
      }

      set {
        _cookiesValidator = value;
      }
    }

    /// <summary>
    /// Gets or sets a value indicating whether the WebSocket instance for
    /// a session emits the message event when receives a ping.
    /// </summary>
    /// <value>
    ///   <para>
    ///   <c>true</c> if the WebSocket instance emits the message event
    ///   when receives a ping; otherwise, <c>false</c>.
    ///   </para>
    ///   <para>
    ///   The default value is <c>false</c>.
    ///   </para>
    /// </value>
    public bool EmitOnPing {
      get {
        return _websocket != null ? _websocket.EmitOnPing : _emitOnPing;
      }

      set {
        if (_websocket != null) {
          _websocket.EmitOnPing = value;

          return;
        }

        _emitOnPing = value;
      }
    }

    /// <summary>
    /// Gets the unique ID of a session.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the unique ID of the session.
    ///   </para>
    ///   <para>
    ///   <see langword="null"/> if the session has not started yet.
    ///   </para>
    /// </value>
    public string ID {
      get {
        return _id;
      }
    }

    /// <summary>
    /// Gets or sets a value indicating whether the service ignores
    /// the Sec-WebSocket-Extensions header included in a WebSocket
    /// handshake request.
    /// </summary>
    /// <value>
    ///   <para>
    ///   <c>true</c> if the service ignores the extensions requested
    ///   from a client; otherwise, <c>false</c>.
    ///   </para>
    ///   <para>
    ///   The default value is <c>false</c>.
    ///   </para>
    /// </value>
    public bool IgnoreExtensions {
      get {
        return _ignoreExtensions;
      }

      set {
        _ignoreExtensions = value;
      }
    }

    /// <summary>
    /// Gets or sets the delegate used to validate the Origin header included in
    /// a WebSocket handshake request to the service.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <c>Func&lt;string, bool&gt;</c> delegate or <see langword="null"/>
    ///   if not needed.
    ///   </para>
    ///   <para>
    ///   The delegate invokes the method called when the WebSocket instance
    ///   for a session validates the handshake request.
    ///   </para>
    ///   <para>
    ///   The <see cref="string"/> parameter passed to the method is the value
    ///   of the Origin header or <see langword="null"/> if the header is not
    ///   present.
    ///   </para>
    ///   <para>
    ///   The method must return <c>true</c> if the header value is valid.
    ///   </para>
    ///   <para>
    ///   The default value is <see langword="null"/>.
    ///   </para>
    /// </value>
    public Func<string, bool> OriginValidator {
      get {
        return _originValidator;
      }

      set {
        _originValidator = value;
      }
    }

    /// <summary>
    /// Gets or sets the name of the WebSocket subprotocol for the service.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="string"/> that represents the name of the subprotocol.
    ///   </para>
    ///   <para>
    ///   The value specified for a set must be a token defined in
    ///   <see href="http://tools.ietf.org/html/rfc2616#section-2.2">
    ///   RFC 2616</see>.
    ///   </para>
    ///   <para>
    ///   The default value is an empty string.
    ///   </para>
    /// </value>
    /// <exception cref="InvalidOperationException">
    /// The set operation is not available if the session has already started.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// The value specified for a set operation is not a token.
    /// </exception>
    public string Protocol {
      get {
        return _websocket != null
               ? _websocket.Protocol
               : (_protocol ?? String.Empty);
      }

      set {
        if (_websocket != null) {
          var msg = "The session has already started.";

          throw new InvalidOperationException (msg);
        }

        if (value == null || value.Length == 0) {
          _protocol = null;

          return;
        }

        if (!value.IsToken ()) {
          var msg = "It is not a token.";

          throw new ArgumentException (msg, "value");
        }

        _protocol = value;
      }
    }

    /// <summary>
    /// Gets the time that a session has started.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="DateTime"/> that represents the time that the session
    ///   has started.
    ///   </para>
    ///   <para>
    ///   <see cref="DateTime.MaxValue"/> if the session has not started yet.
    ///   </para>
    /// </value>
    public DateTime StartTime {
      get {
        return _startTime;
      }
    }

    #endregion

    #region Private Methods

    private string checkHandshakeRequest (WebSocketContext context)
    {
      if (_originValidator != null) {
        if (!_originValidator (context.Origin))
          return "It includes no Origin header or an invalid one.";
      }

      if (_cookiesValidator != null) {
        var req = context.CookieCollection;
        var res = context.WebSocket.CookieCollection;

        if (!_cookiesValidator (req, res))
          return "It includes no cookie or an invalid one.";
      }

      return null;
    }

    private void onClose (object sender, CloseEventArgs e)
    {
      if (_id == null)
        return;

      _sessions.Remove (_id);

      OnClose (e);
    }

    private void onError (object sender, ErrorEventArgs e)
    {
      OnError (e);
    }

    private void onMessage (object sender, MessageEventArgs e)
    {
      OnMessage (e);
    }

    private void onOpen (object sender, EventArgs e)
    {
      _id = _sessions.Add (this);

      if (_id == null) {
        _websocket.Close (CloseStatusCode.Away);

        return;
      }

      _startTime = DateTime.Now;

      OnOpen ();
    }

    #endregion

    #region Internal Methods

    internal void Start (
      WebSocketContext context, WebSocketSessionManager sessions
    )
    {
      _context = context;
      _sessions = sessions;

      _websocket = context.WebSocket;
      _websocket.CustomHandshakeRequestChecker = checkHandshakeRequest;
      _websocket.EmitOnPing = _emitOnPing;
      _websocket.IgnoreExtensions = _ignoreExtensions;
      _websocket.Protocol = _protocol;

      var waitTime = sessions.WaitTime;

      if (waitTime != _websocket.WaitTime)
        _websocket.WaitTime = waitTime;

      _websocket.OnOpen += onOpen;
      _websocket.OnMessage += onMessage;
      _websocket.OnError += onError;
      _websocket.OnClose += onClose;

      _websocket.InternalAccept ();
    }

    #endregion

    #region Protected Methods

    /// <summary>
    /// Closes the WebSocket connection for a session.
    /// </summary>
    /// <remarks>
    /// This method does nothing if the current state of the connection is
    /// Closing or Closed.
    /// </remarks>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    protected void Close ()
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Close ();
    }

    /// <summary>
    /// Closes the WebSocket connection for a session with the specified
    /// code and reason.
    /// </summary>
    /// <remarks>
    /// This method does nothing if the current state of the connection is
    /// Closing or Closed.
    /// </remarks>
    /// <param name="code">
    ///   <para>
    ///   A <see cref="ushort"/> that specifies the status code indicating
    ///   the reason for the close.
    ///   </para>
    ///   <para>
    ///   The status codes are defined in
    ///   <see href="http://tools.ietf.org/html/rfc6455#section-7.4">
    ///   Section 7.4</see> of RFC 6455.
    ///   </para>
    /// </param>
    /// <param name="reason">
    ///   <para>
    ///   A <see cref="string"/> that specifies the reason for the close.
    ///   </para>
    ///   <para>
    ///   The size must be 123 bytes or less in UTF-8.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    ///   <para>
    ///   <paramref name="code"/> is less than 1000 or greater than 4999.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   The size of <paramref name="reason"/> is greater than 123 bytes.
    ///   </para>
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   <paramref name="code"/> is 1010 (mandatory extension).
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="code"/> is 1005 (no status) and there is reason.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="reason"/> could not be UTF-8-encoded.
    ///   </para>
    /// </exception>
    protected void Close (ushort code, string reason)
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Close (code, reason);
    }

    /// <summary>
    /// Closes the WebSocket connection for a session with the specified
    /// code and reason.
    /// </summary>
    /// <remarks>
    /// This method does nothing if the current state of the connection is
    /// Closing or Closed.
    /// </remarks>
    /// <param name="code">
    ///   <para>
    ///   One of the <see cref="CloseStatusCode"/> enum values.
    ///   </para>
    ///   <para>
    ///   It specifies the status code indicating the reason for the close.
    ///   </para>
    /// </param>
    /// <param name="reason">
    ///   <para>
    ///   A <see cref="string"/> that specifies the reason for the close.
    ///   </para>
    ///   <para>
    ///   The size must be 123 bytes or less in UTF-8.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    /// The size of <paramref name="reason"/> is greater than 123 bytes.
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   <paramref name="code"/> is
    ///   <see cref="CloseStatusCode.MandatoryExtension"/>.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="code"/> is
    ///   <see cref="CloseStatusCode.NoStatus"/> and there is reason.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="reason"/> could not be UTF-8-encoded.
    ///   </para>
    /// </exception>
    protected void Close (CloseStatusCode code, string reason)
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Close (code, reason);
    }

    /// <summary>
    /// Closes the WebSocket connection for a session asynchronously.
    /// </summary>
    /// <remarks>
    ///   <para>
    ///   This method does not wait for the close to be complete.
    ///   </para>
    ///   <para>
    ///   This method does nothing if the current state of the connection is
    ///   Closing or Closed.
    ///   </para>
    /// </remarks>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    protected void CloseAsync ()
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      _websocket.CloseAsync ();
    }

    /// <summary>
    /// Closes the WebSocket connection for a session asynchronously with
    /// the specified code and reason.
    /// </summary>
    /// <remarks>
    ///   <para>
    ///   This method does not wait for the close to be complete.
    ///   </para>
    ///   <para>
    ///   This method does nothing if the current state of the connection is
    ///   Closing or Closed.
    ///   </para>
    /// </remarks>
    /// <param name="code">
    ///   <para>
    ///   A <see cref="ushort"/> that specifies the status code indicating
    ///   the reason for the close.
    ///   </para>
    ///   <para>
    ///   The status codes are defined in
    ///   <see href="http://tools.ietf.org/html/rfc6455#section-7.4">
    ///   Section 7.4</see> of RFC 6455.
    ///   </para>
    /// </param>
    /// <param name="reason">
    ///   <para>
    ///   A <see cref="string"/> that specifies the reason for the close.
    ///   </para>
    ///   <para>
    ///   The size must be 123 bytes or less in UTF-8.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    ///   <para>
    ///   <paramref name="code"/> is less than 1000 or greater than 4999.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   The size of <paramref name="reason"/> is greater than 123 bytes.
    ///   </para>
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   <paramref name="code"/> is 1010 (mandatory extension).
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="code"/> is 1005 (no status) and there is reason.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="reason"/> could not be UTF-8-encoded.
    ///   </para>
    /// </exception>
    protected void CloseAsync (ushort code, string reason)
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      _websocket.CloseAsync (code, reason);
    }

    /// <summary>
    /// Closes the WebSocket connection for a session asynchronously with
    /// the specified code and reason.
    /// </summary>
    /// <remarks>
    ///   <para>
    ///   This method does not wait for the close to be complete.
    ///   </para>
    ///   <para>
    ///   This method does nothing if the current state of the connection is
    ///   Closing or Closed.
    ///   </para>
    /// </remarks>
    /// <param name="code">
    ///   <para>
    ///   One of the <see cref="CloseStatusCode"/> enum values.
    ///   </para>
    ///   <para>
    ///   It specifies the status code indicating the reason for the close.
    ///   </para>
    /// </param>
    /// <param name="reason">
    ///   <para>
    ///   A <see cref="string"/> that specifies the reason for the close.
    ///   </para>
    ///   <para>
    ///   The size must be 123 bytes or less in UTF-8.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   <paramref name="code"/> is
    ///   <see cref="CloseStatusCode.MandatoryExtension"/>.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="code"/> is
    ///   <see cref="CloseStatusCode.NoStatus"/> and there is reason.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="reason"/> could not be UTF-8-encoded.
    ///   </para>
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    /// The size of <paramref name="reason"/> is greater than 123 bytes.
    /// </exception>
    protected void CloseAsync (CloseStatusCode code, string reason)
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      _websocket.CloseAsync (code, reason);
    }

    /// <summary>
    /// Called when the WebSocket connection for a session has been closed.
    /// </summary>
    /// <param name="e">
    /// A <see cref="CloseEventArgs"/> that represents the event data passed
    /// from a <see cref="WebSocket.OnClose"/> event.
    /// </param>
    protected virtual void OnClose (CloseEventArgs e)
    {
    }

    /// <summary>
    /// Called when the WebSocket instance for a session gets an error.
    /// </summary>
    /// <param name="e">
    /// A <see cref="ErrorEventArgs"/> that represents the event data passed
    /// from a <see cref="WebSocket.OnError"/> event.
    /// </param>
    protected virtual void OnError (ErrorEventArgs e)
    {
    }

    /// <summary>
    /// Called when the WebSocket instance for a session receives a message.
    /// </summary>
    /// <param name="e">
    /// A <see cref="MessageEventArgs"/> that represents the event data passed
    /// from a <see cref="WebSocket.OnMessage"/> event.
    /// </param>
    protected virtual void OnMessage (MessageEventArgs e)
    {
    }

    /// <summary>
    /// Called when the WebSocket connection for a session has been established.
    /// </summary>
    protected virtual void OnOpen ()
    {
    }

    /// <summary>
    /// Sends a ping to a client using the WebSocket connection.
    /// </summary>
    /// <returns>
    /// <c>true</c> if the send has done with no error and a pong has been
    /// received within a time; otherwise, <c>false</c>.
    /// </returns>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    protected bool Ping ()
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      return _websocket.Ping ();
    }

    /// <summary>
    /// Sends a ping with the specified message to a client using
    /// the WebSocket connection.
    /// </summary>
    /// <returns>
    /// <c>true</c> if the send has done with no error and a pong has been
    /// received within a time; otherwise, <c>false</c>.
    /// </returns>
    /// <param name="message">
    ///   <para>
    ///   A <see cref="string"/> that specifies the message to send.
    ///   </para>
    ///   <para>
    ///   The size must be 125 bytes or less in UTF-8.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The session has not started yet.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="message"/> could not be UTF-8-encoded.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    /// The size of <paramref name="message"/> is greater than 125 bytes.
    /// </exception>
    protected bool Ping (string message)
    {
      if (_websocket == null) {
        var msg = "The session has not started yet.";

        throw new InvalidOperationException (msg);
      }

      return _websocket.Ping (message);
    }

    /// <summary>
    /// Sends the specified data to a client using the WebSocket connection.
    /// </summary>
    /// <param name="data">
    /// An array of <see cref="byte"/> that specifies the binary data to send.
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="data"/> is <see langword="null"/>.
    /// </exception>
    protected void Send (byte[] data)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Send (data);
    }

    /// <summary>
    /// Sends the specified file to a client using the WebSocket connection.
    /// </summary>
    /// <param name="fileInfo">
    ///   <para>
    ///   A <see cref="FileInfo"/> that specifies the file to send.
    ///   </para>
    ///   <para>
    ///   The file is sent as the binary data.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="fileInfo"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   The file does not exist.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   The file could not be opened.
    ///   </para>
    /// </exception>
    protected void Send (FileInfo fileInfo)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Send (fileInfo);
    }

    /// <summary>
    /// Sends the specified data to a client using the WebSocket connection.
    /// </summary>
    /// <param name="data">
    /// A <see cref="string"/> that specifies the text data to send.
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="data"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="data"/> could not be UTF-8-encoded.
    /// </exception>
    protected void Send (string data)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Send (data);
    }

    /// <summary>
    /// Sends the data from the specified stream instance to a client using
    /// the WebSocket connection.
    /// </summary>
    /// <param name="stream">
    ///   <para>
    ///   A <see cref="Stream"/> instance from which to read the data to send.
    ///   </para>
    ///   <para>
    ///   The data is sent as the binary data.
    ///   </para>
    /// </param>
    /// <param name="length">
    /// An <see cref="int"/> that specifies the number of bytes to send.
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="stream"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   <paramref name="stream"/> cannot be read.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="length"/> is less than 1.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   No data could be read from <paramref name="stream"/>.
    ///   </para>
    /// </exception>
    protected void Send (Stream stream, int length)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.Send (stream, length);
    }

    /// <summary>
    /// Sends the specified data to a client asynchronously using
    /// the WebSocket connection.
    /// </summary>
    /// <remarks>
    /// This method does not wait for the send to be complete.
    /// </remarks>
    /// <param name="data">
    /// An array of <see cref="byte"/> that specifies the binary data to send.
    /// </param>
    /// <param name="completed">
    ///   <para>
    ///   An <c>Action&lt;bool&gt;</c> delegate or <see langword="null"/>
    ///   if not needed.
    ///   </para>
    ///   <para>
    ///   The delegate invokes the method called when the send is complete.
    ///   </para>
    ///   <para>
    ///   <c>true</c> is passed to the method if the send has done with
    ///   no error; otherwise, <c>false</c>.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="data"/> is <see langword="null"/>.
    /// </exception>
    protected void SendAsync (byte[] data, Action<bool> completed)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.SendAsync (data, completed);
    }

    /// <summary>
    /// Sends the specified file to a client asynchronously using
    /// the WebSocket connection.
    /// </summary>
    /// <remarks>
    /// This method does not wait for the send to be complete.
    /// </remarks>
    /// <param name="fileInfo">
    ///   <para>
    ///   A <see cref="FileInfo"/> that specifies the file to send.
    ///   </para>
    ///   <para>
    ///   The file is sent as the binary data.
    ///   </para>
    /// </param>
    /// <param name="completed">
    ///   <para>
    ///   An <c>Action&lt;bool&gt;</c> delegate or <see langword="null"/>
    ///   if not needed.
    ///   </para>
    ///   <para>
    ///   The delegate invokes the method called when the send is complete.
    ///   </para>
    ///   <para>
    ///   <c>true</c> is passed to the method if the send has done with
    ///   no error; otherwise, <c>false</c>.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="fileInfo"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   The file does not exist.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   The file could not be opened.
    ///   </para>
    /// </exception>
    protected void SendAsync (FileInfo fileInfo, Action<bool> completed)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.SendAsync (fileInfo, completed);
    }

    /// <summary>
    /// Sends the specified data to a client asynchronously using
    /// the WebSocket connection.
    /// </summary>
    /// <remarks>
    /// This method does not wait for the send to be complete.
    /// </remarks>
    /// <param name="data">
    /// A <see cref="string"/> that specifies the text data to send.
    /// </param>
    /// <param name="completed">
    ///   <para>
    ///   An <c>Action&lt;bool&gt;</c> delegate or <see langword="null"/>
    ///   if not needed.
    ///   </para>
    ///   <para>
    ///   The delegate invokes the method called when the send is complete.
    ///   </para>
    ///   <para>
    ///   <c>true</c> is passed to the method if the send has done with
    ///   no error; otherwise, <c>false</c>.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="data"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="data"/> could not be UTF-8-encoded.
    /// </exception>
    protected void SendAsync (string data, Action<bool> completed)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.SendAsync (data, completed);
    }

    /// <summary>
    /// Sends the data from the specified stream instance to a client
    /// asynchronously using the WebSocket connection.
    /// </summary>
    /// <remarks>
    /// This method does not wait for the send to be complete.
    /// </remarks>
    /// <param name="stream">
    ///   <para>
    ///   A <see cref="Stream"/> instance from which to read the data to send.
    ///   </para>
    ///   <para>
    ///   The data is sent as the binary data.
    ///   </para>
    /// </param>
    /// <param name="length">
    /// An <see cref="int"/> that specifies the number of bytes to send.
    /// </param>
    /// <param name="completed">
    ///   <para>
    ///   An <c>Action&lt;bool&gt;</c> delegate or <see langword="null"/>
    ///   if not needed.
    ///   </para>
    ///   <para>
    ///   The delegate invokes the method called when the send is complete.
    ///   </para>
    ///   <para>
    ///   <c>true</c> is passed to the method if the send has done with
    ///   no error; otherwise, <c>false</c>.
    ///   </para>
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// The current state of the connection is not Open.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="stream"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    ///   <para>
    ///   <paramref name="stream"/> cannot be read.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   <paramref name="length"/> is less than 1.
    ///   </para>
    ///   <para>
    ///   -or-
    ///   </para>
    ///   <para>
    ///   No data could be read from <paramref name="stream"/>.
    ///   </para>
    /// </exception>
    protected void SendAsync (Stream stream, int length, Action<bool> completed)
    {
      if (_websocket == null) {
        var msg = "The current state of the connection is not Open.";

        throw new InvalidOperationException (msg);
      }

      _websocket.SendAsync (stream, length, completed);
    }

    #endregion
  }
}
