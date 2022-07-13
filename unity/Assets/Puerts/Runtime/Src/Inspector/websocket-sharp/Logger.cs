#region License
/*
 * Logger.cs
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
using System.Diagnostics;
using System.IO;

namespace WebSocketSharp
{
  /// <summary>
  /// Provides a set of methods and properties for logging.
  /// </summary>
  /// <remarks>
  ///   <para>
  ///   If you output a log with lower than the value of the <see cref="Logger.Level"/> property,
  ///   it cannot be outputted.
  ///   </para>
  ///   <para>
  ///   The default output action writes a log to the standard output stream and the log file
  ///   if the <see cref="Logger.File"/> property has a valid path to it.
  ///   </para>
  ///   <para>
  ///   If you would like to use the custom output action, you should set
  ///   the <see cref="Logger.Output"/> property to any <c>Action&lt;LogData, string&gt;</c>
  ///   delegate.
  ///   </para>
  /// </remarks>
  public class Logger
  {
    #region Private Fields

    private volatile string         _file;
    private volatile LogLevel       _level;
    private Action<LogData, string> _output;
    private object                  _sync;

    #endregion

    #region Public Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="Logger"/> class.
    /// </summary>
    /// <remarks>
    /// This constructor initializes the current logging level with <see cref="LogLevel.Error"/>.
    /// </remarks>
    public Logger ()
      : this (LogLevel.Error, null, null)
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Logger"/> class with
    /// the specified logging <paramref name="level"/>.
    /// </summary>
    /// <param name="level">
    /// One of the <see cref="LogLevel"/> enum values.
    /// </param>
    public Logger (LogLevel level)
      : this (level, null, null)
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Logger"/> class with
    /// the specified logging <paramref name="level"/>, path to the log <paramref name="file"/>,
    /// and <paramref name="output"/> action.
    /// </summary>
    /// <param name="level">
    /// One of the <see cref="LogLevel"/> enum values.
    /// </param>
    /// <param name="file">
    /// A <see cref="string"/> that represents the path to the log file.
    /// </param>
    /// <param name="output">
    /// An <c>Action&lt;LogData, string&gt;</c> delegate that references the method(s) used to
    /// output a log. A <see cref="string"/> parameter passed to this delegate is
    /// <paramref name="file"/>.
    /// </param>
    public Logger (LogLevel level, string file, Action<LogData, string> output)
    {
      _level = level;
      _file = file;
      _output = output ?? defaultOutput;
      _sync = new object ();
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets or sets the current path to the log file.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the current path to the log file if any.
    /// </value>
    public string File {
      get {
        return _file;
      }

      set {
        lock (_sync) {
          _file = value;
          Warn (
            String.Format ("The current path to the log file has been changed to {0}.", _file));
        }
      }
    }

    /// <summary>
    /// Gets or sets the current logging level.
    /// </summary>
    /// <remarks>
    /// A log with lower than the value of this property cannot be outputted.
    /// </remarks>
    /// <value>
    /// One of the <see cref="LogLevel"/> enum values, specifies the current logging level.
    /// </value>
    public LogLevel Level {
      get {
        return _level;
      }

      set {
        lock (_sync) {
          _level = value;
          Warn (String.Format ("The current logging level has been changed to {0}.", _level));
        }
      }
    }

    /// <summary>
    /// Gets or sets the current output action used to output a log.
    /// </summary>
    /// <value>
    ///   <para>
    ///   An <c>Action&lt;LogData, string&gt;</c> delegate that references the method(s) used to
    ///   output a log. A <see cref="string"/> parameter passed to this delegate is the value of
    ///   the <see cref="Logger.File"/> property.
    ///   </para>
    ///   <para>
    ///   If the value to set is <see langword="null"/>, the current output action is changed to
    ///   the default output action.
    ///   </para>
    /// </value>
    public Action<LogData, string> Output {
      get {
        return _output;
      }

      set {
        lock (_sync) {
          _output = value ?? defaultOutput;
          Warn ("The current output action has been changed.");
        }
      }
    }

    #endregion

    #region Private Methods

    private static void defaultOutput (LogData data, string path)
    {
      var log = data.ToString ();
      Console.WriteLine (log);
      if (path != null && path.Length > 0)
        writeToFile (log, path);
    }

    private void output (string message, LogLevel level)
    {
      lock (_sync) {
        if (_level > level)
          return;

        LogData data = null;
        try {
          data = new LogData (level, new StackFrame (2, true), message);
          _output (data, _file);
        }
        catch (Exception ex) {
          data = new LogData (LogLevel.Fatal, new StackFrame (0, true), ex.Message);
          Console.WriteLine (data.ToString ());
        }
      }
    }

    private static void writeToFile (string value, string path)
    {
      using (var writer = new StreamWriter (path, true))
      using (var syncWriter = TextWriter.Synchronized (writer))
        syncWriter.WriteLine (value);
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Outputs <paramref name="message"/> as a log with <see cref="LogLevel.Debug"/>.
    /// </summary>
    /// <remarks>
    /// If the current logging level is higher than <see cref="LogLevel.Debug"/>,
    /// this method doesn't output <paramref name="message"/> as a log.
    /// </remarks>
    /// <param name="message">
    /// A <see cref="string"/> that represents the message to output as a log.
    /// </param>
    public void Debug (string message)
    {
      if (_level > LogLevel.Debug)
        return;

      output (message, LogLevel.Debug);
    }

    /// <summary>
    /// Outputs <paramref name="message"/> as a log with <see cref="LogLevel.Error"/>.
    /// </summary>
    /// <remarks>
    /// If the current logging level is higher than <see cref="LogLevel.Error"/>,
    /// this method doesn't output <paramref name="message"/> as a log.
    /// </remarks>
    /// <param name="message">
    /// A <see cref="string"/> that represents the message to output as a log.
    /// </param>
    public void Error (string message)
    {
      if (_level > LogLevel.Error)
        return;

      output (message, LogLevel.Error);
    }

    /// <summary>
    /// Outputs <paramref name="message"/> as a log with <see cref="LogLevel.Fatal"/>.
    /// </summary>
    /// <param name="message">
    /// A <see cref="string"/> that represents the message to output as a log.
    /// </param>
    public void Fatal (string message)
    {
      output (message, LogLevel.Fatal);
    }

    /// <summary>
    /// Outputs <paramref name="message"/> as a log with <see cref="LogLevel.Info"/>.
    /// </summary>
    /// <remarks>
    /// If the current logging level is higher than <see cref="LogLevel.Info"/>,
    /// this method doesn't output <paramref name="message"/> as a log.
    /// </remarks>
    /// <param name="message">
    /// A <see cref="string"/> that represents the message to output as a log.
    /// </param>
    public void Info (string message)
    {
      if (_level > LogLevel.Info)
        return;

      output (message, LogLevel.Info);
    }

    /// <summary>
    /// Outputs <paramref name="message"/> as a log with <see cref="LogLevel.Trace"/>.
    /// </summary>
    /// <remarks>
    /// If the current logging level is higher than <see cref="LogLevel.Trace"/>,
    /// this method doesn't output <paramref name="message"/> as a log.
    /// </remarks>
    /// <param name="message">
    /// A <see cref="string"/> that represents the message to output as a log.
    /// </param>
    public void Trace (string message)
    {
      if (_level > LogLevel.Trace)
        return;

      output (message, LogLevel.Trace);
    }

    /// <summary>
    /// Outputs <paramref name="message"/> as a log with <see cref="LogLevel.Warn"/>.
    /// </summary>
    /// <remarks>
    /// If the current logging level is higher than <see cref="LogLevel.Warn"/>,
    /// this method doesn't output <paramref name="message"/> as a log.
    /// </remarks>
    /// <param name="message">
    /// A <see cref="string"/> that represents the message to output as a log.
    /// </param>
    public void Warn (string message)
    {
      if (_level > LogLevel.Warn)
        return;

      output (message, LogLevel.Warn);
    }

    #endregion
  }
}
