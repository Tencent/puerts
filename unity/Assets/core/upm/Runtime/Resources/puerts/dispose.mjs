/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
var global = global || globalThis || (function () { return this; }());

export default function resetAllFunctionWhenDisposed() {
    global.puer.disposed = true;
    
    const PuerIsDisposed = function() { throw new Error('puerts has disposed'); }

    puer.loadType = PuerIsDisposed
    puer.getNestedTypes = PuerIsDisposed
    try {
        setToGoodbyeFuncRecursive(CS);
    } catch(e) {}

    function setToGoodbyeFuncRecursive(obj) {
        Object.keys(obj).forEach(key=> {
            if (obj[key] == obj) {
                return; // a member named default is the obj itself which is in the root
            }
            setToGoodbyeFuncRecursive(obj[key])

            if (typeof obj[key] == 'function' && obj[key].prototype) {
                const prototype = obj[key].prototype;
                Object.keys(prototype).forEach((pkey)=> {
                    if (Object.getOwnPropertyDescriptor(prototype, pkey).configurable) {
                        Object.defineProperty(prototype, pkey, {
                            get: PuerIsDisposed,
                            set: PuerIsDisposed,
                        })
                    }
                })
                Object.keys(obj[key]).forEach((skey)=> {
                    if (Object.getOwnPropertyDescriptor(obj[key], skey).configurable) {
                        Object.defineProperty(obj[key], skey, {
                            get: PuerIsDisposed,
                            set: PuerIsDisposed,
                        })
                    }
                })
            }
            if (obj[key] instanceof puer.__$NamespaceType) {
                Object.defineProperty(obj, key, {
                    get: PuerIsDisposed,
                    set: PuerIsDisposed
                })
            }
        });
    }
}