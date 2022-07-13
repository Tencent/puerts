#region License
/*
 * HttpStreamAsyncResult.cs
 *
 * This code is derived from HttpStreamAsyncResult.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005 Novell, Inc. (http://www.novell.com)
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

#region Authors
/*
 * Authors:
 * - Gonzalo Paniagua Javier <gonzalo@novell.com>
 */
#endregion

using System;
using System.Threading;

namespace WebSocketSharp.Net
{
  internal class HttpStreamAsyncResult : IAsyncResult
  {
    #region Private Fields

    private byte[]           _buffer;
    private AsyncCallback    _callback;
    private bool             _completed;
    private int              _count;
    private Exception        _exception;
    private int              _offset;
    private object           _state;
    private object           _sync;
    private int              _syncRead;
    private ManualResetEvent _waitHandle;

    #endregion

    #region Internal Constructors

    internal HttpStreamAsyncResult (AsyncCallback callback, object state)
    {
      _callback = callback;
      _state = state;

      _sync = new object ();
    }

    #endregion

    #region Internal Properties

    internal byte[] Buffer {
      get {
        return _buffer;
      }

      set {
        _buffer = value;
      }
    }

    internal int Count {
      get {
        return _count;
      }

      set {
        _count = value;
      }
    }

    internal Exception Exception {
      get {
        return _exception;
      }
    }

    internal bool HasException {
      get {
        return _exception != null;
      }
    }

    internal int Offset {
      get {
        return _offset;
      }

      set {
        _offset = value;
      }
    }

    internal int SyncRead {
      get {
        return _syncRead;
      }

      set {
        _syncRead = value;
      }
    }

    #endregion

    #region Public Properties

    public object AsyncState {
      get {
        return _state;
      }
    }

    public WaitHandle AsyncWaitHandle {
      get {
        lock (_sync) {
          if (_waitHandle == null)
            _waitHandle = new ManualResetEvent (_completed);

          return _waitHandle;
        }
      }
    }

    public bool CompletedSynchronously {
      get {
        return _syncRead == _count;
      }
    }

    public bool IsCompleted {
      get {
        lock (_sync)
          return _completed;
      }
    }

    #endregion

    #region Internal Methods

    internal void Complete ()
    {
      lock (_sync) {
        if (_completed)
          return;

        _completed = true;

        if (_waitHandle != null)
          _waitHandle.Set ();

        if (_callback != null)
          _callback.BeginInvoke (this, ar => _callback.EndInvoke (ar), null);
      }
    }

    internal void Complete (Exception exception)
    {
      lock (_sync) {
        if (_completed)
          return;

        _completed = true;
        _exception = exception;

        if (_waitHandle != null)
          _waitHandle.Set ();

        if (_callback != null)
          _callback.BeginInvoke (this, ar => _callback.EndInvoke (ar), null);
      }
    }

    #endregion
  }
}
