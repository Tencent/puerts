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

## ue对象被“Puerts_UserObjectRetainer”引用

这代表该ue对象的“js侧代理对象”未释放，任意gc，一个对象要释放得满足两个条件：1、没有指向该对象的引用；2、gc扫描到它，并完成释放；

对于条件1，得看你的js代码逻辑，也可以通过cdt等工具查看内存，看看它被啥引用则；

对于条件2，如果是v8虚拟机，由于是分代gc的原因，老生代内存扫描的触发需要一定的条件（比如内存分配得比较多，比较快等），如果希望加快gc进程，可以调用FJsEnv::LowMemoryNotification通知v8加速gc，也可以调用FJsEnv::RequestFullGarbageCollectionForTesting立即完成一趟全量gc（耗时较大，只建议在切场景之类的地方做）

## 手机/PC打包后脚本不执行/报找不到脚本错误

生成的js脚本不是ue资产文件(*.asset)，需要手动设置打包。

到“项目设置/打包/Additional Not-Asset Directories to Package”，把Content下的“JavaScript”目录添加进去。

## typesceript版本升级

开启继承ue类功能后，puerts会调用typescript库编译ts。安装于`YourProject/Plugins/Puerts/Content/JavaScript/PuertsEditor`，该目录还会拷贝到`YourProject/Content/JavaScript/PuertsEditor`，版本号package.json配置文件（如上两个目录都有）。

要升级版本号只需要修改package.json（两个都要改）、到该文件所在目录执行`npm install .`即可，但要注意并不是所有typescript版本都支持，而且随着puerts的修改版本支持情况可能会发生变动，版本支持情况我会更新到这条faq下

有项目长期使用到版本：3.4.5、4.4.4、4.7.4

有项目简单测试可以的版本：4.8.2

不支持的版本：（高于）4.8.3

## ue_bp.d.ts报错，重新生成无效

蓝图声明文件默认增量生成（文件不发生变化不生成），有时其依赖的类型发生了变化，或者被版本管理工具修改，此时可以试试全量生成，控>制台执行`Puerts.Gen FULL`

## ts继承ue类后不生成代理蓝图的定位

* 在UE命令行界面输入`puerts ls`，如果报“Puerts command not initialized”，很可能是因为没安装好环境，或者插件该功能没启用，请按安装文档检查又没操作失误

* 如果继承ue类功能正常启用`puerts ls`能看到所有被纳入增量编译的文件，如果想查找具体ts文件，比如TsTestActor，可以输入`puerts ls TsTestActor`进行查找，如果查找不到你的文件，表面该文件可能没被纳入到ts工程里，请检查“tsconfig.json”文件的配置，该配置是一个标准的ts工程配置，如何配置请查看typescript官方文档

* 如果`puerts ls TsTestActor`找到了你的文件，看isBP栏，如果为false而且processed栏为true，表明格式不正确，请参考puerts的《继承引擎类功能》文档

* 可以尝试在命令行单独编译该ts文件，输入编译命令`puerts compile e9050088932a23f720713a9a5073986e`触发该文件的编译（其中e9050088932a23f720713a9a5073986e是`puerts ls TsTestActor`返回的id），如果有编译错误就解决，没有编译错误正常能生成相应的代理蓝图。

