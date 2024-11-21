/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

import * as il2cpp_snippets from "./il2cpp_snippets.mjs"

function defineValueType(valueTypeInfo) {
    // TODO 会存在一个 IsEnum 且 IsGenericParameter 的类型，signature为空，先过滤处理，晚点彻查。
    if (!valueTypeInfo.Signature) return ''
    var fieldSignatures = il2cpp_snippets.listToJsArray(valueTypeInfo.FieldSignatures);
    return t`// ${valueTypeInfo.CsName}
struct ${valueTypeInfo.Signature}
{
    ${IF(fieldSignatures.length == 0)}
    union
    {
        struct
        {
        };
        uint8_t __padding[1];
    };
    ${ELSE()}
    ${FOR(fieldSignatures, (s, i) => t`
    ${IF(il2cpp_snippets.isNullableStruct(valueTypeInfo.Signature) && i == valueTypeInfo.NullableHasValuePosition)}
    ${il2cpp_snippets.SToCPPType(s)} hasValue;
    ${ELSE()}
    ${il2cpp_snippets.SToCPPType(s)} p${i};
    ${ENDIF()}
    `)}
    ${ENDIF()}
};
    `;
}

export default function Gen(genInfos) {
    var valueTypeInfos = il2cpp_snippets.listToJsArray(genInfos.ValueTypeInfos)
    console.log(`valuetypes:${valueTypeInfos.length}`);
    return `// Auto Gen

#if !__SNC__
#ifndef __has_feature 
#define __has_feature(x) 0 
#endif
#endif

#if _MSC_VER
typedef wchar_t Il2CppChar;
#elif __has_feature(cxx_unicode_literals)
typedef char16_t Il2CppChar;
#else
typedef uint16_t Il2CppChar;
#endif

namespace puerts
{

${valueTypeInfos.map(defineValueType).join('\n')}

}

`;
}
