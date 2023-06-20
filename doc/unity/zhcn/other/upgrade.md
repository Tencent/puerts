# 升级指南
本文档用于记录各个版本之间升级需要处理的部分。

## 1.4.x -> 2.0.x
1. DateTime不再映射到js Date对象。js侧需要按照System.DateTime来使用。
2. TypedValue只能传给object类型，不再具备选择重载的作用。
3. 反射模式下，如果一个函数无重载也无默认参数，不会进行参数检查。
4. Ref所使用的下标由['value']变为[0]（如果你代码使用的是puer.$ref和puer.$unref，而不是直接使用下标的话，不受影响）。
5. 1.4版本中预告过的：2.0版本不自带require，建议改用ExecuteModule。如果改造成本过大，可以直接使用[puerts-commonjs](https://github.com/Tencent/puerts/tree/master/unity/Assets/commonjs/upm)
6. `Puerts.Editor.Generator.BindingMode`更名为`Puerts.BindingMode`