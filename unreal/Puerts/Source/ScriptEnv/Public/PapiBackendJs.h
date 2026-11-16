/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PapiBackend.h"
#include "JSLogger.h"
#include <memory>

namespace PUERTS_NAMESPACE
{
// the js language part of a backend (BackendJs of unity), engine independent: binds the module system and the promise
// rejection handler of js to the `puerts` object (created by the host) and the global, and executes the bootstrap scripts.
//
// The module system (the same as unity):
//   - commonjs is implemented in js (puerts/module.js): require joins the specifier to the directory of the requiring module
//     and loads the file of the path (no searching, no extension completion), the exports are cached weakly and the modules
//     are required lazily by default
//   - esm is implemented by the engine part in C++: a relative specifier ("./", "../") is joined to the directory of the
//     importing module, others are relative to the root. .mjs (.mbc) are loaded as esm, the other files are required by
//     puerts/module.js and imported as a synthetic module (default is the exports, its own properties are named exports)
class SCRIPTENV_API FPapiBackendJs : public IPapiBackend
{
public:
    explicit FPapiBackendJs(const FPapiBackendParams& InParams) : Logger(InParams.Logger), LoadFile(InParams.LoadFile)
    {
    }

    virtual void OnEnter(IPapiScriptHost* Host) override;

    virtual void OnExit(IPapiScriptHost* Host) override;

    // require: the specifier is relative to the root ("" referrer) or the directory of Referrer, ".js" is added if there is no
    // extension; import: see ImportModule
    virtual pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport) override;

    // a js Proxy at the end of the prototype chain of the class
    virtual void InstallNameFixing(pesapi_env Env, pesapi_value Class, pesapi_callback FixName) override;

protected:
    // the engine part of the js runtime, called inside a scope of the env

    // starts the module loader and the promise rejection tracking of the env
    virtual void StartRuntime(pesapi_env Env) = 0;

    // stops what StartRuntime started, while the env is alive
    virtual void StopRuntime() = 0;

    // imports (loads, links and evaluates) the module synchronously, returns its namespace (the value for a builtin module),
    // nullptr with the exception thrown on failure (a top-level await which can not be settled synchronously is a failure)
    virtual pesapi_value ImportModule(pesapi_env Env, const char* Specifier, const char* Referrer) = 0;

    // the value of the builtin module registered by RegisterBuiltinModule, nullptr if not registered
    virtual pesapi_value GetBuiltinModule(pesapi_env Env, const char* Name) = 0;

    // set by puerts/module.js: Require(path) returns the exports of the file of the path (relative to the root), used for the
    // files other than esm imported; Resolve(specifier, referrer) returns the path of the specifier or undefined (the default
    // rules), used for import. A value which is not a function clears the hook
    virtual void SetModuleHooks(pesapi_env Env, pesapi_value Require, pesapi_value Resolve) = 0;

    // the function of a commonjs module: (exports, require, module, __filename, __dirname) => ..., Content is the source or
    // the bytecode (an ArrayBuffer) of it. Path is the path of the module, the referrer of the dynamic imports in it
    virtual pesapi_value CompileCjs(pesapi_env Env, pesapi_value Content, const char* DebugPath, const char* Path) = 0;

    // handler(event, promise, value), a value which is not a function clears it
    virtual void SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler) = 0;

    std::shared_ptr<ILogger> Logger;

    // reads the files of the module system (FPapiBackendParams::LoadFile)
    std::function<pesapi_value(pesapi_env Env, const char* Path, PString& OutDebugPath)> LoadFile;

    // the main ref of the env, set by CreateEnvRef of the engine part
    pesapi_env_ref MainEnvRef = nullptr;

private:
    static void ImportSyncCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void CompileCjsCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void SetModuleHooksCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetBuiltinModuleCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void RegisterBuiltinModuleCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void LoadFileCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void SetPromiseRejectHandlerCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // the require hook of puerts/module.js (see SetModuleHooks), used by ExecuteModule, released by OnExit
    pesapi_value_ref RequireHook = nullptr;

    // the cached functions of InstallNameFixing, released by OnExit
    pesapi_value_ref NameFixingProxy = nullptr;

    pesapi_value_ref SetPrototypeOf = nullptr;
};
}    // namespace PUERTS_NAMESPACE
