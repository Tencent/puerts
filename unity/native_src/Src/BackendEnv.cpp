/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"
#include "PromiseRejectCallback.hpp"

void puerts::esmodule::ExecuteModule(const v8::FunctionCallbackInfo<v8::Value>& info) 
{
    v8::Isolate* Isolate = info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::String> Specifier_v8 = info[0]->ToString(Context).ToLocalChecked();

#if !WITH_QUICKJS
    auto emptyStrV8 = v8::String::NewFromUtf8(Isolate, "", v8::NewStringType::kNormal).ToLocalChecked();
    v8::ScriptOrigin origin(emptyStrV8,
                    v8::Integer::New(Isolate, 0),                      // line offset
                    v8::Integer::New(Isolate, 0),                    // column offset
                    v8::True(Isolate),                    // is cross origin
                    v8::Local<v8::Integer>(),                 // script id
                    v8::Local<v8::Value>(),                   // source map URL
                    v8::False(Isolate),                   // is opaque (?)
                    v8::False(Isolate),                   // is WASM
                    v8::True(Isolate),                    // is ES Module
                    v8::PrimitiveArray::New(Isolate, 10)
    );
    v8::ScriptCompiler::Source source(emptyStrV8, origin);
    v8::Local<v8::Module> entryModule = v8::ScriptCompiler::CompileModule(Isolate, &source, v8::ScriptCompiler::kNoCompileOptions)
            .ToLocalChecked();

    v8::MaybeLocal<v8::Module> mod = puerts::esmodule::ResolveModule(Context, Specifier_v8, entryModule);
    if (mod.IsEmpty())
    {
        // TODO
        return;
    }
    v8::Local<v8::Module> moduleChecked = mod.ToLocalChecked();
    if (!puerts::esmodule::LinkModule(Context, moduleChecked))
    {
        // TODO
        return;
    }
    v8::Maybe<bool> ret = moduleChecked->InstantiateModule(Context, puerts::esmodule::ResolveModule);
    if (ret.IsNothing() || !ret.ToChecked())
    {
        // TODO
        return;
    }
    v8::MaybeLocal<v8::Value> evalRet = moduleChecked->Evaluate(Context);
    if (evalRet.IsEmpty())
    {
        // TODO
        return;
    }
    info.GetReturnValue().Set(moduleChecked->GetModuleNamespace());

#else 
    JS_SetModuleLoaderFunc(Isolate->runtime_, puerts::esmodule::js_module_resolver, puerts::esmodule::js_module_loader, NULL);
    JSContext* ctx = Context->context_;

    v8::String::Utf8Value Specifier_utf8(Isolate, Specifier_v8);
    std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());

    char* resolved_name = puerts::esmodule::js_module_resolver(ctx, "", Specifier_std.c_str(), nullptr);
    if (resolved_name == nullptr)
    {
        // should be a exception on mockV8's VM
        Isolate->handleException();
        return;
    }

    JSModuleDef* EntryModule = puerts::esmodule::js_module_loader(ctx, resolved_name, nullptr);
    if (EntryModule == nullptr) 
    {
        // should be a exception on mockV8's VM
        Isolate->handleException();
        return;
    }

    auto func_obj = JS_DupModule(ctx, EntryModule);
    auto evalRet = JS_EvalFunction(ctx, func_obj);

    v8::Value* val = nullptr;
    if (JS_IsException(evalRet)) {
        JS_FreeValue(ctx, evalRet);
        Isolate->handleException();
        return;

    } else {
        val = Isolate->Alloc<v8::Value>();
        val->value_ = JS_GET_MODULE_NS(ctx, EntryModule);
        JS_FreeValue(ctx, evalRet);
        v8::Local<v8::Value> ns = v8::Local<v8::Value>(val);

        if (ns->IsNullOrUndefined())
        {
            ns = v8::Object::New(Isolate);
        }

        info.GetReturnValue().Set(ns);

        return;   
    }
#endif
}

void puerts::BackendEnv::InitInject(v8::Isolate* Isolate)
{
    Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<puerts::BackendEnv>);
#if !WITH_QUICKJS
    Isolate->SetHostInitializeImportMetaObjectCallback(&puerts::esmodule::HostInitializeImportMetaObject);
#endif

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "__tgjsSetPromiseRejectCallback").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<puerts::BackendEnv>)->GetFunction(Context).ToLocalChecked()).Check();
    Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "__puer_execute_module_sync__").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, puerts::esmodule::ExecuteModule)->GetFunction(Context).ToLocalChecked()).Check();
}

void puerts::BackendEnv::CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    if (Inspector == nullptr)
    {
        Inspector = CreateV8Inspector(Port, &Context);
    }
}

void puerts::BackendEnv::DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal)
{
    if (Inspector != nullptr)
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        delete Inspector;
        Inspector = nullptr;
    }
}

bool puerts::BackendEnv::InspectorTick()
{
    if (Inspector != nullptr)
    {
        return Inspector->Tick();
    }
    return true;
}

bool puerts::BackendEnv::ClearModuleCache(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const char* Path)
{
    std::string key(Path);
    if (key.size() == 0) 
    {
#if !WITH_QUICKJS
        for (auto Iter = PathToModuleMap.begin(); Iter != PathToModuleMap.end(); ++Iter)
        {
            Iter->second.Reset();
        }
#else
#endif
        PathToModuleMap.clear();
        return true;
    } 
    else 
    {
        auto finder = PathToModuleMap.find(key);
        if (finder != PathToModuleMap.end()) 
        {
            PathToModuleMap.erase(key);
#if !WITH_QUICKJS
            finder->second.Reset();
            return true;
#else
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            JSContext* ctx = Context->context_;
            return JS_ReleaseLoadedModule(ctx, Path);
#endif
        }
    }
    return false;
}

static v8::MaybeLocal<v8::Value> CallResolver(
    v8::Isolate* Isolate,
    v8::Local<v8::Context> Context,
    v8::Local<v8::Value> Specifier,
    v8::Local<v8::Value> ReferrerName
)
{
    std::vector< v8::Local<v8::Value>> V8Args;

    v8::Local<v8::Function> URLResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_url__").ToLocalChecked()).ToLocalChecked());
    V8Args.push_back(Specifier);
    V8Args.push_back(ReferrerName);
    v8::MaybeLocal<v8::Value> maybeRet = URLResolveFunction->Call(Context, Context->Global(), 2, V8Args.data());
    V8Args.clear();

    return maybeRet;
}
static v8::MaybeLocal<v8::Value> CallRead(
    v8::Isolate* Isolate,
    v8::Local<v8::Context> Context,
    v8::Local<v8::Value> URL
)
{
    std::vector< v8::Local<v8::Value>> V8Args;

    v8::Local<v8::Function> ModuleResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_content__").ToLocalChecked()).ToLocalChecked());
    char* pathForDebug;

    V8Args.push_back(URL);
    v8::MaybeLocal<v8::Value>maybeRet = ModuleResolveFunction->Call(Context, Context->Global(), 1, V8Args.data());
    V8Args.clear();

    return maybeRet;
}

#if !WITH_QUICKJS
    v8::MaybeLocal<v8::Module> puerts::esmodule::_ResolveModule(
        v8::Local<v8::Context> Context,
        v8::Local<v8::String> Specifier,
        v8::Local<v8::Module> Referrer,
        bool& isFromCache
    )
    {
        v8::Isolate* Isolate = Context->GetIsolate();
        BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);

        v8::Local<v8::Value> ReferrerName;
        const auto referIter = mm->ScriptIdToPathMap.find(Referrer->ScriptId()); 
        if (referIter != mm->ScriptIdToPathMap.end())
        {
            std::string referPath_std = referIter->second;
            ReferrerName = v8::String::NewFromUtf8(Isolate, referPath_std.c_str()).ToLocalChecked();
        }
        else
        {
            ReferrerName = v8::String::NewFromUtf8(Isolate, "").ToLocalChecked();
        }

        v8::MaybeLocal<v8::Value> maybeRet = CallResolver(Isolate, Context, Specifier, ReferrerName);
        if (maybeRet.IsEmpty()) 
        {
            return v8::MaybeLocal<v8::Module> {};
        }
        Specifier = v8::Local<v8::String>::Cast(maybeRet.ToLocalChecked());

        v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
        std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());

        const auto cacheIter = mm->PathToModuleMap.find(Specifier_std);
        if (cacheIter != mm->PathToModuleMap.end())//create and link
        {
            isFromCache = true;
            return v8::Local<v8::Module>::New(Isolate, cacheIter->second);
        }
        
        maybeRet = CallRead(Isolate, Context, Specifier);
        if (maybeRet.IsEmpty()) 
        {
            return v8::MaybeLocal<v8::Module> {};
        }
        v8::Local<v8::String> Code = v8::Local<v8::String>::Cast(maybeRet.ToLocalChecked());

        v8::ScriptOrigin Origin(Specifier,
                            v8::Integer::New(Isolate, 0),                      // line offset
                            v8::Integer::New(Isolate, 0),                    // column offset
                            v8::True(Isolate),                    // is cross origin
                            v8::Local<v8::Integer>(),                 // script id
                            v8::Local<v8::Value>(),                   // source map URL
                            v8::False(Isolate),                   // is opaque (?)
                            v8::False(Isolate),                   // is WASM
                            v8::True(Isolate),                    // is ES Module
                            v8::PrimitiveArray::New(Isolate, 10));

        v8::ScriptCompiler::CompileOptions options;

        v8::ScriptCompiler::Source Source(Code, Origin);
        v8::Local<v8::Module> Module;

        if (!v8::ScriptCompiler::CompileModule(Isolate, &Source, v8::ScriptCompiler::kNoCompileOptions)
                .ToLocal(&Module)) 
        {
            return v8::MaybeLocal<v8::Module> {};
        }
        mm->ScriptIdToPathMap[Module->ScriptId()] = Specifier_std;
        mm->PathToModuleMap[Specifier_std] = v8::UniquePersistent<v8::Module>(Isolate, Module);
        return Module;
    }

    v8::MaybeLocal<v8::Module> puerts::esmodule::ResolveModule(
        v8::Local<v8::Context> Context,
        v8::Local<v8::String> Specifier,
        v8::Local<v8::Module> Referrer
    )
    {
        bool isFromCache = false;
        return _ResolveModule(Context, Specifier, Referrer, isFromCache);
    }

    bool puerts::esmodule::LinkModule(
        v8::Local<v8::Context> Context,
        v8::Local<v8::Module> RefModule
    )
    {
        v8::Isolate* Isolate = Context->GetIsolate();

        for (int i = 0, length = RefModule->GetModuleRequestsLength(); i < length; i++)
        {
            v8::Local<v8::String> Specifier_v8 = RefModule->GetModuleRequest(i);

            bool isFromCache = false;
            v8::MaybeLocal<v8::Module> MaybeModule = _ResolveModule(Context, Specifier_v8, RefModule, isFromCache);
            if (MaybeModule.IsEmpty())
            {
                return false;
            }
            if (!isFromCache) 
            {
                if (!LinkModule(Context, MaybeModule.ToLocalChecked())) 
                {
                    return false;
                }
            }
        }

        return true;
    }

    void puerts::esmodule::HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta)
    {
        v8::Isolate* Isolate = Context->GetIsolate();
        BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);

        auto iter = mm->ScriptIdToPathMap.find(Module->ScriptId());
        if (iter != mm->ScriptIdToPathMap.end()) 
        {
            meta->CreateDataProperty(
                Context, 
                v8::String::NewFromUtf8(Isolate, "url").ToLocalChecked(),
                v8::String::NewFromUtf8(Isolate, ("puer:" + iter->second).c_str()).ToLocalChecked()
            ).ToChecked();
        }
    }

#else 
    char* puerts::esmodule::js_module_resolver(
        JSContext *ctx, const char *base_name, const char *name, void* opaque
    )
    {
        JSRuntime *rt = JS_GetRuntime(ctx);
        v8::Isolate* Isolate = (v8::Isolate*)JS_GetRuntimeOpaque(rt);
        BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

        v8::Local<v8::Value> Specifier = v8::String::NewFromUtf8(Isolate, name).ToLocalChecked();
        v8::Local<v8::Value> ReferrerName = v8::String::NewFromUtf8(Isolate, base_name).ToLocalChecked();

        v8::TryCatch TryCatch(Isolate);
        v8::MaybeLocal<v8::Value> maybeRet = CallResolver(Isolate, Context, Specifier, ReferrerName);
        if (maybeRet.IsEmpty()) 
        {
            // should be a exception on mockV8's VM

            // TODO rethrow this error will crash, why?
            // JSValue ex = TryCatch.catched_;
            std::string ErrorMessage = std::string("[Puer002]module not found ") + name;
            JSValue ex = JS_NewStringLen(ctx, ErrorMessage.c_str(), ErrorMessage.length());
            JS_Throw(ctx, ex);
            // there should be a exception in quickjs VM now
            return nullptr;
        }

        Specifier = maybeRet.ToLocalChecked();
        v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
        const char* specifier = *Specifier_utf8;

        int32_t size = strlen(specifier);
        char* rname = (char*)js_malloc(ctx, strlen(specifier) + 1);
        memcpy(rname, specifier, size);
        rname[size] = '\0';
        return rname;
    }

    JSModuleDef* puerts::esmodule::js_module_loader(
        JSContext* ctx, const char *name, void *opaque
    ) 
    {
        JSRuntime *rt = JS_GetRuntime(ctx);
        v8::Isolate* Isolate = (v8::Isolate*)JS_GetRuntimeOpaque(rt);
        BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        
        std::string name_std(name, strlen(name));

        auto Iter = mm->PathToModuleMap.find(name_std);
        if (Iter != mm->PathToModuleMap.end())//create and link
        {
            return Iter->second;
        }

        v8::Local<v8::Value> Specifier = v8::String::NewFromUtf8(Isolate, name).ToLocalChecked();
        v8::TryCatch TryCatch(Isolate);
        v8::MaybeLocal<v8::Value> maybeRet = CallRead(Isolate, Context, Specifier);
        if (maybeRet.IsEmpty()) 
        {
            // should be a exception on mockV8's VM

            // JSValue ex = TryCatch.catched_;
            // TODO rethrow this error will crash, why?
            std::string ErrorMessage = std::string("[Puer003]module not found ") + name;
            JSValue ex = JS_NewStringLen(ctx, ErrorMessage.c_str(), ErrorMessage.length());
            JS_Throw(ctx, ex);
            // there should be a exception in quickjs VM now
            return nullptr;
        }
        v8::Local<v8::String> V8Code = v8::Local<v8::String>::Cast(maybeRet.ToLocalChecked());
        v8::String::Utf8Value Code_utf8(Isolate, V8Code);

        const char* Code = *Code_utf8;
        if (Code == nullptr) 
        {
            return nullptr;
        }
        JSValue func_val = JS_Eval(ctx, Code, strlen(Code), name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);

        if (JS_IsException(func_val)) {
            // there should be a exception in quickjs VM now
            return nullptr;
        }

        auto module_ = (JSModuleDef *) JS_VALUE_GET_PTR(func_val);

        auto obj = JS_GetImportMeta(ctx, module_);
        JS_SetProperty(ctx, obj, JS_NewAtom(ctx, "url"), JS_NewString(ctx, ("puer:" + name_std).c_str()));
        JS_FreeValue(ctx, obj);

        mm->PathToModuleMap[name_std] = module_;

        return module_;
    }
#endif