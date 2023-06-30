/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

var global = global || globalThis || (function () { return this; }());


function csTypeToClass(csType) {
    let cls = puer.loadType(csType);
    
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

        let readonlyStaticMembers;
        if (readonlyStaticMembers = cls.__puertsMetadata.get('readonlyStaticMembers')) {
            for (var key in cls) {
                let desc = Object.getOwnPropertyDescriptor(cls, key);
                if (readonlyStaticMembers.has(key) && desc && (typeof desc.get) == 'function' && (typeof desc.value) == 'undefined') {
                    let getter = desc.get;
                    let value;
                    let valueGetted = false;
    
                    Object.defineProperty(
                        cls, key, 
                        Object.assign(desc, {
                            get() {
                                if (!valueGetted) {
                                    value = getter();
                                    valueGetted = true;
                                }
                                
                                return value;
                            },
                            configurable: false
                        })
                    );
                    if (cls.__p_isEnum) {
                        const val = cls[key];
                        if ((typeof val) == 'number') {
                            cls[val] = key;
                        }
                    }
                }
            }
        }

        let nestedTypes = puer.getNestedTypes(csType);
        if (nestedTypes) {
            for(var i = 0; i < nestedTypes.Length; i++) {
                let ntype = nestedTypes.get_Item(i);
                if (ntype.IsGenericType) {
                    let name = ntype.Name.split('`')[0] + '$' + ntype.GetGenericArguments().Length;
                    let fullName = ntype.FullName.split('`')[0]/**.replace(/\+/g, '.') */ + '$' + ntype.GetGenericArguments().Length;
                    let genericTypeInfo = cls[name] = new Map();
                    genericTypeInfo.set('$name', fullName.replace('$', '`'));
                } else {
                    cls[ntype.Name] = csTypeToClass(ntype);
                }
            }
        }
    }
    return cls;
}

function Namespace() {}
puer.__$NamespaceType = Namespace;

function createTypeProxy(namespace) {
    return new Proxy(new Namespace, {
        get: function(cache, name) {
            if (name == '__p_innerType') return void 0;
            if (!(name in cache)) {
                let fullName = namespace ? (namespace + '.' + name) : name;
                if (/\$\d+$/.test(name)) {
                    let genericTypeInfo = cache[name] = new Map();
                    genericTypeInfo.set('$name', fullName.replace('$', '`'));

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
global.CS = csharpModule;

csharpModule.System.Object.prototype.toString = csharpModule.System.Object.prototype.ToString;

function ref(x) {
    return [x];
}

function unref(r) {
    return r[0];
}

function setref(x, val) {
    x[0] = val;
}

function taskToPromise(task) {
    return new Promise((resolve, reject) => {
        task.GetAwaiter().UnsafeOnCompleted(() => {
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
function genIterator(obj) {
    let it = obj.GetEnumerator();
    return {
        next() {
            if (it.MoveNext())
            {
                return {value: it.Current, done: false}
            }
            it.Dispose();
            return {value: null, done: true}
        }
    };
}

function makeGeneric(genericTypeInfo, ...genericArgs) {
    let p = genericTypeInfo;
    for (var i = 0; i < genericArgs.length; i++) {
        let genericArg = genericArgs[i];
        if (!p.has(genericArg)) {
            p.set(genericArg, new Map());
        }
        p = p.get(genericArg);
    }
    if (!p.has('$type')) {

        let typName = genericTypeInfo.get('$name')
        let typ = puer.loadType(typName, ...genericArgs)
        if (getType(csharpModule.System.Collections.IEnumerable).IsAssignableFrom(getType(typ))) {
            typ.prototype[Symbol.iterator] = function () {
                return genIterator(this);
            }
        }
        p.set('$type', typ);
    }
    return p.get('$type');
}

function makeGenericMethod(cls, methodName, ...genericArgs) {
    if (cls && typeof methodName == 'string' && genericArgs && genericArgs.length > 0) {
        return puer.getGenericMethod(puer.$typeof(cls), methodName, ...genericArgs);
        
    } else {
        throw new Error("invalid arguments for makeGenericMethod");
    }
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

puer.$ref = ref;
puer.$unref = unref;
puer.$set = setref;
puer.$promise = taskToPromise;
puer.$generic = makeGeneric;
puer.$genericMethod = makeGenericMethod;
puer.$typeof = getType;
puer.$extension = (cls, extension) => { 
    typeof console != 'undefined' && console.warn(`deprecated! if you already generate static wrap for ${cls} and ${extension}, you are no need to invoke $extension`); 
    return doExtension(cls, extension)
};
