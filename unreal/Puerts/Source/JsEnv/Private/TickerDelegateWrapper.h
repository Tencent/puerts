/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX

#include "CoreMinimal.h"
#include <functional>

#pragma warning(push, 0)  
#include "v8.h"
#include "libplatform/libplatform.h"
#pragma warning(pop)

//对ticker delegate的封装，提供JS函数及其上下文
// 执行JS函数的FTickerDelegate包装类
class FTickerDelegateWrapper
{
public:
    // 参数用于控制函数是否持续定期执行
    explicit FTickerDelegateWrapper(bool Continue = true);

    ~FTickerDelegateWrapper();

    // 记录callback info传递过来的函数、上下文，以及处理JS异常的handler
    void Init(const v8::FunctionCallbackInfo<v8::Value> &Info, std::function<void(v8::Isolate*, v8::TryCatch*)> InExceptionHandler,
              std::function<void(FDelegateHandle*)> InDelegateHandleCleaner);

    // 调用JS函数
    bool CallFunction(float);

    void SetDelegateHandle(FDelegateHandle* Handle);
    
private:
    v8::Isolate* Isolate;

    v8::Global<v8::Context> DefaultContext;

    v8::Global<v8::Function> DefaultFunction;

    std::function<void(v8::Isolate*, v8::TryCatch*)> ExceptionHandler;

    std::function<void(FDelegateHandle*)> DelegateHandleCleaner;

private:
    v8::Isolate* GetIsolate();

    v8::Global<v8::Context>& GetContext();

    v8::Global<v8::Function>& GetFunction();

    const bool FunctionContinue;

    FDelegateHandle* DelegateHandle;
};

#endif  // PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
