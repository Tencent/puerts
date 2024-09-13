const m2 = require('circular_m2.cjs');

exports.foo = () => {
    return m2.bar(); // expect "hello john"
} 

exports.f1 = "hello john";


m2.bar();

