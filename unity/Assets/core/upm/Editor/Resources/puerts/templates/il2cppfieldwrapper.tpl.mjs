/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

import * as il2cpp_snippets from "./il2cpp_snippets.mjs"

function genGetField(fieldWrapperInfo) {
    const signature = fieldWrapperInfo.ReturnSignature;
    if (il2cpp_snippets.isStructOrNullableStruct(signature)) { //valuetype
        if (il2cpp_snippets.needThis(fieldWrapperInfo)) {
            return `auto ret = (char*)self + offset;

    ${invokePapi('add_return')}(info, ${invokePapi('native_object_to_value')}(env, TIret, ret, false));`
        } else {
            return `auto ret = GetValueTypeFieldPtr(nullptr, fieldInfo, offset);

    ${invokePapi('add_return')}(info, ${invokePapi('native_object_to_value')}(env, TIret, ret, false));`
        }
    } else {
        return `${il2cpp_snippets.SToCPPType(fieldWrapperInfo.ReturnSignature)} ret;

    GetFieldValue(${il2cpp_snippets.needThis(fieldWrapperInfo) ? 'self, ': 'nullptr, '}fieldInfo, offset, &ret);
    
    ${il2cpp_snippets.returnToJS(fieldWrapperInfo.ReturnSignature)}`
    }
}

function genFieldWrapper(fieldWrapperInfo) {
    return t`
static void ifg_${fieldWrapperInfo.Signature}(struct pesapi_ffi* apis, pesapi_callback_info info, FieldInfo* fieldInfo, size_t offset, Il2CppClass* TIret) {
    // PLog("Running ifg_${fieldWrapperInfo.Signature}");

    pesapi_env env = ${invokePapi('get_env')}(info);
    ${IF(il2cpp_snippets.needThis(fieldWrapperInfo))}

    ${il2cpp_snippets.getThis(fieldWrapperInfo.ThisSignature)}

    ${ENDIF()}
    ${genGetField(fieldWrapperInfo)}
}

static void ifs_${fieldWrapperInfo.Signature}(struct pesapi_ffi* apis, pesapi_callback_info info, FieldInfo* fieldInfo, size_t offset, Il2CppClass* TIp) {
    // PLog("Running ifs_${fieldWrapperInfo.Signature}");
    
    pesapi_env env = ${invokePapi('get_env')}(info);
    ${IF(il2cpp_snippets.needThis(fieldWrapperInfo))}

    ${il2cpp_snippets.getThis(fieldWrapperInfo.ThisSignature)}

    ${ENDIF()}    
    ${il2cpp_snippets.JSValToCSVal(fieldWrapperInfo.ReturnSignature, `${invokePapi('get_arg')}(info, 0)`, "p")}
    SetFieldValue(${il2cpp_snippets.needThis(fieldWrapperInfo) ? 'self, ': 'nullptr, '}fieldInfo, offset, ${['o', 's', 'p', 'a'].indexOf(fieldWrapperInfo.Signature) != -1 ? 'p' : '&p'});
}`;
}

export default function Gen(genInfos) {
    var fieldWrapperInfos = il2cpp_snippets.listToJsArray(genInfos.FieldWrapperInfos);
    console.log(`fieldWrapper:${fieldWrapperInfos.length}`);
    return `// Auto Gen

#include "il2cpp-api.h"
#include "il2cpp-class-internals.h"
#include "il2cpp-object-internals.h"
#include "vm/InternalCalls.h"
#include "vm/Object.h"
#include "vm/Array.h"
#include "vm/Runtime.h"
#include "vm/Reflection.h"
#include "vm/MetadataCache.h"
#include "vm/Field.h"
#include "vm/GenericClass.h"
#include "vm/Thread.h"
#include "vm/Method.h"
#include "vm/Parameter.h"
#include "vm/Image.h"
#include "utils/StringUtils.h"
#include "gc/WriteBarrier.h"
#include "pesapi.h"
#include "TDataTrans.h"
#include "PuertsValueType.h"


namespace puerts
{
${fieldWrapperInfos.map(genFieldWrapper).join('\n')}

static FieldWrapFuncInfo g_fieldWrapFuncInfos[] = {
    ${FOR(fieldWrapperInfos, info => t`
    {"${info.Signature}", ifg_${info.Signature}, ifs_${info.Signature}},
    `)}
    {nullptr, nullptr, nullptr}    
};

FieldWrapFuncInfo * FindFieldWrapFuncInfo(const char* signature)
{
    auto begin = &g_fieldWrapFuncInfos[0];
    auto end = &g_fieldWrapFuncInfos[sizeof(g_fieldWrapFuncInfos) / sizeof(FieldWrapFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const FieldWrapFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        return first;
    }
    return nullptr;
}

}

`;
}
