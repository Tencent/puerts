#region License
/*
 * HttpListenerAsyncResult.cs
 *
 * This code is derived from ListenerAsyncResult.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005 Ximian, Inc. (http://www.ximian.com)
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
 * - Gonzalo Paniagua Javier <gonzalo@ximian.com>
 */
#endregion

#region Contributors
/*
 * Contributors:
 * - Nicholas Devenish
 */
#endregion

using System;
using System.Threading;

namespace WebSocketSharp.Net
{
  internal class HttpListenerAsyncResult : IAsyncResult
  {
    #region Private Fields

    private AsyncCallback       _callback;
    private bool                _completed;
    private bool                _completedSynchronously;
    private HttpListenerContext _context;
    private bool                _endCalled;
    private Exception           _exception;
    private object              _state;
    private object              _sync;
    private ManualResetEvent    _waitHandle;

    #endregion

    #region Internal Constructors

    internal HttpListenerAsyncResult (AsyncCallback callback, object state)
    {
      _callback = callback;
      _state = state;

      _sync = new object ();
    }

    #endregion

    #region Internal Properties

    internal HttpListenerContext Context
    {
      get {
        if (_exception != null)
          throw _exception;

        return _context;
      }
    }

    internal bool EndCalled {
      get {
        return _endCalled;
      }

      set {
        _endCalled = value;
      }
    }

    internal object SyncRoot {
      get {
        return _sync;
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
        return _completedSynchronously;
      }
    }

    public bool IsCompleted {
      get {
        lock (_sync)
          return _completed;
      }
    }

    #endregion

    #region Private Methods

    private void complete ()
    {
      lock (_sync) {
        _completed = true;

        if (_waitHandle != null)
          _waitHandle.Set ();
      }

      if (_callback == null)
        return;

      ThreadPool.QueueUserWorkItem (
        state => {
          try {
            _callback (this);
          }
          catch {
          }
        },
        null
      );
    }

    #endregion

    #region Internal Methods

    internal void Complete (Exception exception)
    {
      _exception = exception;

      complete ();
    }

    internal void Complete (
      HttpListenerContext context, bool completedSynchronously
    )
    {
      _context = context;
      _completedSynchronously = completedSynchronously;

      complete ();
    }

    #endregion
  }
}
