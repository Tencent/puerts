using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using LLMAgent;

namespace LLMAgent.Editor
{
    /// <summary>
    /// Editor window providing a polished chat interface for the LLM Agent.
    /// </summary>
    public class AgentChatWindow : EditorWindow
    {
        private AgentScriptManager scriptManager;
        private string inputText = "";
        private Vector2 scrollPosition;
        private readonly List<ChatMessage> messages = new List<ChatMessage>();
        private bool shouldScrollToBottom;
        private bool isWaitingForResponse;

        // Image attachment
        private string attachedImagePath = null;
        private Texture2D attachedImagePreviewTex = null;

        // Settings
        private bool showSettings;
        private string apiKey = "";
        private string baseURL = "";
        private string model = "gpt-4o-mini";

        // EditorPrefs keys for persistence
        private const string PrefKeyApiKey = "LLMAgent_ApiKey";
        private const string PrefKeyBaseURL = "LLMAgent_BaseURL";
        private const string PrefKeyModel = "LLMAgent_Model";

        private const string InputControlName = "AgentChatInput";

        // Cached styles (rebuilt on demand)
        private bool stylesInitialized;
        private GUIStyle headerStyle;
        private GUIStyle statusDotStyle;
        private GUIStyle userBubbleStyle;
        private GUIStyle agentBubbleStyle;
        private GUIStyle userLabelStyle;
        private GUIStyle agentLabelStyle;
        private GUIStyle timestampStyle;
        private GUIStyle inputFieldStyle;
        private GUIStyle sendButtonStyle;
        private GUIStyle stopButtonStyle;
        private GUIStyle clearButtonStyle;
        private GUIStyle welcomeStyle;
        private GUIStyle welcomeSubStyle;
        private GUIStyle inputAreaStyle;
        private GUIStyle settingsPanelStyle;
        private GUIStyle settingsLabelStyle;
        private GUIStyle settingsFieldStyle;

        // Cached textures
        private Texture2D settingsBgTex;
        private Texture2D userBubbleTex;
        private Texture2D agentBubbleTex;
        private Texture2D headerBgTex;
        private Texture2D inputAreaBgTex;
        private Texture2D sendBtnNormalTex;
        private Texture2D sendBtnHoverTex;
        private Texture2D stopBtnNormalTex;
        private Texture2D stopBtnHoverTex;
        private Texture2D inputFieldBgTex;
        private Texture2D copyBtnNormalTex;
        private Texture2D copyBtnHoverTex;

        // Copy feedback state
        private int copiedMessageIndex = -1;
        private double copiedMessageTime;

        /// <summary>
        /// Represents a single chat message.
        /// </summary>
        private struct ChatMessage
        {
            public string Text;
            public bool IsUser;
            public string Timestamp;
            public string ImagePath; // optional: path to attached image
            public bool ShowRetryButton;    // true when an error occurred (e.g. timeout)
            public string RetryUserMessage; // original user message for retry
            public string RetryImagePath;   // original image path for retry
        }

        private const string ERROR_PREFIX = "[Agent] Error:";

        /// <summary>
        /// Index of the in-progress agent bubble that receives live updates.
        /// -1 means no active progress bubble.
        /// </summary>
        private int progressBubbleIndex = -1;

        /// <summary>
        /// Accumulated progress text fragments.
        /// </summary>
        private readonly List<string> progressFragments = new List<string>();

        [MenuItem("PuertsEditorAssistant/New Chat")]
        public static void ShowWindow()
        {
            var window = GetWindow<AgentChatWindow>("Puerts Agent Chat");
            window.minSize = new Vector2(450, 350);
            window.Show();
        }

        private void OnEnable()
        {
            stylesInitialized = false;
            LoadSettings();
            InitializeScriptManager();
        }

        private void LoadSettings()
        {
            apiKey = EditorPrefs.GetString(PrefKeyApiKey, "");
            baseURL = EditorPrefs.GetString(PrefKeyBaseURL, "");
            model = EditorPrefs.GetString(PrefKeyModel, "gpt-4o-mini");
        }

        private void SaveSettings()
        {
            EditorPrefs.SetString(PrefKeyApiKey, apiKey);
            EditorPrefs.SetString(PrefKeyBaseURL, baseURL);
            EditorPrefs.SetString(PrefKeyModel, model);
        }

        private void InitializeScriptManager()
        {
            if (scriptManager != null)
            {
                scriptManager.Dispose();
            }

            scriptManager = new AgentScriptManager();
            scriptManager.Initialize("LLMAgent/editor-assistant", () =>
            {
                // Auto-configure if API key is available
                if (!string.IsNullOrEmpty(apiKey))
                {
                    scriptManager.ConfigureAgent(apiKey, baseURL, model, 25);
                }
                Repaint();
            });
        }

        #region Texture Helpers

        private Texture2D MakeTex(int width, int height, Color color)
        {
            var pixels = new Color[width * height];
            for (int i = 0; i < pixels.Length; i++)
                pixels[i] = color;
            var tex = new Texture2D(width, height);
            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
        }

        private Texture2D MakeRoundedTex(int width, int height, Color color, int radius)
        {
            var tex = new Texture2D(width, height);
            var pixels = new Color[width * height];
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    // Check corners for rounding
                    bool inCorner = false;
                    int cx = 0, cy = 0;

                    if (x < radius && y < radius) { cx = radius; cy = radius; inCorner = true; }
                    else if (x >= width - radius && y < radius) { cx = width - radius; cy = radius; inCorner = true; }
                    else if (x < radius && y >= height - radius) { cx = radius; cy = height - radius; inCorner = true; }
                    else if (x >= width - radius && y >= height - radius) { cx = width - radius; cy = height - radius; inCorner = true; }

                    if (inCorner)
                    {
                        float dist = Mathf.Sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                        if (dist > radius)
                            pixels[y * width + x] = Color.clear;
                        else if (dist > radius - 1.5f)
                            pixels[y * width + x] = new Color(color.r, color.g, color.b, color.a * (radius - dist) / 1.5f);
                        else
                            pixels[y * width + x] = color;
                    }
                    else
                    {
                        pixels[y * width + x] = color;
                    }
                }
            }
            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
        }

        #endregion

        #region Style Initialization

        private void InitStyles()
        {
            if (stylesInitialized) return;

            bool isDark = EditorGUIUtility.isProSkin;

            // Colors
            Color headerBg = isDark ? new Color(0.16f, 0.16f, 0.20f) : new Color(0.22f, 0.45f, 0.85f);
            Color userBubbleColor = isDark ? new Color(0.20f, 0.40f, 0.70f, 0.85f) : new Color(0.26f, 0.52f, 0.96f, 0.90f);
            Color agentBubbleColor = isDark ? new Color(0.22f, 0.24f, 0.28f, 0.90f) : new Color(0.92f, 0.93f, 0.95f, 0.95f);
            Color inputAreaBg = isDark ? new Color(0.18f, 0.18f, 0.22f) : new Color(0.95f, 0.95f, 0.97f);
            Color sendBtnNormal = isDark ? new Color(0.25f, 0.55f, 0.95f) : new Color(0.26f, 0.52f, 0.96f);
            Color sendBtnHover = isDark ? new Color(0.35f, 0.65f, 1.0f) : new Color(0.36f, 0.62f, 1.0f);
            Color stopBtnNormal = isDark ? new Color(0.85f, 0.30f, 0.25f) : new Color(0.90f, 0.30f, 0.25f);
            Color stopBtnHover = isDark ? new Color(0.95f, 0.40f, 0.35f) : new Color(1.0f, 0.40f, 0.35f);
            Color inputFieldBg = isDark ? new Color(0.14f, 0.14f, 0.17f) : new Color(1f, 1f, 1f);

            // Generate textures
            headerBgTex = MakeTex(4, 4, headerBg);
            userBubbleTex = MakeRoundedTex(32, 32, userBubbleColor, 8);
            agentBubbleTex = MakeRoundedTex(32, 32, agentBubbleColor, 8);
            inputAreaBgTex = MakeTex(4, 4, inputAreaBg);
            sendBtnNormalTex = MakeRoundedTex(16, 16, sendBtnNormal, 4);
            sendBtnHoverTex = MakeRoundedTex(16, 16, sendBtnHover, 4);
            stopBtnNormalTex = MakeRoundedTex(16, 16, stopBtnNormal, 4);
            stopBtnHoverTex = MakeRoundedTex(16, 16, stopBtnHover, 4);
            inputFieldBgTex = MakeRoundedTex(16, 16, inputFieldBg, 4);

            // Header title style
            headerStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 15,
                alignment = TextAnchor.MiddleLeft,
                padding = new RectOffset(12, 12, 0, 0),
                normal = { textColor = Color.white }
            };

            // Status indicator dot
            statusDotStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 10,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = new Color(0.3f, 0.9f, 0.4f) },
                padding = new RectOffset(0, 0, 0, 0)
            };

            // User bubble
            userBubbleStyle = new GUIStyle()
            {
                normal = { background = userBubbleTex },
                border = new RectOffset(10, 10, 10, 10),
                padding = new RectOffset(12, 12, 8, 8),
                margin = new RectOffset(60, 8, 2, 2),
                wordWrap = true,
                richText = true,
                fontSize = 12,
                stretchWidth = false
            };

            // Agent bubble
            agentBubbleStyle = new GUIStyle()
            {
                normal = { background = agentBubbleTex },
                border = new RectOffset(10, 10, 10, 10),
                padding = new RectOffset(12, 12, 8, 8),
                margin = new RectOffset(8, 60, 2, 2),
                wordWrap = true,
                richText = true,
                fontSize = 12,
                stretchWidth = false
            };

            // User message label
            userLabelStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 12,
                wordWrap = true,
                richText = true,
                normal = { textColor = isDark ? new Color(0.95f, 0.95f, 1.0f) : Color.white },
                padding = new RectOffset(0, 0, 0, 0)
            };

            // Agent message label
            agentLabelStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 12,
                wordWrap = true,
                richText = true,
                normal = { textColor = isDark ? new Color(0.85f, 0.87f, 0.90f) : new Color(0.15f, 0.15f, 0.20f) },
                padding = new RectOffset(0, 0, 0, 0)
            };

            // Timestamp
            timestampStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                fontSize = 9,
                normal = { textColor = isDark ? new Color(0.5f, 0.52f, 0.58f) : new Color(0.55f, 0.55f, 0.60f) },
                padding = new RectOffset(0, 0, 2, 0)
            };

            // Input text field
            inputFieldStyle = new GUIStyle(EditorStyles.textField)
            {
                fontSize = 13,
                wordWrap = true,
                padding = new RectOffset(10, 10, 8, 8),
                normal = { background = inputFieldBgTex, textColor = isDark ? new Color(0.9f, 0.9f, 0.93f) : new Color(0.1f, 0.1f, 0.15f) },
                focused = { background = inputFieldBgTex, textColor = isDark ? new Color(0.95f, 0.95f, 1.0f) : new Color(0.05f, 0.05f, 0.1f) }
            };

            // Send button
            sendButtonStyle = new GUIStyle()
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { background = sendBtnNormalTex, textColor = Color.white },
                hover = { background = sendBtnHoverTex, textColor = Color.white },
                active = { background = sendBtnHoverTex, textColor = new Color(0.85f, 0.85f, 0.9f) },
                border = new RectOffset(4, 4, 4, 4),
                padding = new RectOffset(14, 14, 6, 6),
                margin = new RectOffset(4, 0, 0, 0)
            };

            // Stop button (shown during generation)
            stopButtonStyle = new GUIStyle()
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { background = stopBtnNormalTex, textColor = Color.white },
                hover = { background = stopBtnHoverTex, textColor = Color.white },
                active = { background = stopBtnHoverTex, textColor = new Color(0.9f, 0.85f, 0.85f) },
                border = new RectOffset(4, 4, 4, 4),
                padding = new RectOffset(14, 14, 6, 6),
                margin = new RectOffset(4, 0, 0, 0)
            };

            // Clear button
            clearButtonStyle = new GUIStyle(EditorStyles.miniButton)
            {
                fontSize = 10,
                padding = new RectOffset(6, 6, 2, 2),
                margin = new RectOffset(4, 8, 0, 0)
            };

            // Input area background
            inputAreaStyle = new GUIStyle()
            {
                normal = { background = inputAreaBgTex },
                padding = new RectOffset(10, 10, 10, 10)
            };

            // Welcome styles
            welcomeStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 18,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = isDark ? new Color(0.6f, 0.65f, 0.75f) : new Color(0.35f, 0.40f, 0.55f) },
                wordWrap = true
            };

            welcomeSubStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 12,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = isDark ? new Color(0.45f, 0.48f, 0.55f) : new Color(0.50f, 0.52f, 0.58f) },
                wordWrap = true
            };

            // Settings panel
            Color settingsBg = isDark ? new Color(0.17f, 0.17f, 0.21f) : new Color(0.93f, 0.94f, 0.96f);
            settingsBgTex = MakeTex(4, 4, settingsBg);

            settingsPanelStyle = new GUIStyle()
            {
                normal = { background = settingsBgTex },
                padding = new RectOffset(12, 12, 8, 8)
            };

            settingsLabelStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 11,
                normal = { textColor = isDark ? new Color(0.75f, 0.78f, 0.85f) : new Color(0.25f, 0.28f, 0.35f) }
            };

            settingsFieldStyle = new GUIStyle(EditorStyles.textField)
            {
                fontSize = 12,
                padding = new RectOffset(6, 6, 4, 4)
            };

            // Copy button textures
            Color copyBtnNormalColor = isDark ? new Color(0.35f, 0.38f, 0.45f, 0.85f) : new Color(0.70f, 0.72f, 0.78f, 0.85f);
            Color copyBtnHoverColor = isDark ? new Color(0.45f, 0.50f, 0.60f, 0.95f) : new Color(0.55f, 0.58f, 0.65f, 0.95f);
            copyBtnNormalTex = MakeRoundedTex(16, 16, copyBtnNormalColor, 3);
            copyBtnHoverTex = MakeRoundedTex(16, 16, copyBtnHoverColor, 3);

            stylesInitialized = true;
        }

        #endregion

        private void OnGUI()
        {
            InitStyles();

            DrawHeader();

            // Error banner if TS module failed to load
            if (scriptManager == null || !scriptManager.IsInitialized)
            {
                DrawErrorBanner();
            }

            // Settings panel (collapsible)
            if (showSettings)
            {
                DrawSettingsPanel();
                DrawSeparator();
            }

            // Message list area
            DrawMessageList();

            // Separator line
            DrawSeparator();

            // Input area
            DrawInputArea();
        }

        #region Header

        private void DrawHeader()
        {
            Rect headerRect = EditorGUILayout.BeginHorizontal(GUILayout.Height(42));
            if (headerBgTex != null)
            {
                GUI.DrawTexture(headerRect, headerBgTex, ScaleMode.StretchToFill);
            }

            GUILayout.Space(12);

            // Agent icon – use Unity built-in icon
            GUIContent agentIcon = EditorGUIUtility.IconContent("d_console.infoicon.sml");
            if (agentIcon == null || agentIcon.image == null)
                agentIcon = new GUIContent("\u2726"); // fallback
            GUIStyle iconStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white }
            };
            GUILayout.Label(agentIcon, iconStyle, GUILayout.Width(24), GUILayout.Height(42));

            // Title
            GUILayout.Label("Puerts Agent", headerStyle, GUILayout.Height(42));

            GUILayout.FlexibleSpace();

            // Settings gear button – use Unity built-in icon so it always renders
            GUIContent gearIcon = EditorGUIUtility.IconContent("d_Settings");
            if (gearIcon == null || gearIcon.image == null)
                gearIcon = EditorGUIUtility.IconContent("Settings");
            if (gearIcon == null || gearIcon.image == null)
                gearIcon = EditorGUIUtility.IconContent("_Popup");
            if (gearIcon == null || gearIcon.image == null)
                gearIcon = new GUIContent("S"); // ultimate fallback

            GUIStyle gearBtnStyle = new GUIStyle(GUI.skin.button)
            {
                padding = new RectOffset(4, 4, 4, 4),
                margin = new RectOffset(4, 4, 9, 9),
                fixedWidth = 28,
                fixedHeight = 24
            };
            if (GUILayout.Button(gearIcon, gearBtnStyle))
            {
                showSettings = !showSettings;
            }

            GUILayout.Space(4);

            // Status dot + text
            bool isOnline = scriptManager != null && scriptManager.IsInitialized;
            bool isConfigured = isOnline && scriptManager.IsAgentConfigured();
            if (isWaitingForResponse)
            {
                statusDotStyle.normal.textColor = new Color(1.0f, 0.8f, 0.2f);
                GUILayout.Label("\u25CF Thinking...", statusDotStyle, GUILayout.Height(42));
            }
            else if (isConfigured)
            {
                statusDotStyle.normal.textColor = new Color(0.3f, 0.9f, 0.4f);
                GUILayout.Label("\u25CF Ready", statusDotStyle, GUILayout.Height(42));
            }
            else if (isOnline)
            {
                statusDotStyle.normal.textColor = new Color(1.0f, 0.7f, 0.2f);
                GUILayout.Label("\u25CF No API Key", statusDotStyle, GUILayout.Height(42));
            }
            else
            {
                statusDotStyle.normal.textColor = new Color(0.9f, 0.35f, 0.3f);
                GUILayout.Label("\u25CF Offline", statusDotStyle, GUILayout.Height(42));
            }

            GUILayout.Space(12);

            EditorGUILayout.EndHorizontal();
        }

        #endregion

        #region Error Banner

        private void DrawErrorBanner()
        {
            EditorGUILayout.BeginHorizontal();
            GUILayout.Space(8);
            EditorGUILayout.BeginVertical();
            GUILayout.Space(4);

            EditorGUILayout.HelpBox(
                scriptManager?.LastError ?? "ScriptManager not initialized.",
                MessageType.Error
            );

            EditorGUILayout.BeginHorizontal();
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("  Retry  ", EditorStyles.miniButton))
            {
                InitializeScriptManager();
            }
            GUILayout.FlexibleSpace();
            EditorGUILayout.EndHorizontal();

            GUILayout.Space(4);
            EditorGUILayout.EndVertical();
            GUILayout.Space(8);
            EditorGUILayout.EndHorizontal();
        }

        #endregion

        #region Settings Panel

        private void DrawSettingsPanel()
        {
            EditorGUILayout.BeginVertical(settingsPanelStyle);

            GUILayout.Label("\u2699  Agent Settings", settingsLabelStyle);
            GUILayout.Space(4);

            EditorGUI.BeginChangeCheck();

            // API Key (password field)
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("API Key", GUILayout.Width(90));
            apiKey = EditorGUILayout.PasswordField(apiKey, settingsFieldStyle);
            EditorGUILayout.EndHorizontal();
            GUILayout.Space(2);

            // Base URL
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Base URL", GUILayout.Width(90));
            baseURL = EditorGUILayout.TextField(baseURL, settingsFieldStyle);
            EditorGUILayout.EndHorizontal();
            GUILayout.Space(2);

            // Model
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Model", GUILayout.Width(90));
            model = EditorGUILayout.TextField(model, settingsFieldStyle);
            EditorGUILayout.EndHorizontal();
            GUILayout.Space(4);

            // Apply button
            EditorGUILayout.BeginHorizontal();
            GUILayout.FlexibleSpace();

            if (GUILayout.Button("  Apply Settings  ", EditorStyles.miniButton))
            {
                SaveSettings();
                ApplySettings();
            }

            EditorGUILayout.EndHorizontal();

            if (EditorGUI.EndChangeCheck())
            {
                // Settings changed, will be applied when user clicks Apply
            }

            GUILayout.Space(4);
            EditorGUILayout.EndVertical();
        }

        private void ApplySettings()
        {
            if (scriptManager != null && scriptManager.IsInitialized)
            {
                string result = scriptManager.ConfigureAgent(apiKey, baseURL, model, 25);
                messages.Add(new ChatMessage
                {
                    Text = result,
                    IsUser = false,
                    Timestamp = DateTime.Now.ToString("HH:mm")
                });
                shouldScrollToBottom = true;
                Repaint();
            }
        }

        #endregion

        #region Message List

        private void DrawMessageList()
        {
            scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition, GUIStyle.none, GUI.skin.verticalScrollbar, GUILayout.ExpandHeight(true));

            GUILayout.Space(8);

            if (messages.Count == 0)
            {
                DrawWelcome();
            }
            else
            {
                for (int i = 0; i < messages.Count; i++)
                {
                    DrawMessage(messages[i], i);
                    GUILayout.Space(4);
                }
            }

            GUILayout.Space(8);

            EditorGUILayout.EndScrollView();

            // Auto scroll to bottom when new message added
            if (shouldScrollToBottom)
            {
                scrollPosition.y = float.MaxValue;
                shouldScrollToBottom = false;
                Repaint();
            }
        }

        private void DrawWelcome()
        {
            GUILayout.FlexibleSpace();

            EditorGUILayout.BeginVertical();
            GUILayout.Space(20);

            GUIStyle emojiStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 36,
                alignment = TextAnchor.MiddleCenter
            };
            GUILayout.Label("\U0001F916", emojiStyle, GUILayout.ExpandWidth(true), GUILayout.Height(50));

            GUILayout.Space(8);
            GUILayout.Label("Welcome to Puerts Agent", welcomeStyle, GUILayout.ExpandWidth(true));
            GUILayout.Space(4);

            bool isConfigured = scriptManager != null && scriptManager.IsInitialized && scriptManager.IsAgentConfigured();
            string subText = isConfigured
                ? "Type a message below to start chatting."
                : "Click the \u2699 gear icon to configure your API key first.";
            GUILayout.Label(subText, welcomeSubStyle, GUILayout.ExpandWidth(true));

            GUILayout.Space(20);
            EditorGUILayout.EndVertical();

            GUILayout.FlexibleSpace();
        }

        private void DrawMessage(ChatMessage msg, int msgIndex)
        {
            if (msg.IsUser)
            {
                DrawUserMessage(msg, msgIndex);
            }
            else
            {
                DrawAgentMessage(msg, msgIndex);
            }
        }

        private void DrawUserMessage(ChatMessage msg, int msgIndex)
        {
            EditorGUILayout.BeginHorizontal();
            GUILayout.FlexibleSpace();

            EditorGUILayout.BeginVertical(GUILayout.MaxWidth(position.width * 0.72f));

            // Sender label + timestamp
            EditorGUILayout.BeginHorizontal();
            GUILayout.FlexibleSpace();
            GUILayout.Label(msg.Timestamp, timestampStyle);
            GUILayout.Space(4);
            GUIStyle senderStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = EditorGUIUtility.isProSkin ? new Color(0.55f, 0.75f, 1.0f) : new Color(0.2f, 0.4f, 0.8f) }
            };
            GUILayout.Label("You \U0001F464", senderStyle);
            EditorGUILayout.EndHorizontal();

            // Bubble
            EditorGUILayout.BeginVertical(userBubbleStyle);
            GUILayout.Label(msg.Text, userLabelStyle);
            EditorGUILayout.EndVertical();

            // Get the bubble rect for hover/right-click detection
            Rect bubbleRect = GUILayoutUtility.GetLastRect();
            HandleBubbleInteraction(bubbleRect, msg, msgIndex);

            EditorGUILayout.EndVertical();

            GUILayout.Space(4);
            EditorGUILayout.EndHorizontal();
        }

        private void DrawAgentMessage(ChatMessage msg, int msgIndex)
        {
            EditorGUILayout.BeginHorizontal();
            GUILayout.Space(4);

            EditorGUILayout.BeginVertical(GUILayout.MaxWidth(position.width * 0.72f));

            // Sender label + timestamp
            EditorGUILayout.BeginHorizontal();
            GUIStyle senderStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = EditorGUIUtility.isProSkin ? new Color(0.45f, 0.85f, 0.55f) : new Color(0.15f, 0.55f, 0.30f) }
            };
            GUILayout.Label("\u2728 Agent", senderStyle);
            GUILayout.Space(4);
            GUILayout.Label(msg.Timestamp, timestampStyle);
            GUILayout.FlexibleSpace();
            EditorGUILayout.EndHorizontal();

            // Bubble
            EditorGUILayout.BeginVertical(agentBubbleStyle);
            GUILayout.Label(msg.Text, agentLabelStyle);
            EditorGUILayout.EndVertical();

            // Get the bubble rect for hover/right-click detection
            Rect bubbleRect = GUILayoutUtility.GetLastRect();
            HandleBubbleInteraction(bubbleRect, msg, msgIndex);

            // "Retry" button when an error occurred
            if (msg.ShowRetryButton && !isWaitingForResponse)
            {
                GUILayout.Space(4);
                EditorGUILayout.BeginHorizontal();

                Color originalBgRetry = GUI.backgroundColor;
                GUI.backgroundColor = EditorGUIUtility.isProSkin
                    ? new Color(0.85f, 0.45f, 0.25f, 1f)
                    : new Color(0.80f, 0.35f, 0.20f, 1f);

                GUIStyle retryButtonStyle = new GUIStyle(GUI.skin.button)
                {
                    fontStyle = FontStyle.Bold,
                    fontSize = 12,
                    padding = new RectOffset(12, 12, 6, 6),
                    normal = { textColor = Color.white },
                    hover = { textColor = Color.white }
                };

                if (GUILayout.Button("\U0001F504 Request failed. Retry?", retryButtonStyle, GUILayout.Height(28)))
                {
                    // Remove the retry button by clearing the flag
                    var retryUpdated = messages[msgIndex];
                    retryUpdated.ShowRetryButton = false;
                    messages[msgIndex] = retryUpdated;

                    string retryMessage = msg.RetryUserMessage;
                    string retryImagePath = msg.RetryImagePath;

                    // Start retry
                    isWaitingForResponse = true;
                    shouldScrollToBottom = true;

                    // Create in-progress agent bubble
                    BeginProgressBubble();

                    Repaint();

                    scriptManager.SendMessageAsync(retryMessage, retryImagePath, (response, isError) =>
                    {
                        isWaitingForResponse = false;

                        bool isActualError = isError || (response != null && response.StartsWith(ERROR_PREFIX));

                        FinalizeProgressBubble(response, isActualError,
                            isActualError ? retryMessage : null,
                            isActualError ? retryImagePath : null);
                    }, OnProgressUpdate);
                }

                GUI.backgroundColor = originalBgRetry;
                EditorGUILayout.EndHorizontal();
            }

            EditorGUILayout.EndVertical();

            GUILayout.FlexibleSpace();
            EditorGUILayout.EndHorizontal();
        }

        /// <summary>
        /// Handle hover copy button and right-click context menu on a message bubble.
        /// </summary>
        private void HandleBubbleInteraction(Rect bubbleRect, ChatMessage msg, int msgIndex)
        {
            Event evt = Event.current;
            bool isHovering = bubbleRect.Contains(evt.mousePosition);

            // Right-click context menu
            if (isHovering && evt.type == EventType.ContextClick)
            {
                GenericMenu menu = new GenericMenu();
                string textToCopy = msg.Text;
                menu.AddItem(new GUIContent("Copy Message"), false, () =>
                {
                    EditorGUIUtility.systemCopyBuffer = textToCopy;
                    copiedMessageIndex = msgIndex;
                    copiedMessageTime = EditorApplication.timeSinceStartup;
                    Repaint();
                });
                menu.ShowAsContext();
                evt.Use();
            }

            // Hover copy button (top-right corner of bubble)
            if (isHovering || (copiedMessageIndex == msgIndex && EditorApplication.timeSinceStartup - copiedMessageTime < 1.5))
            {
                bool showCopied = copiedMessageIndex == msgIndex && EditorApplication.timeSinceStartup - copiedMessageTime < 1.5;
                float btnWidth = showCopied ? 56f : 22f;
                float btnHeight = 20f;
                float padding = 4f;
                Rect btnRect = new Rect(
                    bubbleRect.xMax - btnWidth - padding,
                    bubbleRect.yMin + padding,
                    btnWidth,
                    btnHeight
                );

                if (showCopied)
                {
                    // Draw "Copied!" feedback
                    GUIStyle copiedStyle = new GUIStyle(EditorStyles.miniLabel)
                    {
                        fontSize = 10,
                        fontStyle = FontStyle.Bold,
                        alignment = TextAnchor.MiddleCenter,
                        normal = { background = copyBtnNormalTex, textColor = new Color(0.3f, 0.9f, 0.4f) },
                        border = new RectOffset(3, 3, 3, 3),
                        padding = new RectOffset(4, 4, 2, 2)
                    };
                    GUI.Label(btnRect, "\u2713 Copied", copiedStyle);
                    Repaint(); // Keep repainting to clear the feedback after timeout
                }
                else
                {
                    // Draw copy button
                    bool hover = btnRect.Contains(evt.mousePosition);
                    GUIStyle copyBtnStyle = new GUIStyle()
                    {
                        fontSize = 12,
                        alignment = TextAnchor.MiddleCenter,
                        normal = { background = hover ? copyBtnHoverTex : copyBtnNormalTex, textColor = Color.white },
                        border = new RectOffset(3, 3, 3, 3),
                        padding = new RectOffset(2, 2, 2, 2)
                    };

                    // Use a clipboard icon from Unity or fallback
                    GUIContent copyIcon = EditorGUIUtility.IconContent("Clipboard");
                    if (copyIcon == null || copyIcon.image == null)
                        copyIcon = EditorGUIUtility.IconContent("d_TreeEditor.Duplicate");
                    if (copyIcon == null || copyIcon.image == null)
                        copyIcon = new GUIContent("\u2398"); // copy symbol fallback
                    copyIcon = copyIcon.image != null
                        ? new GUIContent(copyIcon.image, "Copy message")
                        : new GUIContent(copyIcon.text, "Copy message");

                    if (GUI.Button(btnRect, copyIcon, copyBtnStyle))
                    {
                        EditorGUIUtility.systemCopyBuffer = msg.Text;
                        copiedMessageIndex = msgIndex;
                        copiedMessageTime = EditorApplication.timeSinceStartup;
                        Repaint();
                    }
                }

                // Clear expired feedback
                if (showCopied && EditorApplication.timeSinceStartup - copiedMessageTime >= 1.5)
                {
                    copiedMessageIndex = -1;
                }
            }

            // Repaint on hover to show/hide button
            if (isHovering && evt.type == EventType.Repaint)
            {
                Repaint();
            }
        }

        #endregion

        #region Separator

        private void DrawSeparator()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 1);
            Color sepColor = EditorGUIUtility.isProSkin
                ? new Color(0.3f, 0.3f, 0.35f, 0.6f)
                : new Color(0.75f, 0.75f, 0.80f, 0.6f);
            EditorGUI.DrawRect(rect, sepColor);
        }

        #endregion

        #region Input Area

        private void DrawInputArea()
        {
            Rect inputAreaRect = EditorGUILayout.BeginVertical(inputAreaStyle);
            if (inputAreaBgTex != null)
            {
                GUI.DrawTexture(inputAreaRect, inputAreaBgTex, ScaleMode.StretchToFill);
            }

            // Image attachment preview bar
            if (!string.IsNullOrEmpty(attachedImagePath))
            {
                EditorGUILayout.BeginHorizontal();
                GUILayout.Space(4);

                // Preview thumbnail
                if (attachedImagePreviewTex != null)
                {
                    GUILayout.Label(new GUIContent(attachedImagePreviewTex), GUILayout.Width(32), GUILayout.Height(32));
                }

                // Filename label
                string fileName = Path.GetFileName(attachedImagePath);
                GUIStyle attachLabelStyle = new GUIStyle(EditorStyles.miniLabel)
                {
                    fontStyle = FontStyle.Italic,
                    normal = { textColor = EditorGUIUtility.isProSkin ? new Color(0.7f, 0.8f, 1.0f) : new Color(0.2f, 0.4f, 0.8f) }
                };
                GUILayout.Label("\U0001F4CE " + fileName, attachLabelStyle, GUILayout.Height(32));

                GUILayout.FlexibleSpace();

                // Remove button
                if (GUILayout.Button("\u2716", EditorStyles.miniButton, GUILayout.Width(22), GUILayout.Height(20)))
                {
                    ClearAttachedImage();
                }
                GUILayout.Space(4);
                EditorGUILayout.EndHorizontal();
                GUILayout.Space(2);
            }

            EditorGUILayout.BeginHorizontal();

            // Handle Enter key to send
            bool enterPressed = Event.current.type == EventType.KeyDown
                && Event.current.keyCode == KeyCode.Return
                && !Event.current.shift
                && GUI.GetNameOfFocusedControl() == InputControlName;

            // Attach image button – use Unity built-in icon for reliable rendering
            GUIContent attachIcon = EditorGUIUtility.IconContent("d_RawImage Icon");
            if (attachIcon == null || attachIcon.image == null)
                attachIcon = EditorGUIUtility.IconContent("RawImage Icon");
            if (attachIcon == null || attachIcon.image == null)
                attachIcon = EditorGUIUtility.IconContent("d_Image Icon");
            if (attachIcon == null || attachIcon.image == null)
                attachIcon = EditorGUIUtility.IconContent("d_Texture Icon");
            if (attachIcon == null || attachIcon.image == null)
                attachIcon = new GUIContent("Img");
            attachIcon = new GUIContent(attachIcon.image, "Attach an image file");
            GUIStyle attachBtnStyle = new GUIStyle(EditorStyles.miniButton)
            {
                fontSize = 14,
                padding = new RectOffset(4, 4, 4, 4),
                margin = new RectOffset(0, 4, 4, 4),
                fixedWidth = 32,
                fixedHeight = 32
            };
            if (GUILayout.Button(attachIcon, attachBtnStyle))
            {
                OpenImageFileBrowser();
            }

            // Text input
            GUI.SetNextControlName(InputControlName);
            inputText = EditorGUILayout.TextArea(inputText, inputFieldStyle, GUILayout.MinHeight(32), GUILayout.MaxHeight(60), GUILayout.ExpandWidth(true));

            // Buttons column
            EditorGUILayout.BeginVertical(GUILayout.Width(68));

            // Send / Stop button (toggles based on generation state)
            bool sendClicked = false;
            bool stopClicked = false;
            if (isWaitingForResponse)
            {
                stopClicked = GUILayout.Button("Stop \u25A0", stopButtonStyle, GUILayout.Height(28), GUILayout.Width(68));
            }
            else
            {
                sendClicked = GUILayout.Button("Send \u25B6", sendButtonStyle, GUILayout.Height(28), GUILayout.Width(68));
            }

            GUILayout.Space(2);

            // Clear button
            bool clearClicked = GUILayout.Button("Clear", clearButtonStyle, GUILayout.Height(20), GUILayout.Width(68));

            EditorGUILayout.EndVertical();

            EditorGUILayout.EndHorizontal();

            EditorGUILayout.EndVertical();

            // Process stop
            if (stopClicked)
            {
                if (scriptManager != null && scriptManager.IsInitialized)
                {
                    scriptManager.AbortGeneration();
                }
            }

            // Process send (guard: not while waiting for response)
            if (!isWaitingForResponse && (sendClicked || enterPressed) && !string.IsNullOrWhiteSpace(inputText))
            {
                SendMessage(inputText.Trim(), attachedImagePath);
                inputText = "";
                ClearAttachedImage();

                // Refocus the input field
                EditorGUI.FocusTextInControl(InputControlName);

                // Consume the Enter key event
                if (enterPressed)
                {
                    Event.current.Use();
                }

                Repaint();
            }

            // Process clear
            if (clearClicked && messages.Count > 0)
            {
                if (EditorUtility.DisplayDialog("Clear Chat", "Are you sure you want to clear all messages?", "Clear", "Cancel"))
                {
                    messages.Clear();
                    if (scriptManager != null && scriptManager.IsInitialized)
                    {
                        scriptManager.ClearHistory();
                    }
                    Repaint();
                }
            }
        }

        #endregion

        #region Send Logic

        private void SendMessage(string text, string imagePath = null)
        {
            string timestamp = DateTime.Now.ToString("HH:mm");

            // Build display text (show image attachment in the message)
            string displayText = text;
            if (!string.IsNullOrEmpty(imagePath))
            {
                displayText = $"\U0001F4CE {Path.GetFileName(imagePath)}\n{text}";
            }

            // Add user message
            messages.Add(new ChatMessage { Text = displayText, IsUser = true, Timestamp = timestamp, ImagePath = imagePath });

            // Get response from TS asynchronously
            if (scriptManager != null && scriptManager.IsInitialized)
            {
                isWaitingForResponse = true;
                shouldScrollToBottom = true;

                // Create in-progress agent bubble
                BeginProgressBubble();

                Repaint();

                scriptManager.SendMessageAsync(text, imagePath, (response, isError) =>
                {
                    isWaitingForResponse = false;

                    // Detect errors: either isError flag from TS, or response starts with error prefix
                    bool isActualError = isError || (response != null && response.StartsWith(ERROR_PREFIX));

                    // Finalize the progress bubble with the final response
                    FinalizeProgressBubble(response, isActualError,
                        isActualError ? text : null,
                        isActualError ? imagePath : null);
                }, OnProgressUpdate);
            }
            else
            {
                messages.Add(new ChatMessage
                {
                    Text = "Agent not initialized. Please retry initialization.",
                    IsUser = false,
                    Timestamp = DateTime.Now.ToString("HH:mm")
                });
                shouldScrollToBottom = true;
            }
        }

        #endregion

        #region Progress Bubble Helpers

        /// <summary>
        /// Create a new in-progress agent bubble and start tracking it.
        /// </summary>
        private void BeginProgressBubble()
        {
            progressFragments.Clear();
            messages.Add(new ChatMessage
            {
                Text = "\u23F3 Working...",
                IsUser = false,
                Timestamp = DateTime.Now.ToString("HH:mm")
            });
            progressBubbleIndex = messages.Count - 1;
        }

        /// <summary>
        /// Called by TS progress callback to append step info to the in-progress bubble.
        /// </summary>
        private void OnProgressUpdate(string progressText)
        {
            if (progressBubbleIndex < 0 || progressBubbleIndex >= messages.Count)
                return;

            // All progress text (streaming chunks, tool calls, thinking, etc.)
            // is appended to a single list of fragments.
            if (!string.IsNullOrEmpty(progressText))
            {
                progressFragments.Add(progressText);
            }

            RebuildProgressBubble();
        }

        /// <summary>
        /// Rebuild the in-progress bubble text from progress fragments.
        /// </summary>
        private void RebuildProgressBubble()
        {
            var parts = new List<string>();

            // Add progress fragments (tool calls, thinking, streaming text, etc.)
            if (progressFragments.Count > 0)
            {
                parts.Add(string.Join("", progressFragments));
            }

            var updated = messages[progressBubbleIndex];
            if (parts.Count > 0)
            {
                updated.Text = string.Join("\n---\n", parts) + "\n\n\u23F3 Working...";
            }
            else
            {
                updated.Text = "\u23F3 Working...";
            }
            messages[progressBubbleIndex] = updated;
            shouldScrollToBottom = true;
            Repaint();
        }

        /// <summary>
        /// Finalize the in-progress bubble with the final response.
        /// </summary>
        private void FinalizeProgressBubble(string finalText, bool isError,
            string retryUserMessage, string retryImagePath)
        {
            // Build the final display: progress fragments / final text
            string combinedText;
            var parts = new List<string>();

            // Add progress fragments (tool calls, thinking, streaming text, etc.)
            if (progressFragments.Count > 0)
            {
                parts.Add(string.Join("", progressFragments));
            }

            // Fall back to finalText if no fragments were collected.
            if (parts.Count == 0 && !string.IsNullOrWhiteSpace(finalText))
            {
                parts.Add(finalText);
            }

            combinedText = parts.Count > 0 ? string.Join("", parts) : finalText;

            if (progressBubbleIndex >= 0 && progressBubbleIndex < messages.Count)
            {
                var updated = messages[progressBubbleIndex];
                updated.Text = combinedText;
                updated.ShowRetryButton = isError;
                updated.RetryUserMessage = retryUserMessage;
                updated.RetryImagePath = retryImagePath;
                messages[progressBubbleIndex] = updated;
            }
            else
            {
                // Fallback: just add a new message
                messages.Add(new ChatMessage
                {
                    Text = combinedText,
                    IsUser = false,
                    Timestamp = DateTime.Now.ToString("HH:mm"),
                    ShowRetryButton = isError,
                    RetryUserMessage = retryUserMessage,
                    RetryImagePath = retryImagePath
                });
            }

            progressBubbleIndex = -1;
            progressFragments.Clear();
            shouldScrollToBottom = true;
            Repaint();
        }

        #endregion

        #region Image Attachment

        private void OpenImageFileBrowser()
        {
            string path = EditorUtility.OpenFilePanel(
                "Select Image",
                "",
                "png,jpg,jpeg,bmp,gif,tga,webp"
            );

            if (!string.IsNullOrEmpty(path))
            {
                attachedImagePath = path;
                LoadImagePreview(path);
                Repaint();
            }
        }

        private void LoadImagePreview(string path)
        {
            ClearImagePreviewTex();
            try
            {
                byte[] fileBytes = File.ReadAllBytes(path);
                var tex = new Texture2D(2, 2);
                if (tex.LoadImage(fileBytes))
                {
                    // Create a small thumbnail
                    int thumbSize = 32;
                    RenderTexture rt = RenderTexture.GetTemporary(thumbSize, thumbSize, 0);
                    RenderTexture.active = rt;
                    Graphics.Blit(tex, rt);
                    attachedImagePreviewTex = new Texture2D(thumbSize, thumbSize, TextureFormat.RGBA32, false);
                    attachedImagePreviewTex.ReadPixels(new Rect(0, 0, thumbSize, thumbSize), 0, 0);
                    attachedImagePreviewTex.Apply();
                    RenderTexture.active = null;
                    RenderTexture.ReleaseTemporary(rt);
                }
                DestroyImmediate(tex);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[AgentChatWindow] Failed to load image preview: {ex.Message}");
            }
        }

        private void ClearAttachedImage()
        {
            attachedImagePath = null;
            ClearImagePreviewTex();
        }

        private void ClearImagePreviewTex()
        {
            if (attachedImagePreviewTex != null)
            {
                DestroyImmediate(attachedImagePreviewTex);
                attachedImagePreviewTex = null;
            }
        }

        #endregion

        private void OnDestroy()
        {
            ClearImagePreviewTex();

            if (scriptManager != null)
            {
                scriptManager.Dispose();
                scriptManager = null;
            }

            // Clean up textures
            DestroyTexture(userBubbleTex);
            DestroyTexture(agentBubbleTex);
            DestroyTexture(headerBgTex);
            DestroyTexture(inputAreaBgTex);
            DestroyTexture(sendBtnNormalTex);
            DestroyTexture(sendBtnHoverTex);
            DestroyTexture(stopBtnNormalTex);
            DestroyTexture(stopBtnHoverTex);
            DestroyTexture(inputFieldBgTex);
            DestroyTexture(settingsBgTex);
            DestroyTexture(copyBtnNormalTex);
            DestroyTexture(copyBtnHoverTex);
        }

        private void DestroyTexture(Texture2D tex)
        {
            if (tex != null)
            {
                DestroyImmediate(tex);
            }
        }
    }
}
