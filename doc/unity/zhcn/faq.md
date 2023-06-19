# FAQ

## [Puer001]DllNotFoundException: puerts

意思是Unity无法加载PuerTS的Native Plugin，比如windows下的`.dll`，macOS下的`.dylib`或`.bundle`，其它平台下的`.a`、`.so`等。

出现该问题的可能性如下：
1. 你确实没有把PuerTS的Native Plugin放到Assets目录下
2. Native Plugin的Import Setting，即平台设置，没有设置对。请在Unity里点击对应的文件设置好平台。或者你可以将[官方demo项目](https://github.com/chexiongsheng/puerts_unity_demo)里对应的meta文件拷过来用。
3. Native Plugin所依赖的系统库不存在。Mac下可以使用`otool`、Linux下可以使用`objdump`，Windows下可以使用[Dependencies](https://github.com/lucasg/Dependencies)查看NativePlugin文件的依赖。查出来后自行补充安装即可。

相关issue：https://github.com/Tencent/puerts/issues/941

## [Puer002]module not found | [Puer003]module not found
`Puer002`代表PuerTS在加载js文件时没有能够找到对应的js文件，具体来说，是调用ILoader的`FileExists`返回了false，或是调用IResolvableLoader的`Resolve`时返回了空字符串或null。

如果遇到这个问题，先确认你使用的loader是DefaultLoader（即创建JsEnv时没有传任何参数）还是你自己编写的自定义Loader。然后检查这个Loader的`FileExists`函数或是`Resolve`函数，看看为什么会返回不正确的值。

`Puer003`和`Puer002`是类似的，只不过Puer003是Loader的ReadFile接口返回了空。你同时要检查一下为什么`FileExists`或`Resolve`返回了存在，但ReadFile时却读到了空

## [Puer W001] You are not using upm to install PuerTS or did not add 'PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM' definition.
在使用xil2cpp模式时，PuerTS->Generate的产物需要经过plugin的重新编译才可用。因此Puer需要将Generate的产物塞回到plugin源码目录处。
如果你没有采用[文档](./performance/il2cpp.md)建议的方式`git clone`并从package manager里添加PuerTS，外加添加了`PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM`宏，你需要自行将编译产物拿去进行plugin编译。

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

这是[vscode](./knowjs/debugging.md)，其它IDE的看各IDE的指引，按nodejs的调试来处理即可。

## 如果需要调试，ILoader的debugpath参数该如何处理？
ts/js中调用require('./a/b')时，ILoader会被调用并传入字符串".../a/b.js"(相对rootPath的完整路径)，你需要理解这字符串并(从文件/内存/网络等)加载好js文件并直接返回。而debugpath需要返回调试器可以理解的路径(比如js文件的绝对路径: D:/.../a/b.js)，通过设置out string debuggpath参数返回，调试器后续根据这个文件路径来匹配文件上的断点。
> Windows平台不区分文件大小写名称且使用反斜杠"\\"代替"/"


## can not find delegate bridge for XXX

你将一个js函数映射为一个delegate有时会报这错误，XXX就是要映射的delegate，可能的情况如下：

* 该delegate带了值类型参数或者返回值，解决办法：如果没有返回值，用JsEnv.UsingAction声明下，有返回值就用JsEnv.UsingFunc声明。关于做这项工作的必要性，可参见这个[stackoverflow问题](https://stackoverflow.com/questions/56183606/invoke-generic-method-via-reflection-in-c-sharp-il2cpp-on-ios)

```csharp
// 代码示例
Puerts.JsEnv jsEnv = new Puerts.JsEnv();
jsEnv.UsingFunc<int, int>();
System.Func<int, int> add = env.Eval<System.Func<int, int>>(@"
    const add_func = function (num) {
        return num + 1;
    }
    add_func;
");
Console.WriteLine(add(10));
```

* 参数数量超过4个，解决办法：官方目前只支持4个，如果有需要，可以依葫芦画瓢写更多的参数支持。

* 参数含ref，out的修饰，目前尚未支持，解决办法：填写issues来提需求


## maOS10.15以上,启动unity的时候提示puerts.bundle损坏,移动到废纸篓

执行

~~~bash
sudo xattr -r -d com.apple.quarantine puerts.bundle
~~~ 

## 生成代码打包手机版本时报方法（runInEditMode等等）找不到

因为这些方法是编辑器独有的，可以通过filter过滤掉，filter使用参考[使用手册](wrapper/filter.md)

## 编辑器下运行正常，il2cpp打包后调用函数/访问属性失败

unity默认会进行代码剪裁，简而言之unity发现某引擎api，系统api没有被业务c#使用，就不编译倒cpp。
解决办法：1、对要调用的api生成wrap代码，这样c#里头就有了引用；2、通过link.xml告知unity别剪裁，link.xml的配置请参考unity官方文档。

## 编辑器下运行正常，打包的时候生成代码报“没有某方法/属性/字段定义”怎么办？
往往是由于该方法/属性/字段是扩在条件编译里头，只在UNITY_EDITOR下有效，这时需要把这方法/属性/字段通过Filter标签过滤，之后重新执行代码生成并打包。([discussions说明](https://github.com/Tencent/puerts/discussions/806))

## 编辑器下运行正常，打包后调用扩展方法报错(不生成静态代码)
默认打包后不再使用反射获取扩展函数, 可使用`PUERTS_REFLECT_ALL_EXTENSION`宏来开启反射.(反射速度慢, 建议在任何时候都应该生成静态代码)

## `GetComponent<XXX>()`在CS为null，但在JS调用却不为null，为什么
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
    //使用inline-source-map模式, 需要额外安装buffer模块
    //global["Buffer"] = global["Buffer"] ?? require("buffer").Buffer;
})();
require('source-map-support').install();
```
注: source-map-support是nodejs模块, 需要自定义path和fs模块.
    
##  webpack打包
将自定义模块加入external module
``` js
module.exports = {
    // other...
    /** 忽略编辑的第三方库 */
    externals: {
        csharp: "commonjs2 csharp",
        puerts: "commonjs2 puerts",
        path: "commonjs2 path",
        fs: "commonjs2 fs",
    }
};
```
