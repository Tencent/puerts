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
    JS_TAG_FIRST       = -9, /* first negative tag */
    JS_TAG_BIG_INT     = -9,
    JS_TAG_SYMBOL      = -8,
    JS_TAG_STRING      = -7,
    JS_TAG_MODULE      = -3, /* used internally */
    JS_TAG_FUNCTION_BYTECODE = -2, /* used internally */
    JS_TAG_OBJECT      = -1,

    JS_TAG_INT         = 0,
    JS_TAG_BOOL        = 1,
    JS_TAG_NULL        = 2,
    JS_TAG_UNDEFINED   = 3,
    JS_TAG_UNINITIALIZED = 4,
    JS_TAG_CATCH_OFFSET = 5,
    JS_TAG_EXCEPTION   = 6,
    JS_TAG_FLOAT64     = 7,
    JS_TAG_INT64       = 8,
    JS_TAG_UINT64      = 9,
};

#define JS_MKVAL(tag, val) (JSValue){ (JSValueUnion){ .int32 = val }, tag }

/* special values */
#define JS_NULL      JS_MKVAL(JS_TAG_NULL, 0)
#define JS_UNDEFINED JS_MKVAL(JS_TAG_UNDEFINED, 0)
#define JS_FALSE     JS_MKVAL(JS_TAG_BOOL, 0)
#define JS_TRUE      JS_MKVAL(JS_TAG_BOOL, 1)
#define JS_EXCEPTION JS_MKVAL(JS_TAG_EXCEPTION, 0)
#define JS_UNINITIALIZED JS_MKVAL(JS_TAG_UNINITIALIZED, 0)

typedef union JSValueUnion {
    int32_t int32;
    double float64;
    int64_t int64;
    uint64_t uint64;
    void *ptr;
} JSValueUnion;

typedef struct JSValue {
    JSValueUnion u;
    int64_t tag;
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
            delete caught;
        }
		for (size_t i = 0; i < values_used; i++)
		{
		}

		for (size_t i = 0; i < dynamic_alloc_values.size(); i++)
		{
			free(dynamic_alloc_values[i]);
		}
		dynamic_alloc_values.clear();
		setCurrentScope(prev_scope);
	}
};

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

pesapi_open_scope_func g_js_open_scope = nullptr;

pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto ret = new pesapi::webglimpl::pesapi_scope__();
    if (g_js_open_scope)
    {
        g_js_open_scope(penv_ref);
    }
    return reinterpret_cast<pesapi_scope>(ret);
}

pesapi_open_scope_placement_func g_js_open_scope_placement = nullptr;

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

pesapi_close_scope_func g_js_close_scope;

void pesapi_close_scope(pesapi_scope pscope)
{
    if (g_js_close_scope)
    {
        g_js_close_scope(pscope);
    }
    auto scope = reinterpret_cast<pesapi::webglimpl::pesapi_scope__*>(pscope);
    if (!scope)
    {
        return;
    }
    delete scope;
}

pesapi_close_scope_placement_func g_js_close_scope_placement = nullptr;

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
    
} // webglimpl
} // pesapi

extern "C"
{
    void DoInjectPapi(struct pesapi_ffi* api)
    {
        pesapi::webglimpl::g_js_open_scope = api->open_scope;
        api->open_scope = &pesapi::webglimpl::pesapi_open_scope;
        
        pesapi::webglimpl::g_js_open_scope_placement= api->open_scope_placement;
        api->open_scope_placement = &pesapi::webglimpl::pesapi_open_scope_placement;
        
        pesapi::webglimpl::g_js_close_scope = api->close_scope;
        api->close_scope = &pesapi::webglimpl::pesapi_close_scope;
        
        pesapi::webglimpl::g_js_close_scope_placement = api->close_scope_placement;
        api->close_scope_placement = &pesapi::webglimpl::pesapi_close_scope_placement;
    }
}

#endif
