/*
import * as Reconciler from 'react-reconciler'
import * as tgamejs from 'tgamejs'
import * as UE from 'ue'

let UIManager: UE.UMGManager;
let asyncUIManager:tgamejs.AsyncObject<UE.UMGManager>;

function deepEquals(x: any, y: any) {
    if ( x === y ) return true;

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;

    for (var p in x) { // all x[p] in y
        if (p == 'children' || p == 'Slot') continue;
        if (!deepEquals(x[p], y[p])) return false;
    }

    for (var p in y) {
        if (p == 'children' || p == 'Slot') continue;
        if (!x.hasOwnProperty(p)) return false;
    }

    return true;
}

declare const exports: {lazyloadComponents:{}}

class UEWidget {
    type: string;
    callbackRemovers: {[key: string] : () => void};
    nativePtr: Promise<tgamejs.AsyncObject<UE.Widget>>;
    slot: any;
    nativeSlotPtr: UE.PanelSlot;

    constructor (type: string, props: any) {
        this.type = type;
        this.callbackRemovers = {};
        
        this.init(type, props).catch(e => {
            console.error("create " + type + ", e:" + e.message);
        });
    }

    async init(type: string, props: any) {
        let classPath = exports.lazyloadComponents[type];
        if (classPath) {
            this.nativePtr = asyncUIManager.CreateComponentByClassPathName(classPath);
        } else {
            this.nativePtr = asyncUIManager.CreateComponent(UE[type].StaticClass());
        }
        let nativePtr = await this.nativePtr;
        let myProps = {};
        for (const key in props) {
            let val = props[key];
            if (key == 'Slot') {
                this.slot = val;
            } else if (typeof val === 'function') {
                this.bind(key, val);
            } else if(key !== 'children') {
                myProps[key] = val;
            }
        }
        //console.log("UEWidget", type, JSON.stringify(myProps))
        await tgamejs.setPropertiesAsync(nativePtr, myProps);
        //console.log(type + ' inited')
    }
  
    async bind(name: string, callback: Function) {
        let nativePtr = await this.nativePtr
        let prop = nativePtr[name];
        if (typeof prop.Add === 'function') {
            let callbackId = prop.Add(callback);
            this.callbackRemovers[name] = () => {
                prop.Remove(callbackId);
            }
        } else if (typeof prop.Bind == 'function') {
            prop.Bind(callback);
            this.callbackRemovers[name] = () => {
                prop.Unbind();
            }
        } else {
            console.warn("unsupport callback " + name);
        }
    }
  
    async update(oldProps: any, newProps: any) {
        let myProps = {};
        let propChange = false;
        for(var key in newProps) {
            let oldProp = oldProps[key];
            let newProp = newProps[key];
            if (key != 'children' && oldProp != newProp) {
                if (key == 'Slot') {
                    this.slot = newProp;
                    //console.log("update slot..", this.toJSON());
                    tgamejs.setPropertiesAsync(this.nativeSlotPtr, newProp);
                    asyncUIManager.SynchronizeSlotProperties(this.nativeSlotPtr)
                } else if (typeof newProp === 'function') {
                    this.unbind(key);
                    this.bind(key, newProp);
                } else {
                    myProps[key] = newProp;
                    propChange = true;
                }
            }
        }
        if (propChange) {
            //console.log("update props", this.toJSON(), JSON.stringify(myProps));
            let nativePtr = await this.nativePtr
            tgamejs.setPropertiesAsync(nativePtr, myProps);
            asyncUIManager.SynchronizeWidgetProperties(nativePtr)
        }
    }
  
    unbind(name: string) {
        let remover = this.callbackRemovers[name];
        this.callbackRemovers[name] = undefined;
        if (remover) {
            remover();
        }
    }
    
    unbindAll() {
        for(var key in this.callbackRemovers) {
            this.callbackRemovers[key]();
        }
        this.callbackRemovers = {};
    }
  
    async appendChild(child: UEWidget) {
        let nativeSlot = await ((await this.nativePtr) as tgamejs.AsyncObject<UE.PanelWidget>).AddChild(await child.nativePtr);
        //console.log("appendChild", (await this.nativePtr).toJSON(), (await child.nativePtr).toJSON());
        child.nativeSlot = nativeSlot;
    }
    
    async removeChild(child: UEWidget) {
        child.unbindAll();
        await ((await this.nativePtr) as tgamejs.AsyncObject<UE.PanelWidget>).RemoveChild(await child.nativePtr);
        //console.log("removeChild", (await this.nativePtr).toJSON(), (await child.nativePtr).toJSON())
    }
  
    set nativeSlot(value: UE.PanelSlot) {
        this.nativeSlotPtr = value;
        //console.log('setting nativeSlot', value.toJSON());
        if (this.slot) {
            tgamejs.setPropertiesAsync(this.nativeSlotPtr, this.slot);
            asyncUIManager.SynchronizeSlotProperties(this.nativeSlotPtr);
        }
    }

    async toJSON() {
        return JSON.stringify(await this.nativePtr);
    }
}

class UEWidgetRoot {
    nativePtrAsync: tgamejs.AsyncObject<UE.ReactWidget>;
    nativePtr: UE.ReactWidget;
    Added: boolean;

    constructor(nativePtr: UE.ReactWidget) {
        this.nativePtr = nativePtr;
        this.nativePtrAsync = tgamejs.$async(nativePtr);
    }
  
    async appendChild(child: UEWidget) {
        let nativeSlot = await this.nativePtrAsync.AddChild(await child.nativePtr);
        child.nativeSlot = nativeSlot;
    }

    async removeChild(child: UEWidget) {
        child.unbindAll();
        await this.nativePtrAsync.RemoveChild(await child.nativePtr);
    }
  
    addToViewport(z : number) {
        if (!this.Added) {
            this.nativePtr.AddToViewport(z);
            this.Added = true;
        }
    }
    
    removeFromViewport() {
        this.nativePtr.RemoveFromViewport();
    }
    
    getWidget() {
        return this.nativePtr;
    }
}

const hostConfig : Reconciler.HostConfig<string, any, UEWidgetRoot, UEWidget, UEWidget, any, any, {}, any, any, any, any> = {
    getRootHostContext () {
        return {};
    },
    //CanvasPanel()的parentHostContext是getRootHostContext返回的值
    getChildHostContext (parentHostContext: {}) {
        return parentHostContext;//no use, share one
    },
    appendInitialChild (parent: UEWidget, child: UEWidget) {
        parent.appendChild(child).catch(e => {
            console.error('appendInitialChild , e:' + e.message);
        });
    },
    appendChildToContainer (container: UEWidgetRoot, child: UEWidget) {
        container.appendChild(child);
    },
    appendChild (parent: UEWidget, child: UEWidget) {
        parent.appendChild(child).catch(e => {
            console.error('appendChild , e:' + e.message);
        });
    },
    createInstance (type: string, props: any) {
        return new UEWidget(type, props);
    },
    createTextInstance (text: string) {
        return new UEWidget("TextBlock", {Text: text});
    },
    finalizeInitialChildren () {
        return false
    },
    getPublicInstance (instance: UEWidget) {
        console.warn('getPublicInstance');
        return instance
    },
    now: Date.now,
    prepareForCommit () {
        //log('prepareForCommit');
    },
    resetAfterCommit (container: UEWidgetRoot) {
        function flush() {
            try {
                let n = tgamejs.flushAsyncCall();
                if (n == 0) {
                    container.addToViewport(0);
                    UIManager.ClearRetaining();
                } else {
                    //console.warn('batch call num:' + n);
                    setTimeout(flush, 1);
                }
            } catch(e) {
                console.error(e.message);
            }
        }
        //即使是已经resolve的Promise，then也是在nextTick执行
        setTimeout(flush, 1);
    },
    resetTextContent () {
        console.error('resetTextContent not implemented!');
    },
    shouldSetTextContent (type, props) {
        return false
    },
  
    commitTextUpdate (textInstance: UEWidget, oldText: string, newText: string) {
        if (oldText != newText) {
            textInstance.update({}, {Text: newText})
        }
    },
  
    //return false表示不更新，真值将会出现到commitUpdate的updatePayload里头
    prepareUpdate (instance: UEWidget, type: string, oldProps: any, newProps: any) {
        try{
            return !deepEquals(oldProps, newProps);
        } catch(e) {
            console.error(e.message);
            return true;
        }
    },
    commitUpdate (instance: UEWidget, updatePayload: any, type : string, oldProps : any, newProps: any) {
        instance.update(oldProps, newProps).catch(e => {
            console.error('commitUpdate , e:' + e.message);
        });
    },
    removeChildFromContainer (container: UEWidgetRoot, child: UEWidget) {
        console.error('removeChildFromContainer');
        //container.removeChild(child).catch(e => {
        //    console.error('removeChildFromContainer , e:' + e.message);
        //});
    },
    removeChild(parent: UEWidget, child: UEWidget) {
        parent.removeChild(child).catch(e => {
            console.error('removeChild , e:' + e.message);
        });
    },

    //useSyncScheduling: true,
    supportsMutation: true,
    isPrimaryRenderer: true,
    supportsPersistence: false,
    supportsHydration: false,

    shouldDeprioritizeSubtree: undefined,
    setTimeout: undefined,
    clearTimeout: undefined,
    cancelDeferredCallback: undefined,
    noTimeout: undefined,
    scheduleDeferredCallback: undefined,
}

const reconciler = Reconciler(hostConfig)

export const ReactUMG = {
    render: function(reactElement: React.ReactNode) {
        if (UIManager == undefined) {
            throw new Error("init with UIManager first!");
        }
        let root = new UEWidgetRoot(UIManager.CreateRoot());
        const container = reconciler.createContainer(root, false, false);
        reconciler.updateContainer(reactElement, container, null, null);
        return root;
    },
    init: function(uiManager: UE.UMGManager) {
        UIManager = uiManager;
        asyncUIManager = tgamejs.$async(UIManager)
    }
}
*/
