- 如何开启wasm
  
  - 在JsEnv.build.cs中，将USE_WASM3修改为true即可,之后会在global里面提供Wasm3变量，使用方式和WebAssebly完全一致，一般建议仅仅在ios上打开
  - 如果在JsEnv.build.cs中将WASM3_OVERRIDE_WEBASSEMBLY打开，会用Wasm3替换WebAssembly的实现，一般建议仅仅在ios上打开
- 如何使用wasm
  
  - 在JavaScript目录下新增一个wasm目录，目录下需要有几个文件
    - 在js中使用wasm和普通的webassembly完全一致，需要注意的是，我们还没有实现Global，Table以及module的export等接口，因此wasm如果依赖这些功能可能会出现问题
    - 在cpp中使用wasm可以参考 WasmCore.cpp,直接使用WasmFunction的Call即可


