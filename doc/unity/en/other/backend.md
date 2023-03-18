# Other JS Backends
### What is JS backend
PuerTS itself is not responsible for compiling or interpreting Javascript, but instead uses third-party JS engines to do this.

By default, the v8 engine is used. However, depending on different usage scenarios, you can also use the following two JS backends.

### QuickJS Backend
QuickJS **does not support debugging and JIT**, but it is **small**.

Sometimes you may need to compress the installation package size. In that case, you can use the QuickJS version of plugins.

### NodeJS Backend
For a detailed introduction to NodeJS, please refer to the [official website](https://nodejs.org/). It provides APIs for **files**, **networks**, and more on the basis of v8.

It supports the majority of the powerful ecosystem of Javascript. With it, you can more smoothly use various packages brought by npm.