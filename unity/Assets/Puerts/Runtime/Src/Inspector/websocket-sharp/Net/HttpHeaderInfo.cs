#region License
/*
 * HttpHeaderInfo.cs
 *
 * The MIT License
 *
 * Copyright (c) 2013-2020 sta.blockhead
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

namespace WebSocketSharp.Net
{
  internal class HttpHeaderInfo
  {
    #region Private Fields

    private string         _headerName;
    private HttpHeaderType _headerType;

    #endregion

    #region Internal Constructors

    internal HttpHeaderInfo (string headerName, HttpHeaderType headerType)
    {
      _headerName = headerName;
      _headerType = headerType;
    }

    #endregion

    #region Internal Properties

    internal bool IsMultiValueInRequest {
      get {
        var headerType = _headerType & HttpHeaderType.MultiValueInRequest;

        return headerType == HttpHeaderType.MultiValueInRequest;
      }
    }

    internal bool IsMultiValueInResponse {
      get {
        var headerType = _headerType & HttpHeaderType.MultiValueInResponse;

        return headerType == HttpHeaderType.MultiValueInResponse;
      }
    }

    #endregion

    #region Public Properties

    public string HeaderName {
      get {
        return _headerName;
      }
    }

    public HttpHeaderType HeaderType {
      get {
        return _headerType;
      }
    }

    public bool IsRequest {
      get {
        var headerType = _headerType & HttpHeaderType.Request;

        return headerType == HttpHeaderType.Request;
      }
    }

    public bool IsResponse {
      get {
        var headerType = _headerType & HttpHeaderType.Response;

        return headerType == HttpHeaderType.Response;
      }
    }

    #endregion

    #region Public Methods

    public bool IsMultiValue (bool response)
    {
      var headerType = _headerType & HttpHeaderType.MultiValue;

      if (headerType != HttpHeaderType.MultiValue)
        return response ? IsMultiValueInResponse : IsMultiValueInRequest;

      return response ? IsResponse : IsRequest;
    }

    public bool IsRestricted (bool response)
    {
      var headerType = _headerType & HttpHeaderType.Restricted;

      if (headerType != HttpHeaderType.Restricted)
        return false;

      return response ? IsResponse : IsRequest;
    }

    #endregion
  }
}
