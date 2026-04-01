---
name: puerts_changelogs
description: 指引如何为 puerts 项目编写 Unity 和 Unreal 的 changelog
---

# 编写 PuerTS Changelog 的指引

## 文件位置

| 平台 | 英文版 | 中文版 |
|------|--------|--------|
| Unity | `unity/changelog.md` | `unity/changelog-hans.md` |
| Unreal | `unreal/changelog.md` | `unreal/changelog-hans.md` |

## 操作流程

### 1. 确定版本范围

用户会告诉你要更新哪个平台（Unity 或 Unreal）的 changelog。

- 先读取对应平台的英文版 changelog 文件，找到最新版本号（如 Unity 的 `3.0.1`，Unreal 的 `1.0.9`）。
- 新版本号通常是在最后一位 +1（如 `3.0.1` → `3.0.2`，`1.0.9` → `1.0.10`），但如果用户指定了版本号则以用户为准。

### 2. 获取两个 tag 之间的 commit

根据平台确定 tag 命名规则：
- **Unity**：tag 格式为 `Unity_v{版本号}`，例如 `Unity_v3.0.1`
- **Unreal**：tag 格式为 `Unreal_v{版本号}`，例如 `Unreal_v1.0.9`

执行 git log 获取 commit 列表，**只关注对应平台目录的改动**：

**Unity 示例**（假设上一版本是 3.0.1，新版本是 3.0.2）：
```bash
# 如果新版本 tag 已存在
git log Unity_v3.0.1..Unity_v3.0.2 --oneline -- unity/

# 如果新版本 tag 尚未打，则对比到 master
git log Unity_v3.0.1..master --oneline -- unity/
```

**Unreal 示例**（假设上一版本是 1.0.9，新版本是 1.0.10）：
```bash
# 如果新版本 tag 已存在
git log Unreal_v1.0.9..Unreal_v1.0.10 --oneline -- unreal/

# 如果新版本 tag 尚未打，则对比到 master
git log Unreal_v1.0.9..master --oneline -- unreal/
```

### 3. 筛选和理解 commit

- 不重要的 commit（如纯格式调整、注释修改、CI 配置等）可以跳过不写。
- changelog 内容应该从**用户影响角度**来写，而不是实现层面的描述。
- 如果从 commit message 无法确定改动的用户影响，应该通过 `git show <commit_hash>` 或 `git diff` 查看具体修改内容来确定。

### 4. 编写 changelog

**必须同时编写中文版和英文版**，写到对应的文件中。新版本的内容插入到文件最前面（在文件头部注释之后、旧版本之前）。

#### Unity changelog 格式

英文版（`unity/changelog.md`）：
```markdown
## [3.0.2] - 2025-04-01
1. Fixed xxx issue fix #1234
2. Added support for xxx feature (#5678)
3. Optimized xxx performance
```

中文版（`unity/changelog-hans.md`）：
```markdown
## [3.0.2] - 2025-04-01
1. 修复了 xxx 问题 fix #1234
2. 新增 xxx 功能支持 (#5678)
3. 优化了 xxx 性能
```

格式要点：
- 标题格式：`## [版本号] - 日期`（日期格式 `YYYY-MM-DD` 或 `YYYY-M-D`）
- 内容使用编号列表 `1. 2. 3. ...`
- 英文版文件头有 `[跳转中文](./changelog-hans.md)` 链接
- 中文版文件头有 `[english version](./changelog.md)` 链接
- 如果 commit 关联了 issue，在条目末尾附上 `fix #issue号` 或 `(#PR号)`

#### Unreal changelog 格式

英文版（`unreal/changelog.md`）：
```markdown
### v1.0.10 2025/4/1

#### New Features

* Added support for xxx

#### Optimizations

* Optimized xxx performance (#1234)

#### Changes

* Changed xxx behavior

#### Bug Fixes

* Fixed xxx crash issue (fix #5678)
```

中文版（`unreal/changelog-hans.md`）：
```markdown
### v1.0.10 2025年4月1日

#### 新增特性

* 新增 xxx 支持

#### 优化

* 优化了 xxx 性能 (#1234)

#### 变更

* 变更了 xxx 行为

#### bug修复

* 修复了 xxx 崩溃问题 (fix #5678)
```

格式要点：
- 标题格式：英文版 `### v版本号 YYYY/M/D`，中文版 `### v版本号 YYYY年M月D日`
- 内容按分类组织：`New Features / Optimizations / Changes / Bug Fixes`（中文：`新增特性 / 优化 / 变更 / bug修复`）
- 每个分类使用四级标题 `####`
- 内容使用 `* ` 无序列表
- 如果某个分类没有内容，则省略该分类，不要写空分类
- 如果 commit 关联了 issue，在条目末尾附上 `fix #issue号` 或 `(#PR号)`

### 5. 写入文件

将新版本的 changelog 内容插入到对应文件中，位置在文件头部元信息之后、上一个版本之前。确保中英文两个文件都更新。