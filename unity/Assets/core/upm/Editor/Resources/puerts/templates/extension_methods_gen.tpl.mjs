import { FOR } from './tte.mjs'

export default function TypingTemplate(rawInfo) {
    return `
using System;
namespace PuertsIl2cpp
{
public static class ExtensionMethodInfos_Gen
{
    [UnityEngine.Scripting.Preserve]
    public static void TryLoadExtensionMethod()
    {${FOR(getExtendedTypeToExtensionTypeInfo(rawInfo), e => `${FOR(e.extensionTypes, extensionType => `
        PuertsIl2cpp.ExtensionMethodInfo.Add(typeof(${e.extendedType}), typeof(${extensionType}));
    `)}`)}
    }
}
}`.trim();
}

// if (false) {}${FOR(getExtendedTypeToExtensionTypeInfo(rawInfo), e => `
// else if (type == typeof(${e.extendedType}))
// {${FOR(e.extensionTypes, extensionType => `
//     PuertsIl2cpp.ExtensionMethodInfo.Add(typeof(${e.extendedType}), typeof(${extensionType}));
// `)}
// }

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
        let extendedType = pair.Key.FullName;
        info.set(extendedType, toJsArray(pair.Value).map(x => x.FullName))
    }
    return Array.from(info).map(([extendedType, extensionTypes]) => ({extendedType, extensionTypes}))
}