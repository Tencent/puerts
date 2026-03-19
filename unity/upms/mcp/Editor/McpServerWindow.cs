using System;
using UnityEditor;
using UnityEngine;
using PuertsMcp;

namespace PuertsMcp.Editor
{
    /// <summary>
    /// Editor window for managing the MCP Server lifecycle.
    /// Provides a simple UI to configure and start/stop the MCP Server.
    /// </summary>
    public class McpServerWindow : EditorWindow
    {
        private McpScriptManager scriptManager;

        // Settings
        private int port = 3100;
        private string resourceRoot = "LLMAgent/editor-assistant";

        // EditorPrefs keys
        private const string PrefKeyPort = "PuertsMcp_Port";
        private const string PrefKeyResourceRoot = "PuertsMcp_ResourceRoot";

        // State
        private bool isStarting;
        private string statusMessage = "Stopped";

        [MenuItem("PuerTS/MCP Server")]
        public static void ShowWindow()
        {
            var window = GetWindow<McpServerWindow>("MCP Server");
            window.minSize = new Vector2(360, 220);
            window.Show();
        }

        private void OnEnable()
        {
            LoadSettings();
            // Auto-cleanup on Play Mode change
            EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
        }

        private void OnDisable()
        {
            EditorApplication.playModeStateChanged -= OnPlayModeStateChanged;
        }

        private void OnDestroy()
        {
            ShutdownServer();
        }

        private void LoadSettings()
        {
            port = EditorPrefs.GetInt(PrefKeyPort, 3100);
            resourceRoot = EditorPrefs.GetString(PrefKeyResourceRoot, "LLMAgent/editor-assistant");
        }

        private void SaveSettings()
        {
            EditorPrefs.SetInt(PrefKeyPort, port);
            EditorPrefs.SetString(PrefKeyResourceRoot, resourceRoot);
        }

        private void OnPlayModeStateChanged(PlayModeStateChange state)
        {
            // Shutdown when entering or exiting Play Mode to avoid stale ScriptEnv
            if (state == PlayModeStateChange.ExitingEditMode ||
                state == PlayModeStateChange.ExitingPlayMode)
            {
                ShutdownServer();
            }
        }

        private bool IsRunning => scriptManager != null && scriptManager.IsInitialized;

        private void OnGUI()
        {
            GUILayout.Space(10);
            EditorGUILayout.LabelField("MCP Server", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            // --- Settings ---
            EditorGUI.BeginDisabledGroup(IsRunning || isStarting);

            EditorGUILayout.LabelField("Resource Root", EditorStyles.miniLabel);
            resourceRoot = EditorGUILayout.TextField(resourceRoot);
            EditorGUILayout.Space(3);

            EditorGUILayout.LabelField("Port", EditorStyles.miniLabel);
            port = EditorGUILayout.IntField(port);
            if (port < 1 || port > 65535) port = 3100;

            EditorGUI.EndDisabledGroup();

            EditorGUILayout.Space(10);

            // --- Start / Stop ---
            EditorGUILayout.BeginHorizontal();

            if (!IsRunning && !isStarting)
            {
                if (GUILayout.Button("Start Server", GUILayout.Height(30)))
                {
                    StartServer();
                }
            }
            else if (isStarting)
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
            var color = IsRunning ? Color.green : (isStarting ? Color.yellow : Color.gray);
            var prevColor = GUI.contentColor;
            GUI.contentColor = color;
            EditorGUILayout.LabelField(statusMessage, EditorStyles.wordWrappedLabel);
            GUI.contentColor = prevColor;

            if (IsRunning)
            {
                EditorGUILayout.Space(5);
                EditorGUILayout.LabelField("Endpoint", EditorStyles.miniLabel);
                var endpoint = $"http://127.0.0.1:{port}/sse";
                EditorGUILayout.SelectableLabel(endpoint, EditorStyles.textField, GUILayout.Height(18));
            }

            // Show error if any
            if (scriptManager != null && !string.IsNullOrEmpty(scriptManager.LastError))
            {
                EditorGUILayout.Space(5);
                EditorGUILayout.HelpBox(scriptManager.LastError, MessageType.Error);
            }
        }

        private void StartServer()
        {
            if (IsRunning || isStarting) return;

            SaveSettings();
            isStarting = true;
            statusMessage = "Starting...";

            scriptManager = new McpScriptManager();
            scriptManager.Initialize(resourceRoot, port, () =>
            {
                isStarting = false;
                if (scriptManager != null && scriptManager.IsInitialized)
                {
                    statusMessage = $"Running on port {port}";
                }
                else
                {
                    statusMessage = "Failed to start. Check Console for details.";
                }
                Repaint();
            });

            Repaint();
        }

        private void ShutdownServer()
        {
            isStarting = false;

            if (scriptManager != null)
            {
                scriptManager.Shutdown();
                scriptManager = null;
            }

            statusMessage = "Stopped";
            Repaint();
        }
    }
}
