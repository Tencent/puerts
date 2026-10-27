/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// Module loader of the papi-quickjs backend, the same interface and behavior as papi_v8 (PapiV8ModuleLoader.h):
//
//   __puer_host_resolve__(specifier, referrerUrl /* "" for an entry */, by /* "import" | "require" */) -> url | undefined
//   __puer_host_load__(url, by) -> { kind: "esm" | "cjs" | "json", content: string, debugPath?: string }
//
// Differences from papi_v8:
// - bytecode (an ArrayBuffer content) is not supported
// - the static and dynamic import of quickjs are served by its module normalize / loader hooks; a cjs / json / builtin module
//   imported by an esm is a C module (quickjs has no synthetic module) named "<kind#n>url", an esm is named by its debugPath
// - the esm modules of a failed load are discarded by renaming (quickjs can not delete a module which may be referred)

#include "pesapi.h"
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
namespace papi_qjs
{
class FModuleLoader;

// creates the loader of the env (one per context), must be called after the object mapper of the env is initialized
FModuleLoader* CreateModuleLoader(pesapi_env Env);

// releases all modules, must be called before the object mapper of the env is uninitialized
void DestroyModuleLoader(FModuleLoader* Loader);

// see papi_v8::ExecuteModule
pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport);

pesapi_value CreateRequire(pesapi_env Env, const char* Referrer);

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value);
}    // namespace papi_qjs
}    // namespace PUERTS_NAMESPACE
