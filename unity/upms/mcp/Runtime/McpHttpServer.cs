using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using UnityEngine;

namespace PuertsMcp
{
    /// <summary>
    /// C# HTTP Server for MCP Streamable HTTP protocol.
    /// Supports multiple concurrent sessions (multi-agent access).
    ///
    /// Protocol:
    ///   POST   /mcp  — client sends JSON-RPC message(s); server responds with SSE or JSON.
    ///   GET    /mcp  — client opens an SSE stream for server-initiated messages.
    ///   DELETE /mcp  — client terminates a specific session.
    ///   GET    /health — health check endpoint.
    /// </summary>
    public class McpHttpServer : IDisposable
    {
        private HttpListener _listener;
        private Thread _listenerThread;
        private volatile bool _running;
        private readonly int _port;

        // Multi-session management
        private readonly HashSet<string> _sessions = new HashSet<string>();
        private readonly object _sessionLock = new object();

        // SSE stream management
        // requestContextId -> HttpListenerResponse (kept open for SSE streaming)
        private readonly ConcurrentDictionary<string, HttpListenerResponse> _postStreams
            = new ConcurrentDictionary<string, HttpListenerResponse>();

        // requestContextId -> sessionId (so we can add the correct session header)
        private readonly ConcurrentDictionary<string, string> _contextToSession
            = new ConcurrentDictionary<string, string>();

        // Standalone GET SSE streams, one per session
        private readonly ConcurrentDictionary<string, HttpListenerResponse> _getStreams
            = new ConcurrentDictionary<string, HttpListenerResponse>();

        // Callback to JS side: receives the raw JSON body + request context
        // JS processes the message and calls back with responses via SendSseEvent / CompleteRequest
        //
        // Parameters: (string requestContextId, string method, string jsonBody, string sessionIdHeader)
        // requestContextId is a unique ID for this HTTP request, used to route responses back.
        public Action<string, string, string, string> OnHttpPost;

        // Called when a DELETE request is received for a specific session
        // Parameter: sessionId
        public Action<string> OnHttpDelete;

        // Called when a GET SSE stream is opened
        public Action OnSseStreamOpened;

        public McpHttpServer(int port)
        {
            _port = port;
        }

        public void Start()
        {
            if (_running) return;

            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
            _listener.Start();
            _running = true;

            _listenerThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "McpHttpServer"
            };
            _listenerThread.Start();

            Debug.Log($"[McpHttpServer] Listening on http://127.0.0.1:{_port}");
        }

        public void Stop()
        {
            _running = false;

            // Close all GET SSE streams
            foreach (var kvp in _getStreams)
            {
                try { kvp.Value.Close(); } catch { }
            }
            _getStreams.Clear();

            // Close all POST SSE streams
            foreach (var kvp in _postStreams)
            {
                try { kvp.Value.Close(); } catch { }
            }
            _postStreams.Clear();
            _contextToSession.Clear();

            // Stop listener
            if (_listener != null)
            {
                try { _listener.Stop(); } catch { }
                try { _listener.Close(); } catch { }
                _listener = null;
            }

            lock (_sessionLock)
            {
                _sessions.Clear();
            }

            Debug.Log("[McpHttpServer] Stopped.");
        }

        public void Dispose()
        {
            Stop();
        }

        // -------------------------------------------------------------------
        // Methods called from JS to manage sessions
        // -------------------------------------------------------------------

        /// <summary>
        /// Register a new session ID (called from JS when a new session is created).
        /// </summary>
        public void AddSession(string sessionId)
        {
            lock (_sessionLock)
            {
                _sessions.Add(sessionId);
            }
        }

        /// <summary>
        /// Unregister a session ID (called from JS when a session is destroyed).
        /// Also closes the GET SSE stream for this session if any.
        /// </summary>
        public void RemoveSession(string sessionId)
        {
            lock (_sessionLock)
            {
                _sessions.Remove(sessionId);
            }

            // Close the GET SSE stream for this session
            if (_getStreams.TryRemove(sessionId, out var getStream))
            {
                try { getStream.Close(); } catch { }
            }
        }

        /// <summary>
        /// Associate a request context with a specific session ID,
        /// so the correct mcp-session-id header is added to the response.
        /// Called from JS after creating a new session for an initialize request.
        /// </summary>
        public void AddSessionHeaderForContext(string requestContextId, string sessionId)
        {
            _contextToSession[requestContextId] = sessionId;
        }

        // -------------------------------------------------------------------
        // Methods called from JS to send responses back
        // -------------------------------------------------------------------

        /// <summary>
        /// Write an SSE event to a POST response stream.
        /// </summary>
        public void SendSseEvent(string requestContextId, string jsonData)
        {
            if (_postStreams.TryGetValue(requestContextId, out var response))
            {
                try
                {
                    var data = Encoding.UTF8.GetBytes($"event: message\ndata: {jsonData}\n\n");
                    response.OutputStream.Write(data, 0, data.Length);
                    response.OutputStream.Flush();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpHttpServer] Error writing SSE event: {ex.Message}");
                    ClosePostStream(requestContextId);
                }
            }
        }

        /// <summary>
        /// Close a POST SSE stream (all responses for this request have been sent).
        /// </summary>
        public void ClosePostStream(string requestContextId)
        {
            if (_postStreams.TryRemove(requestContextId, out var response))
            {
                try { response.Close(); } catch { }
            }
            _contextToSession.TryRemove(requestContextId, out _);
        }

        /// <summary>
        /// Write an SSE event to the standalone GET stream for a specific session.
        /// </summary>
        public void SendGetSseEventForSession(string sessionId, string jsonData)
        {
            if (_getStreams.TryGetValue(sessionId, out var stream))
            {
                try
                {
                    var data = Encoding.UTF8.GetBytes($"event: message\ndata: {jsonData}\n\n");
                    stream.OutputStream.Write(data, 0, data.Length);
                    stream.OutputStream.Flush();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpHttpServer] Error writing GET SSE event for session {sessionId}: {ex.Message}");
                    if (_getStreams.TryRemove(sessionId, out var removed))
                    {
                        try { removed.Close(); } catch { }
                    }
                }
            }
        }

        /// <summary>
        /// Send a plain JSON response and close the connection (for non-SSE responses like 202, errors).
        /// </summary>
        public void SendJsonResponse(string requestContextId, int statusCode, string jsonBody)
        {
            if (_postStreams.TryRemove(requestContextId, out var response))
            {
                try
                {
                    response.StatusCode = statusCode;
                    response.ContentType = "application/json";
                    AddSessionHeader(response, requestContextId);
                    var data = Encoding.UTF8.GetBytes(jsonBody);
                    response.ContentLength64 = data.Length;
                    response.OutputStream.Write(data, 0, data.Length);
                    response.Close();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpHttpServer] Error sending JSON response: {ex.Message}");
                    try { response.Close(); } catch { }
                }
            }
            _contextToSession.TryRemove(requestContextId, out _);
        }

        /// <summary>
        /// Send a 202 Accepted response (for notification-only POST requests).
        /// </summary>
        public void Send202(string requestContextId)
        {
            if (_postStreams.TryRemove(requestContextId, out var response))
            {
                try
                {
                    response.StatusCode = 202;
                    AddSessionHeader(response, requestContextId);
                    response.Close();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpHttpServer] Error sending 202: {ex.Message}");
                    try { response.Close(); } catch { }
                }
            }
            _contextToSession.TryRemove(requestContextId, out _);
        }

        /// <summary>
        /// Begin SSE streaming for a POST request (set headers, keep connection open).
        /// </summary>
        public void BeginSseStream(string requestContextId)
        {
            if (_postStreams.TryGetValue(requestContextId, out var response))
            {
                try
                {
                    response.StatusCode = 200;
                    response.ContentType = "text/event-stream";
                    response.Headers.Set("Cache-Control", "no-cache, no-transform");
                    response.Headers.Set("Connection", "keep-alive");
                    AddSessionHeader(response, requestContextId);
                    // Flush headers by writing empty content
                    response.OutputStream.Flush();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpHttpServer] Error beginning SSE stream: {ex.Message}");
                }
            }
        }

        // -------------------------------------------------------------------
        // Internal HTTP handling
        // -------------------------------------------------------------------

        private void ListenLoop()
        {
            while (_running)
            {
                try
                {
                    var context = _listener.GetContext();
                    // Handle each request on a thread pool thread
                    ThreadPool.QueueUserWorkItem(_ => HandleRequest(context));
                }
                catch (HttpListenerException)
                {
                    // Expected when listener is stopped
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_running)
                        Debug.LogError($"[McpHttpServer] Listener error: {ex.Message}");
                }
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;

            try
            {
                // CORS headers
                response.Headers.Set("Access-Control-Allow-Origin", "*");
                response.Headers.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
                response.Headers.Set("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
                response.Headers.Set("Access-Control-Expose-Headers", "mcp-session-id");

                var path = request.Url.AbsolutePath;

                // OPTIONS (CORS preflight)
                if (request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = 204;
                    response.Close();
                    return;
                }

                // Health check
                if (path == "/health" && request.HttpMethod == "GET")
                {
                    var body = Encoding.UTF8.GetBytes("{\"status\":\"ok\",\"server\":\"unity-puerts-mcp\"}");
                    response.StatusCode = 200;
                    response.ContentType = "application/json";
                    response.ContentLength64 = body.Length;
                    response.OutputStream.Write(body, 0, body.Length);
                    response.Close();
                    return;
                }

                // MCP endpoint
                if (path == "/mcp")
                {
                    switch (request.HttpMethod)
                    {
                        case "POST":
                            HandlePost(request, response);
                            return;
                        case "GET":
                            HandleGet(request, response);
                            return;
                        case "DELETE":
                            HandleDelete(request, response);
                            return;
                        default:
                            SendError(response, 405, -32000, "Method not allowed");
                            return;
                    }
                }

                // Not found
                SendError(response, 404, -32000, "Not Found");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[McpHttpServer] Request handling error: {ex.Message}");
                try
                {
                    SendError(response, 500, -32000, "Internal error");
                }
                catch { }
            }
        }

        private void HandlePost(HttpListenerRequest request, HttpListenerResponse response)
        {
            // Read body
            string body;
            using (var reader = new StreamReader(request.InputStream, Encoding.UTF8))
            {
                body = reader.ReadToEnd();
            }

            var sessionIdHeader = request.Headers["mcp-session-id"];
            var requestContextId = Guid.NewGuid().ToString();

            // If a session header is provided, associate this context with that session
            if (!string.IsNullOrEmpty(sessionIdHeader))
            {
                _contextToSession[requestContextId] = sessionIdHeader;
            }

            // Store the response so JS can write to it later
            _postStreams[requestContextId] = response;

            // Delegate to JS for JSON-RPC processing
            // JS will call back: BeginSseStream, SendSseEvent, ClosePostStream,
            //                    SendJsonResponse, Send202, AddSession, etc.
            try
            {
                OnHttpPost?.Invoke(requestContextId, "POST", body, sessionIdHeader ?? "");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[McpHttpServer] Error dispatching POST to JS: {ex.Message}");
                SendJsonError(requestContextId, 500, -32000, "Internal error");
            }
        }

        private void HandleGet(HttpListenerRequest request, HttpListenerResponse response)
        {
            var incoming = request.Headers["mcp-session-id"];

            // Validate session
            lock (_sessionLock)
            {
                if (_sessions.Count == 0)
                {
                    SendError(response, 400, -32000, "Server not initialized");
                    return;
                }
                if (string.IsNullOrEmpty(incoming))
                {
                    SendError(response, 400, -32000, "Mcp-Session-Id header is required");
                    return;
                }
                if (!_sessions.Contains(incoming))
                {
                    SendError(response, 404, -32001, "Session not found");
                    return;
                }
            }

            // Check if this session already has a GET stream
            if (_getStreams.ContainsKey(incoming))
            {
                SendError(response, 409, -32000, "Only one GET SSE stream allowed per session");
                return;
            }

            // Set up SSE headers and keep connection open
            response.StatusCode = 200;
            response.ContentType = "text/event-stream";
            response.Headers.Set("Cache-Control", "no-cache, no-transform");
            response.Headers.Set("Connection", "keep-alive");
            response.Headers.Set("mcp-session-id", incoming);
            response.OutputStream.Flush();

            _getStreams[incoming] = response;

            OnSseStreamOpened?.Invoke();
        }

        private void HandleDelete(HttpListenerRequest request, HttpListenerResponse response)
        {
            var incoming = request.Headers["mcp-session-id"];

            // Validate session
            lock (_sessionLock)
            {
                if (string.IsNullOrEmpty(incoming))
                {
                    SendError(response, 400, -32000, "Mcp-Session-Id header is required");
                    return;
                }
                if (!_sessions.Contains(incoming))
                {
                    SendError(response, 404, -32001, "Session not found");
                    return;
                }
            }

            OnHttpDelete?.Invoke(incoming);

            response.StatusCode = 200;
            response.Close();
        }

        // -------------------------------------------------------------------
        // Helpers
        // -------------------------------------------------------------------

        /// <summary>
        /// Add the mcp-session-id header to a response, looking up the session from the request context.
        /// </summary>
        private void AddSessionHeader(HttpListenerResponse response, string requestContextId)
        {
            if (_contextToSession.TryGetValue(requestContextId, out var sessionId))
            {
                response.Headers.Set("mcp-session-id", sessionId);
            }
        }

        private void SendError(HttpListenerResponse response, int statusCode, int code, string message)
        {
            try
            {
                var json = $"{{\"jsonrpc\":\"2.0\",\"error\":{{\"code\":{code},\"message\":\"{EscapeJson(message)}\"}},\"id\":null}}";
                var data = Encoding.UTF8.GetBytes(json);
                response.StatusCode = statusCode;
                response.ContentType = "application/json";
                response.ContentLength64 = data.Length;
                response.OutputStream.Write(data, 0, data.Length);
                response.Close();
            }
            catch { }
        }

        private void SendJsonError(string requestContextId, int statusCode, int code, string message)
        {
            var json = $"{{\"jsonrpc\":\"2.0\",\"error\":{{\"code\":{code},\"message\":\"{EscapeJson(message)}\"}},\"id\":null}}";
            SendJsonResponse(requestContextId, statusCode, json);
        }

        private static string EscapeJson(string s)
        {
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r");
        }
    }
}
