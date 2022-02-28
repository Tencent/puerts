/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

const fixGet = {
    char: 'GetChar',
    sbyte: 'GetSByte',
    byte: 'GetByte',
    short: 'GetInt16',
    ushort: 'GetUInt16',
    int: 'GetInt32',
    uint: 'GetUInt32',
    long: 'GetInt64',
    ulong: 'GetUInt64',
    double: 'GetDouble',
    float: 'GetFloat',
    bool: 'GetBoolean',
    string: 'GetString',
    DateTime: 'GetDateTime',
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
    DateTime: 'Puerts.PuertsDLL.ReturnDate(isolate, info, (result - new DateTime(1970, 1, 1)).TotalMilliseconds)',
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
 * generate the paramList. For Array.map() using
 * @param {} paramInfo 
 * @param {*} idx 
 * @returns 
 */
const paramListLambda = (paramInfo, idx) => `${paramInfo.IsOut ? "out " : (paramInfo.IsByRef ? "ref " : "")}Arg${idx}`;

/**
 * this template is for generating the c# wrapper class
 * @param {GenClass.TypeGenInfo} data 
 * @returns 
 */
module.exports = function TypingTemplate(data) {
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

    function _es6tplJoin(str, ...values) {
        return str.map((strFrag, index) => {
            if (index == str.length - 1) {
                return strFrag;

            } else {
                return strFrag + values[index];
            }
        }).join('');
    }
    function tt(str, ...values) {
        // just append all estemplate values.
        const appendtext = _es6tplJoin(str, ...values)

        ret += appendtext;
    }
    function t(str, ...values) {
        // just append all estemplate values. and indent them;
        const appendtext = _es6tplJoin(str, ...values)

        // indent
        let lines = appendtext.split(/[\n\r]/);
        let newLines = [lines[0]];
        let append = " ".repeat(t.indent);
        for (var i = 1; i < lines.length; i++) {
            if (lines[i]) newLines.push(append + lines[i].replace(/^[\t\s]*/, ''));
        }

        ret += newLines.join('\n');
    }

    t.indent = 0;
    toJsArray(data.Namespaces).forEach(name => {
        t`
        using ${name};
        `
    });

    tt`
namespace PuertsStaticWrap
{
    public static class ${data.WrapClassName}
    {
`
    data.BlittableCopy && tt`
        static ${data.Name} HeapValue;
    `

    // ==================== constructor start ====================
    tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8ConstructorCallback))]
        ${data.BlittableCopy ? 'unsafe ' : ''}private static IntPtr Constructor(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {
`
    if (data.Constructor) {
        toJsArray(data.Constructor.OverloadGroups).forEach(overloadGroup => {
            if (data.Constructor.HasOverloads) {
                tt`
                if (${paramLenCheck(overloadGroup)})
                `
            }
            tt`
                {
            `
            for (var i = 0; i < overloadGroup.get_Item(0).ParameterInfos.Length; i++) {
                tt`
                    var argHelper${i} = new Puerts.ArgumentHelper((int)data, isolate, info, ${i});
                `
            }
            toJsArray(overloadGroup).forEach(overload => {

                data.Constructor.HasOverloads && overload.ParameterInfos.Length > 0 &&
                tt`
                    if (${toJsArray(overload.ParameterInfos).map((paramInfo, idx) => `argHelper${idx}.IsMatch(${paramInfo.ExpectJsType}, ${paramInfo.ExpectCsType}, ${paramInfo.IsByRef}, ${paramInfo.IsOut})`).join(' && ')})
                `;

                tt`
                    {
                `
                toJsArray(overload.ParameterInfos).forEach((paramInfo, idx) => {
                    tt`
                        var Arg${idx} = ${getArgument(paramInfo, 'argHelper' + idx, idx)};
                    `
                })
                tt`
                        ${data.BlittableCopy ? "HeapValue" : "var result"} = new ${data.Name}(${toJsArray(overload.ParameterInfos).map(paramListLambda).join(', ')});
                `
                toJsArray(overload.ParameterInfos).forEach((paramInfo, idx) => {
                    paramInfo.IsByRef && tt`
                        argHelper${idx}.SetByRefValue(Arg${idx});
                    `
                })
                if (data.BlittableCopy) {
                    tt` 
                        fixed (${data.Name}* result = &HeapValue)
                        {
                            return new IntPtr(result);
                        }
                    `
                } else {
                    tt`
                        return Puerts.Utils.GetObjectPtr((int)data, typeof(${data.Name}), result);
                    `
                }
                tt`
                    }
                `
            })
            tt`
                }
            `
        })
    }
    !data.Constructor || (data.Constructor.OverloadCount != 1) && tt`
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to ${data.Name} constructor");
    `
    tt`
    
            } catch (Exception e) {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            return IntPtr.Zero;
        }
    `
    // ==================== constructor end ====================


    // ==================== methods start ====================
    toJsArray(data.Methods).filter(item => !item.IsLazyMember).forEach(method => {
        tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !method.IsStatic ? 'unsafe ' : ''}private static void ${(method.IsStatic ? "F" : "M")}_${method.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!method.IsStatic ? `var obj = ${getSelf(data)};` : ''}
        `
        toJsArray(method.OverloadGroups).forEach(overloadGroup => {
            method.HasOverloads && tt`
                if (${paramLenCheck(overloadGroup)})
            `
            tt`
                {
            `
            for (var i = 0; i < overloadGroup.get_Item(0).ParameterInfos.Length; i++) {
                tt`
                    var argHelper${i} = new Puerts.ArgumentHelper((int)data, isolate, info, ${i});
                `
            }
            toJsArray(overloadGroup).forEach(overload => {
                method.HasOverloads && overload.ParameterInfos.Length > 0 && tt`
                    if (${toJsArray(overload.ParameterInfos).map((paramInfo, idx) =>
                        `argHelper${idx}.${paramInfo.IsParams ? "IsMatchParams" : "IsMatch"}(${paramInfo.ExpectJsType}, ${paramInfo.ExpectCsType}, ${paramInfo.IsParams ? idx : paramInfo.IsByRef}, ${paramInfo.IsParams ? "paramLen" : paramInfo.IsOut})`).join(' && ')
                        })
                `
                tt`
                    {
                `
                toJsArray(overload.ParameterInfos).forEach((paramInfo, idx) => {
                    tt`
                        var Arg${idx} = ${getArgument(paramInfo, 'argHelper' + idx, idx)};
                    `
                })
                tt`
                        ${overload.IsVoid ? "" : "var result = "}${method.IsStatic ? data.Name : refSelf()}.${UnK(method.Name)}(${toJsArray(overload.ParameterInfos).map(paramListLambda).join(', ')});
                `
                toJsArray(overload.ParameterInfos).forEach((paramInfo, idx) => {
                    if (paramInfo.IsByRef) {
                        tt`
                        argHelper${idx}.SetByRefValue(Arg${idx});
                        `
                    }
                })
                tt`
                        ${!overload.IsVoid ? setReturn(overload) + ';' : ''}
                        ${!data.BlittableCopy && !method.IsStatic ? setSelf(data) : ""}
                        ${method.HasOverloads ? 'return;' : ''}
                    }
                `
            })
            tt`
                }
            `
        })
        method.HasOverloads && tt`
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to ${method.Name}");
        `
        tt`
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        `
    });
    // ==================== methods end ====================

    // ==================== properties start ====================
    toJsArray(data.Properties).filter(property => !property.IsLazyMember).forEach(property => {
        if (property.HasGetter) {
            tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !property.IsStatic ? 'unsafe ' : ''}private static void G_${property.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
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
            tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !property.IsStatic ? 'unsafe ' : ''}private static void S_${property.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!property.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                ${property.IsStatic ? data.Name : refSelf()}.${UnK(property.Name)} = ${getArgument(property, 'argHelper')};
                ${!data.BlittableCopy && !property.IsStatic ? setSelf(data) : ''}
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
        }
    })
    // ==================== properties end ====================

    // ==================== array item get/set start ====================
    if (data.GetIndexs.Length > 0) {
        tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy ? 'unsafe ' : ''}private static void GetItem(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = ${getSelf(data)};
                var keyHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
        `;
        toJsArray(data.GetIndexs).forEach(indexInfo => {
            tt`
                if (keyHelper.IsMatch(${indexInfo.IndexParameter.ExpectJsType}, ${indexInfo.IndexParameter.ExpectCsType}, ${indexInfo.IndexParameter.IsByRef}, ${indexInfo.IndexParameter.IsOut}))
                {
                    var key = ${getArgument(indexInfo.IndexParameter, 'keyHelper')};
                    var result = ${refSelf()}[key];
                    ${setReturn(indexInfo)};
                    return;
                }
            `;
        })
        tt`
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        `
    }
    if (data.SetIndexs.Length > 0) {
        tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy ? 'unsafe ' : ''}private static void SetItem(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = ${getSelf(data)};
                var keyHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                var valueHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 1);`
        toJsArray(data.SetIndexs).forEach(indexInfo => {
            tt`
                if (keyHelper.IsMatch(${indexInfo.IndexParameter.ExpectJsType}, ${indexInfo.IndexParameter.ExpectCsType}, ${indexInfo.IndexParameter.IsByRef}, ${indexInfo.IndexParameter.IsOut}))
                {
                    var key = ${getArgument(indexInfo.IndexParameter, 'keyHelper')};
                    ${refSelf()}[key] = ${getArgument(indexInfo, 'valueHelper')};
                    return;
                }
            `
        });
        tt`
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        `
    }
    // ==================== array item get/set end ====================

    // ==================== operator start ====================
    toJsArray(data.Operators).filter(oper => !oper.IsLazyMember).forEach(operator => {
        tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void O_${operator.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
        `
        toJsArray(operator.OverloadGroups).forEach(overloadGroup => {
            operator.HasOverloads && tt`
                if (${paramLenCheck(overloadGroup)})
            `
            tt`
                {
            `
            for (var i = 0; i < overloadGroup.get_Item(0).ParameterInfos.Length; i++) {
                tt`
                    var argHelper${i} = new Puerts.ArgumentHelper((int)data, isolate, info, ${i});
                `
            }
            toJsArray(overloadGroup).forEach(overload => {
                operator.HasOverloads && overload.ParameterInfos.Length > 0 && tt`
                    if (${toJsArray(overload.ParameterInfos).map((paramInfo, idx) => `argHelper${idx}.IsMatch(${paramInfo.ExpectJsType}, ${paramInfo.ExpectCsType}, ${paramInfo.IsByRef}, ${paramInfo.IsOut})`).join(' && ')})
                `
                tt`
                    {
                `
                toJsArray(overload.ParameterInfos).forEach((paramInfo, idx) => {
                    tt` 
                        var arg${idx} = ${getArgument(paramInfo, 'argHelper' + idx, idx)};
                    `
                })
                tt`
                        var result = ${operatorCall(operator.Name, overload.ParameterInfos.Length, overload)};
                        ${!overload.IsVoid ? setReturn(overload) + ';' : ''}
                        ${operator.HasOverloads ? 'return;' : ''}
                    }
                `
            })
            tt`
                }
            `
        })
        operator.HasOverloads && tt`
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to ${operator.Name}");
        `
        tt`
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        `
    })
    // ==================== operator end ====================

    // ==================== events start ====================
    toJsArray(data.Events).filter(ev => !ev.IsLazyMember).forEach(eventInfo => {
        if (eventInfo.HasAdd) {
            tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !eventInfo.IsStatic ? 'unsafe ' : ''}private static void A_${eventInfo.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!eventInfo.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                ${eventInfo.IsStatic ? data.Name : refSelf()}.${eventInfo.Name} += ${getArgument(eventInfo, 'argHelper')};
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
        }
        if (eventInfo.HasRemove) {
            tt`
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        ${data.BlittableCopy && !eventInfo.IsStatic ? 'unsafe' : ''}private static void R_${eventInfo.Name}(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                ${!eventInfo.IsStatic ? `var obj = ${getSelf(data)};` : ''}
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                ${eventInfo.IsStatic ? data.Name : refSelf()}.${eventInfo.Name} -= ${getArgument(eventInfo, 'argHelper')};
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            `
        }
    })
    // ==================== events end ====================
    tt`    
        public static Puerts.TypeRegisterInfo GetRegisterInfo()
        {
            return new Puerts.TypeRegisterInfo()
            {
                BlittableCopy = ${data.BlittableCopy},
                Constructor = Constructor,
                Methods = new System.Collections.Generic.Dictionary<Puerts.MethodKey, Puerts.V8FunctionCallback>()
                {
                    ${[
            toJsArray(data.Methods).filter(p => !p.IsLazyMember).map(method => `{ new Puerts.MethodKey {Name = "${method.Name}", IsStatic = ${method.IsStatic}}, ${(method.IsStatic ? "F" : "M")}_${method.Name} }`).join(',\n'),
            data.GetIndexs.Length > 0 ? '{ new Puerts.MethodKey {Name = "get_Item", IsStatic = false}, GetItem }\n' : '',
            data.SetIndexs.Length > 0 ? '{ new Puerts.MethodKey {Name = "set_Item", IsStatic = false}, SetItem }\n' : '',
            toJsArray(data.Operators).filter(p => !p.IsLazyMember).map(operator => `{ new Puerts.MethodKey {Name = "${operator.Name}", IsStatic = true}, O_${operator.Name} }`).join(',\n'),
            toJsArray(data.Events).filter(p => !p.IsLazyMember).map(eventInfo => {
                const ret = [];
                if (eventInfo.HasAdd) {
                    ret.push(`{ new Puerts.MethodKey {Name = "add_${eventInfo.Name}", IsStatic = ${eventInfo.IsStatic}}, A_${eventInfo.Name} }`)
                }
                if (eventInfo.HasRemove) {
                    ret.push(`{ new Puerts.MethodKey {Name = "remove_${eventInfo.Name}", IsStatic = ${eventInfo.IsStatic}},  R_${eventInfo.Name} }`)
                }
                return ret.join(',\n')
            }).join(',\n')
        ].filter(str => str.trim()).join(',\n')}
                },
                Properties = new System.Collections.Generic.Dictionary<string, Puerts.PropertyRegisterInfo>()
                {
                    ${toJsArray(data.Properties).filter(p => !p.IsLazyMember).map(property => `{"${property.Name}", new Puerts.PropertyRegisterInfo(){ IsStatic = ${property.IsStatic}, Getter = ${property.HasGetter ? "G_" + property.Name : "null"}, Setter = ${property.HasSetter ? "S_" + property.Name : "null"}} }`).join(',\n')}
                },
                LazyMethods = new System.Collections.Generic.Dictionary<Puerts.MethodKey, Puerts.V8FunctionCallback>()
                {
                    ${[
            toJsArray(data.Methods).filter(p => p.IsLazyMember).map(method => `{ new Puerts.MethodKey {Name = "${method.Name}", IsStatic = ${method.IsStatic}}, null}`).join(',\n'),
            toJsArray(data.Operators).filter(p => p.IsLazyMember).map(operator => `{ new Puerts.MethodKey {Name = "${operator.Name}", IsStatic = true}, null}`).join(',\n'),
            toJsArray(data.Events).filter(p => p.IsLazyMember).map(eventInfo => {
                const ret = [];
                if (eventInfo.HasAdd) {
                    ret.push(`{ new Puerts.MethodKey {Name = "add_${eventInfo.Name}", IsStatic = ${eventInfo.IsStatic}}, null}`)
                }
                if (eventInfo.HasRemove) {
                    ret.push(`{ new Puerts.MethodKey {Name = "remove_${eventInfo.Name}", IsStatic = ${eventInfo.IsStatic}}, null}`)
                }
                return ret.join(',\n')
            }).join(',\n')
        ].filter(str => str).join(',\n')}
                },
                LazyProperties = new System.Collections.Generic.Dictionary<string, Puerts.PropertyRegisterInfo>()
                {
                    ${toJsArray(data.Properties).filter(p => p.IsLazyMember).map(property => `{"${property.Name}", new Puerts.PropertyRegisterInfo(){ IsStatic = ${property.IsStatic} } }`).join(',\n')}
                }
            };
        }
    `
    if (data.BlittableCopy) {
        tt`
        unsafe private static ${data.Name} StaticGetter(int jsEnvIdx, IntPtr isolate, Puerts.IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            ${data.Name}* result = (${data.Name}*)getValueApi.GetNativeObject(isolate, value, isByRef);
            return result == null ? default(${data.Name}) : *result;
        }

        unsafe private static void StaticSetter(int jsEnvIdx, IntPtr isolate, Puerts.ISetValueToJs setValueApi, IntPtr value, ${data.Name} val)
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
            int jsEnvIdx = jsEnv.Index;
            jsEnv.RegisterGeneralGetSet(typeof(${data.Name}), (IntPtr isolate, Puerts.IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
            {
                return StaticGetter(jsEnvIdx, isolate, getValueApi, value, isByRef);
            }, (IntPtr isolate, Puerts.ISetValueToJs setValueApi, IntPtr value, object obj) => 
            {
                StaticSetter(jsEnvIdx, isolate, setValueApi, value, (${data.Name})obj);
            });
        }
        `
    }

    tt`
    }
}
`
    return ret;
}

function toJsArray(csArr) {
    let arr = [];
    for (var i = 0; i < csArr.Length; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}
function UnK(identifier) {
    return csharpKeywords.hasOwnProperty(identifier) ? csharpKeywords[identifier] : identifier;
}

function getArgument(typeInfo, argHelper, idx) {
    let typeName = typeInfo.TypeName;
    let isByRef = typeInfo.IsByRef ? "true" : "false";
    if (typeInfo.IsParams) {
        return `${argHelper}.GetParams<${typeName}>(info, ${idx}, paramLen)`;
    } else if (typeInfo.IsEnum) {
        return `(${typeName})${argHelper}.${fixGet[typeInfo.UnderlyingTypeName]}(${isByRef})`;
    } else if (typeName in fixGet) {
        return `${argHelper}.${fixGet[typeName]}(${isByRef})`;
    } else {
        return `${argHelper}.Get<${typeName}>(${isByRef})`;
    }
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
function operatorCall(methodName, argCount, typeInfo) {
    if (methodName == 'op_Implicit') {
        return `(${typeInfo.TypeName})arg0`;
    }
    if (argCount == 1) {
        return operatorMap[methodName] + 'arg0';
    } else if (argCount == 2) {
        return 'arg0 ' + operatorMap[methodName] + ' arg1';
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