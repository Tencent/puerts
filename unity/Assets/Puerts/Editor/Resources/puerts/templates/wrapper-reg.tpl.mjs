/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

/**
 * this template file is write for generating the wrapper register code
 * 
 * @param {GenClass.TypeGenInfo[]} types
 * @returns 
 */
 export default function AutoRegTemplate(types, wrapperInfos) {
    types = toJsArray(types);
    wrapperInfos = toJsArray(wrapperInfos);
    return `using System;

namespace PuertsStaticWrap
{
    public static class AutoStaticCodeRegister
    {
        public static void Register(Puerts.JsEnv jsEnv)
        {
${          
            types.map((type, index)=> {
                const wrapperInfo = wrapperInfos[index]
                return '            ' + 
                `jsEnv.AddLazyStaticWrapLoader(typeof(${getFriendlyName(type)}), ${wrapperInfo.WrapClassName}${wrapperInfo.IsGenericWrapper ? `<${getNativeObjectGenericArgumentsList(type).map(type=> getFriendlyName(type)).join(',')}>` : ''}.GetRegisterInfo);
                ${!wrapperInfo.IsGenericWrapper ? "" : `jsEnv.AddLazyStaticWrapLoaderGenericDefinition(
                    typeof(${getFriendlyName(type)}).GetGenericTypeDefinition(),
                    new Type[]{ ${toJsArray(type.GetGenericArguments()).map(type=> isNativeObjectType(type) ? 'null' : `typeof(${getFriendlyName(type)})`).join(', ')} },
                    typeof(${wrapperInfo.WrapClassName}<${getNativeObjectGenericArgumentsList(type).map(type=> getFriendlyName(type)).join(',')}>).GetGenericTypeDefinition()
                );`}
                ${wrapperInfo.BlittableCopy ? `${wrapperInfo.WrapClassName}.InitBlittableCopy(jsEnv);`: ''}`;
            }).join('\n')
}
        }
    }
}

    `.trim();
};

function toJsArray(csArr) {
    let arr = [];
    for(var i = 0; i < csArr.Length; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}
const CS = require('csharp');
function getNativeObjectGenericArgumentsList(type) {
    return toJsArray(type.GetGenericArguments()).filter(isNativeObjectType);
}
function isNativeObjectType(t) {
    return !t.IsPrimitive && t != puerts.$typeof(CS.System.String) && t != puerts.$typeof(CS.System.DateTime);
}
function getFriendlyName(type) {
    return CS.Puerts.TypeExtensions.GetFriendlyName(type);
}