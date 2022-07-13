#region License
/*
 * CookieException.cs
 *
 * This code is derived from CookieException.cs (System.Net) of Mono
 * (http://www.mono-project.com).
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

#region Authors
/*
 * Authors:
 * - Lawrence Pit <loz@cable.a2000.nl>
 */
#endregion

using System;
using System.Runtime.Serialization;
using System.Security.Permissions;

namespace WebSocketSharp.Net
{
  /// <summary>
  /// The exception that is thrown when a <see cref="Cookie"/> gets an error.
  /// </summary>
  [Serializable]
  public class CookieException : FormatException, ISerializable
  {
    #region Internal Constructors

    internal CookieException (string message)
      : base (message)
    {
    }

    internal CookieException (string message, Exception innerException)
      : base (message, innerException)
    {
    }

    #endregion

    #region Protected Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="CookieException"/> class
    /// with the serialized data.
    /// </summary>
    /// <param name="serializationInfo">
    /// A <see cref="SerializationInfo"/> that holds the serialized object data.
    /// </param>
    /// <param name="streamingContext">
    /// A <see cref="StreamingContext"/> that specifies the source for
    /// the deserialization.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="serializationInfo"/> is <see langword="null"/>.
    /// </exception>
    protected CookieException (
      SerializationInfo serializationInfo, StreamingContext streamingContext
    )
      : base (serializationInfo, streamingContext)
    {
    }

    #endregion

    #region Public Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="CookieException"/> class.
    /// </summary>
    public CookieException ()
      : base ()
    {
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Populates the specified <see cref="SerializationInfo"/> instance with
    /// the data needed to serialize the current instance.
    /// </summary>
    /// <param name="serializationInfo">
    /// A <see cref="SerializationInfo"/> that holds the serialized object data.
    /// </param>
    /// <param name="streamingContext">
    /// A <see cref="StreamingContext"/> that specifies the destination for
    /// the serialization.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="serializationInfo"/> is <see langword="null"/>.
    /// </exception>
    [
      SecurityPermission (
        SecurityAction.LinkDemand,
        Flags = SecurityPermissionFlag.SerializationFormatter
      )
    ]
    public override void GetObjectData (
      SerializationInfo serializationInfo, StreamingContext streamingContext
    )
    {
      base.GetObjectData (serializationInfo, streamingContext);
    }

    #endregion

    #region Explicit Interface Implementation

    /// <summary>
    /// Populates the specified <see cref="SerializationInfo"/> instance with
    /// the data needed to serialize the current instance.
    /// </summary>
    /// <param name="serializationInfo">
    /// A <see cref="SerializationInfo"/> that holds the serialized object data.
    /// </param>
    /// <param name="streamingContext">
    /// A <see cref="StreamingContext"/> that specifies the destination for
    /// the serialization.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="serializationInfo"/> is <see langword="null"/>.
    /// </exception>
    [
      SecurityPermission (
        SecurityAction.LinkDemand,
        Flags = SecurityPermissionFlag.SerializationFormatter,
        SerializationFormatter = true
      )
    ]
    void ISerializable.GetObjectData (
      SerializationInfo serializationInfo, StreamingContext streamingContext
    )
    {
      base.GetObjectData (serializationInfo, streamingContext);
    }

    #endregion
  }
}
