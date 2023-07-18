/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR } from './tte.mjs'

export default function TypingTemplate(rawInfo) {
    return `
#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP
using System;
using System.Collections.Generic;
using System.Reflection;
namespace PuertsIl2cpp
{
public static class ExtensionMethodInfos_Gen
{
    [UnityEngine.Scripting.Preserve]
    public static IEnumerable<MethodInfo> TryLoadExtensionMethod(Type type)
    {
        if (false) {}${FOR(getExtendedTypeToExtensionTypeInfo(rawInfo), e => `
        else if (type == typeof(${e.extendedType}))
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(${e.extendedType})${FOR(e.extensionTypes, extensionType => `, typeof(${extensionType})`)});
        }`)}
        return null;
    }
}
}
#endif`.trim();
}



function toJsArray(csArr) {
    if (!csArr) return [];
    let arr = [];
    for (var i = 0; i < csArr.Count; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}

// List<KeyValuePair<Type, List<Type>>> extendedType2extensionType
function getExtendedTypeToExtensionTypeInfo(rawInfo) {
    if (!rawInfo) return [];
    let info = new Map()
    for (var i = 0; i < rawInfo.Count; i++) {
        let pair = rawInfo.get_Item(i)
        let extendedType = CS.Puerts.TypeExtensions.GetFriendlyName(pair.Key);
        info.set(extendedType, toJsArray(pair.Value).map(x => CS.Puerts.TypeExtensions.GetFriendlyName(x)))
    }
    return Array.from(info).map(([extendedType, extensionTypes]) => ({extendedType, extensionTypes}))
}