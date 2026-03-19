# MCP Server 使用文档

## 概述

`com.puerts.mcp` 是一个 Unity Editor 插件（UPM 包），它在 Unity 编辑器内启动一个 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 服务器，使外部 AI Agent / LLM 客户端能通过标准 MCP 协议远程调用 Unity Editor 的能力。

**核心能力**：通过 `evalJsCode` 工具，外部 AI 可以在 Unity 编辑器中执行任意 JavaScript 代码，借助 PuerTS 的 C# 桥接能力访问完整的 `UnityEngine.*` 和 `UnityEditor.*` API。

### 技术栈

- **运行时**：PuerTS Node.js 后端（V8 引擎）
- **MCP SDK**：`@modelcontextprotocol/sdk`
- **传输层**：HTTP + SSE (Server-Sent Events)
- **最低 Unity 版本**：2021.3

---

## 依赖

本包需要以下 UPM 依赖：

| 包名 | 说明 |
|------|------|
| `com.tencent.puerts.core` | PuerTS 核心运行时 |
| `com.tencent.puerts.nodejs` | PuerTS Node.js 后端 |

---

## 快速开始

### 1. 打开 MCP Server 管理窗口

在 Unity 编辑器菜单栏中选择：

```
PuerTS → MCP Server
```

将打开 MCP Server 管理窗口。

### 2. 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| **Resource Root** | `LLMAgent/editor-assistant` | 内置模块的资源根路径 |
| **Port** | `3100` | HTTP 服务监听端口（范围 1-65535） |

> 配置会自动保存到 `EditorPrefs`，下次打开时自动恢复。

### 3. 启动服务

点击 **Start Server** 按钮。启动成功后：

- 状态显示为绿色 **Running on port 3100**
- 显示 SSE Endpoint 地址：`http://127.0.0.1:3100/sse`

### 4. 停止服务

点击 **Stop Server** 按钮即可关闭服务。

---

## 服务行为

- **全局单例**：MCP Server 实例在整个 Editor 会话中唯一，关闭管理窗口不会影响服务运行
- **后台运行**：启动时自动设置 `Application.runInBackground = true`，确保 Unity 切到后台时服务不中断
- **重新打开窗口**：随时可通过菜单重新打开管理窗口查看当前服务状态

> **注意**：点击 Play 进入播放模式会触发 Unity 的域重载（Domain Reload），这会导致服务重启。

---

## API 端点

MCP Server 启动后提供以下 HTTP 端点（默认监听 `127.0.0.1:3100`）：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/sse` | `GET` | SSE 连接端点，客户端通过此端点建立 MCP 会话 |
| `/messages?sessionId=xxx` | `POST` | JSON-RPC 消息端点，用于发送 MCP 请求 |
| `/health` | `GET` | 健康检查端点，返回 `{"status": "ok"}` |

所有端点均支持 CORS（`Access-Control-Allow-Origin: *`）。

---

## 客户端配置

### Cursor / Claude Desktop 等 MCP 客户端

在 MCP 客户端配置文件中添加以下 SSE 类型的服务器：

```json
{
  "mcpServers": {
    "puerts-unity-editor-assistant": {
      "url": "http://127.0.0.1:3100/sse"
    }
  }
}
```

### 手动测试连接

可以使用 curl 验证服务是否正常运行：

```bash
# 健康检查
curl http://127.0.0.1:3100/health

# 建立 SSE 连接（会持续输出事件流）
curl -N http://127.0.0.1:3100/sse
```

---

## 提供的 MCP 工具

### `evalJsCode`

在 Unity 编辑器内的 PuerTS 运行时环境中执行 JavaScript 代码。

**参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `code` | `string` | 必须是一个名为 `execute` 的 async 函数声明 |

**代码格式要求：**

```javascript
async function execute() {
    // 你的逻辑代码
    return someValue;
}
```

**关键特性：**

- 通过 `CS` 全局对象可以调用**任意 C# API**，包括 `CS.UnityEngine.*` 和 `CS.UnityEditor.*`
- VM 是**跨调用复用**的——前次调用中定义的变量、函数和状态在后续调用中持续可用
- 使用 `return` 返回结果值；对象通过 `JSON.stringify` 序列化，基本类型转为字符串
- 使用 `console.log()` 输出调试信息（输出到 Unity Console）

**返回格式：**

```jsonc
// 成功
{ "success": true, "result": "返回值的字符串表示" }

// 失败
{ "success": false, "error": "错误信息", "stack": "堆栈信息" }
```

**示例：**

```javascript
// 获取场景中 Main Camera 的位置
async function execute() {
    const go = CS.UnityEngine.GameObject.Find('Main Camera');
    return go.transform.position.toString();
}
```

```javascript
// 获取当前场景中所有 GameObject 的名称
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
// 创建一个新的 Cube
async function execute() {
    const cube = CS.UnityEngine.GameObject.CreatePrimitive(CS.UnityEngine.PrimitiveType.Cube);
    cube.name = 'MyCube';
    cube.transform.position = new CS.UnityEngine.Vector3(0, 1, 0);
    return `Created ${cube.name} at ${cube.transform.position}`;
}
```

---

## 内置 Helper 模块

`evalJsCode` 运行环境中预加载了多个 Helper 模块，提供常用的 Unity 编辑器操作封装。通过 ESM 动态 `import()` 加载使用。

> **使用模式**：首次使用某模块时，先读取 `.description` 了解 API；之后直接调用函数即可。

```javascript
// 首次使用——读取描述
async function execute() {
    const mod = await import('LLMAgent/editor-assistant/builtins/scene-view.mjs');
    return mod.description;
}
```

```javascript
// 了解 API 后——直接调用
async function execute() {
    const sv = await import('LLMAgent/editor-assistant/builtins/scene-view.mjs');
    sv.focusSceneViewOn('Main Camera');
    return 'Done';
}
```

### 模块列表

#### 1. `scene-view` — 场景视图控制与层级操作

**路径**：`LLMAgent/editor-assistant/builtins/scene-view.mjs`

| 函数 | 说明 |
|------|------|
| `sceneViewZoom(direction, amount?)` | 缩放场景视图相机（类似鼠标滚轮） |
| `sceneViewPan(direction, amount?)` | 平移场景视图相机（类似中键拖拽） |
| `sceneViewOrbit(direction, amount?)` | 旋转场景视图相机（类似右键拖拽） |
| `getSceneViewState()` | 获取当前场景视图相机状态 |
| `setSceneViewCamera(pivot?, rotation?, size?)` | 直接设置场景视图相机状态 |
| `focusSceneViewOn(gameObjectName)` | 聚焦到指定 GameObject（类似按 F 键） |
| `getGameObjectHierarchy(name?, depth?)` | 获取 GameObject 层级树 |
| `selectGameObject(name)` | 在编辑器中选中 GameObject |
| `saveScene()` | 保存当前场景 |

#### 2. `screenshot` — 截图功能

**路径**：`LLMAgent/editor-assistant/builtins/screenshot.mjs`

| 函数 | 说明 |
|------|------|
| `captureScreenshot(maxWidth?, maxHeight?)` | 截取 Game 视图截图 |
| `captureSceneView(maxWidth?, maxHeight?)` | 截取 Scene 视图截图 |

> 截图会自动作为图片内容返回给 AI，无需手动处理 base64 数据。

#### 3. `type-reflection` — C# 类型反射

**路径**：`LLMAgent/editor-assistant/builtins/type-reflection.mjs`

| 函数 | 说明 |
|------|------|
| `listNamespaces()` | 列出所有可用的 C# 命名空间 |
| `listTypesInNamespace(namespaces)` | 列出指定命名空间下的所有公共类型 |
| `getTypeDetails(typeNames)` | 获取类型的详细信息（属性、方法、字段等） |

#### 4. `unity-log` — Unity 控制台日志

**路径**：`LLMAgent/editor-assistant/builtins/unity-log.mjs`

| 函数 | 说明 |
|------|------|
| `getUnityLogs(count?, logType?)` | 获取最近的 Unity 控制台日志 |
| `getUnityLogSummary()` | 获取日志摘要统计（按类型分类的数量） |

---

## 架构概览

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

## 常见问题

### Q: 修改端口后需要重启吗？

是的。端口和资源根路径只能在服务停止时修改。修改后需要重新启动服务。

### Q: 关闭 MCP Server 管理窗口会停止服务吗？

不会。MCP Server 实例是全局单例，独立于窗口生命周期。重新打开窗口即可看到当前运行状态。

### Q: 进入 Play 模式会影响服务吗？

Unity 进入 Play 模式时会执行域重载（Domain Reload），这会导致 JS 引擎被销毁并重建。目前进入 Play 模式后需要手动重新启动服务。

### Q: 如何在代码中调用 MCP Server？

```csharp
using PuertsMcp;

var manager = new McpScriptManager();
manager.Initialize("LLMAgent/editor-assistant", 3100, () =>
{
    Debug.Log("MCP Server is ready!");
});

// 关闭
manager.Shutdown();
```

### Q: 支持多个客户端同时连接吗？

支持。每个 SSE 连接会创建独立的会话（session），多个 AI 客户端可以同时连接和使用。
