/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

namespace puerts
{

typedef void (*FuncPtr)(void);


enum JsValueType
{
    NullOrUndefined = 1,
    BigInt          = 2,
    Number          = 4,
    String          = 8,
    Boolean         = 16,
    NativeObject    = 32,
    JsObject        = 64,
    Array           = 128,
    Function        = 256,
    Date            = 512,
    ArrayBuffer     = 1024,
    Unknow          = 2048,
};


}

