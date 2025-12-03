const CHAR_DOT = 46;
const CHAR_FORWARD_SLASH = 47
const CHAR_BACKWARD_SLASH = 92

function isPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
}

function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
  let res = '';
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code = 0;
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (isPathSeparator(code))
      break;
    else
      code = CHAR_FORWARD_SLASH;

    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 ||
            res.charCodeAt(res.length - 1) !== CHAR_DOT ||
            res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = '';
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength =
                res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length !== 0) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? `${separator}..` : '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += `${separator}${path.slice(lastSlash + 1, i)}`;
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function normalizeAsPosix(path) {
    if (path.length === 0)
        return '.';
    
    const isAbsolute = isPathSeparator(path.charCodeAt(0));
    const trailingSeparator = isPathSeparator(path.charCodeAt(path.length - 1));
    
    // Normalize the path
    path = normalizeString(path, !isAbsolute, '/', isPathSeparator);
    
    if (path.length === 0) {
        if (isAbsolute)
            return '/';
        return trailingSeparator ? './' : '.';
    }
    if (trailingSeparator)
        path += '/';
    
    return isAbsolute ? `/${path}` : path;
}

function joinAsPosix(...args) {
    if (args.length === 0)
        return '.';
    let joined;
    for (let i = 0; i < args.length; ++i) {
        const arg = args[i];
        if (arg.length > 0) {
            if (joined === undefined)
                joined = arg;
            else
                joined += `/${arg}`;
        }
    }
    if (joined === undefined)
        return '.';
    return normalizeAsPosix(joined);
}

const {iterator} = Symbol;

class ModuleCache extends Map {
    #get = (key, [ref, isWeak]) => {
        if (isWeak) {
            const value = ref.deref();
            if (!value) {
                this.delete(key);
            }
            return value;
        } else {
            return ref;
        }
    }
    
    set(key, value, isWeak) {
        //console.log(`set ${key} ${value} ${isWeak}`);
        super.delete(key);
        if (isWeak) {
            const ref = new WeakRef(value);
            return super.set(key, [ref, true]);
        } else {
            return super.set(key, [value, false]);
        }
    }
    
    get(key) {
        const pair = super.get(key);
        return pair && this.#get(key, pair);
    }
    
    has(key) {
        return !!this.get(key);
    }
    
    stat() {
        let res = 'key\tweak?\tvalid?\n';
        for (const [key, [ref, isWeak]] of super[iterator]()) {
            res += `${key}\t${isWeak}\t${ !isWeak || !!ref.deref() }\n`;
        }
        return res;
    }
    
    gc() {
        for (const [key, [ref, isWeak]] of super[iterator]()) {
            if (isWeak && !ref.deref()) {
                this.delete(key);
            }
        }
    }
}

const exportsCache = typeof WeakRef === 'function' ? new ModuleCache() : new Map();
const tmpModuleStorage = new Map();
const builtinModules = new Map([["csharp", CS], ["puer", puer], ["puerts", puer]]);

//console.log(joinAsPosix('a/b/c', '../..'));
//console.log(joinAsPosix('a\\b\\c', '../..'));
//console.log(joinAsPosix('a/b\\c', '../..'));
//console.log(joinAsPosix('a.js'));

function fileURLToPath(url) {
    if (url.startsWith('file:') || url.startsWith('puer:')) {
          return url.substr(5);
    } else {
          return url;
    }
}

function dirname(path) {
    const len = path.length;
    if (len === 0)
        return '';
    let end = -1;
    let matchedSlash = true;
    for (let i = len - 1; i >= 0; --i) {
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            // We saw the first non-path separator
            matchedSlash = false;
        }
    }

    if (end === -1) {
        return '';
    }
    return path.slice(0, end);
}

function executeModule(fullPath, script, debugPath) {
    if (debugPath === undefined) debugPath = fullPath;
    let exports = {};
    let module = tmpModuleStorage.get(fullPath);
    module.exports = exports;
    let wrapped = puer.evalScript(
        // Wrap the script in the same way NodeJS does it. It is important since IDEs (VSCode) will use this wrapper pattern
        // to enable stepping through original source in-place.
        "(function (exports, require, module, __filename, __dirname) { " + script + "\n});", 
        debugPath
    )
    wrapped(exports, createLazyRequire(fullPath), module, debugPath, dirname(debugPath))
    return module.exports;
}

let __default_is_weak = true;

function createLazyRequire(referer) {
    const filename = normalizeAsPosix(fileURLToPath(referer));
    //console.log(`createLazyRequire(${referer}): ${filename}`);
    let requiringDir = dirname(filename);
    //console.log(`requiringDir:${requiringDir}`)
    
    function require(specifier) {
        //console.log(`require(${specifier}) by ${referer}`);
        let fullPath = joinAsPosix(requiringDir, specifier);
        
        let key = fullPath;
        let res = exportsCache.get(key);
        if (res) {
            return res;
        }
        const tmpModule = tmpModuleStorage.get(key);
        if (tmpModule) {
            return tmpModule.exports;
        }
        
        let {content , debugPath} = puer.loadFile(fullPath);
        if (content === null) {
            throw new Error(`load ${fullPath} fail!`);
        }
        
        let module = {"exports":{}};
        tmpModuleStorage.set(fullPath, module);
        try {
            if (fullPath.endsWith(".json")) {
                let packageConfigure = JSON.parse(content);
                
                if (fullPath.endsWith("package.json")) {
                    let url = packageConfigure.main || "index.js";
                    let tmpRequire = createLazyRequire(fullPath);
                    let r = tmpRequire(url);
                    
                    module.exports = r;
                } else {
                    module.exports = packageConfigure;
                }
            } else {
                //console.warn(`executeModule(${fullPath})`)
                executeModule(fullPath, content, debugPath);
            }
            exportsCache.set(key, module.exports, typeof module.exports.__auto_release !== 'boolean' ? __default_is_weak : module.exports.__auto_release );
        } catch(e) {
            exportsCache.delete(key);
            throw e;
        } finally {
            tmpModuleStorage.delete(fullPath);
        }
        return module.exports;
    }
    
    // 理论上比new Proxy会快些
    function proxyTo(obj, target) {
        const descriptors = Object.getOwnPropertyDescriptors(target);

        for (const key in descriptors) {
            if (descriptors.hasOwnProperty(key)) {
                const descriptor = descriptors[key];

                // 优化函数调用，不过副作用是导出的函数或者class的修改不会体现到原来的模块中
                if (typeof descriptor.value === 'function') {
                    obj[key] = descriptor.value.bind(target);
                } else {
                    Object.defineProperty(obj, key, {
                        get: function() {
                            return target[key];
                        },
                        set: function(value) {
                            target[key] = value;
                        },
                        enumerable: descriptor.enumerable, 
                        configurable: descriptor.configurable
                    });
                }
            }
        }
    }
    
    function doRequire(target) {
        let m = require(target.__specifier);
        target.__specifier = undefined;
        Object.setPrototypeOf(target, m); //这可能比getter方式快，但不支持在外部设置导出的字段（ts本身也不支持）
        //Object.setPrototypeOf(target, Object.prototype);
        //proxyTo(target, m);
        return m;
    }

    function lazyRequire(specifier, immediate) {
        if (builtinModules.has(specifier)) {
            return builtinModules.get(specifier);
        }
        if (immediate) {
            //console.warn(`load module [${joinAsPosix(requiringDir, specifier)}] immediate`);
            return require(specifier);
        }
        //console.log(`lazy require(${specifier}) by ${referer}`);
        const res = {__specifier: specifier}
        const proxy = new Proxy(res, {
            get: function(target, name, receiver) {
                if (name === '__esModule') return true;
                //console.log(`proxy for ${name} get`);
                let m = doRequire(target);
                return Reflect.get(m, name, receiver);
            },
            set: function(target, name, value, receiver) {
                //console.log(`proxy for ${name} set`);
                throw new Error(`readonly property ${name}`);
                //let m = doRequire(target);
                //return Reflect.set(m, name, value, receiver);
            }
        });
        Object.setPrototypeOf(res, proxy);
        return res;
    }
    return lazyRequire;
}

function clearModuleCache () {
    exportsCache.clear();
}

function statModuleCache () {
    return exportsCache.stat();
}

function gcModuleCache () {
    return exportsCache.gc();
}

function deleteModuleCache (specifier) {
    return exportsCache.delete(specifier);
}

function hasModuleCache (specifier) {
    return exportsCache.has(specifier);
}

puer.module = {
    createRequire: createLazyRequire,
    clearModuleCache: clearModuleCache,
    statModuleCache: statModuleCache,
    gcModuleCache: gcModuleCache,
    deleteModuleCache: deleteModuleCache,
    hasModuleCache: hasModuleCache
}

export { createLazyRequire as createRequire, clearModuleCache, statModuleCache, gcModuleCache, deleteModuleCache, hasModuleCache};
