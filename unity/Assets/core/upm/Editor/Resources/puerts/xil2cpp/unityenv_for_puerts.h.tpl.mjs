import * as il2cpp_snippets from "../templates/il2cpp_snippets.mjs"

export default function unityenv_for_puerts(definesList) {
    var defines = il2cpp_snippets.listToJsArray(definesList);
    return defines.map(d => `#ifndef ${d}
    #define ${d}
#endif`).join('\n');

}