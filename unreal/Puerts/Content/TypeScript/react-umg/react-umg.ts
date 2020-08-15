/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

import * as Reconciler from 'react-reconciler'
import * as puerts from 'puerts'
import * as UE from 'ue'

let world: UE.World;

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
    nativePtr: UE.Widget;
    slot: any;
    nativeSlotPtr: UE.PanelSlot;

    constructor (type: string, props: any) {
        this.type = type;
        this.callbackRemovers = {};
        
        try {
            this.init(type, props);
        } catch(e) {
            console.error("create " + type + " throw " + e);
        }
    }

    init(type: string, props: any) {
        let classPath = exports.lazyloadComponents[type];
        if (classPath) {
            //this.nativePtr = asyncUIManager.CreateComponentByClassPathName(classPath);
            this.nativePtr = UE.NewObject(UE.Class.Load(classPath)) as UE.Widget;
        } else {
            this.nativePtr = new UE[type]();
        }

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
        puerts.merge(this.nativePtr, myProps);
        //console.log(type + ' inited')
    }
  
    bind(name: string, callback: Function) {
        let nativePtr = this.nativePtr
        let prop = nativePtr[name];
        if (typeof prop.Add === 'function') {
            prop.Add(callback);
            this.callbackRemovers[name] = () => {
                prop.Remove(callback);
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
  
    update(oldProps: any, newProps: any) {
        let myProps = {};
        let propChange = false;
        for(var key in newProps) {
            let oldProp = oldProps[key];
            let newProp = newProps[key];
            if (key != 'children' && oldProp != newProp) {
                if (key == 'Slot') {
                    this.slot = newProp;
                    //console.log("update slot..", this.toJSON());
                    puerts.merge(this.nativeSlotPtr, newProp);
                    UE.UMGManager.SynchronizeSlotProperties(this.nativeSlotPtr)
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
            puerts.merge(this.nativePtr, myProps);
            UE.UMGManager.SynchronizeWidgetProperties(this.nativePtr)
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
  
    appendChild(child: UEWidget) {
        let nativeSlot = (this.nativePtr as UE.PanelWidget).AddChild(child.nativePtr);
        //console.log("appendChild", (await this.nativePtr).toJSON(), (await child.nativePtr).toJSON());
        child.nativeSlot = nativeSlot;
    }
    
    removeChild(child: UEWidget) {
        child.unbindAll();
        (this.nativePtr as UE.PanelWidget).RemoveChild(child.nativePtr);
        //console.log("removeChild", (await this.nativePtr).toJSON(), (await child.nativePtr).toJSON())
    }
  
    set nativeSlot(value: UE.PanelSlot) {
        this.nativeSlotPtr = value;
        //console.log('setting nativeSlot', value.toJSON());
        if (this.slot) {
            puerts.merge(this.nativeSlotPtr, this.slot);
            UE.UMGManager.SynchronizeSlotProperties(this.nativeSlotPtr);
        }
    }
}

class UEWidgetRoot {
    nativePtr: UE.ReactWidget;
    Added: boolean;

    constructor(nativePtr: UE.ReactWidget) {
        this.nativePtr = nativePtr;
    }
  
    appendChild(child: UEWidget) {
        let nativeSlot = this.nativePtr.AddChild(child.nativePtr);
        child.nativeSlot = nativeSlot;
    }

    removeChild(child: UEWidget) {
        child.unbindAll();
        this.nativePtr.RemoveChild(child.nativePtr);
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
        parent.appendChild(child);
    },
    appendChildToContainer (container: UEWidgetRoot, child: UEWidget) {
        container.appendChild(child);
    },
    appendChild (parent: UEWidget, child: UEWidget) {
        parent.appendChild(child);
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
        container.addToViewport(0);
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
        try{
            instance.update(oldProps, newProps);
        } catch(e) {
            console.error("commitUpdate fail!, " + e);
        }
    },
    removeChildFromContainer (container: UEWidgetRoot, child: UEWidget) {
        console.error('removeChildFromContainer');
        //container.removeChild(child).catch(e => {
        //    console.error('removeChildFromContainer , e:' + e.message);
        //});
    },
    removeChild(parent: UEWidget, child: UEWidget) {
        parent.removeChild(child);
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
        if (world == undefined) {
            throw new Error("init with World first!");
        }
        let root = new UEWidgetRoot(UE.UMGManager.CreateReactWidget(world));
        const container = reconciler.createContainer(root, false, false);
        reconciler.updateContainer(reactElement, container, null, null);
        return root;
    },
    init: function(inWorld: UE.World) {
        world = inWorld;
    }
}

