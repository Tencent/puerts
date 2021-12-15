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
        result += ((type.IsInterface ? " extends " : " implements ") + interfaces.map(interface=> typeDeclaration(interface)).join(', '))
    }
    if (!level1 && type.Namespace) {
        result = type.Namespace + "." + result;
    }
    return result;
}
function indent(str, n) {
    let lines = str.split(/[\n\r]/);
    let newLines = [lines[0]];
    let append = " ".repeat(n);
    for(var i = 1; i < lines.length; i++) {
        if (lines[i]) newLines.push(append + lines[i]);
    }
    return newLines.join('\n');
}
function typeNameWithOutGenericType(type, name) {
    if (type.IsGenericTypeDefinition) {
        const gParameters = toJsArray(type.GenericParameters);
        return gParameters.indexOf(name) != -1 ? "any" : name
    }
    return name;
}

module.exports = function TypingTemplate(data) {
    return `
declare module 'csharp' {
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
    
    ${toJsArray(data.NamespaceInfos).map(ns=> `
        ${ns.Name ? `namespace ${ns.Name} {` : ''}
        ${toJsArray(ns.Types).map(type=> 
            indent(type.Document, 8) + `
            ` +
            (type.Name == 'JSObject' && ns.Name == 'Puerts' ? 'type JSObject = any;' : 
            `${typeKeyword(type)} ${typeDeclaration(type, true)}
            ${(()=> {
                if (type.IsDelegate) {
                    return `
                    { ${type.DelegateDef.replace('=>', ':')}; }
                    ${(!type.IsGenericTypeDefinition ? `var ${type.Name}: { new (func: ${type.DelegateDef}): ${type.Name}; }` : '')}
                    `.trim();
                }
                else if (type.IsEnum) {
                    return `{ ${type.EnumKeyValues} }`
                }
                else {
                    return `
                    {
                        ${distinctByName(type.Properties).map(property=> {
                            return `
                                ${indent(property.Document, 12)}
                                ${(()=> {
                                    var allowProperty = !type.IsInterface && (property.HasSetter || property.HasGetter); 
                                    if (!allowProperty) { 
                                        let ret = '';
                                        if (!type.IsInterface) ret += 'public '
                                        if (property.IsStatic) ret += 'static '
                                        ret += formatPropertyOrMethodName(property.Name) + ' : ' + (property.IsStatic ? typeNameWithOutGenericType(type, property.TypeName) : property.TypeName)
                                        return ret;

                                    } else {
                                        ret = `
                                        ${property.HasGetter ? `public ${property.IsStatic ? 'static ' : ''}get ${formatPropertyOrMethodName(property.Name)}(): ${property.IsStatic ? typeNameWithOutGenericType(type, property.TypeName) : property.TypeName};` : ''}
                                        ${property.HasSetter ? `public ${property.IsStatic ? 'static ' : ''}set ${formatPropertyOrMethodName(property.Name)}(value: ${property.IsStatic ? typeNameWithOutGenericType(type, property.TypeName) : property.TypeName});` : ''}
                                        `;
                                        return ret;
                                    }
                                })() || ''}
                            `
                        }).join('\n')}
                        ${toJsArray(type.Methods).map(method=> `
                            ${indent(method.Document, 12)}
                            ${!type.IsInterface ? 'public ': ''}${method.IsStatic ? 'static ': ''}${formatPropertyOrMethodName(method.Name)}(${
                                toJsArray(method.ParameterInfos).map((pinfo, idx)=> parameterDef(pinfo, method.IsStatic, type)).join(', ')
                            })${method.IsConstructor ? "" : " : " + (method.isStatic ? typeNameWithOutGenericType(type, method.TypeName) : method.TypeName)}
                        `).join('\n')}
                    }
                    `
                }
            })() || ''}
            ${(()=> {
                if (type.ExtensionMethods.Length > 0) {
                    return `
                        ${indent(type.Document, 8)}
                        interface ${type.Name} {
${toJsArray(type.ExtensionMethods).map(method=> `

                            ${indent(method.Document, 12)}
                            ${formatPropertyOrMethodName(method.Name)}(${
                                toJsArray(method.ParameterInfos).map((pinfo, idx)=> parameterDef(pinfo)).join(', ')
                            }) : ${method.TypeName};

`).join('\n')}
                        }
                    `
                }
            })() || ''}
            `)
        ).join('\n')}
        ${ns.Name ? '}' : ''}
    `).join('\n')}

}`.trim();
};