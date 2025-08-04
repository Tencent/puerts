#include "PapiData.h"

namespace pesapi
{
namespace qjsimpl
{
inline pesapi_value pesapiValueFromQjsValue(JSValue* v)
{
    return reinterpret_cast<pesapi_value>(v);
}

inline JSValue* qjsValueFromPesapiValue(pesapi_value v)
{
    return reinterpret_cast<JSValue*>(v);
}

inline pesapi_env pesapiEnvFromQjsContext(JSContext * ctx)
{
    return reinterpret_cast<pesapi_env>(ctx);
}

inline JSContext* qjsContextFromPesapiEnv(pesapi_env v)
{
    return reinterpret_cast<JSContext*>(v);
}

inline JSValue *allocValueInCurrentScope(JSContext *ctx)
{
    auto scope = getCurrentScope(ctx);
    return scope->allocValue();
}

JSValue literal_values_undefined = JS_UNDEFINED;
JSValue literal_values_null = JS_NULL;
JSValue literal_values_true = JS_TRUE;
JSValue literal_values_false = JS_FALSE;

template<typename Func>
pesapi_value pesapi_create_generic0(pesapi_env env, Func createFunc)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx)
    {
        auto ret = allocValueInCurrentScope(ctx);
        if (ret)
        {
            *ret = createFunc(ctx);
            return pesapiValueFromQjsValue(ret);
        }
    }
    return nullptr;
}

template<typename T, typename Func>
pesapi_value pesapi_create_generic1(pesapi_env env, T value, Func createFunc)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx)
    {
        auto ret = allocValueInCurrentScope(ctx);
        if (ret)
        {
            *ret = createFunc(ctx, value);
            return pesapiValueFromQjsValue(ret);
        }
    }
    return nullptr;
}

template<typename T1, typename T2, typename Func>
pesapi_value pesapi_create_generic2(pesapi_env env, T1 v1, T2 v2, Func createFunc)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx)
    {
        auto ret = allocValueInCurrentScope(ctx);
        if (ret)
        {
            *ret = createFunc(ctx, v1, v2);
            return pesapiValueFromQjsValue(ret);
        }
    }
    return nullptr;
}

template<typename T, typename Func>
T pesapi_get_value_generic(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx != nullptr)
    {
        T ret = 0;
        convertFunc(ctx, &ret, reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v);
        return ret;
    }
    return 0;
}

template<typename Func>
int pesapi_is_generic(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx != nullptr)
    {
        return convertFunc(reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v);
    }
    return false;
}

template<typename Func>
int pesapi_is_generic_ctx(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx != nullptr)
    {
        return convertFunc(ctx, reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v);
    }
    return false;
}

// value process
pesapi_value pesapi_create_null(pesapi_env env)
{
    return pesapiValueFromQjsValue(&literal_values_null); //避免在Scope上分配
}

pesapi_value pesapi_create_undefined(pesapi_env env)
{
    return pesapiValueFromQjsValue(&literal_values_undefined);
}

pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    return pesapiValueFromQjsValue(value ? &literal_values_true : &literal_values_false);
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    return pesapi_create_generic1(env, value, JS_NewInt32);
}

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    return pesapi_create_generic1(env, value, JS_NewUint32);
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    return pesapi_create_generic1(env, value, JS_NewBigInt64);
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    return pesapi_create_generic1(env, value, JS_NewBigUint64);
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    return pesapi_create_generic1(env, value, JS_NewFloat64);
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char *str, size_t length)
{
    return pesapi_create_generic2(env, str, length, JS_NewStringLen);
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t *str, size_t length)
{
    return pesapi_create_generic2(env, str, length, JS_NewString16Len);
}

static JSValue JS_NewArrayBufferCopyWrap(JSContext *ctx, void *bin, size_t len)
{
    return JS_NewArrayBufferCopy(ctx, (uint8_t *) bin, len);
}

pesapi_value pesapi_create_binary(pesapi_env env, void *bin, size_t length)
{
    return pesapi_create_generic2(env, bin, length, JS_NewArrayBufferCopyWrap);
}

pesapi_value pesapi_create_array(pesapi_env env)
{
    return pesapi_create_generic0(env, JS_NewArray);
}

pesapi_value pesapi_create_object(pesapi_env env)
{
    return pesapi_create_generic0(env, JS_NewObject);
}

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = allocValueInCurrentScope(ctx);
    *ret = pesapi::qjsimpl::CppObjectMapper::Get(ctx)->CreateFunction(native_impl, data, finalize);
    return pesapiValueFromQjsValue(ret);
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = allocValueInCurrentScope(ctx);
    *ret = pesapi::qjsimpl::CppObjectMapper::Get(ctx)->FindOrCreateClassByID(type_id);
    JS_DupValue(ctx, *ret);
    return pesapiValueFromQjsValue(ret);
}

int JS_ToBool2(JSContext *ctx, int *pres, JSValue val)
{
    int res = JS_ToBool(ctx, val);
    if (res != -1)
    {
        *pres = (int)res;
    }
    return res;
}

int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<int>(env, pvalue, JS_ToBool2);
}

int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<int32_t>(env, pvalue, JS_ToInt32);
}

uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<uint32_t>(env, pvalue, JS_ToUint32);
}

int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<int64_t>(env, pvalue, JS_ToBigInt64);
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<uint64_t>(env, pvalue, JS_ToBigUint64);
}

double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<double>(env, pvalue, JS_ToFloat64);
}


const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx != nullptr)
    {
        auto jsvalue = reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v;
        if (buf == nullptr)
        {
            auto ret = JS_ToCString(ctx, jsvalue); // TODO: 优化
            if (ret)
            {
                *bufsize = strlen(ret);
                JS_FreeCString(ctx, ret);
            }
        }
        else
        {
            auto ret = JS_ToCStringLen(ctx, bufsize, jsvalue);
            if (ret)
            {
                strcpy(buf, ret);
                JS_FreeCString(ctx, ret);
            }
        }
    }
    return buf;
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return JS_ToCString16Len(ctx, reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v, buf, bufsize);
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx != nullptr)
    {
        auto jsvalue = reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v;
        if (JS_IsArrayBuffer(jsvalue))
        {
            return JS_GetArrayBuffer(ctx, bufsize, jsvalue);
        }
        if (JS_IsArrayBufferView(jsvalue))
        {
            size_t byte_offset;
            size_t byte_length;
            size_t bytes_per_element;
            JS_GetArrayBufferViewInfo(ctx, jsvalue, &byte_offset, &byte_length, &bytes_per_element);
            JSValue ab = JS_GetArrayBufferView(ctx, jsvalue);
            uint8_t* buf = JS_GetArrayBuffer(ctx, bufsize, ab);
            JS_FreeValue(ctx, ab);
            *bufsize = byte_length;
            return buf + byte_offset;
        }
    }
    return nullptr;
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    if (ctx != nullptr)
    {
        JSAtom length_atom = JS_NewAtom(ctx, "length");
        auto len = JS_GetProperty(ctx, reinterpret_cast<pesapi::qjsimpl::pesapi_value__*>(pvalue)->v, length_atom);
        JS_FreeAtom(ctx, length_atom);
        if (JS_IsException(len))
        {
            return 0;
        }
        uint32_t ret;
        JS_ToUint32(ctx, &ret, len);
        JS_FreeValue(ctx, len);
        return ret;
    }
    return 0;
}

int pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNull);
}

int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsUndefined);
}

int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsBool);
}

int pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

int pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsBigInt);
}

int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsBigInt);
}

int pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

int pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsString);
}

int pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsObject);
}

int pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsFunction);
}

int pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> JS_BOOL {
        return JS_IsArrayBuffer(val) || JS_IsArrayBufferView(val);
    });
}

int pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsArray);
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    auto ret = allocValueInCurrentScope(ctx);
    *ret = mapper->PushNativeObject(type_id, object_ptr, call_finalize);
    return pesapiValueFromQjsValue(ret);
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    auto value = qjsValueFromPesapiValue(pvalue);
    return (void*)mapper->GetNativeObjectPtr(*value);
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    auto value = qjsValueFromPesapiValue(pvalue);
    return mapper->GetNativeObjectTypeId(*value);
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    return pesapi_get_native_object_typeid(env, pvalue) == type_id; // TODO: api 不正交
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* boxed_value = allocValueInCurrentScope(ctx);
    *boxed_value = JS_NewObject(ctx);
    JSValue* val = qjsValueFromPesapiValue(pvalue);
    if (JS_VALUE_HAS_REF_COUNT(*val)) {
        JS_DupValue(ctx, *val);
    }
    JS_SetPropertyUint32(ctx, *boxed_value, 0, *val);
    return pesapiValueFromQjsValue(boxed_value);
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* boxed_value = qjsValueFromPesapiValue(p_boxed_value);
    if (!boxed_value || !JS_IsObject(*boxed_value))
    {
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    JSValue* ret = allocValueInCurrentScope(ctx);
    *ret = JS_GetPropertyUint32(ctx, *boxed_value, 0);
    return pesapiValueFromQjsValue(ret);
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* boxed_value = qjsValueFromPesapiValue(p_boxed_value);
    if (!boxed_value || !JS_IsObject(*boxed_value))
    {
        return;
    }
    JSValue* val = qjsValueFromPesapiValue(pvalue);
    if (JS_VALUE_HAS_REF_COUNT(*val)) {
        JS_DupValue(ctx, *val);
    }
    JS_SetPropertyUint32(ctx, *boxed_value, 0, *val);
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return pesapi_is_object(env, value);
}

int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    return info->argc;
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    if (index >= 0 && index < info->argc)
    {
        return pesapiValueFromQjsValue(&(info->argv[index]));
    }
    else
    {
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
}

pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    return pesapiEnvFromQjsContext(info->ctx);
}

void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(info->ctx);
    return (void*)mapper->GetNativeObjectPtr(info->this_val);
}

const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(info->ctx);
    return mapper->GetNativeObjectTypeId(info->this_val);
}

void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    return info->data;
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    info->res = *qjsValueFromPesapiValue(value);
    if (JS_VALUE_HAS_REF_COUNT(info->res)) {
        JS_DupValue(info->ctx, info->res);
    }

}

void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto info = reinterpret_cast<pesapi::qjsimpl::pesapi_callback_info__*>(pinfo);
    info->res = JS_EXCEPTION;
    info->ex = JS_NewError(info->ctx);
    JSAtom message_atom = JS_NewAtom(info->ctx, "message");
    JS_DefinePropertyValue(info->ctx, info->ex, message_atom, JS_NewString(info->ctx, msg),
                           JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
    JS_FreeAtom(info->ctx, message_atom);
}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = (pesapi_env_ref)malloc(sizeof(pesapi_env_ref__));
    memset(ret, 0, sizeof(pesapi_env_ref__));
    new (ret) pesapi::qjsimpl::pesapi_env_ref__(ctx);
    return ret;
}

int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_env_ref__*>(penv_ref);
    return !env_ref->env_life_cycle_tracker.expired();
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_env_ref__*>(penv_ref);
    if (env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    return pesapiEnvFromQjsContext(env_ref->context_persistent);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_env_ref__*>(penv_ref);
    ++env_ref->ref_count;
    return penv_ref;
}

void pesapi_release_env_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_env_ref__*>(penv_ref);
    if (--env_ref->ref_count == 0)
    {
        if (!env_ref->env_life_cycle_tracker.expired())
        {
            env_ref->pesapi::qjsimpl::pesapi_env_ref__::~pesapi_env_ref__();
        }
        free(env_ref);
    }
}

pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_env_ref__*>(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    pesapi_scope ret = static_cast<pesapi_scope>(malloc(sizeof(pesapi::qjsimpl::pesapi_scope__)));
    memset(ret, 0, sizeof(pesapi::qjsimpl::pesapi_scope__));
    new (ret) pesapi::qjsimpl::pesapi_scope__(env_ref->context_persistent);
    return ret;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    auto env_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_env_ref__*>(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) pesapi::qjsimpl::pesapi_scope__(env_ref->context_persistent);
    return reinterpret_cast<pesapi_scope>(memory);
}

int pesapi_has_caught(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi::qjsimpl::pesapi_scope__*>(pscope);
    return scope->caught != nullptr;
}

const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack)
{
    auto scope = reinterpret_cast<pesapi::qjsimpl::pesapi_scope__*>(pscope);
    if (scope->caught != nullptr)
    {
        auto ctx = scope->ctx;
        auto msg = JS_ToCString(ctx, scope->caught->exception);
        scope->caught->message = msg;
        JS_FreeCString(ctx, msg);

        if (with_stack)
        {
            //JSValue fileNameVal = JS_GetProperty(ctx, scope->caught->exception, JS_ATOM_fileName);
            //JSValue lineNumVal = JS_GetProperty(ctx, scope->caught->exception, JS_ATOM_lineNumber);
            JSAtom stack_atom = JS_NewAtom(ctx, "stack");
            JSValue stackVal = JS_GetProperty(ctx, scope->caught->exception, stack_atom);
            JS_FreeAtom(ctx, stack_atom);
            if (JS_IsString(stackVal))
            {
                auto stack = JS_ToCString(ctx, stackVal);
                scope->caught->message += "\n";
                scope->caught->message += stack;
                JS_FreeCString(ctx, stack);
            }
            JS_FreeValue(ctx, stackVal);
        }
        return scope->caught->message.c_str();
    }
    return nullptr;
}

void pesapi_close_scope(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi::qjsimpl::pesapi_scope__*>(pscope);
    if (!scope)
    {
        return;
    }
    if (scope->prev_scope == nullptr)
    {
        auto ctx = scope->ctx;
        auto rt = JS_GetRuntime(ctx);
        while (JS_IsJobPending(rt))
        {
            JSContext *ctx_ = nullptr;
            JS_ExecutePendingJob(rt, &ctx_);
        } 
    }
    scope->pesapi::qjsimpl::pesapi_scope__::~pesapi_scope__();
    free(scope);
}

void pesapi_close_scope_placement(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi::qjsimpl::pesapi_scope__*>(pscope);
    if (!scope)
    {
        return;
    }
    if (scope->prev_scope == nullptr)
    {
        auto ctx = scope->ctx;
        auto rt = JS_GetRuntime(ctx);
        while (JS_IsJobPending(rt))
        {
            JSContext *ctx_ = nullptr;
            JS_ExecutePendingJob(rt, &ctx_);
        } 
    }
    scope->pesapi::qjsimpl::pesapi_scope__::~pesapi_scope__();
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    size_t totalSize = sizeof(pesapi::qjsimpl::pesapi_value_ref__) + sizeof(void*) * internal_field_count;
    auto ret = (pesapi_value_ref)malloc(totalSize);
    memset(ret, 0, totalSize);
    JSValue* v = qjsValueFromPesapiValue(pvalue);
    new (ret) pesapi::qjsimpl::pesapi_value_ref__(ctx, *v, internal_field_count);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_value_ref__*>(pvalue_ref);
    ++value_ref->ref_count;
    return pvalue_ref;
}

void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_value_ref__*>(pvalue_ref);
    if (--value_ref->ref_count == 0)
    {
        if (!value_ref->env_life_cycle_tracker.expired())
        {
            value_ref->pesapi::qjsimpl::pesapi_value_ref__::~pesapi_value_ref__();
        }
        free(value_ref);
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_value_ref__*>(pvalue_ref);
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* v = allocValueInCurrentScope(ctx);
    *v = JS_DupValue(ctx, value_ref->value_persistent);
    return pesapiValueFromQjsValue(v);
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_value_ref__*>(pvalue_ref);
    auto ctx = qjsContextFromPesapiEnv(env);
    JS_FreeValue(ctx, value_ref->value_persistent);
}

int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* obj = qjsValueFromPesapiValue(pvalue);
    JSValue* owner = qjsValueFromPesapiValue(powner);
    if (JS_IsObject(*owner))
    {
        JSAtom key = JS_NewAtom(ctx, "_p_i_only_one_child");
        JS_DupValue(ctx, *obj);
        JS_SetProperty(ctx, *owner, key, *obj);
        JS_FreeAtom(ctx, key);
    }
    return true;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return reinterpret_cast<pesapi_env_ref>(value_ref);
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count)
{
    auto value_ref = reinterpret_cast<pesapi::qjsimpl::pesapi_value_ref__*>(pvalue_ref);
    *pinternal_field_count = value_ref->internal_field_count;
    return &value_ref->internal_fields[0];
}

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    auto ret = allocValueInCurrentScope(ctx);
    *ret = JS_GetPropertyStr(ctx, *obj, key);
    return pesapiValueFromQjsValue(ret);
}

void pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    JSValue* val = qjsValueFromPesapiValue(pvalue);
    if (JS_VALUE_HAS_REF_COUNT(*val)) {
        JS_DupValue(ctx, *val);
    }
    JS_SetPropertyStr(ctx, *obj, key, *val);
}

int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    return mapper->GetPrivate(*obj, out_ptr);
}

int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    return mapper->SetPrivate(*obj, ptr);
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    auto ret = allocValueInCurrentScope(ctx);
    *ret = JS_GetPropertyUint32(ctx, *obj, key);
    return pesapiValueFromQjsValue(ret);
}

void pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    JSValue* val = qjsValueFromPesapiValue(pvalue);
    if (JS_VALUE_HAS_REF_COUNT(*val)) {
        JS_DupValue(ctx, *val);
    }
    JS_SetPropertyUint32(ctx, *obj, key, *val);
}

pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* func = qjsValueFromPesapiValue(pfunc);
    JSValue* thisObj = this_object ? qjsValueFromPesapiValue(this_object) : &literal_values_undefined;
    JSValue *js_argv = (JSValue*)alloca(argc * sizeof(JSValue));
    for (int i = 0; i < argc; ++i) {
        js_argv[i] = *qjsValueFromPesapiValue(argv[i]);
    }
    auto rt = JS_GetRuntime(ctx);
    JS_UpdateStackTop(rt);
    JSValue retOrEx = JS_Call(ctx, *func, *thisObj, argc, js_argv);
    if (JS_IsException(retOrEx)) {
        auto scope = getCurrentScope(ctx);
        scope->setCaughtException(JS_GetException(ctx));

        return pesapi_create_undefined(env);
    } else {
        auto ret = allocValueInCurrentScope(ctx);
        *ret = retOrEx;
        return pesapiValueFromQjsValue(ret);
    }
}

pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto rt = JS_GetRuntime(ctx);
    std::vector<char> buff;
    buff.reserve(code_size + 1);
    memcpy(buff.data(), code, code_size);
    buff.data()[code_size] = '\0'; // 尽管JS_Eval传了长度，但如果代码没有以\0结尾，JS_Eval会出现随机错误
    JS_UpdateStackTop(rt);
    JSValue retOrEx = JS_Eval(ctx, (const char *)buff.data(), code_size, path, JS_EVAL_TYPE_GLOBAL);
    if (JS_IsException(retOrEx)) {
        auto scope = getCurrentScope(ctx);
        scope->setCaughtException(JS_GetException(ctx));

        return pesapi_create_undefined(env);
    } else {
        auto ret = allocValueInCurrentScope(ctx);
        *ret = retOrEx;
        return pesapiValueFromQjsValue(ret);
    }
}

pesapi_value pesapi_global(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = allocValueInCurrentScope(ctx);
    *ret = JS_GetGlobalObject(ctx);
    return pesapiValueFromQjsValue(ret);
}

const void* pesapi_get_env_private(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return CppObjectMapper::Get(ctx)->GetEnvPrivate();
}

void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    CppObjectMapper::Get(ctx)->SetEnvPrivate(ptr);
}


int pesapi_trace_native_object_lifecycle(pesapi_env env, 
    pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return CppObjectMapper::Get(ctx)->TraceObjectLifecycle(on_enter, on_exit);
}

void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    CppObjectMapper::Get(ctx)->SetRegistry(reinterpret_cast<puerts::JSClassRegister*>(registry));
}

pesapi_ffi g_pesapi_ffi {
    &pesapi_create_null,
    &pesapi_create_undefined,
    &pesapi_create_boolean,
    &pesapi_create_int32,
    &pesapi_create_uint32,
    &pesapi_create_int64,
    &pesapi_create_uint64,
    &pesapi_create_double,
    &pesapi_create_string_utf8,
    &pesapi_create_string_utf16,
    &pesapi_create_binary,
    &pesapi_create_array,
    &pesapi_create_object,
    &pesapi_create_function,
    &pesapi_create_class,
    &pesapi_get_value_bool,
    &pesapi_get_value_int32,
    &pesapi_get_value_uint32,
    &pesapi_get_value_int64,
    &pesapi_get_value_uint64,
    &pesapi_get_value_double,
    &pesapi_get_value_string_utf8,
    &pesapi_get_value_string_utf16,
    &pesapi_get_value_binary,
    &pesapi_get_array_length,
    &pesapi_is_null,
    &pesapi_is_undefined,
    &pesapi_is_boolean,
    &pesapi_is_int32,
    &pesapi_is_uint32,
    &pesapi_is_int64,
    &pesapi_is_uint64,
    &pesapi_is_double,
    &pesapi_is_string,
    &pesapi_is_object,
    &pesapi_is_function,
    &pesapi_is_binary,
    &pesapi_is_array,
    &pesapi_native_object_to_value,
    &pesapi_get_native_object_ptr,
    &pesapi_get_native_object_typeid,
    &pesapi_is_instance_of,
    &pesapi_boxing,
    &pesapi_unboxing,
    &pesapi_update_boxed_value,
    &pesapi_is_boxed_value,
    &pesapi_get_args_len,
    &pesapi_get_arg,
    &pesapi_get_env,
    &pesapi_get_native_holder_ptr,
    &pesapi_get_native_holder_typeid,
    &pesapi_get_userdata,
    &pesapi_add_return,
    &pesapi_throw_by_string,
    &pesapi_create_env_ref,
    &pesapi_env_ref_is_valid,
    &pesapi_get_env_from_ref,
    &pesapi_duplicate_env_ref,
    &pesapi_release_env_ref,
    &pesapi_open_scope,
    &pesapi_open_scope_placement,
    &pesapi_has_caught,
    &pesapi_get_exception_as_string,
    &pesapi_close_scope,
    &pesapi_close_scope_placement,
    &pesapi_create_value_ref,
    &pesapi_duplicate_value_ref,
    &pesapi_release_value_ref,
    &pesapi_get_value_from_ref,
    &pesapi_set_ref_weak,
    &pesapi_set_owner,
    &pesapi_get_ref_associated_env,
    &pesapi_get_ref_internal_fields,
    &pesapi_get_property,
    &pesapi_set_property,
    &pesapi_get_private,
    &pesapi_set_private,
    &pesapi_get_property_uint32,
    &pesapi_set_property_uint32,
    &pesapi_call_function,
    &pesapi_eval,
    &pesapi_global,
    &pesapi_get_env_private,
    &pesapi_set_env_private,
    &pesapi_trace_native_object_lifecycle,
    &pesapi_set_registry
};

}    // namespace qjsimpl
}    // namespace pesapi