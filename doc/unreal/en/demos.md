# Official Puerts Demos?
Bellow is a list of demo projects that cover all of the different features Puerts has to offer.

## Setup

1. Download one of the demo projects below

2. Setup the Puerts plugin inside of the demo project using the [official installation guide.](./install.md) 

**Note: Installing the `NodeJS` script backend is recommended for all demo projects.**

## Projects
- [Manually Starting A JavasScript Virtual Machine](https://github.com/winman-tencent/Puerts_Demos/tree/Starting_A_JS_VM)
- [Debugging With VSCode](https://github.com/winman-tencent/Puerts_Demos/tree/Debugging)
- [C++ calling TypeScript](https://github.com/winman-tencent/Puerts_Demos/tree/Cpp_Calling_TypeScript)
- [Combining TypeScript and C++ Classes With Mixin](https://github.com/winman-tencent/Puerts_Demos/tree/Mixin)
- [Interacting With Non-Reflected API Through Template Based Static Binding](https://github.com/winman-tencent/Puerts_Demos/tree/Static_Binding)

## Legacy Projects (Potentially Outdated)

**How to Run:**  
To run a specific TypeScript example, change the entry in [TsGameInstance.cpp](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Source/puerts_unreal_demo/TsGameInstance.cpp) to the desired script name (without the `.ts` extension). By default, it runs `QuickStart`.

### Manually Creating a Virtual Machine
You can manually construct one or more virtual machines.
- [Virtual Machine Example Project](https://github.com/chexiongsheng/puerts_unreal_demo): Demonstrates how users can create their own VM.
    - [TsGameInstance.cpp](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Source/puerts_unreal_demo/TsGameInstance.cpp): Shows how to construct a VM inside `GameInstance` (you can also create it in other classes as needed).

### TypeScript and Engine/C++ Interaction Examples
Although the following examples are part of the [Virtual Machine Example Project](https://github.com/chexiongsheng/puerts_unreal_demo), they can be run in any VM environment.

- [QuickStart.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/QuickStart.ts): Demonstrates mutual calls between TypeScript and the Unreal Engine.
- [NewContainer.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/NewContainer.ts): Demonstrates container creation.
- [AsyncTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/AsyncTest.ts): Demonstrates how to load a Blueprint asynchronously and wrap a `Delay` into an `async/await` call.
- [UsingWidget.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/UsingWidget.ts): Demonstrates UI loading, event binding, and data access.
- [UsingMixin.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/UsingMixin.ts): Demonstrates the mixin functionality.

- **Calling regular C++ classes:**
  - [TestClass.h](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Plugins/Puerts/Source/JsEnv/Private/TestBinding/TestClass.h): Basic example of a C++ class definition.
  - [AdvanceTestClass.h](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Plugins/Puerts/Source/JsEnv/Private/TestBinding/AdvanceTestClass.h): Advanced C++ class example.
  - [TestClassWrap.cpp](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Plugins/Puerts/Source/JsEnv/Private/TestBinding/TestClassWrap.cpp): Binding declarations (to export C++ classes to TypeScript).
  - [CDataTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/CDataTest.ts): Demonstrates calling C++ from TypeScript.

### Editor Extensions
Puerts can also be used to write editor extensions. If you use the Node.js version of Puerts, you can leverage a wide variety of npm packages to speed up editor development.
- [Editor Extension Demo Project](https://github.com/puerts/EasyEditorPluginDemo)
  - [Main.ts](https://github.com/puerts/EasyEditorPluginDemo/blob/master/EasyEditorDemo/src/Main.ts): Demonstrates menus, toolbars, dropdown buttons, right-click context menus, and command-line extension.
  - [DemoWindow.ts](https://github.com/puerts/EasyEditorPluginDemo/blob/master/EasyEditorDemo/src/DemoWindow.ts): Demonstrates (optional) IMGUI usage.
  - [NodejsDemo.ts](https://github.com/puerts/EasyEditorPluginDemo/blob/master/EasyEditorDemo/src/NodejsDemo.ts): Demonstrates usage of Node.js APIs.
