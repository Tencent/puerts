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
        convertFunc(ctx, &ret, pvalue->v);
        return ret;
    }
    return 0;
}

template<typename Func>
bool pesapi_is_generic(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
	auto ctx = qjsContextFromPesapiEnv(env);
	if (ctx != nullptr)
	{
		return convertFunc(pvalue->v);
	}
	return false;
}

template<typename Func>
bool pesapi_is_generic_ctx(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
	auto ctx = qjsContextFromPesapiEnv(env);
	if (ctx != nullptr)
	{
		return convertFunc(ctx, pvalue->v);
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

pesapi_value pesapi_create_boolean(pesapi_env env, bool value)
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

static JSValue JS_NewArrayBufferWrap(JSContext *ctx, void *bin, size_t len)
{
    return JS_NewArrayBuffer(ctx, (uint8_t *) bin, len, nullptr, nullptr, false);
}

pesapi_value pesapi_create_binary(pesapi_env env, void *bin, size_t length)
{
    return pesapi_create_generic2(env, bin, length, JS_NewArrayBufferWrap);
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

int JS_ToBool2(JSContext *ctx, bool *pres, JSValue val)
{
    int res = JS_ToBool(ctx, val);
    if (res != -1)
    {
        *pres = (bool)res;
    }
    return res;
}

bool pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<bool>(env, pvalue, JS_ToBool2);
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
		if (buf == nullptr)
		{
			auto ret = JS_ToCString(ctx, pvalue->v); // TODO: 优化
			if (ret)
			{
				*bufsize = strlen(ret);
				JS_FreeCString(ctx, ret);
			}
		}
		else
		{
			auto ret = JS_ToCStringLen(ctx, bufsize, pvalue->v);
			if (ret)
			{
				strcpy(buf, ret);
				JS_FreeCString(ctx, ret);
			}
		}
	}
	return buf;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
	if (ctx != nullptr)
	{
		if (JS_IsArrayBuffer(pvalue->v))
		{
			return JS_GetArrayBuffer(ctx, bufsize, pvalue->v);
		}
		if (JS_IsArrayBufferView(pvalue->v))
        {
            size_t byte_offset;
            size_t byte_length;
            size_t bytes_per_element;
            JS_GetArrayBufferViewInfo(ctx, pvalue->v, &byte_offset, &byte_length, &bytes_per_element);
            JSValue ab = JS_GetArrayBufferView(ctx, pvalue->v);
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
		auto len = JS_GetProperty(ctx, pvalue->v, JS_ATOM_length);
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

bool pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNull);
}

bool pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsUndefined);
}

bool pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsBool);
}

bool pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

bool pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

bool pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsBigInt);
}

bool pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsBigInt);
}

bool pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

bool pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsString);
}

bool pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsObject);
}

bool pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsFunction);
}

bool pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> JS_BOOL {
        return JS_IsArrayBuffer(val) || JS_IsArrayBufferView(val);
    });
}

bool pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic_ctx(env, pvalue, JS_IsArray);
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, bool call_finalize)
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

bool pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
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

bool pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return pesapi_is_object(env, value);
}

int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    return pinfo->argc;
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    if (index >= 0 && index < pinfo->argc)
    {
        return pesapiValueFromQjsValue(&(pinfo->argv[index]));
    }
    else
    {
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
}

pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    return pesapiEnvFromQjsContext(pinfo->ctx);
}

pesapi_value pesapi_get_this(pesapi_callback_info pinfo)
{
    return pesapiValueFromQjsValue(&(pinfo->this_val));
}

pesapi_value pesapi_get_holder(pesapi_callback_info pinfo)
{
    return pesapiValueFromQjsValue(&(pinfo->this_val));
}

void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    return pinfo->data;
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    pinfo->res = *qjsValueFromPesapiValue(value);
    if (JS_VALUE_HAS_REF_COUNT(pinfo->res)) {
        JS_DupValue(pinfo->ctx, pinfo->res);
    }

}

void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    pinfo->res = JS_EXCEPTION;
	pinfo->ex = JS_NewError(pinfo->ctx);
	JS_DefinePropertyValue(pinfo->ctx, pinfo->ex, JS_ATOM_message, JS_NewString(pinfo->ctx, msg),
						   JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = (pesapi_env_ref)malloc(sizeof(pesapi_env_ref__));
    memset(ret, 0, sizeof(pesapi_env_ref__));
    new (ret) pesapi_env_ref__(ctx);
    return ret;
}

bool pesapi_env_ref_is_valid(pesapi_env_ref env_ref)
{
    return !env_ref->env_life_cycle_tracker.expired();
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref env_ref)
{
    if (env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    return pesapiEnvFromQjsContext(env_ref->context_persistent);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref env_ref)
{
    ++env_ref->ref_count;
    return env_ref;
}

void pesapi_release_env_ref(pesapi_env_ref env_ref)
{
    if (--env_ref->ref_count == 0)
    {
        if (!env_ref->env_life_cycle_tracker.expired())
        {
            env_ref->~pesapi_env_ref__();
        }
        free(env_ref);
    }
}

pesapi_scope pesapi_open_scope(pesapi_env_ref env_ref)
{
    if (env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    pesapi_scope ret = static_cast<pesapi_scope>(malloc(sizeof(pesapi_scope__)));
    memset(ret, 0, sizeof(pesapi_scope__));
    new (ret) pesapi_scope__(env_ref->context_persistent);
    return ret;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory)
{
    if (env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) pesapi_scope__(env_ref->context_persistent);
    return reinterpret_cast<pesapi_scope>(memory);
}

bool pesapi_has_caught(pesapi_scope scope)
{
    return scope->caught != nullptr;
}

const char* pesapi_get_exception_as_string(pesapi_scope scope, bool with_stack)
{
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
            JSValue stackVal = JS_GetProperty(ctx, scope->caught->exception, JS_ATOM_stack);
            auto stack = JS_ToCString(ctx, stackVal);
            scope->caught->message += "\n";
            scope->caught->message += stack;
            JS_FreeCString(ctx, stack);
            JS_FreeValue(ctx, stackVal);
        }
        return scope->caught->message.c_str();
    }
    return nullptr;
}

void pesapi_close_scope(pesapi_scope scope)
{
    if (!scope)
    {
        return;
    }
    scope->~pesapi_scope__();
    free(scope);
}

void pesapi_close_scope_placement(pesapi_scope scope)
{
    if (!scope)
    {
        return;
    }
    scope->~pesapi_scope__();
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    size_t totalSize = sizeof(pesapi_value_ref__) + sizeof(void*) * internal_field_count;
    auto ret = (pesapi_value_ref)malloc(totalSize);
    memset(ret, 0, totalSize);
    JSValue* v = qjsValueFromPesapiValue(pvalue);
    new (ret) pesapi_value_ref__(ctx, *v, internal_field_count);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref value_ref)
{
    ++value_ref->ref_count;
    return value_ref;
}

void pesapi_release_value_ref(pesapi_value_ref value_ref)
{
    if (--value_ref->ref_count == 0)
    {
        if (!value_ref->env_life_cycle_tracker.expired())
        {
            value_ref->~pesapi_value_ref__();
        }
        free(value_ref);
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue* v = allocValueInCurrentScope(ctx);
    *v = JS_DupValue(ctx, value_ref->value_persistent);
    return pesapiValueFromQjsValue(v);
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref value_ref)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JS_FreeValue(ctx, value_ref->value_persistent);
}

bool pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
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
    return value_ref;
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count)
{
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

bool pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    JSValue* obj = qjsValueFromPesapiValue(pobject);
    return mapper->GetPrivate(*obj, out_ptr);
}

bool pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
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
    JS_UpdateStackTop(rt);
    JSValue retOrEx = JS_Eval(ctx, (const char *)code, code_size, path, JS_EVAL_TYPE_GLOBAL);
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
    &pesapi_get_this,
    &pesapi_get_holder,
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
    &pesapi_set_env_private
};

}    // namespace qjsimpl
}    // namespace pesapi