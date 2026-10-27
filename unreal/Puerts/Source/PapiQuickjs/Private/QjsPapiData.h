/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"
#include "pesapi.h"
#include "quickjs.h"
#include "QjsObjectMapper.h"
#include <cstddef>
#include <cstring>
#include <memory>
#include <new>
#include <string>
#include <vector>

namespace PUERTS_NAMESPACE
{
namespace qjsimpl
{
struct pesapi_env_ref__
{
    explicit pesapi_env_ref__(JSContext* ctx)
        : context_persistent(ctx), ref_count(1), env_life_cycle_tracker(FCppObjectMapper::Get(ctx)->GetEnvLifeCycleTracker())
    {
    }

    JSContext* context_persistent;
    int ref_count;
    std::weak_ptr<int> env_life_cycle_tracker;
};

// a value ref, allocated with extra room for the internal fields (see value_ref_size)
struct pesapi_value_ref__ : pesapi_env_ref__
{
    explicit pesapi_value_ref__(JSContext* ctx, JSValue v, uint32_t field_count)
        : pesapi_env_ref__(ctx), value_persistent(JS_DupValue(ctx, v)), internal_field_count(field_count)
    {
        FCppObjectMapper::Get(ctx)->AddStrongRefObject(&value_persistent);
        for (uint32_t i = 0; i < field_count; ++i)
        {
            internal_fields[i] = nullptr;
        }
    }

    // only called while the env is alive
    ~pesapi_value_ref__()
    {
        if (weak)
        {
            if (tracer_alive)
            {
                // the tracer is still alive, it must not touch the ref any more
                JS_SetOpaque(tracer, nullptr);
            }
        }
        else
        {
            auto mapper = FCppObjectMapper::Get(context_persistent);
            if (mapper)
                mapper->RemoveStrongRefObject(&value_persistent);
            JS_FreeValue(context_persistent, value_persistent);
        }
    }

    // the value is held weakly, and the tracer has been garbage collected
    inline bool is_dead() const
    {
        return weak && !tracer_alive;
    }

    JSValue value_persistent;
    // weak mode: value_persistent is not ref counted, tracer is the raw (not ref counted) tracer object hidden in the value,
    // whose finalizer resets the ref
    bool weak = false;
    JSValue tracer = JS_NULL;
    bool tracer_alive = false;
    uint32_t internal_field_count;
    void* internal_fields[1];
};

inline size_t value_ref_size(uint32_t field_count)
{
    size_t size = offsetof(pesapi_value_ref__, internal_fields) + sizeof(void*) * field_count;
    return size < sizeof(pesapi_value_ref__) ? sizeof(pesapi_value_ref__) : size;
}

struct pesapi_scope__;

inline pesapi_scope__* getCurrentScope(JSContext* ctx)
{
    return (pesapi_scope__*) JS_GetContextOpaque1(ctx);
}

inline void setCurrentScope(JSContext* ctx, pesapi_scope__* scope)
{
    JS_SetContextOpaque1(ctx, scope);
}

struct caught_exception_info
{
    JSValue exception = JS_UNDEFINED;
    std::string message;
};

struct pesapi_scope__
{
    static const size_t SCOPE_FIX_SIZE_VALUES_SIZE = 5;

    explicit pesapi_scope__(JSContext* InCtx)
    {
        ctx = InCtx;
        prev_scope = getCurrentScope(ctx);
        setCurrentScope(ctx, this);
        values_used = 0;
        caught = nullptr;
    }

    JSContext* ctx;

    pesapi_scope__* prev_scope;

    JSValue values[SCOPE_FIX_SIZE_VALUES_SIZE];

    std::vector<JSValue*>* dynamic_alloc_values = nullptr;

    caught_exception_info* caught;

    uint32_t values_used;

    JSValue* allocValue()
    {
        JSValue* ret;
        if (values_used < SCOPE_FIX_SIZE_VALUES_SIZE)
        {
            ret = &(values[values_used++]);
        }
        else
        {
            if (!dynamic_alloc_values)
            {
                dynamic_alloc_values = new std::vector<JSValue*>();
            }
            ret = (JSValue*) js_malloc(ctx, sizeof(JSValue));
            dynamic_alloc_values->push_back(ret);
        }
        *ret = JS_UNDEFINED;
        return ret;
    }

    // takes the ownership of exception
    void setCaughtException(JSValue exception)
    {
        if (caught == nullptr)
        {
            caught = new caught_exception_info();
        }
        else
        {
            JS_FreeValue(ctx, caught->exception);
        }
        caught->exception = exception;
        caught->message.clear();
    }

    ~pesapi_scope__()
    {
        if (caught)
        {
            JS_FreeValue(ctx, caught->exception);
            delete caught;
        }
        for (size_t i = 0; i < values_used; i++)
        {
            JS_FreeValue(ctx, values[i]);
        }

        if (dynamic_alloc_values)
        {
            for (JSValue* dynamicValue : *dynamic_alloc_values)
            {
                JS_FreeValue(ctx, *dynamicValue);
                js_free(ctx, dynamicValue);
            }
            delete dynamic_alloc_values;
            dynamic_alloc_values = nullptr;
        }
        setCurrentScope(ctx, prev_scope);
    }
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "sizeof(pesapi_scope__) > sizeof(pesapi_scope_memory)");

struct pesapi_callback_info__
{
    JSContext* ctx;
    JSValueConst this_val;
    int argc;
    JSValueConst* argv;
    void* data;
    JSValue res;
    JSValue ex;
};

// the result of a native callback: the exception thrown by throw_by_string / throw_error first, then a pending exception of the
// context, then the exception caught in the callback scope (the v8 backend rethrows it as well), else the return value
inline JSValue finish_callback(JSContext* ctx, pesapi_scope__& scope, pesapi_callback_info__& info)
{
    if (!JS_IsUndefined(info.ex))
    {
        JS_FreeValue(ctx, info.res);
        JSValue ex = info.ex;
        info.ex = JS_UNDEFINED;
        return JS_Throw(ctx, ex);
    }
    if (JS_HasException(ctx))
    {
        JS_FreeValue(ctx, info.res);
        return JS_EXCEPTION;
    }
    if (scope.caught)
    {
        JS_FreeValue(ctx, info.res);
        return JS_Throw(ctx, JS_DupValue(ctx, scope.caught->exception));
    }
    return info.res;
}

}    // namespace qjsimpl
}    // namespace PUERTS_NAMESPACE
