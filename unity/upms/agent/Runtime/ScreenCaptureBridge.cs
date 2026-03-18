using System;
using System.Collections;
using System.IO;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
#endif

namespace LLMAgent
{
    /// <summary>
    /// Screen capture bridge for TypeScript.
    /// Captures the current game view as a PNG image encoded in base64.
    /// Both Editor and Runtime use coroutine + WaitForEndOfFrame for reliable capture.
    /// If not in Play Mode (Editor only), falls back to Camera.Render approach.
    /// </summary>
    public static class ScreenCaptureBridge
    {
        /// <summary>
        /// Hidden MonoBehaviour singleton that drives coroutines for screen capture.
        /// </summary>
        private class ScreenCaptureRunner : MonoBehaviour
        {
            private static ScreenCaptureRunner _instance;

            public static ScreenCaptureRunner Instance
            {
                get
                {
                    if (_instance == null)
                    {
                        var go = new GameObject("[ScreenCaptureRunner]");
                        go.hideFlags = HideFlags.HideAndDontSave;
                        UnityEngine.Object.DontDestroyOnLoad(go);
                        _instance = go.AddComponent<ScreenCaptureRunner>();
                    }
                    return _instance;
                }
            }

            public void CaptureScreen(int maxWidth, int maxHeight, Action<string> onComplete)
            {
                StartCoroutine(CaptureCoroutine(maxWidth, maxHeight, onComplete));
            }

            private IEnumerator CaptureCoroutine(int maxWidth, int maxHeight, Action<string> onComplete)
            {
                // Wait until end of frame so the screen is fully rendered
                yield return new WaitForEndOfFrame();

                string result;
                try
                {
                    // Read screen pixels
                    int screenWidth = Screen.width;
                    int screenHeight = Screen.height;

                    var screenTex = new Texture2D(screenWidth, screenHeight, TextureFormat.RGB24, false);
                    screenTex.ReadPixels(new Rect(0, 0, screenWidth, screenHeight), 0, 0);
                    screenTex.Apply();

                    result = ProcessAndEncode(screenTex, screenWidth, screenHeight, maxWidth, maxHeight);
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[ScreenCaptureBridge] Capture failed: {ex.Message}");
                    result = BuildErrorJson(ex.Message);
                }

                onComplete?.Invoke(result);
            }
        }

        /// <summary>
        /// Capture the current screen and return the result as a base64-encoded PNG via callback.
        /// </summary>
        /// <param name="maxWidth">Maximum width to resize to (0 = no resize)</param>
        /// <param name="maxHeight">Maximum height to resize to (0 = no resize)</param>
        /// <param name="callback">Callback invoked with JSON result string</param>
        public static void CaptureScreenAsync(int maxWidth, int maxHeight, Action<string> callback)
        {
            if (callback == null)
            {
                Debug.LogError("[ScreenCaptureBridge] Callback is null");
                return;
            }

            // If Application is playing, use coroutine-based approach (works in both Editor Play and Runtime)
            if (Application.isPlaying)
            {
                try
                {
                    ScreenCaptureRunner.Instance.CaptureScreen(maxWidth, maxHeight, callback);
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[ScreenCaptureBridge] Coroutine capture failed: {ex.Message}");
                    callback.Invoke(BuildErrorJson(ex.Message));
                }
            }
            else
            {
                // Not in Play Mode - use Camera.Render to RenderTexture (synchronous fallback)
                try
                {
                    string result = CaptureViaCamera(maxWidth, maxHeight);
                    callback.Invoke(result);
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[ScreenCaptureBridge] Camera capture failed: {ex.Message}");
                    callback.Invoke(BuildErrorJson(ex.Message));
                }
            }
        }

        /// <summary>
        /// Fallback capture when not in Play Mode: render from Camera.main to a RenderTexture.
        /// </summary>
        private static string CaptureViaCamera(int maxWidth, int maxHeight)
        {
            var cam = Camera.main;
            if (cam == null)
            {
                // Try to find any camera
                cam = UnityEngine.Object.FindObjectOfType<Camera>();
            }
            if (cam == null)
            {
                return BuildErrorJson("No camera found in scene. Cannot capture screen outside Play Mode.");
            }

            int captureWidth = maxWidth > 0 ? maxWidth : 512;
            int captureHeight = maxHeight > 0 ? maxHeight : 512;

            // Create a RenderTexture and render the camera into it
            RenderTexture rt = new RenderTexture(captureWidth, captureHeight, 24, RenderTextureFormat.ARGB32);
            rt.Create();

            RenderTexture previous = cam.targetTexture;
            RenderTexture previousActive = RenderTexture.active;

            cam.targetTexture = rt;
            cam.Render();

            RenderTexture.active = rt;
            Texture2D tex = new Texture2D(captureWidth, captureHeight, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, captureWidth, captureHeight), 0, 0);
            tex.Apply();

            // Restore camera state
            cam.targetTexture = previous;
            RenderTexture.active = previousActive;
            rt.Release();
            UnityEngine.Object.DestroyImmediate(rt);

            byte[] pngBytes = tex.EncodeToPNG();
/*
#if UNITY_EDITOR
            // Save a debug copy to disk for inspection
            try
            {
                string debugPath = Path.Combine(Application.dataPath, "..", "debug_screenshot.png");
                File.WriteAllBytes(debugPath, pngBytes);
                Debug.Log($"[ScreenCaptureBridge] Debug screenshot saved to: {Path.GetFullPath(debugPath)} ({captureWidth}x{captureHeight})");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ScreenCaptureBridge] Failed to save debug screenshot: {ex.Message}");
            }
#endif
*/
            Debug.Log($"[ScreenCaptureBridge] Processed screenshot: {captureWidth}x{captureHeight}, {pngBytes.Length} bytes");
            string base64 = Convert.ToBase64String(pngBytes);
            UnityEngine.Object.DestroyImmediate(tex);

            return BuildSuccessJson(base64, captureWidth, captureHeight);
        }

        /// <summary>
        /// Capture the Scene view and return the result as a base64-encoded PNG via callback.
        /// Only available in the Unity Editor.
        /// </summary>
        /// <param name="maxWidth">Maximum width to resize to</param>
        /// <param name="maxHeight">Maximum height to resize to</param>
        /// <param name="callback">Callback invoked with JSON result string</param>
        public static void CaptureSceneViewAsync(int maxWidth, int maxHeight, Action<string> callback)
        {
            if (callback == null)
            {
                Debug.LogError("[ScreenCaptureBridge] Callback is null");
                return;
            }

#if UNITY_EDITOR
            try
            {
                string result = CaptureSceneView(maxWidth, maxHeight);
                callback.Invoke(result);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ScreenCaptureBridge] Scene view capture failed: {ex.Message}");
                callback.Invoke(BuildErrorJson(ex.Message));
            }
#else
            callback.Invoke(BuildErrorJson("Scene view capture is only available in the Unity Editor."));
#endif
        }

        /// <summary>
        /// Get the current Scene view camera state (pivot, rotation, size).
        /// Only available in the Unity Editor.
        /// </summary>
        /// <returns>JSON string with scene view state</returns>
        public static string GetSceneViewState()
        {
#if UNITY_EDITOR
            SceneView sceneView = SceneView.lastActiveSceneView;
            if (sceneView == null)
            {
                return BuildErrorJson("No active Scene view found.");
            }

            var pivot = sceneView.pivot;
            var rotation = sceneView.rotation;
            var euler = rotation.eulerAngles;
            float size = sceneView.size;
            bool ortho = sceneView.orthographic;

            var ic = System.Globalization.CultureInfo.InvariantCulture;
            return "{\"success\":true,\"pivot\":{\"x\":" + pivot.x.ToString("F3", ic) + ",\"y\":" + pivot.y.ToString("F3", ic) + ",\"z\":" + pivot.z.ToString("F3", ic) + "}," +
                   "\"rotation\":{\"x\":" + rotation.x.ToString("F4", ic) + ",\"y\":" + rotation.y.ToString("F4", ic) + ",\"z\":" + rotation.z.ToString("F4", ic) + ",\"w\":" + rotation.w.ToString("F4", ic) + "}," +
                   "\"eulerAngles\":{\"x\":" + euler.x.ToString("F1", ic) + ",\"y\":" + euler.y.ToString("F1", ic) + ",\"z\":" + euler.z.ToString("F1", ic) + "}," +
                   "\"size\":" + size.ToString("F3", ic) + ",\"orthographic\":" + (ortho ? "true" : "false") + "}";
#else
            return BuildErrorJson("Scene view state is only available in the Unity Editor.");
#endif
        }

        /// <summary>
        /// Manipulate the Scene view camera: zoom, pan, or orbit.
        /// Only available in the Unity Editor.
        /// </summary>
        /// <param name="operation">"zoom", "pan", or "orbit"</param>
        /// <param name="direction">
        /// For zoom: "forward" or "backward".
        /// For pan: "up", "down", "left", or "right".
        /// For orbit: "up", "down", "left", or "right".
        /// </param>
        /// <param name="amount">The amount/intensity of the operation (positive float).</param>
        /// <param name="callback">Callback invoked with JSON result string</param>
        public static void ManipulateSceneView(string operation, string direction, float amount, Action<string> callback)
        {
            if (callback == null)
            {
                Debug.LogError("[ScreenCaptureBridge] Callback is null");
                return;
            }

#if UNITY_EDITOR
            try
            {
                string result = DoManipulateSceneView(operation, direction, amount);
                callback.Invoke(result);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ScreenCaptureBridge] Scene view manipulation failed: {ex.Message}");
                callback.Invoke(BuildErrorJson(ex.Message));
            }
#else
            callback.Invoke(BuildErrorJson("Scene view manipulation is only available in the Unity Editor."));
#endif
        }

#if UNITY_EDITOR
        /// <summary>
        /// Capture the Scene view using SceneView.lastActiveSceneView.camera.
        /// </summary>
        private static string CaptureSceneView(int maxWidth, int maxHeight)
        {
            SceneView sceneView = SceneView.lastActiveSceneView;
            if (sceneView == null)
            {
                return BuildErrorJson("No active Scene view found. Please open a Scene view window in the Editor.");
            }

            Camera sceneCamera = sceneView.camera;
            if (sceneCamera == null)
            {
                return BuildErrorJson("Scene view camera is not available.");
            }

            int captureWidth = maxWidth > 0 ? maxWidth : 512;
            int captureHeight = maxHeight > 0 ? maxHeight : 512;

            // Create a RenderTexture and render the scene camera into it
            RenderTexture rt = new RenderTexture(captureWidth, captureHeight, 24, RenderTextureFormat.ARGB32);
            rt.Create();

            RenderTexture previousTarget = sceneCamera.targetTexture;
            RenderTexture previousActive = RenderTexture.active;

            sceneCamera.targetTexture = rt;
            sceneCamera.Render();

            RenderTexture.active = rt;
            Texture2D tex = new Texture2D(captureWidth, captureHeight, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, captureWidth, captureHeight), 0, 0);
            tex.Apply();

            // Restore camera state
            sceneCamera.targetTexture = previousTarget;
            RenderTexture.active = previousActive;
            rt.Release();
            UnityEngine.Object.DestroyImmediate(rt);

            byte[] pngBytes = tex.EncodeToPNG();
/*
#if UNITY_EDITOR
            // Save a debug copy to disk for inspection
            try
            {
                string debugPath = Path.Combine(Application.dataPath, "..", "debug_screenshot.png");
                File.WriteAllBytes(debugPath, pngBytes);
                Debug.Log($"[ScreenCaptureBridge] Debug screenshot saved to: {Path.GetFullPath(debugPath)} ({captureWidth}x{captureHeight})");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ScreenCaptureBridge] Failed to save debug screenshot: {ex.Message}");
            }
#endif
*/
            Debug.Log($"[ScreenCaptureBridge] Scene view screenshot: {captureWidth}x{captureHeight}, {pngBytes.Length} bytes");
            string base64 = Convert.ToBase64String(pngBytes);
            UnityEngine.Object.DestroyImmediate(tex);

            return BuildSuccessJson(base64, captureWidth, captureHeight);
        }

        /// <summary>
        /// Perform the actual scene view manipulation.
        /// </summary>
        private static string DoManipulateSceneView(string operation, string direction, float amount)
        {
            SceneView sceneView = SceneView.lastActiveSceneView;
            if (sceneView == null)
            {
                return BuildErrorJson("No active Scene view found. Please open a Scene view window in the Editor.");
            }

            if (amount <= 0f) amount = 1f;

            string op = (operation ?? "").ToLowerInvariant().Trim();
            string dir = (direction ?? "").ToLowerInvariant().Trim();

            switch (op)
            {
                case "zoom":
                    return DoZoom(sceneView, dir, amount);
                case "pan":
                    return DoPan(sceneView, dir, amount);
                case "orbit":
                    return DoOrbit(sceneView, dir, amount);
                default:
                    return BuildErrorJson($"Unknown operation '{operation}'. Use 'zoom', 'pan', or 'orbit'.");
            }
        }

        /// <summary>
        /// Zoom: move along the camera forward axis (equivalent to mouse scroll wheel).
        /// SceneView.size controls the zoom level in orthographic-like behavior.
        /// We also move the pivot along the camera forward direction for perspective mode.
        /// </summary>
        private static string DoZoom(SceneView sceneView, string direction, float amount)
        {
            // SceneView.size represents the "zoom distance". Smaller = closer.
            float factor;
            switch (direction)
            {
                case "forward":
                case "in":
                    factor = 1f / (1f + amount * 0.2f); // shrink size = zoom in
                    break;
                case "backward":
                case "out":
                    factor = 1f + amount * 0.2f; // grow size = zoom out
                    break;
                default:
                    return BuildErrorJson($"Unknown zoom direction '{direction}'. Use 'forward'/'in' or 'backward'/'out'.");
            }

            float oldSize = sceneView.size;
            sceneView.size = Mathf.Clamp(oldSize * factor, 0.01f, 10000f);
            sceneView.Repaint();

            Debug.Log($"[ScreenCaptureBridge] Scene view zoom {direction}: size {oldSize:F2} -> {sceneView.size:F2}");
            return BuildManipulationSuccessJson("zoom", direction, amount,
                $"Zoomed {direction}. Scene view size: {oldSize:F2} -> {sceneView.size:F2}");
        }

        /// <summary>
        /// Pan: move the pivot along the camera's local right/up axes (equivalent to middle-mouse drag).
        /// </summary>
        private static string DoPan(SceneView sceneView, string direction, float amount)
        {
            Camera cam = sceneView.camera;
            if (cam == null)
            {
                return BuildErrorJson("Scene view camera is not available.");
            }

            // Scale pan distance by current view size for consistent feel
            float panDistance = amount * sceneView.size * 0.1f;
            Vector3 offset;

            switch (direction)
            {
                case "up":
                    offset = cam.transform.up * panDistance;
                    break;
                case "down":
                    offset = -cam.transform.up * panDistance;
                    break;
                case "left":
                    offset = -cam.transform.right * panDistance;
                    break;
                case "right":
                    offset = cam.transform.right * panDistance;
                    break;
                default:
                    return BuildErrorJson($"Unknown pan direction '{direction}'. Use 'up', 'down', 'left', or 'right'.");
            }

            Vector3 oldPivot = sceneView.pivot;
            sceneView.pivot += offset;
            sceneView.Repaint();

            Debug.Log($"[ScreenCaptureBridge] Scene view pan {direction}: pivot {oldPivot} -> {sceneView.pivot}");
            return BuildManipulationSuccessJson("pan", direction, amount,
                $"Panned {direction}. Pivot moved from {oldPivot} to {sceneView.pivot}");
        }

        /// <summary>
        /// Orbit: rotate around the pivot point (equivalent to right-mouse drag).
        /// </summary>
        private static string DoOrbit(SceneView sceneView, string direction, float amount)
        {
            // Orbit angles in degrees
            float angleDeg = amount * 15f; // 15 degrees per unit of amount
            Quaternion oldRotation = sceneView.rotation;
            Quaternion delta;

            switch (direction)
            {
                case "up":
                    // Rotate around the camera's local right axis (pitch up)
                    delta = Quaternion.AngleAxis(-angleDeg, sceneView.rotation * Vector3.right);
                    break;
                case "down":
                    // Rotate around the camera's local right axis (pitch down)
                    delta = Quaternion.AngleAxis(angleDeg, sceneView.rotation * Vector3.right);
                    break;
                case "left":
                    // Rotate around world up axis (yaw left)
                    delta = Quaternion.AngleAxis(-angleDeg, Vector3.up);
                    break;
                case "right":
                    // Rotate around world up axis (yaw right)
                    delta = Quaternion.AngleAxis(angleDeg, Vector3.up);
                    break;
                default:
                    return BuildErrorJson($"Unknown orbit direction '{direction}'. Use 'up', 'down', 'left', or 'right'.");
            }

            sceneView.rotation = delta * sceneView.rotation;
            sceneView.Repaint();

            Vector3 oldEuler = oldRotation.eulerAngles;
            Vector3 newEuler = sceneView.rotation.eulerAngles;
            Debug.Log($"[ScreenCaptureBridge] Scene view orbit {direction}: rotation {oldEuler} -> {newEuler}");
            return BuildManipulationSuccessJson("orbit", direction, amount,
                $"Orbited {direction} by {angleDeg:F1}°. Rotation: ({oldEuler.x:F1}, {oldEuler.y:F1}, {oldEuler.z:F1}) -> ({newEuler.x:F1}, {newEuler.y:F1}, {newEuler.z:F1})");
        }

        /// <summary>
        /// Get the hierarchy of a GameObject as a tree structure.
        /// </summary>
        /// <param name="name">Name of the root GameObject (empty or null = all root objects)</param>
        /// <param name="depth">Maximum depth to traverse (0 = unlimited)</param>
        /// <returns>JSON string with hierarchy tree</returns>
        public static string GetGameObjectHierarchy(string name, int depth)
        {
            try
            {
                var sb = new System.Text.StringBuilder();
                sb.Append("{\"success\":true,\"hierarchy\":[");

                GameObject[] roots;
                if (!string.IsNullOrEmpty(name))
                {
                    var go = GameObject.Find(name);
                    if (go == null)
                        return BuildErrorJson($"GameObject '{name}' not found.");
                    roots = new[] { go };
                }
                else
                {
                    // Get all root GameObjects in the active scene
                    var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                    roots = scene.GetRootGameObjects();
                }

                for (int i = 0; i < roots.Length; i++)
                {
                    if (i > 0) sb.Append(",");
                    AppendGameObjectNode(sb, roots[i], depth, 1);
                }

                sb.Append("]}");
                return sb.ToString();
            }
            catch (Exception e)
            {
                return BuildErrorJson(e.Message);
            }
        }

        private static void AppendGameObjectNode(System.Text.StringBuilder sb, GameObject go, int maxDepth, int currentDepth)
        {
            sb.Append("{\"name\":\"");
            sb.Append(EscapeJson(go.name));
            sb.Append("\",\"active\":");
            sb.Append(go.activeSelf ? "true" : "false");

            // List component types
            var components = go.GetComponents<Component>();
            sb.Append(",\"components\":[");
            bool firstComp = true;
            foreach (var comp in components)
            {
                if (comp == null) continue; // missing script
                if (!firstComp) sb.Append(",");
                sb.Append("\"");
                sb.Append(EscapeJson(comp.GetType().Name));
                sb.Append("\"");
                firstComp = false;
            }
            sb.Append("]");

            // Children
            if (maxDepth == 0 || currentDepth < maxDepth)
            {
                int childCount = go.transform.childCount;
                if (childCount > 0)
                {
                    sb.Append(",\"children\":[");
                    for (int i = 0; i < childCount; i++)
                    {
                        if (i > 0) sb.Append(",");
                        AppendGameObjectNode(sb, go.transform.GetChild(i).gameObject, maxDepth, currentDepth + 1);
                    }
                    sb.Append("]");
                }
            }
            else if (go.transform.childCount > 0)
            {
                sb.Append(",\"childCount\":");
                sb.Append(go.transform.childCount);
            }

            sb.Append("}");
        }

        /// <summary>
        /// Select a GameObject in the Unity Editor's hierarchy/scene view.
        /// </summary>
        /// <param name="name">Name of the GameObject to select (uses GameObject.Find)</param>
        /// <returns>JSON result string</returns>
        public static string SelectGameObject(string name)
        {
            if (string.IsNullOrEmpty(name))
                return BuildErrorJson("GameObject name cannot be empty.");

            var go = GameObject.Find(name);
            if (go == null)
                return BuildErrorJson($"GameObject '{name}' not found.");

            Selection.activeGameObject = go;
            EditorGUIUtility.PingObject(go);
            Debug.Log($"[ScreenCaptureBridge] Selected GameObject: {go.name}");
            return $"{{\"success\":true,\"selected\":\"{EscapeJson(go.name)}\"}}";
        }

        /// <summary>
        /// Directly set the Scene view camera position, rotation, and zoom level.
        /// </summary>
        /// <param name="px">Pivot X</param>
        /// <param name="py">Pivot Y</param>
        /// <param name="pz">Pivot Z</param>
        /// <param name="setPivot">Whether to apply the pivot value</param>
        /// <param name="rx">Rotation euler X (degrees)</param>
        /// <param name="ry">Rotation euler Y (degrees)</param>
        /// <param name="rz">Rotation euler Z (degrees)</param>
        /// <param name="setRotation">Whether to apply the rotation value</param>
        /// <param name="size">Zoom size (positive float, 0 = keep current)</param>
        /// <returns>JSON result string</returns>
        public static string SetSceneViewCamera(float px, float py, float pz, bool setPivot, float rx, float ry, float rz, bool setRotation, float size)
        {
            SceneView sceneView = SceneView.lastActiveSceneView;
            if (sceneView == null)
                return BuildErrorJson("No active Scene view found.");

            try
            {
                if (setPivot)
                {
                    sceneView.pivot = new Vector3(px, py, pz);
                }

                if (setRotation)
                {
                    sceneView.rotation = Quaternion.Euler(rx, ry, rz);
                }

                if (size > 0f)
                {
                    sceneView.size = size;
                }

                sceneView.Repaint();

                var p = sceneView.pivot;
                var e = sceneView.rotation.eulerAngles;
                Debug.Log($"[ScreenCaptureBridge] SetSceneViewCamera: pivot=({p.x:F2},{p.y:F2},{p.z:F2}), euler=({e.x:F1},{e.y:F1},{e.z:F1}), size={sceneView.size:F2}");
                var ic = System.Globalization.CultureInfo.InvariantCulture;
                return "{\"success\":true,\"pivot\":{\"x\":" + p.x.ToString("F3", ic) + ",\"y\":" + p.y.ToString("F3", ic) + ",\"z\":" + p.z.ToString("F3", ic) + "}," +
                       "\"eulerAngles\":{\"x\":" + e.x.ToString("F1", ic) + ",\"y\":" + e.y.ToString("F1", ic) + ",\"z\":" + e.z.ToString("F1", ic) + "}," +
                       "\"size\":" + sceneView.size.ToString("F3", ic) + "}";
            }
            catch (Exception ex)
            {
                return BuildErrorJson($"SetSceneViewCamera failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Focus the Scene view on a specific GameObject (like pressing F in the Editor).
        /// </summary>
        /// <param name="gameObjectName">Name of the GameObject to focus on</param>
        /// <returns>JSON result string</returns>
        public static string FocusSceneViewOn(string gameObjectName)
        {
            if (string.IsNullOrEmpty(gameObjectName))
                return BuildErrorJson("GameObject name cannot be empty.");

            var go = GameObject.Find(gameObjectName);
            if (go == null)
                return BuildErrorJson($"GameObject '{gameObjectName}' not found.");

            SceneView sceneView = SceneView.lastActiveSceneView;
            if (sceneView == null)
                return BuildErrorJson("No active Scene view found.");

            // Select the object and frame it in the scene view
            Selection.activeGameObject = go;
            sceneView.FrameSelected();

            var p = sceneView.pivot;
            var s = sceneView.size;
            Debug.Log($"[ScreenCaptureBridge] Focused Scene view on '{go.name}': pivot=({p.x:F2},{p.y:F2},{p.z:F2}), size={s:F2}");
            var ic = System.Globalization.CultureInfo.InvariantCulture;
            return "{\"success\":true,\"focused\":\"" + EscapeJson(go.name) + "\",\"pivot\":{\"x\":" + p.x.ToString("F3", ic) + ",\"y\":" + p.y.ToString("F3", ic) + ",\"z\":" + p.z.ToString("F3", ic) + "},\"size\":" + s.ToString("F3", ic) + "}";
        }

        /// <summary>
        /// Save the current active scene to disk.
        /// </summary>
        /// <returns>JSON result string</returns>
        public static string SaveScene()
        {
            try
            {
                var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                // Mark dirty so changes made via Runtime API (bypassing Undo) are recognized
                EditorSceneManager.MarkSceneDirty(scene);
                bool saved = EditorSceneManager.SaveScene(scene);
                if (saved)
                {
                    Debug.Log($"[ScreenCaptureBridge] Scene '{scene.name}' saved successfully to '{scene.path}'.");
                    return $"{{\"success\":true,\"scene\":\"{EscapeJson(scene.name)}\",\"path\":\"{EscapeJson(scene.path)}\"}}";
                }
                else
                {
                    return BuildErrorJson($"Failed to save scene '{scene.name}'. It may be a new unsaved scene.");
                }
            }
            catch (Exception ex)
            {
                return BuildErrorJson($"SaveScene failed: {ex.Message}");
            }
        }

        private static string BuildManipulationSuccessJson(string operation, string direction, float amount, string description)
        {
            string escaped = EscapeJson(description);
            return $"{{\"success\":true,\"operation\":\"{operation}\",\"direction\":\"{direction}\",\"amount\":{amount},\"description\":\"{escaped}\"}}";
        }
#endif

        /// <summary>
        /// Process a captured Texture2D: optionally resize, encode to PNG, and return JSON.
        /// </summary>
        private static string ProcessAndEncode(Texture2D screenTex, int screenWidth, int screenHeight, int maxWidth, int maxHeight)
        {
            int finalWidth = screenWidth;
            int finalHeight = screenHeight;

            Texture2D finalTex = screenTex;
            if (maxWidth > 0 && maxHeight > 0 && (screenWidth > maxWidth || screenHeight > maxHeight))
            {
                float scale = Mathf.Min((float)maxWidth / screenWidth, (float)maxHeight / screenHeight);
                finalWidth = Mathf.Max(1, Mathf.RoundToInt(screenWidth * scale));
                finalHeight = Mathf.Max(1, Mathf.RoundToInt(screenHeight * scale));

                finalTex = ResizeTexture(screenTex, finalWidth, finalHeight);
                UnityEngine.Object.Destroy(screenTex);
            }

            byte[] pngBytes = finalTex.EncodeToPNG();

/*
#if UNITY_EDITOR
            // Save a debug copy to disk for inspection
            try
            {
                string debugPath = Path.Combine(Application.dataPath, "..", "debug_screenshot.png");
                File.WriteAllBytes(debugPath, pngBytes);
                Debug.Log($"[ScreenCaptureBridge] Debug screenshot saved to: {Path.GetFullPath(debugPath)} ({finalWidth}x{finalHeight})");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ScreenCaptureBridge] Failed to save debug screenshot: {ex.Message}");
            }
#endif
*/
            /*
            // TEMP: Override with apple.png for testing vision capability
            string testImagePath = Path.Combine(Application.dataPath, "..", "apple.png");
            if (File.Exists(testImagePath))
            {
                byte[] testBytes = File.ReadAllBytes(testImagePath);
                // Load into a temporary Texture2D to get actual dimensions
                var tmpTex = new Texture2D(2, 2);
                tmpTex.LoadImage(testBytes);
                int testWidth = tmpTex.width;
                int testHeight = tmpTex.height;
                UnityEngine.Object.Destroy(tmpTex);

                Debug.Log($"[ScreenCaptureBridge] TEMP: Returning apple.png instead of screenshot ({testWidth}x{testHeight}, {testBytes.Length} bytes)");
                string testBase64 = Convert.ToBase64String(testBytes);
                UnityEngine.Object.Destroy(finalTex);
                return BuildSuccessJson(testBase64, testWidth, testHeight);
            }
            else
            {
                Debug.LogWarning($"[ScreenCaptureBridge] TEMP: apple.png not found at {testImagePath}, falling back to real screenshot");
            }
            */

            string base64 = Convert.ToBase64String(pngBytes);
            Debug.Log($"[ScreenCaptureBridge] Processed screenshot: {finalWidth}x{finalHeight}, {pngBytes.Length} bytes");
            UnityEngine.Object.Destroy(finalTex);

            return BuildSuccessJson(base64, finalWidth, finalHeight);
        }

        /// <summary>
        /// Resize a texture using GPU bilinear filtering via RenderTexture + Blit.
        /// </summary>
        private static Texture2D ResizeTexture(Texture2D source, int targetWidth, int targetHeight)
        {
            RenderTexture rt = RenderTexture.GetTemporary(targetWidth, targetHeight, 0, RenderTextureFormat.Default, RenderTextureReadWrite.sRGB);
            rt.filterMode = FilterMode.Bilinear;

            RenderTexture previous = RenderTexture.active;
            RenderTexture.active = rt;

            Graphics.Blit(source, rt);

            Texture2D result = new Texture2D(targetWidth, targetHeight, TextureFormat.RGB24, false);
            result.ReadPixels(new Rect(0, 0, targetWidth, targetHeight), 0, 0);
            result.Apply();

            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(rt);

            return result;
        }

        private static string BuildSuccessJson(string base64, int width, int height)
        {
            return $"{{\"success\":true,\"width\":{width},\"height\":{height},\"base64\":\"{base64}\"}}";
        }

        private static string BuildErrorJson(string errorMessage)
        {
            string escaped = EscapeJson(errorMessage);
            return $"{{\"success\":false,\"error\":\"{escaped}\"}}";
        }

        private static string EscapeJson(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";

            var sb = new System.Text.StringBuilder(str.Length);
            foreach (char c in str)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
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
    }
}
