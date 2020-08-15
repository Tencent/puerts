#pragma once

#include <map>
#include <queue>
#include <mutex>
#include <memory>

#include "CoreMinimal.h"
#include "JSEngine.h"
#include "JSModuleLoader.h"

namespace puerts
{
class CallbackPool
{
public:
    explicit CallbackPool(std::shared_ptr<ILogger> InLogger) : Logger(InLogger){}

    int Add(std::function<void(const FString&, const JSError*)> Callback);
        
    void OnFinish(int CallbackId, const FString& Reply);
        
    void OnError(int CallbackId, const JSError* Error);
        
private:
    int AllocedCallbackId;
        
    std::map<int, std::function<void(const FString&, const JSError*)>> Callbacks;
    
    std::mutex Mutex;
    std::shared_ptr<ILogger> Logger;
};

class JSENV_API IScript
{
public:
    virtual void Start(const FString& ModuleName) = 0;

    //oneway request handler
    virtual void RegisterOnewayRequestHandler(const FString& Cmd, std::function<void(const FString&)> Handler) = 0;

    //twoway request handler
    virtual void RegisterRequestHandler(const FString& Cmd, std::function<FString(const FString&)> Handler) = 0;

    //oneway request
    virtual void SendRquest(const FString& Cmd, const FString& Data) = 0;

    //twoway request
    virtual void SendRquest(const FString& Cmd, const FString& Data, std::function<void(const FString&, const JSError*)> Callback) = 0;

    virtual void ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor = nullptr) = 0;

    virtual FString MakeErrorReply(const FString& ErrorMessage) = 0;

    virtual FString MakeReply(const FString& Message) = 0;

    virtual void Close() = 0;

    virtual ~IScript() {}
};

class JSENV_API FJitScript : public IScript
{
public:
    FJitScript();

    FJitScript(std::unique_ptr<IJSModuleLoader> ModuleLoader/* = std::make_unique<DefaultJSModuleLoader>()*/, std::unique_ptr<IJsEngine> JsEnv/* = CreateJSEngine(EBackendEngine::Auto)*/, std::shared_ptr<ILogger> Logger/* = new FDefaultLogger()*/);
        
    FJitScript(const FJitScript& that) = delete;
        
    FJitScript& operator=(const FJitScript& that) = delete;
        
    ~FJitScript() override;
        
    void Log(const FString& Message) const;
    void Info(const FString& Message) const;
    void Warn(const FString& Message) const;
    void Error(const FString& Message) const;
        
    void Start(const FString& ModuleName) override;
        
    //oneway request handler
    void RegisterOnewayRequestHandler(const FString& Cmd, std::function<void(const FString&)> Handler) override;
        
    //twoway request handler
    void RegisterRequestHandler(const FString& Cmd, std::function<FString(const FString&)> Handler) override;
        
    //oneway request
    void SendRquest(const FString& Cmd, const FString& Data) override;
        
    //twoway request
    void SendRquest(const FString& Cmd, const FString& Data, std::function<void(const FString&, const JSError*)> Callback) override;

    FString MakeErrorReply(const FString& ErrorMessage) override;

    FString MakeReply(const FString& Message) override;

    void Close() override;
        
    void ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor = nullptr) override;
        
private:
    void Init();

    FString OnPollRequest(const FString&);
        
    void OnReply(const FString& Reply);
        
    FString LoadBinary(const FString& Path);
        
    FString LoadModule(const FString& Arguments);
        
    void LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath, TArray<uint8>& Data);
        
    FString HandleMessage(const FString& Msg);

    FString HandleMessageInGameThread(const FString& Msg);
        
    void RegisterRequestHandlerImpl(const FString& Cmd, std::function<FString(const FString&)> Handler);
        
private:
    class Request
    {
    public:
        FString Cmd;
        FString Data;
        std::function<void(const FString&, const JSError*)> Callback;
    };
        
private:
    std::unique_ptr<IJSModuleLoader> ModuleLoader;
    std::unique_ptr<IJsEngine> JsEnv;
    std::shared_ptr<ILogger> Logger;
        
    std::map<FString, std::function<FString(const FString&)>> MessageHandlers;
        
    std::queue<Request> RequestQueue;
        
    std::mutex RequestQueueMutex;
        
    CallbackPool RequestCallbackPool;
        
    bool StartModuleCalled;
};
}
