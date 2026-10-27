/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CoreMinimal.h"
#include "Misc/Paths.h"
#include "HAL/FileManager.h"
#include "HAL/PlatformProcess.h"
#include "Modules/ModuleInterface.h"
#include "Modules/ModuleManager.h"

#if WITH_PYTHON
THIRD_PARTY_INCLUDES_START
// PY_MAJOR_VERSION only, Python.h would link this module to python
#include "patchlevel.h"
THIRD_PARTY_INCLUDES_END
#endif

// the python shared library of the engine is not on the search path of the dlls, it is loaded before PapiPython links to it
// (the data symbols of python, Py_None and the types, can not be delay loaded)
class FPapiPythonPreloadModule : public IModuleInterface
{
public:
    virtual void StartupModule() override
    {
#if WITH_PYTHON && (PLATFORM_WINDOWS || PLATFORM_LINUX)
        FString PythonDir = UTF8_TO_TCHAR(UE_PYTHON_DIR);
        PythonDir.ReplaceInline(TEXT("{ENGINE_DIR}"), *FPaths::EngineDir(), ESearchCase::CaseSensitive);
        FPaths::NormalizeDirectoryName(PythonDir);
        FPaths::RemoveDuplicateSlashes(PythonDir);
#if PLATFORM_WINDOWS
        const FString Wildcard = FString::Printf(TEXT("python%d*.dll"), PY_MAJOR_VERSION);
#else
        const FString Wildcard = FString::Printf(TEXT("libpython%d*.so.1.0"), PY_MAJOR_VERSION);
        PythonDir /= TEXT("lib");
#endif
        TArray<FString> Names;
        IFileManager::Get().FindFiles(Names, *(PythonDir / Wildcard), true, false);
        for (const FString& Name : Names)
        {
            FString Path = PythonDir / Name;
            FPaths::NormalizeFilename(Path);
            if (void* Handle = FPlatformProcess::GetDllHandle(*Path))
            {
                Handles.Add(Handle);
            }
        }
#endif
    }

    virtual void ShutdownModule() override
    {
        for (void* Handle : Handles)
        {
            FPlatformProcess::FreeDllHandle(Handle);
        }
        Handles.Reset();
    }

private:
    TArray<void*> Handles;
};

IMPLEMENT_MODULE(FPapiPythonPreloadModule, PapiPythonPreload)
