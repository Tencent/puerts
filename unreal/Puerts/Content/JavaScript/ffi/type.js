/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

let ffi_bindings = require('ffi_bindings');
require('buffer-ext.js');

let primitiveTypes = Object.create(null);

Object.keys(ffi_bindings.sizeof).forEach(function (name) {
    let uname;
    if (name.startsWith("ui")) {
        uname = name.slice(0, 2).toUpperCase() + name.slice(2);
    } else {
        uname = name.charAt(0).toUpperCase() + name.slice(1);
    } 
    primitiveTypes[name] = {
        ffi_type: ffi_bindings.FFI_TYPES[name],
        size: ffi_bindings.sizeof[name],
        align: ffi_bindings.alignof[name],
        write: ffi_bindings["write" + uname],
        read: ffi_bindings["read" + uname],
        set: set,
        get: get,
        alloc: alloc
    }
});

primitiveTypes.cstring = primitiveTypes.pointer;
function doNothing(){}
primitiveTypes["void"] = {
    ffi_type: ffi_bindings.FFI_TYPES['void'],
    size: 0,
    align: 0,
    write: doNothing,
    read: doNothing,
    set: doNothing,
    get: doNothing,
    alloc: doNothing
}

function typeInfo(t) {
    return (typeof t === 'string') ? primitiveTypes[t] : t;
}

const pointer = primitiveTypes.pointer;

const sizeType = pointer.size == 4 ? "uint32" : "uint64";

primitiveTypes.size_t = {
    ffi_type: pointer.ffi_type,
    size: pointer.size,
    align: pointer.align,
    write: primitiveTypes[sizeType].write,
    read: primitiveTypes[sizeType].read,
    set: set,
    get: get,
    alloc: alloc
}

function makeStruct(info, noFfiType) {
    function structType (buff, data) {
        if (!(this instanceof structType)) {
            return new structType(buff, data);
        }

        if (!(buff instanceof Uint8Array)) {
            data = buff;
            buff = new Uint8Array(structType.size);
        }

        this._buff = buff;
        if (data) {
            for (var key in data) {
                this[key] = data[key];
            }
        }
    }

    function propertyDesc(name, type, offset) {
        return { 
            enumerable: true, 
            configurable: true,
            get: function() {
                return type.read(this._buff, offset);
            },
            set: function(value) {
                type.write(this._buff, value, offset);
            }
        };

    }

    let structSize = 0;
    let structAlign = 0;
    let elem_ffi_types = [];

    Object.keys(info).forEach(function (name) {
        fieldType = typeInfo(info[name]);
        const align = fieldType.align;
        const padding = (align - (structSize % align)) % align;
        const desc = propertyDesc(name, fieldType, structSize + padding);
        Object.defineProperty(structType.prototype, name, desc);
        structSize += (padding + fieldType.size);
        structAlign = Math.max(structAlign, align);
        elem_ffi_types.push(fieldType.ffi_type);
    });

    var left = structSize % structAlign;
    if (left > 0) {
        structSize += structAlign - left;
    }
    structType.size = structSize;
    structType.align = structAlign;
    structType.read = structRead;
    structType.write = structWrite;
    structType.set = set;
    structType.get = get;
    structType.alloc = alloc;

    if (!noFfiType) {
        let ffi_type = new FFI_TYPE();
        ffi_type.size = 0;
        ffi_type.alignment = 0;
        ffi_type.type = ffi_bindings.FFI_TYPE_STRUCT;

        let elements = pointer.alloc(...elem_ffi_types, null);
        ffi_type.elements = elements;
        structType._elems_array = elements;//prevent gc;
        structType.ffi_type = ffi_type._buff;
    }
   
    return structType;
}

var FFI_TYPE = makeStruct({
    size: 'size_t',
    alignment: 'uint16',
    type: 'uint16',
    elements: 'pointer'
}, true);

function structRead(buffer, offset) {
    if (typeof offset === 'number' && offset > 0) {
        buffer = new Uint8Array(buffer.buffer, offset);
    }
    return new this(buffer);
}

function structWrite(buffer, value, offset) {
    if (value instanceof this) {
        let src = value._buff;
        if (typeof offset !== 'number') offset = 0;
        for(var i = 0; i < this.size; i++) {
            buffer[offset++] = src[i];
        }
    } else {
        if (typeof offset === 'number' && offset > 0) {
            buffer = new Uint8Array(buffer.buffer, offset);
        }
        new this(buffer, value);
    }
}

function set(buff, val, index) {
    this.write(buff, val, index * this.size);
}

function get(buff, index) {
    return this.read(buff, index * this.size);
}

function alloc(...values) {
    if (values.length == 0) return new Uint8Array(this.size);
    let buff = new Uint8Array(values.length * this.size);
    for(var i = 0; i < values.length; i++) {
        this.set(buff, values[i], i);
    }
    return buff;
}

exports.typeInfo = typeInfo;
exports.makeStruct = makeStruct;
