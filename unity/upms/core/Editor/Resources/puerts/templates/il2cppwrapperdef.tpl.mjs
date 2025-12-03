/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

import * as il2cpp_snippets from "./il2cpp_snippets.mjs"
const {invokePapi} = il2cpp_snippets;

function genFuncWrapper(wrapperInfo) {
    var parameterSignatures = il2cpp_snippets.listToJsArray(wrapperInfo.ParameterSignatures);

    return t`
// ${wrapperInfo.CsName}
bool w_${wrapperInfo.Signature}(struct pesapi_ffi* apis, MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, pesapi_env env, void* self, bool checkJSArgument, WrapData* wrapData) {
    // PLog("Running w_${wrapperInfo.Signature}");
    
    ${il2cpp_snippets.declareTypeInfo(wrapperInfo)}

    int js_args_len = ${invokePapi('get_args_len')}(info);
    
${parameterSignatures.map((x, i) => `    pesapi_value _sv${i} = ${invokePapi('get_arg')}(info, ${i});`).join('\n')}

    if (${parameterSignatures.filter(s => s[0] == 'D').length ? 'true' : 'checkJSArgument'}) {
        if (${il2cpp_snippets.genArgsLenCheck(parameterSignatures)}) return false;
        ${FOR(parameterSignatures, (x, i) => t`
        ${il2cpp_snippets.checkJSArg(x, i)}
        `)}
    }
    
${parameterSignatures.map((x, i) => il2cpp_snippets.JSValToCSVal(x, `_sv${i}`, `p${i}`)).join('\n')}

    typedef ${il2cpp_snippets.SToCPPType(wrapperInfo.ReturnSignature)} (*FuncToCall)(${il2cpp_snippets.needThis(wrapperInfo) ? 'void*,' : ''}${parameterSignatures.map((S, i) => `${il2cpp_snippets.SToCPPType(S)} p${i}`).map(s => `${s}, `).join('')}const void* method);
    ${IF(wrapperInfo.ReturnSignature != 'v')}${il2cpp_snippets.SToCPPType(wrapperInfo.ReturnSignature)} ret = ${ENDIF()}((FuncToCall)methodPointer)(${il2cpp_snippets.needThis(wrapperInfo) ? 'self,' : ''} ${parameterSignatures.map((_, i) => `p${i}, `).join('')} method);

    ${FOR(parameterSignatures, (x, i) => t`
    ${il2cpp_snippets.refSetback(x, i, wrapperInfo)}
    `)}
    
    ${IF(wrapperInfo.ReturnSignature != "v")}
    ${il2cpp_snippets.returnToJS(wrapperInfo.ReturnSignature)}
    ${ENDIF()}
    return true;
}`;
}

export default function Gen(genInfos) {
    var wrapperInfos = il2cpp_snippets.listToJsArray(genInfos.WrapperInfos);
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
#if defined(__EMSCRIPTEN__)
#include "pesapi_webgl.h"
using namespace pesapi::webglimpl;
#endif

namespace puerts
{

${wrapperInfos.map(genFuncWrapper).join('\n')}

}

`;
}
