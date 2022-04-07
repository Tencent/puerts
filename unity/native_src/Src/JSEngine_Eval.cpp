/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "JSEngine.h"
#if WITH_QUICKJS
#include "quickjs-msvc.h"
#endif
namespace puerts {
    std::string CjsModulePrepend("export default globalThis.require('");
    std::string CjsModuleAppend("');");

#if !WITH_QUICKJS
    v8::MaybeLocal<v8::Module> ResolveModule(
        v8::Local<v8::Context> Context,
        v8::Local<v8::String> Specifier,
        v8::Local<v8::Module> Referrer
    )
    {
        v8::Isolate* Isolate = Context->GetIsolate();
        JSEngine* JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        
        v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
        std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());
        size_t Specifier_length = Specifier_std.length();

        auto Iter = JsEngine->ModuleCacheMap.find(Specifier_std);
        if (Iter != JsEngine->ModuleCacheMap.end())//create and link
        {
            return v8::Local<v8::Module>::New(Isolate, Iter->second);
        }
        v8::Local<v8::Module> Module;
        const char* Code;

        if (Specifier_std.substr(Specifier_length - 4, Specifier_length).compare(".mjs") == 0) 
        {

            Code = JsEngine->ModuleResolver(Specifier_std.c_str(), JsEngine->Idx);
            if (Code == nullptr) 
            {
                return v8::MaybeLocal<v8::Module>();
            }
        } 
        else 
        {
            Code = (CjsModulePrepend + Specifier_std + CjsModuleAppend).c_str();
        }
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
        v8::TryCatch TryCatch(Isolate);

        v8::ScriptCompiler::CompileOptions options;
        
        v8::ScriptCompiler::Source Source(FV8Utils::V8String(Isolate, Code), Origin);

        if (!v8::ScriptCompiler::CompileModule(Isolate, &Source, v8::ScriptCompiler::kNoCompileOptions)
                .ToLocal(&Module)) 
        {
            JsEngine->LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return v8::MaybeLocal<v8::Module>();
        }

        JsEngine->ModuleCacheMap[Specifier_std] = v8::UniquePersistent<v8::Module>(Isolate, Module);
        return Module;
    }
#else 
    JSModuleDef* js_module_loader(JSContext* ctx, const char *name, void *opaque) {
        JSRuntime *rt = JS_GetRuntime(ctx);
        v8::Isolate* Isolate = (v8::Isolate*)JS_GetRuntimeOpaque(rt);
        JSEngine* JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);

        std::string name_std(name);
        size_t name_length = name_std.length();

        auto Iter = JsEngine->ModuleCacheMap.find(name_std);
        if (Iter != JsEngine->ModuleCacheMap.end())//create and link
        {
            return Iter->second;
        }

        const char* Code;
        if (name_length > 4 && name_std.substr(name_length - 4, name_length).compare(".mjs") == 0) 
        {
            Code = JsEngine->ModuleResolver(name_std.c_str(), JsEngine->Idx);
            if (Code == nullptr) 
            {
                return nullptr;
            }
        } 
        else 
        {
            Code = (CjsModulePrepend + name_std + CjsModuleAppend).c_str();
        }
        JSValue func_val = JS_Eval(ctx, Code, strlen(Code), name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);

        if (JS_IsException(func_val)) {
            return nullptr;
        }

        auto module_ = (JSModuleDef *) JS_VALUE_GET_PTR(func_val);

        JsEngine->ModuleCacheMap[name_std] = module_;

        return module_;
    }
#endif

    bool JSEngine::ExecuteModule(const char* Path, const char* Exportee) 
    {
        if (ModuleResolver == nullptr) 
        {
            LastExceptionInfo = "ModuleResolver is not registered";
            return false;
        }
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        v8::TryCatch TryCatch(Isolate);
        
#if !WITH_QUICKJS
        v8::ScriptOrigin Origin(FV8Utils::V8String(Isolate, ""),
                            v8::Integer::New(Isolate, 0),                      // line offset
                            v8::Integer::New(Isolate, 0),                    // column offset
                            v8::True(Isolate),                    // is cross origin
                            v8::Local<v8::Integer>(),                 // script id
                            v8::Local<v8::Value>(),                   // source map URL
                            v8::False(Isolate),                   // is opaque (?)
                            v8::False(Isolate),                   // is WASM
                            v8::True(Isolate),                    // is ES Module
                            v8::PrimitiveArray::New(Isolate, 10));
        
        v8::ScriptCompiler::Source Source(FV8Utils::V8String(Isolate, ""), Origin);
        v8::Local<v8::Module> EntryModule = v8::ScriptCompiler::CompileModule(Isolate, &Source, v8::ScriptCompiler::kNoCompileOptions)
                .ToLocalChecked();
                
        v8::MaybeLocal<v8::Module> Module = ResolveModule(Context, FV8Utils::V8String(Isolate, Path), EntryModule);

        if (Module.IsEmpty())
        {
            return false;
        }

        v8::Local<v8::Module> ModuleChecked = Module.ToLocalChecked();
        v8::Maybe<bool> ret = ModuleChecked->InstantiateModule(Context, ResolveModule);
        if (ret.IsNothing() || !ret.ToChecked()) 
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }
        v8::MaybeLocal<v8::Value> evalRet = ModuleChecked->Evaluate(Context);
        if (evalRet.IsEmpty()) 
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }
        else
        {
            if (Exportee != nullptr) 
            {
                v8::Local<v8::Value> ns = ModuleChecked->GetModuleNamespace();
                if (*Exportee == 0) 
                {
                    ResultInfo.Result.Reset(Isolate, ns);
                } 
                else 
                {
                    ResultInfo.Result.Reset(
                        Isolate, 
                        ns.As<v8::Object>()->Get(Context, FV8Utils::V8String(Isolate, Exportee)).ToLocalChecked()
                    );
                }
            }
        }
        return true;
#else
        JS_SetModuleLoaderFunc(MainIsolate->runtime_, NULL, js_module_loader, NULL);
        JSContext* ctx = ResultInfo.Context.Get(MainIsolate)->context_;

        JSModuleDef* EntryModule = js_module_loader(ctx , Path, nullptr);
        if (EntryModule == nullptr) {
            Isolate->handleException();
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }

        auto func_obj = JS_DupModule(ctx, EntryModule);
        auto evalRet = JS_EvalFunction(ctx, func_obj);

        v8::Value* val = nullptr;
        if (JS_IsException(evalRet)) {
            JS_FreeValue(ctx, evalRet);
            MainIsolate->handleException();
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;

        } else {
            if (Exportee != nullptr) 
            {
                val = MainIsolate->Alloc<v8::Value>();
                val->value_ = JS_GET_MODULE_NS(ctx, EntryModule);
                JS_FreeValue(ctx, evalRet);
                v8::Local<v8::Value> ns = v8::Local<v8::Value>(val);
                if (*Exportee == 0) 
                {
                    ResultInfo.Result.Reset(Isolate, ns);
                } 
                else 
                {
                    ResultInfo.Result.Reset(
                        Isolate, 
                        ns.As<v8::Object>()->Get(Context, FV8Utils::V8String(Isolate, Exportee)).ToLocalChecked()
                    );
                }
            }

            return true;
            
        }
#endif
    }
    
    bool JSEngine::Eval(const char *Code, const char* Path)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::String> Url = FV8Utils::V8String(Isolate, Path == nullptr ? "" : Path);
        v8::Local<v8::String> Source = FV8Utils::V8String(Isolate, Code);
        v8::ScriptOrigin Origin(Url);
        v8::TryCatch TryCatch(Isolate);

        auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
        if (CompiledScript.IsEmpty())
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }
        auto maybeValue = CompiledScript.ToLocalChecked()->Run(Context);//error info output
        if (TryCatch.HasCaught())
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }

        if (!maybeValue.IsEmpty())
        {
            ResultInfo.Result.Reset(Isolate, maybeValue.ToLocalChecked());
        }

        return true;
    }
}
