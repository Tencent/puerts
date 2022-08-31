### 源码安装方式

* git clone https://github.com/Tencent/puerts.git

* 拷贝puerts/unreal下的Puerts目录到您项目的Plugins目录下，可以参考[unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)

* 下载v8

    - UE4.25及以上版本：[V8_8.4.371.19_0323](https://github.com/puerts/backend-v8/releases/tag/V8_8.4.371.19_0323)
    
    - UE4.24及以下版本：[V8 for ue 4.24 or below](https://github.com/puerts/backend-v8/releases/tag/v8_for_ue424_or_below)
    
* 解压到[YouProject/Plugins/Puerts/ThirdParty](unreal/Puerts/ThirdParty)

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

可以clone puerts的demo，在vs编译工程后拷贝到纯蓝图工程。

### 虚拟机切换

puerts支持多种脚本后端：V8，quickjs，nodejs

* v8提供了纯净的ECMAScript实现
* 对于包大小苛刻的场景，可以选用quickjs
* nodejs相比v8版本，可以使用更多的npm模块，但目前只支持window和mac

quickjs后端[下载](https://github.com/puerts/backend-quickjs)

nodejs后端[下载](https://github.com/puerts/backend-nodejs/releases/tag/NodeJS_220726_2)

解压到[YouProject/Plugins/Puerts/ThirdParty](unreal/Puerts/ThirdParty)

修改[JsEnv.Build.cs](../../unreal/Puerts/Source/JsEnv/JsEnv.Build.cs)，UseQuickjs为true表示用quickjs后端，UseNodejs表示用nodejs后端。