#pragma once

#include "CoreMinimal.h"
#include <functional>
#include <memory>

namespace puerts
{
class JSENV_API ILogger
{
public:
    virtual void Log(const FString& Message) const = 0;
    virtual void Info(const FString& Message) const = 0;
    virtual void Warn(const FString& Message) const = 0;
    virtual void Error(const FString& Message) const = 0;
};


class JSENV_API FDefaultLogger : public ILogger
{
public:
    virtual ~FDefaultLogger() {}
    void Log(const FString& Message) const override;
    void Info(const FString& Message) const override;
    void Warn(const FString& Message) const override;
    void Error(const FString& Message) const override;
};
}
