
function listToJsArray(csArr) {
    let arr = [];
    for(var i = 0; i < csArr.Count; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}

const PrimitiveSignatureCppTypeMap = {
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

function genVariableDecl(signature, index) {
    var t = (signature in PrimitiveSignatureCppTypeMap) ? PrimitiveSignatureCppTypeMap[signature] : "void*";
    if (signature.startsWith('s_') && signature.endsWith('_')) {
        t = `struct ${signature}`;
    }
    if (signature[0] == 'P') {
        t = `${genVariableDecl(signature.substring(1))}*` 
    }
    if (index == undefined) return t;
    return `${t} p${index}`
}

function genVariableDefault(signature) {
    if (signature in PrimitiveSignatureCppTypeMap) {
        if (signature == 'v') throw "void has no default"; 
        return signature == 'b' ? 'false' : '0';
    }
    
    if (signature.startsWith('s_') && signature.endsWith('_')) {
        return '{}'
    }
    
    return 'nullptr';
}

function genValueTypeDefine(valueTypeInfo) {
    return `// ${valueTypeInfo.CsName}
struct ${valueTypeInfo.Signature}
{
${listToJsArray(valueTypeInfo.FieldSignatures).map(genVariableDecl).map(s => `    ${s};`).join('\n')}
};
`;
}

function genGetThis(signature) {
    if (signature == 't') {
        return 'auto self = puerts::DataTransfer::GetPointerFast<void>(info.Holder());'
    } else if (signature == 'T'){
        return 'auto self = JsValueToCSRef(context, info.Holder(), GetTypeId(info.Holder()));';
    } else {
        return '';
    }
}

function genArgValue(signature, index, isRef) {
    if (signature in PrimitiveSignatureCppTypeMap) {
        return isRef ? `converter::Converter<std::reference_wrapper<${PrimitiveSignatureCppTypeMap[signature]}>>::toCpp(context, info[${index}])` 
           : `converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::toCpp(context, info[${index}])`;
    } else if ((signature == 'Pv' || signature == 'p') && !isRef) {
        return `DataTransfer::GetPointer<void>(context, info[${index}])`;
    } else { // TODO: object
        return `${genVariableDefault(signature)} /* default value */`;
    }
}

function getTypeInfoIndex(wrapperInfo, parameterIndex) {
    var index = 0;
    if (wrapperInfo.ReturnSignature && wrapperInfo.ReturnSignature != 'v') {
        ++index;
    }
    for(var i = 0; i < parameterIndex; ++i) {
        if (!(wrapperInfo.ParameterSignatures[i] in PrimitiveSignatureCppTypeMap)) {
            ++index;
        }
    }
    return index;
}

function genGetArg(signature, index, wrapperInfo) {
    if (signature == 's') { // string
        return `    v8::String::Utf8Value t${index}(isolate, info[${index}]);
    void* p${index} = CStringToCSharpString(*t${index});`;
    } else if (signature == 'Ps') { // string ref
        return `    void* up${index} = nullptr; // string ref
    void** p${index} = &up${index};
    v8::Local<v8::Object> o${index};
    if (!info[${index}].IsEmpty() && info[${index}]->IsObject()) {
        o${index} = info[${index}]->ToObject(context).ToLocalChecked();
        v8::String::Utf8Value t${index}(isolate, o${index}->Get(context, 0).ToLocalChecked());
        up${index} = CStringToCSharpString(*t${index});
    }
    `
    } else if (signature == 'o' || signature == 'O') { // object
        return `    void* p${index} = JsValueToCSRef(context, info[${index}], typeInfos[${getTypeInfoIndex(wrapperInfo, index)}]);`;
    } else if (signature == 'Po' || signature == 'PO') {
        return `    void* up${index} = nullptr; // object ref
    void** p${index} = &up${index};
    v8::Local<v8::Object> o${index};
    if (!info[${index}].IsEmpty() && info[${index}]->IsObject()) {
        o${index} = info[${index}]->ToObject(context).ToLocalChecked();
        auto t${index} = o${index}->Get(context, 0).ToLocalChecked();
        up${index} = JsValueToCSRef(context, t${index}, typeInfos[${getTypeInfoIndex(wrapperInfo, index)}]);
    }
    `
    } else if (signature.startsWith('s_') && signature.endsWith('_')) { //valuetype
        return `    ${signature}* pp${index} = DataTransfer::GetPointer<${signature}>(context, info[${index}]);
    ${signature} p${index} = pp${index} ? *pp${index} : ${signature} {};`
    } else if (signature.startsWith('Ps_') && signature.endsWith('_')) { //valuetype ref
        const elementSignatrue = signature.substring(1);
        return `    ${elementSignatrue}* p${index} = nullptr; // valuetype ref
    v8::Local<v8::Object> o${index};
    if (!info[${index}].IsEmpty() && info[${index}]->IsObject()) {
        o${index} = info[${index}]->ToObject(context).ToLocalChecked();
        auto t${index} = o${index}->Get(context, 0).ToLocalChecked();
        p${index} = DataTransfer::GetPointer<${elementSignatrue}>(context, t${index});
    }
    `
    } else if (signature[0] == 'P' && signature != 'Pv') {
        const elementSignatrue = signature.substring(1);
        if (elementSignatrue in PrimitiveSignatureCppTypeMap) {
            return `    ${genVariableDecl(elementSignatrue)} up${index} = ${genArgValue(elementSignatrue, index, true)};
    ${genVariableDecl(elementSignatrue)}* p${index} = &up${index};`
        } else {
            return `    ${genVariableDecl(signature, index)} = ${genArgValue(elementSignatrue, index, true)};`
        }
    } else {
        return `    ${genVariableDecl(signature, index)} = ${genArgValue(signature, index)};`
    }
}

function genArgumentCheck(signature, index, wrapperInfo) {
    if (signature in PrimitiveSignatureCppTypeMap) {
        return `!converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::accept(context, info[${index}])`
    } else if (signature[0] == 'P') {
        return `!info[${index}]->IsObject()`
    } else if (signature == 's') {
        return `!info[${index}]->IsString() && !info[${index}]->IsNullOrUndefined()`
    } else if (signature == 'o' || signature == 'O') {
        return `!info[${index}]->IsObject() || !IsAssignableFrom(GetTypeId(info[${index}].As<v8::Object>()), typeInfos[${getTypeInfoIndex(wrapperInfo, index)}])`
    } else { // TODO: 适配所有类型，根据!!true去查找没处理的
        return '!!true';
    }
}

function genThisParameter(wrapperInfo) {
    const signature = wrapperInfo.ThisSignature;
    return (signature == 't' || signature == 'T') ? 'void*,' : '';
}

function genPassThis(wrapperInfo) {
    const signature = wrapperInfo.ThisSignature;
    return (signature == 't' || signature == 'T') ? 'self,' : '';
}

function genRetDecl(wrapperInfo) {
    const signature = wrapperInfo.ReturnSignature;
    return (signature == 'v') ? '' : `${genVariableDecl(signature)} ret = `;
}

function genWrapper(wrapperInfo) {
    var parameterSignatures = listToJsArray(wrapperInfo.ParameterSignatures);
    
    return `
// ${wrapperInfo.CsName}
static bool w_${wrapperInfo.Signature}(void* method, MethodPointer methodPointer, const v8::FunctionCallbackInfo<v8::Value>& info, bool checkArgument, void** typeInfos) {
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    if (checkArgument) {
        if ( info.Length() != ${parameterSignatures.length}) return false;
${parameterSignatures.map((x, i) => genArgumentCheck(x, i, wrapperInfo)).map(x => `        if(${x}) return false;`).join('\n')}
    }
    ${genGetThis(wrapperInfo.ThisSignature)}
    
${parameterSignatures.map((x, i) => genGetArg(x, i, wrapperInfo)).join('\n')}

    typedef ${genVariableDecl(wrapperInfo.ReturnSignature)} (*FuncToCall)(${genThisParameter(wrapperInfo)}${parameterSignatures.map(genVariableDecl).map(s => `${s}, `).join('')}const void* method);
    
    ${genRetDecl(wrapperInfo)}((FuncToCall)methodPointer)(${genPassThis(wrapperInfo)} ${parameterSignatures.map((_, i) => `p${i}, `).join('')} method);
    
    return true;
}`;
}

function genDefaultReturn(signature) {
    return signature == 'v' ? '' : 'return {};';
}

function genBridge(bridgeInfo) {
    var parameterSignatures = listToJsArray(bridgeInfo.ParameterSignatures);
    return `
static ${genVariableDecl(bridgeInfo.ReturnSignature)} b_${bridgeInfo.Signature}(void* target, ${parameterSignatures.map(genVariableDecl).map(s => `${s}, `).join('')}void* method) {
    ${genDefaultReturn(bridgeInfo.ReturnSignature)}
}`;
}

function genFieldWrapper(fieldWrapperInfo) {
    return `
static void ifg_${fieldWrapperInfo.Signature}(const v8::FunctionCallbackInfo<v8::Value>& info, void* fieldInfo, size_t offset, void* typeInfo) {
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    
    ${genGetThis(fieldWrapperInfo.ReturnSignature)}
}

static void ifs_${fieldWrapperInfo.Signature}(const v8::FunctionCallbackInfo<v8::Value>& info, void* fieldInfo, size_t offset, void* typeInfo) {
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    
    ${genGetThis(fieldWrapperInfo.ReturnSignature)}
}`;
}

export default function Gen(genInfos) {
    var valueTypeInfos = listToJsArray(genInfos.ValueTypeInfos)
    var wrapperInfos = listToJsArray(genInfos.WrapperInfos);
    var bridgeInfos = listToJsArray(genInfos.BridgeInfos);
    var fieldWrapperInfos = listToJsArray(genInfos.FieldWrapperInfos);
    console.log(`valuetypes:${valueTypeInfos.length}, wrappers:${wrapperInfos.length}, bridge:${bridgeInfos.length}, fieldWrapper:${fieldWrapperInfos.length}`);
    return `

// Auto Gen

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

${valueTypeInfos.map(genValueTypeDefine).join('\n')}

${wrapperInfos.map(genWrapper).join('\n')}

static WrapFuncInfo g_wrapFuncInfos[] = {
${wrapperInfos.map(info => `    {"${info.Signature}", w_${info.Signature}},`).join('\n')}
    {nullptr, nullptr}
};

${bridgeInfos.map(genBridge).join('\n')}

static BridgeFuncInfo g_bridgeFuncInfos[] = {
${bridgeInfos.map(info => `    {"${info.Signature}", (MethodPointer)b_${info.Signature}},`).join('\n')}
    {nullptr, nullptr}
};

${fieldWrapperInfos.map(genFieldWrapper).join('\n')}

static FieldWrapFuncInfo g_fieldWrapFuncInfos[] = {
${fieldWrapperInfos.map(info => `    {"${info.Signature}", ifg_${info.Signature}, ifs_${info.Signature}},`).join('\n')}
    {nullptr, nullptr, nullptr}    
};

`;
}