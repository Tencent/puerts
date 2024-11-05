/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

import * as il2cpp_snippets from "./il2cpp_snippets.mjs"

export default function Gen(genInfos) {
    var wrapperInfos = il2cpp_snippets.listToJsArray(genInfos.WrapperInfos);
    console.log(`wrappers:${wrapperInfos.length}`);
    return `// Auto Gen

#include <memory>
#include "il2cpp-api.h"
#include "il2cpp-class-internals.h"
#include "il2cpp-object-internals.h"
#include "vm/Object.h"
#include "pesapi.h"
#include "TDataTrans.h"

namespace puerts
{

${wrapperInfos.map((wrapperInfo) => `bool w_${wrapperInfo.Signature}(struct pesapi_ffi* apis, MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, pesapi_env env, void* self, bool checkJSArgument, WrapData* wrapData);`).join('\n')}

static WrapFuncInfo g_wrapFuncInfos[] = {
    ${FOR(wrapperInfos, info => t`
    {"${info.Signature}", w_${info.Signature}},
    `)}
    {nullptr, nullptr}
};

WrapFuncPtr FindWrapFunc(const char* signature)
{
    auto begin = &g_wrapFuncInfos[0];
    auto end = &g_wrapFuncInfos[sizeof(g_wrapFuncInfos) / sizeof(WrapFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const WrapFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        return first->Method;
    }
    return nullptr;
}

}

`;
}
