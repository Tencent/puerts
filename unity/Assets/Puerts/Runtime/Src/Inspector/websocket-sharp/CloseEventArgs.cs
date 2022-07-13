#region License
/*
 * CloseEventArgs.cs
 *
 * The MIT License
 *
 * Copyright (c) 2012-2019 sta.blockhead
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
  /// Represents the event data for the <see cref="WebSocket.OnClose"/> event.
  /// </summary>
  /// <remarks>
  ///   <para>
  ///   That event occurs when the WebSocket connection has been closed.
  ///   </para>
  ///   <para>
  ///   If you would like to get the reason for the connection close, you should
  ///   access the <see cref="Code"/> or <see cref="Reason"/> property.
  ///   </para>
  /// </remarks>
  public class CloseEventArgs : EventArgs
  {
    #region Private Fields

    private bool        _clean;
    private PayloadData _payloadData;

    #endregion

    #region Internal Constructors

    internal CloseEventArgs (PayloadData payloadData, bool clean)
    {
      _payloadData = payloadData;
      _clean = clean;
    }

    internal CloseEventArgs (ushort code, string reason, bool clean)
    {
      _payloadData = new PayloadData (code, reason);
      _clean = clean;
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets the status code for the connection close.
    /// </summary>
    /// <value>
    /// A <see cref="ushort"/> that represents the status code for
    /// the connection close if present.
    /// </value>
    public ushort Code {
      get {
        return _payloadData.Code;
      }
    }

    /// <summary>
    /// Gets the reason for the connection close.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the reason for
    /// the connection close if present.
    /// </value>
    public string Reason {
      get {
        return _payloadData.Reason;
      }
    }

    /// <summary>
    /// Gets a value indicating whether the connection has been closed cleanly.
    /// </summary>
    /// <value>
    /// <c>true</c> if the connection has been closed cleanly; otherwise,
    /// <c>false</c>.
    /// </value>
    public bool WasClean {
      get {
        return _clean;
      }
    }

    #endregion
  }
}
