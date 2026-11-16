# Mac 版引擎增量包与 CI 测试 job 操作说明

本文给在 Mac 上执行的人（或 AI）看：参照已经跑通的 Windows 方案，做出 Mac 版增量包，并把 Mac 测试加进 CI。

## 1. 背景

CI 用的引擎是 `Mini427_new_xcode_win2022.tgz`（简称 Mini427），这是一个剪裁过的 UE 4.27.2，只保留了编译插件需要的东西（UHT、头文件、链接库），没有编辑器运行需要的 dll/dylib、Content、Shaders 等，所以只能构建，不能运行 `RunTests`。

方案是额外做一个"编辑器运行时增量包"，CI 里把它解压覆盖到 Mini427 上，然后就能跑测试。完整引擎几十 GB，但跑测试实际用到的文件很少。

Windows 版已经完成，可参考：

- 制作脚本：`unreal/TestProject/Tools/MakeEnginePack.ps1`（collect / pack / verify 三步）
- 文件清单：`unreal/TestProject/Tools/EnginePack/manifest_win64.txt`
- CI job：`.github/workflows/unreal_ci.yml` 里的 `window_test`
- 产物：`Mini427_win64_editor_runtime.tgz`，压缩后 231MB，已上传到 `https://github.com/chexiongsheng/Mini427/releases/download/v1.0.1/`
- 结果：在 "Mini427 + 增量包" 上 46 个测试全部通过，和完整 4.27 一致

Windows 版的做法（Mac 照此办理）：

1. `PuertsTest.uproject` 已设 `"DisableEnginePluginsByDefault": true`（已提交，Mac 不用再改），加载的引擎模块从 569 个降到 342 个。
2. collect：在完整引擎上跑一遍全部测试，期间轮询编辑器进程，记录加载过的、位于引擎目录下的动态库；再单独启动一次编辑器执行 `obj list class=Package`，拿到启动后内存中的资源包（约 460 个），映射到磁盘上的 `.uasset/.umap/.uexp/.ubulk`；对加载了 dll 的引擎插件，补上 `.uplugin`、`.modules`、插件 `Config`；再加上白名单目录。
3. pack：清单中 Mini427 里没有（或大小不同）的文件，复制到 staging 目录并打成 tgz。
4. verify：把 Mini427 复制一份，解压增量包覆盖上去，然后在这个组装出来的引擎上跑 `RunTests`，必须全部通过。

白名单（与平台无关，Mac 原样使用）：

- `Engine/Config`
- `Engine/Shaders`
- `Engine/Content/Slate`
- `Engine/Content/Editor/Slate/Fonts`
- `Engine/Content/Internationalization/icudt64l`（编辑器只用这一份 ICU 数据，别把整个 Internationalization 目录都带上，那有 110MB）
- `Engine/Build/Build.version`

## 2. 交付物

1. `unreal/TestProject/Tools/MakeEnginePack.sh`：Mac 版制作脚本，参数、步骤与 ps1 对齐（collect / pack / verify）。
2. `unreal/TestProject/Tools/EnginePack/manifest_mac.txt`：Mac 清单。
3. `Mini427_mac_editor_runtime.tgz`：Mac 增量包（交给用户上传到 Mini427 的 v1.0.1 release）。
4. `unreal/TestProject/RunTests.sh` 支持 UE 4.27（目前只支持 UE5，见第 4 节）。
5. `.github/workflows/unreal_ci.yml` 新增 `mac_test` job。
6. 最终报告：增量包大小（解压 / 压缩）、文件数、verify 结果（succeeded/failed 数）、遇到的坑。

## 3. 前置条件

- 完整的 UE 4.27.2（Epic Launcher 默认装在 `/Users/Shared/Epic Games/UE_4.27`）。确认 `Engine/Build/Build.version` 中 `Changelist` 为 `18319896`、`CompatibleChangelist` 为 `17155196`。
- Mini427：从 `https://github.com/chexiongsheng/Mini427/releases/download/v1.0.1/Mini427_new_xcode_win2022.tgz` 下载，解压到一个目录（下称 `$MINI`，tgz 根目录就是 `Engine/`）。要用 GNU tar 或系统 tar 解压，注意保留符号链接。
- V8 后端：`https://github.com/puerts/backend-v8/releases/download/V8_9.4.146.24__241009/v8_bin_9.4.146.24.tgz` 解压到 `unreal/Puerts/ThirdParty`（和 CI 一样）。

## 4. 先让 RunTests.sh 支持 UE 4.27

现在的 `RunTests.sh` 只支持 UE5，需要参考 `RunTests.ps1`（已支持 4.27）进行修改：

- 读取 `Engine/Build/Build.version` 判断大版本：UE5 用 `UnrealEditor`，UE4 用 `UE4Editor`。
- 编辑器路径：UE5 是 `Engine/Binaries/Mac/UnrealEditor-Cmd`；UE4.27 在 Mac 上没有 `-Cmd` 版，用 `Engine/Binaries/Mac/UE4Editor.app/Contents/MacOS/UE4Editor`。请以完整 4.27 的实际目录为准。
- 构建：UE5 是 `dotnet UnrealBuildTool.dll ... -NoUBA`；4.27 的 UBT 是 `Engine/Binaries/DotNET/UnrealBuildTool.exe`，用 mono 执行（或用 `Engine/Build/BatchFiles/Mac/Build.sh`），并且 4.27 没有 `-NoUBA` 参数。注意脚本里写过的坑：`Build.sh` 会 cd 到引擎根目录，并且 `Plugins/Puerts` 是符号链接。
- `find_engine` 只搜 `UE_5.*`，`--engine` 和 `UE_ROOT` 都要能指向 4.27 和组装出来的引擎目录。
- 换引擎版本时要删除 `Intermediate/Build/BuildRules`（ps1 第 0 步，用 `Intermediate/Build/BuildRules.engine` 记录上次用的引擎）。否则不同引擎生成的 rules 程序集会冲突。
- Python：脚本里 `DYLD_FALLBACK_LIBRARY_PATH` 指向 `Engine/Binaries/ThirdParty/Python3/Mac/lib`，要确认 4.27 下的路径。Mini427 里没有 Mac 的 Python3，所以 Python 相关文件要进清单。
- 修改后 UE5 必须照常能跑，不要破坏现有用法。

完成标志：`UE_ROOT="/Users/Shared/Epic Games/UE_4.27" ./RunTests.sh` 在完整 4.27 上通过（Windows 上是 46 个测试全部 Success）。

## 5. collect：生成 manifest_mac.txt

脚本 `MakeEnginePack.sh` 的 collect 步骤：

1. 后台启动 `RunTests.sh --engine <完整4.27>`。在编辑器进程存活期间，每隔 0.3 到 0.5 秒执行 `lsof -p <pid> -Fn`，收集路径在引擎目录下的 `.dylib`、可执行文件以及 bundle 内的文件。也可以用 `DYLD_PRINT_LIBRARIES=1` 启动，然后从输出里解析，两种方法任选。最后必须得到一份完整的已加载列表（参考值：Windows 上是 342 个 dll）。
2. 单独启动一次编辑器：`<editor> PuertsTest.uproject "-ExecCmds=obj list class=Package, Quit" -unattended -nullrhi -nosplash -nosound -NoP4 -abslog=<log>`。用正则 `\sPackage (/\S+)` 从日志中提取包名。挂载点 `/Engine/` 对应 `Engine/Content/`，`/<插件名>/` 对应 `<插件目录>/Content/`。`/Script`、`/Temp`、`/Game`、`/Memory`、`/Engine/Transient` 跳过。注意：Windows 上 4.27 执行 Quit 后进程偶尔会卡住不退出，ps1 的处理是看到日志里出现 `]Cmd: Quit` 后最多再等 30 秒，然后 kill 掉。
3. 已加载动态库所属的引擎插件，补上 `.uplugin`、`Binaries/Mac/UE4Editor.modules`、`Config/` 下的文件。
4. 编辑器 bundle：`UE4Editor.app` 要整个带上，里面有 Info.plist、Resources 等。Mac 上不是一个 exe 就够了。另外还要带上 `Engine/Binaries/Mac/UE4Editor.modules`。
5. 加上第 1 节的白名单。
6. 排除 `.dSYM`、调试符号这类不需要的文件。

Windows 清单可以作为对照：Content、Config、Shaders、Slate、ICU 这部分 Mac 应该基本相同，可以 diff 一下。差异较大的是 `Engine/Binaries/Mac` 和 `Engine/Binaries/ThirdParty`，这是正常的：D3D、Windows 相关模块 Mac 上没有，Mac 有 MetalRHI、MacTargetPlatform 等自己的模块，第三方库目录也不一样。不要靠把 dll 改名成 dylib 来生成清单。

## 6. pack

- 只打包清单中 "Mini427 没有，或与完整引擎内容不同" 的文件。
- Windows 版只按文件大小比较（Win64 下 Mini427 与 Launcher 版逐字节相同）。但 Mini427 的 Mac 部分名字里带 "new_xcode"，有可能是用新 Xcode 重新编译过的，Mac 上请用哈希（`shasum`）比较，并先抽查几个 `UE4Editor-*.dylib` 是否相同。Mini427 的 `Binaries/Mac` 里已经有 27 个编辑器 dylib（约 295MB），以及 `UnrealHeaderTool`。如果 Mini427 的 dylib 与 Launcher 版不同，二者混用可能导致符号或 BuildId 不匹配：
  - 若 verify 能通过，就保持 Mini427 原文件不动。
  - 若不能通过，再考虑让增量包覆盖这些 dylib，在报告里说明原因。
- 打包：`tar -czf Mini427_mac_editor_runtime.tgz -C <stage> Engine`。保留符号链接和可执行权限（.app 里有符号链接）。不要用 zip。
- 产物放在仓库根目录的 `build/enginepack/` 下（这个目录已在 .gitignore 中）。

## 7. verify（必须做）

1. 把 `$MINI` 完整复制到 `build/enginepack/engine`，然后把增量包解压覆盖上去。
2. 从干净状态开始（会自动删除 BuildRules），执行 `./RunTests.sh --engine build/enginepack/engine`：先用组装引擎构建，再跑测试。
3. 要求全部通过，结果与完整 4.27 一致。另外在 `Saved/Logs/RunTests.log` 里搜 `Failed to load|Can't find file|Unable to load|Missing`，确认没有因为缺文件导致的问题。以下几条在 Windows 上也有，可以忽略：`ExampleDeviceProfileSelector`、`TcpMessaging`、`/Script/AIModule`、`Template_Default.umap`、`Failed to load test report html template`，以及测试本身故意触发的 `not_exist_addon_xyz`。
4. 还要确认组装引擎在构建时用的是 Mini427 的工具链。这一点很重要：CI 就是这样用的。

如果 verify 失败，按缺什么补什么的思路处理：补充白名单或修正 collect 逻辑，然后重新生成清单。不要直接把整个大目录塞进去。

本机通过不代表 runner 上能通过：Windows 版第一次上 CI 时，编辑器启动就报 0xC0000135（找不到 DLL）。原因是引擎依赖的旧版 DirectX 和 VC2010 运行库（如 xinput1_3.dll）由 UE4PrereqSetup 装在本机 System32 里，collect 只记录了引擎目录下的文件，所以没采到；本地 verify 时又能从 System32 找到，于是也没发现。现在 ps1 会把它们作为 `System32\<name>` 条目打包到 exe 旁边，verify 还会静态扫描二进制里引用的这类 DLL 名。Mac 上要做同样的检查：对清单里所有 dylib 和可执行文件运行 `otool -L`，凡是不在 `/usr/lib`、`/System/Library` 下、也不在引擎目录里的依赖（比如 `/usr/local`、Homebrew、Xcode 目录，或者只能靠本机环境解析的 `@rpath`），都必须处理掉。macos-14 runner 是干净的系统加 Xcode。

## 8. CI job

参照 `window_test`，在 `unreal_ci.yml` 中新增 `mac_test`：

- `runs-on: macos-14`（与现有 `mac_ios_ci` 一致），`needs: urls`。
- env 增加 `EngineRuntimeMac: "https://github.com/chexiongsheng/Mini427/releases/download/v1.0.1/Mini427_mac_editor_runtime.tgz"`。
- 用 `actions/cache@v4` 缓存解压后的引擎目录，key 包含两个 URL。
- 下载 Mini427 和 Mac 增量包，依次解压到同一目录；下载 V8 并解压到 `unreal/Puerts/ThirdParty`。
- 执行 `unreal/TestProject/RunTests.sh --engine "$GITHUB_WORKSPACE/ue427" --timeout 1800`。
- `if: always()` 时上传 `unreal/TestProject/Saved/Logs` 和 `Saved/AutomationReport` 作为 artifact。
- 先只测 V8 后端，Node.js 以后再加。
- 现有 `mac_ios_ci` 构建 job 不要动。

Runner 上的工具链风险：现有 `mac_ios_ci` 在 macos-14 上用 Mini427 构建是成功的，说明 Mini427 的 Mac 构建链在 runner 上可用（UBT 需要 mono，runner 上应该有，请确认）。测试 job 的构建方式要和 `RunTests.sh` 里的 4.27 分支一致。

编辑器在 runner 上无图形界面运行：已经加了 `-nullrhi -unattended`。如果因为 Metal 或窗口服务器相关的原因启动失败，在报告里说明。

## 9. 注意事项

- 不要改 Windows 相关文件（`MakeEnginePack.ps1`、`manifest_win64.txt`、`window_test`）。可以在 sh 脚本中复用相同的白名单和逻辑。
- 增量包里有编辑器二进制，属于分发 UE 编辑器文件的行为，所以只放必要的文件，越小越好。作为参考，Windows 版压缩后 231MB；Mac 版因为 Mini427 已经带了部分 dylib，预计会小一些。
- 完成后把 `MakeEnginePack.sh`、`manifest_mac.txt`、`RunTests.sh`、`unreal_ci.yml` 一起提交，提交信息格式参考 `git log`（形如 `[unreal] CI: ...`）。增量包交给用户上传，不要提交进仓库。
