/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiBackendJs.h"
#include "PapiEnvScope.h"
#include <cstdio>

namespace PUERTS_NAMESPACE
{
static PString ToPString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    size_t Len = 0;
    Apis->get_value_string_utf8(Env, Value, nullptr, &Len);
    PString Ret;
    if (Len > 0)
    {
        Ret.resize(Len);
        Apis->get_value_string_utf8(Env, Value, Ret.data(), &Len);
        Ret.resize(Len);
    }
    return Ret;
}

// the string argument at Index, false (with an exception thrown) if it is not a string
static bool GetStringArg(struct pesapi_ffi* Apis, pesapi_callback_info Info, int Index, PString& Out)
{
    pesapi_env Env = Apis->get_env(Info);
    if (Apis->get_args_len(Info) <= Index || !Apis->is_string(Env, Apis->get_arg(Info, Index)))
    {
        char Message[64];
        snprintf(Message, sizeof(Message), "Bad parameters #%d, expect a string.", Index);
        Apis->throw_by_string(Info, Message);
        return false;
    }
    Out = ToPString(Apis, Env, Apis->get_arg(Info, Index));
    return true;
}

static pesapi_value GetArg(struct pesapi_ffi* Apis, pesapi_callback_info Info, int Index)
{
    return Apis->get_args_len(Info) > Index ? Apis->get_arg(Info, Index) : Apis->create_undefined(Apis->get_env(Info));
}

static void BindFunction(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Obj, const char* Key, pesapi_callback Callback, FPapiBackendJs* Backend)
{
    Apis->set_property(Env, Obj, Key, Apis->create_function(Env, Callback, Backend, nullptr));
}

// the directory of Path ("" if it has none)
static PString DirName(const PString& Path)
{
    auto Pos = Path.find_last_of("/\\");
    return Pos == PString::npos ? PString() : Path.substr(0, Pos);
}

// joins Dir and Specifier ('/' separated), removes the empty and "." segments and resolves ".."
static PString JoinPath(const PString& Dir, const PString& Specifier)
{
    PString Joined = Dir.empty() ? Specifier : Dir + "/" + Specifier;
    // the end positions of the segments in Ret
    PString Ret;
    size_t Start = 0;
    const size_t Size = Joined.size();
    for (size_t i = 0; i <= Size; ++i)
    {
        if (i < Size && Joined[i] != '/' && Joined[i] != '\\')
        {
            continue;
        }
        PString Segment = Joined.substr(Start, i - Start);
        Start = i + 1;
        if (Segment.empty() || Segment == ".")
        {
            continue;
        }
        if (Segment == "..")
        {
            auto Pos = Ret.find_last_of("/");
            PString Last = Pos == PString::npos ? Ret : Ret.substr(Pos + 1);
            if (!Ret.empty() && Last != "..")
            {
                Ret.resize(Pos == PString::npos ? 0 : Pos);
                continue;
            }
        }
        if (!Ret.empty())
        {
            Ret += '/';
        }
        Ret += Segment;
    }
    return Ret;
}

static bool HasExtension(const PString& Path)
{
    auto Dot = Path.find_last_of(".");
    auto Slash = Path.find_last_of("/\\");
    return Dot != PString::npos && (Slash == PString::npos || Dot > Slash);
}

void FPapiBackendJs::OnEnter(IPapiScriptHost* Host)
{
    struct pesapi_ffi* Apis = GetApi();
    {
        FPapiEnvScope EnvScope(Apis, MainEnvRef);
        if (!EnvScope)
        {
            return;
        }
        pesapi_env Env = EnvScope.GetEnv();
        StartRuntime(Env);

        pesapi_value Global = Apis->global(Env);
        // the `puerts` object is created by the host, it is shared by the host and the bootstrap scripts
        pesapi_value PuertsObj = Apis->get_property(Env, Global, "puerts");
        if (Apis->is_object(Env, PuertsObj))
        {
            RegisterBuiltinModule(Env, "puerts", PuertsObj);
            // used by puerts/module.js
            BindFunction(Apis, Env, PuertsObj, "__importSync", &ImportSyncCallback, this);
            BindFunction(Apis, Env, PuertsObj, "__compileCjs", &CompileCjsCallback, this);
            BindFunction(Apis, Env, PuertsObj, "__setModuleHooks", &SetModuleHooksCallback, this);
            BindFunction(Apis, Env, PuertsObj, "__getBuiltinModule", &GetBuiltinModuleCallback, this);
            BindFunction(Apis, Env, PuertsObj, "__registerBuiltinModule", &RegisterBuiltinModuleCallback, this);
            BindFunction(Apis, Env, PuertsObj, "__loadFile", &LoadFileCallback, this);
        }
        // called by puerts/promises.js
        BindFunction(Apis, Env, Global, "__tgjsSetPromiseRejectCallback", &SetPromiseRejectHandlerCallback, this);
        if (EnvScope.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("js runtime start exception %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
        }
    }

    // the commonjs module system (require), the other bootstrap scripts may require modules
    Host->ExecuteModule(TEXT("puerts/module.js"));
    Host->ExecuteModule(TEXT("puerts/first_run.js"));
    // keeps the process of node
    Host->ExecuteModule(TEXT("puerts/polyfill.js"));
    Host->ExecuteModule(TEXT("puerts/log.js"));
    Host->ExecuteModule(TEXT("puerts/uelazyload.js"));
    Host->ExecuteModule(TEXT("puerts/events.js"));
    // setTimeout/setInterval in js, driven by the tick handler of the host (scriptEnv.registerTickHandler), as unity
    Host->ExecuteModule(TEXT("puerts/timer.js"));
    Host->ExecuteModule(TEXT("puerts/promises.js"));
    Host->ExecuteModule(TEXT("puerts/argv.js"));
    Host->ExecuteModule(TEXT("puerts/jit_stub.js"));
    Host->ExecuteModule(TEXT("puerts/pesaddon.js"));
}

void FPapiBackendJs::OnExit(IPapiScriptHost* Host)
{
    struct pesapi_ffi* Apis = GetApi();
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (EnvScope)
    {
        StopRuntime();
    }
    // the refs are released while the env is alive
    for (pesapi_value_ref* Ref : {&RequireHook, &NameFixingProxy, &SetPrototypeOf})
    {
        if (*Ref)
        {
            Apis->release_value_ref(*Ref);
            *Ref = nullptr;
        }
    }
}

pesapi_value FPapiBackendJs::ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    if (ByImport)
    {
        return ImportModule(Env, Specifier, Referrer ? Referrer : "");
    }
    struct pesapi_ffi* Apis = GetApi();
    PString Path = JoinPath(Referrer ? DirName(Referrer) : PString(), Specifier);
    if (!HasExtension(Path))
    {
        Path += ".js";
    }
    if (!RequireHook)
    {
        Logger->Error(FString::Printf(TEXT("can not require [%s]: puerts/module.js is not loaded"), UTF8_TO_TCHAR(Path.c_str())));
        return nullptr;
    }
    pesapi_value Args[] = {Apis->create_string_utf8(Env, Path.c_str(), Path.size())};
    return Apis->call_function(Env, Apis->get_value_from_ref(Env, RequireHook), nullptr, 1, Args);
}

// the proxy at the end of the prototype chain fixes the name by fixName when a member is not found, and caches the member on its
// owner by the requested name
static const char NameFixingProxyFactory[] = R"((function (fixName) {
    var getProto = Object.getPrototypeOf, getDesc = Object.getOwnPropertyDescriptor, define = Object.defineProperty;
    var proxy;
    function fix(receiver, key) {
        if (typeof key !== 'string' || key.length === 0 || key.length >= 1024) return undefined;
        var fixed = fixName(key);
        if (fixed === key) return undefined;
        for (var p = receiver; p !== null && p !== proxy; p = getProto(p)) {
            var d = getDesc(p, fixed);
            if (d) {
                if (p !== receiver) {
                    define(p, key, ('get' in d) ? {get: d.get, set: d.set, enumerable: true, configurable: true}
                        : {value: d.value, writable: d.writable, enumerable: true, configurable: true});
                }
                return fixed;
            }
        }
        return undefined;
    }
    proxy = new Proxy({}, {
        get: function (t, key, receiver) {
            if (!(key in t)) {
                var fixed = fix(receiver, key);
                if (fixed !== undefined) return receiver[fixed];
            }
            return Reflect.get(t, key, receiver);
        },
        set: function (t, key, value, receiver) {
            if (!(key in t)) {
                var fixed = fix(receiver, key);
                if (fixed !== undefined) {
                    receiver[fixed] = value;
                    return true;
                }
            }
            return Reflect.set(t, key, value, receiver);
        }
    });
    return proxy;
}))";

void FPapiBackendJs::InstallNameFixing(pesapi_env Env, pesapi_value Class, pesapi_callback FixName)
{
    struct pesapi_ffi* Apis = GetApi();
    if (!Class)
    {
        return;
    }
    if (!SetPrototypeOf)
    {
        static const char Code[] = "Object.setPrototypeOf";
        pesapi_value Func =
            Apis->eval(Env, reinterpret_cast<const uint8_t*>(Code), sizeof(Code) - 1, "puerts/object_set_prototype_of");
        if (!Func)
        {
            return;
        }
        SetPrototypeOf = Apis->create_value_ref(Env, Func, 0);
    }
    if (!NameFixingProxy)
    {
        pesapi_value Factory = Apis->eval(Env, reinterpret_cast<const uint8_t*>(NameFixingProxyFactory),
            sizeof(NameFixingProxyFactory) - 1, "puerts/fname_fixing_proxy");
        if (!Factory)
        {
            return;
        }
        pesapi_value Args[] = {Apis->create_function(Env, FixName, nullptr, nullptr)};
        pesapi_value Proxy = Apis->call_function(Env, Factory, nullptr, 1, Args);
        if (!Proxy || !Apis->is_object(Env, Proxy))
        {
            return;
        }
        NameFixingProxy = Apis->create_value_ref(Env, Proxy, 0);
    }
    pesapi_value Proto = Apis->get_property(Env, Class, "prototype");
    if (Apis->is_object(Env, Proto))
    {
        pesapi_value Args[] = {Proto, Apis->get_value_from_ref(Env, NameFixingProxy)};
        Apis->call_function(Env, Apis->get_value_from_ref(Env, SetPrototypeOf), nullptr, 2, Args);
    }
}

// puerts.__importSync(path): the namespace of the esm (path is relative to the root)
void FPapiBackendJs::ImportSyncCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    PString Path;
    if (!GetStringArg(Apis, Info, 0, Path))
    {
        return;
    }
    pesapi_value Result = Self->ImportModule(Apis->get_env(Info), Path.c_str(), "");
    if (Result)
    {
        Apis->add_return(Info, Result);
    }
}

// puerts.__compileCjs(content, debugPath, path): the function of the commonjs module
void FPapiBackendJs::CompileCjsCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    PString DebugPath;
    PString Path;
    if (!GetStringArg(Apis, Info, 1, DebugPath) || !GetStringArg(Apis, Info, 2, Path))
    {
        return;
    }
    pesapi_value Content = GetArg(Apis, Info, 0);
    if (!Apis->is_string(Env, Content) && !Apis->is_binary(Env, Content))
    {
        Apis->throw_by_string(Info, "Bad parameters #0, expect a string or an ArrayBuffer.");
        return;
    }
    pesapi_value Func = Self->CompileCjs(Env, Content, DebugPath.c_str(), Path.c_str());
    if (Func)
    {
        Apis->add_return(Info, Func);
    }
}

// puerts.__setModuleHooks(require, resolve)
void FPapiBackendJs::SetModuleHooksCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    pesapi_value Require = GetArg(Apis, Info, 0);
    pesapi_value Resolve = GetArg(Apis, Info, 1);
    if (Self->RequireHook)
    {
        Apis->release_value_ref(Self->RequireHook);
        Self->RequireHook = nullptr;
    }
    if (Apis->is_function(Env, Require))
    {
        Self->RequireHook = Apis->create_value_ref(Env, Require, 0);
    }
    Self->SetModuleHooks(Env, Require, Resolve);
}

// puerts.__getBuiltinModule(name): the builtin module (an addon is loaded on its first use), undefined if not found
void FPapiBackendJs::GetBuiltinModuleCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    PString Name;
    if (!GetStringArg(Apis, Info, 0, Name))
    {
        return;
    }
    pesapi_value Value = Self->GetBuiltinModule(Env, Name.c_str());
    if (!Value && Self->LoadAddon(Env, Name.c_str()))
    {
        Value = Self->GetBuiltinModule(Env, Name.c_str());
    }
    if (Value)
    {
        Apis->add_return(Info, Value);
    }
}

// puerts.__registerBuiltinModule(name, value)
void FPapiBackendJs::RegisterBuiltinModuleCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    PString Name;
    if (!GetStringArg(Apis, Info, 0, Name))
    {
        return;
    }
    Self->RegisterBuiltinModule(Apis->get_env(Info), Name.c_str(), GetArg(Apis, Info, 1));
}

// puerts.__loadFile(path): {content, debugPath}, undefined if not found
void FPapiBackendJs::LoadFileCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    PString Path;
    if (!GetStringArg(Apis, Info, 0, Path) || !Self->LoadFile)
    {
        return;
    }
    PString DebugPath;
    pesapi_value Content = Self->LoadFile(Env, Path.c_str(), DebugPath);
    if (!Content)
    {
        return;
    }
    if (DebugPath.empty())
    {
        DebugPath = Path;
    }
    pesapi_value Result = Apis->create_object(Env);
    Apis->set_property(Env, Result, "content", Content);
    Apis->set_property(Env, Result, "debugPath", Apis->create_string_utf8(Env, DebugPath.c_str(), DebugPath.size()));
    Apis->add_return(Info, Result);
}

// __tgjsSetPromiseRejectCallback(handler)
void FPapiBackendJs::SetPromiseRejectHandlerCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    Self->SetPromiseRejectHandler(Apis->get_env(Info), GetArg(Apis, Info, 0));
}
}    // namespace PUERTS_NAMESPACE
