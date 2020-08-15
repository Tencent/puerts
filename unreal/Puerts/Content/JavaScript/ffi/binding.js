/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

const ffi_bindings = require('ffi_bindings');
const typeInfo = require('type').typeInfo;
const pointer = typeInfo('pointer');
const ffi_call = ffi_bindings.ffi_call;
const UTF8Length = ffi_bindings.UTF8Length;
const writeUTF8String = ffi_bindings.writeUTF8String;
const readUTF8String = ffi_bindings.readUTF8String;

function stringToCString(str) {
    let buffLen = UTF8Length(str);
    let buff = new Uint8Array(buffLen + 1);
    writeUTF8String(buff, str);
    return buff;
}


function id(x) {
    return x;
}

function allocCif(returnType, parameterTypes, abi, fixArgNum) {
    let param_ffi_types = parameterTypes.map(t => t.ffi_type);
    
    let cifPtr = new Uint8Array(ffi_bindings.FFI_CIF_SIZE);
    let status
    if (typeof fixArgNum === 'number') {
        status = ffi_bindings.ffi_prep_cif_var(cifPtr, abi, fixArgNum, parameterTypes.length, returnType.ffi_type, pointer.alloc(...param_ffi_types));
    } else {
        status = ffi_bindings.ffi_prep_cif(cifPtr, abi, parameterTypes.length, returnType.ffi_type, pointer.alloc(...param_ffi_types));
    }
    if (status != 0) {
        throw new Error(`call ffi_prep_cif fail, status=${status}`);
    }
    return cifPtr;
}

function binding(func, abi, returnType, parameterTypes, fixArgNum) {
    if (typeof abi !== 'number') {
        fixArgNum = parameterTypes;
        parameterTypes = returnType;
        returnType = abi;
        abi = ffi_bindings.FFI_DEFAULT_ABI;
    }

    const argsProcessers = parameterTypes.map(t => t === 'cstring' ? stringToCString : id);
    const resultProcesser = returnType === 'cstring' ? readUTF8String : id;
    returnType = typeInfo(returnType);
    parameterTypes = parameterTypes.map(t => typeInfo(t));
    const cifPtr = allocCif(returnType, parameterTypes, abi, fixArgNum);
    let argPtrs = parameterTypes.map(t => t.alloc());
    let retPtr = returnType.alloc();
    const ffi_call_args = pointer.alloc(...argPtrs);
    const expectArgNum = parameterTypes.length;

    function wrap(...args) {
        if (args.length != expectArgNum) {
            throw new Error(`expect ${expectArgNum} argument but got ${args.length}`);
        }
        for (var i = 0; i < expectArgNum; i++) {
            args[i] = argsProcessers[i](args[i]);
            parameterTypes[i].write(argPtrs[i], args[i]);
        }
        ffi_call(cifPtr, func, retPtr, ffi_call_args);
        return resultProcesser(returnType.read(retPtr));
    }
    return wrap;
}

function allocClosure(func, abi, returnType, parameterTypes) {
    if (typeof abi !== 'number') {
        parameterTypes = returnType;
        returnType = abi;
        abi = ffi_bindings.FFI_DEFAULT_ABI;
    }
    returnType = typeInfo(returnType);
    parameterTypes = parameterTypes.map(t => typeInfo(t));
    const cifPtr = allocCif(returnType, parameterTypes, abi);

    return ffi_bindings.ffi_alloc_closure(cifPtr, function(retPtr, argPtrs) {
        try {
            var args = [];
            for (var i = 0; i < parameterTypes.length; i++) {
                var argPtr = pointer.read(argPtrs, i * pointer.size, parameterTypes[i].size);
                args.push(parameterTypes[i].read(argPtr));
            }
            var result = func.apply(null, args);
            returnType.write(retPtr, result);
        } catch (e) {
            console.error('js callback exception, msg=', e);
        }
    }, returnType.size);
}

function nativeFunctionPtr(cl) {
    return pointer.read(cl);
}

function freeClosure(cl) {
    ffi_bindings.ffi_free_closure(cl);
}

exports.binding = binding;
exports.closure = {
    alloc: allocClosure,
    func: nativeFunctionPtr,
    free: freeClosure
}


