# 使用extension函数
对于项目中存在的使用C# extension功能实现的方法，如果要在JS侧调用，你可以选以下三种办法中的一种来处理：

1. 把扩展目标类与扩展函数所在类加入wrapper生成列表（推荐）
puerts会在生成代码时帮你遍历整个assembly，将该类存在的所有扩展函数都塞到`static-wrapper`里，这样在JS侧就可以正常调用。

2. 在JS侧调用手动扩展函数
如下图所示，参数0是扩展目标类，参数1是包含扩展函数的扩展类。你可以在JsEnv初始化的位置去调用这个函数
```
puer.$extension(CS.PuertsTest.BaseClass, CS.PuertsTest.BaseClassExtension);
```

3. 打开PUERTS_REFLECT_ALL_EXTENSION宏
打开这个宏后，puerts会在首次产生反射调用时帮你遍历所有assembly。这样就不需要你生成它或者手动调用扩展函数，但副作用是首次反射调用的等待时长会变长，且内存占用会变多