# FAQ

## “new (std::nothrow) int[0] return nullptr, try fix it!”告警

Unreal重载了new，而且处理不符合C++规范：用no-throw方式new一个长度为0的数组，返回了nullptr，标准应该是返回有效值，只有OOM时才返回nullptr，这让遵从规范的V8误以为是OOM了，进而abort。目前只发现Window有该问题，而且该问题也经epic官方确认了。
Puerts如果发现引擎有该bug，会通过覆盖内存分配行为修复该问题，并打印“new (std::nothrow) int[0] return nullptr, try fix it!”告警。该告警只是提示下当前UE版本存在该Bug，没什么影响。

## 自动绑定模式有些扩展函数用不了

这是由于puerts模块启动得比较早，它启动的时候遍历Class遍历不了比它后启动的模块里的扩展函数。
解决办法：你所有模块启动完，调用下如下api就可以让它重新查找扩展函数。

~~~c++
IPuertsModule::Get().InitExtensionMethodsMap();
~~~

## 勾选Wait Debugger选项启动卡住

这个选项就是卡住进程来等待调试器连接，连上了就往下走了。

如果你还没配置好调试器，又不小心选了这个选项，也就没办法进入把这个选项去掉，此时可以关闭进程，打开Config\DefaultPuerts.ini把WaitDebugger改为False。


## ts生成蓝图的StaticClass调用，返回UClass使用不符合预期

ts类是没有StaticClass方法的，所以StaticClass调用其实是继承链上第一个有StaticClass方法的类，返回的也是该StaticClass方法所在类的UClass。

没理解这点可能会导致一些误解：比如我创建的对象为啥没子类方法，必然CreateDefaultSubobject报错说类是abstract的，无法创建等。

正确的做法应该是通过UE.Class.Load("path/to/your/blueprint/file")去加载。

## mac下提示“无法打开libv8.dylib，因为无法验证开发者”

进入该dylib文件所在目录（通常是：youproject/Plugins/Puerts/ThirdParty/v8/Lib/macOSdylib），执行如下命令：

~~~bash
sudo xattr -r -d com.apple.quarantine *.dylib
~~~

## 纯蓝图工程下加入puerts插件，提示"XXXProject counld not compiled. Try rebuilding from source manually"

对于纯蓝图工程，双击uproject文件，UE可能不会自动编译第三方的C++ Plugins。需要手动生成vs工程（mac下xcode工程），然后在ide编译。

## 打包后运行时报一些字段找不到

这大多数是由UE对FName编辑器和运行时处理不一致导致的，默认编辑器下大小写敏感，运行时大小写不敏感。

打比方，你在蓝图定义了一个count字段，在编辑器下生成代码，这个字段生成为count，运行也正常。

而打包后，如果在你访问这个蓝图前，已经有另外一个地方初始化了一个“Count”字段，那么你访问这个蓝图时，该字段会是"Count"，因为FName.ToString返回的是第一次构造该FName输入的字符串，后面只要转成小写后和第一次一样的FName，都是重用第一次的。

所以你在脚本访问的count字段会不存在（变成了Count字段）。

## UE5下报 Construct TypeScript Object TestActor_C_1(000001E5057BD300) on illegal thread!

关闭AsyncLoadingThreadEnabled选项（该选项ue4默认关闭, ue5默认打开了）

## 应如何避免"access a invalid object"异常

那个异常是puerts内部的对象生命周期跟踪功能抛的，如果一个对象被这功能标记为无效，所有对其所有调用（包括UObject::IsValid，也是一个普通的UE调用），都会抛异常。

技术上“对象生命周期跟踪功能”添加一个判断的api很简单（比写这faq简单）。但加这种api会导致业务到处都是这类判断，影响业务的代码可读性。

建议出现这种问题，应该设计上解决，避免持有无效对象（比如常见的切场景UE会强制删actor，那么切场景时应通知ts清理），解决不了又感觉可以忽略就try-catch。

## GC相关

一个UE对象传入到ts，ts侧会建立一个stub (ts)对象与之相对应（ts调用这个stub对象会被转发到真实的UE原生调用），而且在puerts中他们的生命周期间的关系有两种。

* stub对象由js gc管理，stub对象持有ue对象的强引用（下称“stub对象持有ue对象”）

    - 如果stub对象在ts无引用，将会被gc，进而释放对ue对象的强引用
    
    - 如果进一步在ue引擎也没有该ue对象，该ue对象会被gc

* ue对象由ue gc管理，ue对象持有stub对象的强引用（下称“ue对象持有stub对象”）

    - 如果ue对象在ue引擎无引用，该ue对象会被gc，进而释放对stub对象的强引用
    
    - 如果进一步在ts也没有引用该stub对象，该stub对象会被gc

“ue对象持有stub对象”，在ts持有并不能阻止ue的gc，有三种情况会产生这种类型的对象：

* ts继承ue类型

* mixin中参数指明objectTakeByNative

* makeUClass（这功能已经废弃，不建议使用）

其它情况均为“stub对象持有ue对象”，这种类型的对象可以通过ts持有可以阻止ue对象的gc。
    

但即使改对象不会被gc释放，依然不能保证一个ue对象不被销毁，ue的gc和其它正经的gc不一样，诸如c#、java、lua、js等虚拟机的gc，一个对象还被持有就肯定不销毁，而ue下可以调用api强制删除一个对象（可能是用户自己调用，也可能是引擎调用，比较常见是切场景后，所有该场景挂的actor都会自动销毁）。

