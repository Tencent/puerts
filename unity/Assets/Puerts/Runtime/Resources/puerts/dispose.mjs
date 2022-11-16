var global = global || globalThis || (function () { return this; }());

export default function resetAllFunctionWhenDisposed() {
    global.puerts.disposed = true;
    
    const PuerIsDisposed = function() { throw new Error('puerts has disposed'); }

    puerts.loadType = PuerIsDisposed
    puerts.getNestedTypes = PuerIsDisposed
    try {
        setToGoodbyeFuncRecursive(require('csharp'));
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
            if (obj[key] instanceof puerts.__$NamespaceType) {
                Object.defineProperty(obj, key, {
                    get: PuerIsDisposed,
                    set: PuerIsDisposed
                })
            }
        });
    }
}