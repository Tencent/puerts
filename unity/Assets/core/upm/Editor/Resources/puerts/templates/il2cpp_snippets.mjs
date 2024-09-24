/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

const sigs = CS.PuertsIl2cpp.TypeUtils.TypeSignatures;

export function listToJsArray(csArr) {
    let arr = [];
    if (!csArr) return arr;
    for (var i = 0; i < csArr.Count; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}

export const PrimitiveSignatureCppTypeMap = {
    v: 'void',
    b: 'bool',
    u1: 'uint8_t',
    i1: 'int8_t',
    i2: 'int16_t',
    u2: 'uint16_t',
    i4: 'int32_t',
    u4: 'uint32_t',
    i8: 'int64_t',
    u8: 'uint64_t',
    c: 'Il2CppChar',
    r8: 'double',
    r4: 'float'
};

export function needThis(wrapperInfo) {
    return wrapperInfo.ThisSignature == 't' || wrapperInfo.ThisSignature == 'T'
}

export function getSignatureWithoutRefAndPrefix(signature) {
    if (signature[0] == 'P' || signature[0] == 'D') {
        return signature.substring(1);
    } else {
        return signature
    }
}

export function isStructOrNullableStruct(signature) {
    return (signature.startsWith(sigs.StructPrefix) || signature.startsWith(sigs.NullableStructPrefix)) && signature.endsWith('_');
}

export function SToCPPType(signature) {
        if (signature[0] == 'D') {
            signature = signature.substring(1);
        }
        if (signature == 's') return 'Il2CppString*';
        if (signature == 'o' || signature == 'O' || signature == 'a') return 'Il2CppObject*';
        if (signature[0] == 'V') return 'Il2CppArray*';
        var t = (signature in PrimitiveSignatureCppTypeMap) ? PrimitiveSignatureCppTypeMap[signature] : "void*";
        if ((signature.startsWith(sigs.StructPrefix) || signature.startsWith(sigs.NullableStructPrefix)) && signature.endsWith('_')) {
            t = `struct ${signature}`;
        }
        if (signature[0] == 'P') {
            t = `${SToCPPType(signature.substring(1))}*`
        }
        return t;
    }
    
export function defineValueType(valueTypeInfo) {
        // TODO 会存在一个 IsEnum 且 IsGenericParameter 的类型，signature为空，先过滤处理，晚点彻查。
        if (!valueTypeInfo.Signature) return ''
        return t`// ${valueTypeInfo.CsName}
struct ${valueTypeInfo.Signature}
{
    ${FOR(listToJsArray(valueTypeInfo.FieldSignatures), (s, i) => t`
    ${IF(valueTypeInfo.Signature.startsWith(sigs.NullableStructPrefix) && i == valueTypeInfo.NullableHasValuePosition)}
    ${SToCPPType(s)} hasValue;
    ${ELSE()}
    ${SToCPPType(s)} p${i};
    ${ENDIF()}
    `)}
};
    `;
    }
    
export function getThis(signature) {
    let getJsThis = 'pesapi_value jsThis = pesapi_get_holder(info);'
    if (signature == 't') {
        return `${getJsThis}
    auto self = pesapi_get_native_object_ptr(env, jsThis);`
    } else if (signature == 'T') {
        return `${getJsThis}
    auto self = pesapi_get_native_object_ptr(env, jsThis);
    auto ptrType = (Il2CppClass*) pesapi_get_native_object_typeid(env, jsThis);
    if (Class::IsValuetype(ptrType))
    {
        self = Object::Box(ptrType, self);
    }
`;
    } else {
        return '';
    }
}
    
export function getArgValue(signature, JSName, isRef) {
    if (signature in PrimitiveSignatureCppTypeMap) {
        return isRef ? `converter::Converter<std::reference_wrapper<${PrimitiveSignatureCppTypeMap[signature]}>>::toCpp(env, ${JSName})`
            : `converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::toCpp(env, ${JSName})`;

    } else if ((signature == 'Pv' || signature == 'p') && !isRef) {
        return `DataTransfer::GetPointer<void>(env, ${JSName})`;

    } else { // default value
        // TODO: object
        if (signature in PrimitiveSignatureCppTypeMap) {
            if (signature == 'v') throw "void has no default";
            return signature == 'b' ? 'false' : '0';
        }
    
        if ((signature.startsWith(sigs.StructPrefix) || signature.startsWith(sigs.NullableStructPrefix)) && signature.endsWith('_')) {
            return '{}'
        }
    
        return 'nullptr';
    }
}

export function declareTypeInfo(wrapperInfo) {   
    const returnHasTypeInfo = wrapperInfo.ReturnSignature && !(getSignatureWithoutRefAndPrefix(wrapperInfo.ReturnSignature) in PrimitiveSignatureCppTypeMap)
    const ret = [];
    let i = 0;
    if (returnHasTypeInfo) {
        ret.push(`auto TIret = wrapData->TypeInfos[${i++}];`);
    }
    listToJsArray(wrapperInfo.ParameterSignatures).forEach((ps, index) => {
        if (!(getSignatureWithoutRefAndPrefix(ps) in PrimitiveSignatureCppTypeMap)) {
            ret.push(`auto TIp${index} = wrapData->TypeInfos[${i++}];`);
        }
    })
    return ret.join('\n    ')
}
    
export function checkJSArg(signature, index) {
    let ret = ''
    let typeInfoVar = `TIp${index}`;
    if (signature[0] == "D") {
        ret += `if (js_args_len > ${index} && `
        signature = signature.substring(1);
    } else if (signature[0] == 'V') {
        const elmSignature = signature.substring(1);
        const elmClassDecl = (elmSignature == 'o' || elmSignature == 'O' || elmSignature == 'a' || 
            ((elmSignature.startsWith(sigs.StructPrefix) || elmSignature.startsWith(sigs.NullableStructPrefix)) && elmSignature.endsWith('_'))
            ) ? `auto ${typeInfoVar}_V = il2cpp::vm::Class::GetElementClass(${typeInfoVar});` : '';
        ret += `${elmClassDecl}if (js_args_len > ${index} && `
        signature = elmSignature;
        typeInfoVar += '_V';
    } else {
        ret += `if (`
    }

    if (signature in PrimitiveSignatureCppTypeMap) {
        ret += `!converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::accept(env, _sv${index})) return false;`
    } else if (signature == 'p' || signature == 'Pv' || signature == 'a') { // IntPtr, void*, ArrayBuffer
        ret += `!pesapi_is_binary(env, _sv${index}) && !pesapi_is_null(env, _sv${index}) && !pesapi_is_undefined(env, _sv${index})) return false;`
    } else if (signature[0] == 'P') {
        ret += `!pesapi_is_object(env, _sv${index})) return false;`
    } else if (signature == 's') {
        ret += `!converter::Converter<Il2CppString*>::accept(env, _sv${index})) return false;`
    } else if (signature == 'o' || signature == 'a') {
        ret += `!DataTransfer::IsAssignable(env, _sv${index}, ${typeInfoVar}, false)) return false;`
    } else if (signature == 'O') {//System.Object
        return '';
    } else if ((signature.startsWith(sigs.StructPrefix) || signature.startsWith(sigs.NullableStructPrefix)) && signature.endsWith('_')) {
        ret += `!DataTransfer::IsAssignable(env, _sv${index}, ${typeInfoVar}, true)) return false;`
    } else { // TODO: 适配所有类型，根据!!true去查找没处理的
        ret += '!!true) return false;';
    }
    return ret;
}
    
export function refSetback(signature, index) {
    if (signature[0] == 'P' && signature != 'Pv') {
        const elementSignature = signature.substring(1);
        var val = CSValToJSVal(elementSignature, `*p${index}`)

        if (val) {
            if (elementSignature.startsWith(sigs.StructPrefix) && elementSignature.endsWith('_')) {
                // 这个 == 的判断是因为如果外部如果传了指针进来，此时指针指向的内容已经变了，不需要重设
                // this '==' is because if a pointer is passed in from external, the content of the pointer is changed and dont need to setback.
                return `if (p${index} == &up${index})
    {
        pesapi_update_boxed_value(env, _sv${index}, ${val});
    }
            `;    
            } else if (elementSignature.startsWith(sigs.NullableStructPrefix) && elementSignature.endsWith('_')) {
                return `if (p${index} == &up${index})
    {
        if (!p${index}->hasValue) pesapi_update_boxed_value(env, _sv${index}, pesapi_create_null(env));
        if (p${index} == &up${index}) pesapi_update_boxed_value(env, _sv${index}, ${val});
    }
            `;    

            } else {
                return `pesapi_update_boxed_value(env, _sv${index}, ${val});`;
            }
        }
    }
    
    return '';
}
    
export function returnToJS(signature) {
    return `pesapi_add_return(info, ${CSValToJSVal(signature, 'ret')});`;
}
    
export function returnToCS(signature) {
    return `
${JSValToCSVal(signature, 'jsret', 'ret')}
    return ret;
        `
}

export function JSValToCSVal(signature, JSName, CSName) {
    if (signature == 's') { // string
        return `    // JSValToCSVal s
    Il2CppString* ${CSName} = converter::Converter<Il2CppString*>::toCpp(env, ${JSName});`;

    } else if (signature == 'Ps') { // string ref
        return `    // JSValToCSVal Ps
    Il2CppString* u${CSName} = converter::Converter<std::reference_wrapper<Il2CppString*>>::toCpp(env, ${JSName}); // string ref
    Il2CppString** ${CSName} = &u${CSName};
        `
    } else if (signature == 'o' || signature == 'O' || signature == 'a') { // object
        return `    // JSValToCSVal o/O
    Il2CppObject* ${CSName} = JsValueToCSRef(TI${CSName}, env, ${JSName});`;

    } else if (signature == 'Po' || signature == 'PO' || signature == 'Pa') {
        return `    // JSValToCSVal Po/PO
    Il2CppObject* u${CSName} = DataTransfer::GetPointer<Il2CppObject>(env, pesapi_unboxing(env, ${JSName})); // object ref
    Il2CppObject** ${CSName} = &u${CSName};
        `
    } else if ((signature.startsWith(sigs.StructPrefix) || signature.startsWith(sigs.NullableStructPrefix)) && signature.endsWith('_')) { //valuetype
        return `    // JSValToCSVal struct
    ${signature}* p${CSName} = DataTransfer::GetPointer<${signature}>(env, ${JSName});
    ${signature} ${CSName} = p${CSName} ? *p${CSName} : ${signature} {};`

    } else if ((signature.startsWith('P' + sigs.StructPrefix) || signature.startsWith('P' + sigs.NullableStructPrefix)) && signature.endsWith('_')) { //valuetype ref
        const S = signature.substring(1);
        return `    // JSValToCSVal Pstruct
    ${S}* ${CSName} = DataTransfer::GetPointer<${S}>(env, pesapi_unboxing(env, ${JSName})); // valuetype ref
    ${S} u${CSName};
    if (!${CSName}) {
        memset(&u${CSName}, 0, sizeof(${S}));
        ${CSName} = &u${CSName};
    }
        `
    } else if (signature[0] == 'P' && signature != 'Pv') {
        const S = signature.substring(1);
        if (S in PrimitiveSignatureCppTypeMap) {
            return `    // JSValToCSVal P primitive
    ${SToCPPType(S)} u${CSName} = ${getArgValue(S, JSName, true)};
    ${SToCPPType(S)}* ${CSName} = &u${CSName};`
        } else {
            return `    // JSValToCSVal P not primitive
    ${SToCPPType(signature)} ${CSName} = ${getArgValue(S, JSName, true)};`
        }
    } else if (signature[0] == 'V') {
        const si = signature.substring(1);
        const start = parseInt(JSName.match(/_sv(\d+)/)[1]);
        if (si in PrimitiveSignatureCppTypeMap) { 
            return `    // JSValToCSVal primitive params
    Il2CppArray* ${CSName} = Params<${PrimitiveSignatureCppTypeMap[si]}>::PackPrimitive(env, info, TI${CSName}, js_args_len, ${start});
                `
        } else if (si == 's') {
            return `    // JSValToCSVal string params
    Il2CppArray* ${CSName} = Params<void*>::PackString(env, info, TI${CSName}, js_args_len, ${start});
                `
        } else if (si == 'o' || si == 'O' || si == 'a') {
            return `    // JSValToCSVal ref params
    Il2CppArray* ${CSName} = Params<void*>::PackRef(env, info, TI${CSName}, js_args_len, ${start});
                `
        } else if ((si.startsWith(sigs.StructPrefix) || si.startsWith(sigs.NullableStructPrefix)) && si.endsWith('_')) { 
            return `    // JSValToCSVal valuetype params
    Il2CppArray* ${CSName} = Params<${si}>::PackValueType(env, info, TI${CSName}, js_args_len, ${start});
                `
        } else {
            return `    // JSValToCSVal unknow params type
    Il2CppArray* ${CSName} = nullptr;
                `
        }
    } else if (signature[0] == 'D') {
        const si = signature.substring(1);
        const start = parseInt(JSName.match(/_sv(\d+)/)[1]);
        if (si in PrimitiveSignatureCppTypeMap) { 
            return `    // JSValToCSVal primitive with default
    ${PrimitiveSignatureCppTypeMap[si]} ${CSName} = OptionalParameter<${PrimitiveSignatureCppTypeMap[si]}>::GetPrimitive(env, info, method, wrapData, js_args_len, ${start});
                `
        } else if (si == 's') {
            return `    // JSValToCSVal string  with default
    Il2CppString* ${CSName} = OptionalParameter<Il2CppString*>::GetString(env, info, method, wrapData, js_args_len, ${start});
                `
        } else if (si == 'o' || si == 'O' || si == 'a') {
            return `    // JSValToCSVal ref  with default
    Il2CppObject* ${CSName} = OptionalParameter<Il2CppObject*>::GetRefType(env, info, method, wrapData, js_args_len, ${start}, TI${CSName});
                `
        } else if ((si.startsWith(sigs.StructPrefix) || si.startsWith(sigs.NullableStructPrefix)) && si.endsWith('_')) { 
            return `    // JSValToCSVal valuetype  with default
    ${si} ${CSName} = OptionalParameter<${si}>::GetValueType(env, info, method, wrapData, js_args_len, ${start});
                `
        } else {
            return `    // JSValToCSVal unknow type with default
    void* ${CSName} = nullptr;
                `
        }
    } else {
        return `    // JSValToCSVal P any
    ${SToCPPType(signature)} ${CSName} = ${getArgValue(signature, JSName)};`
    }
}

export function CSValToJSVal(signature, CSName) {
    const TIName = `TI${CSName[0] == '*' ? CSName.substring(1) : CSName}`;
    if (signature in PrimitiveSignatureCppTypeMap) {
        return `converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::toScript(env, ${CSName})`;
    } else if (signature == 'O') { // System.Object
        return `CSRefToJsValue(env, ${TIName}, ${CSName})`;
    } else if (signature == 'o') { // classes except System.Object
        return `CSRefToJsValue(env, ${TIName}, ${CSName})`;
    } else if (signature == 'a') { // ArrayBuffer
        return `CSRefToJsValue(env, ${TIName}, ${CSName})`;
    } else if (signature.startsWith(sigs.NullableStructPrefix) && signature.endsWith('_')) {
        return `DataTransfer::CopyNullableValueType(env, ${CSName}, ${TIName})`
    } else if (signature == 's') { // string
        return `converter::Converter<Il2CppString*>::toScript(env, ${CSName})`;
    } else if (signature == 'p' || signature == 'Pv') { // IntPtr, void*
        return `pesapi_create_binary(env, ${CSName}, 0)`;
    } else if (signature.startsWith(sigs.StructPrefix) && signature.endsWith('_')) {
        return `DataTransfer::CopyValueType(env, ${CSName}, ${TIName})`
    } else { //TODO: 能处理的就处理, DateTime是否要处理呢？
        return `// unknow ret signature: ${signature}`
    }
}


export function genArgsLenCheck(parameterSignatures) {
    var requireNum = 0;
    for (; requireNum < parameterSignatures.length && parameterSignatures[requireNum][0] != 'V' && parameterSignatures[requireNum][0] != 'D'; ++requireNum) { }
    return requireNum != parameterSignatures.length ? `js_args_len < ${requireNum}` : `js_args_len != ${parameterSignatures.length}`;
}
