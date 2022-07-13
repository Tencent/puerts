#region License
/*
 * WebSocketServiceHost.cs
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

#region Contributors
/*
 * Contributors:
 * - Juan Manuel Lallana <juan.manuel.lallana@gmail.com>
 */
#endregion

using System;
using WebSocketSharp.Net.WebSockets;

namespace WebSocketSharp.Server
{
  /// <summary>
  /// Exposes the methods and properties used to access the information in
  /// a WebSocket service provided by the <see cref="WebSocketServer"/> or
  /// <see cref="HttpServer"/> class.
  /// </summary>
  /// <remarks>
  /// This class is an abstract class.
  /// </remarks>
  public abstract class WebSocketServiceHost
  {
    #region Private Fields

    private Logger                  _log;
    private string                  _path;
    private WebSocketSessionManager _sessions;

    #endregion

    #region Protected Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="WebSocketServiceHost"/>
    /// class with the specified path and logging function.
    /// </summary>
    /// <param name="path">
    /// A <see cref="string"/> that specifies the absolute path to
    /// the service.
    /// </param>
    /// <param name="log">
    /// A <see cref="Logger"/> that specifies the logging function for
    /// the service.
    /// </param>
    protected WebSocketServiceHost (string path, Logger log)
    {
      _path = path;
      _log = log;

      _sessions = new WebSocketSessionManager (log);
    }

    #endregion

    #region Internal Properties

    internal ServerState State {
      get {
        return _sessions.State;
      }
    }

    #endregion

    #region Protected Properties

    /// <summary>
    /// Gets the logging function for the service.
    /// </summary>
    /// <value>
    /// A <see cref="Logger"/> that provides the logging function.
    /// </value>
    protected Logger Log {
      get {
        return _log;
      }
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets or sets a value indicating whether the service cleans up the
    /// inactive sessions periodically.
    /// </summary>
    /// <remarks>
    /// The set operation does nothing if the service has already started or
    /// it is shutting down.
    /// </remarks>
    /// <value>
    /// <c>true</c> if the service cleans up the inactive sessions every
    /// 60 seconds; otherwise, <c>false</c>.
    /// </value>
    public bool KeepClean {
      get {
        return _sessions.KeepClean;
      }

      set {
        _sessions.KeepClean = value;
      }
    }

    /// <summary>
    /// Gets the path to the service.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the absolute path to
    /// the service.
    /// </value>
    public string Path {
      get {
        return _path;
      }
    }

    /// <summary>
    /// Gets the management function for the sessions in the service.
    /// </summary>
    /// <value>
    /// A <see cref="WebSocketSessionManager"/> that manages the sessions in
    /// the service.
    /// </value>
    public WebSocketSessionManager Sessions {
      get {
        return _sessions;
      }
    }

    /// <summary>
    /// Gets the type of the behavior of the service.
    /// </summary>
    /// <value>
    /// A <see cref="Type"/> that represents the type of the behavior of
    /// the service.
    /// </value>
    public abstract Type BehaviorType { get; }

    /// <summary>
    /// Gets or sets the time to wait for the response to the WebSocket Ping
    /// or Close.
    /// </summary>
    /// <remarks>
    /// The set operation does nothing if the service has already started or
    /// it is shutting down.
    /// </remarks>
    /// <value>
    /// A <see cref="TimeSpan"/> to wait for the response.
    /// </value>
    /// <exception cref="ArgumentOutOfRangeException">
    /// The value specified for a set operation is zero or less.
    /// </exception>
    public TimeSpan WaitTime {
      get {
        return _sessions.WaitTime;
      }

      set {
        _sessions.WaitTime = value;
      }
    }

    #endregion

    #region Internal Methods

    internal void Start ()
    {
      _sessions.Start ();
    }

    internal void StartSession (WebSocketContext context)
    {
      CreateSession ().Start (context, _sessions);
    }

    internal void Stop (ushort code, string reason)
    {
      _sessions.Stop (code, reason);
    }

    #endregion

    #region Protected Methods

    /// <summary>
    /// Creates a new session for the service.
    /// </summary>
    /// <returns>
    /// A <see cref="WebSocketBehavior"/> instance that represents
    /// the new session.
    /// </returns>
    protected abstract WebSocketBehavior CreateSession ();

    #endregion
  }
}
