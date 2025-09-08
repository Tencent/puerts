# 升级指南
本文档用于记录各个大版本之间主要的升级内容及其注意事项。

## 1.4.x -> 2.0.x
* 主要新功能
1. 新增[xil2cpp模式](../performance/il2cpp.md)，极大提高跨语言性能。但需要你自己编译普洱的binary，牺牲一点灵活度。
2. 目录结构完全遵循upm格式

* 不向下兼容的变动：
1. DateTime不再映射到js Date对象。js侧需要按照System.DateTime来使用。
2. TypedValue只能传给object类型，不再具备选择重载的作用。
3. 反射模式下，如果一个函数无重载也无默认参数，不会进行参数检查。
4. Ref所使用的下标由['value']变为[0]（如果你代码使用的是puer.$ref和puer.$unref，而不是直接使用下标的话，不受影响）。
5. 1.4版本中预告过的：2.0版本不自带require，建议改用ExecuteModule。如果改造成本过大，可以直接使用[puerts-commonjs](https://github.com/Tencent/puerts/tree/master/unity/Assets/commonjs/upm)
6. `Puerts.Editor.Generator.BindingMode`更名为`Puerts.BindingMode`

## 1.3.x -> 1.4.x
* 主要新功能
1. 支持Apple silicon（m系列）
2. 全平台支持Node.js
3. 新增子包 [puerts-webgl](https://github.com/zombieyang/puerts_unity_webgl_demo)，新增webGL平台支持，且在该平台下有极大的[性能优势](../knowjs/webgl.md)
4. 新增子包 [puerts-tsloader](https://github.com/zombieyang/puerts-ts-loader)，内置Typescript处理，用于减少Typescript新手上手的学习成本，类似Deno的想法。支持node_modules的直接加载。
5. 新增ESModule支持，且官方后续都建议使用ESModule。这种方式更为贴近JS标准。