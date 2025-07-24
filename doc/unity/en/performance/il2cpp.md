# il2cpp Optimization Features
> Available Version: >2.0.0

In simple terms, the optimization principle of il2cpp is to bypass PInvoke and directly access C# through il2cpp interfaces, reducing cross-language overhead. This ultimately leads to a significant performance improvement. For details, see[ il2cpp Optimization Feature Performance Data.](./index.md)

## Enabling

* For versions 2.1.1 and below, the feature is disabled by default on all platforms.  To enable it, go to Unity's `Player Settings` and add the Scripting Define Symbol: `PUERTS_IL2CPP_OPTIMIZATION`.
*For versions 2.2.0 to 2.2.1, the feature is enabled by default on Windows, macOS, Linux, and Android. To disable it, go to Unity's Player Settings, add the Scripting Define Symbol: PUERTS_DISABLE_IL2CPP_OPTIMIZATION. It is disabled by default on iOS and WebGL; to enable it, add the Scripting Define Symbol: PUERTS_IL2CPP_OPTIMIZATION.
* For versions 2.2.2 and above, the feature is enabled by default on Windows, macOS, Linux, Android, and WebGL. To disable it, go to Unity's Player Settings, add the Scripting Define Symbol: PUERTS_DISABLE_IL2CPP_OPTIMIZATION. It remains disabled by default on iOS; to enable it, add the Scripting Define Symbol: PUERTS_IL2CPP_OPTIMIZATION.
## Usage Steps

* For higher performance (full wrapper glue code generation):
  Click Unity's`Tools/PuerTS/Generate For xIl2cpp mode (all in one with full wrapper)`。

* For smaller code size (reflection-based glue code only):
  Click Unity's `Tools/PuerTS/Generate For xIl2cpp mode (all in one without wrapper)`。

### FAQ
1. "hash_map header not found" error during iOS build.
    During Unity builds, some header files (common in 2021 and earlier versions) are not automatically included in the Xcode project output. You can find the missing headers under `YourUnity.app/Contents/il2cpp/external/` and copy them to `iosbuild/Libraries/external/`.

2. `ReentrantLock is ambigious`error during iOS build.
    Common in 2022 versions. Solution:
    Modify the file (adjust the path according to your Unity installation):
    `/Applications/Unity/Hub/Editor/2022.3.47f1c1/PlaybackEngines/iOSSupport/il2cpp/libil2cpp/il2cpp-config.h `

Add the macro definition after #pragma once:
```
#pragma once

#define BASELIB_INLINE_NAMESPACE il2cpp_baselib //this line fix 'ReentrantLock is ambigious'

#include <string.h>
```
Analysis reference: https://github.com/Tencent/puerts/issues/1428