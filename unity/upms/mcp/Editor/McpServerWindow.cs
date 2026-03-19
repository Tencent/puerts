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
        // Global singleton state — survives window close and play mode changes
        private static McpScriptManager s_scriptManager;
        private static bool s_isStarting;
        private static string s_statusMessage = "Stopped";
        private static int s_activePort;

        // Settings (per-instance for UI editing, synced from EditorPrefs)
        private int port = 3100;
        private string resourceRoot = "LLMAgent/editor-assistant";

        // EditorPrefs keys
        private const string PrefKeyPort = "PuertsMcp_Port";
        private const string PrefKeyResourceRoot = "PuertsMcp_ResourceRoot";

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

        private static bool IsRunning => s_scriptManager != null && s_scriptManager.IsInitialized;

        private void OnGUI()
        {
            GUILayout.Space(10);
            EditorGUILayout.LabelField("MCP Server", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            // --- Settings ---
            EditorGUI.BeginDisabledGroup(IsRunning || s_isStarting);

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
                var endpoint = $"http://127.0.0.1:{s_activePort}/sse";
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
            s_scriptManager.Initialize(resourceRoot, port, () =>
            {
                s_isStarting = false;
                if (s_scriptManager != null && s_scriptManager.IsInitialized)
                {
                    s_statusMessage = $"Running on port {s_activePort}";
                }
                else
                {
                    s_statusMessage = "Failed to start. Check Console for details.";
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
            Repaint();
        }
    }
}
