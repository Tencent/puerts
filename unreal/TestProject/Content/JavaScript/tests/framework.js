// Minimal test framework shared by tests/*.js.
// - test(name, fn): register a case in the current step
// - step(fn): cases registered inside fn run in the next step; C++ runs JS GC + UE GC between steps
// - note(key, value): record an observed behaviour; notes are compared with Baseline/<Test>.txt
'use strict';

const puerts = require('puerts');
const UE = require('ue');
const reporter = puerts.argv.getByName('Reporter');

const steps = [[]];
let registering = 0;

function test(name, fn) {
    steps[registering].push({ name, fn });
}

function step(fn) {
    const saved = registering;
    registering = steps.length;
    steps.push([]);
    fn();
    registering = saved;
}

function fmt(v) {
    switch (typeof v) {
        case 'undefined':
            return 'undefined';
        case 'bigint':
            return `${v}n`;
        case 'string':
            return JSON.stringify(v);
        case 'number':
        case 'boolean':
            return String(v);
        case 'function':
            return `function ${v.name || '<anonymous>'}`;
        case 'symbol':
            return v.toString();
    }
    if (v === null) return 'null';
    if (Array.isArray(v)) return `[${v.map(fmt).join(', ')}]`;
    const ctor = v.constructor && v.constructor.name;
    if (ctor === 'Object' || !ctor) {
        return `{${Object.keys(v).map((k) => `${k}: ${fmt(v[k])}`).join(', ')}}`;
    }
    return `<${ctor}>`;
}

function same(a, b) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((x, i) => same(x, b[i]));
    }
    return false;
}

function eq(actual, expected, msg) {
    if (!same(actual, expected)) {
        throw new Error(`${msg ? msg + ': ' : ''}expected ${fmt(expected)}, got ${fmt(actual)}`);
    }
}

function near(actual, expected, eps, msg) {
    if (typeof actual !== 'number' || Math.abs(actual - expected) > (eps || 1e-6)) {
        throw new Error(`${msg ? msg + ': ' : ''}expected ~${expected}, got ${fmt(actual)}`);
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
}

// returns "<ErrorName>: <message>" of the thrown error, or "<no throw>"
function normalizePath(s) {
    return s.replace(/(?:[A-Za-z]:)?[\\/][^\s'"]*?[\\/]JavaScript(?=[\\/\s]|$)/g, '<js-root>');
}

function catchError(fn) {
    try {
        fn();
    } catch (e) {
        if (e instanceof Error) return normalizePath(`${e.name}: ${e.message}`);
        return `<thrown ${fmt(e)}>`;
    }
    return '<no throw>';
}

function note(key, value) {
    reporter.Note(`${key}: ${typeof value === 'string' ? value : fmt(value)}`);
}

// note the result of fn(), or the error it throws
function observe(key, fn) {
    let text;
    try {
        text = fmt(fn());
    } catch (e) {
        text = `throws ${e instanceof Error ? `${e.name}: ${e.message}` : fmt(e)}`;
    }
    reporter.Note(`${key}: ${text}`);
}

function runStep(index) {
    for (const c of steps[index]) {
        try {
            c.fn();
            reporter.Pass(c.name);
        } catch (e) {
            reporter.Fail(c.name, e instanceof Error ? (e.stack || e.message) : fmt(e));
        }
    }
    reporter.FinishedSteps = index + 1;
}

function run() {
    reporter.StepCount = steps.length;
    if (steps.length > 1) {
        reporter.OnStep.Bind((i) => runStep(i));
    }
    runStep(0);
}

module.exports = { puerts, UE, reporter, test, step, eq, near, assert, catchError, note, observe, fmt, normalizePath, run };
