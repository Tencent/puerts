# Typescript

As our name is Puer**TS**, we recommend using Typescript to develop your game.

## Generating d.ts

PuerTS has a built-in feature for generating d.ts files. In Typescript, d.ts files provide code hints while writing Typescript code. With PuerTS, you can get C# API code hints in Typescript. You can find this feature in the Unity editor menu under `PuerTS->Generate index.d.ts`.

## Writing tsconfig

After obtaining the C# API declaration file, you can write tsconfig and compile your ts code into Javascript using the tsc command. Here's an example of a tsconfig.json file, or you can refer to the official demo project:

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

## Compiling Typescript

### Using PuerTS.TSLoader

PuerTS provides a third-party module called [puerts-ts-loader](https://github.com/zombieyang/puerts-ts-loader), which is based on PuerTS's Loader mechanism and specializes in handling Typescript. 

It also includes built-in features such as debugpath, sourcemap, and consoleredirect. 

We recommend using it to work with Typescript. If you decide to use it, you can simply refer to the readme file in that repo.

But if you want to compile Typescript yourself, you can go on.  

### Compiling Typescript with tsc/swc and loading it

After obtaining tsconfig, you can easily compile ts into js using the tsc command. Alternatively, you can use the faster swc:

```shell
tsc -p tsconfig.json
```

For convenience, you can change the output directory in tsconfig to the directory that your loader will read from, such as resources if you're using defaultloader. After making this change, you can consider enabling tsc's watch mode, which will automatically compile ts after you modify it, allowing you to run Unity tests directly after modifying your ts code:

```shell
tsc -w -p tsconfig.json
```

#### Source-map

When executing js code in Unity, if an error is thrown, you may find that the line numbers in the JS stack trace printed in the console do not match your code at all. This is because Puerts executes the compiled javascript, and the error stack trace is that of the compiled javascript, not the Typescript source code.

Fortunately, thanks to the powerful ecosystem of javascript, we can use the sourcemap feature to map the line numbers of javascript back to Typescript. First, you need to compile the sourcemap file according to the relevant content in the Typescript documentation, or embed the inline-sourcemap in the output js file. Refer to the documentation: https://www.typescriptlang.org/tsconfig#sourceMap

Then, you need to do the following:

``` javascript
puer.registerBuildinModule("path", {
    dirname(path) {
        return CS.System.IO.Path.GetDirectoryName(path);
    },
    resolve(dir, url) {
        url = url.replace(/\\/g, "/");
        while (url.startsWith("../")) {
            dir = CS.System.IO.Path.GetDirectoryName(dir);
            url = url.substr(3);
        }
        return CS.System.IO.Path.Combine(dir, url);
    },
});
puer.registerBuildinModule("fs", {
    existsSync(path) {
        return CS.System.IO.File.Exists(path);
    },
    readFileSync(path) {
        return CS.System.IO.File.ReadAllText(path);
    },
});
(function () {
    let global = this ?? globalThis;
    global["Buffer"] = global["Buffer"] ?? {};
    //Use inline-source-map mode, need to install buffer module separately
    //global["Buffer"] = global["Buffer"] ?? require("buffer").Buffer;
}) ();
require('source-map-support').install();
```

After that, you can get the Typescript stack trace in the console.

#### Console-redirect

After obtaining the Typescript stack trace in the console, there's still one issue that's a bit troublesome: you can't click on the file path in the console to jump to the specified location like you can with C# files. This is where consoleredirect support comes in. Refer to: https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/1_Start_Template/Assets/Samples/Editor/03_ConsoleRedirect