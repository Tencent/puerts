#if defined(__EMSCRIPTEN__)

#include <emscripten.h>
#include <memory>
#include <string>
#include <vector>
#include "pesapi.h"
#include "vm/Class.h"

using namespace il2cpp::vm;

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
    JS_TAG_NATIVE_OBJECT = -4,
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
#define JS_MKPTR(tag, p)   (JSValue){ (JSValueUnion){ .ptr = p }, tag, 0 }

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

typedef struct String {
    char *ptr;
    uint32_t len;
} String;

typedef struct Buffer {
    void *ptr;
    uint32_t len;
} Buffer;

typedef struct NativeObject {
    void *objId;
    const void *typeId;
} NativeObject;

typedef union JSValueUnion {
    int32_t int32;
    double float64;
    int64_t int64;
    uint64_t uint64;
    void *ptr;
    String str;
    Buffer buf;
    NativeObject nto;
} JSValueUnion;

typedef struct JSValue {
    JSValueUnion u;
    int32_t tag;
    int need_free;
} JSValue;

static_assert(sizeof(void*) == 4, "just support wasm32");
   
struct WebGlScope;

WebGlScope* g_scope = nullptr;

static WebGlScope *getCurrentScope()
{
	return g_scope;
}

static void setCurrentScope(WebGlScope *scope)
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
    if (v.need_free)
    {
        if (v.tag == JS_TAG_STRING || v.tag == JS_TAG_EXCEPTION)
        {
            delete v.u.str.ptr;
        }
        if (v.tag == JS_TAG_BUFFER)
        {
            delete (uint8_t *)v.u.buf.ptr;
        }
    }
    v.u.ptr = nullptr;
}

struct WebGlScope
{
    const static size_t SCOPE_FIX_SIZE_VALUES_SIZE = 4;
    
    explicit WebGlScope()
	{
		prev_scope = getCurrentScope();
		setCurrentScope(this);
		values_used = 0;
		caught = nullptr;
	}

	WebGlScope *prev_scope;

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


	~WebGlScope()
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
    //JSValue thisVal;
	void* thisPtr;
	int argc;
    void* data;
    void* thisTypeId;
	JSValue res;
    JSValue argv[0];
};

struct ValueRef 
{
    explicit ValueRef(void* p, uint32_t field_count)
        : ref_count(1), ptr(p), internal_field_count(field_count)
    {
    }
    
    ~ValueRef()
    {
    }

    int ref_count;
    void* ptr;
    uint32_t internal_field_count;
    void* internal_fields[0];
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(WebGlScope), "sizeof(WebGlScope) > sizeof(pesapi_scope_memory__)");

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
    *ret = createFunc();
    return pesapiValueFromQjsValue(ret);
}

template<typename T, typename Func>
pesapi_value pesapi_create_generic1(pesapi_env env, T value, Func createFunc)
{
    (void)env;
    auto ret = allocValueInCurrentScope();
    *ret = createFunc(value);
    return pesapiValueFromQjsValue(ret);
}

template<typename T1, typename T2, typename Func>
pesapi_value pesapi_create_generic2(pesapi_env env, T1 v1, T2 v2, Func createFunc)
{
    (void)env;
    auto ret = allocValueInCurrentScope();
    *ret = createFunc(v1, v2);
    return pesapiValueFromQjsValue(ret);
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
    v.u.str.len = str_len;
    v.u.str.ptr = (char*)malloc(str_len);
    strncpy((char*)v.u.str.ptr, str, str_len);
    v.need_free = true;
    return v;
}

JSValue JS_NewBufferLen(void *buf, uint32_t buf_len)
{
    JSValue v;
    v.tag = JS_TAG_BUFFER;
    v.u.buf.len = buf_len;
    v.u.buf.ptr = buf;
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
            ret = val.u.str.len != 0;
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


pesapi_create_array_func g_js_create_array;
pesapi_value pesapi_create_array(pesapi_env env)
{
    auto ret = allocValueInCurrentScope();
    *ret = JS_MKPTR(JS_TAG_ARRAY, g_js_create_array(env));
    return pesapiValueFromQjsValue(ret);
}

pesapi_create_object_func g_js_create_object;
pesapi_value pesapi_create_object(pesapi_env env)
{
    auto ret = allocValueInCurrentScope();
    *ret = JS_MKPTR(JS_TAG_OBJECT, g_js_create_object(env));
    return pesapiValueFromQjsValue(ret);
}

pesapi_create_function_func g_js_create_function = nullptr;
pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto ret = allocValueInCurrentScope();
    *ret = JS_MKPTR(JS_TAG_FUNCTION, g_js_create_function(env, native_impl, data, finalize));
    return pesapiValueFromQjsValue(ret);
}

pesapi_create_class_func g_js_create_class;
pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto ret = allocValueInCurrentScope();
    *ret = JS_MKPTR(JS_TAG_FUNCTION, g_js_create_class(env, type_id));
    return pesapiValueFromQjsValue(ret);
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
        *bufsize = jsvalue.u.str.len;
        if (buf != nullptr)
        {
            strncpy(buf, jsvalue.u.str.ptr, *bufsize);
        }
    }
	return buf;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto jsvalue = *(reinterpret_cast<JSValue*>(pvalue));
    if (JS_TAG_BUFFER == JS_VALUE_GET_TAG(jsvalue) && bufsize)
    {
        *bufsize = jsvalue.u.buf.len;
        return jsvalue.u.buf.ptr;
    }
	return nullptr;
}

// 由js处理
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

pesapi_native_object_to_value_func g_js_native_object_to_value;

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, bool call_finalize)
{
    auto ret = allocValueInCurrentScope();
    *ret = JS_MKPTR(JS_TAG_NATIVE_OBJECT, g_js_native_object_to_value(env, type_id, object_ptr, call_finalize));
    ret->u.nto.typeId = type_id;
    return pesapiValueFromQjsValue(ret);
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto jsvalue = *(reinterpret_cast<JSValue*>(pvalue));
    return (jsvalue.tag == JS_TAG_NATIVE_OBJECT) ? jsvalue.u.nto.objId : nullptr;
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    auto jsvalue = *(reinterpret_cast<JSValue*>(pvalue));
    return (jsvalue.tag == JS_TAG_NATIVE_OBJECT) ? jsvalue.u.nto.typeId : nullptr;
}

bool pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    Il2CppClass* klass = (Il2CppClass*)type_id;
    Il2CppClass* objClass = (Il2CppClass*) pesapi_get_native_object_typeid(env, pvalue);
    return objClass ? Class::IsAssignableFrom(klass, objClass) : false;
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key);
void pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue);

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    pesapi_value arr = pesapi_create_array(env);
    pesapi_set_property_uint32(env, arr, 0, pvalue);
    return arr;
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    return pesapi_get_property_uint32(env, p_boxed_value, 0);
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
    pesapi_set_property_uint32(env, p_boxed_value, 0, pvalue);
}

bool pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return pesapi_is_array(env, value);
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

void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    return info->thisPtr;
}


const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<CallbackInfo*>(pinfo);
    return info->thisTypeId;
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

// implement by js
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
    auto ret = new WebGlScope();
    if (g_js_open_scope_placement)
    {
        g_js_open_scope_placement(penv_ref, (struct pesapi_scope_memory *)ret);
    }
    return reinterpret_cast<pesapi_scope>(ret);
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) WebGlScope();
    if (g_js_open_scope_placement)
    {
        g_js_open_scope_placement(penv_ref, memory);
    }
    return reinterpret_cast<pesapi_scope>(memory);
}

bool pesapi_has_caught(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<WebGlScope*>(pscope);
    return scope->caught != nullptr;
}

// implement by js
const char* pesapi_get_exception_as_string(pesapi_scope pscope, bool with_stack)
{
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
    auto scope = reinterpret_cast<WebGlScope*>(pscope);
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
    auto scope = reinterpret_cast<WebGlScope*>(pscope);
    if (!scope)
    {
        return;
    }
    scope->~WebGlScope();
}

pesapi_create_value_ref_func g_js_create_value_ref;

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    size_t totalSize = sizeof(ValueRef) + sizeof(void*) * internal_field_count;
    auto ret = (pesapi_value_ref)malloc(totalSize);
    memset(ret, 0, totalSize);
    new (ret) ValueRef(g_js_create_value_ref(env, pvalue, internal_field_count), internal_field_count);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    ++value_ref->ref_count;
    return pvalue_ref;
}

pesapi_release_value_ref_func g_js_release_value_ref;
void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    if (--value_ref->ref_count == 0)
    {
        g_js_release_value_ref((pesapi_value_ref)(value_ref->ptr));
        value_ref->~ValueRef();
        free(value_ref);
    }
}

typedef void (*pesapi_js_get_value_from_ref_func)(pesapi_env env, void* ptr, JSValue* pvalue);
pesapi_js_get_value_from_ref_func g_js_get_value_from_ref_func;

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    JSValue* v = allocValueInCurrentScope();
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    g_js_get_value_from_ref_func(env, value_ref->ptr, v);
    return pesapiValueFromQjsValue(v);
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<ValueRef*>(pvalue_ref);
    g_js_release_value_ref((pesapi_value_ref)(value_ref->ptr));
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

typedef void (*pesapi_js_get_property_func)(pesapi_env env, pesapi_value object, const char* key, JSValue* pvalue);
pesapi_js_get_property_func g_js_get_property;
pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto ret = allocValueInCurrentScope();
    g_js_get_property(env, pobject, key, ret);
    return pesapiValueFromQjsValue(ret);
}

// implement by js
//void pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
//{
//}

// implement by js
bool pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    return {};
}

// implement by js
bool pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    return false;
}

typedef void (*pesapi_js_get_property_uint32_func)(pesapi_env env, pesapi_value object, uint32_t key, JSValue* pvalue);
pesapi_js_get_property_uint32_func g_js_get_property_uint32;
pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    auto ret = allocValueInCurrentScope();
    g_js_get_property_uint32(env, pobject, key, ret);
    return pesapiValueFromQjsValue(ret);
}

// 由js实现，但其它api需要调用
pesapi_set_property_uint32_func g_js_set_property_uint32;
void pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    g_js_set_property_uint32(env, pobject, key, pvalue);
}

typedef void (*pesapi_js_call_function_func)(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[], JSValue* presult);

pesapi_js_call_function_func g_js_call_function;

pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    auto ret = allocValueInCurrentScope();
    g_js_call_function(env, pfunc, this_object, argc, argv, ret);
    return pesapiValueFromQjsValue(ret);
}

// js和pesapi.h声明不一样，js改为返回值指针由调用者（原生）传入
typedef void (*pesapi_js_eval_func)(pesapi_env env, const uint8_t* code, size_t code_size, const char* path, JSValue* result);
pesapi_js_eval_func g_js_eval = nullptr;
pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto ret = allocValueInCurrentScope();
    g_js_eval(env, code, code_size, path, ret);
    return pesapiValueFromQjsValue(ret);
}

pesapi_global_func g_js_global = nullptr;

pesapi_value pesapi_global(pesapi_env env)
{
    auto ret = allocValueInCurrentScope();
    *ret = JS_MKPTR(JS_TAG_OBJECT, g_js_global(env));
    return pesapiValueFromQjsValue(ret);
}

const void* g_env_private = nullptr;

const void* pesapi_get_env_private(pesapi_env env)
{
    return g_env_private;
}

pesapi_set_env_private_func g_js_set_env_private;
void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    g_env_private = ptr;
    // notify js
    g_js_set_env_private(env, ptr);
}

} // webglimpl
} // pesapi

extern "C"
{
    void EMSCRIPTEN_KEEPALIVE InjectPapiGLNativeImpl(struct pesapi_ffi* api)
    {
        api->open_scope = &pesapi::webglimpl::pesapi_open_scope;
        
        pesapi::webglimpl::g_js_open_scope_placement= api->open_scope_placement;
        api->open_scope_placement = &pesapi::webglimpl::pesapi_open_scope_placement;
        
        api->close_scope = &pesapi::webglimpl::pesapi_close_scope;
        
        pesapi::webglimpl::g_js_close_scope_placement = api->close_scope_placement;
        api->close_scope_placement = &pesapi::webglimpl::pesapi_close_scope_placement;
        
        api->get_env_from_ref = &pesapi::webglimpl::pesapi_get_env_from_ref;
        
        api->get_env_private = &pesapi::webglimpl::pesapi_get_env_private;
        pesapi::webglimpl::g_js_set_env_private = api->set_env_private;
        api->set_env_private = &pesapi::webglimpl::pesapi_set_env_private;
        
        pesapi::webglimpl::g_js_global = api->global;
        api->global = &pesapi::webglimpl::pesapi_global;
        
        pesapi::webglimpl::g_js_native_object_to_value = api->native_object_to_value;
        api->native_object_to_value = &pesapi::webglimpl::pesapi_native_object_to_value;
        api->get_native_object_ptr = &pesapi::webglimpl::pesapi_get_native_object_ptr;
        api->get_native_object_typeid = &pesapi::webglimpl::pesapi_get_native_object_typeid;
        
        //api->get_args_len = &pesapi::webglimpl:::pesapi_get_args_len;
        api->get_args_len = &pesapi::webglimpl::pesapi_get_args_len;
        api->get_arg = &pesapi::webglimpl::pesapi_get_arg;
        api->get_env = &pesapi::webglimpl::pesapi_get_env;
        api->get_native_holder_ptr = &pesapi::webglimpl::pesapi_get_native_holder_ptr;
        api->get_native_holder_typeid = &pesapi::webglimpl::pesapi_get_native_holder_typeid;
        api->get_userdata = &pesapi::webglimpl::pesapi_get_userdata;
        api->add_return = &pesapi::webglimpl::pesapi_add_return;
        
        api->is_null = &pesapi::webglimpl::pesapi_is_null;
        api->is_undefined = &pesapi::webglimpl::pesapi_is_undefined;
        api->is_boolean = &pesapi::webglimpl::pesapi_is_boolean;
        api->is_int32 = &pesapi::webglimpl::pesapi_is_int32;
        api->is_uint32 = &pesapi::webglimpl::pesapi_is_uint32;
        api->is_int64 = &pesapi::webglimpl::pesapi_is_int64;
        api->is_uint64 = &pesapi::webglimpl::pesapi_is_uint64;
        api->is_double = &pesapi::webglimpl::pesapi_is_double;
        api->is_string = &pesapi::webglimpl::pesapi_is_string;
        api->is_object = &pesapi::webglimpl::pesapi_is_object;
        api->is_function = &pesapi::webglimpl::pesapi_is_function;
        api->is_binary = &pesapi::webglimpl::pesapi_is_binary;
        api->is_array = &pesapi::webglimpl::pesapi_is_array;
        
        
        api->get_value_bool = &pesapi::webglimpl::pesapi_get_value_bool;
        api->get_value_int32 = &pesapi::webglimpl::pesapi_get_value_int32;
        api->get_value_uint32 = &pesapi::webglimpl::pesapi_get_value_uint32;
        api->get_value_int64 = &pesapi::webglimpl::pesapi_get_value_int64;
        api->get_value_uint64 = &pesapi::webglimpl::pesapi_get_value_uint64;
        api->get_value_double = &pesapi::webglimpl::pesapi_get_value_double;
        api->get_value_string_utf8 = &pesapi::webglimpl::pesapi_get_value_string_utf8;
        api->get_value_binary = &pesapi::webglimpl::pesapi_get_value_binary;
        
        api->create_null = &pesapi::webglimpl::pesapi_create_null;
        api->create_undefined = &pesapi::webglimpl::pesapi_create_undefined;
        api->create_boolean = &pesapi::webglimpl::pesapi_create_boolean;
        api->create_int32 = &pesapi::webglimpl::pesapi_create_int32;
        api->create_uint32 = &pesapi::webglimpl::pesapi_create_uint32;
        api->create_int64 = &pesapi::webglimpl::pesapi_create_int64;
        api->create_uint64 = &pesapi::webglimpl::pesapi_create_uint64;
        api->create_double = &pesapi::webglimpl::pesapi_create_double;
        api->create_string_utf8 = &pesapi::webglimpl::pesapi_create_string_utf8;
        api->create_binary = &pesapi::webglimpl::pesapi_create_binary;
        
        pesapi::webglimpl::g_js_create_array = api->create_array;
        api->create_array = &pesapi::webglimpl::pesapi_create_array;
        pesapi::webglimpl::g_js_create_object = api->create_object;
        api->create_object = &pesapi::webglimpl::pesapi_create_object;
        pesapi::webglimpl::g_js_create_function = api->create_function;
        api->create_function = &pesapi::webglimpl::pesapi_create_function;
        pesapi::webglimpl::g_js_create_class = api->create_class;
        api->create_class = &pesapi::webglimpl::pesapi_create_class;
        
        pesapi::webglimpl::g_js_eval = (pesapi::webglimpl::pesapi_js_eval_func)api->eval;
        api->eval = &pesapi::webglimpl::pesapi_eval;
        
        pesapi::webglimpl::g_js_call_function = (pesapi::webglimpl::pesapi_js_call_function_func)api->call_function;
        api->call_function = &pesapi::webglimpl::pesapi_call_function;
        
        pesapi::webglimpl::g_js_get_property = (pesapi::webglimpl::pesapi_js_get_property_func)api->get_property;
        api->get_property = &pesapi::webglimpl::pesapi_get_property;
        
        pesapi::webglimpl::g_js_get_property_uint32 = (pesapi::webglimpl::pesapi_js_get_property_uint32_func)api->get_property_uint32;
        api->get_property_uint32 = &pesapi::webglimpl::pesapi_get_property_uint32;
        
        
        pesapi::webglimpl::g_js_create_value_ref = api->create_value_ref;
        api->create_value_ref = &pesapi::webglimpl::pesapi_create_value_ref;
        
        api->duplicate_value_ref = &pesapi::webglimpl::pesapi_duplicate_value_ref;
        
        pesapi::webglimpl::g_js_release_value_ref = api->release_value_ref;
        api->release_value_ref = &pesapi::webglimpl::pesapi_release_value_ref;
        
        pesapi::webglimpl::g_js_get_value_from_ref_func = (pesapi::webglimpl::pesapi_js_get_value_from_ref_func)api->get_value_from_ref;
        api->get_value_from_ref = &pesapi::webglimpl::pesapi_get_value_from_ref;
        
        api->get_ref_internal_fields = &pesapi::webglimpl::pesapi_get_ref_internal_fields;
        
        api->get_ref_associated_env = &pesapi::webglimpl::pesapi_get_ref_associated_env;
        
        api->create_env_ref = &pesapi::webglimpl::pesapi_create_env_ref;
        api->env_ref_is_valid = &pesapi::webglimpl::pesapi_env_ref_is_valid;
        api->get_env_from_ref = &pesapi::webglimpl::pesapi_get_env_from_ref;
        api->duplicate_env_ref = &pesapi::webglimpl::pesapi_duplicate_env_ref;
        api->release_env_ref = &pesapi::webglimpl::pesapi_release_env_ref;
        
        pesapi::webglimpl::g_js_set_property_uint32 = api->set_property_uint32;
        
        api->is_instance_of = &pesapi::webglimpl::pesapi_is_instance_of;
        
        api->boxing = &pesapi::webglimpl::pesapi_boxing;
        api->unboxing = &pesapi::webglimpl::pesapi_unboxing;
        api->update_boxed_value = &pesapi::webglimpl::pesapi_update_boxed_value;
        api->is_boxed_value = &pesapi::webglimpl::pesapi_is_boxed_value;
    }
    
    void EMSCRIPTEN_KEEPALIVE PApiCallbackWithScope(pesapi_callback cb, struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        pesapi::webglimpl::WebGlScope();
        cb(apis, info);
    }
    
    void* EMSCRIPTEN_KEEPALIVE PApiConstructorWithScope(pesapi_constructor cb, struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        pesapi::webglimpl::WebGlScope();
        return cb(apis, info);
    }
}

#endif
