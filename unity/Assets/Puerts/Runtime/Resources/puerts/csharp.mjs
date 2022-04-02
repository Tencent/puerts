/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

var global = global || globalThis || (function () { return this; }());


function csTypeToClass(csType) {
    let cls = puerts.loadType(csType);
    
    if (cls) {
        let currentCls = cls, parentPrototype = Object.getPrototypeOf(currentCls.prototype);

        // 此处parentPrototype如果是一个泛型，会丢失父父的继承信息，必须循环找下去
        while (parentPrototype) {
            Object.setPrototypeOf(currentCls, parentPrototype.constructor);//v8 api的inherit并不能把静态属性也继承，通过这种方式修复下
            currentCls.__static_inherit__ = true;

            currentCls = parentPrototype.constructor;
            parentPrototype = Object.getPrototypeOf(currentCls.prototype);
            if (currentCls === Object || currentCls === Function || currentCls.__static_inherit__) break;
        }

        for(var key in cls) {
            let desc = Object.getOwnPropertyDescriptor(cls, key);
            if (desc && desc.configurable && (typeof desc.get) == 'function' && (typeof desc.value) == 'undefined') {
                let val = cls[key];
                Object.defineProperty(cls, key, {
                    value: val,
                    writable: false,
                    configurable: false
                });
                if (cls.__p_isEnum && (typeof val) == 'number') {
                    cls[val] = key;
                }
            }
        }

        let nestedTypes = puerts.getNestedTypes(csType);
        if (nestedTypes) {
            for(var i = 0; i < nestedTypes.Length; i++) {
                let ntype = nestedTypes.get_Item(i);
                cls[ntype.Name] = csTypeToClass(ntype);
            }
        }
    }
    return cls;
}

function Namespace() {}
function createTypeProxy(namespace) {
    return new Proxy(new Namespace, {
        get: function(cache, name) {
            if (!(name in cache)) {
                let fullName = namespace ? (namespace + '.' + name) : name;
                if (/\$\d+$/.test(name)) {
                    let genericTypeInfo = new Map();
                    genericTypeInfo.set('$name', fullName.replace('$', '`'));
                    cache[name] = genericTypeInfo;
                } else {
                    let cls = csTypeToClass(fullName);
                    if (cls) {
                        cache[name] = cls;
                    } else {
                        cache[name] = createTypeProxy(fullName);
                        //console.log(fullName + ' is a namespace');
                    }
                }
            }
            return cache[name];
        }
    });
}

let csharpModule = createTypeProxy(undefined);
csharpModule.default = csharpModule;
puerts.registerBuildinModule('csharp', csharpModule);

csharpModule.System.Object.prototype.toString = csharpModule.System.Object.prototype.ToString;

function ref(x) {
    return {value:x};
}

function unref(r) {
    return r.value;
}

function setref(x, val) {
    x.value = val;
}

function taskToPromise(task) {
    return new Promise((resolve, reject) => {
        task.GetAwaiter().OnCompleted(() => {
            let t = task;
            task = undefined;
            if (t.IsFaulted) {
                if (t.Exception) {
                    if (t.Exception.InnerException) {
                        reject(t.Exception.InnerException.Message);
                    } else {
                        reject(t.Exception.Message);
                    }
                } else {
                    reject("unknow exception!");
                }
            } else {
                resolve(t.Result);
            }
        });
    });
}

function makeGeneric(genericTypeInfo, ...genericArgs) {
    let p = genericTypeInfo;
    for (var i = 0; i < genericArgs.length; i++) {
        let genericArg = genericArgs[i];
        if (!p.get(genericArg)) {
            p.set(genericArg, new Map());
        }
        p = p.get(genericArg);
    }
    if (!p.get('$type')) {
        p.set('$type', puerts.loadType(genericTypeInfo.get('$name'), ...genericArgs));
    }
    return p.get('$type');
}

function getType(cls) {
    return cls.__p_innerType;
}

function bindThisToFirstArgument(func, parentFunc) {
    if (parentFunc) {
        return function (...args) {
            try {
                return func.apply(null, [this, ...args]);
            } catch {
                return parentFunc.call(this, ...args);
            };
        }
    }
    return function(...args) {
        return func.apply(null, [this, ...args]);
    }
}

function doExtension(cls, extension) {
    // if you already generate static wrap for cls and extension, then you are no need to invoke this function
    // 如果你已经为extension和cls生成静态wrap，则不需要调用这个函数。
    var parentPrototype = Object.getPrototypeOf(cls.prototype);
    Object.keys(extension).forEach(key=> {
        var func = extension[key];
        if (typeof func == 'function' && key != 'constructor' && !(key in cls.prototype)) {
    var parentFunc = parentPrototype ? parentPrototype[key] : undefined;
            parentFunc = typeof parentFunc === "function" ? parentFunc : undefined;
            Object.defineProperty(cls.prototype, key, {
                value: bindThisToFirstArgument(func, parentFunc),
                writable: false,
                configurable: false
            });
        }
    })
}

puerts.$ref = ref;
puerts.$unref = unref;
puerts.$set = setref;
puerts.$promise = taskToPromise;
puerts.$generic = makeGeneric;
puerts.$typeof = getType;
puerts.$extension = (cls, extension) => { 
    typeof console != 'undefined' && console.warn(`deprecated! if you already generate static wrap for ${cls} and ${extension}, you are no need to invoke $extension`); 
    return doExtension(cls, extension)
};
puerts.$reflectExtension = doExtension;
