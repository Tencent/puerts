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

function toJsArray(csArr) {
    let arr = [];
    for(var i = 0; i < csArr.Length; i++) {
        arr.push(csArr.get_Item(i));
    }
    return arr;
}
