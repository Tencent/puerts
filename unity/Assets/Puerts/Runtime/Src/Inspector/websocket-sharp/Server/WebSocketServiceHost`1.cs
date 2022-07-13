#region License
/*
 * WebSocketServiceHost`1.cs
 *
 * The MIT License
 *
 * Copyright (c) 2015-2021 sta.blockhead
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

namespace WebSocketSharp.Server
{
  internal class WebSocketServiceHost<TBehavior> : WebSocketServiceHost
    where TBehavior : WebSocketBehavior, new ()
  {
    #region Private Fields

    private Func<TBehavior> _creator;

    #endregion

    #region Internal Constructors

    internal WebSocketServiceHost (
      string path, Action<TBehavior> initializer, Logger log
    )
      : base (path, log)
    {
      _creator = createSessionCreator (initializer);
    }

    #endregion

    #region Public Properties

    public override Type BehaviorType {
      get {
        return typeof (TBehavior);
      }
    }

    #endregion

    #region Private Methods

    private static Func<TBehavior> createSessionCreator (
      Action<TBehavior> initializer
    )
    {
      if (initializer == null)
        return () => new TBehavior ();

      return () => {
               var ret = new TBehavior ();

               initializer (ret);

               return ret;
             };
    }

    #endregion

    #region Protected Methods

    protected override WebSocketBehavior CreateSession ()
    {
      return _creator ();
    }

    #endregion
  }
}
