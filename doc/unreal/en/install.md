### 源码安装方式

* git clone https://github.com/Tencent/puerts.git

* 拷贝puerts/unreal下的Puerts目录到您项目的Plugins目录下，可以参考[unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)

* 下载v8

    - UE4.25及以上版本：[V8 backends](https://github.com/puerts/backend-v8/releases)
    
    - UE4.24及以下版本：[V8 for ue 4.24 or below](https://github.com/puerts/backend-v8/releases/tag/v8_for_ue424_or_below)
    
* 解压到`YouProject/Plugins/Puerts/ThirdParty`，如果下载的是9.4版本请手动重命名v8_9.4目录为v8

### 发布包安装方式

到[releases](https://github.com/Tencent/puerts/releases)找到你需要的版本，注意，该页面也包含Unity的发布包，Unreal引擎使用版本会以Unreal开头。

下载符合你UE版本的安装包，解压到YouProject/Plugins即可，已经内含v8库。

### 注意事项

* mac下如果遇到移入废纸篓问题，请执行

~~~bash
cd Plugins/Puerts/ThirdParty
find . -name "*.dylib" | xargs sudo xattr -r -d com.apple.quarantine 
~~~

* 纯蓝图工程提示“Plugin 'Puerts' failed to load because module 'JsEnv' could not be found.”

纯蓝图工程不会自动编译Plugins，而Puerts目前的源码或者发布包内，都是C++源码。

一个纯蓝图如何使用一个C++ Plugins是个UE通用问题，目前已知可行的方式是添加一个C++代码把这纯蓝图工程转为C++工程，另外一个比较有可能（但未验证的方式）是自行编译UE引擎，而且编译引擎时把puerts放进去一起编译。

### 虚拟机切换

puerts支持多种脚本后端：V8，quickjs，nodejs

* v8提供了纯净的ECMAScript实现
* 对于包大小苛刻的场景，可以选用quickjs
* nodejs相比v8版本，可以使用更多的npm模块，但包体比v8还要大些

quickjs后端[下载](https://github.com/puerts/backend-quickjs/releases)

nodejs后端[下载](https://github.com/puerts/backend-nodejs/releases)

解压到`YouProject/Plugins/Puerts/ThirdParty`

修改[JsEnv.Build.cs](https://github.com/Tencent/puerts/blob/master/unreal/Puerts/Source/JsEnv/JsEnv.Build.cs) ，UseQuickjs为true表示用quickjs后端，UseNodejs表示用nodejs后端。