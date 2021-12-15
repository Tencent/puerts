function toJsArray(csArr) {
    let arr = [];
    for(var i = 0; i < csArr.Length; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}

module.exports = function AutoRegTemplate(types) {
    types = toJsArray(types);
    return `

namespace PuertsStaticWrap
{
    public static class AutoStaticCodeRegister
    {
        public static void Register(Puerts.JsEnv jsEnv)
        {
${          
            types.map(type=> {
                return '            ' + 
                `jsEnv.AddLazyStaticWrapLoader(typeof(${type.Name}), ${type.WrapClassName}.GetRegisterInfo);
                ${type.BlittableCopy ? `${type.WrapClassName}.InitBlittableCopy(jsEnv);`: ''}`;
            }).join('\n')
}
        }
    }
}

    `.trim();
};