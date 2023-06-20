# Upgrade Guide

This document is used to record the parts that need to be handled when upgrading between different versions.

## 1.4.x -> 2.0.x
1. DateTime will no longer be mapped to js Date object. On the js side, System.DateTime should be used instead.
2. TypedValue can only be passed to object type and no longer has the function of selecting overload.
3. Under reflection mode, if a function has no overload or default parameters, no parameter check will be performed.
4. The index used by Ref has changed from ['value'] to [0] (if your code uses puer.$ref and puer.$unref instead of directly using the index, it will not be affected).
5. As announced in version 1.4, require is no longer included in version 2.0. It is recommended to use ExecuteModule instead. If the cost of transformation is too high, you can directly use [puerts-commonjs](https://github.com/Tencent/puerts/tree/master/unity/Assets/commonjs/upm).
6. `Puerts.Editor.Generator.BindingMode` has been renamed to `Puerts.BindingMode`.