/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <vector>
#include <string>

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "V8Utils.h"

#define FUNCTION_INDEX_KEY  "_psid"

namespace puerts
{
struct FValue
{
    JsValueType Type;
    std::string Str;
    union
    {
        double Number;
        bool Boolean;
        int64_t BigInt;
        struct 
        {
            void *ObjectPtr;
            int ClassID;
        } ObjectInfo;
        struct
        {
            unsigned char *Bytes;
            int Length;
        } ArrayBuffer;
        
        class JSFunction *FunctionPtr;
    };
};

struct FResultInfo
{
    v8::Isolate* Isolate;

    v8::UniquePersistent<v8::Context> Context;

    v8::UniquePersistent<v8::Value> Result;
};

class JSFunction
{
public:
    JSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction, int32_t InIndex);

    ~JSFunction();

    bool Invoke(bool HasResult);

    std::vector<FValue> Arguments;

    v8::UniquePersistent<v8::Function> GFunction;

    std::string LastExceptionInfo;

    FResultInfo ResultInfo;

    int32_t Index;
};
}