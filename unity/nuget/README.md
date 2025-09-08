# Nuget

## 使用

可用的平台 `.net8.0`, `win-x64`, `linux-x64`, `osx-x64`, `osx-arm64`

目前不支持`AOT`

引入`Puerts` ( `Puerts.Core` 包)，并根据需求引入需要运行的平台的 `NativeAssets` (.dll, .so ...)，
没有 `NativeAssets` 则无法在对应的平台运行

例如

* `Puerts.Core.NativeAssets.Win32` 对应 `Windows`
* `Puerts.Core.NativeAssets.Linux` 对应 `Linux`
* `Puerts.Core.NativeAssets.macOS` 对应 `macOS`

引入需要的扩展，以下是支持的扩展，同样的，也需要引入对应的 `NativeAssets`

* `Puerts.Lua`
* `Puerts.QuickJS`
* `Puerts.NodeJS`
* `Puerts.V8`

简单用例，已引入 `Puerts.Core`、 `Puerts.V8` 以及对应的 `NativeAssets` 包

```csharp
using Puerts;

var jsEnv = new ScriptEnv(
    new BackendV8());
    jsEnv.Eval(@"
            CS.System.Console.WriteLine('hello world');
        ");
    jsEnv.Dispose();

    Console.WriteLine("Press any key to exit...");
```

## 包版本定义

[Directory.Build.props](Directory.Build.props)

构建包的版本

```xml
<BuildPackageVersion>0.0.1</BuildPackageVersion>

<PuertsCoreVersion>$(BuildPackageVersion)</PuertsCoreVersion>
<PuertsQuickJsVersion>$(BuildPackageVersion)</PuertsQuickJsVersion>
<PuertsNodeJsVersion>$(BuildPackageVersion)</PuertsNodeJsVersion>
<PuertsV8Version>$(BuildPackageVersion)</PuertsV8Version>
<PuertsLuaVersion>$(BuildPackageVersion)</PuertsLuaVersion>
```

设置目标的框架

```xml
<PuertsCurrentTargetFrameworks>net8.0</PuertsCurrentTargetFrameworks>
<PuertsNativeAssetsLinuxTargetFrameworks>net8.0</PuertsNativeAssetsLinuxTargetFrameworks>
<PuertsNativeAssetsWin32TargetFrameworks>net8.0</PuertsNativeAssetsWin32TargetFrameworks>
<PuertsNativeAssetsmacOSTargetFramework>net8.0</PuertsNativeAssetsmacOSTargetFramework>
```

## 构建发布

在Windows下构建、发布

```powershell
# 构建
.\build.ps1 --NativeAssetsDirectory "xxx\puerts\unity\downloaded_natives" --ProjectsRoot "xxx\puerts\unity\nuget"
# 构建并发布
.\build.ps1 --NativeAssetsDirectory "xxx\puerts\unity\downloaded_natives" --ProjectsRoot "xxx\puerts\unity\nuget" --Source "https://api.nuget.org/v3/index.json" --ApiKey "your-nuget-api-key"

```

在Linux/macOS下构建、发布

```shell
# 构建
./build.sh --NativeAssetsDirectory "xxx/puerts/unity/downloaded_natives" --ProjectsRoot "xxx/puerts/unity/nuget"
# 构建并发布
/build.sh --NativeAssetsDirectory "xxx/puerts/unity/downloaded_natives" --ProjectsRoot "xxx/puerts/unity/nuget" --Source "https://api.nuget.org/v3/index.json" --ApiKey "your-nuget-api-key"
```

### 构建参数

* `NativeAssetsDirectory` 原生文件目录，放置构建完成的 `native` 项目产物
* `ProjectsRoot` nuget项目目录

### 发布参数

* `Source` 打包发布的目标源
* `ApiKey` 目标源的密钥 注意密钥安全

### 定义构建

构建脚本 [Program.cs](build/Program.cs)
