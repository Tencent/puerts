/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if defined(WITH_WEBSOCKET)

#include "V8InspectorImpl.h"    // for PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#include "V8Utils.h"

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
#include "websocketpp/config/asio_no_tls.hpp"
#include "websocketpp/client.hpp"
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

    static v8::Local<v8::ArrayBuffer> NewArrayBuffer(v8::Local<v8::Context> Context, void* Data, size_t DataLength)
    {
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
        return v8::ArrayBuffer_New_Without_Stl(Context->GetIsolate(), Data, DataLength);
#else
#if USING_IN_UNREAL_ENGINE
        return v8::ArrayBuffer::New(Context->GetIsolate(), Data, DataLength);
#else
        auto Backing = v8::ArrayBuffer::NewBackingStore(Data, DataLength, v8::BackingStore::EmptyDeleter, nullptr);
        return v8::ArrayBuffer::New(Context->GetIsolate(), std::move(Backing));
#endif
#endif
    }
};
#endif

class V8WebSocketClientImpl
{
public:
    V8WebSocketClientImpl(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InSelf);

    using wspp_client = websocketpp::client<websocketpp::config::asio>;

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

    void Close(websocketpp::close::status::value const code, std::string const& reason);

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
    Data.GetParameter()->Close(websocketpp::close::status::normal, "");
    delete Data.GetParameter();
}

V8WebSocketClientImpl::V8WebSocketClientImpl(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InSelf)
    : Isolate(InIsolate), GContext(InIsolate, InContext), GSelf(InIsolate, InSelf)
{
    GSelf.SetWeak<V8WebSocketClientImpl>(this, &OnGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    // UE_LOG(LogTemp, Warning, TEXT(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> set weak %p"), this);
}

void V8WebSocketClientImpl::Connect(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    std::string uri = *(v8::String::Utf8Value(Isolate, Info[0]));

    Client.set_access_channels(websocketpp::log::alevel::none);
    Client.set_error_channels(websocketpp::log::elevel::none);

    Client.set_open_handler(std::bind(&V8WebSocketClientImpl::OnOpen, this, std::placeholders::_1));
    Client.set_message_handler(std::bind(&V8WebSocketClientImpl::OnMessage, this, std::placeholders::_1, std::placeholders::_2));
    Client.set_close_handler(std::bind(&V8WebSocketClientImpl::OnClose, this, std::placeholders::_1));
    Client.set_fail_handler(std::bind(&V8WebSocketClientImpl::OnFail, this, std::placeholders::_1));

    Client.init_asio();

    websocketpp::lib::error_code ec;
    wspp_client::connection_ptr con = Client.get_connection(uri, ec);
    if (ec)
    {
        std::stringstream ss;
        ss << "could not create connection because: " << ec.message() << std::endl;
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
        ss << "could not create connection because: " << ec.message() << std::endl;
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

    Close(code, reason);
}

void V8WebSocketClientImpl::Close(websocketpp::close::status::value const code, std::string const& reason)
{
    if (!Handle.expired())
    {
        Client.close(Handle, code, reason);
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
            args[0] = DataTransfer::NewArrayBuffer(
                GContext.Get(Isolate), (void*) InMessage->get_payload().c_str(), InMessage->get_payload().size());
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
        v8::Local<v8::Value> args[1] = {v8::String::NewFromUtf8(
            Isolate, con->get_ec().message().c_str(), v8::NewStringType::kNormal, con->get_ec().message().size())
                                            .ToLocalChecked()};
        // must not raise exception in js, recommend just push a pending msg and process later.
        Handles[ON_FAIL].Get(Isolate)->Call(GContext.Get(Isolate), v8::Undefined(Isolate), 1, args);
    }
    Close(websocketpp::close::status::abnormal_close, "");
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