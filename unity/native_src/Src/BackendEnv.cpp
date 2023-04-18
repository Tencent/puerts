/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"
#include "PromiseRejectCallback.hpp"

void puerts::BackendEnv::InitInject(v8::Isolate* Isolate)
{
    Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<puerts::BackendEnv>);
#if !WITH_QUICKJS
    Isolate->SetHostInitializeImportMetaObjectCallback(&puerts::esmodule::HostInitializeImportMetaObject);
#endif

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "__tgjsSetPromiseRejectCallback").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<puerts::BackendEnv>)->GetFunction(Context).ToLocalChecked()).Check();
    Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "__puer_execute_module_sync__").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        v8::Isolate* Isolate = info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::String> Specifier_v8 = info[0]->ToString(Context).ToLocalChecked();

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

    })->GetFunction(Context).ToLocalChecked()).Check();
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

bool puerts::BackendEnv::ClearModuleCache(v8::Local<v8::Context> Context, const char* Path)
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
            JSContext* ctx = Context.Get(Isolate)->context_;
            return JS_ReleaseLoadedModule(ctx, Path);
#endif
        }
    }
    return false;
}


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
    v8::Local<v8::Function> URLResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_url__").ToLocalChecked()).ToLocalChecked());
    std::vector< v8::Local<v8::Value>> V8Args;
    V8Args.push_back(Specifier);
    V8Args.push_back(ReferrerName);
    v8::MaybeLocal<v8::Value> maybeRet = URLResolveFunction->Call(Context, Context->Global(), 2, V8Args.data());
    V8Args.clear();

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
    Specifier = v8::String::NewFromUtf8(Isolate, Specifier_std.c_str()).ToLocalChecked();
    
    v8::Local<v8::Function> ModuleResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_content__").ToLocalChecked()).ToLocalChecked());
    v8::Local<v8::Module> Module;
    char* pathForDebug;

    V8Args.push_back(Specifier);
    maybeRet = ModuleResolveFunction->Call(Context, Context->Global(), 1, V8Args.data());
    V8Args.clear();

    if (maybeRet.IsEmpty()) 
    {
        // const std::string ErrorMessage = std::string("[Puer] module not found ") + Specifier_std;
        // Isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(Isolate, ErrorMessage.c_str()).ToLocalChecked()));
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