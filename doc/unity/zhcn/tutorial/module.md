# 模块加载

### Eval并不建议大量使用
PuerTS 支持使用 Eval 来执行 JS，前文我们也一直是用 Eval 来演示。

但Eval是一个非常基础的接口，它相当于在 JS 的**全局作用域**执行代码，因而很容易出现如下问题
```C#
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval("const a = 3");

    ////// 其他代码
    ////// 其他代码
    ////// 其他代码
    ////// 其他代码
    ////// 很久以后
    env.Eval("const a = function () {}");
}
```
上述代码，会抛出`a`被非法重定义的错误。这显然是不合开发习惯的。

比较好的方式是，把代码内容包裹在一个**立即执行函数 (Immediately Invoked Function Expression)**里面
```C#
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    int a = env.Eval<int>(@"
        (function() {
            const a = 3
            return a;
        })()
    ");

    // a == 3
}
```

实际上，**立即执行函数**就是Javascript里很类似模块的一个概念。它拥有一个独立的作用域，且能定义它自己的输出项。非常便于封装一个功能。

-------------
### ESM 模块

从**立即执行函数**开始，Javascript 生态后续发展出过很多个模块规范，目前最流行的就是 JS 官方标准：ESM。

PuerTS 是支持执行 ESM 规范的模块的

你可以在任意`Resources`目录添加一个 helloworld.mjs 文件
```js
import { world } from 'lib.mjs'
console.log('hello ' + world);
```
在任意`Resources`目录添加一个 lib.mjs 文件
```js
const world = 'puerts'
export { world }
```
随后通过`JsEnv.ExecuteModule`引入。
```C#
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.ExecuteModule("helloworld.mjs")
}
```
执行以上代码，控制台会输出hello puerts。

-------------------

通过以上写法，即可利用puerts加载js文件并执行，而不需要使用前面例子中的Eval（也不建议您正式开发时使用）。

在独立的文件写 JS 之后，下一步我们要回归 PuerTS 的其中一个重点：TS