# Mac 精简 UE5 引擎（Mini58_mac）说明

4.27 的 Mac CI 用的是 Mini427 加编辑器运行时增量包（见 `README_mac.md`）。UE5 没有可以拿来当底子的精简引擎，所以 `Tools/MakeMiniEngine.sh` 直接从完整的 Launcher 安装版里裁出一个独立的精简引擎，只保留编译 PuertsTest 和跑完全部测试实际用到的文件。

## 制作

```bash
cd unreal/TestProject
Tools/MakeMiniEngine.sh --full-engine "/Users/Shared/Epic Games/UE_5.8"            # collect,pack,verify
Tools/MakeMiniEngine.sh --full-engine "/Users/Shared/Epic Games/UE_5.8" --steps manifest,pack,verify
```

工作目录默认是仓库根下的 `build/enginepack`。

- `UE_5.8.noindex/`：完整引擎的 APFS 克隆（`cp -c`，不额外占空间），追踪都在克隆上进行，克隆会复用。
- `collect_ue58/`：`read.txt` 是被读过的文件，`target.json` 是 UBT 导出的模块图。
- `Mini58_mac.tgz`：产物。
- `ue58/`：verify 时的解压目录。

清单 `EnginePack/manifest_mac_5.8.txt` 需要提交，CI 的缓存 key 用到了它。以 `/` 结尾的条目是目录，打包时只建空目录。

## 步骤

1. collect：把克隆中所有文件的 atime 重置到 2000 年，清掉项目和插件的编译产物，然后用 `-ddc=Cold`（空 DDC，跟 CI 一样）跑一遍完整构建和全部测试。atime 被更新过的文件，就是实际读到的文件。
2. manifest：在读到的文件之外，再补上以下内容：
   - 白名单：`Engine/Config`、`Engine/Shaders`、`Engine/Intermediate/Build/BuildRules`、`Build.version`、`InstalledBuild.txt`。
   - 全部 `*.Build.cs` / `*.Target.cs`。
   - UBT `-Mode=JsonExport` 给出的模块目录、include 目录、静态库和 RuntimeDependencies。
   - 读到的 pyc 对应的 `.py`。
   - 被读到的 `.app` 整个 bundle。
   - DDC pak、dSYM、Saved 一律排除。
3. pack：按清单复制，用 lipo 把 Mach-O 瘦身到 arm64，再用 ad-hoc 签名重签可执行文件、dylib 和 `.app`，最后打成 tgz。
4. verify：解压后先检查每个二进制的依赖都能在精简引擎或系统中找到，然后清空项目，在精简引擎上跑 `RunTests.sh`。测试必须全部通过，并且期间完整引擎（克隆）不能有任何文件被读到。

## 踩过的坑

- 重置 atime 会改 ctime，Spotlight 随之重新索引，会把几千个 `.cpp` 也"读"一遍。因此要在 `*.noindex` 目录下的克隆上追踪。
- 只被 stat、没被 read 的文件，atime 追踪不到，需要单独补。
  - UBT 靠 `UE5RulesManifest.json` 把预编译的 `UE5Rules.dll` 映射回 `*.Build.cs`，缺了这个文件或规则源文件会报 RulesError。有的规则文件名是小写的 `*.build.cs`。
  - include 目录、静态库和 RuntimeDependencies 在 UBT 里只做存在性检查。
  - Python 只有在 `.py` 存在时才会用 `__pycache__` 里的 pyc，`os.py` 还是 getpath 定位标准库的标志文件。
- 用 lipo 瘦身会破坏 Epic 的签名，arm64 代码必须重签才能运行。
- 开发机的 `~/.dotnet` 里有首次运行标记，全新的 CI runner 上没有，dotnet 首次运行时会生成 ASP.NET 开发证书，需要加载包里没有的 `Microsoft.AspNetCore.DeveloperCertificates.XPlat.dll`。处理办法：`RunTests.sh` 设置 `DOTNET_GENERATE_ASPNET_CERTIFICATE=false` 跳过证书生成；collect 和 verify 都使用临时的 `DOTNET_CLI_HOME`，让本地也走首次运行的路径。

## 结果（5.8.4）

- 清单约 28400 个文件加 1400 个空目录。
- 解压后 1855MB，tgz 685MB。
- 精简引擎上 37 成功、13 警告、0 失败，和完整引擎一致。13 个警告是用例里预期的错误路径，以及冷 DDC 下 BP 重编译产生的 Type mismatch。

## CI

见 `.github/workflows/unreal_ci.yml` 中的 `mac_test_ue58`：

- runner 是 macos-15（arm64）。UE5.8 要求 Xcode 版本不低于 15.2。
- 引擎从 `EngineMac58` 下载，解压到 `ue58`，用 actions/cache 缓存，key 包含 URL 和清单的 hash。
- UBT 使用精简引擎自带的 dotnet，不需要另外安装 mono 或 dotnet。

换引擎版本时，重新执行 collect 生成新清单，上传新的 tgz，然后更新 `EngineMac58`。
