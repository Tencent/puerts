/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR } from './tte.mjs'

export default function RegisterInfoTemplate(TypeRegisterInfos) {
    const typeRegisterInfos = listToJsArray(TypeRegisterInfos);

    return `
using Puerts.TypeMapping;
using Puerts;

namespace PuertsStaticWrap
{
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public static class PuerRegisterInfo_Gen
    {
        ${FOR(typeRegisterInfos, item => `
        public static RegisterInfo GetRegisterInfo_${item.WrapperName}() 
        {
            return new RegisterInfo 
            {
#if !EXPERIMENTAL_IL2CPP_PUERTS
                BlittableCopy = ${item.BlittableCopy},
#endif

                Members = new System.Collections.Generic.Dictionary<string, MemberRegisterInfo>
                {
                    ${FOR(listToJsArray(item.Members), member=> `
                    {"${member.Name}${member.IsStatic ? '_static' : ''}", new MemberRegisterInfo { Name = "${member.Name}", IsStatic = ${member.IsStatic}, MemberType = MemberType.${member.MemberType}, UseBindingMode = BindingMode.${member.UseBindingMode}
#if !EXPERIMENTAL_IL2CPP_PUERTS
                    ${member.UseBindingMode == 'FastBinding' ? referWrapperMember(item.WrapperName, member.Constructor, member.Method, member.PropertyGetter, member.PropertySetter) : ''}
#endif
                    }},
                    `)}
                }
            };
        }
        `)}

        public static void AddRegisterInfoGetterIntoJsEnv(JsEnv jsEnv)
        {
            ${FOR(typeRegisterInfos, item => {
                let ret = `
                jsEnv.AddRegisterInfoGetter(typeof(${CS.Puerts.TypeExtensions.GetFriendlyName(item.Type)}), GetRegisterInfo_${item.WrapperName});`
                if (item.BlittableCopy) {
                    ret += `
#if !EXPERIMENTAL_IL2CPP_PUERTS
                ${item.BlittableCopy ? item.WrapperName + ".InitBlittableCopy(jsEnv);": ""}                    
#endif`
                }
                return ret;
            })}
        }
    }
}`.trim();
}

function listToJsArray(csArr) {
    let arr = [];
    if (!csArr) return arr;
    for (var i = 0; i < csArr.Count; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}

function referWrapperMember(wrapperName, contstructorName, methodName, propertyGetterName, propertySetterName) {
    const ret = []
    if (contstructorName) ret.push(`Constructor = ${wrapperName}.${contstructorName}`)
    if (methodName) ret.push(`Method = ${wrapperName}.${methodName}`)
    if (propertyGetterName) ret.push(`PropertyGetter = ${wrapperName}.${propertyGetterName}`)
    if (propertySetterName) ret.push(`PropertySetter = ${wrapperName}.${propertySetterName}`)
    return ret.length == 0 ? '' : ', ' + ret.join(', ')
}