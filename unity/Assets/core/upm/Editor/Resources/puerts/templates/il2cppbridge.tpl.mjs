/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

import * as il2cpp_snippets from "./il2cpp_snippets.mjs"

function genBridgeArgs(parameterSignatures) {
    if (parameterSignatures.length != 0) {
        if (parameterSignatures[parameterSignatures.length -1][0] != 'V') {
            return `pesapi_value argv[${parameterSignatures.length}]{
        ${parameterSignatures.map((ps, i)=> il2cpp_snippets.CSValToJSVal(ps, `p${i}`) || 'pesapi_create_undefined(env)').join(`,
        `)}
    };`
        } else {
            const si = parameterSignatures[parameterSignatures.length -1].substring(1);
            let unpackMethod = 'Params<Il2CppObject*>::UnPackRefOrBoxedValueType';
            if (si in il2cpp_snippets.PrimitiveSignatureCppTypeMap) {
                unpackMethod = `Params<${il2cpp_snippets.PrimitiveSignatureCppTypeMap[si]}>::UnPackPrimitive`;
            } else if (il2cpp_snippets.isStructOrNullableStruct(si)) {
                unpackMethod = `Params<${si}>::UnPackValueType`;
            } 
            return `auto arrayLength = il2cpp::vm::Array::GetLength(p${parameterSignatures.length - 1});
    pesapi_value *argv = (pesapi_value *)alloca(sizeof(pesapi_value) * (${parameterSignatures.length  - 1} + arrayLength));
    memset(argv, 0, sizeof(pesapi_value) * (${parameterSignatures.length  - 1} + arrayLength));
    ${parameterSignatures.slice(0, -1).map((ps, i)=> `argv[${i}] = ${(il2cpp_snippets.CSValToJSVal(ps, `p${i}`) || 'pesapi_create_undefined(env)')};`).join(`
    `)}
    ${unpackMethod}(env, p${parameterSignatures.length-1}, arrayLength, TIp${parameterSignatures.length-1}, argv + ${parameterSignatures.length  - 1});`;
        }
    } else {
        return 'pesapi_value *argv = nullptr;';
    }
}

function genBridge(bridgeInfo) {
    var parameterSignatures = il2cpp_snippets.listToJsArray(bridgeInfo.ParameterSignatures);
    let hasVarArgs = parameterSignatures.length > 0 && parameterSignatures[parameterSignatures.length -1][0] == 'V'
    return t`
static ${il2cpp_snippets.SToCPPType(bridgeInfo.ReturnSignature)} b_${bridgeInfo.Signature}(void* target, ${parameterSignatures.map((S, i) => `${il2cpp_snippets.SToCPPType(S)} p${i}`).map(s => `${s}, `).join('')}MethodInfo* method) {
    // PLog("Running b_${bridgeInfo.Signature}");

    ${IF(bridgeInfo.ReturnSignature && !(il2cpp_snippets.getSignatureWithoutRefAndPrefix(bridgeInfo.ReturnSignature) in il2cpp_snippets.PrimitiveSignatureCppTypeMap))}
    auto TIret = GetReturnType(method);
    ${ENDIF()}
    ${FOR(parameterSignatures, (ps, index) => t`
        ${IF(!(il2cpp_snippets.getSignatureWithoutRefAndPrefix(ps) in il2cpp_snippets.PrimitiveSignatureCppTypeMap))}
    auto TIp${index} = GetParameterType(method, ${index});
        ${ENDIF()}
    `)}

    PObjectRefInfo* delegateInfo = GetPObjectRefInfo(target);
    
    AutoValueScope valueScope(delegateInfo->EnvRef);
    auto env = pesapi_get_env_from_ref(delegateInfo->EnvRef);
    if (!env)
    {
        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException("JsEnv had been destroy"));
        ${IF(bridgeInfo.ReturnSignature != 'v')}
        return {};
        ${ENDIF()}
    }
    auto func = pesapi_get_value_from_ref(env, delegateInfo->ValueRef);
    
    ${genBridgeArgs(parameterSignatures)}
    auto jsret = pesapi_call_function(env, func, nullptr, ${parameterSignatures.length}${hasVarArgs ? ' + arrayLength - 1' : ''}, argv);
    
    if (pesapi_has_caught(valueScope.scope))
    {
        auto msg = pesapi_get_exception_as_string(valueScope.scope, true);
        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException(msg));
    ${IF(bridgeInfo.ReturnSignature == 'v')}
    }
    ${ELSE()}
        return {};
    }
    ${il2cpp_snippets.returnToCS(bridgeInfo.ReturnSignature)}
    ${ENDIF()}
}`;
}

export default function Gen(genInfos) {
    var bridgeInfos = il2cpp_snippets.listToJsArray(genInfos.BridgeInfos);
    console.log(`bridge:${bridgeInfos.length}`);
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
#include "UnityExports4Puerts.h"
#include "TDataTrans.h"
#include "PuertsValueType.h"

namespace puerts
{

${bridgeInfos.map(genBridge).join('\n')}

static BridgeFuncInfo g_bridgeFuncInfos[] = {
    ${FOR(bridgeInfos, info => t`
    {"${info.Signature}", (MethodPointer)b_${info.Signature}},
    `)}
    {nullptr, nullptr}
};


MethodPointer FindBridgeFunc(const char* signature)
{
    auto begin = &g_bridgeFuncInfos[0];
    auto end = &g_bridgeFuncInfos[sizeof(g_bridgeFuncInfos) / sizeof(BridgeFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const BridgeFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        return first->Method;
    }
    return nullptr;
}

}

`;
}
