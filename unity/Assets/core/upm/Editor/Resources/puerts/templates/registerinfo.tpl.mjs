import { FOR } from './tte.mjs'

export default function RegisterInfoTemplate(TypeRegisterInfos, ) {
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
#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP
                BlittableCopy = ${item.BlittableCopy},
#endif
                Members = new System.Collections.Generic.List<MemberRegisterInfo>
                {
                    ${FOR(listToJsArray(item.Members), member=> `
                    new MemberRegisterInfo { Name = "${member.Name}", IsStatic = ${member.IsStatic}, MemberType = MemberType.${member.MemberType}, UseBindingMode = BindingMode.${member.UseBindingMode}
#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP
                    ${referWrapperMember(item.WrapperName, member.Constructor, member.Method, member.PropertyGetter, member.PropertySetter)} },
#endif
                    `)}
                }
            };
        }
        `)}

        public static void AddRegisterInfoGetterIntoJsEnv(JsEnv jsEnv)
        {
            ${FOR(typeRegisterInfos, item => `
            jsEnv.AddRegisterInfoGetter(typeof(${item.Type.GetFriendlyName()}), GetRegisterInfo_${item.WrapperName});
            `)}
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