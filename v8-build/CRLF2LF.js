const fs = require('fs');
var file = process.argv[2];

fs.writeFileSync(file, fs.readFileSync(file, {encoding: 'utf-8'}).toString().replace(/\r\n/g, '\n'));
