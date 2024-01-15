import { OnFinalize, PuertsJSEngine, global } from "../library";

/**
 * mixin
 * 注册类API，如注册全局函数、注册类，以及类的属性方法等
 * 
 * @param engine 
 * @returns 
 */
export default function WebGLBackendRegisterAPI(engine: PuertsJSEngine) {
    const returnee = {
        SetGlobalFunction: function (isolate: IntPtr, nameString: CSString, v8FunctionCallback: IntPtr, jsEnvIdx: number, callbackidx: number) {
            const name = engine.unityApi.UTF8ToString(nameString);
            global[name] = engine.makeCSharpFunctionCallbackFunction(true, v8FunctionCallback, callbackidx);
        },
        _RegisterClass: function (isolate: IntPtr, BaseTypeId: int, fullNameString: CSString, constructor: IntPtr, destructor: IntPtr, jsEnvIdx: number, callbackidx: number, size: number) {
            const fullName = engine.unityApi.UTF8ToString(fullNameString);
            const csharpObjectMap = engine.csharpObjectMap;
            const id = csharpObjectMap.classes.length;

            let tempExternalCSID: CSIdentifier = 0;
            const ctor = function NativeObject() {
                // 设置类型ID
                this["$cid"] = id;
                // nativeObject的构造函数
                // 构造函数有两个调用的地方：1. js侧new一个它的时候 2. cs侧创建了一个对象要传到js侧时
                // 第一个情况，cs对象ID或者是callV8ConstructorCallback返回的。
                // 第二个情况，则cs对象ID是cs new完之后一并传给js的。

                let csID = tempExternalCSID; // 如果是第二个情况，此ID由createFromCS设置
                tempExternalCSID = 0;
                if (csID === 0) {
                    const args = Array.prototype.slice.call(arguments, 0);
                    const callbackInfoPtr = engine.functionCallbackInfoPtrManager.GetMockPointer(args);
                    // 虽然puerts内Constructor的返回值叫self，但它其实就是CS对象的一个id而已。
                    try {
                        csID = engine.callCSharpConstructorCallback(constructor, callbackInfoPtr, args.length, callbackidx);
                    } catch(e) {
                        engine.functionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
                        throw e;
                    }
                    engine.functionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
                }
                // blittable
                if (size) {
                    let csNewID = engine.unityApi._malloc(size);
                    engine.memcpy(csNewID, csID, size);
                    csharpObjectMap.add(csNewID, this);
                    OnFinalize(this, csNewID, (csIdentifier) => {
                        csharpObjectMap.remove(csIdentifier);
                        engine.unityApi._free(csIdentifier);
                    })
                } else {
                    csharpObjectMap.add(csID, this);
                    OnFinalize(this, csID, (csIdentifier) => {
                        csharpObjectMap.remove(csIdentifier);
                        engine.callCSharpDestructorCallback(destructor || engine.generalDestructor, csIdentifier, callbackidx);
                    })
                }
            }
            ctor.createFromCS = function (csID: CSIdentifier) {
                tempExternalCSID = csID;
                return new (ctor as any)();
            };
            ctor.__puertsMetadata = new Map();
            Object.defineProperty(ctor, "name", { value: fullName + "Constructor" });
            Object.defineProperty(ctor, "$cid", { value: id });
            csharpObjectMap.classes.push(ctor);
            csharpObjectMap.classIDWeakMap.set(ctor, id);

            if (BaseTypeId > 0) {
                ctor.prototype.__proto__ = csharpObjectMap.classes[BaseTypeId].prototype
            }
            csharpObjectMap.namesToClassesID[fullName] = id;

            return id;
        },
        RegisterStruct: function (isolate: IntPtr, BaseTypeId: int, fullNameString: CSString, constructor: IntPtr, destructor: IntPtr, /*long */jsEnvIdx: number, callbackidx: number, size: int) {
            return returnee._RegisterClass(isolate, BaseTypeId, fullNameString, constructor, destructor, callbackidx, callbackidx, size);
        },
        RegisterFunction: function (isolate: IntPtr, classID: int, nameString: CSString, isStatic: bool, callback: IntPtr, /*long */jsEnvIdx: number, callbackidx: number) {
            var cls = engine.csharpObjectMap.classes[classID]
            if (!cls) {
                return false;
            }

            var fn = engine.makeCSharpFunctionCallbackFunction(isStatic, callback, callbackidx)
            const name = engine.unityApi.UTF8ToString(nameString);
            if (isStatic) {
                cls[name] = fn
            } else {
                cls.prototype[name] = fn
            }
        },
        RegisterProperty: function (
            isolate: IntPtr,
            classID: int,
            nameString: CSString,
            isStatic: bool,
            getter: IntPtr,
            /*long */getterjsEnvIdx: number,
            /*long */gettercallbackidx: number,
            setter: IntPtr,
            /*long */setterjsEnvIdx: number,
            /*long */settercallbackidx: number,
            dontDelete: bool
        ) {
            var cls = engine.csharpObjectMap.classes[classID]
            if (!cls) {
                return false;
            }
            const name = engine.unityApi.UTF8ToString(nameString);

            var attr: PropertyDescriptor = {
                configurable: !dontDelete,
                enumerable: false
            };
            attr.get = engine.makeCSharpFunctionCallbackFunction(isStatic, getter, gettercallbackidx);
            if (setter) {
                attr.set = engine.makeCSharpFunctionCallbackFunction(isStatic, setter, settercallbackidx);
            }

            if (isStatic) {
                Object.defineProperty(cls, name, attr)
            } else {
                Object.defineProperty(cls.prototype, name, attr)
            }
        },
    }

    return returnee;
}