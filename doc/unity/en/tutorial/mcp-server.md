# MCP Server User Guide

## Overview

`com.puerts.mcp` is a Unity Editor plugin (UPM package) that launches an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server inside the Unity Editor, enabling external AI Agents / LLM clients to remotely invoke Unity Editor capabilities through the standard MCP protocol.

**Core Capability**: Through the `evalJsCode` tool, an external AI can execute arbitrary JavaScript code inside the Unity Editor, leveraging PuerTS's C# bridging to access the full `UnityEngine.*` and `UnityEditor.*` APIs.

### Tech Stack

- **Runtime**: PuerTS Node.js backend (V8 engine)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Transport**: HTTP + SSE (Server-Sent Events)
- **Minimum Unity Version**: 2021.3

---

## Dependencies

This package requires the following UPM dependencies:

| Package | Description |
|---------|-------------|
| `com.tencent.puerts.core` | PuerTS core runtime |
| `com.tencent.puerts.nodejs` | PuerTS Node.js backend |

---

## Quick Start

### 1. Open the MCP Server Management Window

From the Unity Editor menu bar, select:

```
PuerTS → MCP Server
```

This opens the MCP Server management window.

### 2. Configure Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| **Resource Root** | `LLMAgent/editor-assistant` | Resource root path for builtin modules |
| **Port** | `3100` | HTTP service listening port (range 1–65535) |

> Settings are automatically saved to `EditorPrefs` and restored on next open.

### 3. Start the Server

Click the **Start Server** button. Once started successfully:

- Status displays green **Running on port 3100**
- SSE Endpoint address is shown: `http://127.0.0.1:3100/sse`

### 4. Stop the Server

Click the **Stop Server** button to shut down the service.

---

## Server Behavior

- **Global Singleton**: The MCP Server instance is unique across the entire Editor session. Closing the management window does not affect the running server.
- **Background Execution**: On start, `Application.runInBackground = true` is set automatically, ensuring the service stays alive when Unity loses focus.
- **Reopen Window**: You can reopen the management window at any time via the menu to check the current server status.

> **Note**: Entering Play mode triggers Unity's Domain Reload, which will restart the service.

---

## API Endpoints

Once started, the MCP Server exposes the following HTTP endpoints (default listener `127.0.0.1:3100`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | `GET` | SSE connection endpoint; clients establish MCP sessions here |
| `/messages?sessionId=xxx` | `POST` | JSON-RPC message endpoint for sending MCP requests |
| `/health` | `GET` | Health check endpoint; returns `{"status": "ok"}` |

All endpoints support CORS (`Access-Control-Allow-Origin: *`).

---

## Client Configuration

### Cursor / Claude Desktop and Other MCP Clients

Add the following SSE-type server to your MCP client configuration file:

```json
{
  "mcpServers": {
    "puerts-unity-editor-assistant": {
      "url": "http://127.0.0.1:3100/sse"
    }
  }
}
```

### Manual Connection Testing

You can use curl to verify the service is running:

```bash
# Health check
curl http://127.0.0.1:3100/health

# Establish SSE connection (will continuously output event stream)
curl -N http://127.0.0.1:3100/sse
```

---

## Provided MCP Tools

### `evalJsCode`

Executes JavaScript code inside the PuerTS runtime environment within the Unity Editor.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `code` | `string` | Must be an async function declaration named `execute` |

**Code Format Requirements:**

```javascript
async function execute() {
    // your logic here
    return someValue;
}
```

**Key Features:**

- Access **any C# API** through the `CS` global object, including `CS.UnityEngine.*` and `CS.UnityEditor.*`
- The VM is **reused across calls** — variables, functions, and state defined in previous calls persist in subsequent calls
- Use `return` to pass back result values; objects are serialized via `JSON.stringify`, primitives are converted to strings
- Use `console.log()` for debug output (outputs to Unity Console)

**Response Format:**

```jsonc
// Success
{ "success": true, "result": "string representation of the return value" }

// Failure
{ "success": false, "error": "error message", "stack": "stack trace" }
```

**Examples:**

```javascript
// Get the position of Main Camera in the scene
async function execute() {
    const go = CS.UnityEngine.GameObject.Find('Main Camera');
    return go.transform.position.toString();
}
```

```javascript
// Get the names of all GameObjects in the active scene
async function execute() {
    const scene = CS.UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    const roots = scene.GetRootGameObjects();
    const names = [];
    for (let i = 0; i < roots.Length; i++) {
        names.push(roots.get_Item(i).name);
    }
    return JSON.stringify(names);
}
```

```javascript
// Create a new Cube
async function execute() {
    const cube = CS.UnityEngine.GameObject.CreatePrimitive(CS.UnityEngine.PrimitiveType.Cube);
    cube.name = 'MyCube';
    cube.transform.position = new CS.UnityEngine.Vector3(0, 1, 0);
    return `Created ${cube.name} at ${cube.transform.position}`;
}
```

---

## Builtin Helper Modules

The `evalJsCode` runtime environment comes with several preloaded helper modules that encapsulate common Unity Editor operations. Load them via ESM dynamic `import()`.

> **Usage Pattern**: On first use of a module, read its `.description` to learn the API; then call functions directly thereafter.

```javascript
// First use — read description
async function execute() {
    const mod = await import('LLMAgent/editor-assistant/builtins/scene-view.mjs');
    return mod.description;
}
```

```javascript
// After learning the API — call directly
async function execute() {
    const sv = await import('LLMAgent/editor-assistant/builtins/scene-view.mjs');
    sv.focusSceneViewOn('Main Camera');
    return 'Done';
}
```

### Module List

#### 1. `scene-view` — Scene View Camera Control & Hierarchy Operations

**Path**: `LLMAgent/editor-assistant/builtins/scene-view.mjs`

| Function | Description |
|----------|-------------|
| `sceneViewZoom(direction, amount?)` | Zoom the scene view camera (like mouse scroll) |
| `sceneViewPan(direction, amount?)` | Pan the scene view camera (like middle-click drag) |
| `sceneViewOrbit(direction, amount?)` | Orbit the scene view camera (like right-click drag) |
| `getSceneViewState()` | Get the current scene view camera state |
| `setSceneViewCamera(pivot?, rotation?, size?)` | Set the scene view camera state directly |
| `focusSceneViewOn(gameObjectName)` | Focus on a specified GameObject (like pressing F) |
| `getGameObjectHierarchy(name?, depth?)` | Get the GameObject hierarchy tree |
| `selectGameObject(name)` | Select a GameObject in the Editor |
| `saveScene()` | Save the current scene |

#### 2. `screenshot` — Screenshot Capture

**Path**: `LLMAgent/editor-assistant/builtins/screenshot.mjs`

| Function | Description |
|----------|-------------|
| `captureScreenshot(maxWidth?, maxHeight?)` | Capture a Game view screenshot |
| `captureSceneView(maxWidth?, maxHeight?)` | Capture a Scene view screenshot |

> Screenshots are automatically returned to the AI as image content — no manual base64 handling required.

#### 3. `type-reflection` — C# Type Reflection

**Path**: `LLMAgent/editor-assistant/builtins/type-reflection.mjs`

| Function | Description |
|----------|-------------|
| `listNamespaces()` | List all available C# namespaces |
| `listTypesInNamespace(namespaces)` | List all public types in specified namespaces |
| `getTypeDetails(typeNames)` | Get detailed type information (properties, methods, fields, etc.) |

#### 4. `unity-log` — Unity Console Logs

**Path**: `LLMAgent/editor-assistant/builtins/unity-log.mjs`

| Function | Description |
|----------|-------------|
| `getUnityLogs(count?, logType?)` | Get recent Unity console logs |
| `getUnityLogSummary()` | Get a log summary (counts by type) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  External AI Client (Cursor / Claude Desktop)   │
│         MCP Client via SSE Transport            │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (SSE + JSON-RPC)
                       ▼
┌─────────────────────────────────────────────────┐
│              Unity Editor Process               │
│  ┌───────────────────────────────────────────┐  │
│  │    McpServerWindow (Editor UI)            │  │
│  │    - Start / Stop / Status                │  │
│  └──────────────────┬────────────────────────┘  │
│                     │                           │
│  ┌──────────────────▼────────────────────────┐  │
│  │    McpScriptManager (C# Runtime)          │  │
│  │    - Manages PuerTS ScriptEnv             │  │
│  │    - EditorApplication.update ticking     │  │
│  └──────────────────┬────────────────────────┘  │
│                     │                           │
│  ┌──────────────────▼────────────────────────┐  │
│  │    PuerTS Node.js VM (V8)                 │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  MCP Server (TypeScript/JS)         │  │  │
│  │  │  - HTTP Server (node:http)          │  │  │
│  │  │  - SSE Transport                    │  │  │
│  │  │  - evalJsCode Tool                  │  │  │
│  │  │  - Builtin Helper Modules           │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## FAQ

### Q: Do I need to restart after changing the port?

Yes. The port and resource root can only be changed while the server is stopped. Restart the server after making changes.

### Q: Does closing the MCP Server management window stop the server?

No. The MCP Server instance is a global singleton, independent of the window lifecycle. Reopen the window to see the current running status.

### Q: Does entering Play mode affect the server?

Unity performs a Domain Reload when entering Play mode, which destroys and rebuilds the JS engine. You will need to manually restart the server after entering Play mode.

### Q: How do I start the MCP Server from code?

```csharp
using PuertsMcp;

var manager = new McpScriptManager();
manager.Initialize("LLMAgent/editor-assistant", 3100, () =>
{
    Debug.Log("MCP Server is ready!");
});

// Shutdown
manager.Shutdown();
```

### Q: Does it support multiple simultaneous client connections?

Yes. Each SSE connection creates an independent session. Multiple AI clients can connect and interact simultaneously.
