/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiBackendJs.h"
#include "PapiEnvScope.h"

namespace PUERTS_NAMESPACE
{
static FString ArgToFString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    FString Ret;
    size_t Len = 0;
    Apis->get_value_string_utf16(Env, Value, nullptr, &Len);
    if (Len > 0)
    {
        TArray<TCHAR>& CharArray = Ret.GetCharArray();
        CharArray.SetNumUninitialized(static_cast<int32>(Len) + 1);
        Apis->get_value_string_utf16(Env, Value, reinterpret_cast<uint16_t*>(CharArray.GetData()), &Len);
        CharArray[static_cast<int32>(Len)] = TEXT('\0');
    }
    return Ret;
}

// the string argument at Index, false (with an exception thrown) if it is not a string
static bool GetStringArg(struct pesapi_ffi* Apis, pesapi_callback_info Info, int Index, FString& Out)
{
    pesapi_env Env = Apis->get_env(Info);
    if (Apis->get_args_len(Info) <= Index || !Apis->is_string(Env, Apis->get_arg(Info, Index)))
    {
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("Bad parameters #%d, expect a string."), Index)));
        return false;
    }
    Out = ArgToFString(Apis, Env, Apis->get_arg(Info, Index));
    return true;
}

static void BindFunction(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Obj, const char* Key, pesapi_callback Callback, FPapiBackendJs* Backend)
{
    Apis->set_property(Env, Obj, Key, Apis->create_function(Env, Callback, Backend, nullptr));
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
            BindFunction(Apis, Env, PuertsObj, "genRequire", &GenRequire, this);
            BindFunction(Apis, Env, PuertsObj, "registerBuildinModule", &RegisterBuiltin, this);
        }
        Apis->set_property(Env, Global, "require", CreateRequire(Env, ""));
        // called by puerts/promises.js
        BindFunction(Apis, Env, Global, "__tgjsSetPromiseRejectCallback", &SetPromiseRejectHandlerCallback, this);
        if (EnvScope.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("js runtime start exception %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
        }
    }

    Host->ExecuteModule(TEXT("puerts/first_run.js"));
#if !defined(WITH_NODEJS)
    Host->ExecuteModule(TEXT("puerts/polyfill.js"));
#endif
    Host->ExecuteModule(TEXT("puerts/log.js"));
    Host->ExecuteModule(TEXT("puerts/uelazyload.js"));
    Host->ExecuteModule(TEXT("puerts/events.js"));
    // setTimeout/setInterval in js, driven by the tick handler of the host (__tgjsRegisterTickHandler), as unity
    Host->ExecuteModule(TEXT("puerts/timer.js"));
    Host->ExecuteModule(TEXT("puerts/promises.js"));
    Host->ExecuteModule(TEXT("puerts/argv.js"));
    Host->ExecuteModule(TEXT("puerts/jit_stub.js"));
    Host->ExecuteModule(TEXT("puerts/pesaddon.js"));
}

void FPapiBackendJs::OnExit(IPapiScriptHost* Host)
{
    FPapiEnvScope EnvScope(GetApi(), MainEnvRef);
    if (EnvScope)
    {
        StopRuntime();
    }
}

// puerts.genRequire(dir): a require resolving relative to dir
void FPapiBackendJs::GenRequire(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    FString Referrer;
    if (!GetStringArg(Apis, Info, 0, Referrer))
    {
        return;
    }
    // the referrer is the url of a module, one in the directory
    if (!Referrer.IsEmpty() && !Referrer.EndsWith(TEXT("/")) && !Referrer.EndsWith(TEXT("\\")))
    {
        Referrer += TEXT("/");
    }
    pesapi_value Require = Self->CreateRequire(Env, TCHAR_TO_UTF8(*Referrer));
    if (Require)
    {
        Apis->add_return(Info, Require);
    }
}

// puerts.registerBuildinModule(name, value)
void FPapiBackendJs::RegisterBuiltin(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    FString Name;
    if (!GetStringArg(Apis, Info, 0, Name))
    {
        return;
    }
    Self->RegisterBuiltinModule(Env, TCHAR_TO_UTF8(*Name), Apis->get_arg(Info, 1));
}

// __tgjsSetPromiseRejectCallback(handler)
void FPapiBackendJs::SetPromiseRejectHandlerCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendJs*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    Self->SetPromiseRejectHandler(Env, Apis->get_args_len(Info) > 0 ? Apis->get_arg(Info, 0) : Apis->create_undefined(Env));
}
}    // namespace PUERTS_NAMESPACE
