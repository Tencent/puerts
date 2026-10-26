/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if defined(WITH_WEBSOCKET)

#include "CoreMinimal.h"
#include "JSClassRegister.h"
#include "pesapi.h"

#ifndef THIRD_PARTY_INCLUDES_START
#define THIRD_PARTY_INCLUDES_START
#endif

#ifndef THIRD_PARTY_INCLUDES_END
#define THIRD_PARTY_INCLUDES_END
#endif

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#define ASIO_NO_TYPEID    // UE需避免使用RTTI功能

#define ASIO_STANDALONE
#define _WEBSOCKETPP_CPP11_TYPE_TRAITS_
#define UI UI_ST
THIRD_PARTY_INCLUDES_START
#if defined(WITH_WEBSOCKET_SSL)
#include <websocketpp/config/asio.hpp>
#else
#include "websocketpp/config/asio_no_tls.hpp"
#endif
#include "websocketpp/client.hpp"
THIRD_PARTY_INCLUDES_END
#undef UI
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include <sstream>
#include <string>

namespace PUERTS_NAMESPACE
{
static std::string WebSocketToStdString(pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    size_t Len = 0;
    Apis->get_value_string_utf8(Env, Value, nullptr, &Len);
    std::string Ret(Len, '\0');
    if (Len > 0)
    {
        Apis->get_value_string_utf8(Env, Value, &Ret[0], &Len);
    }
    return Ret;
}

// the native object behind the script class WebSocketPP, created by the class constructor and released by its finalizer (on gc
// or when the env is destroyed). the js handlers are only called while polling, i.e. inside a call from js
class FWebSocketClientImpl
{
public:
#if defined(WITH_WEBSOCKET_SSL)
    using wspp_client = websocketpp::client<websocketpp::config::asio_tls>;
#else
    using wspp_client = websocketpp::client<websocketpp::config::asio>;
#endif

    using wspp_connection_hdl = websocketpp::connection_hdl;

    using wspp_message_ptr = wspp_client::message_ptr;

    enum HandlerType
    {
        ON_OPEN,
        ON_MESSAGE,
        ON_CLOSE,
        ON_FAIL,
        HANDLE_TYPE_END
    };

    FWebSocketClientImpl(pesapi_ffi* InApis, pesapi_env Env) : Apis(InApis), EnvRef(InApis->create_env_ref(Env))
    {
    }

    ~FWebSocketClientImpl()
    {
        ReleaseHandles();
        if (EnvRef)
        {
            Apis->release_env_ref(EnvRef);
            EnvRef = nullptr;
        }
    }

    bool Connect(pesapi_callback_info Info);

    void Send(pesapi_callback_info Info);

    void SetHandles(pesapi_callback_info Info);

    void Close(pesapi_callback_info Info);

    void Statue(pesapi_callback_info Info);

    void CloseImmediately(websocketpp::close::status::value const code, std::string const& reason);

    void PollOne();

private:
    void OnOpen(wspp_connection_hdl Handle);

    void OnMessage(wspp_connection_hdl Handle, wspp_message_ptr Message);

    void OnClose(wspp_connection_hdl Handle);

    void OnFail(wspp_connection_hdl Handle);

    void CallHandler(HandlerType Type, int Argc, const pesapi_value Argv[]);

    void ReleaseHandles();

    void Cleanup();

private:
    pesapi_ffi* Apis;

    pesapi_env_ref EnvRef;

    // only valid while polling
    pesapi_env CurrentEnv = nullptr;

    wspp_client Client;

    wspp_connection_hdl Handle;

    bool Connenting = false;

    bool Cleaned = false;

    pesapi_value_ref Handles[HANDLE_TYPE_END] = {};
};

#if defined(WITH_WEBSOCKET_SSL)
websocketpp::lib::shared_ptr<puerts_asio::ssl::context> on_tls_init(websocketpp::connection_hdl)
{
    auto ctx = websocketpp::lib::make_shared<puerts_asio::ssl::context>(websocketpp::lib::puerts_asio::ssl::context::sslv23);

    websocketpp::lib::error_code ec;
    ctx->set_verify_mode(puerts_asio::ssl::verify_none, ec);
    return ctx;
}
#endif

bool FWebSocketClientImpl::Connect(pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    std::string uri = WebSocketToStdString(Apis, Env, Apis->get_arg(Info, 0));

    Client.set_access_channels(websocketpp::log::alevel::none);
    Client.set_error_channels(websocketpp::log::elevel::none);

    Client.set_open_handler(std::bind(&FWebSocketClientImpl::OnOpen, this, std::placeholders::_1));
    Client.set_message_handler(std::bind(&FWebSocketClientImpl::OnMessage, this, std::placeholders::_1, std::placeholders::_2));
    Client.set_close_handler(std::bind(&FWebSocketClientImpl::OnClose, this, std::placeholders::_1));
    Client.set_fail_handler(std::bind(&FWebSocketClientImpl::OnFail, this, std::placeholders::_1));
#if defined(WITH_WEBSOCKET_SSL)
    Client.set_tls_init_handler(&on_tls_init);
#endif

    Client.init_asio();

    websocketpp::lib::error_code ec;
    wspp_client::connection_ptr con = Client.get_connection(uri, ec);
    if (ec)
    {
        std::stringstream ss;
        ss << "could not create connection because: " << ec.message() << "[" << ec.value() << "]" << std::endl;
        Apis->throw_by_string(Info, ss.str().c_str());
        return false;
    }

    // Note that connect here only requests a connection. No network messages are
    // exchanged until the event loop starts running in the next line.
    Client.connect(con);
    Connenting = true;
    return true;
}

void FWebSocketClientImpl::Send(pesapi_callback_info Info)
{
    if (Handle.expired())
    {
        Apis->throw_by_string(Info, "WebSocket is not open");
        return;
    }
    websocketpp::lib::error_code ec;

    pesapi_env Env = Apis->get_env(Info);
    pesapi_value Value = Apis->get_arg(Info, 0);
    if (Apis->is_string(Env, Value))
    {
        std::string payload = WebSocketToStdString(Apis, Env, Value);
        Client.send(Handle, payload, websocketpp::frame::opcode::TEXT, ec);
    }
    else if (Apis->is_binary(Env, Value))
    {
        size_t bin_len = 0;
        void* bin = Apis->get_value_binary(Env, Value, &bin_len);
        if (bin)
        {
            Client.send(Handle, bin, bin_len, websocketpp::frame::opcode::BINARY, ec);
        }
    }
    else
    {
        Apis->throw_by_string(Info, "data must be String/ArrayBuffer/ArrayBufferView");
        return;
    }

    if (ec)
    {
        std::stringstream ss;
        ss << "could send because: " << ec.message() << "[" << ec.value() << "]" << std::endl;
        Apis->throw_by_string(Info, ss.str().c_str());
    }
}

void FWebSocketClientImpl::SetHandles(pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    for (int i = 0; i < HANDLE_TYPE_END; ++i)
    {
        pesapi_value Func = Apis->get_arg(Info, i);
        if (Apis->is_function(Env, Func))
        {
            if (Handles[i])
            {
                Apis->release_value_ref(Handles[i]);
            }
            Handles[i] = Apis->create_value_ref(Env, Func, 0);
        }
    }
}

void FWebSocketClientImpl::ReleaseHandles()
{
    for (int i = 0; i < HANDLE_TYPE_END; ++i)
    {
        if (Handles[i])
        {
            Apis->release_value_ref(Handles[i]);
            Handles[i] = nullptr;
        }
    }
}

void FWebSocketClientImpl::Cleanup()
{
    if (Cleaned)
    {
        return;
    }
    Connenting = false;
    Handle.reset();
    ReleaseHandles();
    Cleaned = true;
}

void FWebSocketClientImpl::Close(pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    websocketpp::close::status::value code = websocketpp::close::status::normal;
    std::string reason = "";
    pesapi_value Code = Apis->get_arg(Info, 0);
    if (Apis->is_int32(Env, Code))
    {
        code = static_cast<websocketpp::close::status::value>(Apis->get_value_int32(Env, Code));
    }

    pesapi_value Reason = Apis->get_arg(Info, 1);
    if (Apis->is_string(Env, Reason))
    {
        reason = WebSocketToStdString(Apis, Env, Reason);
    }

    if (!Handle.expired())
    {
        websocketpp::lib::error_code ec;
        Client.close(Handle, code, reason, ec);
        if (ec)
        {
            std::stringstream ss;
            ss << "close fail: " << ec.message() << "[" << ec.value() << "]" << std::endl;
            Apis->throw_by_string(Info, ss.str().c_str());
        }
    }
    Cleanup();
}

void FWebSocketClientImpl::Statue(pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    websocketpp::lib::error_code ec;
    Client.ping(Handle, "", ec);
    pesapi_value Res = Apis->create_array(Env);
    Apis->set_property_uint32(Env, Res, 0, Apis->create_int32(Env, ec.value()));
    const std::string Message = ec.message();
    Apis->set_property_uint32(Env, Res, 1, Apis->create_string_utf8(Env, Message.c_str(), Message.size()));
    Apis->add_return(Info, Res);
}

void FWebSocketClientImpl::CloseImmediately(websocketpp::close::status::value const code, std::string const& reason)
{
    if (!Handle.expired())
    {
        websocketpp::lib::error_code ec;
        Client.close(Handle, code, reason, ec);
    }

    Client.stop();
    Cleanup();
}

void FWebSocketClientImpl::PollOne()
{
    if (Cleaned || !EnvRef || !Apis->env_ref_is_valid(EnvRef))
    {
        return;
    }
    if (Connenting || !Handle.expired())
    {
        // the handlers must not raise exception in js (recommend just push a pending msg and process later), exceptions are
        // swallowed by this nested scope
        pesapi_scope_memory ScopeMemory;
        pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
        CurrentEnv = Apis->get_env_from_ref(EnvRef);
        Client.poll_one();
        CurrentEnv = nullptr;
        Apis->close_scope_placement(Scope);
    }
}

void FWebSocketClientImpl::CallHandler(HandlerType Type, int Argc, const pesapi_value Argv[])
{
    if (!CurrentEnv || !Handles[Type])
    {
        return;
    }
    pesapi_value Func = Apis->get_value_from_ref(CurrentEnv, Handles[Type]);
    Apis->call_function(CurrentEnv, Func, nullptr, Argc, Argv);
}

void FWebSocketClientImpl::OnOpen(wspp_connection_hdl InHandle)
{
    Handle = InHandle;
    Connenting = false;

    CallHandler(ON_OPEN, 0, nullptr);
}

void FWebSocketClientImpl::OnMessage(wspp_connection_hdl InHandle, wspp_message_ptr InMessage)
{
    if (!CurrentEnv || !Handles[ON_MESSAGE])
    {
        return;
    }
    const std::string& Payload = InMessage->get_payload();
    pesapi_value Args[1];
    if (InMessage->get_opcode() == websocketpp::frame::opcode::TEXT)
    {
        Args[0] = Apis->create_string_utf8(CurrentEnv, Payload.c_str(), Payload.size());
    }
    else if (InMessage->get_opcode() == websocketpp::frame::opcode::BINARY)
    {
        Args[0] = Apis->create_binary_by_value(CurrentEnv, const_cast<char*>(Payload.data()), Payload.size());
    }
    else
    {
        Args[0] = Apis->create_undefined(CurrentEnv);
    }
    CallHandler(ON_MESSAGE, 1, Args);
}

void FWebSocketClientImpl::OnClose(wspp_connection_hdl InHandle)
{
    if (CurrentEnv && Handles[ON_CLOSE])
    {
        wspp_client::connection_ptr con = Client.get_con_from_hdl(InHandle);
        const std::string& Reason = con->get_remote_close_reason();
        pesapi_value Args[2] = {Apis->create_int32(CurrentEnv, con->get_remote_close_code()),
            Apis->create_string_utf8(CurrentEnv, Reason.c_str(), Reason.size())};
        CallHandler(ON_CLOSE, 2, Args);
    }
    Cleanup();
}

void FWebSocketClientImpl::OnFail(wspp_connection_hdl InHandle)
{
    if (CurrentEnv && Handles[ON_FAIL])
    {
        wspp_client::connection_ptr con = Client.get_con_from_hdl(InHandle);
        std::stringstream ss;
        ss << "on fail: " << con->get_ec().message() << "[" << con->get_ec().value() << "]" << std::endl;
        const std::string Message = ss.str();
        pesapi_value Args[1] = {Apis->create_string_utf8(CurrentEnv, Message.c_str(), Message.size())};
        CallHandler(ON_FAIL, 1, Args);
    }
    CloseImmediately(websocketpp::close::status::abnormal_close, "");
}

static int WebSocketClassTypeId = 0;

static void* WebSocketConstruct(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Ws = new FWebSocketClientImpl(Apis, Apis->get_env(Info));
    if (!Ws->Connect(Info))
    {
        delete Ws;
        return nullptr;
    }
    return Ws;
}

static void WebSocketFinalize(pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate)
{
    auto Ws = static_cast<FWebSocketClientImpl*>(Ptr);
    Ws->CloseImmediately(websocketpp::close::status::normal, "");
    delete Ws;
}

static FWebSocketClientImpl* WebSocketHolder(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Ws = static_cast<FWebSocketClientImpl*>(Apis->get_native_holder_ptr(Info));
    if (!Ws)
    {
        Apis->throw_by_string(Info, "invalid WebSocketPP object");
    }
    return Ws;
}

static void WebSocketSend(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (auto Ws = WebSocketHolder(Apis, Info))
    {
        Ws->Send(Info);
    }
}

static void WebSocketSetHandles(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (auto Ws = WebSocketHolder(Apis, Info))
    {
        Ws->SetHandles(Info);
    }
}

static void WebSocketClose(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (auto Ws = WebSocketHolder(Apis, Info))
    {
        Ws->Close(Info);
    }
}

static void WebSocketStatue(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (auto Ws = WebSocketHolder(Apis, Info))
    {
        Ws->Statue(Info);
    }
}

static void WebSocketPoll(pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (auto Ws = WebSocketHolder(Apis, Info))
    {
        Ws->PollOne();
    }
}

}    // namespace PUERTS_NAMESPACE

// registers the WebSocketPP class into Registry (once) and sets it as global WebSocketPP of Env
void InitWebsocketPPWrap(pesapi_ffi* Apis, pesapi_env Env, PUERTS_NAMESPACE::ScriptClassRegistry* Registry)
{
    using namespace PUERTS_NAMESPACE;
    const void* TypeId = &WebSocketClassTypeId;
    if (!FindClassByID(Registry, TypeId))
    {
        JSFunctionInfo Methods[] = {{"send", &WebSocketSend}, {"setHandles", &WebSocketSetHandles}, {"close", &WebSocketClose},
            {"statue", &WebSocketStatue}, {"poll", &WebSocketPoll}, {nullptr, nullptr}};
        JSFunctionInfo Functions[] = {{nullptr, nullptr}};
        JSPropertyInfo Properties[] = {{nullptr, nullptr, nullptr}};

        JSClassDefinition ClassDef = JSClassEmptyDefinition;
        ClassDef.TypeId = TypeId;
        ClassDef.ScriptName = "WebSocketPP";
        ClassDef.Initialize = &WebSocketConstruct;
        ClassDef.Finalize = &WebSocketFinalize;
        ClassDef.Methods = Methods;
        ClassDef.Functions = Functions;
        ClassDef.Properties = Properties;
        ClassDef.Variables = Properties;
        RegisterScriptClass(Registry, ClassDef);
    }

    pesapi_value Class = Apis->create_class(Env, TypeId);
    if (Class)
    {
        Apis->set_property(Env, Apis->global(Env), "WebSocketPP", Class);
    }
}

#endif
