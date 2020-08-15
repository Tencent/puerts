#pragma once

#include "CoreMinimal.h"
#include <functional>
#include <memory>
#include "JSLogger.h"

namespace puerts
{
class JSENV_API JSError
{
public:
    FString Message;
        
    JSError(){}
        
    explicit JSError(const FString& m): Message(m) {}
};
    
//各平台的js环境都实现这个接口
class JSENV_API IJsEngine
{
public:
    /*
    * @description 执行一段js脚本，完成后通过CompletionHander通知，如果执行失败，JSError参数将不为空
    * @param Script: JS脚本内容
    * @param ScripUrl: 一般是脚本的路径，往往虚拟机需要用这信息做调试
    * @param CompletionHander: 完成后通过CompletionHander通知，如果执行失败，JSError参数将不为空
    */
    virtual void ExecuteJavascript(const FString& Script, const FString& ScripUrl, std::function<void(const JSError*)> CompletionHander = nullptr) = 0;

    /*
    * @description 设置消息处理器，js通过类似var ret = sendMessage(msg)发消息，将会调用到MessageHandler，把msg作为参数1传入，MessageHandler的调用结果就是js里sendMessage的返回
    * @param Callback: 消息处理器
    */
    virtual void SetMessageHandler(std::function<FString(const FString&)> MessageHandler) = 0;
        
    virtual void SetLogger(std::shared_ptr<ILogger> Logger) = 0;
        
    virtual void Close() = 0;
        
    virtual ~IJsEngine() {}
};
    
enum class EBackendEngine
{
    Auto = 0,
    WKWebview = 1,
    Javascriptcore = 2,
    V8InThread = 3,
    V8 = 4,
};

JSENV_API std::unique_ptr<IJsEngine> CreateJSEngine(EBackendEngine BackendEngine = EBackendEngine::Auto);

}
