/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
import { FOR } from './tte.mjs'

export function LinkXMLTemplate(genTypes) {
    return `
<linker>${FOR(getAssemblyInfo(genTypes), assemblyInfo => `
    <assembly fullname="${assemblyInfo.name}">${FOR(assemblyInfo.types, type => `
        <type fullname="${type}" preserve="all"/>`)}
    </assembly>`)}
</linker>`.trim();
}

// export function GenericTypePreserverTemplate(genTypes) {
//     return `
// namespace Puerts
// {
//     #if ENABLE_IL2CPP
//         [UnityEngine.Scripting.Preserve]
//     #endif
//     public static class GenericTypePreserver_Gen
//     {
//         #if ENABLE_IL2CPP
//             [UnityEngine.Scripting.Preserve]
//         #endif
//         public static void Preserver()
//         {
//         ${FOR(listToJsArray(genTypes).filter(item=> item.IsGenericType), item => `
//             UnityEngine.Debug.Log(typeof(${item.GetFriendlyName()}));
//         `)}
//         }
//     }
// }`.trim();
// }

function getAssemblyInfo(genTypes) {
    if (!genTypes) return [];
    let assemblyInfo = new Map()
    for (var i = 0; i < genTypes.Count; i++) {
        let type = genTypes.get_Item(i);
        let assemblyName = type.Assembly.GetName(false).Name;
        !assemblyInfo.has(assemblyName) && assemblyInfo.set(assemblyName, [])
        let types = assemblyInfo.get(assemblyName)

        if (type.IsGenericType) {
            types.push(type.FullName.split('[')[0])
        } else if (type.IsNested) {
            types.push(type.FullName.replace('+', '/'))
        } else {
            types.push(type.FullName)
        }
    }
    return Array.from(assemblyInfo).map(([name, types]) => ({name, types}))
}
function listToJsArray(csArr) {
    let arr = [];
    if (!csArr) return arr;
    for (var i = 0; i < csArr.Count; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}