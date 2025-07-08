/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

function validateNumber(value: unknown, type: string): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`${type} expects a number but got ${value}`);
    }
}

function boundsError(value: number, length: number, type?: string): never {
    if (Math.floor(value) !== value) {
        validateNumber(value, type || 'offset');
        throw new Error(`${type || 'offset'} expects an integer but got ${value}`);
    }

    if (length < 0) {
        throw new Error("out of bound");
    }

    throw new Error(`${type || 'offset'} expects >= ${type ? 1 : 0} and <= ${length} but got ${value}`);
}

function checkBounds(buf: Uint8Array, offset: number, byteLength: number): void {
    validateNumber(offset, 'offset');
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
    }
}

function writeU_Int8(buf: Uint8Array, value: number, offset: number, min: number, max: number): number {
    value = +value;
    validateNumber(offset, 'offset');
    if (value > max || value < min) {
        throw new Error(`value expects >= ${min} and <= ${max} but got ${value}`);
    }
    if (buf[offset] === undefined) {
        boundsError(offset, buf.length - 1);
    }

    buf[offset] = value;
    return offset + 1;
}

function readInt8(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const val = buff[offset];
    if (val === undefined) {
        boundsError(offset, buff.length - 1);
    }

    return val | (val & 2 ** 7) * 0x1fffffe;
}

function writeInt8(buf: Uint8Array, value: number, offset: number = 0): number {
    return writeU_Int8(buf, value, offset, -0x80, 0x7f);
}

function readUInt8(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const val = buff[offset];
    if (val === undefined) {
        boundsError(offset, buff.length - 1);
    }

    return val;
}

function writeUInt8(buf: Uint8Array, value: number, offset: number = 0): number {
    return writeU_Int8(buf, value, offset, 0, 0xff);
}

const int16Array = new Int16Array(1);
const uInt8Int6Array = new Uint8Array(int16Array.buffer);

function readInt16(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 2);
    }

    uInt8Int6Array[0] = first;
    uInt8Int6Array[1] = last;
    return int16Array[0];
}

function writeInt16(buff: Uint8Array, val: number, offset: number = 0): number {
    val = +val;
    checkBounds(buff, offset, 1);

    int16Array[0] = val;
    buff[offset++] = uInt8Int6Array[0];
    buff[offset++] = uInt8Int6Array[1];
    return offset;
}

const uint16Array = new Uint16Array(1);
const uint8Uint16Array = new Uint8Array(uint16Array.buffer);

function readUInt16(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 2);
    }

    uint8Uint16Array[0] = first;
    uint8Uint16Array[1] = last;
    return uint16Array[0];
}

function writeUInt16(buff: Uint8Array, val: number, offset: number = 0): number {
    val = +val;
    checkBounds(buff, offset, 1);

    uint16Array[0] = val;
    buff[offset++] = uint8Uint16Array[0];
    buff[offset++] = uint8Uint16Array[1];
    return offset;
}

const int32Array = new Int32Array(1);
const uint8Int32Array = new Uint8Array(int32Array.buffer);

function readInt32(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 4);
    }

    uint8Int32Array[0] = first;
    uint8Int32Array[1] = buff[++offset];
    uint8Int32Array[2] = buff[++offset];
    uint8Int32Array[3] = last;
    return int32Array[0];
}

function writeInt32(buff: Uint8Array, val: number, offset: number = 0): number {
    val = +val;
    checkBounds(buff, offset, 3);

    int32Array[0] = val;
    buff[offset++] = uint8Int32Array[0];
    buff[offset++] = uint8Int32Array[1];
    buff[offset++] = uint8Int32Array[2];
    buff[offset++] = uint8Int32Array[3];
    return offset;
}

const uint32Array = new Uint32Array(1);
const uint8Uint32Array = new Uint8Array(uint32Array.buffer);

function readUInt32(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 4);
    }

    uint8Uint32Array[0] = first;
    uint8Uint32Array[1] = buff[++offset];
    uint8Uint32Array[2] = buff[++offset];
    uint8Uint32Array[3] = last;
    return uint32Array[0];
}

function writeUInt32(buff: Uint8Array, val: number, offset: number = 0): number {
    val = +val;
    checkBounds(buff, offset, 3);

    uint32Array[0] = val;
    buff[offset++] = uint8Uint32Array[0];
    buff[offset++] = uint8Uint32Array[1];
    buff[offset++] = uint8Uint32Array[2];
    buff[offset++] = uint8Uint32Array[3];
    return offset;
}

const float32Array = new Float32Array(1);
const uInt8Float32Array = new Uint8Array(float32Array.buffer);

function readFloat(buff: Uint8Array, offset: number = 0): number {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 4);
    }

    uInt8Float32Array[0] = first;
    uInt8Float32Array[1] = buff[++offset];
    uInt8Float32Array[2] = buff[++offset];
    uInt8Float32Array[3] = last;
    return float32Array[0];
}

function writeFloat(buff: Uint8Array, val: number, offset: number = 0): number {
    val = +val;
    checkBounds(buff, offset, 3);

    float32Array[0] = val;
    buff[offset++] = uInt8Float32Array[0];
    buff[offset++] = uInt8Float32Array[1];
    buff[offset++] = uInt8Float32Array[2];
    buff[offset++] = uInt8Float32Array[3];
    return offset;
}

const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);

function readDouble(buff: Uint8Array, offset: number = 0): number {
    const first = buff[offset];
    const last = buff[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 8);
    }

    uInt8Float64Array[0] = first;
    uInt8Float64Array[1] = buff[++offset];
    uInt8Float64Array[2] = buff[++offset];
    uInt8Float64Array[3] = buff[++offset];
    uInt8Float64Array[4] = buff[++offset];
    uInt8Float64Array[5] = buff[++offset];
    uInt8Float64Array[6] = buff[++offset];
    uInt8Float64Array[7] = last;
    return float64Array[0];
}

function writeDouble(buff: Uint8Array, val: number, offset: number = 0): number {
    val = +val;
    checkBounds(buff, offset, 7);

    float64Array[0] = val;
    buff[offset++] = uInt8Float64Array[0];
    buff[offset++] = uInt8Float64Array[1];
    buff[offset++] = uInt8Float64Array[2];
    buff[offset++] = uInt8Float64Array[3];
    buff[offset++] = uInt8Float64Array[4];
    buff[offset++] = uInt8Float64Array[5];
    buff[offset++] = uInt8Float64Array[6];
    buff[offset++] = uInt8Float64Array[7];
    return offset;
}

const bigInt64Array = new BigInt64Array(1);
const uint8BigInt64Array = new Uint8Array(bigInt64Array.buffer);

function readInt64(buff: Uint8Array, offset: number = 0): bigint {
    const first = buff[offset];
    const last = buff[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 8);
    }

    uint8BigInt64Array[0] = first;
    uint8BigInt64Array[1] = buff[++offset];
    uint8BigInt64Array[2] = buff[++offset];
    uint8BigInt64Array[3] = buff[++offset];
    uint8BigInt64Array[4] = buff[++offset];
    uint8BigInt64Array[5] = buff[++offset];
    uint8BigInt64Array[6] = buff[++offset];
    uint8BigInt64Array[7] = last;
    return bigInt64Array[0];
}

function writeInt64(buff: Uint8Array, val: number | bigint, offset: number = 0): number {
    val = typeof val === 'number' ? BigInt(val) : val;
    checkBounds(buff, offset, 7);

    bigInt64Array[0] = val;
    buff[offset++] = uint8BigInt64Array[0];
    buff[offset++] = uint8BigInt64Array[1];
    buff[offset++] = uint8BigInt64Array[2];
    buff[offset++] = uint8BigInt64Array[3];
    buff[offset++] = uint8BigInt64Array[4];
    buff[offset++] = uint8BigInt64Array[5];
    buff[offset++] = uint8BigInt64Array[6];
    buff[offset++] = uint8BigInt64Array[7];
    return offset;
}

const bigUint64Array = new BigUint64Array(1);
const uint8BigUint64Array = new Uint8Array(bigUint64Array.buffer);

function readUInt64(buff: Uint8Array, offset: number = 0): bigint {
    const first = buff[offset];
    const last = buff[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 8);
    }

    uint8BigUint64Array[0] = first;
    uint8BigUint64Array[1] = buff[++offset];
    uint8BigUint64Array[2] = buff[++offset];
    uint8BigUint64Array[3] = buff[++offset];
    uint8BigUint64Array[4] = buff[++offset];
    uint8BigUint64Array[5] = buff[++offset];
    uint8BigUint64Array[6] = buff[++offset];
    uint8BigUint64Array[7] = last;
    return bigUint64Array[0];
}

function writeUInt64(buff: Uint8Array, val: number | bigint, offset: number = 0): number {
    val = typeof val === 'number' ? BigInt(val) : val;
    checkBounds(buff, offset, 7);

    bigUint64Array[0] = val;
    buff[offset++] = uint8BigUint64Array[0];
    buff[offset++] = uint8BigUint64Array[1];
    buff[offset++] = uint8BigUint64Array[2];
    buff[offset++] = uint8BigUint64Array[3];
    buff[offset++] = uint8BigUint64Array[4];
    buff[offset++] = uint8BigUint64Array[5];
    buff[offset++] = uint8BigUint64Array[6];
    buff[offset++] = uint8BigUint64Array[7];
    return offset;
}

// Exports
export {
    readInt8,
    readUInt8,
    readInt16,
    readUInt16,
    readInt32,
    readUInt32,
    readInt64,
    readUInt64,
    readFloat,
    readDouble,
    writeInt8,
    writeUInt8,
    writeInt16,
    writeUInt16,
    writeInt32,
    writeUInt32,
    writeInt64,
    writeUInt64,
    writeFloat,
    writeDouble
};
