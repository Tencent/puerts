---
name: PuerTS Agent Development Guide
description: Guide for developing LLM agents based on PuerTsAgent framework — covers resource directory structure, system-prompt, skills, builtin modules, and best practices.
---

# PuerTS Agent Development Guide

This skill provides the complete guide for developing LLM agents based on the PuerTsAgent framework.

> **⚠️ Important — Required Packages**: This framework depends on PuerTS **core**, **v8**, and **agent** packages. Before proceeding, you **must** check the Unity project's `Packages/manifest.json` to verify that the following packages are installed:
> - `com.tencent.puerts.core`
> - `com.tencent.puerts.v8`
> - `com.tencent.puerts.agent`
>
> If any of these packages are missing, they must be installed first before using this skill. you MUST first invoke the **"Install PuerTS for Unity"** skill to AUTO complete the setup.

> **⚠️ Prerequisite**: Before using this skill to create or modify an agent, you **must** know the agent's resource directory path under Unity `Resources/` (e.g., `maze-runner`, `editor-assistant`). If the user has not provided this path, **ask the user** which `Resources/` subdirectory to use before proceeding. All agent files (system-prompt, skills, builtins) are organized under this path.

> **⚠️ Builtin Language Choice**: When creating builtin modules, you **must ask the user** whether they want to write builtins in **TypeScript** or **JavaScript**:
> - **TypeScript** → Create a dedicated TS project (with `package.json`, `tsconfig.json`, `esbuild.mjs`) whose build output (`outdir`) points to `Assets/Resources/<agent-name>/builtins/`. See [TypeScript Project Setup for Builtins](#typescript-project-setup-for-builtins) section below.
> - **JavaScript** → Write `.mjs` files directly in `Assets/Resources/<agent-name>/builtins/`.

## Overview

In this framework, an agent's behavior and capabilities are entirely defined by files in a **resource directory** (Resource Root). Different resource directories represent different agents — Unity editor assistants, in-game AI characters, or any role you need.

> **Key Concept**: Both `system-prompt.md.txt` and files under `skills/` are essentially **prompts** (natural language instructions for the LLM). The only difference is their **loading strategy**:
> - **`system-prompt.md.txt`** — Always present in context (persistent). Put prompts here that are needed for **most tasks**.
> - **`skills/*.md.txt`** — Loaded on demand by the LLM via `loadSkill`. Put prompts here that are **not needed for every task** — they are loaded only when the LLM determines they are relevant.

## Creating an Agent

Initialize an agent in C# via its resource path:

```csharp
var agent = new AgentScriptManager();
agent.Initialize("maze-runner", () =>
{
    Debug.Log("Maze runner agent is ready!");
});
```

The first parameter of `Initialize` is the resource directory path under Unity `Resources/`. The framework loads the full agent definition from this directory:

- **`system-prompt.md.txt`** — Role definition (System Prompt)
- **`skills/`** — Domain skill documents (loaded on demand, optional)
- **`builtins/`** — Built-in helper modules (executable JS modules)

### Example Directory Structure

```
Resources/maze-runner/
├── system-prompt.md.txt          # Role definition (System Prompt)
├── skills/                       # Domain skills (loaded on demand, optional)
└── builtins/                     # Built-in modules (loaded on demand)
    ├── maze-control.mjs          # Maze movement and status query
    └── screenshot.mjs            # Screenshot to observe the maze
```

All resource files are placed in Unity's `Resources/` directory.

> **File extension convention**: Unity `Resources` does not support `.md` and `.mjs` as TextAsset, so:
> - Markdown files use `.md.txt` suffix
> - JS module files use `.mjs` suffix

---

## 1. System Prompt — Role Definition

### Purpose

`system-prompt.md.txt` defines the agent's identity, personality, capabilities, and behavioral rules. It is injected at the beginning of the LLM's system prompt and is the core of the agent's "persona."

> **This is a persistent prompt** — it is always present in the LLM's context for every conversation turn. Therefore, put only the most frequently used instructions here — things the agent needs for the **majority** of its tasks. Avoid stuffing rarely-used domain knowledge here, as it permanently consumes context tokens.

### File Location

```text
<resource-root>/system-prompt.md.txt
```

### Format

Plain text / Markdown format, write role definition directly, no front-matter needed.

### Example — Editor Assistant

```markdown
You are a helpful AI assistant running inside Unity via PuerTS (a TypeScript/JavaScript runtime for Unity). You can help with game development, scripting, and general questions. Be concise and practical.
```

### Example — Maze AI (excerpt)

```markdown
You are a Maze Explorer AI — an intelligent agent that navigates through 3D mazes by observing, reasoning, and acting.

## Your Capabilities

You can control a player character in a 3D maze using two builtin modules:
- **maze-control**: Move in compass directions (north/south/east/west) with `movePath()` and query obstacle distances with `getPlayerStatus()`
- **screenshot**: Capture the game view to visually observe the maze

## Goal Description

Your goal is to reach the **maze exit marker** — a tall RED pillar with a bright RED glowing ring.
```

> The System Prompt describes the AI's identity, available modules, goals, exploration loops, navigation rules, etc. It can be lengthy — it defines the AI's behavior pattern throughout the task.

---

## 2. Skills — Domain Skills

### Purpose

A Skill is an **on-demand loaded** Markdown document providing domain-specific operation guides and rules for the LLM. The LLM actively loads skills into context via the `loadSkill` tool when needed.

> **Skills are prompts too** — just like `system-prompt.md.txt`, they are natural language instructions. The key difference is that skills are **not always in context**. If a piece of knowledge is not needed for most tasks the agent handles, it belongs in a skill file rather than in the system prompt. This keeps the base context lean while still making specialized knowledge available when the LLM needs it.

### File Location

```text
<resource-root>/skills/<skill-name>.md.txt
```

### File Format

Skill files use **YAML front-matter** for metadata, body is Markdown content:

```yaml
---
name: <skill-id>
description: "<one-line description shown to the LLM>"
---

(Markdown body — the actual skill instructions)
```

| Front-matter Field | Required | Description |
|---|---|---|
| `name` | ✅ | Unique identifier, LLM calls `loadSkill` with this name |
| `description` | ❌ | Short description shown in `loadSkill` available skills list |

### Example

`skills/puerts-interop.md.txt`:

```yaml
---
name: puerts-interop
description: "PuerTS JS ↔ C# interop rules: CS/puer globals, out/ref params, generics, operators, Array/List indexer access, async/Task."
---

## PuerTS: JS ↔ C# Interop Rules
...
```

### Design Tips

- **description should be accurate**: LLM decides whether to load based on description
- **content should be thorough**: skill docs are the LLM's only reference for specific tasks
- **one domain per skill**: keep responsibilities single for precise loading
- **system-prompt vs skill decision rule**: If the agent needs this knowledge in >80% of tasks → put it in `system-prompt.md.txt`. Otherwise → put it in `skills/` for on-demand loading

---

## 3. Builtin — Built-in Helper Modules

### Purpose

Builtin modules are JavaScript modules providing pre-built helper functions for the LLM's `evalJsCode` tool. Unlike Skills, Builtins are actually executable code, not documentation.

### File Location

```text
<resource-root>/builtins/<module-name>.mjs
```

> Source code can use TypeScript, JavaScript, or any language compilable to `.mjs`. The framework only cares about the final `.mjs` files in the resource directory.

### Module Contract

Every Builtin module must export the following two string constants:

| Export | Type | Description |
|---|---|---|
| `summary` | `string` | Short summary (~one line), always shown in `evalJsCode` tool description |
| `description` | `string` | Detailed function signatures and usage, LLM reads via `import()` |

Additionally, the module's exported functions are the actual capabilities the LLM can call in `evalJsCode`.

### Example — `builtins/unity-log.mjs` (shown as TypeScript source)

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
    const logsJson = CS.LLMAgent.UnityLogBridge.GetRecentLogs(count, logType);
    return JSON.parse(logsJson);
}
```

### Example — `builtins/maze-control.mjs` (TypeScript source, excerpt)

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

### Design Tips

- **summary should be brief**: it always consumes tokens, just convey the module's purpose
- **description must list complete signatures**: LLM must read description before calling functions
- **functions should validate parameters**: LLM may pass incorrect params, validate and throw meaningful errors
- **top-level await is supported**: modules can use `await` at top level (e.g., async initialization)
- C# bridge classes must be pre-implemented on the Unity side

---

## 4. Complete Development Workflow

### Step 1: Create Resource Directory

```
Resources/<agent-name>/
├── system-prompt.md.txt
├── skills/
└── builtins/
```

### Step 2: Write Role Definition

Edit `system-prompt.md.txt` to define the AI's identity and behavioral rules. For example, a maze AI should describe:
- Role identity (maze explorer)
- Available modules (maze-control, screenshot)
- Goal (reach the red exit marker)
- Exploration loop (observe → plan → act)
- Navigation strategy (right-hand rule, dead-end detection, etc.)

### Step 3: Write Domain Skills (Optional)

Create `.md.txt` files in the `skills/` directory with YAML front-matter and skill content.

> The Maze Demo doesn't use skill files — all navigation rules are directly in system-prompt. When domain knowledge is extensive and doesn't need to be loaded every time, splitting into skills is more appropriate.

### Step 4: Write Helper Modules

First, ask the user whether to write builtins in **TypeScript** or **JavaScript**:

- **TypeScript**: Create a dedicated TS project following the [TypeScript Project Setup for Builtins](#typescript-project-setup-for-builtins) template (Section 6). The project's build output will automatically go to `Resources/<agent-name>/builtins/`.
- **JavaScript**: Write `.mjs` files directly in `Assets/Resources/<agent-name>/builtins/`.

### Step 5: Initialize the Agent

In C# code, initialize the agent with the corresponding resource path (see "Creating an Agent" section above).

---

## 5. Best Practices

### System Prompt
- Keep it concise and clear, avoid excessive length (it always consumes context tokens)
- Focus on "who you are" and "what you should do", don't include framework runtime details
- Only include prompts needed for the **majority** of tasks — this is always-on context

### Skills
- Split complex domain knowledge into separate skill files
- Include keywords in description to help LLM decide when to load
- The more detailed the better — this is the LLM's only reference for the task
- Remember: skills and system-prompt are both prompts; the difference is persistent vs on-demand loading

### Builtins
- Each module focuses on one functional area (e.g., scene operations, log queries)
- Summary should be one line, description must list all function signatures completely
- All exported functions should validate parameters and throw meaningful errors

### General
- One resource directory = one independent agent role
- Different agents are completely isolated, can have entirely different skills and toolsets

---

## 6. TypeScript Project Setup for Builtins

When the user chooses TypeScript for builtins, create a dedicated TS project with the following structure and files. Replace `<agent-name>` with the actual agent name (e.g., `maze-runner`).

### Project Structure

```
Ts<AgentNamePascalCase>/          # e.g., TsMazeRunner/
├── package.json
├── tsconfig.json
├── esbuild.mjs                   # Build script — outputs to Resources/<agent-name>/builtins/
└── src/
    └── builtins/
        └── <module-name>.mts     # TypeScript source files
```

### package.json Template

```json
{
  "name": "<agent-name>",
  "version": "1.0.0",
  "description": "<Agent description> - TypeScript builtins",
  "private": true,
  "scripts": {
    "build": "node esbuild.mjs",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "esbuild": "^0.25.0",
    "typescript": "^5.4.0"
  }
}
```

### tsconfig.json Template

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": false,
    "noEmit": true,
    "typeRoots": ["../Assets/Gen/Typing", "../puerts/unity/upms/core/Typing"]
  },
  "include": ["src/**/*.mts", "src/**/*.d.ts", "../Assets/Gen/Typing/csharp/index.d.ts"],
  "exclude": ["node_modules"]
}
```

### esbuild.mjs Template

```javascript
import { build } from 'esbuild';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Build <agent-name> builtins modules
const builtinSrcDir = 'src/builtins';
const builtinOutDir = '../Assets/Resources/<agent-name>/builtins';

const builtinFiles = existsSync(builtinSrcDir)
    ? readdirSync(builtinSrcDir).filter(f =>
        f.endsWith('.mts') && !f.endsWith('.d.mts'))
    : [];

if (builtinFiles.length > 0) {
    if (!existsSync(builtinOutDir)) {
        mkdirSync(builtinOutDir, { recursive: true });
    }

    const builtinEntries = builtinFiles.map(f => join(builtinSrcDir, f));

    await build({
        entryPoints: builtinEntries,
        bundle: true,
        format: 'esm',
        outdir: builtinOutDir,
        outExtension: { '.js': '.mjs' },
        platform: 'neutral',
        target: 'esnext',
        sourcemap: false,
        minify: false,
        keepNames: true,
        external: [],
        define: {
            'process.env.NODE_ENV': '"production"',
        },
    });

    console.log(`[esbuild:<agent-name>] Built ${builtinFiles.length} builtins module(s) → ${builtinOutDir}/`);
} else {
    console.log('[esbuild:<agent-name>] No builtins modules found in src/builtins/');
}
```

### Setup Steps

After creating the project files:

1. Run `npm install` in the project directory to install dependencies
2. Write `.mts` source files in `src/builtins/`
3. Run `npm run build` to compile and output `.mjs` files to `Assets/Resources/<agent-name>/builtins/`
4. Run `npm run typecheck` for type checking (optional but recommended)
