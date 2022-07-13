#region License
/*
 * ChunkStream.cs
 *
 * This code is derived from ChunkStream.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2003 Ximian, Inc (http://www.ximian.com)
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
 * - Gonzalo Paniagua Javier <gonzalo@ximian.com>
 */
#endregion

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net;
using System.Text;

namespace WebSocketSharp.Net
{
  internal class ChunkStream
  {
    #region Private Fields

    private int                 _chunkRead;
    private int                 _chunkSize;
    private List<Chunk>         _chunks;
    private int                 _count;
    private byte[]              _endBuffer;
    private bool                _gotIt;
    private WebHeaderCollection _headers;
    private int                 _offset;
    private StringBuilder       _saved;
    private bool                _sawCr;
    private InputChunkState     _state;
    private int                 _trailerState;

    #endregion

    #region Public Constructors

    public ChunkStream (WebHeaderCollection headers)
    {
      _headers = headers;

      _chunkSize = -1;
      _chunks = new List<Chunk> ();
      _saved = new StringBuilder ();
    }

    #endregion

    #region Internal Properties

    internal int Count {
      get {
        return _count;
      }
    }

    internal byte[] EndBuffer {
      get {
        return _endBuffer;
      }
    }

    internal int Offset {
      get {
        return _offset;
      }
    }

    #endregion

    #region Public Properties

    public WebHeaderCollection Headers {
      get {
        return _headers;
      }
    }

    public bool WantsMore {
      get {
        return _state < InputChunkState.End;
      }
    }

    #endregion

    #region Private Methods

    private int read (byte[] buffer, int offset, int count)
    {
      var nread = 0;
      var cnt = _chunks.Count;

      for (var i = 0; i < cnt; i++) {
        var chunk = _chunks[i];

        if (chunk == null)
          continue;

        if (chunk.ReadLeft == 0) {
          _chunks[i] = null;

          continue;
        }

        nread += chunk.Read (buffer, offset + nread, count - nread);

        if (nread == count)
          break;
      }

      return nread;
    }

    private InputChunkState seekCrLf (byte[] buffer, ref int offset, int length)
    {
      if (!_sawCr) {
        if (buffer[offset++] != 13)
          throwProtocolViolation ("CR is expected.");

        _sawCr = true;

        if (offset == length)
          return InputChunkState.DataEnded;
      }

      if (buffer[offset++] != 10)
        throwProtocolViolation ("LF is expected.");

      return InputChunkState.None;
    }

    private InputChunkState setChunkSize (
      byte[] buffer, ref int offset, int length
    )
    {
      byte b = 0;

      while (offset < length) {
        b = buffer[offset++];

        if (_sawCr) {
          if (b != 10)
            throwProtocolViolation ("LF is expected.");

          break;
        }

        if (b == 13) {
          _sawCr = true;

          continue;
        }

        if (b == 10)
          throwProtocolViolation ("LF is unexpected.");

        if (_gotIt)
          continue;

        if (b == 32 || b == 59) { // SP or ';'
          _gotIt = true;

          continue;
        }

        _saved.Append ((char) b);
      }

      if (_saved.Length > 20)
        throwProtocolViolation ("The chunk size is too big.");

      if (b != 10)
        return InputChunkState.None;

      var s = _saved.ToString ();

      try {
        _chunkSize = Int32.Parse (s, NumberStyles.HexNumber);
      }
      catch {
        throwProtocolViolation ("The chunk size cannot be parsed.");
      }

      _chunkRead = 0;

      if (_chunkSize == 0) {
        _trailerState = 2;

        return InputChunkState.Trailer;
      }

      return InputChunkState.Data;
    }

    private InputChunkState setTrailer (
      byte[] buffer, ref int offset, int length
    )
    {
      while (offset < length) {
        if (_trailerState == 4) // CR LF CR LF
          break;

        var b = buffer[offset++];

        _saved.Append ((char) b);

        if (_trailerState == 1 || _trailerState == 3) { // CR or CR LF CR
          if (b != 10)
            throwProtocolViolation ("LF is expected.");

          _trailerState++;

          continue;
        }

        if (b == 13) {
          _trailerState++;

          continue;
        }

        if (b == 10)
          throwProtocolViolation ("LF is unexpected.");

        _trailerState = 0;
      }

      var len = _saved.Length;

      if (len > 4196)
        throwProtocolViolation ("The trailer is too long.");

      if (_trailerState < 4)
        return InputChunkState.Trailer;

      if (len == 2)
        return InputChunkState.End;

      _saved.Length = len - 2;

      var val = _saved.ToString ();
      var reader = new StringReader (val);

      while (true) {
        var line = reader.ReadLine ();

        if (line == null || line.Length == 0)
          break;

        _headers.Add (line);
      }

      return InputChunkState.End;
    }

    private static void throwProtocolViolation (string message)
    {
      throw new WebException (
              message, null, WebExceptionStatus.ServerProtocolViolation, null
            );
    }

    private void write (byte[] buffer, int offset, int length)
    {
      if (_state == InputChunkState.End)
        throwProtocolViolation ("The chunks were ended.");

      if (_state == InputChunkState.None) {
        _state = setChunkSize (buffer, ref offset, length);

        if (_state == InputChunkState.None)
          return;

        _saved.Length = 0;
        _sawCr = false;
        _gotIt = false;
      }

      if (_state == InputChunkState.Data) {
        if (offset >= length)
          return;

        _state = writeData (buffer, ref offset, length);

        if (_state == InputChunkState.Data)
          return;
      }

      if (_state == InputChunkState.DataEnded) {
        if (offset >= length)
          return;

        _state = seekCrLf (buffer, ref offset, length);

        if (_state == InputChunkState.DataEnded)
          return;

        _sawCr = false;
      }

      if (_state == InputChunkState.Trailer) {
        if (offset >= length)
          return;

        _state = setTrailer (buffer, ref offset, length);

        if (_state == InputChunkState.Trailer)
          return;

        _saved.Length = 0;
      }

      if (_state == InputChunkState.End) {
        _endBuffer = buffer;
        _offset = offset;
        _count = length - offset;

        return;
      }

      if (offset >= length)
        return;

      write (buffer, offset, length);
    }

    private InputChunkState writeData (
      byte[] buffer, ref int offset, int length
    )
    {
      var cnt = length - offset;
      var left = _chunkSize - _chunkRead;

      if (cnt > left)
        cnt = left;

      var data = new byte[cnt];
      Buffer.BlockCopy (buffer, offset, data, 0, cnt);

      var chunk = new Chunk (data);
      _chunks.Add (chunk);

      offset += cnt;
      _chunkRead += cnt;

      return _chunkRead == _chunkSize
             ? InputChunkState.DataEnded
             : InputChunkState.Data;
    }

    #endregion

    #region Internal Methods

    internal void ResetChunkStore ()
    {
      _chunkRead = 0;
      _chunkSize = -1;

      _chunks.Clear ();
    }

    #endregion

    #region Public Methods

    public int Read (byte[] buffer, int offset, int count)
    {
      if (count <= 0)
        return 0;

      return read (buffer, offset, count);
    }

    public void Write (byte[] buffer, int offset, int count)
    {
      if (count <= 0)
        return;

      write (buffer, offset, offset + count);
    }

    #endregion
  }
}
