using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace LLMAgent
{
    /// <summary>
    /// HTTP bridge for TypeScript fetch polyfill.
    /// In Editor: uses EditorApplication.update polling.
    /// In Runtime: uses a hidden MonoBehaviour with coroutines.
    /// Callbacks are always invoked on the main thread (required by V8 isolate).
    /// </summary>
    public static class HttpBridge
    {
        /// <summary>
        /// Represents a pending HTTP request being polled each frame.
        /// </summary>
        private class PendingRequest
        {
            public UnityWebRequestAsyncOperation operation;
            public Action<string> callback;
            public string url;
        }

        private static readonly List<PendingRequest> pendingRequests = new List<PendingRequest>();
        private static bool isPolling = false;

#if !UNITY_EDITOR
        /// <summary>
        /// Hidden MonoBehaviour singleton for Runtime coroutine/update driving.
        /// </summary>
        private class HttpBridgeRunner : MonoBehaviour
        {
            private static HttpBridgeRunner _instance;
            public static HttpBridgeRunner Instance
            {
                get
                {
                    if (_instance == null)
                    {
                        var go = new GameObject("[HttpBridgeRunner]");
                        go.hideFlags = HideFlags.HideAndDontSave;
                        UnityEngine.Object.DontDestroyOnLoad(go);
                        _instance = go.AddComponent<HttpBridgeRunner>();
                    }
                    return _instance;
                }
            }

            private void Update()
            {
                PollPendingRequests();
            }
        }
#endif

        /// <summary>
        /// Send an HTTP request asynchronously using UnityWebRequest.
        /// The callback is invoked on the main thread when the request completes.
        /// Called from TypeScript fetch polyfill.
        /// </summary>
        public static void SendRequestAsync(string url, string method, string headersJson, string body, Action<string> callback)
        {
            try
            {
                UnityWebRequest request;

                // Create request based on method
                var upperMethod = method.ToUpperInvariant();
                if (upperMethod == "GET")
                {
                    request = UnityWebRequest.Get(url);
                }
                else if (upperMethod == "POST" || upperMethod == "PUT" || upperMethod == "PATCH")
                {
                    byte[] bodyBytes = null;
                    if (!string.IsNullOrEmpty(body))
                    {
                        bodyBytes = Encoding.UTF8.GetBytes(body);
                    }

                    request = new UnityWebRequest(url, upperMethod);
                    if (bodyBytes != null)
                    {
                        request.uploadHandler = new UploadHandlerRaw(bodyBytes);
                    }
                    request.downloadHandler = new DownloadHandlerBuffer();

                    // Set content type
                    string contentType = "application/json";
                    var parsedHeaders = ParseHeadersJson(headersJson);
                    if (parsedHeaders.TryGetValue("content-type", out string ct))
                    {
                        contentType = ct;
                    }
                    request.SetRequestHeader("Content-Type", contentType);
                }
                else if (upperMethod == "DELETE")
                {
                    request = UnityWebRequest.Delete(url);
                    request.downloadHandler = new DownloadHandlerBuffer();
                }
                else if (upperMethod == "HEAD")
                {
                    request = UnityWebRequest.Head(url);
                }
                else
                {
                    request = new UnityWebRequest(url, upperMethod);
                    request.downloadHandler = new DownloadHandlerBuffer();
                }

                // Set custom headers
                if (!string.IsNullOrEmpty(headersJson) && headersJson != "{}")
                {
                    SetRequestHeaders(request, headersJson);
                }

                // Set timeout
                request.timeout = 120;

                // Send the request (non-blocking)
                var operation = request.SendWebRequest();

                // Register for polling
                var pending = new PendingRequest
                {
                    operation = operation,
                    callback = callback,
                    url = url
                };

                pendingRequests.Add(pending);
                StartPolling();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[HttpBridge] Request setup failed: {ex.Message}");
                callback?.Invoke($"{{\"status\":0,\"statusText\":\"{EscapeJsonString(ex.Message)}\",\"headers\":{{}},\"body\":\"\"}}");
            }
        }

        /// <summary>
        /// Start polling if not already.
        /// Editor: EditorApplication.update; Runtime: MonoBehaviour.Update via hidden runner.
        /// </summary>
        private static void StartPolling()
        {
            if (isPolling) return;
            isPolling = true;
#if UNITY_EDITOR
            EditorApplication.update += PollPendingRequests;
#else
            // Accessing Instance ensures the runner GameObject is created and Update() runs
            var _ = HttpBridgeRunner.Instance;
#endif
        }

        /// <summary>
        /// Stop polling when no more pending requests.
        /// </summary>
        private static void StopPolling()
        {
            if (!isPolling) return;
            isPolling = false;
#if UNITY_EDITOR
            EditorApplication.update -= PollPendingRequests;
#endif
            // In Runtime, the runner Update() will simply find no pending requests and no-op
        }

        /// <summary>
        /// Called every frame to check if any pending requests have completed.
        /// All callbacks are invoked on the main thread.
        /// </summary>
        private static void PollPendingRequests()
        {
            if (pendingRequests.Count == 0) return;

            // Iterate in reverse so we can safely remove completed entries
            for (int i = pendingRequests.Count - 1; i >= 0; i--)
            {
                var pending = pendingRequests[i];

                if (!pending.operation.isDone)
                    continue;

                // Remove from list first
                pendingRequests.RemoveAt(i);

                // Process the completed request on the main thread
                try
                {
                    var request = pending.operation.webRequest;

                    if (request.result == UnityWebRequest.Result.ConnectionError ||
                        request.result == UnityWebRequest.Result.ProtocolError ||
                        request.result == UnityWebRequest.Result.DataProcessingError)
                    {
                        // For protocol errors, we still have status code and possibly a body
                        if (request.result == UnityWebRequest.Result.ProtocolError)
                        {
                            string responseBody = request.downloadHandler?.text ?? "";
                            var responseHeaders = BuildResponseHeaders(request);

                            var sb = new StringBuilder();
                            sb.Append("{");
                            sb.Append($"\"status\":{(int)request.responseCode},");
                            sb.Append($"\"statusText\":\"{EscapeJsonString(request.error ?? "")}\",");
                            AppendHeaders(sb, responseHeaders);
                            sb.Append($"\"body\":{ToJsonStringLiteral(responseBody)}");
                            sb.Append("}");

                            pending.callback?.Invoke(sb.ToString());
                        }
                        else
                        {
                            Debug.LogError($"[HttpBridge] Request failed: {request.error}");
                            pending.callback?.Invoke($"{{\"status\":0,\"statusText\":\"{EscapeJsonString(request.error ?? "Unknown error")}\",\"headers\":{{}},\"body\":\"\"}}");
                        }
                    }
                    else
                    {
                        // Success
                        string responseBody = request.downloadHandler?.text ?? "";
                        var responseHeaders = BuildResponseHeaders(request);

                        var sb = new StringBuilder();
                        sb.Append("{");
                        sb.Append($"\"status\":{(int)request.responseCode},");
                        sb.Append($"\"statusText\":\"OK\",");
                        AppendHeaders(sb, responseHeaders);
                        sb.Append($"\"body\":{ToJsonStringLiteral(responseBody)}");
                        sb.Append("}");

                        pending.callback?.Invoke(sb.ToString());
                    }

                    // Dispose the UnityWebRequest
                    request.Dispose();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[HttpBridge] Error processing response: {ex.Message}");
                    pending.callback?.Invoke($"{{\"status\":0,\"statusText\":\"{EscapeJsonString(ex.Message)}\",\"headers\":{{}},\"body\":\"\"}}");
                }
            }

            // Stop polling if no more pending requests
            if (pendingRequests.Count == 0)
            {
                StopPolling();
            }
        }

        /// <summary>
        /// Build response headers dictionary from UnityWebRequest.
        /// </summary>
        private static Dictionary<string, string> BuildResponseHeaders(UnityWebRequest request)
        {
            var headers = new Dictionary<string, string>();
            var responseHeaders = request.GetResponseHeaders();
            if (responseHeaders != null)
            {
                foreach (var kv in responseHeaders)
                {
                    headers[kv.Key.ToLower()] = kv.Value;
                }
            }
            return headers;
        }

        /// <summary>
        /// Append headers JSON object to a StringBuilder.
        /// </summary>
        private static void AppendHeaders(StringBuilder sb, Dictionary<string, string> headers)
        {
            sb.Append("\"headers\":{");
            bool first = true;
            foreach (var kv in headers)
            {
                if (!first) sb.Append(",");
                sb.Append($"\"{EscapeJsonString(kv.Key)}\":\"{EscapeJsonString(kv.Value)}\"");
                first = false;
            }
            sb.Append("},");
        }

        /// <summary>
        /// Parse a JSON headers string into a dictionary.
        /// Simple parser for {"key":"value",...} format.
        /// </summary>
        private static Dictionary<string, string> ParseHeadersJson(string json)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrEmpty(json) || json == "{}")
                return result;

            try
            {
                json = json.Trim();
                if (json.StartsWith("{")) json = json.Substring(1);
                if (json.EndsWith("}")) json = json.Substring(0, json.Length - 1);

                int i = 0;
                while (i < json.Length)
                {
                    while (i < json.Length && (json[i] == ' ' || json[i] == ',' || json[i] == '\n' || json[i] == '\r' || json[i] == '\t'))
                        i++;

                    if (i >= json.Length) break;

                    string key = ParseJsonString(json, ref i);
                    if (key == null) break;

                    while (i < json.Length && (json[i] == ' ' || json[i] == ':'))
                        i++;

                    string value = ParseJsonString(json, ref i);
                    if (value == null) break;

                    result[key] = value;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[HttpBridge] Failed to parse headers JSON: {ex.Message}");
            }

            return result;
        }

        private static string ParseJsonString(string json, ref int i)
        {
            if (i >= json.Length || json[i] != '"')
                return null;

            i++; // skip opening quote
            var sb = new StringBuilder();

            while (i < json.Length)
            {
                if (json[i] == '\\' && i + 1 < json.Length)
                {
                    i++;
                    switch (json[i])
                    {
                        case '"': sb.Append('"'); break;
                        case '\\': sb.Append('\\'); break;
                        case '/': sb.Append('/'); break;
                        case 'n': sb.Append('\n'); break;
                        case 'r': sb.Append('\r'); break;
                        case 't': sb.Append('\t'); break;
                        default: sb.Append(json[i]); break;
                    }
                }
                else if (json[i] == '"')
                {
                    i++; // skip closing quote
                    return sb.ToString();
                }
                else
                {
                    sb.Append(json[i]);
                }
                i++;
            }

            return sb.ToString();
        }

        private static void SetRequestHeaders(UnityWebRequest request, string headersJson)
        {
            var headers = ParseHeadersJson(headersJson);
            foreach (var kv in headers)
            {
                string key = kv.Key.ToLower();

                // Skip headers that UnityWebRequest manages internally
                if (key == "content-type" || key == "content-length" || key == "content-encoding"
                    || key == "accept-encoding" || key == "host" || key == "connection")
                    continue;

                try
                {
                    request.SetRequestHeader(kv.Key, kv.Value);
                }
                catch (Exception)
                {
                    // Ignore invalid headers
                }
            }
        }

        private static string EscapeJsonString(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";

            var sb = new StringBuilder(str.Length);
            foreach (char c in str)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    default:
                        if (c < 0x20)
                            sb.Append($"\\u{(int)c:x4}");
                        else
                            sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }

        private static string ToJsonStringLiteral(string str)
        {
            if (str == null) return "\"\"";
            return $"\"{EscapeJsonString(str)}\"";
        }
    }
}
