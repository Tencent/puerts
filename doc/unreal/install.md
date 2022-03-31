### 源码安装方式

* git clone https://github.com/Tencent/puerts.git

* 拷贝puerts/unreal下的Puerts目录到您项目的Plugins目录下，可以参考[unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)

* 下载v8

    - UE4.25及以上版本：[V8_8.4.371.19_0323](https://github.com/puerts/backend-v8/releases/tag/V8_8.4.371.19_0323)
    
    - UE4.24及以下版本：[V8_9.6.180.15_0330](https://github.com/puerts/backend-v8/releases/tag/v8_for_ue424_or_below)
    
* 解压到[YouProject/Plugins/Puerts/ThirdParty](unreal/Puerts/ThirdParty)

### 虚拟机切换

puerts支持多种脚本后端：V8，quickjs，nodejs

* v8提供了纯净的ECMAScript实现
* 对于包大小苛刻的场景，可以选用quickjs
* nodejs相比v8版本，可以使用更多的npm模块，但目前只支持window和mac

quickjs后端[下载](https://github.com/puerts/backend-quickjs)

nodejs后端[下载](https://github.com/puerts/backend-nodejs/releases/tag/NodeJS_0329)

解压到[YouProject/Plugins/Puerts/ThirdParty](unreal/Puerts/ThirdParty)

修改[JsEnv.Build.cs](../../unreal/Puerts/Source/JsEnv/JsEnv.Build.cs)，UseQuickjs为true表示用quickjs后端，UseNodejs表示用nodejs后端。