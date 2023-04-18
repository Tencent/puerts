import { FOR } from './tte.mjs'

export function LinkXMLTemplate(genTypes) {
    return `
<linker>${FOR(getAssemblyInfo(genTypes), assemblyInfo => `
    <assembly fullname="${assemblyInfo.name}">${FOR(assemblyInfo.types, type => `
        <type fullname="${type}" preserve="all"/>`)}
    </assembly>`)}
</linker>`.trim();
}

export function GenericTypePreserverTemplate(genTypes) {
    return `
namespace Puerts
{
    #if ENABLE_IL2CPP
        [UnityEngine.Scripting.Preserve]
    #endif
    public static class GenericTypePreserver_Gen
    {
        #if ENABLE_IL2CPP
            [UnityEngine.Scripting.Preserve]
        #endif
        public static void Preserver()
        {
        ${FOR(listToJsArray(genTypes).filter(item=> item.IsGenericType), item => `
            UnityEngine.Debug.Log(typeof(${item.GetFriendlyName()}));
        `)}
        }
    }
}`.trim();
}

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