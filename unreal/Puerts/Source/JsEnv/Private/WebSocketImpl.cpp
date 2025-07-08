/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if defined(WITH_WEBSOCKET)

#include "V8InspectorImpl.h"    // for PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#include "V8Utils.h"

#ifndef THIRD_PARTY_INCLUDES_START
#define THIRD_PARTY_INCLUDES_START
#endif

#ifndef THIRD_PARTY_INCLUDES_END
#define THIRD_PARTY_INCLUDES_END
#endif

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push)
#if defined(_MSC_VER)
#pragma warning(disable : 4251)
#endif
#include "v8.h"
#pragma warning(pop)

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

namespace PUERTS_NAMESPACE
{
#if !defined(USING_IN_UNREAL_ENGINE)
class DataTransfer
{
public:
    static void* GetArrayBufferData(v8::Local<v8::ArrayBuffer> InArrayBuffer)
    {
        size_t DataLength;
        return GetArrayBufferData(InArrayBuffer, DataLength);
    }

    static void* GetArrayBufferData(v8::Local<v8::ArrayBuffer> InArrayBuffer, size_t& DataLength)
    {
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
        return v8::ArrayBuffer_Get_Data(InArrayBuffer, DataLength);
#else
#if USING_IN_UNREAL_ENGINE
        DataLength = InArrayBuffer->GetContents().ByteLength();
        return InArrayBuffer->GetContents().Data();
#else
        auto BS = InArrayBuffer->GetBackingStore();
        DataLength = BS->ByteLength();
        return BS->Data();
#endif
#endif
    }
};
#endif

class V8WebSocketClientImpl
{
public:
    V8WebSocketClientImpl(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InSelf);

#if defined(WITH_WEBSOCKET_SSL)
    using wspp_client = websocketpp::client<websocketpp::config::asio_tls>;
#else
    using wspp_client = websocketpp::client<websocketpp::config::asio>;
#endif

    using wspp_connection_hdl = websocketpp::connection_hdl;

    using wspp_message_ptr = wspp_client::message_ptr;

    using wspp_exception = websocketpp::exception;

    enum HandlerType
    {
        ON_OPEN,
        ON_MESSAGE,
        ON_CLOSE,
        ON_FAIL,
        HANDLE_TYPE_END
    };

    void Connect(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Send(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetHandles(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Close(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Statue(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void CloseImmediately(websocketpp::close::status::value const code, std::string const& reason);

    void PollOne();

private:
    void OnOpen(wspp_connection_hdl Handle);

    void OnMessage(wspp_connection_hdl Handle, wspp_message_ptr Message);

    void OnClose(wspp_connection_hdl Handle);

    void OnFail(wspp_connection_hdl Handle);

    void Cleanup();

private:
    v8::Isolate* Isolate;

    v8::Global<v8::Context> GContext;

    v8::Global<v8::Object> GSelf;

    wspp_client Client;

    wspp_connection_hdl Handle;

    bool Connenting = false;

    v8::Global<v8::Function> Handles[HANDLE_TYPE_END];
};

static void OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<V8WebSocketClientImpl>& Data)
{
    // UE_LOG(LogTemp, Warning, TEXT(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> auto gc %p"), Data.GetParameter());
    Data.GetParameter()->CloseImmediately(websocketpp::close::status::normal, "");
    delete Data.GetParameter();
}

V8WebSocketClientImpl::V8WebSocketClientImpl(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InSelf)
    : Isolate(InIsolate), GContext(InIsolate, InContext), GSelf(InIsolate, InSelf)
{
    GSelf.SetWeak<V8WebSocketClientImpl>(this, &OnGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    // UE_LOG(LogTemp, Warning, TEXT(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> set weak %p"), this);
}

#if defined(WITH_WEBSOCKET_SSL)
websocketpp::lib::shared_ptr<puerts_asio::ssl::context> on_tls_init(websocketpp::connection_hdl)
{
    auto ctx = websocketpp::lib::make_shared<puerts_asio::ssl::context>(websocketpp::lib::puerts_asio::ssl::context::sslv23);

    websocketpp::lib::error_code ec;
    ctx->set_verify_mode(puerts_asio::ssl::verify_none, ec);
    return ctx;
}
#endif

void V8WebSocketClientImpl::Connect(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    std::string uri = *(v8::String::Utf8Value(Isolate, Info[0]));

    Client.set_access_channels(websocketpp::log::alevel::none);
    Client.set_error_channels(websocketpp::log::elevel::none);

    Client.set_open_handler(std::bind(&V8WebSocketClientImpl::OnOpen, this, std::placeholders::_1));
    Client.set_message_handler(std::bind(&V8WebSocketClientImpl::OnMessage, this, std::placeholders::_1, std::placeholders::_2));
    Client.set_close_handler(std::bind(&V8WebSocketClientImpl::OnClose, this, std::placeholders::_1));
    Client.set_fail_handler(std::bind(&V8WebSocketClientImpl::OnFail, this, std::placeholders::_1));
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
        FV8Utils::ThrowException(Isolate, ss.str().c_str());
        return;
    }

    // Note that connect here only requests a connection. No network messages are
    // exchanged until the event loop starts running in the next line.
    Client.connect(con);
    Connenting = true;
}

void V8WebSocketClientImpl::Send(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (Handle.expired())
    {
        FV8Utils::ThrowException(Isolate, "WebSocket is not open");
        return;
    }
    websocketpp::lib::error_code ec;

    auto Value = Info[0];
    const void* bin = nullptr;
    size_t bin_len = 0;
    if (Value->IsString())
    {
        v8::String::Utf8Value str(Isolate, Value);
        std::string payload(*str, str.length());
        Client.send(Handle, payload, websocketpp::frame::opcode::TEXT, ec);
    }
    else if (Value->IsArrayBufferView())
    {
        v8::Local<v8::ArrayBufferView> BuffView = Value.As<v8::ArrayBufferView>();
        auto Ab = BuffView->Buffer();
        bin = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
        bin_len = BuffView->ByteLength();
    }
    else if (Value->IsArrayBuffer())
    {
        auto Ab = v8::Local<v8::ArrayBuffer>::Cast(Value);
        size_t ByteLength;
        bin = DataTransfer::GetArrayBufferData(Ab, ByteLength);
        bin_len = ByteLength;
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "data must be String/ArrayBuffer/ArrayBufferView");
        return;
    }

    if (bin)
    {
        Client.send(Handle, bin, bin_len, websocketpp::frame::opcode::BINARY, ec);
    }

    if (ec)
    {
        std::stringstream ss;
        ss << "could send because: " << ec.message() << "[" << ec.value() << "]" << std::endl;
        FV8Utils::ThrowException(Isolate, ss.str().c_str());
    }
}

void V8WebSocketClientImpl::SetHandles(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    for (int i = 0; i < HANDLE_TYPE_END; ++i)
    {
        if (Info[i]->IsFunction())
        {
            Handles[i].Reset(Isolate, Info[i].As<v8::Function>());
        }
    }
}

void V8WebSocketClientImpl::Cleanup()
{
    if (!Isolate)
    {
        return;
    }
    Connenting = false;
    Handle.reset();

    v8::Isolate::Scope IsolateScope(Isolate);
    for (int i = 0; i < HANDLE_TYPE_END; ++i)
    {
        Handles[i].Reset();
    }

    // GSelf.Reset();
    GContext.Reset();
    Isolate = nullptr;
}

void V8WebSocketClientImpl::Close(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto InIsolate = Info.GetIsolate();
    websocketpp::close::status::value code = websocketpp::close::status::normal;
    std::string reason = "";
    if (Info[0]->IsInt32())
    {
        code = Info[0]->Int32Value(Info.GetIsolate()->GetCurrentContext()).FromJust();
    }

    if (Info[1]->IsString())
    {
        reason = *v8::String::Utf8Value(InIsolate, Info[1]);
    }

    if (!Handle.expired())
    {
        websocketpp::lib::error_code ec;
        Client.close(Handle, code, reason, ec);
        if (ec)
        {
            std::stringstream ss;
            ss << "close fail: " << ec.message() << "[" << ec.value() << "]" << std::endl;
            FV8Utils::ThrowException(Isolate, ss.str().c_str());
        }
    }
    Cleanup();
}

void V8WebSocketClientImpl::Statue(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    websocketpp::lib::error_code ec;
    Client.ping(Handle, "", ec);
    auto isolate = Info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto res = v8::Array::New(isolate);

    res->Set(context, 0, v8::Int32::New(isolate, ec.value())).Check();
    res->Set(context, 1,
        v8::String::NewFromUtf8(isolate, ec.message().c_str(), v8::NewStringType::kNormal, ec.message().size()).ToLocalChecked());
    Info.GetReturnValue().Set(res);
}

void V8WebSocketClientImpl::CloseImmediately(websocketpp::close::status::value const code, std::string const& reason)
{
    if (!Handle.expired())
    {
        websocketpp::lib::error_code ec;
        Client.close(Handle, code, reason, ec);
    }
    Cleanup();
}

void V8WebSocketClientImpl::PollOne()
{
    if (Connenting || !Handle.expired())
    {
        Client.poll_one();
    }
}

void V8WebSocketClientImpl::OnOpen(wspp_connection_hdl InHandle)
{
    Handle = InHandle;
    Connenting = false;

    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    if (!Handles[ON_OPEN].IsEmpty())
    {
        v8::Local<v8::Value> args[1];
        // must not raise exception in js, recommend just push a pending msg and process later.
        Handles[ON_OPEN].Get(Isolate)->Call(GContext.Get(Isolate), v8::Undefined(Isolate), 0, args);
    }
}

void V8WebSocketClientImpl::OnMessage(wspp_connection_hdl InHandle, wspp_message_ptr InMessage)
{
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    if (!Handles[ON_MESSAGE].IsEmpty())
    {
        v8::Local<v8::Value> args[1];
        if (InMessage->get_opcode() == websocketpp::frame::opcode::TEXT)
        {
            args[0] = v8::String::NewFromUtf8(
                Isolate, InMessage->get_payload().c_str(), v8::NewStringType::kNormal, InMessage->get_payload().size())
                          .ToLocalChecked();
        }
        else if (InMessage->get_opcode() == websocketpp::frame::opcode::BINARY)
        {
            v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, InMessage->get_payload().size());
            void* Buff = DataTransfer::GetArrayBufferData(Ab);
            ::memcpy(Buff, InMessage->get_payload().data(), InMessage->get_payload().size());
            args[0] = Ab;
        }
        else
        {
            args[0] = v8::Undefined(Isolate);
        }
        // must not raise exception in js, recommend just push a pending msg and process later.
        Handles[ON_MESSAGE].Get(Isolate)->Call(GContext.Get(Isolate), v8::Undefined(Isolate), 1, args);
    }
}

void V8WebSocketClientImpl::OnClose(wspp_connection_hdl InHandle)
{
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    if (!Handles[ON_CLOSE].IsEmpty())
    {
        wspp_client::connection_ptr con = Client.get_con_from_hdl(InHandle);
        v8::Local<v8::Value> args[2] = {v8::Integer::New(Isolate, con->get_remote_close_code()),
            v8::String::NewFromUtf8(
                Isolate, con->get_remote_close_reason().c_str(), v8::NewStringType::kNormal, con->get_remote_close_reason().size())
                .ToLocalChecked()};
        // must not raise exception in js, recommend just push a pending msg and process later.
        Handles[ON_CLOSE].Get(Isolate)->Call(GContext.Get(Isolate), v8::Undefined(Isolate), 2, args);
    }
    Cleanup();
}

void V8WebSocketClientImpl::OnFail(wspp_connection_hdl InHandle)
{
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    if (!Handles[ON_FAIL].IsEmpty())
    {
        wspp_client::connection_ptr con = Client.get_con_from_hdl(InHandle);
        std::stringstream ss;
        ss << "on fail: " << con->get_ec().message() << "[" << con->get_ec().value() << "]" << std::endl;
        v8::Local<v8::Value> args[1] = {
            v8::String::NewFromUtf8(Isolate, ss.str().c_str(), v8::NewStringType::kNormal, ss.str().size()).ToLocalChecked()};
        // must not raise exception in js, recommend just push a pending msg and process later.
        Handles[ON_FAIL].Get(Isolate)->Call(GContext.Get(Isolate), v8::Undefined(Isolate), 1, args);
    }
    CloseImmediately(websocketpp::close::status::abnormal_close, "");
}

}    // namespace PUERTS_NAMESPACE

void InitWebsocketPPWrap(v8::Local<v8::Context> Context)
{
    auto Isolate = Context->GetIsolate();
    auto WSTemplate = v8::FunctionTemplate::New(Context->GetIsolate(),
        [](const v8::FunctionCallbackInfo<v8::Value>& Info)
        {
            auto ws =
                new PUERTS_NAMESPACE::V8WebSocketClientImpl(Info.GetIsolate(), Info.GetIsolate()->GetCurrentContext(), Info.This());
            Info.This()->SetAlignedPointerInInternalField(0, ws);
            ws->Connect(Info);
        });
    WSTemplate->InstanceTemplate()->SetInternalFieldCount(1);

    WSTemplate->PrototypeTemplate()->Set(v8::String::NewFromUtf8(Isolate, "send").ToLocalChecked(),
        v8::FunctionTemplate::New(Isolate,
            [](const v8::FunctionCallbackInfo<v8::Value>& Info) {
                static_cast<PUERTS_NAMESPACE::V8WebSocketClientImpl*>(Info.Holder()->GetAlignedPointerFromInternalField(0))
                    ->Send(Info);
            }));

    WSTemplate->PrototypeTemplate()->Set(v8::String::NewFromUtf8(Isolate, "setHandles").ToLocalChecked(),
        v8::FunctionTemplate::New(Isolate,
            [](const v8::FunctionCallbackInfo<v8::Value>& Info)
            {
                static_cast<PUERTS_NAMESPACE::V8WebSocketClientImpl*>(Info.Holder()->GetAlignedPointerFromInternalField(0))
                    ->SetHandles(Info);
            }));

    WSTemplate->PrototypeTemplate()->Set(v8::String::NewFromUtf8(Isolate, "close").ToLocalChecked(),
        v8::FunctionTemplate::New(Isolate,
            [](const v8::FunctionCallbackInfo<v8::Value>& Info) {
                static_cast<PUERTS_NAMESPACE::V8WebSocketClientImpl*>(Info.Holder()->GetAlignedPointerFromInternalField(0))
                    ->Close(Info);
            }));

    WSTemplate->PrototypeTemplate()->Set(v8::String::NewFromUtf8(Isolate, "statue").ToLocalChecked(),
        v8::FunctionTemplate::New(Isolate,
            [](const v8::FunctionCallbackInfo<v8::Value>& Info) {
                static_cast<PUERTS_NAMESPACE::V8WebSocketClientImpl*>(Info.Holder()->GetAlignedPointerFromInternalField(0))
                    ->Statue(Info);
            }));

    WSTemplate->PrototypeTemplate()->Set(v8::String::NewFromUtf8(Isolate, "poll").ToLocalChecked(),
        v8::FunctionTemplate::New(Isolate,
            [](const v8::FunctionCallbackInfo<v8::Value>& Info)
            {
                v8::TryCatch TryCatch(Info.GetIsolate());
                static_cast<PUERTS_NAMESPACE::V8WebSocketClientImpl*>(Info.Holder()->GetAlignedPointerFromInternalField(0))
                    ->PollOne();
            }));

    Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "WebSocketPP").ToLocalChecked(),
        WSTemplate->GetFunction(Context).ToLocalChecked());
}

#endif