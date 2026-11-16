/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PuertsNamespaceDef.h"

#include "CoreMinimal.h"
#include "ScriptFileLoader.h"

#include <memory>

namespace PUERTS_NAMESPACE
{
// the module loader of the old versions, kept for compatibility (FJsEnv / FJsEnvGroup wrap it as an IScriptFileLoader). A new
// loader should implement IScriptFileLoader, the module system no longer searches the modules
class IJSModuleLoader
{
public:
    virtual bool Search(const FString& RequiredDir, const FString& RequiredModule, FString& Path, FString& AbsolutePath) = 0;

    virtual bool Load(const FString& Path, TArray<uint8>& Content) = 0;

    virtual FString& GetScriptRoot() = 0;

    virtual ~IJSModuleLoader()
    {
    }
};

class JSENV_API DefaultJSModuleLoader : public IJSModuleLoader
{
public:
    explicit DefaultJSModuleLoader(const FString& InScriptRoot) : ScriptRoot(InScriptRoot)
    {
    }

    virtual bool Search(const FString& RequiredDir, const FString& RequiredModule, FString& Path, FString& AbsolutePath) override;

    virtual bool Load(const FString& Path, TArray<uint8>& Content) override;

    virtual FString& GetScriptRoot() override;

    virtual bool CheckExists(const FString& PathIn, FString& Path, FString& AbsolutePath);

    virtual bool SearchModuleInDir(const FString& Dir, const FString& RequiredModule, FString& Path, FString& AbsolutePath);

    virtual bool SearchModuleWithExtInDir(const FString& Dir, const FString& RequiredModule, FString& Path, FString& AbsolutePath);

    FString ScriptRoot;
};

// an IScriptFileLoader reading the files by an IJSModuleLoader: the path is searched from the root (Search("", Path)) and the
// file found is loaded
class JSENV_API FJSModuleLoaderAdapter : public IScriptFileLoader
{
public:
    explicit FJSModuleLoaderAdapter(std::shared_ptr<IJSModuleLoader> InModuleLoader) : ModuleLoader(std::move(InModuleLoader))
    {
    }

    virtual bool ReadFile(const FString& Path, TArray<uint8>& OutContent, FString& OutDebugPath) override;

    std::shared_ptr<IJSModuleLoader> ModuleLoader;
};

}    // namespace PUERTS_NAMESPACE
