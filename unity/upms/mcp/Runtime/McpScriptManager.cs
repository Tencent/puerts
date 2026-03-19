using System;
using UnityEngine;
using Puerts;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace PuertsMcp
{
    /// <summary>
    /// Manages PuerTS Node.js ScriptEnv lifecycle for the MCP Server.
    /// Uses BackendNodeJS to get full Node.js API support (http, streams, etc.).
    /// </summary>
    public class McpScriptManager : IDisposable
    {
        private ScriptEnv scriptEnv;
        private bool isInitialized;
        private bool isTicking;
        private string lastError;

        // TS function delegates
        private Action<string, int, Action> onInitialize;
        private Action onShutdown;

        private const string EntryModule = "McpServer/main.cjs";

        /// <summary>
        /// Whether the MCP Server TS module has been successfully loaded and the server is running.
        /// </summary>
        public bool IsInitialized => isInitialized;

        /// <summary>
        /// Last error message if initialization failed.
        /// </summary>
        public string LastError => lastError;

        /// <summary>
        /// Initialize ScriptEnv with Node.js backend and start the MCP Server.
        /// </summary>
        /// <param name="resourceRoot">Resource root path passed to TS onInitialize (e.g. "LLMAgent/editor-assistant").</param>
        /// <param name="port">TCP port for the MCP HTTP Server (default 3100).</param>
        /// <param name="onReady">Optional callback invoked when the MCP Server is ready to accept connections.</param>
        public void Initialize(string resourceRoot, int port = 3100, Action onReady = null)
        {
            if (isInitialized)
            {
                Debug.LogWarning("[McpScriptManager] Already initialized. Call Shutdown() first.");
                return;
            }

            try
            {
                scriptEnv = new ScriptEnv(new BackendNodeJS());

                // Load the CJS bundle via require() — node:xxx built-ins work with require()
                // but fail with ESM import in PuerTS.
                // Use the UPM package path to locate the bundled CJS file.
                var resourcePath = System.IO.Path.GetFullPath("Packages/com.puerts.mcp/Resources/" + EntryModule);
                // Normalise to forward slashes so Node.js require() can resolve it
                var fullPath = resourcePath.Replace("\\", "/");
                ScriptObject moduleExports = scriptEnv.Eval<ScriptObject>(
                    $"require('{fullPath}')"
                );

                // Get exported functions from CJS module
                onInitialize = moduleExports.Get<Action<string, int, Action>>("onInitialize");
                onShutdown = moduleExports.Get<Action>("onShutdown");

                if (onInitialize == null)
                {
                    lastError = "[McpScriptManager] Failed to get 'onInitialize' export from module.";
                    Debug.LogError(lastError);
                    return;
                }

                // Start ticking ScriptEnv immediately (needed for JS microtask/promise processing)
                StartTicking();

                // Trigger async initialization: load builtins + start HTTP server
                onInitialize(resourceRoot, port, () =>
                {
                    isInitialized = true;
                    lastError = null;
                    Debug.Log($"[McpScriptManager] MCP Server initialized and listening on port {port}.");
                    onReady?.Invoke();
                });
            }
            catch (Exception ex)
            {
                lastError = $"[McpScriptManager] Failed to initialize: {ex.Message}";
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
        /// Called every frame to process pending JS microtasks.
        /// </summary>
        private void Tick()
        {
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
            isInitialized = false;

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
