# Typescript

正如我们的项目名为 Puer**TS** ，我们强烈建议你使用 Typescript 来写代码。TS 会比纯 Javascript 开发提供更强大的能力。

## 生成 d.ts

在 Typescript 中，d.ts 文件可以为你编写 Typescript 代码时提供代码提示。PuerTS 内置了生成 d.ts 文件的功能，这样你就可以在 Typescript 中得到 C# API 的代码提示了。你可以在 Unity 编辑器菜单的 `PuerTS->Generate index.d.ts` 处使用这个功能。

## 编写 tsconfig

有了 C# API 的声明文件后，你就可以编写 tsconfig 文件。这里提供一个 tsconfig.json 的范例，或者你可以参考官方 demo 项目：

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "es2016",
    "sourceMap": true,
    "noImplicitAny": true,
    "typeRoots": [
      "../Assets/Puerts/Typing",
      "../Assets/Gen/Typing",
      "./node_modules/@types"
    ],
    "outDir": "output"
  }
}
```

## 编译 Typescript

### 使用 PuerTS.TSLoader

PuerTS 提供了一个扩展模块 `puerts-ts-loader`，它基于 PuerTS 的 Loader 机制，专门处理 Typescript。安装后可在 C# 直接加载 Typescript。

它还内置了 debugpath、sourcemap、consoleredirect 等处理，非常方便。易于新手使用。

我们强烈推荐你使用它来使用 Typescript。如果你决定采用它，直接点开项目看 readme 即可。

如果你还是决定自行接管 Typescript 编译流程，或是使用`ts-loader`时遇到疑难杂症，可以继续往下看。

### 使用 tsc/swc 编译 Typescript 并加载

有了 tsconfig 文件后，我们可以简单地通过 tsc 命令将 ts 编译为 js。或者你也可以使用速度更快的 swc：

```shell
tsc -p tsconfig.json
```

为了方便，你可以将 tsconfig 里的 output 目录改为你的 loader 会读取的目录，比如使用 defaultloader 的话直接生成到 resources。改成这样后你可以考虑开启 tsc 的 watch 模式，tsc 会在你修改 ts 代码后自动编译 ts，这样你就可以在修改完 ts 代码后直接运行 Unity 测试：

```shell
tsc -w -p tsconfig.json
```

#### source-map-support支持
在 Unity 里执行 js 代码时，如果抛了错，你会发现控制台里打印的 JS 栈的行数和你的代码完全对不上。这是因为 PuerTS 执行的是编译出来的 Javascript，这个错误栈是你编译出来的 Javascript 的栈，而非 Typescript 源码的。所幸的是，我们可以通过 sourcemap 功能将 Javascript 的行数映射回 Typescript 的行数。

1. 正常情况下，你可以直接使用TSLoader，其内置了source-map支持
2. 如果你的项目不适用TSLoader，可以直接将TSLoader的[这个脚本文件](https://github.com/zombieyang/puerts-ts-loader/blob/main/upm/Editor/ConsoleRedirect/Typescripts/source-map-support.gen.mjs)放到你的项目，在JsEnv启动后执行下面代码即可。
```
import sm from 'source-map-support.gen.mjs'
sm.install({
    retrieveFile: (path) => {
        // 如果你用的不是inline的source-map，这里还得处理sourcemap的加载
        return puer.loadFile(path).content
    }
});
```

#### console-redirect

在控制台里得到 Typescript 栈之后，还有一点是比较麻烦的，就是你不能像 C# 文件一样直接点击控制台里的文件路径跳转到指定位置。这时候就要添加 consoleredirect 的支持。

1. 正常情况下，你可以直接使用TSLoader，其内置了console-redirect支持
2. 如果你的项目不适用TSLoader，你可以参考这个项目：https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/1_Start_Template/Assets/Samples/Editor/03_ConsoleRedirect。
