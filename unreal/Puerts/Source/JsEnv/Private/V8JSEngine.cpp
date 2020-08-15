/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSEngine.h"

#if PLATFORM_ANDROID || PLATFORM_WINDOWS
#include <map>
#include <string>
#include <algorithm>
#include <functional>

#include "TickerDelegateWrapper.h"

#include "Engine/GameEngine.h"
#include "Containers/Ticker.h"

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "V8InspectorImpl.h"
#include "V8Utils.h"

#if PLATFORM_WINDOWS
#include "Blob/Win64/NativesBlob.h"
#include "Blob/Win64/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM
#include "Blob/Android/armv7a/NativesBlob.h"
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM64
#include "Blob/Android/arm64/NativesBlob.h"
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif PLATFORM_IOS
#include "Blob/iOS/arm64/NativesBlob.h"
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif PLATFORM_MAC
#include "Blob/macOS/NativesBlob.h"
#include "Blob/macOS/SnapshotBlob.h"
#endif

namespace puerts
{
class V8JSEnv: public IJsEngine
{
public:
    V8JSEnv();

    ~V8JSEnv() override;

    void ExecuteJavascript(const FString& Script, const FString& ScripUrl, std::function<void(const JSError*)> CompletionHander = nullptr) override;

    void SetMessageHandler(std::function<FString(const FString&)> MessageHandler) override;

    void Close() override;

    void SetLogger(std::shared_ptr<ILogger> InLogger) override
    {
        Logger = InLogger;
    }

private:
    // 处理JS传递过来的消息，然后将其返回给JS
    void Prompt(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 设置ticker delegate，把delegate handler记录并返回JS
    void SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);
        
    // 把JS传递过来的delegate handler从ticker删除
    void ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // load module
    void Eval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 创建（启动）Inspector。第一个参数为Inspector监听端口（整型）
    void CreateInspector(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 销毁（关闭）Inspector
    void DestroyInspector(const v8::FunctionCallbackInfo<v8::Value>& Info);

private:
    void ReportExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler);

    void ParameterNumException(const v8::FunctionCallbackInfo<v8::Value>& Info, int ValidNum);

    FString GetExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch);

    // 创建ticker delegate。调用者保证Info[0]不为空。第三个参数表示函数是否持续执行
    TBaseDelegate<bool, float> CreateDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, FTickerDelegateWrapper **ReturnValue, bool Continue);

    // 获取delay参数，返回值单位是秒。调用者保证Info[1]不为空
    float GetDelayArg(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 设置定时器，第二个参数表示函数是否持续执行
    void SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue);

    void RemoveFTickerDelegateHandle(FDelegateHandle* Handle);

private:
    v8::Isolate::CreateParams CreateParams;
    
        v8::Isolate* DefaultIsolate;
    
    v8::Global<v8::Context> DefaultContext;

    // 消息处理器
    std::function<FString(const FString&)> MessageHandler;

    // 存放delegate handler and wrapper，在clearInterval或者析构时删除它们
    std::map<FDelegateHandle*, FTickerDelegateWrapper*> HandleContainer;

    V8Inspector* Inspector;

    std::shared_ptr<ILogger> Logger;

    std::shared_ptr<v8::StartupData> NativesBlob;

    std::shared_ptr<v8::StartupData> SnapshotBlob;
};

V8JSEnv::V8JSEnv(): Inspector(nullptr)
{
    if (!NativesBlob)
    {
        NativesBlob = std::make_shared<v8::StartupData>();
        NativesBlob->data = (const char *)NativesBlobCode;
        NativesBlob->raw_size = sizeof(NativesBlobCode);
    }
    if (!SnapshotBlob)
    {
        SnapshotBlob = std::make_shared<v8::StartupData>();
        SnapshotBlob->data = (const char *)SnapshotBlobCode;
        SnapshotBlob->raw_size = sizeof(SnapshotBlobCode);
    }

    // 初始化Isolate和DefaultContext
    v8::V8::SetNativesDataBlob(NativesBlob.get());
    v8::V8::SetSnapshotDataBlob(SnapshotBlob.get());

    CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    DefaultIsolate = v8::Isolate::New(CreateParams);

    v8::Isolate::Scope Isolatescope(DefaultIsolate);
    v8::HandleScope HandleScope(DefaultIsolate);

    v8::Local<v8::Context> Context = v8::Context::New(DefaultIsolate);
    DefaultContext.Reset(DefaultIsolate, Context);

    v8::Context::Scope ContextScope(Context);

    // 写入JS组件
    auto PromptWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->Prompt(Info);
    };
    auto SetIntervalWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->SetInterval(Info);
    };
    auto ClearIntervalWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->ClearInterval(Info);
    };
    auto EvalWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->Eval(Info);
    };
    auto SetTimeoutWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->SetTimeout(Info);
    };
    auto CreateInspectorWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->CreateInspector(Info);
    };
    auto DestroyInspectorWrapper = [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        V8JSEnv* V8JSEnvPtr = reinterpret_cast<V8JSEnv*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        V8JSEnvPtr->DestroyInspector(Info);
    };
    auto This = v8::External::New(DefaultIsolate, this);

    v8::Local<v8::Object> Global = Context->Global();

    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "global"), Global)
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "prompt"), v8::FunctionTemplate::New(DefaultIsolate, PromptWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "setInterval"), v8::FunctionTemplate::New(DefaultIsolate, SetIntervalWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "clearInterval"), v8::FunctionTemplate::New(DefaultIsolate, ClearIntervalWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "__tgjsEvalScript"), v8::FunctionTemplate::New(DefaultIsolate, EvalWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "setTimeout"), v8::FunctionTemplate::New(DefaultIsolate, SetTimeoutWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "clearTimeout"), v8::FunctionTemplate::New(DefaultIsolate, ClearIntervalWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "createInspector"), v8::FunctionTemplate::New(DefaultIsolate, CreateInspectorWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
    Global->Set(Context, FV8Utils::InternalString(DefaultIsolate, "destroyInspector"), v8::FunctionTemplate::New(DefaultIsolate, DestroyInspectorWrapper, This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
}

void V8JSEnv::ExecuteJavascript(const FString& UncompiledScript, const FString& ScripUrl, std::function<void(const JSError*)> CompletionHandler)
{
    v8::Isolate::Scope Isolatescope(DefaultIsolate);
    v8::HandleScope HandleScope(DefaultIsolate);
    auto Context = v8::Local<v8::Context>::New(DefaultIsolate, DefaultContext);
    v8::Context::Scope ContextScope(Context);
    {
        // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
        FString FormattedScriptUrl = ScripUrl.Replace(TEXT("/"), TEXT("\\"));
        v8::Local<v8::String> Name = v8::String::NewFromUtf8(DefaultIsolate,
                                        TCHAR_TO_UTF8(*FormattedScriptUrl),
                                        v8::NewStringType::kNormal).ToLocalChecked();
        v8::ScriptOrigin Origin(Name);
        v8::Local<v8::String> Source = v8::String::NewFromUtf8(DefaultIsolate,
                                        TCHAR_TO_UTF8(*UncompiledScript),
                                        v8::NewStringType::kNormal).ToLocalChecked();
        v8::TryCatch TryCatch(DefaultIsolate);
            
        auto Script = v8::Script::Compile(Context, Source, &Origin);
        if (Script.IsEmpty())
        {
            ReportExecutionException(DefaultIsolate, &TryCatch, CompletionHandler);
            return;
        }
        auto Ret = Script.ToLocalChecked()->Run(Context);
        if (TryCatch.HasCaught())
        {
            ReportExecutionException(DefaultIsolate, &TryCatch, CompletionHandler);
            return;
        }
        // 执行结束要调用该handler
        CompletionHandler(nullptr);
    }
}

void V8JSEnv::SetMessageHandler(std::function<FString(const FString&)> Handler)
{
    MessageHandler = Handler;
}

void V8JSEnv::Close()
{
    MessageHandler = nullptr;

    // TODO - 如果实现多线程，FTicker所在主线程和当前线程释放handle可能有竞争
    for (auto& Pair : HandleContainer)
    {
        // UE_LOG(LogTemp, Warning, TEXT("Delegate handler is valid?: %d"), delegate.handle->IsValid());
        FTicker::GetCoreTicker().RemoveTicker(*(Pair.first));
        delete Pair.first;
        delete Pair.second;
    }
    HandleContainer.clear();

    if (Inspector)
    {
        Inspector->Close();
        Inspector = nullptr;
    }
}

V8JSEnv::~V8JSEnv()
{
    DefaultContext.Reset();
    DefaultIsolate->Dispose();
    DefaultIsolate = nullptr;
    delete CreateParams.array_buffer_allocator;
}

void V8JSEnv::Prompt(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    int ValidNum = 1;
    if (Info.Length() < ValidNum)
    {
        ParameterNumException(Info, ValidNum);
        return;
    }
    if (MessageHandler != nullptr) {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

        v8::String::Utf8Value PromptV8Str(Isolate, Info[0]);
        FString Result = MessageHandler(FString(UTF8_TO_TCHAR(*PromptV8Str)));
        Info.GetReturnValue().Set(FV8Utils::InternalString(Isolate, TCHAR_TO_UTF8(*Result)));
    }
    return;
}

void V8JSEnv::SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    int ValidNum = 2;
    if (Info.Length() < ValidNum)
    {
        ParameterNumException(Info, ValidNum);
        return;
    }
    SetFTickerDelegate(Info, true);
}

void V8JSEnv::ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    int ValidNum = 1;
    if (Info.Length() < ValidNum)
    {
        ParameterNumException(Info, ValidNum);
        return;
    }
    if (!Info[0]->IsExternal()) return;

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    v8::Local<v8::External> External = v8::Local<v8::External>::Cast(Info[0]);
    FDelegateHandle* Handle = static_cast<FDelegateHandle*>(External->Value());
    RemoveFTickerDelegateHandle(Handle);
}

void V8JSEnv::Eval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    int ValidNum = 2;
    if (Info.Length() < ValidNum)
    {
        ParameterNumException(Info, ValidNum);
        return;
    }

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);
    {
        v8::String::Utf8Value ScriptContent(Isolate, Info[0]);
        v8::Local<v8::String> Source = v8::String::NewFromUtf8(Isolate,
            *ScriptContent,
            v8::NewStringType::kNormal).ToLocalChecked();

        v8::String::Utf8Value UrlArg(Isolate, Info[1]);
        FString ScriptUrl = UTF8_TO_TCHAR(*UrlArg);
        // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
        FString FormattedScriptUrl = ScriptUrl.Replace(TEXT("/"), TEXT("\\"));
        v8::Local<v8::String> Name = v8::String::NewFromUtf8(Isolate,
            TCHAR_TO_UTF8(*FormattedScriptUrl),
            v8::NewStringType::kNormal).ToLocalChecked();
        v8::ScriptOrigin Origin(Name);
        auto Script = v8::Script::Compile(Context, Source, &Origin);
        if (Script.IsEmpty())
        {
            return;
        }
        auto Result = Script.ToLocalChecked()->Run(Context);
        if (Result.IsEmpty())
        {
            return;
        }
        Info.GetReturnValue().Set(Result.ToLocalChecked());
    }
}

void V8JSEnv::SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    int ValidNum = 2;
    if (Info.Length() < ValidNum)
    {
        ParameterNumException(Info, ValidNum);
        return;
    }
    SetFTickerDelegate(Info, false);
}

void V8JSEnv::CreateInspector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    int ValidNum = 1;
    if (Info.Length() < ValidNum)
    {
        ParameterNumException(Info, ValidNum);
        Info.GetReturnValue().Set(v8::Boolean::New(Isolate, false));
        return;
    }

    if (Inspector != nullptr)
    {
        Info.GetReturnValue().Set(v8::Boolean::New(Isolate, false));
    }
    else
    {
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        auto PortMaybeLocal = Info[0]->Int32Value(Context);
        if (PortMaybeLocal.IsNothing() || Info[0]->IsInt32() == false)
        {
            Info.GetReturnValue().Set(v8::Boolean::New(Isolate, false));
            return;
        }

        int32_t Port = 0;
        bool Ret = PortMaybeLocal.To(&Port);
        Inspector = CreateV8Inspector(Port, &Context);
        Info.GetReturnValue().Set(v8::Boolean::New(Isolate, (Inspector != nullptr)));
    }
}

void V8JSEnv::DestroyInspector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    if (Inspector != nullptr)
    {
        Inspector->Close();
        Inspector = nullptr;
    }
};

void V8JSEnv::ReportExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler)
{
    const JSError Error(GetExecutionException(Isolate, TryCatch));
    if (CompletionHandler)
    {
        CompletionHandler(&Error);
    }
}

void V8JSEnv::ParameterNumException(const v8::FunctionCallbackInfo<v8::Value>& Info, int ValidNum)
{
    FString Message;
    Message.Append("Bad parameters, the function needs ").Append(FString::FromInt(ValidNum))
        .Append(" parameters, but ").Append(FString::FromInt(Info.Length()))
        .Append(" parameters provided.");
    auto ExceptionStr = v8::String::NewFromUtf8(Info.GetIsolate(),
        TCHAR_TO_ANSI(*Message),
        v8::NewStringType::kNormal).ToLocalChecked();
    Info.GetIsolate()->ThrowException(ExceptionStr);
}

FString V8JSEnv::GetExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch)
{
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::String::Utf8Value Exception(Isolate, TryCatch->Exception());
    FString ExceptionStr(*Exception);
    v8::Local<v8::Message> Message = TryCatch->Message();
    if (Message.IsEmpty())
    {
        // 如果没有提供更详细的信息，直接输出Exception
        return ExceptionStr;
    }
    else
    {
        v8::Local<v8::Context> Context(Isolate->GetCurrentContext());

        // 输出 (filename):(line number): (message).
        v8::String::Utf8Value FileName(Isolate, Message->GetScriptOrigin().ResourceName());
        int LineNum = Message->GetLineNumber(Context).FromJust();
        FString FileNameStr(*FileName);
        FString LineNumStr = FString::FromInt(LineNum);
        FString FileInfoStr;
        FileInfoStr.Append(FileNameStr).Append(":").Append(LineNumStr).Append(": ").Append(ExceptionStr);

        FString FinalReport;
        FinalReport.Append(FileInfoStr).Append("\n");

        // 输出错误的一行源码
        v8::String::Utf8Value SourceLine(Isolate, Message->GetSourceLine(Context).ToLocalChecked());
        FString SourceLineStr(*SourceLine);

        FinalReport.Append(SourceLineStr).Append("\n");

        // 输出波浪下划线
        FString WavyUnderlineStr;
        int Start = Message->GetStartColumn(Context).FromJust();
        for (int Index = 0; Index < Start; Index++) {
            WavyUnderlineStr.Append(" ");
        }
        int End = Message->GetEndColumn(Context).FromJust();
        for (int Index = Start; Index < End; Index++) {
            WavyUnderlineStr.Append("^");
        }

        FinalReport.Append(WavyUnderlineStr);

        // 输出调用栈信息
        v8::Local<v8::Value> StackTrace;
        if (TryCatch->StackTrace(Context).ToLocal(&StackTrace) &&
            StackTrace->IsString() &&
            v8::Local<v8::String>::Cast(StackTrace)->Length() > 0)
        {
            v8::String::Utf8Value StackTraceVal(Isolate, StackTrace);
            FString StackTraceStr(*StackTraceVal);
            FinalReport.Append("\n").Append(StackTraceStr);
        }
        return FinalReport;
    }
}

TBaseDelegate<bool, float> V8JSEnv::CreateDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, FTickerDelegateWrapper **ReturnValue, bool Continue)
{
    FTickerDelegateWrapper* DelegateWrapper = new FTickerDelegateWrapper(Continue);
    *ReturnValue = DelegateWrapper;

    using std::placeholders::_1;
    using std::placeholders::_2;
    std::function<void(const JSError*, std::shared_ptr<ILogger>&)> LogWrapper = [](const JSError* Exception, std::shared_ptr<ILogger>& Log)
    {
        FString Message = FString::Printf(TEXT("JS Execution Exception: %s"), *(Exception->Message));
        Log->Warn(Message);
    };
    std::function<void(const JSError*)> ReportExecutionExceptionWrapper = std::bind(LogWrapper, _1, Logger);
    std::function<void(v8::Isolate*, v8::TryCatch*)> ExecutionExceptionHandler = 
        std::bind(&V8JSEnv::ReportExecutionException, this, _1, _2, ReportExecutionExceptionWrapper);
    std::function<void(FDelegateHandle*)> DelegateHandleCleaner =
        std::bind(&V8JSEnv::RemoveFTickerDelegateHandle, this, _1);
    DelegateWrapper->Init(Info, ExecutionExceptionHandler, DelegateHandleCleaner);

    return TBaseDelegate<bool, float>::CreateRaw(DelegateWrapper, &FTickerDelegateWrapper::CallFunction);
}

float V8JSEnv::GetDelayArg(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    int Millisecond = Info[1]->Int32Value(Context).ToChecked();
    return Millisecond / 1000.f;
}

void V8JSEnv::SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue)
{
    FTickerDelegateWrapper* DelegateWrapper;
    FTickerDelegate Delegate = CreateDelegate(Info, &DelegateWrapper, Continue);
    float Delay = GetDelayArg(Info);
    // TODO - 如果实现多线程，这里应该加锁阻止定时回调的执行，直到DelegateWrapper设置好handle
    FDelegateHandle* DelegateHandle = new FDelegateHandle(FTicker::GetCoreTicker().AddTicker(Delegate, Delay));
    DelegateWrapper->SetDelegateHandle(DelegateHandle);

    Info.GetReturnValue().Set(v8::Local<v8::External>::New(
        Info.GetIsolate(),
        v8::External::New(Info.GetIsolate(), DelegateHandle)));

    HandleContainer[DelegateHandle] = DelegateWrapper;
}

void V8JSEnv::RemoveFTickerDelegateHandle(FDelegateHandle* Handle)
{
    // TODO - 如果实现多线程，FTicker所在主线程和当前线程释放handle可能有竞争
    auto Iterator = std::find_if(HandleContainer.begin(), HandleContainer.end(), [&](auto& Pair) {
        return Pair.first == Handle;
    });
    if (Iterator != HandleContainer.end())
    {
        FTicker::GetCoreTicker().RemoveTicker(*(Iterator->first));
        delete Iterator->first;
        delete Iterator->second;
        HandleContainer.erase(Iterator);
    }
}

std::unique_ptr<IJsEngine> CreateJSEngine(EBackendEngine BackendEngine)
{
    if (BackendEngine == EBackendEngine::Auto || BackendEngine == EBackendEngine::V8)
    {
        return std::make_unique<V8JSEnv>();;
    }
    else
    {
        throw JSError("No supported in this platform!");
    }
        
}
};

#endif  // PLATFORM_ANDROID || PLATFORM_WINDOWS 
