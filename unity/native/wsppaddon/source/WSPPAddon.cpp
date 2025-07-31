#include "pesapi.h"

#define ASIO_NO_TYPEID    // UE需避免使用RTTI功能
#define ASIO_STANDALONE
#define _WEBSOCKETPP_CPP11_TYPE_TRAITS_

#if defined(WITH_WEBSOCKET_SSL)
#include <websocketpp/config/asio.hpp>
#else
#include "websocketpp/config/asio_no_tls.hpp"
#endif
#include "websocketpp/client.hpp"

namespace puerts
{
    
class V8WebSocketClientImpl
{
public:
    V8WebSocketClientImpl(struct pesapi_ffi* apis, pesapi_env_ref envRef);

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

    void Connect(struct pesapi_ffi* apis, pesapi_callback_info info);

    void Send(struct pesapi_ffi* apis, pesapi_callback_info info);

    static void SendWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto ins = (V8WebSocketClientImpl*)apis->get_native_holder_ptr(info);
        ins->Send(apis, info);
    }

    void SetHandles(struct pesapi_ffi* apis, pesapi_callback_info info);

    static void SetHandlesWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto ins = (V8WebSocketClientImpl*)apis->get_native_holder_ptr(info);
        ins->SetHandles(apis, info);
    }

    void Close(struct pesapi_ffi* apis, pesapi_callback_info info);

    static void CloseWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto ins = (V8WebSocketClientImpl*)apis->get_native_holder_ptr(info);
        ins->Close(apis, info);
    }

    void Statue(struct pesapi_ffi* apis, pesapi_callback_info info);

    static void StatueWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto ins = (V8WebSocketClientImpl*)apis->get_native_holder_ptr(info);
        ins->Statue(apis, info);
    }

    void CloseImmediately(websocketpp::close::status::value const code, std::string const& reason);

    void PollOne();

    static void PollOneWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto ins = (V8WebSocketClientImpl*)apis->get_native_holder_ptr(info);
        ins->PollOne();
    }

private:
    void OnOpen(wspp_connection_hdl Handle);

    void OnMessage(wspp_connection_hdl Handle, wspp_message_ptr Message);

    void OnClose(wspp_connection_hdl Handle);

    void OnFail(wspp_connection_hdl Handle);

    void Cleanup();

private:
    struct pesapi_ffi* Apis;
    
    pesapi_env_ref EnvRef;

    wspp_client Client;

    wspp_connection_hdl Handle;

    bool Connenting = false;

    pesapi_value_ref Handles[HANDLE_TYPE_END];
};

V8WebSocketClientImpl::V8WebSocketClientImpl(struct pesapi_ffi* apis, pesapi_env_ref envRef)
    : Apis(apis), EnvRef(envRef)
{
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

void V8WebSocketClientImpl::Connect(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    pesapi_env env = apis->get_env(info);
    pesapi_value val = apis->get_arg(info, 0);
    size_t bufsize;
    apis->get_value_string_utf8(env, val, nullptr, &bufsize);
    std::vector<char> buf(bufsize + 1, 0);
    std::string uri = apis->get_value_string_utf8(env, val, buf.data(), &bufsize);

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
        apis->throw_by_string(info, ss.str().c_str());
        return;
    }

    // Note that connect here only requests a connection. No network messages are
    // exchanged until the event loop starts running in the next line.
    Client.connect(con);
    Connenting = true;
}

void V8WebSocketClientImpl::Send(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    if (Handle.expired())
    {
        apis->throw_by_string(info, "WebSocket is not open");
        return;
    }
    websocketpp::lib::error_code ec;

    pesapi_env env = apis->get_env(info);
    pesapi_value value = apis->get_arg(info, 0);

    if (apis->is_string(env, value))
    {
        size_t bufsize;
        apis->get_value_string_utf8(env, value, nullptr, &bufsize);
        std::vector<char> buf(bufsize + 1, 0);
        std::string payload = apis->get_value_string_utf8(env, value, buf.data(), &bufsize);
        Client.send(Handle, payload, websocketpp::frame::opcode::TEXT, ec);
    }
    else if (apis->is_binary(env, value))
    {
        size_t byteLength;
        void* data = apis->get_value_binary(env, value, &byteLength);
        Client.send(Handle, data, byteLength, websocketpp::frame::opcode::BINARY, ec);
    }
    else
    {
        apis->throw_by_string(info, "data must be String/Binary");
        return;
    }

    if (ec)
    {
        std::stringstream ss;
        ss << "send failed: " << ec.message() << "[" << ec.value() << "]";
        apis->throw_by_string(info, ss.str().c_str());
    }
}

void V8WebSocketClientImpl::SetHandles(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    pesapi_env env = apis->get_env(info);
    
    for (int i = 0; i < HANDLE_TYPE_END; ++i)
    {
        pesapi_value val = apis->get_arg(info, i);
        if (apis->is_function(env, val))
        {
            Handles[i] = apis->create_value_ref(env, val, 0);
        }
    }
}

void V8WebSocketClientImpl::Close(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    websocketpp::close::status::value code = websocketpp::close::status::normal;
    std::string reason = "";
    
    pesapi_env env = apis->get_env(info);
    
    if (apis->get_args_len(info) > 0 && apis->is_int32(env, apis->get_arg(info, 0)))
    {
        code = static_cast<websocketpp::close::status::value>(apis->get_value_int32(env, apis->get_arg(info, 0)));
    }
    
    if (apis->get_args_len(info) > 1 && apis->is_string(env, apis->get_arg(info, 1)))
    {
        size_t bufsize;
        apis->get_value_string_utf8(env, apis->get_arg(info, 1), nullptr, &bufsize);
        std::vector<char> buf(bufsize + 1, 0);
        reason = apis->get_value_string_utf8(env, apis->get_arg(info, 1), buf.data(), &bufsize);
    }
    
    if (!Handle.expired())
    {
        websocketpp::lib::error_code ec;
        Client.close(Handle, code, reason, ec);
        if (ec)
        {
            std::stringstream ss;
            ss << "close failed: " << ec.message() << "[" << ec.value() << "]";
            apis->throw_by_string(info, ss.str().c_str());
        }
    }
    Cleanup();
}

void V8WebSocketClientImpl::Statue(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    websocketpp::lib::error_code ec;
    Client.ping(Handle, "", ec);
    
    pesapi_env env = apis->get_env(info);
    pesapi_value array = apis->create_array(env);
    
    // 设置错误码
    apis->set_property_uint32(env, array, 0, apis->create_int32(env, ec.value()));
    
    // 设置错误信息
    pesapi_value msg = apis->create_string_utf8(env, ec.message().c_str(), ec.message().size());
    apis->set_property_uint32(env, array, 1, msg);
    
    apis->add_return(info, array);
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

void V8WebSocketClientImpl::OnOpen(wspp_connection_hdl Handle)
{
    this->Handle = Handle;
    Connenting = false;
    
    if (Handles[ON_OPEN])
    {
        pesapi_env env = Apis->get_env_from_ref(EnvRef);
        pesapi_value func = Apis->get_value_from_ref(env, Handles[ON_OPEN]);
        Apis->call_function(env, func, nullptr, 0, nullptr);
    }
}

void V8WebSocketClientImpl::OnMessage(wspp_connection_hdl Handle, wspp_message_ptr Message)
{
    if (Handles[ON_MESSAGE])
    {
        pesapi_env env = Apis->get_env_from_ref(EnvRef);
        pesapi_value arg = nullptr;
        
        if (Message->get_opcode() == websocketpp::frame::opcode::TEXT)
        {
            const std::string& payload = Message->get_payload();
            arg = Apis->create_string_utf8(env, payload.c_str(), payload.size());
        }
        else if (Message->get_opcode() == websocketpp::frame::opcode::BINARY)
        {
            const std::string& payload = Message->get_payload();
            arg = Apis->create_binary_by_value(env, const_cast<char*>(payload.data()), payload.size());
        }
        else
        {
            arg = Apis->create_undefined(env);
        }
        
        pesapi_value args[1] = {arg};
        pesapi_value func = Apis->get_value_from_ref(env, Handles[ON_MESSAGE]);
        Apis->call_function(env, func, nullptr, 1, args);
    }
}

void V8WebSocketClientImpl::OnClose(wspp_connection_hdl Handle)
{
    if (Handles[ON_CLOSE])
    {
        pesapi_env env = Apis->get_env_from_ref(EnvRef);
        wspp_client::connection_ptr con = Client.get_con_from_hdl(Handle);
        
        pesapi_value args[2];
        args[0] = Apis->create_int32(env, con->get_remote_close_code());
        args[1] = Apis->create_string_utf8(env, con->get_remote_close_reason().c_str(), con->get_remote_close_reason().size());
        
        pesapi_value func = Apis->get_value_from_ref(env, Handles[ON_CLOSE]);
        Apis->call_function(env, func, nullptr, 2, args);
    }
    Cleanup();
}

void V8WebSocketClientImpl::OnFail(wspp_connection_hdl Handle)
{
    if (Handles[ON_FAIL])
    {
        pesapi_env env = Apis->get_env_from_ref(EnvRef);
        wspp_client::connection_ptr con = Client.get_con_from_hdl(Handle);
        
        std::stringstream ss;
        ss << "on fail: " << con->get_ec().message() << "[" << con->get_ec().value() << "]";
        pesapi_value args[1] = {Apis->create_string_utf8(env, ss.str().c_str(), ss.str().size())};
        
        pesapi_value func = Apis->get_value_from_ref(env, Handles[ON_FAIL]);
        Apis->call_function(env, func, nullptr, 1, args);
    }
    CloseImmediately(websocketpp::close::status::abnormal_close, "");
}

void V8WebSocketClientImpl::Cleanup()
{
    Connenting = false;
    Handle.reset();

    if (!Apis) return;
    
    for (int i = 0; i < HANDLE_TYPE_END; ++i)
    {
        if (Handles[i])
        {
            Apis->release_value_ref(Handles[i]);
            Handles[i] = nullptr;
        }
    }
    
    Apis = nullptr;
}

static void* CreateInstance(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto cli = new V8WebSocketClientImpl(apis, apis->create_env_ref(env));
    cli->Connect(apis, info);
    return cli;
}

static void ReleaseInstance(struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private)
{
    auto cli = static_cast<V8WebSocketClientImpl*>(ptr);
    cli->CloseImmediately(websocketpp::close::status::normal, "");
    delete cli;
}

int g_dummy_type_id = 0;

static void ModuleInit(struct pesapi_registry_api *registry_api, pesapi_registry registry)
{
    // 原生模块trace_lifecycle参数必须为false
    registry_api->define_class(registry, &g_dummy_type_id, nullptr, nullptr, "WebSocketPP", CreateInstance, ReleaseInstance, nullptr, false);
    registry_api->set_property_info_size(registry, &g_dummy_type_id, 5, 0, 0, 0);
    registry_api->set_method_info(registry, &g_dummy_type_id, 0, "send", false, &V8WebSocketClientImpl::SendWrap, nullptr, false);
    registry_api->set_method_info(registry, &g_dummy_type_id, 1, "setHandles", false, &V8WebSocketClientImpl::SetHandlesWrap, nullptr, false);
    registry_api->set_method_info(registry, &g_dummy_type_id, 2, "close", false, &V8WebSocketClientImpl::CloseWrap, nullptr, false);
    registry_api->set_method_info(registry, &g_dummy_type_id, 3, "statue", false, &V8WebSocketClientImpl::StatueWrap, nullptr, false);
    registry_api->set_method_info(registry, &g_dummy_type_id, 4, "poll", false, &V8WebSocketClientImpl::PollOneWrap, nullptr, false);
}

}

// pesapi_register_WSPPAddon_v11
PESAPI_MODULE(WSPPAddon, puerts::ModuleInit)
