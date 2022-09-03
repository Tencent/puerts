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

### 生成 d.ts
在使用 Typescript 时，PuerTS 提供了一个生成 dts 声明文件的能力。有了它，你在Typescript 里调用任何 Unity API 时就可以有代码提示了。

这个功能在Unity编辑器菜单的 `PuerTS->Generate index.d.ts`处。