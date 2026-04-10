using System;
using UnityEngine;
using Puerts;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace PuertsMcp
{
    /// <summary>
    /// Manages PuerTS V8 ScriptEnv lifecycle for the MCP Server.
    /// Uses the default V8 backend (no Node.js dependency).
    /// HTTP serving is handled by C# McpHttpServer.
    /// </summary>
    public class McpScriptManager : IDisposable
    {
        private ScriptEnv scriptEnv;
        private McpHttpServer httpServer;
        private bool isInitialized;
        private bool isTicking;
        private string lastError;

        // TS function delegates
        private Action<string, object, Action<bool, string>> onInitialize;
        private Action onShutdown;
        private Action<string, string, string, string> handleHttpPost;
        private Action<string> handleHttpDelete;

        private const string EntryModule = "McpServer/main.mjs";

        /// <summary>
        /// Whether the MCP Server TS module has been successfully loaded and the server is running.
        /// </summary>
        public bool IsInitialized => isInitialized;

        /// <summary>
        /// Last error message if initialization failed.
        /// </summary>
        public string LastError => lastError;

        /// <summary>
        /// Initialize ScriptEnv with V8 backend and start the MCP Server.
        /// </summary>
        /// <param name="resourceRoot">Resource root path passed to TS onInitialize (e.g. "LLMAgent/editor-assistant").</param>
        /// <param name="port">TCP port for the MCP HTTP Server (default 3100).</param>
        /// <param name="onReady">Optional callback invoked when the MCP Server startup completes. Bool arg indicates success.</param>
        public void Initialize(string resourceRoot, int port = 3100, Action<bool> onReady = null)
        {
            if (isInitialized)
            {
                Debug.LogWarning("[McpScriptManager] Already initialized. Call Shutdown() first.");
                return;
            }

            try
            {
                scriptEnv = new ScriptEnv(new BackendV8());

                ScriptObject moduleExports = scriptEnv.ExecuteModule(EntryModule);

                // Get exported functions from ESM module
                onInitialize = moduleExports.Get<Action<string, object, Action<bool, string>>>("onInitialize");
                onShutdown = moduleExports.Get<Action>("onShutdown");
                handleHttpPost = moduleExports.Get<Action<string, string, string, string>>("handleHttpPost");
                handleHttpDelete = moduleExports.Get<Action<string>>("handleHttpDelete");

                if (onInitialize == null)
                {
                    lastError = "[McpScriptManager] Failed to get 'onInitialize' export from module.";
                    Debug.LogError(lastError);
                    return;
                }

                // Start ticking ScriptEnv immediately (needed for JS microtask/promise processing)
                StartTicking();

                // Create and start the C# HTTP server
                httpServer = new McpHttpServer(port);

                // Wire up HTTP callbacks to JS handlers
                httpServer.OnHttpPost = (requestContextId, method, body, sessionIdHeader) =>
                {
                    // This is called from a background thread — we need to dispatch to the main thread
                    // so that JS execution happens on the main thread where ScriptEnv lives.
                    EnqueueMainThread(() =>
                    {
                        try
                        {
                            if (!isInitialized)
                            {
                                // JS async initialization not yet complete — return 503 so the client retries.
                                httpServer?.SendJsonResponse(requestContextId, 503,
                                    "{\"jsonrpc\":\"2.0\",\"error\":{\"code\":-32000,\"message\":\"Server is starting, please retry\"},\"id\":null}");
                                return;
                            }
                            handleHttpPost?.Invoke(requestContextId, method, body, sessionIdHeader);
                        }
                        catch (Exception ex)
                        {
                            Debug.LogError($"[McpScriptManager] Error in handleHttpPost: {ex.Message}");
                        }
                    });
                };

                httpServer.OnHttpDelete = (sessionId) =>
                {
                    EnqueueMainThread(() =>
                    {
                        try
                        {
                            handleHttpDelete?.Invoke(sessionId);
                        }
                        catch (Exception ex)
                        {
                            Debug.LogError($"[McpScriptManager] Error in handleHttpDelete: {ex.Message}");
                        }
                    });
                };

                httpServer.Start();

                // Trigger async initialization: load builtins + connect MCP server to bridge transport
                // Pass the httpServer as the C# bridge object
                onInitialize(resourceRoot, httpServer, (bool success, string errorMsg) =>
                {
                    if (success)
                    {
                        isInitialized = true;
                        lastError = null;
                        Debug.Log($"[McpScriptManager] MCP Server initialized and listening on port {port}.");
                    }
                    else
                    {
                        isInitialized = false;
                        lastError = $"[McpScriptManager] Server failed to start: {errorMsg}";
                        Debug.LogError(lastError);
                    }
                    onReady?.Invoke(success);
                });
            }
            catch (Exception ex)
            {
                lastError = $"[McpScriptManager] Failed to initialize: {ex.Message} {ex.StackTrace}";
                Debug.LogError(lastError);
                isInitialized = false;
            }
        }

        /// <summary>
        /// Shut down the MCP Server and release all resources.
        /// </summary>
        public void Shutdown()
        {
            if (!isInitialized && scriptEnv == null)
                return;

            try
            {
                onShutdown?.Invoke();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[McpScriptManager] Error calling onShutdown: {ex.Message}");
            }

            Dispose();
        }

        // -------------------------------------------------------------------
        // Main-thread dispatch queue
        // -------------------------------------------------------------------

        private readonly System.Collections.Concurrent.ConcurrentQueue<Action> _mainThreadQueue
            = new System.Collections.Concurrent.ConcurrentQueue<Action>();

        private void EnqueueMainThread(Action action)
        {
            _mainThreadQueue.Enqueue(action);
        }

        private void DrainMainThreadQueue()
        {
            while (_mainThreadQueue.TryDequeue(out var action))
            {
                try
                {
                    action();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[McpScriptManager] Main thread action error: {ex.Message}");
                }
            }
        }

        // -------------------------------------------------------------------
        // Ticking
        // -------------------------------------------------------------------

        /// <summary>
        /// Start ticking the ScriptEnv to process JS microtasks.
        /// </summary>
        private void StartTicking()
        {
            if (isTicking) return;
            isTicking = true;
#if UNITY_EDITOR
            EditorApplication.update += Tick;
#else
            var go = new GameObject("[McpScriptEnvTicker]");
            go.hideFlags = HideFlags.HideAndDontSave;
            UnityEngine.Object.DontDestroyOnLoad(go);
            var ticker = go.AddComponent<ScriptEnvTicker>();
            ticker.onTick = Tick;
            _tickerGo = go;
#endif
        }

        /// <summary>
        /// Stop ticking.
        /// </summary>
        private void StopTicking()
        {
            if (!isTicking) return;
            isTicking = false;
#if UNITY_EDITOR
            EditorApplication.update -= Tick;
#else
            if (_tickerGo != null)
            {
                UnityEngine.Object.Destroy(_tickerGo);
                _tickerGo = null;
            }
#endif
        }

        /// <summary>
        /// Called every frame to process pending JS microtasks and main-thread actions.
        /// </summary>
        private void Tick()
        {
            // First drain the main-thread queue (HTTP requests dispatched from background threads)
            DrainMainThreadQueue();

            // Then tick the JS engine
            if (scriptEnv != null)
            {
                try
                {
                    scriptEnv.Tick();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[McpScriptManager] Tick error: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Release ScriptEnv resources.
        /// </summary>
        public void Dispose()
        {
            StopTicking();

            onInitialize = null;
            onShutdown = null;
            handleHttpPost = null;
            handleHttpDelete = null;
            isInitialized = false;

            // Stop the C# HTTP server
            if (httpServer != null)
            {
                try
                {
                    httpServer.Dispose();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpScriptManager] Error disposing HttpServer: {ex.Message}");
                }
                httpServer = null;
            }

            if (scriptEnv != null)
            {
                try
                {
                    scriptEnv.Dispose();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpScriptManager] Error disposing ScriptEnv: {ex.Message}");
                }
                scriptEnv = null;
            }
        }

        /// <summary>
        /// Resolve the physical path of a resource file inside the com.puerts.mcp package.
        /// Supports all UPM installation methods: local (file:), Git URL, embedded, and tarball.
        /// In the Editor, uses PackageInfo API for reliable resolution.
        /// At runtime, falls back to the simple Packages/ virtual path.
        /// </summary>
        private static string ResolvePackageResourcePath(string relativeResourcePath)
        {
            const string packageName = "com.tencent.puerts.mcp";
            const string resourceFolder = "Resources";

#if UNITY_EDITOR
            var packageInfo = UnityEditor.PackageManager.PackageInfo.FindForAssetPath($"Packages/{packageName}");
            if (packageInfo != null)
            {
                var resolvedPath = System.IO.Path.Combine(packageInfo.resolvedPath, resourceFolder, relativeResourcePath);
                if (System.IO.File.Exists(resolvedPath))
                {
                    return resolvedPath;
                }
                Debug.LogWarning($"[McpScriptManager] File not found at resolved path: {resolvedPath}, falling back to virtual path.");
            }
#endif
            return System.IO.Path.GetFullPath($"Packages/{packageName}/{resourceFolder}/{relativeResourcePath}");
        }

#if !UNITY_EDITOR
        private GameObject _tickerGo;

        /// <summary>
        /// Hidden MonoBehaviour singleton for Runtime ScriptEnv ticking.
        /// </summary>
        private class ScriptEnvTicker : MonoBehaviour
        {
            public Action onTick;

            private void Update()
            {
                onTick?.Invoke();
            }
        }
#endif
    }
}
