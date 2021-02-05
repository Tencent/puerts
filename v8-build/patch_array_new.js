const fs = require('fs');

var lines = fs.readFileSync(process.argv[2], 'utf-8');

lines = lines.replace("T* NewArray(size_t size) {", "T* NewArray(size_t size) {\n  size = (size == 0) ? 1 : size;");
        
fs.writeFileSync(process.argv[2], lines);
