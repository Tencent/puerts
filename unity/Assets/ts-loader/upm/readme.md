# 直接加载TS的loader
不再需要你另外起一个命令行编译Typescript，直接在Loader加载过程里执行ts编译。

## 使用方式
```
    Puerts.WebGL.MainEnv.Get(new Puerts.TSLoader()); // 获取环境JsEnv
    env.ExecuteModule("entry.ts"); // 直接Execute Typescript文件
```

## 自定义Typescript根目录
默认情况下，TSLoader会使用与Assets目录同级的Puer-Project目录作为你的Typescript项目根目录

比如前文中的entry.ts指向的就是 `<Unity项目路径>/Puer-Project/entry.ts`

你也可以这样自定义Typescript项目根目录：
```
    Puerts.WebGL.MainEnv.Get(new Puerts.TSLoader(Application.dataPath + "/../TsProj")); // ts放在TsProj目录下
```

## 例子
本仓库的BasketballDemo就使用到了TSLoader

## 依赖
Unity编辑器所使用的PuerTS必须为nodejs版