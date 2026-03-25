---
name: install-puerts-for-unity
description: "PuerTS installation skill — installs PuerTS UPM packages via AI-guided prompts."
---

# How to install

If you don't know which style or version to use. please visit [FAQ](./faq.md#installation-relavanted)

### Install via Agent Skill (Recommended)

After installing this skill, you can use natural language prompts to let AI coding assistants handle the installation for you. Popular AI coding assistants that support Agent Skills include: CodeBuddy, Claude Code, Cursor, Windsurf, Cline, GitHub Copilot, etc.

**Skill path**: `puerts/unity/skills/install-puerts-for-unity`

**Example prompts**:
- `Install puerts v8 package` — installs core + v8
- `Install puerts v8 package, version v3.0.1` — installs core + v8 with a specific version
- `Install puerts mcp package` — installs core + v8 + nodejs + mcp (auto dependency resolution)
- `Install puerts agent package` — installs core + v8 + agent (auto dependency resolution)
- `Install puerts Editor Assistant` — installs both agent and mcp packages with all dependencies
- `Install puerts Editor Assistant mcp version` — installs only the mcp package with its dependencies
- `Install puerts lua package` — installs core + lua
- `Install puerts quickjs package` — installs core + quickjs

The AI coding assistant will automatically handle version selection, dependency resolution, and installation steps.

### Download and Install Manually  | available in all versions
More involved than Agent Skill, but friendly for modifying PuerTS yourself.

1. Go to [Github Releases](https://github.com/Tencent/puerts/releases) to download the packages you need (e.g. PuerTS_V8_x.x.x.tgz).
2. Extract the archive to any local directory (you will get a UPM package folder, e.g. `v8`, containing a `package.json`).

#### Unity versions with UPM support (Unity 2018.3+)

Import via the Unity Editor's UPM disk installation:

1. Open the Unity Editor, go to **Window → Package Manager**.
2. Click the **＋** button in the top-left corner and select **Add package from disk...**.
3. In the file browser, navigate to the extracted package folder, select the `package.json` file inside it, and click **Open**.
4. Unity will automatically recognize and import the UPM package.
5. If you need to install multiple packages (e.g. core + v8), repeat the above steps for each package.

#### Unity versions without UPM support (below Unity 2018.3)

Copy the extracted folder directly into your project's `Assets` directory.

> You also need to append `.txt` to the built-in js files in the PuerTS code.

> If you encounter the "move to trash" issue on macOS, run `sudo xattr -r -d com.apple.quarantine puerts.bundle`. Note this may cause git issues.
