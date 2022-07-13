#region License
/*
 * HttpConnection.cs
 *
 * This code is derived from HttpConnection.cs (System.Net) of Mono
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

#region Contributors
/*
 * Contributors:
 * - Liryna <liryna.stark@gmail.com>
 * - Rohan Singh <rohan-singh@hotmail.com>
 */
#endregion

using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Security;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace WebSocketSharp.Net
{
  internal sealed class HttpConnection
  {
    #region Private Fields

    private int                   _attempts;
    private byte[]                _buffer;
    private static readonly int   _bufferLength;
    private HttpListenerContext   _context;
    private StringBuilder         _currentLine;
    private EndPointListener      _endPointListener;
    private InputState            _inputState;
    private RequestStream         _inputStream;
    private LineState             _lineState;
    private EndPoint              _localEndPoint;
    private static readonly int   _maxInputLength;
    private ResponseStream        _outputStream;
    private int                   _position;
    private EndPoint              _remoteEndPoint;
    private MemoryStream          _requestBuffer;
    private int                   _reuses;
    private bool                  _secure;
    private Socket                _socket;
    private Stream                _stream;
    private object                _sync;
    private int                   _timeout;
    private Dictionary<int, bool> _timeoutCanceled;
    private Timer                 _timer;

    #endregion

    #region Static Constructor

    static HttpConnection ()
    {
      _bufferLength = 8192;
      _maxInputLength = 32768;
    }

    #endregion

    #region Internal Constructors

    internal HttpConnection (Socket socket, EndPointListener listener)
    {
      _socket = socket;
      _endPointListener = listener;

      var netStream = new NetworkStream (socket, false);

      if (listener.IsSecure) {
        var sslConf = listener.SslConfiguration;
        var sslStream = new SslStream (
                          netStream,
                          false,
                          sslConf.ClientCertificateValidationCallback
                        );

        sslStream.AuthenticateAsServer (
          sslConf.ServerCertificate,
          sslConf.ClientCertificateRequired,
          sslConf.EnabledSslProtocols,
          sslConf.CheckCertificateRevocation
        );

        _secure = true;
        _stream = sslStream;
      }
      else {
        _stream = netStream;
      }

      _buffer = new byte[_bufferLength];
      _localEndPoint = socket.LocalEndPoint;
      _remoteEndPoint = socket.RemoteEndPoint;
      _sync = new object ();
      _timeoutCanceled = new Dictionary<int, bool> ();
      _timer = new Timer (onTimeout, this, Timeout.Infinite, Timeout.Infinite);

      // 90k ms for first request, 15k ms from then on.
      init (new MemoryStream (), 90000);
    }

    #endregion

    #region Public Properties

    public bool IsClosed {
      get {
        return _socket == null;
      }
    }

    public bool IsLocal {
      get {
        return ((IPEndPoint) _remoteEndPoint).Address.IsLocal ();
      }
    }

    public bool IsSecure {
      get {
        return _secure;
      }
    }

    public IPEndPoint LocalEndPoint {
      get {
        return (IPEndPoint) _localEndPoint;
      }
    }

    public IPEndPoint RemoteEndPoint {
      get {
        return (IPEndPoint) _remoteEndPoint;
      }
    }

    public int Reuses {
      get {
        return _reuses;
      }
    }

    public Stream Stream {
      get {
        return _stream;
      }
    }

    #endregion

    #region Private Methods

    private void close ()
    {
      lock (_sync) {
        if (_socket == null)
          return;

        disposeTimer ();
        disposeRequestBuffer ();
        disposeStream ();
        closeSocket ();
      }

      _context.Unregister ();
      _endPointListener.RemoveConnection (this);
    }

    private void closeSocket ()
    {
      try {
        _socket.Shutdown (SocketShutdown.Both);
      }
      catch {
      }

      _socket.Close ();

      _socket = null;
    }

    private static MemoryStream createRequestBuffer (
      RequestStream inputStream
    )
    {
      var ret = new MemoryStream ();

      if (inputStream is ChunkedRequestStream) {
        var crs = (ChunkedRequestStream) inputStream;

        if (crs.HasRemainingBuffer) {
          var buff = crs.RemainingBuffer;

          ret.Write (buff, 0, buff.Length);
        }

        return ret;
      }

      var cnt = inputStream.Count;

      if (cnt > 0)
        ret.Write (inputStream.InitialBuffer, inputStream.Offset, cnt);

      return ret;
    }

    private void disposeRequestBuffer ()
    {
      if (_requestBuffer == null)
        return;

      _requestBuffer.Dispose ();

      _requestBuffer = null;
    }

    private void disposeStream ()
    {
      if (_stream == null)
        return;

      _stream.Dispose ();

      _stream = null;
    }

    private void disposeTimer ()
    {
      if (_timer == null)
        return;

      try {
        _timer.Change (Timeout.Infinite, Timeout.Infinite);
      }
      catch {
      }

      _timer.Dispose ();

      _timer = null;
    }

    private void init (MemoryStream requestBuffer, int timeout)
    {
      _requestBuffer = requestBuffer;
      _timeout = timeout;

      _context = new HttpListenerContext (this);
      _currentLine = new StringBuilder (64);
      _inputState = InputState.RequestLine;
      _inputStream = null;
      _lineState = LineState.None;
      _outputStream = null;
      _position = 0;
    }

    private static void onRead (IAsyncResult asyncResult)
    {
      var conn = (HttpConnection) asyncResult.AsyncState;
      var current = conn._attempts;

      if (conn._socket == null)
        return;

      lock (conn._sync) {
        if (conn._socket == null)
          return;

        conn._timer.Change (Timeout.Infinite, Timeout.Infinite);
        conn._timeoutCanceled[current] = true;

        var nread = 0;

        try {
          nread = conn._stream.EndRead (asyncResult);
        }
        catch (Exception) {
          // TODO: Logging.

          conn.close ();

          return;
        }

        if (nread <= 0) {
          conn.close ();

          return;
        }

        conn._requestBuffer.Write (conn._buffer, 0, nread);

        if (conn.processRequestBuffer ())
          return;

        conn.BeginReadRequest ();
      }
    }

    private static void onTimeout (object state)
    {
      var conn = (HttpConnection) state;
      var current = conn._attempts;

      if (conn._socket == null)
        return;

      lock (conn._sync) {
        if (conn._socket == null)
          return;

        if (conn._timeoutCanceled[current])
          return;

        conn._context.SendError (408);
      }
    }

    private bool processInput (byte[] data, int length)
    {
      // This method returns a bool:
      // - true  Done processing
      // - false Need more input

      var req = _context.Request;

      try {
        while (true) {
          int nread;
          var line = readLineFrom (data, _position, length, out nread);

          _position += nread;

          if (line == null)
            break;

          if (line.Length == 0) {
            if (_inputState == InputState.RequestLine)
              continue;

            if (_position > _maxInputLength)
              _context.ErrorMessage = "Headers too long";

            return true;
          }

          if (_inputState == InputState.RequestLine) {
            req.SetRequestLine (line);

            _inputState = InputState.Headers;
          }
          else {
            req.AddHeader (line);
          }

          if (_context.HasErrorMessage)
            return true;
        }
      }
      catch (Exception) {
        // TODO: Logging.

        _context.ErrorMessage = "Processing failure";

        return true;
      }

      if (_position >= _maxInputLength) {
        _context.ErrorMessage = "Headers too long";

        return true;
      }

      return false;
    }

    private bool processRequestBuffer ()
    {
      // This method returns a bool:
      // - true  Done processing
      // - false Need more write

      var data = _requestBuffer.GetBuffer ();
      var len = (int) _requestBuffer.Length;

      if (!processInput (data, len))
        return false;

      var req = _context.Request;

      if (!_context.HasErrorMessage)
        req.FinishInitialization ();

      if (_context.HasErrorMessage) {
        _context.SendError ();

        return true;
      }

      var uri = req.Url;
      HttpListener httplsnr;

      if (!_endPointListener.TrySearchHttpListener (uri, out httplsnr)) {
        _context.SendError (404);

        return true;
      }

      httplsnr.RegisterContext (_context);

      return true;
    }

    private string readLineFrom (
      byte[] buffer, int offset, int length, out int nread
    )
    {
      nread = 0;

      for (var i = offset; i < length; i++) {
        nread++;

        var b = buffer[i];

        if (b == 13) {
          _lineState = LineState.Cr;

          continue;
        }

        if (b == 10) {
          _lineState = LineState.Lf;

          break;
        }

        _currentLine.Append ((char) b);
      }

      if (_lineState != LineState.Lf)
        return null;

      var ret = _currentLine.ToString ();

      _currentLine.Length = 0;
      _lineState = LineState.None;

      return ret;
    }

    private MemoryStream takeOverRequestBuffer ()
    {
      if (_inputStream != null)
        return createRequestBuffer (_inputStream);

      var ret = new MemoryStream ();

      var buff = _requestBuffer.GetBuffer ();
      var len = (int) _requestBuffer.Length;
      var cnt = len - _position;

      if (cnt > 0)
        ret.Write (buff, _position, cnt);

      disposeRequestBuffer ();

      return ret;
    }

    #endregion

    #region Internal Methods

    internal void BeginReadRequest ()
    {
      _attempts++;

      _timeoutCanceled.Add (_attempts, false);
      _timer.Change (_timeout, Timeout.Infinite);

      try {
        _stream.BeginRead (_buffer, 0, _bufferLength, onRead, this);
      }
      catch (Exception) {
        // TODO: Logging.

        close ();
      }
    }

    internal void Close (bool force)
    {
      if (_socket == null)
        return;

      lock (_sync) {
        if (_socket == null)
          return;

        if (force) {
          if (_outputStream != null)
            _outputStream.Close (true);

          close ();

          return;
        }

        GetResponseStream ().Close (false);

        if (_context.Response.CloseConnection) {
          close ();

          return;
        }

        if (!_context.Request.FlushInput ()) {
          close ();

          return;
        }

        _context.Unregister ();

        _reuses++;

        var buff = takeOverRequestBuffer ();
        var len = buff.Length;

        init (buff, 15000);

        if (len > 0) {
          if (processRequestBuffer ())
            return;
        }

        BeginReadRequest ();
      }
    }

    #endregion

    #region Public Methods

    public void Close ()
    {
      Close (false);
    }

    public RequestStream GetRequestStream (long contentLength, bool chunked)
    {
      lock (_sync) {
        if (_socket == null)
          return null;

        if (_inputStream != null)
          return _inputStream;

        var buff = _requestBuffer.GetBuffer ();
        var len = (int) _requestBuffer.Length;
        var cnt = len - _position;

        _inputStream = chunked
                       ? new ChunkedRequestStream (
                           _stream, buff, _position, cnt, _context
                         )
                       : new RequestStream (
                           _stream, buff, _position, cnt, contentLength
                         );

        disposeRequestBuffer ();

        return _inputStream;
      }
    }

    public ResponseStream GetResponseStream ()
    {
      lock (_sync) {
        if (_socket == null)
          return null;

        if (_outputStream != null)
          return _outputStream;

        var lsnr = _context.Listener;
        var ignore = lsnr != null ? lsnr.IgnoreWriteExceptions : true;

        _outputStream = new ResponseStream (_stream, _context.Response, ignore);

        return _outputStream;
      }
    }

    #endregion
  }
}
