import { FOR, default as t, IF, ENDIF, ELSE } from "./tte.mjs"

function listToJsArray(csArr) {
    let arr = [];
    if (!csArr) return arr;
    for (var i = 0; i < csArr.Count; i++) {
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

function needThis(wrapperInfo) {
    return wrapperInfo.ThisSignature == 't' || wrapperInfo.ThisSignature == 'T'
}
function getSignatureWithoutRefAndPrefix(signature) {
    if (signature[0] == 'P' || signature[0] == 'D') {
        return signature.substring(1);
    } else {
        return signature
    }
}

const CODE_SNIPPETS = {

    SToCPPType(signature) {
        if (signature[0] == 'D') {
            signature = signature.substring(1);
        }
        var t = (signature in PrimitiveSignatureCppTypeMap) ? PrimitiveSignatureCppTypeMap[signature] : "void*";
        if (signature.startsWith('s_') && signature.endsWith('_')) {
            t = `struct ${signature}`;
        }
        if (signature[0] == 'P') {
            t = `${CODE_SNIPPETS.SToCPPType(signature.substring(1))}*`
        }
        return t;
    },
    
    defineValueType(valueTypeInfo) {
        return t`// ${valueTypeInfo.CsName}
struct ${valueTypeInfo.Signature}
{
    ${FOR(listToJsArray(valueTypeInfo.FieldSignatures), (s, i) => t`
    ${CODE_SNIPPETS.SToCPPType(s)} p${i};
    `)}
};
    `;
    },
    
    getThis(signature) {
        if (signature == 't') {
            return 'auto self = puerts::DataTransfer::GetPointerFast<void>(info.Holder());'
        } else if (signature == 'T') {
            return 'auto self = JsValueToCSRef(context, info.Holder(), GetTypeId(info.Holder()));';
        } else {
            return '';
        }
    },
    
    getArgValue(signature, JSName, isRef) {
        if (signature in PrimitiveSignatureCppTypeMap) {
            return isRef ? `converter::Converter<std::reference_wrapper<${PrimitiveSignatureCppTypeMap[signature]}>>::toCpp(context, ${JSName})`
                : `converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::toCpp(context, ${JSName})`;

        } else if ((signature == 'Pv' || signature == 'p') && !isRef) {
            return `DataTransfer::GetPointer<void>(context, ${JSName})`;

        } else { // default value
            // TODO: object
            if (signature in PrimitiveSignatureCppTypeMap) {
                if (signature == 'v') throw "void has no default";
                return signature == 'b' ? 'false' : '0';
            }
        
            if (signature.startsWith('s_') && signature.endsWith('_')) {
                return '{}'
            }
        
            return 'nullptr';
        }
    },

    declareTypeInfo(wrapperInfo) {   
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
    },
    
    checkJSArg(signature, index) {
        let ret = ''
        if (signature[0] == "D") {
            ret += `if (length > ${index} && `
            signature = signature.substring(1);
        } else if (signature[0] == 'V') {
            ret += `if (!info[${index}]->IsNullOrUndefined() && `
            signature = signature.substring(1)
        } else {
            ret += `if (`
        }

        if (signature in PrimitiveSignatureCppTypeMap) {
            ret += `!converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::accept(context, info[${index}])) return false;`
        } else if (signature == 'p' || signature == 'Pv') { // IntPtr, void*
            ret += `!info[${index}]->IsArrayBuffer()) return false;`
        } else if (signature[0] == 'P') {
            ret += `!info[${index}]->IsObject()) return false;`
        } else if (signature == 's') {
            ret += `!info[${index}]->IsString() && !info[${index}]->IsNullOrUndefined()) return false;`
        } else if (signature == 'o') {
            ret += `!info[${index}]->IsNullOrUndefined() && (!info[${index}]->IsObject() || (info[${index}]->IsFunction() ? !IsDelegate(TIp${index}) : !IsAssignableFrom(TIp${index}, GetTypeId(info[${index}].As<v8::Object>()))))) return false;`
        } else if (signature == 'O') {
            return '';
        } else if (signature.startsWith('s_') && signature.endsWith('_')) {
            ret += `(!info[${index}]->IsObject() || !IsAssignableFrom(TIp${index}, GetTypeId(info[${index}].As<v8::Object>())))) return false;`
        } else { // TODO: 适配所有类型，根据!!true去查找没处理的
            ret += '!!true) return false;';
        }
        return ret;
    },
    
    refSetback(signature, index) {
        if (signature[0] == 'P' && signature != 'Pv') {
            const elementSignatrue = signature.substring(1);
            var val = CODE_SNIPPETS.CSValToJSVal(elementSignatrue, `*p${index}`)

            if (val) {
                if (elementSignatrue.startsWith('s_') && elementSignatrue.endsWith('_')) {
                    return `if (!op${index}.IsEmpty() && p${index} == &up${index})
    {
        auto _unused = op${index}->Set(context, 0, ${val});
    }
            `;    
                } else {
                    return `if (!op${index}.IsEmpty())
    {
        auto _unused = op${index}->Set(context, 0, ${val});
    }
    `;
                }
            }
        }
        
        return '';
    },
    
    returnToJS(signature) {
    
        if (signature == 'i8') {
            return 'info.GetReturnValue().Set(v8::BigInt::New(isolate, ret));';
        } else if (signature == 'u8') {
            return 'info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(isolate, ret));';
        } else if (signature in PrimitiveSignatureCppTypeMap) {
            return 'info.GetReturnValue().Set(ret);';
        } else if (signature.startsWith('s_') && signature.endsWith('_')) {
            return 'info.GetReturnValue().Set(CopyValueType(isolate, context, TIret, &ret, sizeof(ret)));';
        } else if (signature == 'o') { // classes except System.Object
            return 'info.GetReturnValue().Set(CSRefToJsValue(isolate, context, ret));';
        } else if (signature == 'O') { // System.Object
            return 'info.GetReturnValue().Set(CSAnyToJsValue(isolate, context, ret));';
        } else if (signature == 's') { // string
            return 'info.GetReturnValue().Set(CSAnyToJsValue(isolate, context, ret));';
        } else if (signature == 'p' || signature == 'Pv') { // IntPtr, void*
            return 'info.GetReturnValue().Set(v8::ArrayBuffer::New(isolate, v8::ArrayBuffer::NewBackingStore(ret, 0, &v8::BackingStore::EmptyDeleter, nullptr)));';
        } else { //TODO: 能处理的就处理, DateTime是否要处理呢？
            return `// unknow ret signature: ${signature}`
        }
    },
    
    returnToCS(signature) {
        return `
${CODE_SNIPPETS.JSValToCSVal(signature, 'MaybeRet.ToLocalChecked()', 'ret')}
    return ret;
        `
    },

    JSValToCSVal(signature, JSName, CSName) {
        if (signature == 's') { // string
            return `    // JSValToCSVal s
    v8::String::Utf8Value t${CSName}(isolate, ${JSName});
    void* ${CSName} = CStringToCSharpString(*t${CSName});`;

        } else if (signature == 'Ps') { // string ref
            return `    // JSValToCSVal Ps
    void* u${CSName} = nullptr; // string ref
    void** ${CSName} = &u${CSName};
    v8::Local<v8::Object> o${CSName};
    if (!${JSName}.IsEmpty() && ${JSName}->IsObject()) {
        o${CSName} = ${JSName}->ToObject(context).ToLocalChecked();
        v8::String::Utf8Value t${CSName}(isolate, o${CSName}->Get(context, 0).ToLocalChecked());
        u${CSName} = CStringToCSharpString(*t${CSName});
    }
        `
        } else if (signature == 'o' || signature == 'O') { // object
            return `    // JSValToCSVal o/O
    void* ${CSName} = JsValueToCSRef(context, ${JSName}, TI${CSName});`;

        } else if (signature == 'Po' || signature == 'PO') {
            return `    // JSValToCSVal Po/PO
    void* u${CSName} = nullptr; // object ref
    void** ${CSName} = &u${CSName};
    v8::Local<v8::Object> o${CSName};
    if (!${JSName}.IsEmpty() && ${JSName}->IsObject()) {
        o${CSName} = ${JSName}->ToObject(context).ToLocalChecked();
        auto t${CSName} = o${CSName}->Get(context, 0).ToLocalChecked();
        u${CSName} = JsValueToCSRef(context, t${CSName}, TI${CSName});
    }
        `
        } else if (signature.startsWith('s_') && signature.endsWith('_')) { //valuetype
            return `    // JSValToCSVal struct
    ${signature}* p${CSName} = DataTransfer::GetPointer<${signature}>(context, ${JSName});
    ${signature} ${CSName} = p${CSName} ? *p${CSName} : ${signature} {};`

        } else if (signature.startsWith('Ps_') && signature.endsWith('_')) { //valuetype ref
            const S = signature.substring(1);
            return `    // JSValToCSVal Pstruct
    ${S}* ${CSName} = nullptr; // valuetype ref
    ${S} u${CSName};
    v8::Local<v8::Object> o${CSName};
    if (!${JSName}.IsEmpty() && ${JSName}->IsObject()) {
        o${CSName} = ${JSName}->ToObject(context).ToLocalChecked();
        auto t${CSName} = o${CSName}->Get(context, 0).ToLocalChecked();
        ${CSName} = DataTransfer::GetPointer<${S}>(context, t${CSName});
    }
    if (!${CSName}) {
        ${CSName} = &u${CSName};
    }
        `
        } else if (signature[0] == 'P' && signature != 'Pv') {
            const S = signature.substring(1);
            if (S in PrimitiveSignatureCppTypeMap) {
                return `    // JSValToCSVal P primitive
    ${CODE_SNIPPETS.SToCPPType(S)} u${CSName} = ${CODE_SNIPPETS.getArgValue(S, JSName, true)};
    ${CODE_SNIPPETS.SToCPPType(S)}* ${CSName} = &u${CSName};
    v8::Local<v8::Object> o${CSName};
    if (!${JSName}.IsEmpty() && ${JSName}->IsObject()) {
        o${CSName} = ${JSName}->ToObject(context).ToLocalChecked();
    }`
            } else {
                return `    // JSValToCSVal P not primitive
    ${CODE_SNIPPETS.SToCPPType(signature)} ${CSName} = ${CODE_SNIPPETS.getArgValue(S, JSName, true)};`
            }
        } else if (signature[0] == 'V') {
            const si = signature.substring(1);
            const start = parseInt(JSName.match(/info\[(\d+)\]/)[1]);
            if (si in PrimitiveSignatureCppTypeMap) { 
                return `    // JSValToCSVal primitive params
    void* ${CSName} = RestArguments<${PrimitiveSignatureCppTypeMap[si]}>::PackPrimitive(context, info, TI${CSName}, ${start});
                `
            } else if (si == 's') {
                return `    // JSValToCSVal string params
    void* ${CSName} = RestArguments<void*>::PackString(context, info, TI${CSName}, ${start});
                `
            } else if (si == 'o' || si == 'O') {
                return `    // JSValToCSVal ref params
    void* ${CSName} = RestArguments<void*>::PackRef(context, info, TI${CSName}, ${start});
                `
            } else if (si.startsWith('s_') && si.endsWith('_')) { 
                return `    // JSValToCSVal valuetype params
    void* ${CSName} = RestArguments<${si}>::PackValueType(context, info, TI${CSName}, ${start});
                `
            } else {
                return `    // JSValToCSVal unknow params type
    void* ${CSName} = nullptr;
                `
            }
        } else if (signature[0] == 'D') {
            const si = signature.substring(1);
            const start = parseInt(JSName.match(/info\[(\d+)\]/)[1]);
            if (si in PrimitiveSignatureCppTypeMap) { 
                return `    // JSValToCSVal primitive with default
    ${PrimitiveSignatureCppTypeMap[si]} ${CSName} = OptionalParameter<${PrimitiveSignatureCppTypeMap[si]}>::GetPrimitive(context, info, method, ${start});
                `
            } else if (si == 's') {
                return `    // JSValToCSVal string  with default
    void* ${CSName} = OptionalParameter<void*>::GetString(context, info, method, ${start});
                `
            } else if (si == 'o' || si == 'O') {
                return `    // JSValToCSVal ref  with default
    void* ${CSName} = OptionalParameter<void*>::GetRefType(context, info, method, ${start}, TI${CSName});
                `
            } else if (si.startsWith('s_') && si.endsWith('_')) { 
                return `    // JSValToCSVal valuetype  with default
    ${si} ${CSName} = OptionalParameter<${si}>::GetValueType(context, info, method, ${start});
                `
            } else {
                return `    // JSValToCSVal unknow type with default
    void* ${CSName} = nullptr;
                `
            }
        } else {
            return `    // JSValToCSVal P any
    ${CODE_SNIPPETS.SToCPPType(signature)} ${CSName} = ${CODE_SNIPPETS.getArgValue(signature, JSName)};`
        }
    },

    CSValToJSVal(signature, CSName) {
        if (signature in PrimitiveSignatureCppTypeMap) {
            return `converter::Converter<${PrimitiveSignatureCppTypeMap[signature]}>::toScript(context, ${CSName})`;
        } else if (signature == 's' || signature == 'O') {
            return `CSAnyToJsValue(isolate, context, ${CSName})`;
        } else if (signature == 'o') {
            return `CSRefToJsValue(isolate, context, ${CSName})`;
        } else if (signature.startsWith('s_') && signature.endsWith('_')) {
            return `CopyValueType(isolate, context, TI${CSName[0] == '*' ? CSName.substring(1) : CSName}, ${CSName[0] == '*' ? CSName.substring(1) : `&${CSName}`}, sizeof(${CSName}))`
        }
    }
}

function genArgsLenCheck(parameterSignatures) {
    var requireNum = 0;
    for (; requireNum < parameterSignatures.length && parameterSignatures[requireNum][0] != 'V' && parameterSignatures[requireNum][0] != 'D'; ++requireNum) { }
    return requireNum != parameterSignatures.length ? `length < ${requireNum}` : `length != ${parameterSignatures.length}`;
}

function genFuncWrapper(wrapperInfo) {
    var parameterSignatures = listToJsArray(wrapperInfo.ParameterSignatures);

    return t`
// ${wrapperInfo.CsName}
static bool w_${wrapperInfo.Signature}(void* method, MethodPointer methodPointer, const v8::FunctionCallbackInfo<v8::Value>& info, bool checkJSArgument, WrapData* wrapData) {
    // PLog(LogLevel::Log, "Running w_${wrapperInfo.Signature}");
    
    ${CODE_SNIPPETS.declareTypeInfo(wrapperInfo)}

    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();

    if (${parameterSignatures.filter(s => s[0] == 'D').length ? 'true' : 'checkJSArgument'}) {
        auto length = info.Length();
        if (${genArgsLenCheck(parameterSignatures)}) return false;
        ${FOR(parameterSignatures, (x, i) => t`
        ${CODE_SNIPPETS.checkJSArg(x, i)}
        `)}
    }
    ${CODE_SNIPPETS.getThis(wrapperInfo.ThisSignature)}
    
${parameterSignatures.map((x, i) => CODE_SNIPPETS.JSValToCSVal(x, `info[${i}]`, `p${i}`)).join('\n')}

    typedef ${CODE_SNIPPETS.SToCPPType(wrapperInfo.ReturnSignature)} (*FuncToCall)(${needThis(wrapperInfo) ? 'void*,' : ''}${parameterSignatures.map((S, i) => `${CODE_SNIPPETS.SToCPPType(S)} p${i}`).map(s => `${s}, `).join('')}const void* method);
    ${IF(wrapperInfo.ReturnSignature != 'v')}${CODE_SNIPPETS.SToCPPType(wrapperInfo.ReturnSignature)} ret = ${ENDIF()}((FuncToCall)methodPointer)(${needThis(wrapperInfo) ? 'self,' : ''} ${parameterSignatures.map((_, i) => `p${i}, `).join('')} method);

    ${FOR(parameterSignatures, (x, i) => t`
    ${CODE_SNIPPETS.refSetback(x, i, wrapperInfo)}
    `)}
    
    ${IF(wrapperInfo.ReturnSignature != "v")}
    ${CODE_SNIPPETS.returnToJS(wrapperInfo.ReturnSignature)}
    ${ENDIF()}
    return true;
}`;
}

function genBridgeArgs(parameterSignatures) {
    if (parameterSignatures.length != 0) {
        if (parameterSignatures[parameterSignatures.length -1][0] != 'V') {
            return `v8::Local<v8::Value> Argv[${parameterSignatures.length}]{
        ${parameterSignatures.map((ps, i)=> CODE_SNIPPETS.CSValToJSVal(ps, `p${i}`) || 'v8::Undefined(isolate)').join(`,
        `)}
    };`
        } else {
            const si = parameterSignatures[parameterSignatures.length -1].substring(1);
            let unpackMethod = 'RestArguments<void*>::UnPackRefOrBoxedValueType';
            if (si in PrimitiveSignatureCppTypeMap) {
                unpackMethod = `RestArguments<${PrimitiveSignatureCppTypeMap[si]}>::UnPackPrimitive`;
            } else if (si.startsWith('s_') && si.endsWith('_')) {
                unpackMethod = `RestArguments<${si}>::UnPackValueType`;
            } 
            return `auto arrayLength = GetArrayLength(p${parameterSignatures.length - 1});
    v8::Local<v8::Value> *Argv = (v8::Local<v8::Value> *)alloca(sizeof(v8::Local<v8::Value>) * (${parameterSignatures.length  - 1} + arrayLength));
    memset(Argv, 0, sizeof(v8::Local<v8::Value>) * (${parameterSignatures.length  - 1} + arrayLength));
    ${parameterSignatures.slice(0, -1).map((ps, i)=> `Argv[${i}] = ${(CODE_SNIPPETS.CSValToJSVal(ps, `p${i}`) || 'v8::Undefined(isolate)')};`).join(`
    `)}
    ${unpackMethod}(context, p${parameterSignatures.length-1}, arrayLength, TIp${parameterSignatures.length-1}, Argv + ${parameterSignatures.length  - 1});`;
        }
    } else {
        return 'v8::Local<v8::Value> *Argv = nullptr;';
    }
}

function genBridge(bridgeInfo) {
    var parameterSignatures = listToJsArray(bridgeInfo.ParameterSignatures);
    let hasVarArgs = parameterSignatures.length > 0 && parameterSignatures[parameterSignatures.length -1][0] == 'V'
    return t`
static ${CODE_SNIPPETS.SToCPPType(bridgeInfo.ReturnSignature)} b_${bridgeInfo.Signature}(void* target, ${parameterSignatures.map((S, i) => `${CODE_SNIPPETS.SToCPPType(S)} p${i}`).map(s => `${s}, `).join('')}void* method) {
    // PLog(LogLevel::Log, "Running b_${bridgeInfo.Signature}");

    ${IF(bridgeInfo.ReturnSignature && !(getSignatureWithoutRefAndPrefix(bridgeInfo.ReturnSignature) in PrimitiveSignatureCppTypeMap))}
    auto TIret = GetReturnType(method);
    ${ENDIF()}
    ${FOR(parameterSignatures, (ps, index) => t`
        ${IF(!(getSignatureWithoutRefAndPrefix(ps) in PrimitiveSignatureCppTypeMap))}
    auto TIp${index} = GetParameterType(method, ${index});
        ${ENDIF()}
    `)}

    PersistentObjectInfo* delegateInfo = GetObjectData(target, PersistentObjectInfo);
    if (delegateInfo->JsEnvLifeCycleTracker.expired())
    {
        ThrowInvalidOperationException("JsEnv had been destroy");
        ${IF(bridgeInfo.ReturnSignature != 'v')}
        return {};
        ${ENDIF()}
    }
    v8::Isolate* isolate = delegateInfo->EnvInfo->Isolate;
    v8::Isolate::Scope isolateScope(isolate);
    v8::HandleScope HandleScope(isolate);
    auto context = delegateInfo->EnvInfo->Context.Get(isolate);
    v8::Context::Scope ContextScope(context);

    v8::TryCatch TryCatch(isolate);
    auto Function = delegateInfo->JsObject.Get(isolate).As<v8::Function>();
    ${genBridgeArgs(parameterSignatures)}
    auto MaybeRet = Function->Call(context, v8::Undefined(isolate), ${parameterSignatures.length}${hasVarArgs ? ' + arrayLength - 1' : ''}, Argv);
    
    if (TryCatch.HasCaught())
    {
        auto msg = DataTransfer::ExceptionToString(isolate, TryCatch.Exception());
        ThrowInvalidOperationException(msg.c_str());
    ${IF(bridgeInfo.ReturnSignature == 'v')}
    }
    ${ELSE()}
        return {};
    }
    if (MaybeRet.IsEmpty())
    {
        return {};
    }
    ${CODE_SNIPPETS.returnToCS(bridgeInfo.ReturnSignature)}
    ${ENDIF()}
}`;
}

function genGetField(fieldWrapperInfo) {
    const signature = fieldWrapperInfo.ReturnSignature;
    if (signature.startsWith('s_') && signature.endsWith('_')) { //valuetype
        if (needThis(fieldWrapperInfo)) {
            return `auto ret = (char*)self + offset;
    
    info.GetReturnValue().Set(DataTransfer::FindOrAddCData(isolate, context, TIret, ret, true));`
        } else {
            return `auto ret = GetValueTypeFieldPtr(nullptr, fieldInfo, offset);
    
    info.GetReturnValue().Set(DataTransfer::FindOrAddCData(isolate, context, TIret, ret, true));`
        }
    } else {
        return `${CODE_SNIPPETS.SToCPPType(fieldWrapperInfo.ReturnSignature)} ret;

    FieldGet(${needThis(fieldWrapperInfo) ? 'self, ': 'nullptr, '}fieldInfo, offset, &ret);
    
    ${CODE_SNIPPETS.returnToJS(fieldWrapperInfo.ReturnSignature)}`
    }
}

function genFieldWrapper(fieldWrapperInfo) {
    return t`
static void ifg_${fieldWrapperInfo.Signature}(const v8::FunctionCallbackInfo<v8::Value>& info, void* fieldInfo, size_t offset, void* TIret) {
    // PLog(LogLevel::Log, "Running ifg_${fieldWrapperInfo.Signature}");

    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    ${IF(needThis(fieldWrapperInfo))}

    ${CODE_SNIPPETS.getThis(fieldWrapperInfo.ThisSignature)}

    ${ENDIF()}
    ${genGetField(fieldWrapperInfo)}
}

static void ifs_${fieldWrapperInfo.Signature}(const v8::FunctionCallbackInfo<v8::Value>& info, void* fieldInfo, size_t offset, void* TIp) {
    // PLog(LogLevel::Log, "Running ifs_${fieldWrapperInfo.Signature}");
    
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    ${IF(needThis(fieldWrapperInfo))}

    ${CODE_SNIPPETS.getThis(fieldWrapperInfo.ThisSignature)}

    ${ENDIF()}    
    ${CODE_SNIPPETS.JSValToCSVal(fieldWrapperInfo.ReturnSignature, "info[0]", "p")}
    FieldSet(${needThis(fieldWrapperInfo) ? 'self, ': 'nullptr, '}fieldInfo, offset, ${['o', 's', 'p'].indexOf(fieldWrapperInfo.Signature) != -1 ? 'p' : '&p'});
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

${valueTypeInfos.map(CODE_SNIPPETS.defineValueType).join('\n')}

${wrapperInfos.map(genFuncWrapper).join('\n')}

static WrapFuncInfo g_wrapFuncInfos[] = {
    ${FOR(wrapperInfos, info => t`
    {"${info.Signature}", w_${info.Signature}},
    `)}
    {nullptr, nullptr}
};

${bridgeInfos.map(genBridge).join('\n')}

static BridgeFuncInfo g_bridgeFuncInfos[] = {
    ${FOR(bridgeInfos, info => t`
    {"${info.Signature}", (MethodPointer)b_${info.Signature}},
    `)}
    {nullptr, nullptr}
};

${fieldWrapperInfos.map(genFieldWrapper).join('\n')}

static FieldWrapFuncInfo g_fieldWrapFuncInfos[] = {
    ${FOR(fieldWrapperInfos, info => t`
    {"${info.Signature}", ifg_${info.Signature}, ifs_${info.Signature}},
    `)}
    {nullptr, nullptr, nullptr}    
};

`;
}