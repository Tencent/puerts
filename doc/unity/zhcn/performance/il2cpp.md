# 为Unity il2cpp特殊优化的模式 - xIl2cpp模式
> 可用版本：>2.0.0

xIl2cpp模式是Puer2.0版本新加的模式。顾名思义，优化仅针对Unity Il2cpp backend。xIl2cpp这个名字一方面是致敬PuerTS的前身xLua，也代表它是基于Il2cpp进行加强优化的技术。

简单粗浅地说，xIl2cpp模式是让il2cpp直接与v8交互，不再经由C# PInvoke调用native plugin。减少跨语言的消耗。最终使得性能表现大幅提升，详见[il2cpp绑定性能数据](./index.md)

xIl2cpp模式在使用方式上会有较大的变化，比如需要自己编译Plugin与wrapper生成的步骤不同，API和使用机制上无需做任何改动。

## 安装
如果决定采用xIl2cpp模式，目前只建议使用[安装指南](../install)中提到的`GitHub Clone 并用 Unity UPM 安装`。且仓库地址需要改为`https://github.com/Tencent/puerts.git`，添加的路径为`[puerts]/unity/Assets/core/upm/package.json`

之所以需要你把源码clone下来，是因为你需要自行编译Puer的二进制Plugin，才能使用到xIl2cpp的能力。

随后，你需要先了解一下[编译指南](../other/building)的内容，xIl2cpp版本的编译稍有不同但大致类似（比如不再需要自行下载backend）。

## 使用步骤
1. 按照上述步骤安装好PuerTS的upm包。
2. 编译mono版本plugin：cd到`puer目录/unity/native_src/`，输入符合你平台的编译命令，比如`node ../cli make --backend v8_9.4 --platform win --arch x64 --config Debug`。（编译命令本身其实也会识别你的平台，所以你也可以只输入`node ../cli make --backend v8_9.4 --config Debug`）
3. 进入Unity的`Player Settings`，添加两个Scripting Define Symbols: `PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM`, `EXPERIMENTAL_IL2CPP_PUERTS`。顺便可将script backend切换为`il2cpp`。等待脚本编译。
4. 生成编译所需的代码：点击Unity的`PuerTS/Generate for il2cpp binding(All in One)`。然后切出去cd到`puer目录/unity/native_src_il2cpp`，输入和步骤2相同的编译命令。

### 使用步骤里的一些详细解释
* 由于我们尽量让v8和il2cpp直接交互，所以il2cpp版本里，Wrapper就是C++的形式而非C#的形式。`Generate for il2cpp binding`里生成的FunctionBridge.h承担的就是原有的Static Wrapper角色。
* FunctionBridge.h目前是需要编译进nativePlugins的，所以xIl2cpp模式需要你经常自行编译native plugin。
* 不同函数签名的函数会在FunctionBridge.h里生成一个对应的wrapper函数。当然我们也支持反射的方式调用，性能略有损耗。
* `Generate for il2cpp binding`中，会全量遍历所有Assembly，生成所有函数的wrapper。另外也提供了`generate/FunctionBridge.h(Configure)`，只会为生成列表中配置的类生成wrapper，其余使用反射机制调用。
* `Generate/FunctionBridge.h`同时还会生成C#到JS调用的bridge，因此不再需要UsingFunc和UsingAction
* 安装步骤中`PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM`就是为了让FunctionBridge.h直接生成到native_src_il2cpp目录。如果你不是使用upm方式安装puerts，则可以不添加该def，自行将头文件复制过去。
* 除了`FunctionBridge.h`，另外一个生成出来的头文件是`unityenv_for_puerts`，用于为C++的部分传递一些Unity的Definition。如果在游戏最终构建阶段报了C++ Plugins的错误，大概率是这个头没有正确生成


### FAQ
1. ios构建时报hash_map头找不到。
    Unity构建时，一部分头文件不会自动打包到产物xcode项目里。你可以在`你的Unity.app/Contents/il2cpp/external/`下找到缺失的内容，复制到`iosbuild目录/Libraries/external/`即可
