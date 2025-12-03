/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

import * as il2cpp_snippets from "./il2cpp_snippets.mjs"
const {invokePapi} = il2cpp_snippets;

function genBridgeArgs(parameterSignatures) {
    if (parameterSignatures.length != 0) {
        if (parameterSignatures[parameterSignatures.length -1][0] != 'V') {
            return `pesapi_value argv[${parameterSignatures.length}]{
        ${parameterSignatures.map((ps, i)=> il2cpp_snippets.CSValToJSVal(ps[0] == 'D' ? ps.substring(1) : ps, `p${i}`) || `${invokePapi('create_undefined')}(env)`).join(`,
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
    ${parameterSignatures.slice(0, -1).map((ps, i)=> `argv[${i}] = ${(il2cpp_snippets.CSValToJSVal(ps, `p${i}`) || `${invokePapi('create_undefined')}(env)`)};`).join(`
    `)}
    ${unpackMethod}(apis, env, p${parameterSignatures.length-1}, arrayLength, TIp${parameterSignatures.length-1}, argv + ${parameterSignatures.length  - 1});`;
        }
    } else {
        return 'pesapi_value *argv = nullptr;';
    }
}

function genBridge(bridgeInfo, isOptimizeSize) {
    var parameterSignatures = il2cpp_snippets.listToJsArray(bridgeInfo.ParameterSignatures);
    let hasVarArgs = parameterSignatures.length > 0 && parameterSignatures[parameterSignatures.length -1][0] == 'V'
    return t`
// ${bridgeInfo.CsName}
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
    struct pesapi_ffi* apis = delegateInfo->Apis;
    
    pesapi_env_ref envRef = ${invokePapi('get_ref_associated_env')}(delegateInfo->ValueRef);
    AutoValueScope valueScope(apis, envRef);
    auto env = ${invokePapi('get_env_from_ref')}(envRef);
    if (!env)
    {
        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException("JsEnv had been destroy"));
        ${IF(bridgeInfo.ReturnSignature != 'v')}
        return {};
        ${ENDIF()}
    }
    auto func = ${invokePapi('get_value_from_ref')}(env, delegateInfo->ValueRef);
    
    ${genBridgeArgs(parameterSignatures)}
    auto jsret = ${invokePapi('call_function')}(env, func, nullptr, ${parameterSignatures.length}${hasVarArgs ? ' + arrayLength - 1' : ''}, argv);
    
    if (${invokePapi('has_caught')}(valueScope.scope()))
    {
        auto msg = ${invokePapi('get_exception_as_string')}(valueScope.scope(), true);
        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException(msg));
    ${IF(bridgeInfo.ReturnSignature == 'v')}
    }
    ${ELSE()}
        return {};
    }
    ${il2cpp_snippets.returnToCS(bridgeInfo.ReturnSignature)}
    ${ENDIF()}
}
${IF(isOptimizeSize)}

static void b_${bridgeInfo.Signature}_Shared(void* target, ${parameterSignatures.map((S, i) => `Il2CppFullySharedGenericAny p${i}`).map(s => `${s}, `).join('')}${bridgeInfo.ReturnSignature != 'v' ? `Il2CppFullySharedGenericAny * il2ppRetVal,` : ''}MethodInfo* method) {
    ${IF(bridgeInfo.ReturnSignature != 'v')}
    *((${il2cpp_snippets.SToCPPType(bridgeInfo.ReturnSignature)} *)il2ppRetVal) =
    ${ENDIF()}
    b_${bridgeInfo.Signature}(target, ${parameterSignatures.map((S, i) => `${il2cpp_snippets.FromAny(S)}p${i}`).map(s => `${s}, `).join('')}method);
}
${ENDIF()}
`;
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
#include "TDataTrans.h"
#include "PuertsValueType.h"

namespace puerts
{

${bridgeInfos.map(bridgeInfo => genBridge(bridgeInfo, genInfos.IsOptimizeSize)).join('\n')}

static BridgeFuncInfo g_bridgeFuncInfos[] = {
    ${FOR(bridgeInfos, info => t`
    {"${info.Signature}", (Il2CppMethodPointer)b_${info.Signature}},
    `)}
    {nullptr, nullptr}
};

${genInfos.IsOptimizeSize ? `
static Il2CppMethodPointer g_bridgeSharedFuncs[] = {
    ${FOR(bridgeInfos, info => t`
    (Il2CppMethodPointer)b_${info.Signature}_Shared,
    `)}
    nullptr
};` : ''
}


Il2CppMethodPointer FindBridgeFunc(const char* signature, bool IsShared)
{
    auto begin = &g_bridgeFuncInfos[0];
    auto end = &g_bridgeFuncInfos[sizeof(g_bridgeFuncInfos) / sizeof(BridgeFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const BridgeFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        ${genInfos.IsOptimizeSize ? 'return IsShared ? g_bridgeSharedFuncs[first - begin] : first->Method' : 'return first->Method'};
    }
    return nullptr;
}

}

`;
}
