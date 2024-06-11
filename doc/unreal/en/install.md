## Source Code Installation Method

1. Clone the repository:
    ```sh
    git clone https://github.com/Tencent/puerts.git
    ```

2. Copy the `Puerts` directory from `puerts/unreal` to your project's `Plugins` directory. You can refer to the Unreal demo for guidance.

3. Download V8:
    - For UE4.25 and above: [V8 backends](https://github.com/Tencent/puerts/releases)
    - For UE4.24 and below: [V8 for UE4.24 or below](https://github.com/Tencent/puerts/releases)

4. Extract the downloaded V8 to `YourProject/Plugins/Puerts/ThirdParty`. If you downloaded version 9.4, manually rename the `v8_9.4` directory to `v8`.

## Release Package Installation Method

1. Go to the [releases page](https://github.com/Tencent/puerts/releases) and find the version you need. Note that this page also includes release packages for Unity; Unreal Engine versions will start with "Unreal".

2. Download the package that matches your UE version and extract it to `YourProject/Plugins`. The V8 library is already included.

## Notes

1. **Mac Users:**
    If you encounter the "Move to Trash" issue, execute the following commands:
    ```sh
    cd Plugins/Puerts/ThirdParty
    find . -name "*.dylib" | xargs sudo xattr -r -d com.apple.quarantine 
    ```

2. **Blueprint-Only Projects:**
    If you see the error "Plugin 'Puerts' failed to load because module 'JsEnv' could not be found,” it’s because pure Blueprint projects do not automatically compile Plugins. Since Puerts includes C++ source code, you need to convert your Blueprint project to a C++ project by adding a C++ class. Alternatively, you can compile the UE engine with Puerts included during the compilation.

## Virtual Machine Switching

Puerts supports multiple script backends: V8, quickjs, nodejs.

- **V8**: Provides a clean ECMAScript implementation.
- **Quickjs**: Suitable for scenarios with strict package size requirements.
- **Nodejs**: Supports more npm modules than the V8 version but results in a larger package size.

### Download Quickjs Backend
[Quickjs Download](https://github.com/Tencent/puerts/releases)

### Download Nodejs Backend
[Nodejs Download](https://github.com/Tencent/puerts/releases)

Extract the downloaded backend to `YourProject/Plugins/Puerts/ThirdParty`.

Modify `JsEnv.Build.cs`:
- Set `UseQuickjs` to `true` to use the Quickjs backend.
- Set `UseNodejs` to use the Nodejs backend.
