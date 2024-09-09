# WebGL支持

PuerTS 基于 JS 提供脚本能力，因此在打包WebGL上有很大的优势。

## WebGL平台与JIT技术

JIT（即时编译）技术可以提高脚本语言的执行速度，包括JS、Lua和WASM等。有了JIT，脚本的执行速度可以与编译型语言相媲美。但如果没有JIT，脚本语言就会非常慢。v8、LuaJIT都是能将其脚本代码用JIT的方式执行的（iOS除外、某些游戏机平台也不行）。

Unity游戏发布到WebGL平台后，其C#代码会经Il2cpp转化为WASM，并通过浏览器的WASM引擎通过JIT执行。但如果你的游戏包含Lua，如果是xLua的方案，这些Lua代码会在编译为WASM的Lua虚拟机里执行，此时Lua代码是**无法享受**JIT的（浏览器有JIT权限，执行WASM可以JIT。但WASM没有JIT权限，执行脚本无法JIT）。

## PuerTS-WebGL

PuerTS的优势在于：它可以将JS脚本发送到浏览器的JS环境里，利用浏览器的JIT能力来执行JS。这意味着，相比xLua，PuerTS在脚本执行上有压倒性的优势。

下面是一个比较表格，展示了在100k fibonacci(12)的情况下，xLua WebGL和PuerTS WebGL的执行速度对比：

|       | 100k fibonacci(12) |
| ---  |    ---    |
|xLua WebGL   |    6200ms    |
|Puerts WebGL |   165ms     |

WebGL目前处在一个子包中，并不在puerts本体里。如果你想了解更多关于WebGL能力的信息，可以查看[PuerTS-WebGL](https://github.com/Tencent/puerts/tree/master/unity/Assets/webgl)。

> 上面的测试是关于执行速度的。在跨语言性能上，这个方案并不优秀。但我们还是可以利用WebGL平台的特性，通过别的方式解决问题，参见[这篇知乎文章](https://zhuanlan.zhihu.com/p/646932579)
