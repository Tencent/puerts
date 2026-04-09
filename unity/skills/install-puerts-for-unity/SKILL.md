---
name: Install PuerTS for Unity
description: Guide for downloading and installing PuerTS UPM packages into a Unity project — covers version selection, package dependencies, download/extract and git URL installation methods, and Editor Assistant setup.
---

# Install PuerTS for Unity

This skill guides you through downloading and installing PuerTS packages into a Unity project.

> **⚠️ Important**: Always ask the user which PuerTS version they want to install if they haven't specified one. The version number follows the **Core** package's version (e.g., `3.0.2`).

---

## 1. Release Page & Version

- The release download page URL pattern is:
  ```
  https://github.com/Tencent/puerts/releases/tag/Unity_v{VERSION}
  ```
  For example: `https://github.com/Tencent/puerts/releases/tag/Unity_v3.0.2`

> **⚠️ Important — Version Numbers Inside Archives**: The version number in the release page URL (e.g., `Unity_v3.0.2`) is based on the **Core** package version. However, the version numbers inside each `.tar.gz` filename may differ — each package follows its own versioning cadence. You may need to download/parse the release page HTML to determine the exact filenames available.

---

## 2. Available Packages

Each release page may contain the following `.tar.gz` archives, each corresponding to a UPM package:

| Archive File | UPM Package | Has Native Plugins | Always Available |
|---|---|---|---|
| `PuerTS_Core_{ver}.tar.gz` | `com.tencent.puerts.core` | ✅ Yes | ✅ Yes |
| `PuerTS_Lua_{ver}.tar.gz` | `com.tencent.puerts.lua` | ✅ Yes | ✅ Yes |
| `PuerTS_Nodejs_{ver}.tar.gz` | `com.tencent.puerts.nodejs` | ✅ Yes | ✅ Yes |
| `PuerTS_Python_{ver}.tar.gz` | `com.tencent.puerts.python` | ✅ Yes | ✅ Yes |
| `PuerTS_Quickjs_{ver}.tar.gz` | `com.tencent.puerts.quickjs` | ✅ Yes | ✅ Yes |
| `PuerTS_V8_{ver}.tar.gz` | `com.tencent.puerts.v8` | ✅ Yes | ✅ Yes |
| `PuerTS_Webgl_{ver}.tar.gz` | `com.tencent.puerts.webgl` | ❌ No | ✅ Yes |
| `PuerTS_Agent_{ver}.tar.gz` | `com.tencent.puerts.agent` | ❌ No | ❌ Not every release |
| `PuerTS_MCP_{ver}.tar.gz` | `com.tencent.puerts.mcp` | ❌ No | ❌ Not every release |

### Notable Package Features

- **`com.tencent.puerts.agent`**: Provides an **Agent framework** for building LLM agents, and also includes an **Agent-based Editor Assistant** for Unity.
- **`com.tencent.puerts.mcp`**: Provides an **MCP (Model Context Protocol) framework**, and also includes an **MCP-based Editor Assistant** for Unity.

> Both the `agent` and `mcp` packages offer an **Editor Assistant** variant. See Section 5 for how to handle user requests like "install PuerTS Editor Assistant".

---

## 3. Package Dependencies

> **⚠️ Important**: Packages have dependency relationships. When a user requests to install a package, you **must** ensure all of its dependencies are also installed.

### Dependency Rules

- **`com.tencent.puerts.core`** is the foundational package — **all other packages depend on it**.
- **`com.tencent.puerts.agent`** depends on `com.tencent.puerts.core` + `com.tencent.puerts.v8`
- **`com.tencent.puerts.mcp`** depends on `com.tencent.puerts.core` + `com.tencent.puerts.v8` + `com.tencent.puerts.agent`
- **All backend packages** (`com.tencent.puerts.v8`, `com.tencent.puerts.lua`, `com.tencent.puerts.nodejs`, `com.tencent.puerts.python`, `com.tencent.puerts.quickjs`, `com.tencent.puerts.webgl`) depend on `com.tencent.puerts.core`

### Dependency Graph

```
com.tencent.puerts.core  (required by all)
  ├── com.tencent.puerts.v8
  │     ├── com.tencent.puerts.agent
  │     │     └── com.tencent.puerts.mcp
  │     └── com.tencent.puerts.mcp
  ├── com.tencent.puerts.nodejs
  ├── com.tencent.puerts.lua
  ├── com.tencent.puerts.python
  ├── com.tencent.puerts.quickjs
  └── com.tencent.puerts.webgl
```

### Examples of Automatic Dependency Resolution

| User requests to install | Must also install |
|---|---|
| `agent` | `core`, `v8` |
| `mcp` | `core`, `v8`, `agent` |
| `mcp` + `agent` | `core`, `v8` |
| `v8` | `core` |
| `lua` | `core` |

---

## 4. Installation Methods

### 4.1 Download & Extract Method (Required for packages with native plugins)

The following packages contain compiled native binary plugins and **must** be installed by downloading from the release page:

- `com.tencent.puerts.core`
- `com.tencent.puerts.lua`
- `com.tencent.puerts.nodejs`
- `com.tencent.puerts.python`
- `com.tencent.puerts.quickjs`
- `com.tencent.puerts.v8`

**Steps:**

1. Go to `https://github.com/Tencent/puerts/releases/tag/Unity_v{VERSION}`
2. Download the required `.tar.gz` file(s) (e.g., `PuerTS_Core_3.0.2.tar.gz`)
3. Extract the archive — it will produce a directory (e.g., `core/`) containing a standard UPM package structure with a `package.json`
4. Move the extracted directory into the Unity project's `Packages/` folder
5. Verify installation by checking `Packages/manifest.json`

### 4.2 Git URL Method (Available for packages without native plugins)

The following packages can also be installed via Unity's **Add package from git URL** method:

- `com.tencent.puerts.webgl`
- `com.tencent.puerts.agent`
- `com.tencent.puerts.mcp`

#### When the package **exists** on the release page

You can either:
- Use the **Download & Extract** method (Section 4.1), OR
- Use a **versioned git URL** in Unity Package Manager:
  ```
  https://github.com/Tencent/puerts.git?path=unity/upms/{package_name}#Unity_v{VERSION}
  ```
  Examples:
  ```
  https://github.com/Tencent/puerts.git?path=unity/upms/agent#Unity_v3.0.2
  https://github.com/Tencent/puerts.git?path=unity/upms/mcp#Unity_v3.0.2
  https://github.com/Tencent/puerts.git?path=unity/upms/webgl#Unity_v3.0.2
  ```

#### When the package **does NOT exist** on the release page

Since `com.tencent.puerts.agent` and `com.tencent.puerts.mcp` are newer packages and not available in every release, if they are missing from the download page, install them using an **unversioned git URL**:
  ```
  https://github.com/Tencent/puerts.git?path=unity/upms/agent
  https://github.com/Tencent/puerts.git?path=unity/upms/mcp
  ```

#### How to add a git URL in Unity

Add the URL to the project's `Packages/manifest.json` under `"dependencies"`, for example:
```json
{
  "dependencies": {
    "com.tencent.puerts.agent": "https://github.com/Tencent/puerts.git?path=unity/upms/agent#Unity_v3.0.2"
  }
}
```
Or use the Unity Editor: **Window → Package Manager → + → Add package from git URL...**

---

## 5. Installation Workflow

When a user asks to install PuerTS, follow this workflow:

1. **Ask the user** which version to install (if not already specified)
2. **Ask the user** which packages they need (common combo: `com.tencent.puerts.core` + `com.tencent.puerts.v8` + `com.tencent.puerts.agent`)
3. **Resolve dependencies** — based on the dependency rules in Section 3, automatically include all required dependency packages. Inform the user about the additional packages that will be installed.

### Editor Assistant Installation Rules

If the user requests to **"install PuerTS Editor Assistant"** (or similar phrasing like "安装 puerts 编辑器助手"), apply the following rules:

| User Request | Packages to Install |
|---|---|
| "Install PuerTS Editor Assistant" (no specific version mentioned) | **Both** `com.tencent.puerts.agent` **and** `com.tencent.puerts.mcp` (plus all their dependencies: `core`, `v8`) |
| "Install PuerTS Editor Assistant — Agent version" | Only `com.tencent.puerts.agent` (plus its dependencies: `core`, `v8`) |
| "Install PuerTS Editor Assistant — MCP version" | Only `com.tencent.puerts.mcp` (plus its dependencies: `core`, `v8`, `agent`) |

4. **Check the release page** `https://github.com/Tencent/puerts/releases/tag/Unity_v{VERSION}` to see which archives are available — note that actual filenames in the `.tar.gz` may have different version numbers than the release tag
5. **For packages with native plugins** (`com.tencent.puerts.core`, `com.tencent.puerts.v8`, `com.tencent.puerts.lua`, `com.tencent.puerts.nodejs`, `com.tencent.puerts.python`, `com.tencent.puerts.quickjs`): guide the user to download and extract into `Packages/`
6. **For packages without native plugins** (`com.tencent.puerts.webgl`, `com.tencent.puerts.agent`, `com.tencent.puerts.mcp`):
   - If the `.tar.gz` exists on the release page → offer both download or git URL options
   - If the `.tar.gz` does NOT exist on the release page → use the unversioned git URL
7. **Verify** the installation by checking `Packages/manifest.json` for the expected package entries

---

## 6. Verifying Installation

After installation, the following package IDs should appear in `Packages/manifest.json` (depending on which packages were installed):

- `com.tencent.puerts.core`
- `com.tencent.puerts.v8` (or other backend: `com.tencent.puerts.lua`, `com.tencent.puerts.nodejs`, `com.tencent.puerts.python`, `com.tencent.puerts.quickjs`)
- `com.tencent.puerts.agent`
- `com.tencent.puerts.webgl`
- `com.tencent.puerts.mcp`

---

## 7. Known Issues & Troubleshooting (Windows)

### 7.1 `curl` on Windows is an alias for `Invoke-WebRequest` — use different flags

On Windows PowerShell, `curl` is an alias for `Invoke-WebRequest` and does **not** accept standard Unix `curl` flags like `-L`, `--max-time`, `-o`. Use the native PowerShell syntax instead:

```powershell
# ❌ Wrong — Unix curl flags don't work in PowerShell
curl -L --max-time 30 -o output.html https://...

# ✅ Correct — use Invoke-WebRequest with PowerShell parameters
Invoke-WebRequest -Uri "https://..." -OutFile "output.html" -UseBasicParsing
```

### 7.2 GitHub API rate limit when unauthenticated

Calling `https://api.github.com/repos/Tencent/puerts/releases/tags/Unity_v{VERSION}` without authentication will quickly hit GitHub's rate limit (especially on shared IPs). 

**Workaround**: Instead of the API, fetch the **expanded assets HTML fragment** directly — it contains all download links and is not rate-limited:

```powershell
Invoke-WebRequest -Uri "https://github.com/Tencent/puerts/releases/expanded_assets/Unity_v{VERSION}" `
    -OutFile "assets.html" -UseBasicParsing

# Then extract download links with regex:
$content = Get-Content "assets.html" -Raw
$matches = [regex]::Matches($content, 'href="(/Tencent/puerts/releases/download[^"]*)"')
$matches | ForEach-Object { $_.Groups[1].Value }
```

This returns the exact filenames (e.g., `PuerTS_Core_3.0.2.tar.gz`) without consuming API quota.

### 7.3 `Invoke-WebRequest` times out on large files

`Invoke-WebRequest` can time out when downloading large packages (e.g., `PuerTS_V8` ~74 MB, `PuerTS_Nodejs` ~169 MB).

**Workaround**: Use `Start-BitsTransfer` instead — it is more reliable for large files and does not time out:

```powershell
Start-BitsTransfer `
    -Source "https://github.com/Tencent/puerts/releases/download/Unity_v3.0.2/PuerTS_V8_3.0.2.tar.gz" `
    -Destination "C:\path\to\output\PuerTS_V8_3.0.2.tar.gz"
```

### 7.4 Release page HTML does not contain download links (JavaScript-rendered)

The main release page (`/releases/tag/Unity_v{VERSION}`) renders asset links via JavaScript — the raw HTML fetched by `Invoke-WebRequest` will **not** contain any `releases/download` links.

**Solution**: Use the `expanded_assets` endpoint instead (see Section 7.2 above), which returns a static HTML fragment with all asset links.

### 7.5 `manifest.json` must use `file:` prefix for local packages

When packages are extracted into the `Packages/` directory, `manifest.json` must reference them with the `file:` prefix pointing to the subdirectory name:

```json
{
  "dependencies": {
    "com.tencent.puerts.core":   "file:core",
    "com.tencent.puerts.v8":     "file:v8",
    "com.tencent.puerts.nodejs": "file:nodejs",
    "com.tencent.puerts.agent":  "file:agent",
    "com.tencent.puerts.mcp":    "file:mcp"
  }
}
```

Unity will automatically resolve these local paths when the project is opened.
