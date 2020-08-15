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
    explicit DefaultJSModuleLoader(const FString &SR) : ScriptRoot(SR){}

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
