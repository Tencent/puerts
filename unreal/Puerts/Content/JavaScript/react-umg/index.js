'use strict';

module.exports = require('./react-umg.js', true);

let components = require('./components.js', true);

for(let k in components) {
    module.exports[k] = components[k];
}

