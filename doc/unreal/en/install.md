## Table Of Contents
- [Source Code Installation Method](#source-code-installation-method)
- [Release Package Installation Method](#release-package-installation-method)
- [Notes](#notes)
- [Setup Development Environment](#setup-development-environment)

## Source Code Installation Method
1. Clone the repository:
    ```sh
    git clone https://github.com/Tencent/puerts.git
    ```
2. Copy the `Puerts` directory from `puerts/unreal` to your project's `Plugins` directory.

3. Install an appropriate script backend following the guide below.

4. Enjoy the functionality of Puerts!

### Installing An Appropriate Script Backend
When it comes to selecting a JavaScript backend, its important to identify whats appropriate for your requirements.

- **V8**: Provides a clean ECMAScript implementation.
- **Nodejs**: Supports more npm modules than the V8 version but results in a larger package size.
- **Quickjs**: Suitable for scenarios with strict package size requirements.

#### V8 Backend
1. Download V8:
    - For UE4.25 and above (e.g UE5.5), choose one: [8.4.371.19](https://github.com/puerts/backend-v8/releases/download/V8_8.4.371.19_230822/v8_bin_8.4.371.19.tgz), [9.4.146.24](https://github.com/puerts/backend-v8/releases/download/V8_9.4.146.24_240430/v8_bin_9.4.146.24.tgz), [10.6.194](https://github.com/puerts/backend-v8/releases/download/V8_10.6.194_240612/v8_bin_10.6.194.tgz), [11.8.172](https://github.com/puerts/backend-v8/releases/download/V8_11.8.172_with_new_wrap_241205/v8_bin_11.8.172.tgz)
    - For UE4.24 and below: [V8 for UE 4.24 or below](https://github.com/puerts/backend-v8/releases/download/v8_for_ue424_or_below/v8_for_ue424_or_below.tgz)

2. Extract the downloaded V8 backend folder into `YourProject/Plugins/Puerts/ThirdParty`.

3. Change the `UseV8Version` setting in `Puerts/Source/JsEnv/JsEnv.build.cs` according to the version you downloaded.

#### NodeJS Backend (Recommended)
1. Download NodeJS backend from the latest Unreal Engine release. [Nodejs Download](https://github.com/Tencent/puerts/releases)

2. Copy the "nodejs" folder from the downloaded release `puerts_nodejs/Puerts/ThirdParty/nodejs_xx` into the puerts inside of your project `YourProject/Plugins/Puerts/ThirdParty`. 

3. Change the boolean `UseNodeJs` setting in `Puerts/Source/JsEnv/JsEnv.build.cs` to `true`.

#### QuickJS Backend
1. Download QuickJS backend from the latest Unreal Engine release. [QuickJS Download](https://github.com/Tencent/puerts/releases)

2. Copy the "quickjs" folder from the downloaded release `puerts_quickjs/Puerts/ThirdParty/quickjs` into the puerts inside of your project `YourProject/Plugins/Puerts/ThirdParty`. 

3. Change the boolean `UseQuickJs` setting in `Puerts/Source/JsEnv/JsEnv.build.cs` to `true`.

## Release Package Installation Method
1. Navigate to the [releases page](https://github.com/Tencent/puerts/releases) and download the version that matches your UE version. 

2. Extract the downloaded `puerts` folder into your project `YourProject/Plugins/`.

3. Enjoy the functionality of Puerts!

**Note: The releases page also includes packages for Unity. Unreal Engine versions will start with "Unreal_vx.x.x".**

## Notes

1. **Mac Users:**
    If you encounter the "Move to Trash" issue, execute the following commands:
    ```sh
    cd Plugins/Puerts/ThirdParty
    find . -name "*.dylib" | xargs sudo xattr -r -d com.apple.quarantine 
    ```

2. **Blueprint-Only Projects:**
    If you see the error "Plugin 'Puerts' failed to load because module 'JsEnv' could not be found,” it’s because pure Blueprint projects do not automatically compile plugins. Since Puerts includes C++ source code, you need to convert your Blueprint project to a C++ project by adding a C++ class. Alternatively, you can compile the UE engine with Puerts included during the compilation.

## Setup Development Environment
Once puerts has been successfully installed, it's time to [set up a working TypeScript development environment.](./dev_environment.md)