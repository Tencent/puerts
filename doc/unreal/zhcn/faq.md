# FAQ

## “new (std::nothrow) int[0] return nullptr, try fix it!”告警

Unreal重载了new，而且处理不符合C++规范：用no-throw方式new一个长度为0的数组，返回了nullptr，标准应该是返回有效值，只有OOM时才返回nullptr，这让遵从规范的V8误以为是OOM了，进而abort。目前只发现Window有该问题，而且该问题也经epic官方确认了。
Puerts如果发现引擎有该bug，会通过覆盖内存分配行为修复该问题，并打印“new (std::nothrow) int[0] return nullptr, try fix it!”告警。该告警只是提示下当前UE版本存在该Bug，没什么影响。

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

“ue对象持有stub对象”，在ts持有并不能阻止ue的gc，mixin中参数指明objectTakeByNative时会产生这种类型的对象。

其它情况均为“stub对象持有ue对象”，这种类型的对象可以通过ts持有可以阻止ue对象的gc。
    

但即使改对象不会被gc释放，依然不能保证一个ue对象不被销毁，ue的gc和其它正经的gc不一样，诸如c#、java、lua、js等虚拟机的gc，一个对象还被持有就肯定不销毁，而ue下可以调用api强制删除一个对象（可能是用户自己调用，也可能是引擎调用，比较常见是切场景后，所有该场景挂的actor都会自动销毁）。

## ue对象被“Puerts_UserObjectRetainer”引用

这代表该ue对象的“js侧代理对象”未释放，任意gc，一个对象要释放得满足两个条件：1、没有指向该对象的引用；2、gc扫描到它，并完成释放；

对于条件1，得看你的js代码逻辑，也可以通过cdt等工具查看内存，看看它被啥引用则；

对于条件2，如果是v8虚拟机，由于是分代gc的原因，老生代内存扫描的触发需要一定的条件（比如内存分配得比较多，比较快等），如果希望加快gc进程，可以调用FJsEnv::LowMemoryNotification通知v8加速gc，也可以调用FJsEnv::RequestFullGarbageCollectionForTesting立即完成一趟全量gc（耗时较大，只建议在切场景之类的地方做）

## 手机/PC打包后脚本不执行/报找不到脚本错误

生成的js脚本不是ue资产文件(*.asset)，需要手动设置打包。

到“项目设置/打包/Additional Not-Asset Directories to Package”，把Content下的“JavaScript”目录添加进去。

## ue_bp.d.ts报错，重新生成无效

蓝图声明文件默认增量生成（文件不发生变化不生成），有时其依赖的类型发生了变化，或者被版本管理工具修改，此时可以试试全量生成，控制台执行`Puerts.Gen FULL`

## 生成的ue_bp.d.ts报语法错误

这一般是蓝图的路径，字段，参数名等含ts不支持的字符所致，解决办法：

* 如果这种蓝图的量比较小，可以加入到黑名单（项目设置->Plugins->Puerts，保存在`Config/DefaultPuerts.ini`的`[/Script/DeclarationGenerator.DeclarationGeneratorSetting]`段）。

* 如果这种蓝图数量比较大，可以把需要在代码访问的、合法的蓝图放入一个目录，然后在编辑器控制台下输入命令来生成，这种方式可以指定蓝图搜索的路径，比如 ·Puerts.Gen PATH=/Game/StarterContent· 只会搜索"Content\StarterContent"目录。

## 概率报Maximum call stack size exceeded

注意是概率报，不是必报，这种情况通常是因为多线程访问了FJsEnv，可以尝试在ScriptEnv.Build.cs中加入THREAD_SAFE宏看能否解决。

ps：以上是v8后端的的现象和解决方案，qjs后端如果多线程访问有可能会抛个没有文件信息的异常`<unknow>:-1`，而且qjs后端目前不支持多线程
ps：如果是必报，应该是js代码中有递归死循环了。

