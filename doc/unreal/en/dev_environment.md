# Setup Development Environment
Once puerts has been successfully installed, it's time to set up a working TypeScript development environment.

## Table Of Contents
- [Installing TypeScript](#installing-typescript)
- [Configure TypeScript](#configure-typescript)
- [Type Safety](#type-safety)
- [Getting Started With Puerts](#getting-started-with-puerts)

## Installing TypeScript
Puerts is designed to be used with TypeScript however the virtual machine still executes traditional JavaScript. As such, writing code inside of TypeScript and then compiling it all into JavaScript is highly recommended.

1. Install Node.JS

[![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/en/download)

2. Install TypeScript inside of your project using npm

``` bash
# navigate into the project directory (e.g cd path/to/YourProject)
npm install typescript
```

TypeScript can then be compiled into JavaScript by executing `npx tsc` from within your project directory.

## Configure TypeScript
In order for TypeScript to function correctly, a `tsconfig.json` file should be present within the project.

Create and place this file directly inside of your U.E project directory.
##### Example tsconfig.json
``` javascript
// YourProject/tsconfig.json

{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "experimentalDecorators": true, // Set `true` to use of Decorators (i.e. RPC functions)
    "jsx": "react",
    "sourceMap": true,
    "typeRoots": [
      "Typing", // Specify the 'Typing' directory as a root (contains the deceleration files)
      "./node_modules/@types"
    ],
    "outDir": "Content/JavaScript"  // Directory to output compiled .js files (if using `npx tsc` command)
  },
  "include": [
    "TypeScript/**/*"   // Location of scripts. (e.g YourProject/TypeScript)
    //...
  ]
}
```
**Note: "include" specifies the directories your puerts TypeScript files are located. If you wish to store your scripts elsewhere, make sure to update this field accordingly**

## Type Safety
Type safety is the biggest advantage of TypeScript over JavaScript. In order for it to work, deceleration files must be generated. Open up the editor and press the 'Generate' button to produce essential typing files.

![generate_dts.png](../..//pic/puerts_gen_dts.png)

**Note: Regenerating the deceleration files should be done proceeding any C++ related changes**

## Getting Started With Puerts
Now that puerts is installed and your TypeScript development environment has been set up, it's time to [get started!](./getting_started.md)