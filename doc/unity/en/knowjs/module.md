# Module
### Avoid using Eval extensively


```C#
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval("const a = 3");

    ////// much later
    env.Eval("const a = function () {}");
}
```


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
In fact, the **Immediately Invoked Function Expression** is a concept in JavaScript that is very similar to modules. It has an independent scope and can define its own output items, making it very convenient for encapsulating functionality.

-------------
### ESM modules
Starting with the **Immediately Invoked Function Expression**, the JavaScript ecosystem has developed many module specifications, with the most popular being the official JS standard: ESM.

PuerTS supports executing modules that follow the ESM specification.

You can add a helloworld.mjs file to any `Resources` directory:

```js
import { world } from 'lib.mjs'
console.log('hello ' + world);
```
Add a `lib.mjs` file to any `Resources` directory:

```js
const world = 'puerts'
export { world }
```
Then import it using `JsEnv.ExecuteModule`.
```C#
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.ExecuteModule("helloworld.mjs")
}
```
It will output `hello puerts`in the console
-------------------

With the above approach, you can use Puerts to load and execute JS files without using Eval (and we do not recommend using it in your actual development).
-------------------

After writing JS in a separate file, the next step is to return to one of Puerts' focus areas: TypeScript (TS).