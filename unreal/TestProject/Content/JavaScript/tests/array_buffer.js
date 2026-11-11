'use strict';
// FArrayBuffer / FArrayBufferValue conversion (FArrayBufferPropertyTranslator)
const { UE, test, eq, assert, observe, catchError, run } = require('./framework.js');
const puerts = require('puerts');

const holder = new UE.PuertsTestArrayBufferHolder();

test('property maps C++ memory', () => {
    const ab = holder.Buffer;
    assert(ab instanceof ArrayBuffer, 'property is an ArrayBuffer');
    eq(ab.byteLength, 10);
    const u8 = new Uint8Array(ab);
    eq(Array.from(u8), [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    eq(holder.BufferSum(), 110);
    u8[0] = 100;
    observe('js write visible to C++', () => holder.BufferSum());
});

test('parameter', () => {
    const u8 = new Uint8Array([1, 2, 3, 4, 5]);
    eq(holder.Sum(u8.buffer), 15, 'ArrayBuffer');
    eq(holder.Sum(u8), 15, 'ArrayBufferView');
    eq(holder.Sum(u8.subarray(2)), 12, 'ArrayBufferView offset');
    eq(holder.Sum(new ArrayBuffer(0)), 0, 'empty');
    observe('non buffer argument', () => holder.Sum(1));
});

test('return value', () => {
    const u8 = new Uint8Array([1, 2, 3, 4, 5]);
    const view = holder.SkipFirst(u8.buffer);
    eq(Array.from(new Uint8Array(view)), [2, 3, 4, 5]);
    const copy = holder.SkipFirstCopy(u8.buffer);
    eq(Array.from(new Uint8Array(copy)), [2, 3, 4, 5]);
    u8[1] = 50;
    eq(new Uint8Array(copy)[0], 2, 'bCopy == true returns a copy');
    observe('bCopy == false aliases the argument', () => new Uint8Array(view)[0]);
});

test('FArrayBufferValue', () => {
    observe('value param', () => holder.ValueSum(new Uint8Array([1, 2, 3]).buffer));
    observe('value return', () => {
        const r = holder.MakeValue(4);
        return r instanceof ArrayBuffer ? Array.from(new Uint8Array(r)) : r;
    });
});

test('puerts.toCString', () => {
    const ab = puerts.toCString('h\u00e9llo');
    assert(ab instanceof ArrayBuffer, 'returns an ArrayBuffer');
    eq(Array.from(new Uint8Array(ab)), [0x68, 0xc3, 0xa9, 0x6c, 0x6c, 0x6f, 0], 'utf8 bytes with trailing zero');
    eq(Array.from(new Uint8Array(puerts.toCString(''))), [0], 'empty string');
    const err = catchError(() => puerts.toCString(1));
    assert(String(err).indexOf('expect a string') >= 0, 'non string throws: ' + err);
});

test('puerts.toCPtrArray', () => {
    const a = new Uint8Array([1, 2]);
    const ab = puerts.toCPtrArray(a.buffer, 1, a);
    assert(ab instanceof ArrayBuffer, 'returns an ArrayBuffer');
    eq(ab.byteLength, 3 * 8, 'one pointer per argument');
    const ptrs = new BigUint64Array(ab);
    assert(ptrs[0] !== 0n, 'ArrayBuffer pointer');
    eq(ptrs[1] === 0n, true, 'non binary argument is a null pointer');
    eq(ptrs[2] === ptrs[0], true, 'ArrayBufferView points to the same memory');
    eq(puerts.toCPtrArray().byteLength, 0, 'no arguments');
});

run();
