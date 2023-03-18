# Typescript
### Compile TS by yourself
As our project name suggests, Puer**TS**, we actually recommend using Typescript to develop your project.

In fact, Typescript is essentially a enhanced version of Javascript, and after you finish writing Typescript, you can compile it into Javascript by yourself. Here's an example of a tsconfig.json file, or you can refer to the official demo project:

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
### Generate d.ts
When using Typescript, PuerTS provides the ability to generate d.ts declaration files. With it, you can get code hints when calling any Unity API in Typescript.

This feature can be found in the Unity editor menu at `PuerTS->Generate index.d.ts`.