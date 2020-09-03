/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include<stdint.h>

namespace puerts
{
class V8Inspector
{
public:
    virtual void Close() = 0;

    virtual bool Tick() = 0;

    virtual ~V8Inspector() {}
};

// 接受端口和v8::Local<v8::Context>指针，返回一个新的V8Inspector指针
V8Inspector* CreateV8Inspector(int32_t Port, void* InContextPtr);
};