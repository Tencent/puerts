/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    const Wasm3 = {}

    const Wasm_NewMemory = global.__tgjsWasm_NewMemory
    global.__tgjsWasm_NewMemory = undefined
    const Wasm_MemoryGrowth = global.__tgjsWasm_MemoryGrowth
    global.__tgjsWasm_MemoryGrowth = undefined
    const Wasm_MemoryBuffer = global.__tgjsWasm_MemoryBuffer
    global.__tgjsWasm_MemoryBuffer = undefined
    class Wasm3Memory{
        constructor({initial, maximum, _Seq}){
            if(_Seq) {
                this._Seq = _Seq
            }else{
                this._Seq = Wasm_NewMemory(initial, maximum)
            }
        }
        grow(n){
            Wasm_MemoryGrowth(this._Seq, n)
        }
        get buffer(){
            return Wasm_MemoryBuffer(this._Seq)
        }
    }
    Wasm3.Memory = Wasm3Memory;

    class Wasm3Module{
        constructor(bufferSource){
            this._bufferSouce = bufferSource;//bufferSource is arraybuffer or typedarray
        }
    }
    Wasm3.Module = Wasm3Module

    const Wasm_Instance = global.__tgjsWasm_Instance
    global.__tgjsWasm_Instance = undefined
    class Wasm3ModuleInstance{
        constructor(InWasm3Module, importObject){
            this.exports = {}
            this._Seq = Wasm_Instance(InWasm3Module._bufferSouce, importObject, this.exports)
            const _Seq = this._Seq
            let cachedMemory = undefined
            Object.defineProperty(this.exports, 'memory', {
                get: function(){
                    if(!cachedMemory){
                        cachedMemory = new Wasm3Memory({_Seq:_Seq})
                    }
                    return cachedMemory
                }
            })
        }
    }

    Wasm3.instantiate = function(bufferSource, importObject){
        return new Promise((resolve, reject)=>{
            const ins = new Wasm3ModuleInstance(new Wasm3Module(bufferSource), importObject)
            resolve(ins)
        })
    }

    const __tgjsWasm_OverrideWebAssembly = global.__tgjsWasm_OverrideWebAssembly
    global.__tgjsWasm_OverrideWebAssembly = undefined
    if(__tgjsWasm_OverrideWebAssembly()){
        global.WebAssembly = Wasm3
    }

    /*setTimeout(()=>{
        const ProjDir = require('ue').BlueprintPathsLibrary.ProjectDir();
        global.WebAssembly.instantiate(require('ue').MHScriptIO.ReadFileAsArrayBuffer(`${ProjDir}/Content/JavaScript/wasm/test.wasm`), {
            env:
            {
                ImportFunction_Int : function(intValue, floatValue, doubleValue){
                    console.log("ffffffffffffffffffffffffffffffffffffffffffff")
                    console.log(typeof intValue, intValue)
                    console.log(typeof floatValue, floatValue)
                    console.log(typeof doubleValue, doubleValue)
                    return 1
                },
                atan2 : function(x, y){
                    return Math.atan2(x, y)
                }
            }
        }).then((inst)=>{
            const e = inst.exports
            console.log("kkkk", e.TestParam(1, 3, 4))
            {
                const a = new Date().getTime()
                for(let i = 0; i < 1000000; ++i){
                    e.atan2_ue(0.1, 0.1)
                }
                const b = new Date().getTime()
                console.log("ffffffffffffffffffff ue", b - a)
            }

            {
                const a = new Date().getTime()
                for(let i = 0; i < 1000000; ++i){
                    e.atan2_js(0.1, 0.1)
                }
                const b = new Date().getTime()
                console.log("ffffffffffffffffffff ue", b - a)
            }
        })
    }, 1)*/
}(global));
