'use strict';
// FArrayBuffer / FArrayBufferValue conversion (FArrayBufferPropertyTranslator)
const { UE, test, eq, assert, observe, run } = require('./framework');

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

run();
