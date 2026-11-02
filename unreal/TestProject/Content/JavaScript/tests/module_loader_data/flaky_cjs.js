if (globalThis.__mlFlaky) throw new Error('flaky cjs');
module.exports = 'ok';
