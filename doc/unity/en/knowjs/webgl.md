# WebGL Support

PuerTS is a scripting tool based on JS, which gives it a huge advantage in packing WebGL.

## JIT for WebGL Platform

Scripting languages and related technologies, including JS, Lua, and WASM, rely heavily on the performance improvement brought by JIT (Just in Time) technology. With JIT, the execution speed of scripts can compete with compiled languages, but without JIT, scripting languages will be very slow. v8 and LuaJIT are both able to execute their script code using JIT (except for iOS and some game console platforms).

When Unity games are published to the WebGL platform, their C# code is converted to WASM by Il2cpp and executed through the browser's WASM engine with JIT. However, if your game contains Lua, and you use the xLua solution, these Lua codes will be executed in the compiled WASM Lua virtual machine, and at this time, Lua codes cannot enjoy JIT (the browser has JIT permission, and executing WASM can JIT. But WASM does not have JIT permission, and executing scripts cannot JIT).

[!image](https://pic4.zhimg.com/80/v2-5be18039ba536dde1b0b5bf51eb2e097_720w.webp)

However, PuerTS has an advantage: it can send JS scripts to the browser's JS environment and use the browser's JIT ability to execute JS.

## PuerTS-WebGL

Thanks to the browser's JIT ability, PuerTS has overwhelming advantages over xLua in script execution.

|       | 100k fibonacci(12) |
| ---  |    ---    |
|xLua WebGL   |    6200ms    |
|Puerts WebGL |   165ms     |

WebGL support is currently available in the form of a third-party package, see: [PuerTS-WebGL](https://github.com/zombieyang/puerts_unity_webgl_demo/edit/master/README.md)