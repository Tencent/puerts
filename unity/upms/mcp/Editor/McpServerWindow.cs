using System;
using UnityEditor;
using UnityEngine;
using PuertsMcp;

namespace PuertsMcp.Editor
{
    /// <summary>
    /// Editor window for managing the MCP Server lifecycle.
    /// Provides a simple UI to configure and start/stop the MCP Server.
    /// Handles domain reload gracefully: shuts down before reload and auto-restarts after.
    /// </summary>
    public class McpServerWindow : EditorWindow
    {
        // Global singleton state — survives window close and play mode changes
        private static McpScriptManager s_scriptManager;
        private static bool s_isStarting;
        private static string s_statusMessage = "Stopped";
        private static int s_activePort;

        // Settings (per-instance for UI editing, synced from EditorPrefs)
        private int port = 3100;

        // Resource root is fixed and not user-configurable
        private const string ResourceRoot = "LLMAgent/editor-assistant";

        // EditorPrefs keys
        private const string PrefKeyPort = "PuertsMcp_Port";

        // SessionState key — persists across domain reloads within the same Editor session,
        // but resets when the Editor is closed.
        private const string SessionKeyWasRunning = "PuertsMcp_WasRunning";

        [MenuItem("PuertsEditorAssistant/MCP Server")]
        public static void ShowWindow()
        {
            var window = GetWindow<McpServerWindow>("MCP Server");
            window.minSize = new Vector2(360, 220);
            window.Show();
        }

        /// <summary>
        /// Static initializer: register domain reload events and handle auto-restart.
        /// InitializeOnLoadMethod ensures this runs after every domain reload.
        /// </summary>
        [InitializeOnLoadMethod]
        private static void OnDomainLoaded()
        {
            // Register for the NEXT domain reload — shut down cleanly before it happens
            AssemblyReloadEvents.beforeAssemblyReload += OnBeforeAssemblyReload;

            // Check if we were running before the reload and auto-restart
            if (SessionState.GetBool(SessionKeyWasRunning, false))
            {
                // Delay slightly to ensure all editor systems are ready
                EditorApplication.delayCall += AutoRestartAfterReload;
            }
        }

        /// <summary>
        /// Called just before a domain reload. Shut down the server so the port is released
        /// and clients get an immediate connection close instead of hanging.
        /// </summary>
        private static void OnBeforeAssemblyReload()
        {
            bool wasRunning = IsRunning || s_isStarting;

            if (s_scriptManager != null)
            {
                Debug.Log("[McpServerWindow] Domain reload detected — shutting down MCP Server...");
                try
                {
                    s_scriptManager.Shutdown();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[McpServerWindow] Error during pre-reload shutdown: {ex.Message}");
                }
                s_scriptManager = null;
            }

            s_isStarting = false;
            s_statusMessage = "Stopped (domain reload)";

            // Remember whether to restart after reload
            SessionState.SetBool(SessionKeyWasRunning, wasRunning);
        }

        /// <summary>
        /// Auto-restart the server after a domain reload if it was previously running.
        /// </summary>
        private static void AutoRestartAfterReload()
        {
            // Double-check we're not already running
            if (IsRunning || s_isStarting) return;

            int port = EditorPrefs.GetInt(PrefKeyPort, 3100);

            Debug.Log($"[McpServerWindow] Auto-restarting MCP Server after domain reload (port {port})...");

            s_isStarting = true;
            s_statusMessage = "Restarting after domain reload...";
            s_activePort = port;

            Application.runInBackground = true;

            s_scriptManager = new McpScriptManager();
            s_scriptManager.Initialize(ResourceRoot, port, (bool success) =>
            {
                s_isStarting = false;
                if (success)
                {
                    s_statusMessage = $"Running on port {s_activePort}";
                    Debug.Log($"[McpServerWindow] MCP Server auto-restarted successfully on port {port}.");
                }
                else
                {
                    s_statusMessage = "Failed to restart. Check Console for details.";
                    Debug.LogError("[McpServerWindow] MCP Server failed to auto-restart after domain reload.");
                    // Clear the flag so we don't keep retrying on subsequent reloads
                    SessionState.SetBool(SessionKeyWasRunning, false);
                }

                // Repaint any open window
                var window = GetWindowIfOpen();
                if (window != null) window.Repaint();
            });
        }

        /// <summary>
        /// Helper to get the window instance without creating one.
        /// </summary>
        private static McpServerWindow GetWindowIfOpen()
        {
            var windows = Resources.FindObjectsOfTypeAll<McpServerWindow>();
            return windows.Length > 0 ? windows[0] : null;
        }

        private void OnEnable()
        {
            LoadSettings();
        }

        private void LoadSettings()
        {
            port = EditorPrefs.GetInt(PrefKeyPort, 3100);
        }

        private void SaveSettings()
        {
            EditorPrefs.SetInt(PrefKeyPort, port);
        }

        private static bool IsRunning => s_scriptManager != null && s_scriptManager.IsInitialized;

        private void OnGUI()
        {
            GUILayout.Space(10);
            EditorGUILayout.LabelField("MCP Server", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            // --- Settings ---
            EditorGUI.BeginDisabledGroup(IsRunning || s_isStarting);

            EditorGUILayout.LabelField("Port", EditorStyles.miniLabel);
            port = EditorGUILayout.IntField(port);
            if (port < 1 || port > 65535) port = 3100;

            EditorGUI.EndDisabledGroup();

            EditorGUILayout.Space(10);

            // --- Start / Stop ---
            EditorGUILayout.BeginHorizontal();

            if (!IsRunning && !s_isStarting)
            {
                if (GUILayout.Button("Start Server", GUILayout.Height(30)))
                {
                    StartServer();
                }
            }
            else if (s_isStarting)
            {
                EditorGUI.BeginDisabledGroup(true);
                GUILayout.Button("Starting...", GUILayout.Height(30));
                EditorGUI.EndDisabledGroup();
            }
            else
            {
                if (GUILayout.Button("Stop Server", GUILayout.Height(30)))
                {
                    ShutdownServer();
                }
            }

            EditorGUILayout.EndHorizontal();

            EditorGUILayout.Space(10);

            // --- Status ---
            EditorGUILayout.LabelField("Status", EditorStyles.miniLabel);
            var color = IsRunning ? Color.green : (s_isStarting ? Color.yellow : Color.gray);
            var prevColor = GUI.contentColor;
            GUI.contentColor = color;
            EditorGUILayout.LabelField(s_statusMessage, EditorStyles.wordWrappedLabel);
            GUI.contentColor = prevColor;

            if (IsRunning)
            {
                EditorGUILayout.Space(5);
                EditorGUILayout.LabelField("Endpoint", EditorStyles.miniLabel);
                var endpoint = $"http://127.0.0.1:{s_activePort}/mcp";
                EditorGUILayout.SelectableLabel(endpoint, EditorStyles.textField, GUILayout.Height(18));
            }

            // Show error if any
            if (s_scriptManager != null && !string.IsNullOrEmpty(s_scriptManager.LastError))
            {
                EditorGUILayout.Space(5);
                EditorGUILayout.HelpBox(s_scriptManager.LastError, MessageType.Error);
            }
        }

        private void StartServer()
        {
            if (IsRunning || s_isStarting) return;

            SaveSettings();
            s_isStarting = true;
            s_statusMessage = "Starting...";
            s_activePort = port;

            // Ensure the server keeps running when Unity is in the background
            Application.runInBackground = true;

            s_scriptManager = new McpScriptManager();
            s_scriptManager.Initialize(ResourceRoot, port, (bool success) =>
            {
                s_isStarting = false;
                if (success)
                {
                    s_statusMessage = $"Running on port {s_activePort}";
                    // Mark as running so domain reload can auto-restart
                    SessionState.SetBool(SessionKeyWasRunning, true);
                }
                else
                {
                    s_statusMessage = "Failed to start. Check Console for details.";
                    SessionState.SetBool(SessionKeyWasRunning, false);
                }
                Repaint();
            });

            Repaint();
        }

        private void ShutdownServer()
        {
            s_isStarting = false;

            if (s_scriptManager != null)
            {
                s_scriptManager.Shutdown();
                s_scriptManager = null;
            }

            s_statusMessage = "Stopped";
            // Clear auto-restart flag — user explicitly stopped
            SessionState.SetBool(SessionKeyWasRunning, false);
            Repaint();
        }
    }
}
