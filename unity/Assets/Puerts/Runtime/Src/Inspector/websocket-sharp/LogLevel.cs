#region License
/*
 * LogLevel.cs
 *
 * The MIT License
 *
 * Copyright (c) 2013-2015 sta.blockhead
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
  /// Specifies the logging level.
  /// </summary>
  public enum LogLevel
  {
    /// <summary>
    /// Specifies the bottom logging level.
    /// </summary>
    Trace,
    /// <summary>
    /// Specifies the 2nd logging level from the bottom.
    /// </summary>
    Debug,
    /// <summary>
    /// Specifies the 3rd logging level from the bottom.
    /// </summary>
    Info,
    /// <summary>
    /// Specifies the 3rd logging level from the top.
    /// </summary>
    Warn,
    /// <summary>
    /// Specifies the 2nd logging level from the top.
    /// </summary>
    Error,
    /// <summary>
    /// Specifies the top logging level.
    /// </summary>
    Fatal
  }
}
