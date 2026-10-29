/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// Module loader of the papi-v8 backend: compiles, links, evaluates and caches ESM / CJS / JSON modules in C++, no bootstrap
// js is needed. The host only finds and reads modules through two functions it sets on the global before the first module
// is loaded (taken and deleted from the global by the loader on first use):
//
//   __puer_host_resolve__(specifier, referrerUrl /* "" for an entry */, by /* "import" | "require" */) -> url | undefined
//   __puer_host_load__(url, by) -> { kind: "esm" | "cjs" | "json", content: string | ArrayBuffer, debugPath?: string }
//
// The url is the cache key of a module (with the kind returned by the load function). An ArrayBuffer content is bytecode.
// Builtin modules are registered by RegisterBuiltinModule and matched before the host resolve function is called, the host
// may register a builtin module lazily in its resolve function and return its name.
//
// Engine independent interface, only pesapi types are used, it will be merged into the backend api of the shared papi dll.

#ifndef WITH_QUICKJS

#include "pesapi.h"
#include "NamespaceDef.h"
#include <cstdint>

namespace PUERTS_NAMESPACE
{
namespace papi_v8
{
class FModuleLoader;

// creates the loader of the env (one per isolate), must be called after the object mapper of the env is initialized
FModuleLoader* CreateModuleLoader(pesapi_env Env);

// releases all modules, must be called before the object mapper of the env is uninitialized
void DestroyModuleLoader(FModuleLoader* Loader);

// loads and evaluates the module, ByImport selects the import or require semantics (passed to the host functions).
// returns the namespace of an esm, module.exports of a cjs, the value of a json or a builtin module; returns nullptr with
// the exception thrown to js on failure (a top-level await which can not be settled synchronously is a failure).
pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport);

// a require function resolving relative to Referrer (a url, "" for the root), the same as the `require` of a cjs module
pesapi_value CreateRequire(pesapi_env Env, const char* Referrer);

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value);

// a require function tried before the host for a bare specifier (not starting with '.' or '/') required by require, the
// exports it returns are kept as a builtin module of the name, if it throws the host resolves the specifier. Used for the
// require of node. A value which is not a function clears it
void SetFallbackRequire(pesapi_env Env, pesapi_value Require);

// the bytecode header fields which must match the running v8, bytecode with other values is patched before consumed
void SetCodeCacheExpect(pesapi_env Env, uint32_t FlagHash, uint32_t ReadOnlySnapshotChecksum);
}    // namespace papi_v8
}    // namespace PUERTS_NAMESPACE

#endif
