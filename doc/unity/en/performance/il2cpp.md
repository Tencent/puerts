# Optimize for unity il2cpp - xIl2cpp mode
> availble in >2.0.0
xIl2cpp mode is a new feature added to version 2.0 of Puer. The name `xIl2cpp` is giving a salute to `xLua` which is the previous life of Puer, and also means that it is only targeted at Unity's Il2cpp backend.

In simple terms, xIl2cpp mode allows Il2cpp to interact directly with V8, rather than calling native plugins via C# PInvoke, reducing the cost of cross-language communication. This ultimately greatly improves performance. See the [Il2cpp binding performance data](./index.md) for details.

There are significant changes in the usage of the xIl2cpp mode, such as different steps for compiling plugins and wrappers, but there is no need to make any changes to the API or usage mechanism.

## Installation
If you decide to use the xIl2cpp mode, it is currently recommended to use the `GitHub Clone Style Installation` mentioned in the [installation guide](../install) and install it with Unity UPM. The repository address needs to be changed to `https://github.com/Tencent/puerts.git`, and the added path is `[puerts]/unity/Assets/core/upm/package.json`.

The reason why you need to clone the source code is that you need to compile Puer's binary plugin yourself.

Then, you need to first understand the contents of the [compilation guide](../other/building). The xIl2cpp mode has some differences in compilation, but it is roughly the same (for example, there is no longer a need to download the backend yourself).

## Usage steps
1. Install the PuerTS UPM package according to the above steps.
2. Compile the default mode plugin: cd to the `puer directory/unity/native_src/`, enter the compilation command that fits your platform, such as `node ../cli make --backend v8_9.4 --platform win --arch x64 --config Debug`. (The compilation command itself can actually recognize your platform, so you can also just enter `node ../cli make --backend v8_9.4 --config Debug`).
3. Enter Unity's `Player Settings` and add two Scripting Define Symbols: `PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM`, `EXPERIMENTAL_IL2CPP_PUERTS`. You can also switch the script backend to `il2cpp`. Wait for the script to compile.
4. Generate the code needed for compilation: Click on `PuerTS/Generate for il2cpp binding(All in One)` in Unity. Then, switch to the `puer directory/unity/native_src/il2cpp` and enter the same compilation command as in step 3.

## Some detailed explanations in the usage steps:
* Since we try to make direct interaction between v8 and il2cpp, in xIl2cpp mode, the wrapper is in C++ form rather than C# form. The FunctionBridge.h generated in `Generate for il2cpp binding` takes on the role of the original wrapper.
* Currently, FunctionBridge.h needs to be compiled into native plugins, so in xIl2cpp mode, you need to frequently compile native plugins yourself.
* A wrapper function corresponding to different function signatures will be generated in FunctionBridge.h. Of course, we also support calling through reflection, which incurs some performance loss.
* In `Generate for il2cpp binding`, all assemblies will be fully traversed to generate the wrappers for all functions. In addition, `generate/FunctionBridge.h(Configure)` is also provided, which generates wrappers only for the classes configured in the generation list, while others are called through the reflection mechanism.
* `Generate/FunctionBridge.h` also generates a bridge for calling from C# to JS, so UsingFunc and UsingAction are no longer needed.
* In the installation steps, `PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM` is used to directly generate FunctionBridge.h into the native_src_il2cpp directory. If you are not installing Puerts using UPM, you can omit this definition and copy the header file yourself.
* In addition to `FunctionBridge.h`, another generated header file is `unityenv_for_puerts`, which is used to pass some Unity definitions to the C++ part. If you encounter C++ plugin errors during the final game build phase, it is likely that this header was not generated correctly.

## FAQ:
1. When building on iOS, I get an error that the hash_map header cannot be found.
    When Unity builds, some header files are not automatically packaged into the resulting Xcode project. You can find the missing files in your_Unity.app/Contents/il2cpp/external/ and copy them to iosbuild_directory/Libraries/external/.
2. After version 2.0, require is no longer included. How should I handle modules in CommonJS format?
    Although version 2.0 does not include require by default, it comes with a CommonJS patch UPM package in the packages. See: https://github.com/Tencent/puerts/tree/unity-2.0.x/unity/Assets/commonjs/upm.