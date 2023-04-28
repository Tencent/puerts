- 如何开启wasm
  
  - 在JsEnv.build.cs中，将UseWasm修改为true即可
- 如何使用wasm
  
  - 在JavaScript目录下新增一个wasm目录，目录下需要有几个文件
    - modules.json 该文件用于定义我们有哪些wasm的模块，测试用例中，我们定义了一个WasmMain的模块，它的LinkCategory为0，GlobalNameInTs为WasmMain。在这里，linkcategory用于和cpp的staticbinding配合，后面会谈到。GlobalNameInTs则是会将该模块设置到全局的一个js变量上
    - 因为GlobalNameInTs定义为WasmMain，所以我们还需要WasmMain.json,该json用于定义，wasm中一共导出了哪些函数，每个函数的参数和返回值分别是什么，具体的内容可以参考测试用例
    - 两个wasm文件，WasmMain.wasm以及WasmMain_Editor.wasm，这两个文件可以用clang或者其他生成wasm的工具生成，之所以有两个，是因为类似FName等结构体，在edtior下和client下，内存布局不同
    - 配置完成之后，可以运行如下代码进行测试

```
const ue = require('ue')

const a = new ue.Vector(1, 1, 1)
console.log("ffffffffffffffffffffffff", WasmMain.Test_DistanceSqr(a))
```

- 如何新增自己的wasm函数
  
  - 在自己的wasm工程直接增加代码
  - 生成对应的json和wasm文件（这一部分建议自己构建对应的流程，尽量不要手动修改json）
  - 如果wasm里面用到了ue相关的接口，可以参考WasmStaticUEBinding.cpp，利用WASM_BEGIN_LINK_GLOBAL和WASM_LINK_GLOBAL两个宏进行扩展。WASM_BEGIN_LINK_GLOBAL的第二个参数就是LinkCagegory，puerts创建的jsenv会设置为0
  - 
