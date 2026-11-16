/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// The esm loader of the papi-v8 backend: compiles, links, evaluates and caches the esm in C++. The paths are resolved by
// joining only (as unity): a specifier starting with "./" or "../" is joined to the directory of the importing module, others
// are relative to the root; no searching, no extension completion.
//
//   - a builtin module (RegisterBuiltinModule, or an addon loaded by LoadAddon for a name without '.' and '/') is matched first
//   - then the resolve hook (SetHooks) may return the path of the specifier
//   - .mjs / .mbc (bytecode) are loaded as esm, the file is read by LoadFile
//   - the other files are required by the require hook (the commonjs module system in js) and imported as a synthetic module:
//     `default` is the exports, its own properties are named exports. The exports are cached by the path
//
// Engine independent interface, only pesapi types are used.

#include "pesapi.h"
#include "NamespaceDef.h"
#include "PString.h"
#include <cstdint>
#include <functional>

namespace PUERTS_NAMESPACE
{
namespace papi_v8
{
class FModuleLoader;

// reads the file of the path (relative to the root), the content is a string or an ArrayBuffer (bytecode), nullptr if not found
typedef std::function<pesapi_value(pesapi_env Env, const char* Path, PString& OutDebugPath)> FLoadFileFunc;

// loads the addon of the name (registers it as a builtin module), false if there is no such addon
typedef std::function<bool(pesapi_env Env, const char* Name)> FLoadAddonFunc;

// creates the loader of the env (one per isolate), must be called after the object mapper of the env is initialized
FModuleLoader* CreateModuleLoader(pesapi_env Env, FLoadFileFunc LoadFile, FLoadAddonFunc LoadAddon);

// releases all modules, must be called before the object mapper of the env is uninitialized
void DestroyModuleLoader(FModuleLoader* Loader);

// imports (loads, links and evaluates) the module synchronously, Referrer is the path of the importing module ("" for the
// root). Returns the namespace of an esm, the value of a builtin module or the exports of a file required; nullptr with the
// exception thrown to js on failure (a top-level await which can not be settled synchronously is a failure)
pesapi_value ImportModule(pesapi_env Env, const char* Specifier, const char* Referrer);

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value);

// the value of the builtin module, nullptr if not registered
pesapi_value GetBuiltinModule(pesapi_env Env, const char* Name);

// Require(path): the exports of the file (not esm) imported; Resolve(specifier, referrer): the path of the specifier, or
// undefined for the default rules. A value which is not a function clears the hook
void SetHooks(pesapi_env Env, pesapi_value Require, pesapi_value Resolve);

// the function (exports, require, module, __filename, __dirname) of a commonjs module, Content is the source or the bytecode
// (an ArrayBuffer) of it. The dynamic imports in it are relative to Path. nullptr with the exception thrown on failure
pesapi_value CompileCjs(pesapi_env Env, pesapi_value Content, const char* DebugPath, const char* Path);

// the bytecode header fields which must match the running v8, bytecode with other values is patched before consumed
void SetCodeCacheExpect(pesapi_env Env, uint32_t FlagHash, uint32_t ReadOnlySnapshotChecksum);
}    // namespace papi_v8
}    // namespace PUERTS_NAMESPACE
