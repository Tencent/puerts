/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if defined(UE_GAME) || defined(UE_EDITOR)
#define USING_UE 1
#else
#define USING_UE 0
#endif

#if (PLATFORM_WINDOWS || PLATFORM_MAC || WITH_INSPECTOR) && !WITHOUT_INSPECTOR

#include "V8InspectorImpl.h"

#include <functional>
#include <string> 
#include <locale> 
#include <codecvt> 

#pragma warning(push)
#pragma warning( disable : 4251 )
#include "v8.h"
#include "v8-inspector.h"
#include "libplatform/libplatform.h"
#pragma warning(pop)

#define ASIO_NO_TYPEID  // UE需避免使用RTTI功能

#define ASIO_STANDALONE
#define _WEBSOCKETPP_CPP11_TYPE_TRAITS_
#include "websocketpp/config/asio_no_tls.hpp"
#include "websocketpp/server.hpp"

#if USING_UE
#include "Containers/Ticker.h"
#else
#include "Log.h"
#endif

#if USING_UE
DEFINE_LOG_CATEGORY_STATIC(LogV8Inspector, Log, All);
#endif

namespace puerts
{
class V8InspectorChannelImpl : public v8_inspector::V8Inspector::Channel
{
public:
    V8InspectorChannelImpl(const std::unique_ptr<v8_inspector::V8Inspector>& InV8Inspector, const int32_t InCxtGroupID, v8::Isolate* InIsolate);

    void ReceiveMessage(const std::string& Message);

    std::function<void(const std::string&)> OnSendMessage;

private:
    void SendMessage(v8_inspector::StringBuffer& MessageBuffer);

    void sendResponse(int CallID, std::unique_ptr<v8_inspector::StringBuffer> Message) override;

    void sendNotification(std::unique_ptr<v8_inspector::StringBuffer> Message) override;

    void flushProtocolNotifications() override {}

    std::unique_ptr<v8_inspector::V8InspectorSession> V8InspectorSession;

    v8::Isolate* Isolate;
};

V8InspectorChannelImpl::V8InspectorChannelImpl(const std::unique_ptr<v8_inspector::V8Inspector>& InV8Inspector, const int32_t InCxtGroupID, v8::Isolate* InIsolate)
{
    Isolate = InIsolate;

    v8_inspector::StringView DummyState;
    V8InspectorSession = InV8Inspector->connect(InCxtGroupID, this, DummyState);
}

void V8InspectorChannelImpl::ReceiveMessage(const std::string& Message)
{
    const auto MessagePtr = reinterpret_cast<const uint8_t*>(Message.c_str());
    const auto MessageLen = (size_t)Message.length();

    v8_inspector::StringView StringView(MessagePtr, MessageLen);
    V8InspectorSession->dispatchProtocolMessage(StringView);
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
    public FTickerObjectBase, 
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

private:
    void OnHTTP(wspp_connection_hdl Handle);

    void OnOpen(wspp_connection_hdl Handle);

    void OnReceiveMessage(wspp_connection_hdl Handle, wspp_message_ptr Message);

    void OnSendMessage(wspp_connection_hdl Handle, const std::string& Message);

    void OnClose(wspp_connection_hdl Handle);

    void OnFail(wspp_connection_hdl Handle);

    void runMessageLoopOnPause(int ContextGroupId) override;

    void quitMessageLoopOnPause() override;

    void runIfWaitingForDebugger(int ContextGroupId) override {
        Connected = true;
    }

    v8::Isolate* Isolate;

    v8::Persistent<v8::Context> Context;

    int32_t Port;

    std::unique_ptr<v8_inspector::V8Inspector> V8Inspector;

    int32_t CtxGroupID;
        
    std::unique_ptr<V8InspectorChannelImpl> V8InspectorChannel;

    wspp_server Server;

    std::string JSONVersion;

    std::string JSONList;

    bool IsAlive;

    bool IsPaused;

    bool Connected;
};

V8InspectorClientImpl::V8InspectorClientImpl(int32_t InPort, v8::Local<v8::Context> InContext)
#if USING_UE
    : FTickerObjectBase(0.001f)
#endif
{
    Isolate = InContext->GetIsolate();
    Context.Reset(Isolate, InContext);
    Port = InPort;
    IsAlive = false;
    Connected = false;

    CtxGroupID = 1;
    const uint8_t CtxNameConst[] = "V8InspectorContext";
    v8_inspector::StringView CtxName(CtxNameConst, sizeof(CtxNameConst) - 1);
    V8Inspector = v8_inspector::V8Inspector::create(Isolate, this);
    V8Inspector->contextCreated(v8_inspector::V8ContextInfo(InContext, CtxGroupID, CtxName));

    try
    {
        Server.set_access_channels(websocketpp::log::alevel::none);
        Server.set_error_channels(websocketpp::log::elevel::none);

        Server.set_http_handler(std::bind(&V8InspectorClientImpl::OnHTTP, this, std::placeholders::_1));
        Server.set_open_handler(std::bind(&V8InspectorClientImpl::OnOpen, this, std::placeholders::_1));
        Server.set_message_handler(std::bind(&V8InspectorClientImpl::OnReceiveMessage, this, std::placeholders::_1, std::placeholders::_2));
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
        FString InspectorUrl = FString::Printf(TEXT("devtools://devtools/bundled/inspector.html?v8only=true&ws=127.0.0.1:%d"), Port);
        UE_LOG(LogV8Inspector, Log, TEXT("Startup Inspector Successfully!\n"
            "Please Open This URL in Debugger Front-End(e.g. Chrome DevTool):\n \n"
            "\t%s\n \n"), *InspectorUrl);
#endif
    }
    catch (const websocketpp::exception& Exception)
    {
        IsAlive = false;
#if USING_UE
        UE_LOG(LogV8Inspector, Error, TEXT("V8InspectorClientImpl: %s"), ANSI_TO_TCHAR(Exception.what()));
        UE_LOG(LogV8Inspector, Error, TEXT("Failed to Startup Inspector."));
#else
        PLog(Error, "V8InspectorClientImpl: %s", Exception.what());
        PLog(Error, "Failed to Startup Inspector.");
#endif
    }

    IsPaused = false;
}

V8InspectorClientImpl::~V8InspectorClientImpl()
{
    Close();
}

void V8InspectorClientImpl::Close()
{
    if (IsAlive)
    {
        Server.stop_listening();
        V8InspectorChannel.reset();

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
            Server.poll();
        }
    }
    catch (const wspp_exception& Exception)
    {
#if USING_UE
        // TODO - 解决乱码问题（疑似utf8编解码问题）
        UE_LOG(LogV8Inspector, Error, TEXT("Tick: %s"), ANSI_TO_TCHAR(Exception.what()));
#else
        PLog(Error, "Tick: %s", Exception.what());
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
            PLog(Log, "request /json/list");
#endif
            Connection->set_body(JSONList);
            Connection->set_status(websocketpp::http::status_code::ok);
        }
        else if (Resource == "/json/version")
        {
#if USING_UE
            UE_LOG(LogV8Inspector, Display, TEXT("request /json/version"));
#else
            PLog(Log, "request /json/version");
#endif
            Connection->set_body(JSONVersion);
            Connection->set_status(websocketpp::http::status_code::ok);
        }
        else
        {
            Connection->set_body("404 Not Found");
            Connection->set_status(websocketpp::http::status_code::not_found);
        }
    }
    catch (const wspp_exception& Exception)
    {
#if USING_UE
        UE_LOG(LogV8Inspector, Error, TEXT("OnHTTP: %s"), ANSI_TO_TCHAR(Exception.what()));
#else
        PLog(Error, "OnHTTP: %s", Exception.what());
#endif
    }
}

void V8InspectorClientImpl::OnOpen(wspp_connection_hdl Handle)
{
    V8InspectorChannel.reset(new V8InspectorChannelImpl(V8Inspector, CtxGroupID, Isolate));
    V8InspectorChannel->OnSendMessage = std::bind(&V8InspectorClientImpl::OnSendMessage, this, Handle, std::placeholders::_1);
#if USING_UE
    UE_LOG(LogV8Inspector, Display, TEXT("Inspector: Connect"));
#else
    PLog(Log, "Inspector: Connect");
#endif
}

void V8InspectorClientImpl::OnReceiveMessage(wspp_connection_hdl Handle, wspp_message_ptr Message)
{
//#if USING_UE
//    UE_LOG(LogV8Inspector, Display, TEXT("<---: %s"), ANSI_TO_TCHAR(Message->get_payload().c_str()));
//#else
//    PLog(Log, "<---: %s", Message->get_payload().c_str());
//#endif

    V8InspectorChannel->ReceiveMessage(Message->get_payload());
}
    
void V8InspectorClientImpl::OnSendMessage(wspp_connection_hdl Handle, const std::string& Message)
{
//#if USING_UE
//    UE_LOG(LogV8Inspector, Display, TEXT("--->: %s"), ANSI_TO_TCHAR(Message.c_str()));
//#else
//    PLog(Log, "--->: %s", Message.c_str());
//#endif

    try
    {
        Server.send(Handle, Message, websocketpp::frame::opcode::TEXT);
    }
    catch (const websocketpp::exception& Exception)
    {
#if USING_UE
        UE_LOG(LogV8Inspector, Error, TEXT("OnSendMessage: %s"), ANSI_TO_TCHAR(Exception.what()));
#else
        PLog(Error, "OnSendMessage: %s", Exception.what());
#endif
    }
}

void V8InspectorClientImpl::OnClose(wspp_connection_hdl Handle)
{
    V8InspectorChannel.reset();
#if USING_UE
    UE_LOG(LogV8Inspector, Display, TEXT("Inspector: Disconnect"));
#endif
}

void V8InspectorClientImpl::OnFail(wspp_connection_hdl Handle)
{
#if USING_UE
    UE_LOG(LogV8Inspector, Error, TEXT("Connection OnFail"));
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
};

#else

#include "V8InspectorImpl.h"

namespace puerts
{
V8Inspector* CreateV8Inspector(int32_t Port, void* InContextPtr)
{
    return nullptr;
}
};

#endif // WITH_EDITOR && (PLATFORM_WINDOWS || PLATFORM_MAC)
