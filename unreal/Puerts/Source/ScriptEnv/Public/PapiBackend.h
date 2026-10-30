/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// The backend of an env: a script engine and the language running on it, the same layering as Puerts.Backend of unity
// (Backend -> BackendJs -> BackendV8). The env (the host) only uses this interface and the pesapi function table returned by
// GetApi, it does not depend on the implementation of a backend:
//
//   IPapiBackend    engine and language independent
//   FPapiBackendJs  the js language part (bootstrap scripts, module system bindings), engine independent
//   FPapiBackendV8  the v8 engine part (isolate, context, module loader, promise rejection tracking)
//
// Life cycle of an env:
//   CreateEnvRef -> (the host binds its functions) -> OnEnter -> ... -> OnExit -> DestroyEnvRef

#include "CoreMinimal.h"
#include "pesapi.h"
#include "NamespaceDef.h"
#include <functional>
#include <memory>

namespace PUERTS_NAMESPACE
{
class ScriptClassRegistry;
class ILogger;
struct JSClassDefinition;
class IPapiBackend;

// the engine independent parameters of a backend, given by the env to the factory of the backend
struct FPapiBackendParams
{
    std::shared_ptr<ILogger> Logger;

    // flags of the engine instance (for v8 only --max-old-space-size=<MB> is used)
    FString Flags;

    // called when the script class of a definition is created, the definition must be kept alive while the env is,
    // returns whether the class is named by its ScriptName
    std::function<bool(const JSClassDefinition* ClassDefinition)> OnClassCreated;

    // the cleanup of the host run by DestroyEnvRef after the env is released and before the engine instance is disposed
    std::function<void()> OnEnvReleased;
};

// creates the backend of an env, the only place the script engine is chosen (FJsEnv of the JsEnv module creates a v8 one)
using FPapiBackendFactory = std::function<std::unique_ptr<IPapiBackend>(const FPapiBackendParams& Params)>;

// the env a backend is entered into (ScriptEnv of unity)
class IPapiScriptHost
{
public:
    // loads and executes a script of the language (a bootstrap script or a module) by the loader of the host, errors are
    // reported by the host
    virtual void ExecuteModule(const FString& ModuleName) = 0;

protected:
    ~IPapiScriptHost() = default;
};

class IPapiBackend
{
public:
    virtual ~IPapiBackend() = default;

    // PESAPI_VERSION the backend is built with
    virtual int GetApiVersion() = 0;

    virtual struct pesapi_ffi* GetApi() = 0;

    // creates the engine instance and its env, returns the main ref of the env (released by DestroyEnvRef). One env per
    // backend instance
    virtual pesapi_env_ref CreateEnvRef() = 0;

    // destroys the env and the engine instance, the refs (pesapi_value_ref, pesapi_env_ref) still held become invalid
    virtual void DestroyEnvRef(pesapi_env_ref EnvRef) = 0;

    // initializes the language runtime after the host bound its functions (before any script of the host is executed)
    virtual void OnEnter(IPapiScriptHost* Host) = 0;

    // releases the language runtime, before the host releases its objects and DestroyEnvRef
    virtual void OnExit(IPapiScriptHost* Host) = 0;

    // module system, called inside a scope of the env. Returns the exports (nullptr with the exception thrown on failure),
    // ByImport selects the import or require semantics
    virtual pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport) = 0;

    // a module matched by name before the host is asked to resolve it
    virtual void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports) = 0;

    // the own string keys of a plain object of the language (a js object: Object.keys, a lua table, a python dict) as an
    // array (get_array_length / the 0 based get_property_uint32 of pesapi), used by the conversion of a plain object to a
    // struct (and puerts.merge). An empty array for a value which is not such an object, nullptr with the exception thrown on
    // failure. Called inside a scope of the env
    virtual pesapi_value GetOwnKeys(pesapi_env Env, pesapi_value Object) = 0;

    // memory management of the engine instance, called outside of any scope
    virtual void LowMemoryNotification() = 0;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) = 0;

    virtual void RequestMinorGarbageCollectionForTesting() = 0;

    virtual void RequestFullGarbageCollectionForTesting() = 0;

    // debugging of the engine instance (Backend.OpenRemoteDebugger/DebuggerTick/CloseRemoteDebugger of unity), called outside
    // of any scope, after CreateEnvRef and before DestroyEnvRef. Port < 0 opens no remote server, but the in-process session
    // used by hot reload is still available. Closed by DestroyEnvRef if not closed
    virtual void OpenRemoteDebugger(int32 Port)
    {
    }

    // processes the pending messages of the remote debugger. Returns false while waiting for a debugger to connect, true once
    // connected or if no debugger is opened (nothing to wait for)
    virtual bool DebuggerTick()
    {
        return true;
    }

    virtual void CloseRemoteDebugger()
    {
    }

    // diagnostics, called outside of any scope

    // the heap statistics of the engine instance in text
    virtual FString GetStatisticsLog()
    {
        return FString();
    }

    // the stack of the running script in text, empty if no script is running
    virtual FString CurrentStackTrace()
    {
        return FString();
    }

    // the class registry used by the env (pesapi set_registry), nullptr for the default registry
    virtual ScriptClassRegistry* GetRegistry()
    {
        return nullptr;
    }

    // whether the script engine is quickjs (the global isQuickJS() of the scripts)
    virtual bool IsQuickJS()
    {
        return false;
    }

    // native addons of the engine (RegisterAddon, the register function has a signature of the engine), called inside a scope
    // of the env. If an addon of the name is found, its exports are registered as a builtin module of the name and true is
    // returned
    virtual bool LoadAddon(pesapi_env Env, const char* Name)
    {
        return false;
    }

    // native objects of the class TypeId whose memory (Ptr, Size bytes) is owned by the script object and only needs
    // Deleter(Ptr, Size, DeleterData) to be freed, which may be called on any thread once the object is collected. The engine
    // may count the memory and free it off the main thread. The object is not cached (a later native_object_to_value of Ptr
    // creates another one). Called inside a scope of the env, nullptr / false if not supported (the host falls back to
    // native_object_to_value then)
    typedef void (*FTriviallyFreedDeleter)(void* Ptr, size_t Size, void* DeleterData);

    virtual pesapi_value CreateTriviallyFreedObject(
        pesapi_env Env, const void* TypeId, void* Ptr, size_t Size, FTriviallyFreedDeleter Deleter, void* DeleterData)
    {
        return nullptr;
    }

    // the same for the object being constructed by a constructor of a class (the this of Info)
    virtual bool BindTriviallyFreedObject(
        pesapi_callback_info Info, const void* TypeId, void* Ptr, size_t Size, FTriviallyFreedDeleter Deleter, void* DeleterData)
    {
        return false;
    }

    // the members of the objects of the script class Class (a root class, created by create_class) whose name is not found
    // are looked up again by the name FixName returns (FixName(name) -> the fixed name, or the name itself if it can not be
    // fixed), called inside a scope of the env. A backend which does not support it does nothing
    virtual void InstallNameFixing(pesapi_env Env, pesapi_value Class, pesapi_callback FixName)
    {
    }
};
}    // namespace PUERTS_NAMESPACE
