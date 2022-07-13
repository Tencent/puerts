#region License
/*
 * EndPointListener.cs
 *
 * This code is derived from EndPointListener.cs (System.Net) of Mono
 * (http://www.mono-project.com).
 *
 * The MIT License
 *
 * Copyright (c) 2005 Novell, Inc. (http://www.novell.com)
 * Copyright (c) 2012-2020 sta.blockhead
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

#region Contributors
/*
 * Contributors:
 * - Liryna <liryna.stark@gmail.com>
 * - Nicholas Devenish
 */
#endregion

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Threading;

namespace WebSocketSharp.Net
{
  internal sealed class EndPointListener
  {
    #region Private Fields

    private List<HttpListenerPrefix>                   _all; // host == '+'
    private Dictionary<HttpConnection, HttpConnection> _connections;
    private object                                     _connectionsSync;
    private static readonly string                     _defaultCertFolderPath;
    private IPEndPoint                                 _endpoint;
    private List<HttpListenerPrefix>                   _prefixes;
    private bool                                       _secure;
    private Socket                                     _socket;
    private ServerSslConfiguration                     _sslConfig;
    private List<HttpListenerPrefix>                   _unhandled; // host == '*'

    #endregion

    #region Static Constructor

    static EndPointListener ()
    {
      _defaultCertFolderPath = Environment.GetFolderPath (
                                 Environment.SpecialFolder.ApplicationData
                               );
    }

    #endregion

    #region Internal Constructors

    internal EndPointListener (
      IPEndPoint endpoint,
      bool secure,
      string certificateFolderPath,
      ServerSslConfiguration sslConfig,
      bool reuseAddress
    )
    {
      _endpoint = endpoint;

      if (secure) {
        var cert = getCertificate (
                     endpoint.Port,
                     certificateFolderPath,
                     sslConfig.ServerCertificate
                   );

        if (cert == null) {
          var msg = "No server certificate could be found.";

          throw new ArgumentException (msg);
        }

        _secure = true;
        _sslConfig = new ServerSslConfiguration (sslConfig);
        _sslConfig.ServerCertificate = cert;
      }

      _prefixes = new List<HttpListenerPrefix> ();
      _connections = new Dictionary<HttpConnection, HttpConnection> ();
      _connectionsSync = ((ICollection) _connections).SyncRoot;

      _socket = new Socket (
                  endpoint.Address.AddressFamily,
                  SocketType.Stream,
                  ProtocolType.Tcp
                );

      if (reuseAddress) {
        _socket.SetSocketOption (
          SocketOptionLevel.Socket,
          SocketOptionName.ReuseAddress,
          true
        );
      }

      _socket.Bind (endpoint);
      _socket.Listen (500);
      _socket.BeginAccept (onAccept, this);
    }

    #endregion

    #region Public Properties

    public IPAddress Address {
      get {
        return _endpoint.Address;
      }
    }

    public bool IsSecure {
      get {
        return _secure;
      }
    }

    public int Port {
      get {
        return _endpoint.Port;
      }
    }

    public ServerSslConfiguration SslConfiguration {
      get {
        return _sslConfig;
      }
    }

    #endregion

    #region Private Methods

    private static void addSpecial (
      List<HttpListenerPrefix> prefixes, HttpListenerPrefix prefix
    )
    {
      var path = prefix.Path;

      foreach (var pref in prefixes) {
        if (pref.Path == path) {
          var msg = "The prefix is already in use.";

          throw new HttpListenerException (87, msg);
        }
      }

      prefixes.Add (prefix);
    }

    private void clearConnections ()
    {
      HttpConnection[] conns = null;

      lock (_connectionsSync) {
        var cnt = _connections.Count;

        if (cnt == 0)
          return;

        conns = new HttpConnection[cnt];

        var vals = _connections.Values;
        vals.CopyTo (conns, 0);

        _connections.Clear ();
      }

      foreach (var conn in conns)
        conn.Close (true);
    }

    private static RSACryptoServiceProvider createRSAFromFile (string path)
    {
      var rsa = new RSACryptoServiceProvider ();

      var key = File.ReadAllBytes (path);
      rsa.ImportCspBlob (key);

      return rsa;
    }

    private static X509Certificate2 getCertificate (
      int port, string folderPath, X509Certificate2 defaultCertificate
    )
    {
      if (folderPath == null || folderPath.Length == 0)
        folderPath = _defaultCertFolderPath;

      try {
        var cer = Path.Combine (folderPath, String.Format ("{0}.cer", port));
        var key = Path.Combine (folderPath, String.Format ("{0}.key", port));

        if (File.Exists (cer) && File.Exists (key)) {
          var cert = new X509Certificate2 (cer);
          cert.PrivateKey = createRSAFromFile (key);

          return cert;
        }
      }
      catch {
      }

      return defaultCertificate;
    }

    private void leaveIfNoPrefix ()
    {
      if (_prefixes.Count > 0)
        return;

      var prefs = _unhandled;

      if (prefs != null && prefs.Count > 0)
        return;

      prefs = _all;

      if (prefs != null && prefs.Count > 0)
        return;

      Close ();
    }

    private static void onAccept (IAsyncResult asyncResult)
    {
      var lsnr = (EndPointListener) asyncResult.AsyncState;

      Socket sock = null;

      try {
        sock = lsnr._socket.EndAccept (asyncResult);
      }
      catch (ObjectDisposedException) {
        return;
      }
      catch (Exception) {
        // TODO: Logging.
      }

      try {
        lsnr._socket.BeginAccept (onAccept, lsnr);
      }
      catch (Exception) {
        // TODO: Logging.

        if (sock != null)
          sock.Close ();

        return;
      }

      if (sock == null)
        return;

      processAccepted (sock, lsnr);
    }

    private static void processAccepted (
      Socket socket, EndPointListener listener
    )
    {
      HttpConnection conn = null;

      try {
        conn = new HttpConnection (socket, listener);
      }
      catch (Exception) {
        // TODO: Logging.

        socket.Close ();

        return;
      }

      lock (listener._connectionsSync)
        listener._connections.Add (conn, conn);

      conn.BeginReadRequest ();
    }

    private static bool removeSpecial (
      List<HttpListenerPrefix> prefixes, HttpListenerPrefix prefix
    )
    {
      var path = prefix.Path;
      var cnt = prefixes.Count;

      for (var i = 0; i < cnt; i++) {
        if (prefixes[i].Path == path) {
          prefixes.RemoveAt (i);

          return true;
        }
      }

      return false;
    }

    private static HttpListener searchHttpListenerFromSpecial (
      string path, List<HttpListenerPrefix> prefixes
    )
    {
      if (prefixes == null)
        return null;

      HttpListener ret = null;

      var bestLen = -1;

      foreach (var pref in prefixes) {
        var prefPath = pref.Path;
        var len = prefPath.Length;

        if (len < bestLen)
          continue;

        if (path.StartsWith (prefPath, StringComparison.Ordinal)) {
          bestLen = len;
          ret = pref.Listener;
        }
      }

      return ret;
    }

    #endregion

    #region Internal Methods

    internal static bool CertificateExists (int port, string folderPath)
    {
      if (folderPath == null || folderPath.Length == 0)
        folderPath = _defaultCertFolderPath;

      var cer = Path.Combine (folderPath, String.Format ("{0}.cer", port));
      var key = Path.Combine (folderPath, String.Format ("{0}.key", port));

      return File.Exists (cer) && File.Exists (key);
    }

    internal void RemoveConnection (HttpConnection connection)
    {
      lock (_connectionsSync)
        _connections.Remove (connection);
    }

    internal bool TrySearchHttpListener (Uri uri, out HttpListener listener)
    {
      listener = null;

      if (uri == null)
        return false;

      var host = uri.Host;
      var dns = Uri.CheckHostName (host) == UriHostNameType.Dns;
      var port = uri.Port.ToString ();
      var path = HttpUtility.UrlDecode (uri.AbsolutePath);

      if (path[path.Length - 1] != '/')
        path += "/";

      if (host != null && host.Length > 0) {
        var prefs = _prefixes;
        var bestLen = -1;

        foreach (var pref in prefs) {
          if (dns) {
            var prefHost = pref.Host;
            var prefDns = Uri.CheckHostName (prefHost) == UriHostNameType.Dns;

            if (prefDns) {
              if (prefHost != host)
                continue;
            }
          }

          if (pref.Port != port)
            continue;

          var prefPath = pref.Path;
          var len = prefPath.Length;

          if (len < bestLen)
            continue;

          if (path.StartsWith (prefPath, StringComparison.Ordinal)) {
            bestLen = len;
            listener = pref.Listener;
          }
        }

        if (bestLen != -1)
          return true;
      }

      listener = searchHttpListenerFromSpecial (path, _unhandled);

      if (listener != null)
        return true;

      listener = searchHttpListenerFromSpecial (path, _all);

      return listener != null;
    }

    #endregion

    #region Public Methods

    public void AddPrefix (HttpListenerPrefix prefix)
    {
      List<HttpListenerPrefix> current, future;

      if (prefix.Host == "*") {
        do {
          current = _unhandled;
          future = current != null
                   ? new List<HttpListenerPrefix> (current)
                   : new List<HttpListenerPrefix> ();

          addSpecial (future, prefix);
        }
        while (
          Interlocked.CompareExchange (ref _unhandled, future, current) != current
        );

        return;
      }

      if (prefix.Host == "+") {
        do {
          current = _all;
          future = current != null
                   ? new List<HttpListenerPrefix> (current)
                   : new List<HttpListenerPrefix> ();

          addSpecial (future, prefix);
        }
        while (
          Interlocked.CompareExchange (ref _all, future, current) != current
        );

        return;
      }

      do {
        current = _prefixes;
        var idx = current.IndexOf (prefix);

        if (idx > -1) {
          if (current[idx].Listener != prefix.Listener) {
            var msg = String.Format (
                        "There is another listener for {0}.", prefix
                      );

            throw new HttpListenerException (87, msg);
          }

          return;
        }

        future = new List<HttpListenerPrefix> (current);
        future.Add (prefix);
      }
      while (
        Interlocked.CompareExchange (ref _prefixes, future, current) != current
      );
    }

    public void Close ()
    {
      _socket.Close ();

      clearConnections ();
      EndPointManager.RemoveEndPoint (_endpoint);
    }

    public void RemovePrefix (HttpListenerPrefix prefix)
    {
      List<HttpListenerPrefix> current, future;

      if (prefix.Host == "*") {
        do {
          current = _unhandled;

          if (current == null)
            break;

          future = new List<HttpListenerPrefix> (current);

          if (!removeSpecial (future, prefix))
            break;
        }
        while (
          Interlocked.CompareExchange (ref _unhandled, future, current) != current
        );

        leaveIfNoPrefix ();

        return;
      }

      if (prefix.Host == "+") {
        do {
          current = _all;

          if (current == null)
            break;

          future = new List<HttpListenerPrefix> (current);

          if (!removeSpecial (future, prefix))
            break;
        }
        while (
          Interlocked.CompareExchange (ref _all, future, current) != current
        );

        leaveIfNoPrefix ();

        return;
      }

      do {
        current = _prefixes;

        if (!current.Contains (prefix))
          break;

        future = new List<HttpListenerPrefix> (current);
        future.Remove (prefix);
      }
      while (
        Interlocked.CompareExchange (ref _prefixes, future, current) != current
      );

      leaveIfNoPrefix ();
    }

    #endregion
  }
}
