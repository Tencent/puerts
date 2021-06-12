# FAQ

## invalid arguments to XXX

如果你用js，可能是输错参数了。

如果你用typescript，可能是子类同名，但不同参数的函数覆盖了父类。以System.Text.Encoding.UTF8.GetBytes为例，你直接调用会报错。

```csharp
System.Text.Encoding.UTF8.GetBytes("你好");
```

System.Text.Encoding.UTF8指向的对象System.Text.UTF8Encoding，有GetBytes的其它重载，按目前的实现找到当前类有同名函数就不再找基类导致的。这时候你可以手动指定下用其基类接口访问该对象。


```csharp
Object.setPrototypeOf(System.Text.Encoding.UTF8, System.Text.Encoding.prototype);//只需要调用过一次即可。后续调用GetBytes都不用再调用。
System.Text.Encoding.UTF8.GetBytes("你好");
```

## setInterval没回调

可能是没调用JsEnv.Tick

## 如何调试

这是[vscode](vscode_debug.md)，其它IDE的看各IDE的指引，按nodejs的调试来处理即可。

## can not find delegate bridge for XXX

你将一个js函数映射为一个delegate有时会报这错误，XXX就是要映射的delegate，可能的情况如下：

* 该delegate带了值类型参数或者返回值，解决办法：如果没有返回值，用JsEnv.UsingAction声明下，有返回值就用JsEnv.UsingFunc声明。

* 参数数量超过4个，解决办法：官方目前只支持4个，如果有需要，可以依葫芦画瓢写更多的参数支持。

* 参数含ref，out的修饰，目前尚未支持，解决办法：填写issues来提需求

## maOS10.15以上,启动unity的时候提示puerts.bundle损坏,移动到废纸篓

执行

~~~bash
sudo xattr -r -d com.apple.quarantine puerts.bundle
~~~

## 生成代码打包手机版本时报方法（runInEditMode等等）找不到

因为这些方法是编辑器独有的，可以通过filter过滤掉，filter使用参考[使用手册](manual.md)

## 编辑器下运行正常，il2cpp打包后调用函数/访问属性失败

unity默认会进行代码剪裁，简而言之unity发现某引擎api，系统api没有被业务c#使用，就不编译倒cpp。
解决办法：1、对要调用的api生成wrap代码，这样c#里头就有了引用；2、通过link.xml告知unity别剪裁，link.xml的配置请参考unity官方文档。

## GetComponent<XXX>()在CS为null，但在JS调用却不为null，为什么
其实那C#对象并不为null，是UnityEngine.Object重载的==操作符。当一个对象被Destroy，未初始化等情况，obj == null返回true；`GetComponent<XXX>()`如果组件不存在，Unity重载==的结果也会让其返回null。但这些C#对象并不为null，可以通过System.Object.ReferenceEquals(null, obj)来验证下。

对应这种情况，可以为UnityEngine.Object写一个扩展方法，需要判空的时候统一用它解决：
```
public static bool IsNull(this UnityEngine.Object o) 
{
    return o == null;
}
```

## source-map-support支持
安装模块
```
npm install source-map-support --save-dev
```
然后执行如下代码:
``` javascript
var csharp = require("csharp");
var puerts = require("puerts");
puerts.registerBuildinModule("path", {
    dirname(path) {
        return csharp.System.IO.Path.GetDirectoryName(path);
    },
    resolve(dir, url) {
        url = url.replace(/\\/g, "/");
        while (url.startsWith("../")) {
            dir = csharp.System.IO.Path.GetDirectoryName(dir);
            url = url.substr(3);
        }
        return csharp.System.IO.Path.Combine(dir, url);
    },
});
puerts.registerBuildinModule("fs", {
    existsSync(path) {
        return csharp.System.IO.File.Exists(path);
    },
    readFileSync(path) {
        return csharp.System.IO.File.ReadAllText(path);
    },
});
(function () {
    let global = this ?? globalThis;
    global["Buffer"] = global["Buffer"] ?? {};
})();
require('source-map-support').install();
```
注: source-map-support是nodejs模块, 需要自定义path和fs模块.
    
##  webpack打包
webpack将自定义模块加入external module
``` json
module.exports = {
    mode: "development",
    entry: {
        main: path.resolve(__dirname, "./src/main.ts"),
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "./dist")
    },
    /** 忽略编辑的第三方库 */
    externals: {
        csharp: "commonjs2 csharp",
        puerts: "commonjs2 puerts",
        path: "commonjs2 path",
        fs: "commonjs2 fs",
    }
};
```
