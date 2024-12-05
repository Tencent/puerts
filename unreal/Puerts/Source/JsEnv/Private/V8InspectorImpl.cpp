/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// TODO: 静态库11.8 window调试崩溃

#if defined(UE_GAME) || defined(UE_EDITOR) || defined(UE_SERVER) || defined(USING_IN_UNREAL_ENGINE)
#define USING_UE 1
#else
#define USING_UE 0
#endif

#if (PLATFORM_WINDOWS || PLATFORM_MAC || PLATFORM_LINUX || defined(WITH_INSPECTOR)) && !defined(WITHOUT_INSPECTOR)

#include "V8InspectorImpl.h"

#if USING_UE
#include "UECompatible.h"
#endif

#include <functional>
#include <string>
#include <locale>
#include <codecvt>

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push)
#if defined(_MSC_VER)
#pragma warning(disable : 4251)
#endif
#include "v8.h"
#include "v8-inspector.h"
#include "libplatform/libplatform.h"
#pragma warning(pop)

#define ASIO_NO_TYPEID    // UE需避免使用RTTI功能

#define ASIO_STANDALONE
#define _WEBSOCKETPP_CPP11_TYPE_TRAITS_
#include "websocketpp/config/asio_no_tls.hpp"
#include "websocketpp/server.hpp"
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#if USING_UE
#include "Containers/Ticker.h"
#else
#include "Log.h"
#endif

#if USING_UE
DEFINE_LOG_CATEGORY_STATIC(LogV8Inspector, Log, All);
#endif

namespace PUERTS_NAMESPACE
{
class V8InspectorChannelImpl : public v8_inspector::V8Inspector::Channel, public V8InspectorChannel
{
public:
    V8InspectorChannelImpl(v8::Isolate* InIsolate, v8_inspector::V8Inspector* InV8Inspector, const int32_t InCxtGroupID);

    void DispatchProtocolMessage(const std::string& Message) override;

    void OnMessage(std::function<void(const std::string&)> Handler) override;

    virtual ~V8InspectorChannelImpl() override
    {
        OnSendMessage = nullptr;
    }

private:
    void SendMessage(v8_inspector::StringBuffer& MessageBuffer);

    void sendResponse(int CallID, std::unique_ptr<v8_inspector::StringBuffer> Message) override;

    void sendNotification(std::unique_ptr<v8_inspector::StringBuffer> Message) override;

    void flushProtocolNotifications() override
    {
    }

    std::unique_ptr<v8_inspector::V8InspectorSession> V8InspectorSession;

    std::function<void(const std::string&)> OnSendMessage;

    v8::Isolate* Isolate;
};

V8InspectorChannelImpl::V8InspectorChannelImpl(
    v8::Isolate* InIsolate, v8_inspector::V8Inspector* InV8Inspector, const int32_t InCxtGroupID)
{
    v8_inspector::StringView DummyState;
    Isolate = InIsolate;
#if V8_MAJOR_VERSION >= 10
    V8InspectorSession = InV8Inspector->connect(InCxtGroupID, this, DummyState, v8_inspector::V8Inspector::kFullyTrusted);
#else
    V8InspectorSession = InV8Inspector->connect(InCxtGroupID, this, DummyState);
#endif
}

void V8InspectorChannelImpl::DispatchProtocolMessage(const std::string& Message)
{
    const auto MessagePtr = reinterpret_cast<const uint8_t*>(Message.c_str());
    const auto MessageLen = (size_t) Message.length();

    v8_inspector::StringView StringView(MessagePtr, MessageLen);

#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::SealHandleScope HandleScope(Isolate);
    V8InspectorSession->dispatchProtocolMessage(StringView);
}

void V8InspectorChannelImpl::OnMessage(std::function<void(const std::string&)> Handler)
{
    OnSendMessage = Handler;
}

void V8InspectorChannelImpl::SendMessage(v8_inspector::StringBuffer& MessageBuffer)
{
    v8_inspector::StringView MessageView = MessageBuffer.string();

    std::string Message;
    if (MessageView.is8Bit())
    {
        Message = reinterpret_cast<const char*>(MessageView.characters8());
    }
    else
    {
#if PLATFORM_WINDOWS
#pragma warning(disable : 4996)
        std::wstring_convert<std::codecvt_utf8_utf16<uint16_t>, uint16_t> Conv;
        const uint16_t* Start = MessageView.characters16();
#else
        std::wstring_convert<std::codecvt_utf8_utf16<char16_t>, char16_t> Conv;
        const char16_t* Start = reinterpret_cast<const char16_t*>(MessageView.characters16());
#endif
        Message = Conv.to_bytes(Start, Start + MessageView.length());
    }

    if (OnSendMessage)
        OnSendMessage(Message);
}

void V8InspectorChannelImpl::sendResponse(int /* CallID */, std::unique_ptr<v8_inspector::StringBuffer> Message)
{
    SendMessage(*Message);
}

void V8InspectorChannelImpl::sendNotification(std::unique_ptr<v8_inspector::StringBuffer> Message)
{
    SendMessage(*Message);
}

class V8InspectorClientImpl : public V8Inspector,
#if USING_UE
#if ENGINE_MAJOR_VERSION >= 5
                              public FTSTickerObjectBase,
#else
                              public FTickerObjectBase,
#endif
#endif
                              public v8_inspector::V8InspectorClient
{
public:
    using wspp_server = websocketpp::server<websocketpp::config::asio>;

    using wspp_connection_hdl = websocketpp::connection_hdl;

    using wspp_message_ptr = wspp_server::message_ptr;

    using wspp_exception = websocketpp::exception;

    V8InspectorClientImpl(int32_t InPort, v8::Local<v8::Context> InContext);

    virtual ~V8InspectorClientImpl();

    void Close() override;

#if USING_UE
    bool Tick(float DeltaTime) override;
#else
    bool Tick(float DeltaTime);
#endif

    bool Tick() override;

    V8InspectorChannel* CreateV8InspectorChannel() override;

private:
    void OnHTTP(wspp_connection_hdl Handle);

    void OnOpen(wspp_connection_hdl Handle);

    void OnReceiveMessage(wspp_connection_hdl Handle, wspp_message_ptr Message);

    void OnSendMessage(wspp_connection_hdl Handle, const std::string& Message);

    void OnClose(wspp_connection_hdl Handle);

    void OnFail(wspp_connection_hdl Handle);

    void runMessageLoopOnPause(int ContextGroupId) override;

    void quitMessageLoopOnPause() override;

    void runIfWaitingForDebugger(int ContextGroupId) override
    {
        Connected = true;
    }

    v8::Isolate* Isolate;

    v8::Persistent<v8::Context> Context;

    v8::Persistent<v8::Function> MicroTasksRunner;

    int32_t Port;

#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8_inspector::V8Inspector* V8Inspector;
#else
    std::unique_ptr<v8_inspector::V8Inspector> V8Inspector;
#endif

    int32_t CtxGroupID;

    std::map<void*, V8InspectorChannelImpl*> V8InspectorChannels;

    wspp_server Server;

    std::string JSONVersion;

    std::string JSONList;

    bool IsAlive;

    bool IsPaused;

    bool Connected;
};

#if USING_UE
void ReportException(const websocketpp::exception& Exception, const TCHAR* JobInfo)
{
#if PLATFORM_WINDOWS
    int len = MultiByteToWideChar(CP_ACP, 0, Exception.what(), -1, NULL, 0);
    wchar_t* wstr = new wchar_t[len + 1];
    memset(wstr, 0, len + 1);
    MultiByteToWideChar(CP_ACP, 0, Exception.what(), -1, wstr, len);
    len = WideCharToMultiByte(CP_UTF8, 0, wstr, -1, NULL, 0, NULL, NULL);
    char* str = new char[len + 1];
    memset(str, 0, len + 1);
    WideCharToMultiByte(CP_UTF8, 0, wstr, -1, str, len, NULL, NULL);
    delete[] wstr;
    UE_LOG(LogV8Inspector, Warning, TEXT("%s, errno:%d, message:%s"), JobInfo, Exception.code().value(), UTF8_TO_TCHAR(str));
    delete[] str;
#else
    UE_LOG(LogV8Inspector, Warning, TEXT("%s, errno:%d, message:%s"), JobInfo, Exception.code().value(),
        ANSI_TO_TCHAR(Exception.what()));
#endif
}
#endif

void MicroTasksRunnerFunction(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    // throw an error so the v8 will clean pending exception later
    Info.GetIsolate()->ThrowException(
        v8::Exception::Error(v8::String::NewFromUtf8(Info.GetIsolate(), "test", v8::NewStringType::kNormal).ToLocalChecked()));
}

V8InspectorClientImpl::V8InspectorClientImpl(int32_t InPort, v8::Local<v8::Context> InContext)
#if USING_UE
#if ENGINE_MAJOR_VERSION >= 5
    : FTSTickerObjectBase(0.001f)
#else
    : FTickerObjectBase(0.001f)
#endif
#endif
{
    Isolate = InContext->GetIsolate();
    Context.Reset(Isolate, InContext);
    MicroTasksRunner.Reset(
        Isolate, v8::FunctionTemplate::New(Isolate, MicroTasksRunnerFunction)->GetFunction(InContext).ToLocalChecked());
    Port = InPort;
    IsAlive = false;
    Connected = false;

    static int32_t CurrentCtxGroupID = 1;
    CtxGroupID = CurrentCtxGroupID++;
    const uint8_t CtxNameConst[] = "V8InspectorContext";
    v8_inspector::StringView CtxName(CtxNameConst, sizeof(CtxNameConst) - 1);
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    V8Inspector = V8Inspector_Create_Without_Stl(Isolate, this);
#else
    V8Inspector = v8_inspector::V8Inspector::create(Isolate, this);
#endif
    V8Inspector->contextCreated(v8_inspector::V8ContextInfo(InContext, CtxGroupID, CtxName));

    if (Port < 0)
        return;

    try
    {
        Server.set_reuse_addr(true);
        Server.set_access_channels(websocketpp::log::alevel::none);
        Server.set_error_channels(websocketpp::log::elevel::none);

        Server.set_http_handler(std::bind(&V8InspectorClientImpl::OnHTTP, this, std::placeholders::_1));
        Server.set_open_handler(std::bind(&V8InspectorClientImpl::OnOpen, this, std::placeholders::_1));
        Server.set_message_handler(
            std::bind(&V8InspectorClientImpl::OnReceiveMessage, this, std::placeholders::_1, std::placeholders::_2));
        Server.set_close_handler(std::bind(&V8InspectorClientImpl::OnClose, this, std::placeholders::_1));
        Server.set_fail_handler(std::bind(&V8InspectorClientImpl::OnFail, this, std::placeholders::_1));

        Server.init_asio();
        Server.listen(Port);
        Server.start_accept();

        JSONVersion = R"({
        "Browser": "Puerts/v1.0.0",
        "Protocol-Version": "1.1"
        })";

        JSONList = R"([{
        "description": "Puerts Inspector",
        "id": "0",
        "title": "Puerts Inspector",
        "type": "node",
        )";
        JSONList += "\"webSocketDebuggerUrl\"";
        JSONList += ":";
        JSONList += "\"ws://127.0.0.1:";
        JSONList += std::to_string(Port) + "\"\r\n}]";

        IsAlive = true;

#if USING_UE
        FString InspectorUrl =
            FString::Printf(TEXT("devtools://devtools/bundled/inspector.html?v8only=true&ws=127.0.0.1:%d"), Port);
        UE_LOG(LogV8Inspector, Log,
            TEXT("Startup Inspector Successfully!\n"
                 "Please Open This URL in Debugger Front-End(e.g. Chrome DevTool):\n \n"
                 "\t%s\n \n"),
            *InspectorUrl);
#endif
    }
    catch (const websocketpp::exception& Exception)
    {
        IsAlive = false;
#if USING_UE
        ReportException(Exception, TEXT("Failed to Startup Inspector"));
#else
        puerts::PLog(puerts::Error, "V8InspectorClientImpl: %s", Exception.what());
        puerts::PLog(puerts::Error, "Failed to Startup Inspector.");
#endif
    }

    IsPaused = false;
}

V8InspectorChannel* V8InspectorClientImpl::CreateV8InspectorChannel()
{
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    return new V8InspectorChannelImpl(Isolate, V8Inspector, CtxGroupID);
#else
    return new V8InspectorChannelImpl(Isolate, V8Inspector.get(), CtxGroupID);
#endif
}

V8InspectorClientImpl::~V8InspectorClientImpl()
{
    Close();
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8_inspector::V8Inspector_Destroy_Without_Stl(V8Inspector);
#endif
}

void V8InspectorClientImpl::Close()
{
    if (IsAlive)
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        Server.stop_listening();
        for (auto Iter = V8InspectorChannels.begin(); Iter != V8InspectorChannels.end(); ++Iter)
        {
            delete Iter->second;
        }
        V8InspectorChannels.clear();

        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        V8Inspector->contextDestroyed(Context.Get(Isolate));
        IsAlive = false;
        IsPaused = false;
    }
}

bool V8InspectorClientImpl::Tick(float /* DeltaTime */)
{
    try
    {
        if (IsAlive)
        {
#ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
#endif

            {
                // v8::Locker lock(Isolate);
                Server.poll();

                v8::Isolate::Scope IsolateScope(Isolate);
                v8::HandleScope HandleScope(Isolate);
                auto LocalContext = Context.Get(Isolate);
                v8::Context::Scope ContextScope(LocalContext);
                v8::TryCatch TryCatch(Isolate);

                (void) (MicroTasksRunner.Get(Isolate)->Call(LocalContext, LocalContext->Global(), 0, nullptr));
            }
        }
    }
    catch (const wspp_exception& Exception)
    {
#if USING_UE
        ReportException(Exception, TEXT("Tick"));
#else
        puerts::PLog(puerts::Error, "Tick: %s", Exception.what());
#endif
    }
    return true;
}

bool V8InspectorClientImpl::Tick()
{
    Tick(0);
    return IsAlive && Connected;
}

void V8InspectorClientImpl::OnHTTP(wspp_connection_hdl Handle)
{
    try
    {
        auto Connection = Server.get_con_from_hdl(Handle);
        auto Resource = Connection->get_resource();

        if (Resource == "/json" || Resource == "/json/list")
        {
#if USING_UE
            UE_LOG(LogV8Inspector, Display, TEXT("request /json/list"));
#else
            puerts::PLog(puerts::Log, "request /json/list");
#endif
            Connection->set_body(JSONList);
            Connection->set_status(websocketpp::http::status_code::ok);
        }
        else if (Resource == "/json/version")
        {
#if USING_UE
            UE_LOG(LogV8Inspector, Display, TEXT("request /json/version"));
#else
            puerts::PLog(puerts::Log, "request /json/version");
#endif
            Connection->set_body(JSONVersion);
            Connection->set_status(websocketpp::http::status_code::ok);
        }
        else
        {
#if USING_UE
            UE_LOG(LogV8Inspector, Display, TEXT("404 Not Found"));
#else
            puerts::PLog(puerts::Log, "404 Not Found");
#endif
            Connection->set_body("404 Not Found");
            Connection->set_status(websocketpp::http::status_code::not_found);
        }
    }
    catch (const wspp_exception& Exception)
    {
#if USING_UE
        ReportException(Exception, TEXT("OnHTTP"));
#else
        puerts::PLog(puerts::Error, "OnHTTP: %s", Exception.what());
#endif
    }
}

void V8InspectorClientImpl::OnOpen(wspp_connection_hdl Handle)
{
    V8InspectorChannelImpl* channel = static_cast<V8InspectorChannelImpl*>(CreateV8InspectorChannel());
    V8InspectorChannels[Handle.lock().get()] = channel;
    channel->OnMessage(std::bind(&V8InspectorClientImpl::OnSendMessage, this, Handle, std::placeholders::_1));
#if USING_UE
    UE_LOG(LogV8Inspector, Display, TEXT("Inspector: Connect"));
#else
    puerts::PLog(puerts::Log, "Inspector: Connect");
#endif
}

void V8InspectorClientImpl::OnReceiveMessage(wspp_connection_hdl Handle, wspp_message_ptr Message)
{
    //#if USING_UE
    //    UE_LOG(LogV8Inspector, Display, TEXT("<---: %s"), ANSI_TO_TCHAR(Message->get_payload().c_str()));
    //#else
    //    puerts::PLog(puerts::Log, "<---: %s", Message->get_payload().c_str());
    //#endif
    auto channel = V8InspectorChannels[Handle.lock().get()];

    {
        // v8::Locker Locker(Isolate);
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::SealHandleScope scope(Isolate);
        channel->DispatchProtocolMessage(Message->get_payload());
    }
}

void V8InspectorClientImpl::OnSendMessage(wspp_connection_hdl Handle, const std::string& Message)
{
    //#if USING_UE
    //    UE_LOG(LogV8Inspector, Display, TEXT("--->: %s"), ANSI_TO_TCHAR(Message.c_str()));
    //#else
    //    puerts::PLog(puerts::Log, "--->: %s", Message.c_str());
    //#endif

    try
    {
        Server.send(Handle, Message, websocketpp::frame::opcode::TEXT);
    }
    catch (const websocketpp::exception& Exception)
    {
#if USING_UE
        ReportException(Exception, TEXT("OnSendMessage"));
#else
        puerts::PLog(puerts::Error, "OnSendMessage: %s", Exception.what());
#endif
    }
}

void V8InspectorClientImpl::OnClose(wspp_connection_hdl Handle)
{
    void* HandlePtr = Handle.lock().get();
    delete V8InspectorChannels[HandlePtr];
    V8InspectorChannels.erase(HandlePtr);
#if USING_UE
    UE_LOG(LogV8Inspector, Display, TEXT("Inspector: Disconnect"));
#endif
}

void V8InspectorClientImpl::OnFail(wspp_connection_hdl Handle)
{
    wspp_server::connection_ptr con = Server.get_con_from_hdl(Handle);
    std::string message = con->get_ec().message();
#if USING_UE
    UE_LOG(LogV8Inspector, Error, TEXT("Connection OnFail %s"), UTF8_TO_TCHAR(message.c_str()));
#else
    puerts::PLog(puerts::Error, "Connection OnFail %s", message.c_str());
#endif
}

void V8InspectorClientImpl::runMessageLoopOnPause(int /* ContextGroupId */)
{
    if (IsPaused)
    {
        return;
    }

    IsPaused = true;

    while (IsPaused)
    {
        Tick();
    }
}

void V8InspectorClientImpl::quitMessageLoopOnPause()
{
    IsPaused = false;
}

V8Inspector* CreateV8Inspector(int32_t Port, void* InContextPtr)
{
    v8::Local<v8::Context>* ContextPtr = static_cast<v8::Local<v8::Context>*>(InContextPtr);
    return new V8InspectorClientImpl(Port, *ContextPtr);
}
};    // namespace PUERTS_NAMESPACE

#else

#include "V8InspectorImpl.h"

namespace PUERTS_NAMESPACE
{
V8Inspector* CreateV8Inspector(int32_t Port, void* InContextPtr)
{
    return nullptr;
}
};    // namespace PUERTS_NAMESPACE

#endif    // WITH_EDITOR && (PLATFORM_WINDOWS || PLATFORM_MAC)
