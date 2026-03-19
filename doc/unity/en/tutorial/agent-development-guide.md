# Agent Development Guide

This document explains how to define and develop an agent based on the PuerTsAgent framework.

## Overview

In this framework, an agent's behavior and capabilities are entirely defined by files under a **resource directory** (Resource Root). Different resource directories represent different agents — be it a Unity Editor assistant, an in-game AI character, or any other role you need.

## Creating an Agent

In C# code, initialize an agent using a resource path. Taking the bundled **Maze Runner** demo as an example:

```csharp
var agent = new AgentScriptManager();
agent.Initialize("maze-runner", () =>
{
    Debug.Log("Maze runner agent is ready!");
});
```

The first parameter of `Initialize` is the resource directory path under Unity's `Resources/` folder. The framework loads the entire agent definition from that directory, including:

- **`system-prompt.md.txt`** — Role definition (System Prompt)
- **`skills/`** — Domain skill documents (loaded on demand, optional)
- **`builtins/`** — Builtin helper modules (executable JS modules)

The complete directory structure for `maze-runner` is as follows:

```
Resources/maze-runner/
├── system-prompt.md.txt          # Role definition (System Prompt)
├── skills/                       # Domain skills (loaded on demand, optional)
└── builtins/                     # Builtin modules (loaded on demand)
    ├── maze-control.mjs          # Maze movement and state queries
    └── screenshot.mjs            # Screenshot to observe the maze
```

All resource files are placed under Unity's `Resources/` directory.

> **File Extension Convention**: Unity `Resources` does not support `.md` and `.mjs` as TextAssets, so:
> - Markdown files use the `.md.txt` extension
> - JS module files use the `.mjs` extension

The following sections describe how to write each of these three types of files.

---

## 1. System Prompt — Role Definition

### Purpose

`system-prompt.md.txt` defines the agent's identity, personality, capability scope, and behavioral guidelines. It is injected at the beginning of the LLM's system prompt, serving as the core "persona" of the agent.

### File Location

```text
<resource-root>/system-prompt.md.txt
```

### Format

Plain text / Markdown format. Write the role definition directly — no front-matter required.

### Examples

**Editor Assistant** (`editor-assistant/system-prompt.md.txt`):

```markdown
You are a helpful AI assistant running inside Unity via PuerTS (a TypeScript/JavaScript runtime for Unity). You can help with game development, scripting, and general questions. Be concise and practical.
```

**Maze AI Example** (`maze-runner/system-prompt.md.txt`, excerpt):

```markdown
You are a Maze Explorer AI — an intelligent agent that navigates through 3D mazes by observing, reasoning, and acting.

## Your Capabilities

You can control a player character in a 3D maze using two builtin modules:
- **maze-control**: Move in compass directions (north/south/east/west) with `movePath()` and query obstacle distances with `getPlayerStatus()`
- **screenshot**: Capture the game view to visually observe the maze

## Goal Description

Your goal is to reach the **maze exit marker** — a tall RED pillar with a bright RED glowing ring.
...
```

> The System Prompt describes the AI's identity, available modules, goals, exploration loop, navigation rules, and other complete behavioral guidelines. It can be quite long — it defines the AI's behavior pattern throughout the entire task.

---

## 2. Skills — Domain Skills

### Purpose

A Skill is a **lazily loaded** Markdown document that provides the LLM with operational guides and rules for a specific domain. The LLM proactively loads the corresponding skill into context via the `loadSkill` tool when needed.

### File Location

```text
<resource-root>/skills/<skill-name>.md.txt
```

### File Format

Skill files use **YAML front-matter** to declare metadata, with Markdown content in the body:

```yaml
---
name: <skill-id>
description: "<one-line description shown to the LLM>"
---

(Markdown body — the actual skill instructions)
```

| Front-matter Field | Required | Description |
|---|---|---|
| `name` | ✅ | Unique identifier; the LLM calls `loadSkill` using this name |
| `description` | ❌ | Brief description shown in the `loadSkill` tool's available skills list |

### Example

`skills/puerts-interop.md.txt`:

```yaml
---
name: puerts-interop
description: "PuerTS JS ↔ C# interop rules: CS/puer globals, out/ref params, generics, operators, Array/List indexer access, async/Task. CRITICAL: Unity edit-mode safety — use sharedMaterial/sharedMesh/DestroyImmediate instead of runtime-only APIs"
---

## PuerTS: JS ↔ C# Interop Rules

You are running in a PuerTS environment. Below are the rules for interacting between JavaScript/TypeScript and C#.

### JS Calling C#

1. **Access C# classes**: Use the global `CS` object with the full namespace path.
   ```js
   const Vector3 = CS.UnityEngine.Vector3;
   const go = new CS.UnityEngine.GameObject("myObj");
   ```
...
```

### Design Guidelines

- **Keep the description accurate**: The LLM relies on the description to determine whether to load the skill
- **Be thorough in content**: The skill document is the LLM's sole reference for executing specific tasks — don't omit critical details
- **One domain per skill**: Maintain single responsibility so the LLM can load precisely what it needs

---

## 3. Builtin — Builtin Helper Modules

### Purpose

Builtin modules are JavaScript modules that provide preset helper functions for the LLM's `evalJsCode` tool. Unlike Skills, Builtins are actual executable code, not documentation.

### File Location

```text
<resource-root>/builtins/<module-name>.mjs
```

> Source code can be written in TypeScript, JavaScript, or any language that compiles to `.mjs`. The project structure and location are flexible. The framework only cares about the final `.mjs` files placed in the resource directory.

### Module Convention

Each Builtin module must export the following two string constants:

| Export | Type | Description |
|---|---|---|
| `summary` | `string` | Brief summary (~one line), always shown in the `evalJsCode` tool description |
| `description` | `string` | Detailed function signatures and usage; the LLM reads this via `import()` |

Additionally, the functions exported by the module are the actual capabilities the LLM can call within `evalJsCode`.

### Example

`builtins/unity-log.mjs` (shown as TypeScript source):

```typescript
// ---- Summary for tool description (always in context) ----
export const summary = `**unity-log** — Unity console log access (retrieve and summarize recent logs). Read \`.description\` to see available functions and their signatures.`;

// ---- Description for on-demand access via import ----
export const description = `
- **\`getUnityLogs(count?, logType?)\`** — Get recent Unity console logs.
  - \`count\` (number, default 20): Number of log entries to retrieve (1-50).
  - \`logType\` (string, default \`'all'\`): Filter by type — \`'all'\`, \`'error'\`, \`'warning'\`, or \`'log'\`.
  - Returns an array of log entry objects: \`{ timestamp, type, message, stackTrace? }\`.
`.trim();

// ---- Function implementations ----
export function getUnityLogs(count: number = 20, logType: string = 'all'): LogEntry[] {
    // Parameter validation...
    const logsJson = CS.LLMAgent.UnityLogBridge.GetRecentLogs(count, logType);
    return JSON.parse(logsJson);
}
```

### Design Guidelines

- **Keep summary short**: It always consumes tokens; just convey the module's purpose
- **List full signatures in description**: The LLM must read the description before it can correctly call functions
- **Validate parameters in functions**: The LLM may pass incorrect arguments; validate and throw meaningful error messages
- **Top-level await is supported**: Modules can use `await` at the top level (e.g., for async initialization)
- C# bridge classes need to be implemented in advance on the Unity side

---

## 4. Complete Development Workflow

Using the **Maze Runner** maze AI agent as an example:

### Step 1: Create the Resource Directory

```text
Resources/maze-runner/
├── system-prompt.md.txt
├── skills/
└── builtins/
```

### Step 2: Write the Role Definition

Edit `system-prompt.md.txt` to define the AI's identity and behavioral guidelines. For a maze AI, you would describe:
- Role identity (maze explorer)
- Available modules (maze-control, screenshot)
- Goal (reach the red endpoint marker)
- Exploration loop (observe → plan → act)
- Navigation strategy (right-hand rule, dead-end detection, etc.)

### Step 3: Write Domain Skills (Optional)

Create `.md.txt` files in the `skills/` directory with YAML front-matter and skill content.

> The Maze Demo does not use skill files — all navigation rules are written directly in the system-prompt. When domain knowledge is extensive and doesn't need to be loaded every time, splitting it into skills is more appropriate.

### Step 4: Write Helper Modules

Write Builtin module source files and place the compiled `.mjs` artifacts under `Resources/maze-runner/builtins/`.

The Maze Demo has two Builtin modules: `maze-control` (movement and state queries) and `screenshot` (capture screenshots for observation). Using `maze-control` as an example (TypeScript source, excerpt):

```typescript
export const summary = `**maze-control** — Control the player in the maze. \`movePath([{dir, steps}, ...])\` executes a multi-segment path. \`getPlayerStatus()\` returns position and obstacle distances. Read \`.description\` for details.`;

export const description = `
- **\`movePath(segments)\`** — Move the player along a multi-segment planned path.
  - \`segments\` (array): Array of \`{ dir: string, steps: number }\`.
  - Returns: \`{ success, stepsCompleted, blocked, reachedGoal, position, message }\`
- **\`getPlayerStatus()\`** — Get the player's position and obstacle distances.
  - Returns: \`{ position, northDistance, southDistance, eastDistance, westDistance, reachedGoal }\`
`.trim();

export async function movePath(segments: PathSegment[]): Promise<MoveSequenceResult> {
    // Parameter validation...
    const directionsJson = JSON.stringify(segments.map(s => s.dir));
    const distancesJson = JSON.stringify(segments.map(s => s.steps));
    const resultJson = await new Promise<string>((resolve, reject) => {
        CS.LLMAgent.MazePlayerBridge.MoveSequenceV2(directionsJson, distancesJson, (json: string) => resolve(json));
    });
    return JSON.parse(resultJson);
}

export async function getPlayerStatus(): Promise<PlayerStatusResult> {
    const resultJson = await new Promise<string>((resolve, reject) => {
        CS.LLMAgent.MazePlayerBridge.GetPlayerStatus((json: string) => resolve(json));
    });
    return JSON.parse(resultJson);
}
```

> Builtin modules call C# bridge classes via the `CS.*` global object. Bridge classes (such as `MazePlayerBridge`) need to be implemented on the Unity side in advance.

### Step 5: Initialize the Agent

In C# code, initialize the agent with the corresponding resource path (see the "Creating an Agent" section at the beginning of this document).

---

## 5. Best Practices

### System Prompt
- Keep it concise and clear; avoid excessive length (it always consumes context tokens)
- Focus on "who you are" and "how you should behave"; don't include framework runtime details

### Skills
- Split complex domain knowledge into independent skill files
- Include keywords in the description to help the LLM decide when to load it
- The more detailed the content, the better — it's the LLM's sole reference for task execution

### Builtins
- Each module should focus on a single functional domain (e.g., scene operations, log queries)
- Summary should be one line; description should list all function signatures completely
- All exported functions should validate parameters and throw meaningful error messages

### General
- One resource directory = one independent agent role
- Different agents are completely isolated, each with its own unique set of skills and tools
