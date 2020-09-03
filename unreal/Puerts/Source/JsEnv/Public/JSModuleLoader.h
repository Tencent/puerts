/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CoreMinimal.h"

namespace puerts
{
class IJSModuleLoader
{
public:
	virtual bool Search(const FString& RequiredDir, const FString& RequiredModule, FString& Path, FString& AbsolutePath) = 0;

	virtual bool Load(const FString& Path, TArray<uint8>& Content) = 0;

    virtual FString& GetScriptRoot() = 0;
        
    virtual ~IJSModuleLoader() {}
};

class JSENV_API DefaultJSModuleLoader : public IJSModuleLoader
{
public:
    explicit DefaultJSModuleLoader(const FString &InScriptRoot) : ScriptRoot(InScriptRoot){}

	bool Search(const FString& RequiredDir, const FString& RequiredModule, FString& Path, FString& AbsolutePath) override;

	bool Load(const FString& Path, TArray<uint8>& Content) override;

    FString& GetScriptRoot() override;

private:
	bool CheckExists(const FString& PathIn, FString& Path, FString& AbsolutePath);

	bool SearchModuleInDir(const FString& Dir, const FString&RequiredModule, FString& Path, FString& AbsolutePath);

    bool SearchModuleWithExtInDir(const FString& Dir, const FString&RequiredModule, FString& Path, FString& AbsolutePath);

    FString ScriptRoot;
};

}
