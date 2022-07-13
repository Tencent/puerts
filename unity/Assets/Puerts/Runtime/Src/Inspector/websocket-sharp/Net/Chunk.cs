#region License
/*
 * Chunk.cs
 *
 * This code is derived from ChunkStream.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2003 Ximian, Inc (http://www.ximian.com)
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
 * - Gonzalo Paniagua Javier <gonzalo@ximian.com>
 */
#endregion

using System;

namespace WebSocketSharp.Net
{
  internal class Chunk
  {
    #region Private Fields

    private byte[] _data;
    private int    _offset;

    #endregion

    #region Public Constructors

    public Chunk (byte[] data)
    {
      _data = data;
    }

    #endregion

    #region Public Properties

    public int ReadLeft {
      get {
        return _data.Length - _offset;
      }
    }

    #endregion

    #region Public Methods

    public int Read (byte[] buffer, int offset, int count)
    {
      var left = _data.Length - _offset;

      if (left == 0)
        return 0;

      if (count > left)
        count = left;

      Buffer.BlockCopy (_data, _offset, buffer, offset, count);

      _offset += count;

      return count;
    }

    #endregion
  }
}
