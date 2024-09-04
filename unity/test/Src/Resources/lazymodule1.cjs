const lm2 = require('./lazymodule2.cjs');

exports.bar = () => {
    console.log('lazymodule1 bar');
    lm2.foo();
}

exports.notusinglm2 = () => {
    console.log('lazymodule1 notusinglm2');
}
