#if defined(__EMSCRIPTEN__)

#include <memory>
#include <string>
#include <vector>
#include "pesapi.h"

namespace pesapi
{
namespace webglimpl
{
    
enum {
    /* all tags with a reference count are negative */
    JS_TAG_FIRST         = -9, /* first negative tag */
    JS_TAG_STRING        = -9,
    JS_TAG_BUFFER        = -8,
    JS_TAG_EXCEPTION     = -7,
    JS_TAG_ARRAY         = -3,
    JS_TAG_FUNCTION      = -2,
    JS_TAG_OBJECT        = -1,
                         
    JS_TAG_INT           = 0,
    JS_TAG_BOOL          = 1,
    JS_TAG_NULL          = 2,
    JS_TAG_UNDEFINED     = 3,
    JS_TAG_UNINITIALIZED = 4,
    JS_TAG_FLOAT64       = 5,
    JS_TAG_INT64         = 6,
    JS_TAG_UINT64        = 7,
};

#define JS_MKVAL(tag, val) (JSValue){ (JSValueUnion){ .int32 = val }, tag, 0 }
#define JS_MKPTR(tag, p)   (JSValue){ (JSValueUnion){ .ptr = p }, tag }

/* special values */
#define JS_NULL      JS_MKVAL(JS_TAG_NULL, 0)
#define JS_UNDEFINED JS_MKVAL(JS_TAG_UNDEFINED, 0)
#define JS_FALSE     JS_MKVAL(JS_TAG_BOOL, 0)
#define JS_TRUE      JS_MKVAL(JS_TAG_BOOL, 1)
#define JS_UNINITIALIZED JS_MKVAL(JS_TAG_UNINITIALIZED, 0)

#define JS_EXCEPTION(str) JS_MKPTR(JS_TAG_EXCEPTION, (void*)str)

#define JS_VALUE_GET_TAG(v) ((int32_t)(v).tag)
#define JS_VALUE_GET_INT(v) ((v).u.int32)
#define JS_VALUE_GET_BOOL(v) ((v).u.int32)
#define JS_VALUE_GET_FLOAT64(v) ((v).u.float64)
#define JS_VALUE_GET_PTR(v) ((v).u.ptr)

#define JS_TAG_IS_FLOAT64(tag) ((unsigned)(tag) == JS_TAG_FLOAT64)

#define SINGLE_ENV (reinterpret_cast<pesapi_env>(1024));
#define SINGLE_ENV_REF (reinterpret_cast<pesapi_env_ref>(2048));

typedef union JSValueUnion {
    int32_t int32;
    double float64;
    int64_t int64;
    uint64_t uint64;
    void *ptr;
    const char *str;
} JSValueUnion;

typedef struct JSValue {
    JSValueUnion u;
    int32_t tag;
    uint32_t len;
} JSValue;
   
struct pesapi_scope__;

pesapi_scope__* g_scope = nullptr;

static pesapi_scope__ *getCurrentScope()
{
	return g_scope;
}

static void setCurrentScope(pesapi_scope__ *scope)
{
	g_scope = scope;
}

struct caught_exception_info
{
    JSValue exception = JS_UNDEFINED;
    std::string message;
};

void JS_FreeValue(JSValue v)
{
    if (v.tag == JS_TAG_STRING || v.tag == JS_TAG_EXCEPTION)
    {
        delete v.u.str;
    }
    if (v.tag == JS_TAG_BUFFER)
    {
        delete (uint8_t *)v.u.ptr;
    }
    v.u.ptr = nullptr;
}

struct pesapi_scope__
{
    const static size_t SCOPE_FIX_SIZE_VALUES_SIZE = 4;
    
    explicit pesapi_scope__()
	{
		prev_scope = getCurrentScope();
		setCurrentScope(this);
		values_used = 0;
		caught = nullptr;
	}

	pesapi_scope__ *prev_scope;

	JSValue values[SCOPE_FIX_SIZE_VALUES_SIZE];

	uint32_t values_used;

	std::vector<JSValue*> dynamic_alloc_values;

	caught_exception_info* caught;

	JSValue *allocValue()
	{
		JSValue *ret;
		if (values_used < SCOPE_FIX_SIZE_VALUES_SIZE)
		{
			ret = &(values[values_used++]);
		}
		else
		{
			ret = (JSValue *) malloc(sizeof(JSValue));
			dynamic_alloc_values.push_back(ret);
		}
		*ret = JS_UNDEFINED;
		return ret;
	}

    void setCaughtException(JSValue exception)
    {
        if (caught == nullptr)
        {
            caught = new caught_exception_info();
        }
        caught->exception = exception;
    }


	~pesapi_scope__()
	{
        if (caught)
        {
            JS_FreeValue(caught->exception);
            delete caught;
        }
		for (size_t i = 0; i < values_used; i++)
		{
            JS_FreeValue(values[i]);
		}

		for (size_t i = 0; i < dynamic_alloc_values.size(); i++)
		{
            JS_FreeValue(*dynamic_alloc_values[i]);
			free(dynamic_alloc_values[i]);
		}
		dynamic_alloc_values.clear();
		setCurrentScope(prev_scope);
	}
};

// 在js构造
struct CallbackInfo {
	JSValue thisVal;
	int argc;
    void* data;
	JSValue res;
    JSValue argv[0];
};

struct ValueRef 
{
    explicit ValueRef(JSValue v, uint32_t field_count)
        : ref_count(1), value_persistent(v), internal_field_count(field_count)
    {
    }
    
    ~ValueRef()
    {
    }

    int ref_count;
    JSValue value_persistent;
    uint32_t internal_field_count;
    void* internal_fields[0];
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "sizeof(pesapi_scope__) > sizeof(pesapi_scope_memory__)");

inline pesapi_value pesapiValueFromQjsValue(JSValue* v)
{
    return reinterpret_cast<pesapi_value>(v);
}

inline JSValue* qjsValueFromPesapiValue(pesapi_value v)
{
    return reinterpret_cast<JSValue*>(v);
}

inline JSValue *allocValueInCurrentScope()
{
	auto scope = getCurrentScope();
	return scope->allocValue();
}

JSValue literal_values_undefined = JS_UNDEFINED;
JSValue literal_values_null = JS_NULL;
JSValue literal_values_true = JS_TRUE;
JSValue literal_values_false = JS_FALSE;

template<typename Func>
pesapi_value pesapi_create_generic0(pesapi_env env, Func createFunc)
{
    (void)env;
    auto ret = allocValueInCurrentScope();
    if (ret)
    {
        *ret = createFunc();
        return pesapiValueFromQjsValue(ret);
    }
    return nullptr;
}

template<typename T, typename Func>
pesapi_value pesapi_create_generic1(pesapi_env env, T value, Func createFunc)
{
    (void)env;
    auto ret = allocValueInCurrentScope();
    if (ret)
    {
        *ret = createFunc(value);
        return pesapiValueFromQjsValue(ret);
    }
    return nullptr;
}

template<typename T1, typename T2, typename Func>
pesapi_value pesapi_create_generic2(pesapi_env env, T1 v1, T2 v2, Func createFunc)
{
    (void)env;
    auto ret = allocValueInCurrentScope();
    if (ret)
    {
        *ret = createFunc(v1, v2);
        return pesapiValueFromQjsValue(ret);
    }
    return nullptr;
}

template<typename T, typename Func>
T pesapi_get_value_generic(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
    (void)env;
    T ret = 0;
    convertFunc(&ret, *(reinterpret_cast<JSValue*>(pvalue)));
    return ret;
}

template<typename Func>
bool pesapi_is_generic(pesapi_env env, pesapi_value pvalue, Func convertFunc)
{
	(void)env;
	return convertFunc(*(reinterpret_cast<JSValue*>(pvalue)));
}

static inline JSValue JS_NewInt32(int32_t val)
{
    return JS_MKVAL(JS_TAG_INT, val);
}

static inline JSValue JS_NewFloat64(double d)
{
    JSValue v;
    v.tag = JS_TAG_FLOAT64;
    v.u.float64 = d;
    return v;
}

static inline JSValue JS_NewInt64(int64_t val)
{
    JSValue v;
    v.tag = JS_TAG_INT64;
    v.u.int64 = val;
    return v;
}

static inline JSValue JS_NewUInt64(uint64_t val)
{
    JSValue v;
    v.tag = JS_TAG_UINT64;
    v.u.uint64 = val;
    return v;
}

static inline JSValue JS_NewUInt32(uint32_t val)
{
    JSValue v;
    if (val <= INT32_MAX) {
        v = JS_NewInt32((int32_t)val);
    } else {
        v = JS_NewFloat64((double)val);
    }
    return v;
}


JSValue JS_NewStringLen(const char *str, uint32_t str_len)
{
    JSValue v;
    v.tag = JS_TAG_STRING;
    v.len = str_len;
    v.u.str = str;
    return v;
}

JSValue JS_NewBufferLen(void *buf, uint32_t buf_len)
{
    JSValue v;
    v.tag = JS_TAG_BUFFER;
    v.len = buf_len;
    v.u.ptr = buf;
    return v;
}

int JS_ToBool(bool *pres, JSValue val)
{
    int32_t tag = JS_VALUE_GET_TAG(val);
    bool ret;
    switch(tag) {
    case JS_TAG_INT:
        ret = JS_VALUE_GET_INT(val) != 0;
        break;
    case JS_TAG_BOOL:
    case JS_TAG_NULL:
    case JS_TAG_UNDEFINED:
        ret = JS_VALUE_GET_INT(val);
        break;
    case JS_TAG_STRING:
        {
            ret = val.len != 0;
        }
        break;
    case JS_TAG_INT64:
    case JS_TAG_UINT64:
        {
            ret = val.u.int64 != 0;
        }
        break;
    default:
        ret = false;
    }
    *pres = ret;
    return 0;
}

typedef union JSFloat64Union {
    double d;
    uint64_t u64;
    uint32_t u32[2];
} JSFloat64Union;

#  define likely(x)       (x)

static int JS_ToInt32(int32_t *pres, JSValue val)
{
    uint32_t tag;
    int32_t ret;

    tag = JS_VALUE_GET_TAG(val);
    switch(tag) {
    case JS_TAG_INT:
    case JS_TAG_BOOL:
    case JS_TAG_NULL:
    case JS_TAG_UNDEFINED:
        ret = JS_VALUE_GET_INT(val);
        break;
    case JS_TAG_FLOAT64:
        {
            JSFloat64Union u;
            double d;
            int e;
            d = JS_VALUE_GET_FLOAT64(val);
            u.d = d;
            /* we avoid doing fmod(x, 2^32) */
            e = (u.u64 >> 52) & 0x7ff;
            if (likely(e <= (1023 + 30))) {
                /* fast case */
                ret = (int32_t)d;
            } else if (e <= (1023 + 30 + 53)) {
                uint64_t v;
                /* remainder modulo 2^32 */
                v = (u.u64 & (((uint64_t)1 << 52) - 1)) | ((uint64_t)1 << 52);
                v = v << ((e - 1023) - 52 + 32);
                ret = v >> 32;
                /* take the sign into account */
                if (u.u64 >> 63)
                    if (ret != INT32_MIN)
                        ret = -ret;
            } else {
                ret = 0; /* also handles NaN and +inf */
            }
        }
        break;
        
    case JS_TAG_INT64:
    case JS_TAG_UINT64:
        {
            ret = (int)val.u.int64;
        }
        break;
    default:
        return -1;
    }
    *pres = ret;
    return 0;
}

static inline int JS_ToUint32(uint32_t *pres, JSValue val)
{
    return JS_ToInt32((int32_t*)pres, val);
}

static inline int JS_ToInt64(int64_t *pres, JSValue val)
{
    uint32_t tag = JS_VALUE_GET_TAG(val);
    if (tag == JS_TAG_INT64 || tag == JS_TAG_UINT64) {
        *pres = val.u.int64;
        return 0;
    } else {
        return -1;
    }
}

static inline int JS_ToUint64(uint64_t *pres, JSValue val)
{
    return JS_ToInt64((int64_t*)pres, val);
}

static inline int JS_ToFloat64(double *pres, JSValue val)
{
    uint32_t tag = JS_VALUE_GET_TAG(val);
    if (tag <= JS_TAG_NULL) {
        *pres = JS_VALUE_GET_INT(val);
    } else if (JS_TAG_IS_FLOAT64(tag)) {
        *pres = JS_VALUE_GET_FLOAT64(val);
    } else if (tag == JS_TAG_INT64) {
        *pres = val.u.int64;
    } else if (tag == JS_TAG_UINT64) {
        *pres = val.u.uint64;
    } else {
        return -1;
    }
    return 0;
}

static inline bool JS_IsNumber(JSValue val)
{
    uint32_t tag = JS_VALUE_GET_TAG(val);
    return tag == JS_TAG_INT || JS_TAG_IS_FLOAT64(tag);
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
    return pesapi_create_generic1(env, value, JS_NewUInt32);
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    return pesapi_create_generic1(env, value, JS_NewInt64);
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    return pesapi_create_generic1(env, value, JS_NewUInt64);
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    return pesapi_create_generic1(env, value, JS_NewFloat64);
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char *str, size_t length)
{
    return pesapi_create_generic2(env, str, length, JS_NewStringLen);
}

pesapi_value pesapi_create_binary(pesapi_env env, void *bin, size_t length)
{
    return pesapi_create_generic2(env, bin, length, JS_NewBufferLen);
}

pesapi_value pesapi_create_array(pesapi_env env)
{
    return {};
}

// js那处理，返回index，然后存在JSValue返回
// TODO
pesapi_value pesapi_create_object(pesapi_env env)
{
    return {};
}

// TODO
pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    return {};
}

// TODO
pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    return {};
}

bool pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<bool>(env, pvalue, JS_ToBool);
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
    return pesapi_get_value_generic<int64_t>(env, pvalue, JS_ToInt64);
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<uint64_t>(env, pvalue, JS_ToUint64);
}

double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_get_value_generic<double>(env, pvalue, JS_ToFloat64);
}


const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    auto jsvalue = *(reinterpret_cast<JSValue*>(pvalue));
    if (JS_TAG_STRING == JS_VALUE_GET_TAG(jsvalue) && bufsize)
    {
        *bufsize = jsvalue.len;
        if (buf != nullptr)
        {
            strncpy(buf, jsvalue.u.str, *bufsize);
        }
    }
	return buf;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto jsvalue = *(reinterpret_cast<JSValue*>(pvalue));
    if (JS_TAG_BUFFER == JS_VALUE_GET_TAG(jsvalue) && bufsize)
    {
        *bufsize = jsvalue.len;
        return jsvalue.u.ptr;
    }
	return nullptr;
}

// TODO
uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
	return 0;
}

bool pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_NULL;
    });
}

bool pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_UNDEFINED;
    });
}

bool pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_BOOL;
    });
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
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_INT64;
    });
}

bool pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_UINT64;
    });
}

bool pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, JS_IsNumber);
}

bool pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_STRING;
    });
}

bool pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_OBJECT;
    });
}

bool pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_FUNCTION;
    });
}

bool pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_BUFFER;
    });
}

bool pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    return pesapi_is_generic(env, pvalue, [](JSValue val) -> bool {
        return JS_VALUE_GET_TAG(val) == JS_TAG_ARRAY;
    });
}

// TODO
pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, bool call_finalize)
{
    return {};
}

// TODO
void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    return {};
}

// TODO
const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    return {};
}

// TODO
bool pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    return false;
}

// TODO
pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    return {};
}

// TODO
pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    return {};
}

// TODO
void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
}

bool pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return pesapi_is_object(env, value);
}

int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    return info->argc;
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
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
    return SINGLE_ENV;
}

pesapi_value pesapi_get_this(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    return pesapiValueFromQjsValue(&(info->thisVal));
}

pesapi_value pesapi_get_holder(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    return pesapiValueFromQjsValue(&(info->thisVal));
}

void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    return info->data;
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    info->res = *qjsValueFromPesapiValue(value);
}

// 由js处理
//void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
//{
//    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
//    info->res = JS_EXCEPTION(nullptr);
//}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    return SINGLE_ENV_REF;
}

bool pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    return true; // valid forever
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    return SINGLE_ENV;
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref)
{
    return penv_ref;
}

void pesapi_release_env_ref(pesapi_env_ref penv_ref)
{
}

//pesapi_open_scope_func g_js_open_scope = nullptr;
pesapi_open_scope_placement_func g_js_open_scope_placement = nullptr;

pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto ret = new pesapi::webglimpl::pesapi_scope__();
    if (g_js_open_scope_placement)
    {
        g_js_open_scope_placement(penv_ref, (struct pesapi_scope_memory *)ret);
    }
    return reinterpret_cast<pesapi_scope>(ret);
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) pesapi::webglimpl::pesapi_scope__();
    if (g_js_open_scope_placement)
    {
        g_js_open_scope_placement(penv_ref, memory);
    }
    return reinterpret_cast<pesapi_scope>(memory);
}

bool pesapi_has_caught(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi::webglimpl::pesapi_scope__*>(pscope);
    return scope->caught != nullptr;
}

//TODO
const char* pesapi_get_exception_as_string(pesapi_scope pscope, bool with_stack)
{
    auto scope = reinterpret_cast<pesapi::webglimpl::pesapi_scope__*>(pscope);
    if (scope->caught != nullptr)
    {
    }
    return nullptr;
}

//pesapi_close_scope_func g_js_close_scope;
pesapi_close_scope_placement_func g_js_close_scope_placement = nullptr;

void pesapi_close_scope(pesapi_scope pscope)
{
    if (g_js_close_scope_placement)
    {
        g_js_close_scope_placement(pscope);
    }
    auto scope = reinterpret_cast<pesapi::webglimpl::pesapi_scope__*>(pscope);
    if (!scope)
    {
        return;
    }
    delete scope;
}

void pesapi_close_scope_placement(pesapi_scope pscope)
{
    if (g_js_close_scope_placement)
    {
        g_js_close_scope_placement(pscope);
    }
    auto scope = reinterpret_cast<pesapi::webglimpl::pesapi_scope__*>(pscope);
    if (!scope)
    {
        return;
    }
    scope->pesapi::webglimpl::pesapi_scope__::~pesapi_scope__();
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    size_t totalSize = sizeof(ValueRef) + sizeof(void*) * internal_field_count;
    auto ret = (pesapi_value_ref)malloc(totalSize);
    memset(ret, 0, totalSize);
    // TODO: call unref of js
    JSValue* v = qjsValueFromPesapiValue(pvalue);
    new (ret) ValueRef(*v, internal_field_count);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    ++value_ref->ref_count;
    return pvalue_ref;
}

void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    if (--value_ref->ref_count == 0)
    {
        // TODO: call unref of js
        value_ref->~ValueRef();
        free(value_ref);
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    JSValue* v = allocValueInCurrentScope();
    *v = value_ref->value_persistent;
    return pesapiValueFromQjsValue(v);
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    // TODO: call unref of js
}

bool pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    return false;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return SINGLE_ENV_REF;
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    *pinternal_field_count = value_ref->internal_field_count;
    return &value_ref->internal_fields[0];
}

// TODO
pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    return {};
}

// TODO
void pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
}

// TODO
bool pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    return {};
}

// TODO
bool pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    return false;
}

// TODO
pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    return {};
}

// TODO
void pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    
}

// TODO
pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    return {};
}

// TODO
pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    return {};
}

// TODO
pesapi_value pesapi_global(pesapi_env env)
{
    return {};
}

const void* g_env_private = nullptr;

const void* pesapi_get_env_private(pesapi_env env)
{
    return g_env_private;
}

void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    g_env_private = ptr;
}

} // webglimpl
} // pesapi

extern "C"
{
    void DoInjectPapi(struct pesapi_ffi* api)
    {
        api->open_scope = &pesapi::webglimpl::pesapi_open_scope;
        
        pesapi::webglimpl::g_js_open_scope_placement= api->open_scope_placement;
        api->open_scope_placement = &pesapi::webglimpl::pesapi_open_scope_placement;
        
        api->close_scope = &pesapi::webglimpl::pesapi_close_scope;
        
        pesapi::webglimpl::g_js_close_scope_placement = api->close_scope_placement;
        api->close_scope_placement = &pesapi::webglimpl::pesapi_close_scope_placement;
        
        api->get_env_from_ref = &pesapi::webglimpl::pesapi_get_env_from_ref;
        
        api->get_env_private = &pesapi::webglimpl::pesapi_get_env_private;
        api->set_env_private = &pesapi::webglimpl::pesapi_set_env_private;
    }
}

#endif
