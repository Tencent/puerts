# Typescript

### 自行编译 TS
正如我们的项目名字叫 Puer**TS**，其实我们更建议你使用 Typescript 来开发项目。

实际上，Typescript 本质上就是一种加强版的 Javascript，当您编写完 Typescript 之后，可以自行将其编译为 Javascript。这里提供一个 tsconfig.json 范例，或是参见官方demo 项目：
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

### 关于 ESM 规范的.mjs
前文[模块加载](./module.md)中，我们提到`.mjs`格式的代码才会被默认视为`ExecuteModule`接口可用的模块。那么使用Typescript时，要怎么生成`.mjs`呢？

首先说下`.mjs`的起源。

在Node.js里，起初被支持的模块规范是`CommonJS`。但后来JS生态敲定的标准方案则是`ESM`。这两种语法互相又不兼容，于是Node.js支持了两种特殊JS扩展名: `.mjs` 与 `.cjs`。

`.mjs` 文件会始终被视为 ESM 模块，而 `.cjs` 文件会始终被视为 CommonJS 模块。

随后，TypeScript就支持了两种新的源文件扩展名：`.mts`和`.cts`。
TypeScript默认会将`.mts`文件转换为`.mjs`，`.cts`转换为`.cjs`。

也就是说，当你使用Typescript时，如果想要生成`.mjs`，只需要将你的`.ts`文件更改后缀名为`.mts`就好了

> 参考文档：[TypeScript 4.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#new-file-extensions)


### 生成 d.ts
在使用 Typescript 时，PuerTS 提供了一个生成 dts 声明文件的能力。有了它，你在Typescript 里调用任何 Unity API 时就可以有代码提示了。

这个功能在Unity编辑器菜单的 `PuerTS->Generate index.d.ts`处。