import { FOR } from './tte.mjs'

export default function TypingTemplate(genTypes) {
    return `
<linker>${FOR(getAssemblyInfo(genTypes), assemblyInfo => `
    <assembly fullname="${assemblyInfo.name}">${FOR(assemblyInfo.types, type => `
        <type fullname="${type}" preserve="all"/>`)}
    </assembly>`)}
</linker>`.trim();
}

function getAssemblyInfo(genTypes) {
    if (!genTypes) return [];
    let assemblyInfo = new Map()
    for (var i = 0; i < genTypes.Count; i++) {
        let type = genTypes.get_Item(i);
        let assemblyName = type.Assembly.GetName(false).Name;
        !assemblyInfo.has(assemblyName) && assemblyInfo.set(assemblyName, [])
        let types = assemblyInfo.get(assemblyName)
        types.push(type.FullName)
    }
    return Array.from(assemblyInfo).map(([name, types]) => ({name, types}))
}