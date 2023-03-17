/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

/**
 * this template file is write for generating the typescript declartion file
 * 
 * TODO 待node.js版本成熟之后直接接入typescript formatter，现在先用手动指定indent的方式
 * @param {DTS.TypingGenInfo} data 
 * @returns 
 */
 export default function TypingTemplate(data, csharpModuleWillGen) {
    
    let ret = '';
    function _es6tplJoin(str, ...values) {
        return str.map((strFrag, index)=> {
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
        for(var i = 1; i < lines.length; i++) {
            if (lines[i]) newLines.push(append + lines[i].replace(/^[\t\s]*/, ''));
        }

        ret += newLines.join('\n');
    }
    const baseIndent = 0;

    tt`
    declare namespace CS {
    //keep type incompatibility / 此属性保持类型不兼容
    const __keep_incompatibility: unique symbol;

    interface $Ref<T> {
        value: T
    }
    namespace System {
        interface Array$1<T> extends System.Array {
            get_Item(index: number):T;
            
            set_Item(index: number, value: T):void;
        }
    }
    ${data.TaskDef}
    `

    toJsArray(data.NamespaceInfos).forEach(ns=> {
        // namespace start;
        if (ns.Name) {
            t`namespace ${ns.Name} {`
        }

        toJsArray(ns.Types).forEach(type=> {
            // type start
            t.indent = 8 + baseIndent;
            // the comment of the type
            t`
            ${type.Document}
            `
            
            if (!(type.Name == 'JSObject' && ns.Name == 'Puerts')) {
                // type declaration
                t`${typeKeyword(type)} ${typeDeclaration(type, true)}
                `

                if (type.IsDelegate) {
                    // delegate, means function in typescript
                    t`
                    { 
                        ${type.DelegateDef.replace('=>', ':')}; 
                        Invoke?: ${type.DelegateDef};
                    }
                    ${(!type.IsGenericTypeDefinition ? `var ${type.Name}: { new (func: ${type.DelegateDef}): ${type.Name}; }` : '')}
                    `;
                }

                else if (type.IsEnum) {
                    // enum 
                    t`{ ${type.EnumKeyValues} }
                    `;
                }

                else {
                    // class or interface.
                    t`{
                    `;
                    t.indent = 12 + baseIndent;

                    //keep type incompatibility / 此属性保持类型不兼容
                    if (!type.IsInterface) {
                        t`
                        protected [__keep_incompatibility]: never;
                        `
                    }
                    
                    // properties start
                    distinctByName(type.Properties).forEach(property=> {
                        t`
                        ${property.Document}
                        `

                        var allowProperty = !type.IsInterface && (property.HasSetter || property.HasGetter); 
                        if (!allowProperty) { 
                            if (!type.IsInterface) t`public `
                            if (property.IsStatic) t`static `
                            t`${formatPropertyOrMethodName(property.Name) + ' : ' + (property.IsStatic ? typeNameWithOutGenericType(type, property.TypeName) : property.TypeName)}`;

                        } else {
                            t`
                            ${property.HasGetter ? `public ${property.IsStatic ? 'static ' : ''}get ${formatPropertyOrMethodName(property.Name)}(): ${property.IsStatic ? typeNameWithOutGenericType(type, property.TypeName) : property.TypeName};` : ''}
                            ${property.HasSetter ? `public ${property.IsStatic ? 'static ' : ''}set ${formatPropertyOrMethodName(property.Name)}(value: ${property.IsStatic ? typeNameWithOutGenericType(type, property.TypeName) : property.TypeName});` : ''}
                            `;

                        }
                    })
                    // properties end

                    // methods start
                    toJsArray(type.Methods).forEach(method=> {
                        t`
                        ${method.Document}
                        `
                        !type.IsInterface && t`public `;
                        method.IsStatic && t`static `;
                        t`${formatPropertyOrMethodName(method.Name)}` // method name
                        t` (${toJsArray(method.ParameterInfos).map((pinfo, idx)=> parameterDef(pinfo, method.IsStatic, type)).join(', ')})` // method param
                        !method.IsConstructor && t` : ${method.IsStatic ? typeNameWithOutGenericType(type, method.TypeName) : method.TypeName}` // method return
                        t`
                        `
                    });
                    if (type.IteratorReturnName?.length > 0)
                    {
                        !type.IsInterface && t`public `;
                        t`[Symbol.iterator]() : IterableIterator<${type.IteratorReturnName}>
                         `
                    }
                    // methods end
                    t.indent = 8 + baseIndent;
                    t`
                    }
                    `
                }

                // extension methods start
                if (type.ExtensionMethods.Length > 0 && !type.IsEnum) {
                    t.indent = 8 + baseIndent;
                    t`
                    ${type.Document}
                    interface ${type.Name} {
                    `
                    
                    toJsArray(type.ExtensionMethods).forEach(method=>{
                        t.indent = 12 + baseIndent;
                        
                        t`
                        ${method.Document}
                        ${formatPropertyOrMethodName(method.Name)} (${
                            toJsArray(method.ParameterInfos).map((pinfo, idx)=> parameterDef(pinfo)).join(', ')
                        }) : ${method.TypeName};
                        `
                    });

                    t.indent = 8 + baseIndent;
                    t`
                    }
                    `;
                }
                // extension methods end 
                
                
            } else {
                // if the type is Puerts.JSObject, declare an alias for any;
                t.indent = 8 + baseIndent;
                t`type JSObject = any;`;

            }
        })

        // namespace end
        if (ns.Name) {
            t.indent = 4 + baseIndent;
            t`
            }
            `
        }

    })
    
    t.indent = 0;
    if (csharpModuleWillGen) {
        t`
        }
        declare module 'csharp' {
            export = CS;
        }
        `
    } else {
        t`
        }
        `;
    }

    return ret.replace(/\n(\s*)\n/g, '\n');
};
function parameterDef(pinfo, isStatic, type) {
    return (pinfo.IsParams ? ("..." + pinfo.Name) : "$" + pinfo.Name) + (pinfo.IsOptional?"?":"") + ": " + (isStatic ? typeNameWithOutGenericType(type, pinfo.TypeName) : pinfo.TypeName);
}
function typeKeyword(type) {
    if (type.IsDelegate) {
        return 'interface';
    } else if (type.IsInterface) {
        return 'interface';
    } else if (type.IsEnum) {
        return 'enum';
    } else {
        return 'class'
    }
}

function toJsArray(csArr) {
    let arr = [];
    for(var i = 0; i < csArr.Length; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}
function formatPropertyOrMethodName(name) {
    /*处理explicit interface implementation*/
    if (name.indexOf(".") != -1) {
        return name.split(".").pop();
    } else {
        return name;
    }
}
function distinctByName(arr) {
    const exist = {};
    return toJsArray(arr).filter(item=> {
        const itemExist = exist[item.Name];
        exist[item.Name] = true;
        return !itemExist;
    });

}
function typeDeclaration(type, level1) {
    var result = type.Name;
    if (type.IsGenericTypeDefinition) {
        result += "<" + Array.prototype.join.call(toJsArray(type.GenericParameters), ', ') + ">";
    }
    if (level1 && type.BaseType) {
        result += " extends " + typeDeclaration(type.BaseType);
    }
    var interfaces = type.interfaces ? toJsArray(type.interfaces) : [];
    if (level1 && !type.IsDelegate && !type.IsEnum && interfaces.length) {
        result += ((type.IsInterface ? " extends " : " implements ") + interfaces.map(itf=> typeDeclaration(itf)).join(', '))
    }
    if (!level1 && type.Namespace) {
        result = type.Namespace + "." + result;
    }
    return result;
}
function typeNameWithOutGenericType(type, name) {
    if (type.IsGenericTypeDefinition) {
        const gParameters = toJsArray(type.GenericParameters);
        return gParameters.indexOf(name) != -1 ? "any" : name
    }
    return name;
}