# Optimization for Unity il2cpp

> Available Version: >2.0.0

In simple terms, the idea behind il2cpp optimization is to bypass PInvoke and directly access C# through il2cpp interfaces, reducing the overhead of cross-language calls. This ultimately leads to a significant performance improvement. For more details, see the[xil2cpp mode performance data](./index.md).

## Installation
To use Il2cpp Optimization, you need to download the Plugin_il2cpp package separately and extract it to your project directory.

Alternatively, you can compile it yourself according to the [compilation guide](../other/building). 

## Steps to Use

1. Install the PuerTS UPM package as described above.
2. Go to Unity's `Player Settings` and add two Scripting Define Symbols: `PUERTS_CPP_OUTPUT_TO_UPM;PUERTS_IL2CPP_OPTIMIZATION`. You may also switch the script backend to il2cpp. Wait for the script compilation to complete.
3. Generate the code required for compilation: Click on Unity's Menu: `Tools/PuerTS/Generate for Il2cpp optimization(All in One)`.

### FAQ
1. The header file hash_map cannot be found when building iOS.
    When Unity is built, some header files will not be automatically packaged into the xcode project. You can find the missing content in `your Unity.app/Contents/il2cpp/external/` and copy it to `iosbuild directory/Libraries/external/`.
2. `ReentrantLock is ambigious` in iOS build
    Common found in Unity2022+. See https://github.com/Tencent/puerts/issues/1428