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

namespace PUERTS_NAMESPACE
{
// reads the script files of an env (ILoader of unity). The module system resolves a specifier by joining the paths only (no
// searching, no extension completion), the loader just reads the file of the resolved path
class IScriptFileLoader
{
public:
    // Path: relative to the script root, '/' separated, with the extension (e.g. "puerts/timer.js", "app/main.mjs").
    // Returns false if the file does not exist or can not be read. OutDebugPath is the path shown in the stack traces and the
    // debugger (the absolute path of the file on disk usually), left empty if there is none
    virtual bool ReadFile(const FString& Path, TArray<uint8>& OutContent, FString& OutDebugPath) = 0;

    virtual ~IScriptFileLoader()
    {
    }
};

// reads the files in Content/<ScriptRoot>, then in Content/JavaScript if ScriptRoot is not JavaScript
class SCRIPTENV_API FDefaultScriptFileLoader : public IScriptFileLoader
{
public:
    explicit FDefaultScriptFileLoader(const FString& InScriptRoot = TEXT("JavaScript")) : ScriptRoot(InScriptRoot)
    {
    }

    virtual bool ReadFile(const FString& Path, TArray<uint8>& OutContent, FString& OutDebugPath) override;

    // reads the file of the full path FullPath
    static bool ReadFileByFullPath(const FString& FullPath, TArray<uint8>& OutContent, FString& OutDebugPath);

    FString ScriptRoot;
};

}    // namespace PUERTS_NAMESPACE
