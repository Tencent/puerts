# PuerTS CommonJS支持
PuerTS新版本中默认不带有CommonJS的支持，如果你项目中只有少量CommonJS模块，建议直接改成ESM格式。

你也可以通过本包恢复该能力。

1. 首先通过upm方式添加该包

* 比如git clone本项目，在PackageManager处`add from disk`添加本目录下的package.json。
<!-- * 或是使用openupm，比如`openupm-cn add com.tencent.puerts.commonjs` -->

2. 使用
    ```
    env = new JsEnv();
    Puerts.ThirdParty.CommonJS.InjectSupportForCJS(env);
    env.Eval("console.log(require('test.cjs'))");
    ```

## 如何将CommonJS包改为ESM格式
1. module.exports 改为 export default
2. exports.xxx 改为 export xxx
3. require 改为 import