/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JitScript.h"
#include "Misc/Base64.h"
#include "Async/Async.h"

#define MODULE_LAZY_LOAD_TEMPLATE "(function() { puerts.__MODULE_LAZY_LOAD = function(require) { var __filename = '%s', __dirname = '%s', exports ={}, module =  { exports : exports, filename : __filename }; (function (exports, require, console, prompt) { %s\n})(exports, require, puerts.console); return module.exports;}})()"

namespace puerts
{
    int CallbackPool::Add(std::function<void(const FString&, const JSError*)> Callback)
    {
        std::lock_guard<std::mutex> guard(Mutex);
        while(Callbacks.find(AllocedCallbackId) != Callbacks.end())
        {
            ++AllocedCallbackId;
        }
        Callbacks.insert({AllocedCallbackId, Callback});
        return AllocedCallbackId++;
    }

    void CallbackPool::OnFinish(int CallbackId, const FString& Reply)
    {
        std::lock_guard<std::mutex> guard(Mutex);
        auto iter = Callbacks.find(CallbackId);
        if (iter != Callbacks.end())
        {
            auto callback = iter->second;
            Callbacks.erase(iter);
            callback(Reply, nullptr);
        }
        else
        {
            Logger->Error(FString::Printf(TEXT("unexpect callback id:%d"), CallbackId));
        }
    }

    void CallbackPool::OnError(int CallbackId, const JSError* Error)
    {
        std::lock_guard<std::mutex> guard(Mutex);
        auto iter = Callbacks.find(CallbackId);
        if (iter != Callbacks.end())
        {
            auto callback = iter->second;
            Callbacks.erase(iter);
            callback(TEXT(""), Error);
        }
        else
        {
            Logger->Error(FString::Printf(TEXT("unexpect callback id:%d"), CallbackId));
        }
    }

    //FJitScript::FJitScript() : FJitScript(std::make_unique<DefaultJSModuleLoader>(), CreateJSEngine(EBackendEngine::Auto), std::make_shared<FDefaultLogger>())
    //{
    //}

    FJitScript::FJitScript(std::unique_ptr<IJSModuleLoader> InModuleLoader/* = std::make_unique<DefaultJSModuleLoader>()*/, std::unique_ptr<IJsEngine> InJsEnv/* = CreateJSEngine(EBackendEngine::Auto)*/, std::shared_ptr<ILogger> InLogger/* = new FDefaultLogger()*/) : RequestCallbackPool(InLogger)
    {
        ModuleLoader = std::move(InModuleLoader);
        JsEnv = std::move(InJsEnv);
        Logger = InLogger;
        StartModuleCalled = false;

        Init();
    }

    FJitScript::~FJitScript()
    {
    }

    void FJitScript::Close()
    {
        this->JsEnv->Close();
    }
    
    void FJitScript::Init()
    {
        JsEnv->SetMessageHandler(std::bind(&FJitScript::HandleMessage, this, std::placeholders::_1));
        JsEnv->SetLogger(Logger);
        
        RegisterOnewayRequestHandler("log", std::bind(&FJitScript::Log, this, std::placeholders::_1));
        
        RegisterOnewayRequestHandler("info", std::bind(&FJitScript::Info, this, std::placeholders::_1));
        
        RegisterOnewayRequestHandler("warn", std::bind(&FJitScript::Warn, this, std::placeholders::_1));
        
        RegisterOnewayRequestHandler("error", std::bind(&FJitScript::Error, this, std::placeholders::_1));
        
        RegisterRequestHandler("pollRequest", std::bind(&FJitScript::OnPollRequest, this, std::placeholders::_1));
        
        RegisterOnewayRequestHandler("onReply", std::bind(&FJitScript::OnReply, this, std::placeholders::_1));
        
        RegisterRequestHandler("loadBinary", std::bind(&FJitScript::LoadBinary, this, std::placeholders::_1));
        
        RegisterRequestHandler("loadModule", std::bind(&FJitScript::LoadModule, this, std::placeholders::_1));

        ExecuteModule("puerts/polyfill.js");
        ExecuteModule("puerts/message.js");
        ExecuteModule("puerts/log.js");
        ExecuteModule("puerts/modular.js");
    }
    
    void FJitScript::Start(const FString& ModuleName)
    {
        if (StartModuleCalled)
        {
            Error("Call TGameJS::Start more than once!");
            return;
        }
        ExecuteModule(ModuleName, [](const FString& Script, const FString& Path)
        {
            auto PathInJs = Path.Replace(TEXT("\\"), TEXT("\\\\"));
            auto DirInJs = FPaths::GetPath(Path).Replace(TEXT("\\"), TEXT("\\\\"));
            return FString::Printf(TEXT("(function() { var __filename = '%s', __dirname = '%s', exports ={}, module =  { exports : exports, filename : __filename }; (function (exports, require, console, prompt) { %s\n})(exports, puerts.genRequire('%s'), puerts.console);})()"), *PathInJs, *DirInJs, *Script, *DirInJs);
        });
        StartModuleCalled = true;
    }
    
    void FJitScript::ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor)
    {
        FString OutPath;
        FString DebugPath;
        TArray<uint8> Data;
        
        try
        {
            LoadFile(TEXT(""), ModuleName, OutPath, DebugPath, Data);
        }
        catch (const JSError& Err)
        {
            Error(Err.Message);
            return;
        }
        
        FString Script;
        FFileHelper::BufferToString(Script, Data.GetData(), Data.Num());
        //UE_LOG(JSMessge, Log, TEXT("script:%s"), *(Preprocessor ? Preprocessor(script, path): script));
        JsEnv->ExecuteJavascript(Preprocessor ? Preprocessor(Script, OutPath): Script, DebugPath, [ModuleName, this](const puerts::JSError* jsError) {
            if (jsError)
            {
                Error(FString::Printf(TEXT("module[%s] execute fail: %s"),  *ModuleName, *(jsError->Message)));
            }
            else
            {
                Info(FString::Printf(TEXT("module[%s] executed"), *ModuleName));
            }
        });
    }

    FString FJitScript::OnPollRequest(const FString&)
    {
        std::lock_guard<std::mutex> guard(RequestQueueMutex);
        if (RequestQueue.empty())
        {
            return TEXT("");
        }
        else
        {
            auto req = RequestQueue.front();
            RequestQueue.pop();
            if (req.Callback)
            {
                auto Id = RequestCallbackPool.Add(req.Callback);
                return FString::Printf(TEXT("%d#%s#%s"), Id, *(req.Cmd), *(req.Data));
            }
            else
            {
                return FString::Printf(TEXT("#%s#%s"), *(req.Cmd), *(req.Data));
            }
        }
    }

    void FJitScript::OnReply(const FString& Reply)
    {
        int pos;
        if (Reply.FindChar('#', pos))
        {
            FString RpyIDStr = Reply.Mid(0, pos);
            FString Message = Reply.Mid(pos + 1);
            int RpyId = FCString::Atoi(*RpyIDStr);
            //UE_LOG(JSMessge, Log, TEXT("ID:%d, Msg:%s"), RpyID, *Message);
            if (Message[0] == '#') // reply
            {
                RequestCallbackPool.OnFinish(RpyId, Message.Mid(1));
            }
            else
            {
                JSError Err(Message);
                RequestCallbackPool.OnError(RpyId, &Err);
            }
        }
    }

    void FJitScript::LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath, TArray<uint8>& Data)
    {
        if (ModuleLoader->Search(RequiringDir, ModuleName, OutPath, OutDebugPath)) {
            if (!ModuleLoader->Load(OutPath, Data))
            {
                throw JSError(FString::Printf(TEXT("can not load [%s]"), *ModuleName));
            }
        } else {
            throw JSError(FString::Printf(TEXT("can not find [%s]"), *ModuleName));
        }
    }

    FString FJitScript::LoadBinary(const FString& Path)
    {
        FString OutPath;
        FString OutDebugPath;
        TArray<uint8> Data;
        LoadFile(TEXT(""), Path, OutPath, OutDebugPath, Data);
        return FBase64::Encode(Data);
    }
    
    FString FJitScript::LoadModule(const FString& Arguments)
    {
        int32 Pos;
        if (!Arguments.FindChar('#', Pos))
        {
            throw JSError(TEXT("invalid message for loadModule"));
        }
        FString ModuleName = Arguments.Mid(0, Pos);
        FString RequiringDir = Arguments.Mid(Pos + 1);
        
        FString OutPath;
        FString OutDebugPath;
        TArray<uint8> Data;
        LoadFile(RequiringDir, ModuleName, OutPath, OutDebugPath, Data);
        FString Script;
        FFileHelper::BufferToString(Script, Data.GetData(), Data.Num());
        
        return FString::Printf(TEXT("%s\n%s\n%s"), *OutPath, *OutDebugPath, *Script);
    }
    
    void FJitScript::SendRquest(const FString& Cmd, const FString& Data)
    {
        SendRquest(Cmd, Data, nullptr);
    }
    
    void FJitScript::SendRquest(const FString& Cmd, const FString& Data, std::function<void(const FString&, const JSError*)> Callback)
    {
        RequestQueue.push({Cmd, Data, Callback});
    }
    
    void FJitScript::RegisterRequestHandlerImpl(const FString& Cmd, std::function<FString(const FString&)> Handler)
    {
        if (!Handler)
        {
            Error(TEXT("Handler invalid!"));
            return;
        }
        if (MessageHandlers.find(Cmd) != MessageHandlers.end())
        {
            Error(FString::Printf(TEXT("Cmd[%s] register yet!"), *Cmd));
            return;
        }
        MessageHandlers.insert({Cmd, Handler});
    }
    
    void FJitScript::RegisterOnewayRequestHandler(const FString& Cmd, std::function<void(const FString&)> Handler)
    {
        RegisterRequestHandlerImpl(Cmd, [Handler](const FString& Message){
            try
            {
                Handler(Message);
            }
            catch (const JSError& /* Error */)
            {
            }
            return TEXT("");
        });
    }
    
    void FJitScript::RegisterRequestHandler(const FString& Cmd, std::function<FString(const FString&)> Handler)
    {
        RegisterRequestHandlerImpl(Cmd, [this, Handler](const FString& Message){
            try
            {
                return MakeReply(Handler(Message));
            }
            catch (const JSError& Error)
            {
                return MakeErrorReply(Error.Message);
            }
        });
    }

    FString FJitScript::HandleMessageInGameThread(const FString& Msg)
    {
        if (IsInGameThread())
        {
            return HandleMessage(Msg);
        }
        else
        {
            TPromise<FString> Promise;
            TFuture<FString> Future = Promise.GetFuture();
            AsyncTask(ENamedThreads::GameThread, [this, &Promise, &Msg]()
            {
                Promise.SetValue(HandleMessage(Msg));
            });
            return Future.Get();
        }
    }
    
    FString FJitScript::HandleMessage(const FString& RawMsg)
    {
        int pos;
        if (RawMsg.FindChar('#', pos))
        {
            FString Cmd = RawMsg.Mid(0, pos);
            FString Message = RawMsg.Mid(pos + 1);
            //UE_LOG(JSMessge, Log, TEXT("cmd:[%s]"), *cmd);
            //UE_LOG(JSMessge, Log, TEXT("data:[%s]"), *data);
            
            auto handler = MessageHandlers.find(Cmd);
            if (handler != MessageHandlers.end())
            {
                return handler->second(Message);
            }
            else
            {
                //UE_LOG(JSMessge, Error, TEXT("can not find cmd handler for: %s "), *Cmd);
                return MakeErrorReply(TEXT("can not find cmd handler for:") + Cmd);
            }
        }
        else
        {
            //UE_LOG(JSMessge, Error, TEXT("invalid js message:[%s]"), *RawMsg);
            return MakeErrorReply(TEXT("invalid js message:") + RawMsg);
        }
        
    }
    
    FString FJitScript::MakeErrorReply(const FString& ErrorMessage)
    {
        return ErrorMessage.Replace(TEXT("#"), TEXT(""));
    }
    
    FString FJitScript::MakeReply(const FString& Message)
    {
        return "#" + Message;
    }
    
    void FJitScript::Log(const FString& Message) const
    {
        Logger->Log(Message);
    }
    
    void FJitScript::Info(const FString& Message) const
    {
        Logger->Info(Message);
    }
    
    void FJitScript::Warn(const FString& Message) const
    {
        Logger->Warn(Message);
    }
    
    void FJitScript::Error(const FString& Message) const
    {
        Logger->Error(Message);
    }
}

