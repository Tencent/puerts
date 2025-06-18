/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"

#if !defined(CONFIG_CHECK_JSVALUE) && defined(JS_NAN_BOXING)
#define JS_INITVAL(s, t, val) s = JS_MKVAL(t, val)
#define JS_INITPTR(s, t, p) s = JS_MKPTR(t, p)
#else
#define JS_INITVAL(s, t, val) s.tag = t, s.u.int32=val
#define JS_INITPTR(s, t, p) s.tag = t, s.u.ptr = p
#endif


namespace PUERTS_NAMESPACE
{


void FBackendEnv::Initialize(void* external_quickjs_runtime, void* external_quickjs_context)
{
    rt = external_quickjs_runtime ? (JSRuntime *)external_quickjs_runtime: JS_NewRuntime();
    ctx = external_quickjs_context ? (JSContext *)external_quickjs_context : JS_NewContext(rt);
    
    //if (external_quickjs_runtime == nullptr) 
    //{
    //    Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<FBackendEnv>);

    //    Global->Set(Context, v8::String::NewFromUtf8(Isolate, "__tgjsSetPromiseRejectCallback").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<FBackendEnv>)->GetFunction(Context).ToLocalChecked()).Check();
    //}
    
    JsFileLoader = JS_Undefined();
    JsFileNormalize = JS_Undefined();
    
    JS_SetModuleLoaderFunc(rt, esmodule::module_normalize, esmodule::js_module_loader, this);
    
    JSValue FuncData;
    JS_INITPTR(FuncData, JS_TAG_EXTERNAL, (void*)this);
    JSValue Func = JS_NewCFunctionData(ctx, esmodule::ExecuteModule, 0, 0, 1, &FuncData);
    
    JSValue G = JS_GetGlobalObject(ctx);
    JS_SetPropertyStr(ctx, G, EXECUTEMODULEGLOBANAME, Func);
    JS_FreeValue(ctx, G);
    JS_SetRuntimeOpaque(rt, this);

    CppObjectMapperQjs.Initialize(ctx);
}

void FBackendEnv::UnInitialize()
{
    CppObjectMapperQjs.Cleanup();
    JS_FreeValueRT(rt, JsFileNormalize);
    JS_FreeValueRT(rt, JsFileLoader);
    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}

char* FBackendEnv::ResolveQjsModule(JSContext *ctx, const char *base_name, const char *name, bool throwIfFail)
{
    if (JS_IsUndefined(JsFileNormalize))
    {
        JSValue G = JS_GetGlobalObject(ctx);
        JsFileNormalize = JS_GetPropertyStr(ctx, G, "__puer_resolve_module_url__");
        JS_FreeValue(ctx, G);
        if (throwIfFail && JS_IsUndefined(JsFileNormalize))
        {
            JS_ThrowReferenceError(ctx, "could not load module loader");
            return nullptr;
        }
    }
    if (!JS_IsUndefined(JsFileNormalize))
    {
        JSValue Args[2];
        Args[0] = JS_NewString(ctx, name);
        Args[1] = JS_NewString(ctx, base_name);
        JSValue Resolved = JS_Call(ctx, JsFileNormalize, JS_Undefined(), 2, &Args[0]);
        JS_FreeValue(ctx,  Args[1]);
        JS_FreeValue(ctx,  Args[0]);
        if (!JS_IsException(Resolved))
        {
            const char* ResolvedName = JS_ToCString(ctx, Resolved);
            char* ret = js_strdup(ctx, ResolvedName);
            JS_FreeCString(ctx, ResolvedName);
            JS_FreeValue(ctx, Resolved);
            return ret;
        }
        else
        {
            if (!throwIfFail)
            {
                JS_FreeValue(ctx, JS_GetException(ctx));
            }
        }
    }
    
    return nullptr;
}

char* FBackendEnv::NormalizeModuleName(JSContext *ctx, const char *base_name, const char *name)
{
    char* ret = ResolveQjsModule(ctx, base_name, name, true);
    
    return ret ? ret : js_strdup(ctx, "");;
}

//static bool StringIsNullOrEmpty(const char * str)
//{
//    return str == nullptr || str[0] == '\0';
//}

JSModuleDef* FBackendEnv::LoadModule(JSContext* ctx, const char *name)
{
    //if (StringIsNullOrEmpty(name))
    //{
        // exception from Normalize
    //    return nullptr;
    //}
#if defined(QUICKJS_VERSION) && QUICKJS_VERSION >= 20240214
    if (JS_HasException(ctx))
    {
        return nullptr;
    }
#else
    auto Ex = JS_GetException(ctx);
    if (!JS_IsUndefined(Ex) && !JS_IsNull(Ex))
    {
        JS_Throw(ctx, Ex);
        return nullptr;
    }
#endif
    // quickjs本身已经做了cache，这只是为了支持ClearModuleCache ///
    auto Iter = PathToModuleMap.find(name);
    if (Iter != PathToModuleMap.end())
    {
        return Iter->second;
    }
    
    if (JS_IsUndefined(JsFileLoader))
    {
        JSValue G = JS_GetGlobalObject(ctx);
        JsFileLoader = JS_GetPropertyStr(ctx, G, "__puer_resolve_module_content__");
        JS_FreeValue(ctx, G);
        
        if (JS_IsUndefined(JsFileLoader))
        {
            JS_ThrowReferenceError(ctx, "could not load module loader");
            return nullptr;
        }
    }
    
    JSValue Url = JS_NewString(ctx, name);
    JSValue Context = JS_Call(ctx, JsFileLoader, JS_Undefined(), 1, &Url);
    JS_FreeValue(ctx, Url);
    
    if (JS_IsException(Context))
    {
        return nullptr;
    }
    
    if (!JS_IsString(Context))
    {
        JS_FreeValue(ctx, Context);
        JS_ThrowReferenceError(ctx, "could not load module filename '%s'", name);
        return nullptr;
    }
    
    const char * Src = JS_ToCString(ctx, Context);
    JSValue EvalRet = JS_Eval(ctx, Src, strlen(Src), name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    
    if (JS_IsException(EvalRet))
    {
        return nullptr;
    }
    
    auto Ret = (JSModuleDef *)JS_VALUE_GET_PTR(EvalRet);

    auto Meta = JS_GetImportMeta(ctx, Ret);
    eastl::basic_string<char, eastl::allocator_malloc> str = name;
    str = "puer:" + str;
    JS_SetPropertyStr(ctx, Meta, "url", JS_NewString(ctx, str.c_str()));
    JS_FreeValue(ctx, Meta);

    PathToModuleMap[name] = Ret;
    
    JS_FreeCString(ctx, Src);
    JS_FreeValue(ctx, Context);
    
    return Ret;
}

JSValue esmodule::ExecuteModule(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data)
{
    if (argc == 1)
    {
        const char * Specifier = JS_ToCString(ctx, argv[0]);
        FBackendEnv* Backend = (FBackendEnv*)(JS_VALUE_GET_PTR(func_data[0]));
        char *Path = Backend->ResolveQjsModule(ctx, "", Specifier, true);
        if (!Path)
        {
            return JS_Exception();
        }
        JSModuleDef* EntryModule = Backend->LoadModule(ctx, Path);
        JS_FreeCString(ctx, Specifier);
        js_free(ctx, Path);
        if (!EntryModule)
        {
            return JS_Exception();
        }
        auto Func = JS_DupModule(ctx, EntryModule);
        auto EvalRet = JS_EvalFunction(ctx, Func);
        if (JS_IsException(EvalRet)) {
            return EvalRet;
        }
#if defined(JS_EVAL_FLAG_ASYNC)
        if (!JS_IsUndefined(EvalRet))
        {
            JSPromiseStateEnum state = JS_PromiseState(ctx, EvalRet);
            if (state == JS_PROMISE_REJECTED)
            {
                auto ret = JS_Throw(ctx, JS_PromiseResult(ctx, EvalRet));
                JS_FreeValue(ctx, EvalRet);
                return ret;
            }
        }
#endif
        JS_FreeValue(ctx, EvalRet);
        auto Namespace = JS_GET_MODULE_NS(ctx, EntryModule);
        if (JS_IsUndefined(Namespace) || JS_IsNull(Namespace))
        {
            return JS_NewObject(ctx);
        }
        else
        {
            return Namespace;
        }
    }
    
    return JS_Undefined();
}

JSModuleDef* esmodule::js_module_loader(
    JSContext* ctx, const char *name, void *opaque
) 
{
    return static_cast<FBackendEnv*>(opaque)->LoadModule(ctx, name);
}

char* esmodule::module_normalize(
    JSContext *ctx, const char *base_name, const char *name, void* opaque
)
{
    return static_cast<FBackendEnv*>(opaque)->NormalizeModuleName(ctx, base_name, name);
}
/*
std::string FBackendEnv::GetJSStackTrace()
{
    // new Error("").stack
    JSValue global = JS_GetGlobalObject(ctx);
    JSValue error_t = JS_GetPropertyStr(ctx, global, "Error");
    if (JS_IsUndefined(error_t))
    {
        JS_FreeValue(ctx, global);
        return "";
    };
    JS_FreeValue(ctx, global);
    JSValue message = JS_NewString(ctx, "");
    JSValue argv[] = {message};
    JSValue error = JS_CallConstructor(ctx, error_t, 1, argv);
    JS_FreeValue(ctx, message);
    JS_FreeValue(ctx, error_t);
    JSValue stack = JS_GetPropertyStr(ctx, error, "stack");
    JS_FreeValue(ctx, error);
    const char* cstr = JS_ToCString(ctx, stack);
    std::string ret = cstr;
    JS_FreeCString(ctx, cstr);
    JS_FreeValue(ctx, stack);
    return ret;
}
*/

}
