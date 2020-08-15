#pragma once

#include <map>
#include <string>
#include <algorithm>
#include <functional>
#include <memory>

#include "CoreMinimal.h"
#include "UObject/GCObject.h"
#include "Containers/Ticker.h"
#include "ObjectRetainer.h"
#include "JSEngine.h"
#include "JSModuleLoader.h"

namespace puerts
{
class JSENV_API IJsEnv
{
public:
    virtual void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>> &Arguments) = 0;

    virtual void LowMemoryNotification() = 0;

    virtual ~IJsEnv() {}
};

class JSENV_API FJsEnv// : public TSharedFromThis<FJsEnv> // only a wrapper
{
public:
    explicit FJsEnv(const FString &ScriptRoot = TEXT("JavaScript"));

    FJsEnv(std::unique_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger);

    void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>> &Arguments = TArray<TPair<FString, UObject*>>());

    void LowMemoryNotification();

private:
    std::unique_ptr<IJsEnv> GameScript;
};

}
