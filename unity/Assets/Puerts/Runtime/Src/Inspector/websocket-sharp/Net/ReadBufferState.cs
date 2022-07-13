#region License
/*
 * ReadBufferState.cs
 *
 * This code is derived from ChunkedInputStream.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005 Novell, Inc. (http://www.novell.com)
 * Copyright (c) 2014-2021 sta.blockhead
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

namespace WebSocketSharp.Net
{
  internal class ReadBufferState
  {
    #region Private Fields

    private HttpStreamAsyncResult _asyncResult;
    private byte[]                _buffer;
    private int                   _count;
    private int                   _initialCount;
    private int                   _offset;

    #endregion

    #region Public Constructors

    public ReadBufferState (
      byte[] buffer, int offset, int count, HttpStreamAsyncResult asyncResult
    )
    {
      _buffer = buffer;
      _offset = offset;
      _count = count;
      _asyncResult = asyncResult;

      _initialCount = count;
    }

    #endregion

    #region Public Properties

    public HttpStreamAsyncResult AsyncResult {
      get {
        return _asyncResult;
      }

      set {
        _asyncResult = value;
      }
    }

    public byte[] Buffer {
      get {
        return _buffer;
      }

      set {
        _buffer = value;
      }
    }

    public int Count {
      get {
        return _count;
      }

      set {
        _count = value;
      }
    }

    public int InitialCount {
      get {
        return _initialCount;
      }

      set {
        _initialCount = value;
      }
    }

    public int Offset {
      get {
        return _offset;
      }

      set {
        _offset = value;
      }
    }

    #endregion
  }
}
