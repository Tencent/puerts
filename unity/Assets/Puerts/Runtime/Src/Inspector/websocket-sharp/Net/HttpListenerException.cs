#region License
/*
 * HttpListenerException.cs
 *
 * This code is derived from HttpListenerException.cs (System.Net) of Mono
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
using System.ComponentModel;
using System.Runtime.Serialization;

namespace WebSocketSharp.Net
{
  /// <summary>
  /// The exception that is thrown when an error occurs processing
  /// an HTTP request.
  /// </summary>
  [Serializable]
  public class HttpListenerException : Win32Exception
  {
    #region Protected Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpListenerException"/>
    /// class from the specified instances of the <see cref="SerializationInfo"/>
    /// and <see cref="StreamingContext"/> classes.
    /// </summary>
    /// <param name="serializationInfo">
    /// A <see cref="SerializationInfo"/> that contains the serialized
    /// object data.
    /// </param>
    /// <param name="streamingContext">
    /// A <see cref="StreamingContext"/> that specifies the source for
    /// the deserialization.
    /// </param>
    protected HttpListenerException (
      SerializationInfo serializationInfo, StreamingContext streamingContext
    )
      : base (serializationInfo, streamingContext)
    {
    }

    #endregion

    #region Public Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpListenerException"/>
    /// class.
    /// </summary>
    public HttpListenerException ()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpListenerException"/>
    /// class with the specified error code.
    /// </summary>
    /// <param name="errorCode">
    /// An <see cref="int"/> that specifies the error code.
    /// </param>
    public HttpListenerException (int errorCode)
      : base (errorCode)
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpListenerException"/>
    /// class with the specified error code and message.
    /// </summary>
    /// <param name="errorCode">
    /// An <see cref="int"/> that specifies the error code.
    /// </param>
    /// <param name="message">
    /// A <see cref="string"/> that specifies the message.
    /// </param>
    public HttpListenerException (int errorCode, string message)
      : base (errorCode, message)
    {
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets the error code that identifies the error that occurred.
    /// </summary>
    /// <value>
    ///   <para>
    ///   An <see cref="int"/> that represents the error code.
    ///   </para>
    ///   <para>
    ///   It is any of the Win32 error codes.
    ///   </para>
    /// </value>
    public override int ErrorCode {
      get {
        return NativeErrorCode;
      }
    }

    #endregion
  }
}
