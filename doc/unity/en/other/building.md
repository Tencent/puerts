# PuerTS Unity Plugin Compilation Guide
When using PuerTS in Unity, the puerts.dll and puerts.bundle in the Plugins directory are native plugins compiled by C++ code.

If you need native plugin built with `Debug` or other needs to customize C++ code, you can follow this guide.

## >2.0.0 version
Starting with version 2.0, PuerTS uses Node.js to drive cmake to compile PuerTS's native plugin. You only need to navigate to the `unity/native_src/` directory and enter the following command to complete the compilation:

```
node ../cli make --backend v8_9.4 --platform win --arch x64
```

The above command may be a bit long. You can also refer to `unity/cli/cmd.mts` for information about quickcommand, for example, the command above can be shortened to node `../cli make vw6`.

## 1.x version

### How PuerTS official C++ plugin compiled? (1.3 or 1.4)
PuerTS uses GitHub Actions for automated builds. Therefore, you can easily find the steps to compile C++ plugins in the .github/workflows/build_unity_plugins.yml file.

Taking macOS as an example, you can find the main steps of the build in build_unity_plugins.yml:

1. Download the v8/quickjs/node dependency library:
```yaml
- name: Download artifact
  uses: dawidd6/action-download-artifact@v2
    with:
      workflow: build_v8.yml
      name: v8_bin
      repo: puerts/backend-v8
      path: unity/native_src/
```
Explanation:
The repository https://github.com/puerts/backend-v8 is use for building the v8 dependency library (you can also find the repositories use for building QuickJS and NodeJS dependencies under the organization of this repository). The above action will download the artifact of the build_v8 action in the v8 dependency library repository to the native_src directory.

2. Execute the build:
```yaml
- name: Build
  run: |
    cd unity/native_src
    npx ts-node --esm make.mts --platform osx
```
Explanation:
The `npx ts-node --esm make.mts` command will start C++ compilation using `cmake`, and the build_osx_v8 directory will be generated in the `unity/native_src` directory after the compilation is complete. It contains the build artifact we need: puerts.bundle.

> For version 1.3 and earlier, `sh make_osx.sh` is used here.

### Build in your own machine (1.3 or 1.4)
To build PuerTS locally, just follow the GitHub Actions workflow described above.

before that, you need to prepare the relevant build and compilation tools, such as XCode, Visual Studio, CMake, etc. This part can be easily searched on the Internet, so it will not be explained here.

1. Put the build artifact of the JS engine such as https://github.com/puerts/backend-v8 or https://github.com/puerts/backend-quickjs into the unity/native_src directory, which can be found on the Actions tab on the GitHub project homepage. (Note that due to the layout of the GitHub Actions page, when scrolling with the mouse, you need to place the mouse in a relatively edge position of the page).
2. Execute `npx ts-node --esm make.mts` and pass in the JS engine you need as a parameter, such as `npx ts-node --esm make.mts --backend quickjs`. If no parameter is passed, v8 is used by default. `npx ts-node --esm make.mts -h` shows more compilation options, such as compiling plugins for other platforms or debugging versions of plugins.