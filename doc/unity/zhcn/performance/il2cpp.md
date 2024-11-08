# il2cpp优化特性
> 可用版本：>2.0.0

简单地说，il2cpp优化的思路是绕过 PInvoke直接通过il2cpp的接口访问C#，减少跨语言的消耗。最终使得性能表现大幅提升，详见[il2cpp优化特性性能数据](./index.md)

## 安装
要使用Il2cpp优化，需要额外下载Plugin_il2cpp包，解压到项目目录即可。

或者根据[编译指南](../other/building)自行编译。

## 使用步骤
1. 按照上述步骤安装好PuerTS的upm包。
2. 进入Unity的`Player Settings`，添加两个Scripting Define Symbols: `PUERTS_CPP_OUTPUT_TO_UPM;PUERTS_IL2CPP_OPTIMIZATION`。顺便可将script backend切换为`il2cpp`。等待脚本编译。
3. 生成编译所需的代码：点击Unity的`Tools/PuerTS/Generate for Il2cpp optimization(All in One)`。

### FAQ
1. ios构建时报hash_map头找不到。
    Unity构建时，一部分头文件不会自动打包到产物xcode项目里(在2021及以下版本常见)。你可以在`你的Unity.app/Contents/il2cpp/external/`下找到缺失的内容，复制到`iosbuild目录/Libraries/external/`即可
2. ios构建时报 `ReentrantLock is ambigious`
    在2022常见。解决办法参见https://github.com/Tencent/puerts/issues/1428
