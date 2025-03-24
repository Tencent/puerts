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
    /* any larger tag is FLOAT64 if JS_NAN_BOXING */
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

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) pesapi::webglimpl::pesapi_scope__();
    return reinterpret_cast<pesapi_scope>(memory);
}

void pesapi_close_scope_placement(pesapi_scope pscope)
{
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
        api->open_scope_placement = &pesapi::webglimpl::pesapi_open_scope_placement;
        api->close_scope_placement = &pesapi::webglimpl::pesapi_close_scope_placement;
    }
}

#endif
