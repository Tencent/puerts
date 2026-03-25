---
name: install-puerts-for-unity
description: "PuerTS installation skill — installs PuerTS UPM packages via AI-guided prompts."
---

# 安装PuerTS    

如果你不清楚该使用哪种安装方式，该用哪个版本，请参见 [FAQ](./faq.md#安装相关)

### 通过 Agent Skill 安装（推荐）

安装本 skill 后，可以通过自然语言提示词让 AI 编码助手帮你完成安装。常见的支持 Agent Skill 的 AI 编码助手包括：CodeBuddy、Claude Code、Cursor、Windsurf、Cline、GitHub Copilot 等。

**Skill 路径**: `puerts/unity/skills/install-puerts-for-unity`

**示例提示词**:
- `安装puerts v8包` — 安装 core + v8
- `安装puerts v8包，版本v3.0.1` — 指定版本安装 core + v8
- `安装puerts mcp包` — 安装 core + v8 + nodejs + mcp（自动解析依赖）
- `安装puerts agent包` — 安装 core + v8 + agent（自动解析依赖）
- `安装puerts编辑器助手` — 安装 agent 包和 mcp 包及其所有依赖
- `安装puerts编辑器助手mcp版` — 只安装 mcp 包及其依赖
- `安装puerts lua包` — 安装 core + lua
- `安装puerts quickjs包` — 安装 core + quickjs

AI 编码助手会自动处理版本选择、依赖解析和安装步骤。

### 手动下载安装  | 全版本可用
相比 Agent Skill 方式管理起来稍麻烦，但对代码魔改更友好。

1. 前往 [Github Releases](https://github.com/Tencent/puerts/releases) 下载你需要的包（如 PuerTS_V8_x.x.x.tgz）。
2. 将压缩包解压到本地任意目录（解压后会得到一个 UPM 包目录，如 `v8`，内含 `package.json`）。

#### 支持 UPM 的 Unity 版本（Unity 2018.3+）

通过 Unity 编辑器的 UPM 磁盘安装方式导入：

1. 打开 Unity 编辑器，菜单栏选择 **Window → Package Manager**。
2. 点击左上角 **＋** 按钮，选择 **Add package from disk...**。
3. 在弹出的文件浏览器中，导航到解压后的包目录，选中其中的 `package.json` 文件，点击 **Open**。
4. Unity 会自动识别并导入该 UPM 包。
5. 如需安装多个包（如 core + v8），对每个包重复上述步骤。

#### 不支持 UPM 的 Unity 版本（Unity 2018.3 以下）

将解压后的文件夹直接拷贝到项目的 `Assets` 目录下。

> 还需要将 PuerTS 代码内的内置 js 文件手动加上 `.txt` 后缀。

> mac 下如果遇到移入废纸篓问题，请使用 `sudo xattr -r -d com.apple.quarantine puerts.bundle`。但用了后提交 git 容易出问题。

