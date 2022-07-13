#region License
/*
 * ClientSslConfiguration.cs
 *
 * The MIT License
 *
 * Copyright (c) 2014 liryna
 * Copyright (c) 2014-2020 sta.blockhead
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
 * - Liryna <liryna.stark@gmail.com>
 */
#endregion

using System;
using System.Net.Security;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;

namespace WebSocketSharp.Net
{
  /// <summary>
  /// Stores the parameters for the <see cref="SslStream"/> used by clients.
  /// </summary>
  public class ClientSslConfiguration
  {
    #region Private Fields

    private bool                                _checkCertRevocation;
    private LocalCertificateSelectionCallback   _clientCertSelectionCallback;
    private X509CertificateCollection           _clientCerts;
    private SslProtocols                        _enabledSslProtocols;
    private RemoteCertificateValidationCallback _serverCertValidationCallback;
    private string                              _targetHost;

    #endregion

    #region Public Constructors

    /// <summary>
    /// Initializes a new instance of the <see cref="ClientSslConfiguration"/>
    /// class with the specified target host server name.
    /// </summary>
    /// <param name="targetHost">
    /// A <see cref="string"/> that specifies the target host server name.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="targetHost"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="targetHost"/> is an empty string.
    /// </exception>
    public ClientSslConfiguration (string targetHost)
    {
      if (targetHost == null)
        throw new ArgumentNullException ("targetHost");

      if (targetHost.Length == 0)
        throw new ArgumentException ("An empty string.", "targetHost");

      _targetHost = targetHost;

      _enabledSslProtocols = SslProtocols.None;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="ClientSslConfiguration"/>
    /// class that stores the parameters copied from the specified configuration.
    /// </summary>
    /// <param name="configuration">
    /// A <see cref="ClientSslConfiguration"/> from which to copy.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="configuration"/> is <see langword="null"/>.
    /// </exception>
    public ClientSslConfiguration (ClientSslConfiguration configuration)
    {
      if (configuration == null)
        throw new ArgumentNullException ("configuration");

      _checkCertRevocation = configuration._checkCertRevocation;
      _clientCertSelectionCallback = configuration._clientCertSelectionCallback;
      _clientCerts = configuration._clientCerts;
      _enabledSslProtocols = configuration._enabledSslProtocols;
      _serverCertValidationCallback = configuration._serverCertValidationCallback;
      _targetHost = configuration._targetHost;
    }

    #endregion

    #region Public Properties

    /// <summary>
    /// Gets or sets a value indicating whether the certificate revocation
    /// list is checked during authentication.
    /// </summary>
    /// <value>
    ///   <para>
    ///   <c>true</c> if the certificate revocation list is checked during
    ///   authentication; otherwise, <c>false</c>.
    ///   </para>
    ///   <para>
    ///   The default value is <c>false</c>.
    ///   </para>
    /// </value>
    public bool CheckCertificateRevocation {
      get {
        return _checkCertRevocation;
      }

      set {
        _checkCertRevocation = value;
      }
    }

    /// <summary>
    /// Gets or sets the collection of client certificates from which to select
    /// one to supply to the server.
    /// </summary>
    /// <value>
    ///   <para>
    ///   A <see cref="X509CertificateCollection"/> or <see langword="null"/>.
    ///   </para>
    ///   <para>
    ///   The collection contains client certificates from which to select.
    ///   </para>
    ///   <para>
    ///   The default value is <see langword="null"/>.
    ///   </para>
    /// </value>
    public X509CertificateCollection ClientCertificates {
      get {
        return _clientCerts;
      }

      set {
        _clientCerts = value;
      }
    }

    /// <summary>
    /// Gets or sets the callback used to select the certificate to supply to
    /// the server.
    /// </summary>
    /// <remarks>
    /// No certificate is supplied if the callback returns <see langword="null"/>.
    /// </remarks>
    /// <value>
    ///   <para>
    ///   A <see cref="LocalCertificateSelectionCallback"/> delegate that
    ///   invokes the method called for selecting the certificate.
    ///   </para>
    ///   <para>
    ///   The default value is a delegate that invokes a method that only
    ///   returns <see langword="null"/>.
    ///   </para>
    /// </value>
    public LocalCertificateSelectionCallback ClientCertificateSelectionCallback {
      get {
        if (_clientCertSelectionCallback == null)
          _clientCertSelectionCallback = defaultSelectClientCertificate;

        return _clientCertSelectionCallback;
      }

      set {
        _clientCertSelectionCallback = value;
      }
    }

    /// <summary>
    /// Gets or sets the protocols used for authentication.
    /// </summary>
    /// <value>
    ///   <para>
    ///   Any of the <see cref="SslProtocols"/> enum values.
    ///   </para>
    ///   <para>
    ///   It represents the protocols used for authentication.
    ///   </para>
    ///   <para>
    ///   The default value is <see cref="SslProtocols.None"/>.
    ///   </para>
    /// </value>
    public SslProtocols EnabledSslProtocols {
      get {
        return _enabledSslProtocols;
      }

      set {
        _enabledSslProtocols = value;
      }
    }

    /// <summary>
    /// Gets or sets the callback used to validate the certificate supplied by
    /// the server.
    /// </summary>
    /// <remarks>
    /// The certificate is valid if the callback returns <c>true</c>.
    /// </remarks>
    /// <value>
    ///   <para>
    ///   A <see cref="RemoteCertificateValidationCallback"/> delegate that
    ///   invokes the method called for validating the certificate.
    ///   </para>
    ///   <para>
    ///   The default value is a delegate that invokes a method that only
    ///   returns <c>true</c>.
    ///   </para>
    /// </value>
    public RemoteCertificateValidationCallback ServerCertificateValidationCallback {
      get {
        if (_serverCertValidationCallback == null)
          _serverCertValidationCallback = defaultValidateServerCertificate;

        return _serverCertValidationCallback;
      }

      set {
        _serverCertValidationCallback = value;
      }
    }

    /// <summary>
    /// Gets or sets the target host server name.
    /// </summary>
    /// <value>
    /// A <see cref="string"/> that represents the name of the server that
    /// will share a secure connection with a client.
    /// </value>
    /// <exception cref="ArgumentNullException">
    /// The value specified for a set operation is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// The value specified for a set operation is an empty string.
    /// </exception>
    public string TargetHost {
      get {
        return _targetHost;
      }

      set {
        if (value == null)
          throw new ArgumentNullException ("value");

        if (value.Length == 0)
          throw new ArgumentException ("An empty string.", "value");

        _targetHost = value;
      }
    }

    #endregion

    #region Private Methods

    private static X509Certificate defaultSelectClientCertificate (
      object sender,
      string targetHost,
      X509CertificateCollection clientCertificates,
      X509Certificate serverCertificate,
      string[] acceptableIssuers
    )
    {
      return null;
    }

    private static bool defaultValidateServerCertificate (
      object sender,
      X509Certificate certificate,
      X509Chain chain,
      SslPolicyErrors sslPolicyErrors
    )
    {
      return true;
    }

    #endregion
  }
}
