/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// The esm loader of the papi-quickjs backend, the same interface and behavior as papi_v8 (PapiV8ModuleLoader.h): the paths are
// resolved by joining only, .mjs files are loaded as esm (read by LoadFile), the other files are required by the require hook
// (the commonjs module system in js) and imported as a module whose `default` is the exports.
//
// Differences from papi_v8:
// - bytecode (an ArrayBuffer content) is not supported
// - the static and dynamic import of quickjs are served by its module normalize / loader hooks; a builtin module or a file
//   required imported by an esm is a C module (quickjs has no synthetic module) named "<kind#n>path", an esm is named by its
//   debug path
// - the esm modules of a failed load are discarded by renaming (quickjs can not delete a module which may be referred)

#include "pesapi.h"
#include "NamespaceDef.h"
#include "PString.h"
#include <functional>

namespace PUERTS_NAMESPACE
{
namespace papi_qjs
{
class FModuleLoader;

// see papi_v8::FLoadFileFunc
typedef std::function<pesapi_value(pesapi_env Env, const char* Path, PString& OutDebugPath)> FLoadFileFunc;

// see papi_v8::FLoadAddonFunc
typedef std::function<bool(pesapi_env Env, const char* Name)> FLoadAddonFunc;

// creates the loader of the env (one per context), must be called after the object mapper of the env is initialized
FModuleLoader* CreateModuleLoader(pesapi_env Env, FLoadFileFunc LoadFile, FLoadAddonFunc LoadAddon);

// releases all modules, must be called before the object mapper of the env is uninitialized
void DestroyModuleLoader(FModuleLoader* Loader);

// see papi_v8::ImportModule
pesapi_value ImportModule(pesapi_env Env, const char* Specifier, const char* Referrer);

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value);

// see papi_v8::GetBuiltinModule
pesapi_value GetBuiltinModule(pesapi_env Env, const char* Name);

// see papi_v8::SetHooks
void SetHooks(pesapi_env Env, pesapi_value Require, pesapi_value Resolve);

// see papi_v8::CompileCjs, Content must be the source
pesapi_value CompileCjs(pesapi_env Env, pesapi_value Content, const char* DebugPath, const char* Path);
}    // namespace papi_qjs
}    // namespace PUERTS_NAMESPACE
