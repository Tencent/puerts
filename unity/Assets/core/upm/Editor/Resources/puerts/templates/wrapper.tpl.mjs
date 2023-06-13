/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { default as $, IF, ELSE, ELSEIF, ENDIF, FOR } from './tte.mjs'

class ArgumentCodeGenerator {
    constructor(i) {
        this.index = i;
    }

    declareArgObj() {
        return `object argobj${this.index} = null`;

    }

    argObj() {
        return `argobj${this.index}`
    }

    declareArgJSValueType() {
        return `JsValueType argType${this.index} = JsValueType.Invalid`;
    }

    argJSValueType() {
        return `argType${this.index}`
    }

    declareAndGetV8Value() {
        return `IntPtr v8Value${this.index} = PuertsDLL.GetArgumentValue(info, ${this.index})`
    }

    v8Value() {
        return `v8Value${this.index}`
    }

    arg() {
        return `arg${this.index}`
    }

    getArg(typeInfo) {
        let typeName = typeInfo.TypeName;
        let isByRef = typeInfo.IsByRef ? "true" : "false";

        if (typeInfo.IsParams) {
            return `${typeName}[] arg${this.index} = ArgHelper.GetParams<${typeName}>((int)data, isolate, info, ${this.index}, paramLen, ${this.v8Value()})`;
        } else if (typeInfo.IsEnum) {
            return `${typeName} arg${this.index} = (${typeName})StaticTranslate<${typeInfo.UnderlyingTypeName}>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, ${this.v8Value()}, ${isByRef})`;
        } else if (typeName in fixGet) {
            return `${typeName} arg${this.index} = ${fixGet[typeName](this.v8Value(), isByRef)}`;
        } else {
            return `argobj${this.index} = argobj${this.index} != null ? argobj${this.index} : StaticTranslate<${typeInfo.TypeName}>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value${this.index}, ${typeInfo.IsByRef ? "true" : "false"}); ${typeName} arg${this.index} = (${typeName})argobj${this.index}`
        }
    }

    invokeIsMatch(paramInfo) {
        if (paramInfo.IsParams) {
            return `ArgHelper.IsMatchParams((int)data, isolate, info, ${paramInfo.ExpectJsType}, ${paramInfo.ExpectCsType}, ${this.index}, paramLen, ${this.v8Value()}, ref ${this.argObj()}, ref ${this.argJSValueType()})`

        } else {
            return `ArgHelper.IsMatch((int)data, isolate, ${paramInfo.ExpectJsType}, ${paramInfo.ExpectCsType}, ${paramInfo.IsByRef}, ${paramInfo.IsOut}, ${this.v8Value()}, ref ${this.argObj()}, ref ${this.argJSValueType()})`
        }
    }
}

const fixGet = {
    char: (v8ValueCode, isByRef) => `(char)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    sbyte: (v8ValueCode, isByRef) => `(sbyte)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    byte: (v8ValueCode, isByRef) => `(byte)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    short: (v8ValueCode, isByRef) => `(short)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    ushort: (v8ValueCode, isByRef) => `(ushort)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    int: (v8ValueCode, isByRef) => `(int)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    uint: (v8ValueCode, isByRef) => `(uint)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    long: (v8ValueCode, isByRef) => `(long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, ${v8ValueCode}, ${isByRef});`,
    ulong: (v8ValueCode, isByRef) => `(ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, ${v8ValueCode}, ${isByRef});`,
    double: (v8ValueCode, isByRef) => `(double)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    float: (v8ValueCode, isByRef) => `(float)PuertsDLL.GetNumberFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    bool: (v8ValueCode, isByRef) => `(bool)PuertsDLL.GetBooleanFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    string: (v8ValueCode, isByRef) => `(string)PuertsDLL.GetStringFromValue(isolate, ${v8ValueCode}, ${isByRef})`,
    // 'System.DateTime': (v8ValueCode, isByRef) => `(new DateTime(1970, 1, 1)).AddMilliseconds(PuertsDLL.GetDateFromValue(isolate, ${v8ValueCode}, ${isByRef}))`,
};
const fixReturn = {
    char: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    sbyte: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    byte: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    short: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    ushort: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    int: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    uint: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    long: 'Puerts.PuertsDLL.ReturnBigInt(isolate, info, result)',
    ulong: 'Puerts.PuertsDLL.ReturnBigInt(isolate, info, (long)result)',
    double: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    float: 'Puerts.PuertsDLL.ReturnNumber(isolate, info, result)',
    bool: 'Puerts.PuertsDLL.ReturnBoolean(isolate, info, result)',
    string: 'Puerts.PuertsDLL.ReturnString(isolate, info, result)',
    // "System.DateTime": 'Puerts.PuertsDLL.ReturnDate(isolate, info, (result - new DateTime(1970, 1, 1)).TotalMilliseconds)',
};
const operatorMap = {
    op_Equality: '==',
    op_Inequality: '!=',
    op_GreaterThan: '>',
    op_LessThan: '<',
    op_GreaterThanOrEqual: '>=',
    op_LessThanOrEqual: '<=',
    op_BitwiseAnd: '&',
    op_BitwiseOr: '|',
    op_Addition: '+',
    op_Subtraction: '-',
    op_Division: '/',
    op_Modulus: '%',
    op_Multiply: '*',
    op_LeftShift: '<<',
    op_RightShift: '>>',
    op_ExclusiveOr: '^',
    op_UnaryNegation: '-',
    op_UnaryPlus: '+',
    op_LogicalNot: '!',
    op_OnesComplement: '~',
    op_False: '',
    op_True: '',
    op_Increment: '++',
    op_Decrement: '--',
};
let csharpKeywords = {};
[
    "abstract", "as", "base", "bool",
    "break", "byte", "case", "catch",
    "char", "checked", "class", "const",
    "continue", "decimal", "default", "delegate",
    "do", "double", "else", "enum",
    "event", "explicit", "extern", "false",
    "finally", "fixed", "float", "for",
    "foreach", "goto", "if", "implicit",
    "in", "int", "interface",
    "internal", "is", "lock", "long",
    "namespace", "new", "null", "object",
    "operator", "out", "override",
    "params", "private", "protected", "public",
    "readonly", "ref", "return", "sbyte",
    "sealed", "short", "sizeof", "stackalloc",
    "static", "string", "struct", "switch",
    "this", "throw", "true", "try",
    "typeof", "uint", "ulong", "unchecked",
    "unsafe", "ushort", "using", "virtual",
    "void", "volatile", "while"
].forEach(keywold => {
    csharpKeywords[keywold] = '@' + keywold;
});

/**
 * this template is for generating the c# wrapper class
 * @param {GenClass.TypeGenInfo} data 
 * @returns 
 */
export default function TypingTemplate(data) {
    let ret = '';
    function getSelf(type) {
        if (data.BlittableCopy) {
            return `(${type.Name}*)self`;
        } else if (type.IsValueType) {
            return `(${type.Name})Puerts.Utils.GetSelf((int)data, self)`;
        } else {
            return `Puerts.Utils.GetSelf((int)data, self) as ${type.Name}`;
        }
    }
    function refSelf() {
        return data.BlittableCopy ? "(*obj)" : "obj";
    }

    return $
        `#if !(EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP)
        ${FOR(toJsArray(data.Namespaces), name => `
using ${name};`
        )}
using Puerts;

namespace PuertsStaticWrap
{
#pragma warning disable 0219
    public static class ${data.WrapClassName}${data.IsGenericWrapper ? `<${makeGenericAlphaBet(data.GenericArgumentsInfo)}>` : ''} ${data.IsGenericWrapper ? makeConstraints(data.GenericArgumentsInfo) : ''}
    {
    ${IF(data.BlittableCopy)}
        static ${data.Name} HeapValue;
    ${ENDIF()}
    
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8ConstructorCallback))]
        ${data.BlittableCopy ? 'unsafe ' : ''}internal static IntPtr Constructor(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {
${IF(data.Constructor, () => $`
    ${FOR(toJsArray(data.Constructor?.OverloadGroups), overloadGroup => {
            var argumentCodeGenerators = toJsArray(overloadGroup.get_Item(0).ParameterInfos).map((v, i) => new ArgumentCodeGenerator(i));
            $`
            ${IF(data.Constructor.HasOverloads)}
                if (${paramLenCheck(overloadGroup)})
            ${ENDIF()}
                {
                ${FOR(argumentCodeGenerators, acg => `
                    ${acg.declareAndGetV8Value()};
                    ${acg.declareArgObj()};
                    ${data.Constructor.HasOverloads ? acg.declareArgJSValueType() : ""};
                `)}
                ${FOR(toJsArray(overloadGroup), overload =>
                    $`
                    ${IF(data.Constructor.HasOverloads && overload.ParameterInfos.Length > 0)}
                    if (${argumentCodeGenerators.map((acg, idx) => {
                        return acg.invokeIsMatch(overload.ParameterInfos.get_Item(idx))
                    }).join(' && ')})
                    ${ENDIF()}

                    {
                    ${FOR(argumentCodeGenerators, (acg, index) => `
                        ${acg.getArg(overload.ParameterInfos.get_Item(index))};
                    `)}
                        ${data.BlittableCopy ? "HeapValue" : "var result"} = new ${data.Name}(${argumentCodeGenerators.map((acg, idx) => {
                        var paramInfo = overload.ParameterInfos.get_Item(idx);
                        return `${paramInfo.IsOut ? "out " : (paramInfo.IsByRef ? (paramInfo.IsIn ? "in " : "ref ") : "")}${acg.arg()}`
                    }).join(', ')});

                    ${FOR(argumentCodeGenerators, (acg, idx) => {
                        var paramInfo = overload.ParameterInfos.get_Item(idx)
                        paramInfo.IsByRef && $`
                        StaticTranslate<${paramInfo.TypeName}>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, ${acg.v8Value()}, ${acg.arg()});`
                    })}

                    ${IF(data.BlittableCopy)}
                        fixed (${data.Name}* result = &HeapValue)
                        {
                            return new IntPtr(result);
                        }
                    ${ELSE()}
                        return Puerts.Utils.GetObjectPtr((int)data, typeof(${data.Name}), result);
                    ${ENDIF()}
                    }
                    `)}
                }
        `
        })}
`)}
${IF(!data.Constructor || (data.Constructor.OverloadCount != 1))}
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to " + typeof(${data.Name}).GetFriendlyName() + " constructor");
${ENDIF()}
            } catch (Exception e) {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            return IntPtr.Zero;
        }
    // ==================== constructor end ====================

    // ==================== methods start ====================
${FOR(toJsArray(data.Methods).filter(item => !item.IsLazyMember), method => $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !method.IsStatic ? 'unsafe ' : ''}internal static void ${(method.IsStatic ? "F" : "M")}_${method.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!method.IsStatic ? `var obj = ${getSelf(data)};` : ''}
        
        ${FOR(toJsArray(method.OverloadGroups), overloadGroup => {
            var argumentCodeGenerators = toJsArray(overloadGroup.get_Item(0).ParameterInfos)
                // 这里取0可能是因为第一个重载参数肯定是最全的？
                .map((item, i) => new ArgumentCodeGenerator(i));
            $
            `${IF(method.HasOverloads)}
                if (${paramLenCheck(overloadGroup)})
            ${ENDIF()}
                {
            
                ${FOR(argumentCodeGenerators, acg => $`
                    ${acg.declareAndGetV8Value()};
                    ${acg.declareArgObj()};
                    ${method.HasOverloads ? acg.declareArgJSValueType() : ''};
                `)}
                ${FOR(toJsArray(overloadGroup), overload => $`
                    ${IF(method.HasOverloads && overload.ParameterInfos.Length > 0)}
                    if (${argumentCodeGenerators.map((acg, idx) => {
                        return acg.invokeIsMatch(overload.ParameterInfos.get_Item(idx))
                    }).join(' && ')})
                    ${ENDIF()}
                    {
                    ${FOR(argumentCodeGenerators, (acg, idx) => $`
                        ${acg.getArg(overload.ParameterInfos.get_Item(idx))};
                    `)}

                        ${overload.IsVoid ? "" : "var result = "}${method.IsStatic ? data.Name : refSelf()}.${UnK(method.Name)} (${argumentCodeGenerators.map((acg, idx) => {
                            var paramInfo = overload.ParameterInfos.get_Item(idx);
                return `${paramInfo.IsOut ? "out " : (paramInfo.IsByRef ? (paramInfo.IsIn ? "in " : "ref ") : "")}${acg.arg()}`
                            }).concat(overload.EllipsisedParameterInfos.Length == 0 ? [] : toJsArray(overload.EllipsisedParameterInfos).map(info=> info.DefaultValue)).join(', ')
                        });

                    ${FOR(argumentCodeGenerators, (acg, idx) => $`
                        ${IF(overload.ParameterInfos.get_Item(idx).IsByRef)}
                        StaticTranslate<${overload.ParameterInfos.get_Item(idx).TypeName}>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, ${acg.v8Value()}, ${acg.arg()});
                        ${ENDIF()}
                    `)}
                        ${!overload.IsVoid ? setReturn(overload) + ';' : ''}
                        ${!data.BlittableCopy && !method.IsStatic ? setSelf(data) : ""}
                        ${method.HasOverloads ? 'return;' : ''}
                    }
                `)}
                }
            `
        })}
        ${IF(method.HasOverloads)}
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to ${method.Name}");
        ${ENDIF()}
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
    `)}
    // ==================== methods end ====================

    // ==================== properties start ====================
    ${FOR(toJsArray(data.Properties).filter(property => !property.IsLazyMember), property => {
            if (property.HasGetter) {
                $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !property.IsStatic ? 'unsafe ' : ''}internal static void G_${property.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!property.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                var result = ${property.IsStatic ? data.Name : refSelf()}.${UnK(property.Name)};
                ${setReturn(property)};
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
            }
            if (property.HasSetter) {
                var acg = new ArgumentCodeGenerator(0);
                $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !property.IsStatic ? 'unsafe ' : ''}internal static void S_${property.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!property.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                ${acg.declareAndGetV8Value()};
                ${acg.declareArgObj()};
                ${acg.getArg(property)};
                ${property.IsStatic ? data.Name : refSelf()}.${UnK(property.Name)} = ${acg.arg()};
                ${!data.BlittableCopy && !property.IsStatic ? setSelf(data) : ''}
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
            }
        })}
    // ==================== properties end ====================
    // ==================== array item get/set start ====================
    ${IF(data.GetIndexs.Length > 0, () => {
            var acg = new ArgumentCodeGenerator(0);
            $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy ? 'unsafe ' : ''}internal static void GetItem(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = ${getSelf(data)};
                ${acg.declareAndGetV8Value()};
                ${acg.declareArgObj()};
                ${acg.declareArgJSValueType()};
            ${FOR(toJsArray(data.GetIndexs), indexInfo => $`
                if (${acg.invokeIsMatch(indexInfo.IndexParameter)})
                {
                    ${acg.getArg(indexInfo.IndexParameter)};
                    var result = ${refSelf()}[${acg.arg()}];
                    ${setReturn(indexInfo)};
                    return;
                }
            `)}
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        `
        })}
    ${IF(data.SetIndexs.Length > 0, () => {
            var keyAcg = new ArgumentCodeGenerator(0);
            $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy ? 'unsafe ' : ''}internal static void SetItem(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = ${getSelf(data)};
                ${keyAcg.declareAndGetV8Value()};
                ${keyAcg.declareArgObj()};
                ${keyAcg.declareArgJSValueType()};

            ${FOR(toJsArray(data.SetIndexs), indexInfo => {
                var valueAcg = new ArgumentCodeGenerator(1);
                $`
                if (${keyAcg.invokeIsMatch(indexInfo.IndexParameter)})
                {
                    ${keyAcg.getArg(indexInfo.IndexParameter)};

                    ${valueAcg.declareAndGetV8Value()};
                    ${valueAcg.declareArgObj()};
                    ${valueAcg.getArg(indexInfo)};

                    ${refSelf()}[${keyAcg.arg()}] = ${valueAcg.arg()};
                    return;
                }`
            })}
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        `
        })}
    // ==================== array item get/set end ====================
    // ==================== operator start ====================
    ${FOR(toJsArray(data.Operators).filter(oper => !oper.IsLazyMember), operator => $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        internal static void O_${operator.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
        ${FOR(toJsArray(operator.OverloadGroups), overloadGroup => {
            var argumentCodeGenerators = toJsArray(overloadGroup.get_Item(0).ParameterInfos).map((v, i) => new ArgumentCodeGenerator(i));
            $`
                ${IF(operator.HasOverloads)}
                if (${paramLenCheck(overloadGroup)})
                ${ENDIF()}
                {
                ${FOR(argumentCodeGenerators, (acg) => $`
                    ${acg.declareAndGetV8Value()};
                    ${acg.declareArgObj()};
                    ${acg.declareArgJSValueType()};
                `)}
                ${FOR(toJsArray(overloadGroup), overload => $`
                    ${IF(operator.HasOverloads && overload.ParameterInfos.Length > 0)}
                    if (${argumentCodeGenerators.map((acg, idx) => {
                return acg.invokeIsMatch(overload.ParameterInfos.get_Item(idx))
            }).join(' && ')})
                    ${ENDIF()}
                    
                    {
                    ${FOR(argumentCodeGenerators, (acg, idx) => $`
                        ${acg.getArg(overload.ParameterInfos.get_Item(idx))};
                    `)}
                        var result = ${operatorCall(operator.Name, argumentCodeGenerators, overload)};
                        ${!overload.IsVoid ? setReturn(overload) + ';' : ''}
                        ${operator.HasOverloads ? 'return;' : ''}
                    }
                `)}
                }
            `
        })}
        ${IF(operator.HasOverloads)}
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to ${operator.Name}");
        ${ENDIF()}
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
    `)}
    // ==================== operator end ====================
    // ==================== events start ====================
    ${FOR(toJsArray(data.Events).filter(ev => !ev.IsLazyMember), eventInfo => {
            if (eventInfo.HasAdd) {
                var acg = new ArgumentCodeGenerator(0);
                $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !eventInfo.IsStatic ? 'unsafe ' : ''}internal static void A_${eventInfo.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!eventInfo.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                ${acg.declareAndGetV8Value()};
                ${acg.declareArgObj()};
                ${acg.getArg(eventInfo)};
                ${eventInfo.IsStatic ? data.Name : refSelf()}.${eventInfo.Name} += ${acg.arg()};
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
            }
            if (eventInfo.HasRemove) {
                var acg = new ArgumentCodeGenerator(0);
                $`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !eventInfo.IsStatic ? 'unsafe' : ''}internal static void R_${eventInfo.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!eventInfo.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                ${acg.declareAndGetV8Value()};
                ${acg.declareArgObj()};
                ${acg.getArg(eventInfo)};
                ${eventInfo.IsStatic ? data.Name : refSelf()}.${eventInfo.Name} -= ${acg.arg()};
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
            }
        })}
    // ==================== events end ====================

    ${IF(data.BlittableCopy, () => {
            $`
        unsafe internal static ${data.Name} StaticGetter(int jsEnvIdx, IntPtr isolate, Puerts.IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            ${data.Name}* result = (${data.Name}*)getValueApi.GetNativeObject(isolate, value, isByRef);
            return result == null ? default(${data.Name}) : *result;
        }

        unsafe internal static void StaticSetter(int jsEnvIdx, IntPtr isolate, Puerts.ISetValueToJs setValueApi, IntPtr value, ${data.Name} val)
        {
            HeapValue = val;
            fixed (${data.Name}* result = &HeapValue)
            {
                var typeId = Puerts.JsEnv.jsEnvs[jsEnvIdx].GetTypeId(typeof(${data.Name}));
                setValueApi.SetNativeObject(isolate, value, typeId, new IntPtr(result));
            }
        }

        public static void InitBlittableCopy(Puerts.JsEnv jsEnv)
        {
            Puerts.StaticTranslate<${data.Name}>.ReplaceDefault(StaticSetter, StaticGetter);
            jsEnv.RegisterGeneralGetSet(typeof(${data.Name}), (int jsEnvIdx, IntPtr isolate, Puerts.IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
            {
                return StaticGetter(jsEnvIdx, isolate, getValueApi, value, isByRef);
            }, (int jsEnvIdx, IntPtr isolate, Puerts.ISetValueToJs setValueApi, IntPtr value, object obj) => 
            {
                StaticSetter(jsEnvIdx, isolate, setValueApi, value, (${data.Name})obj);
            });
        }
        `
        })}
    }
#pragma warning disable 0219
}
#endif
`
}

function toJsArray(csArr) {
    if (!csArr) return [];
    let arr = [];
    for (var i = 0; i < csArr.Length; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}
function UnK(identifier) {
    return csharpKeywords.hasOwnProperty(identifier) ? csharpKeywords[identifier] : identifier;
}

function setReturn(typeInfo) {
    let typeName = typeInfo.TypeName;
    if (typeName in fixReturn) {
        return fixReturn[typeName];
    } else if (typeInfo.IsEnum) {
        return fixReturn[typeInfo.UnderlyingTypeName].replace('result', `(${typeInfo.UnderlyingTypeName})result`);
    } else {
        return `Puerts.ResultHelper.Set((int)data, isolate, info, result)`;
    }
}
function operatorCall(methodName, acgList, typeInfo) {
    if (methodName == 'op_Implicit') {
        return `(${typeInfo.TypeName})${acgList[0].arg()}`;
    }
    if (acgList.length == 1) {
        return operatorMap[methodName] + acgList[0].arg();
    } else if (acgList.length == 2) {
        return [acgList[0].arg(), operatorMap[methodName], acgList[1].arg()].join(' ')
    }
}

function setSelf(type) {
    if (type.IsValueType) {
        return `Puerts.Utils.SetSelf((int)data, self, obj);`
    } else {
        return '';
    }
}


function paramLenCheck(group) {
    let len = group.get_Item(0).ParameterInfos.Length;
    return group.get_Item(0).HasParams ? `paramLen >= ${len - 1}` : `paramLen == ${len}`;
}

function makeGenericAlphaBet(info) {
    const arr = [];
    for (var i = 0; i < info.Length; i++) {
        arr.push(info.get_Item(i).Name);
    }
    return arr.join(',')
}

function makeConstraints(info) {
    const ret = [];
    if (info.Length == 0) {
        return '';
    }
    for (var i = 0; i < info.Length; i++) {
        const item = info.get_Item(i);
        if (item.Constraints.Length == 0) {
            continue;
        }
        var consstr = [];
        for (var j = 0; j < item.Constraints.Length; j++) {
            consstr.push(item.Constraints.get_Item(j));
        }
        ret.push(`where ${item.Name} : ` + consstr.join(', '))
    }
    return ret.join(' ');
}