const fs = require('fs');
const path = require("path");

const pesapi_header_path = path.resolve(__dirname, 'Source/JsEnv/Public/pesapi.h')

var lines = fs.readFileSync(pesapi_header_path, 'utf8').split(/[\n\r]/);
var funcIndex = 0;

var apiImpl = "";
var ptrSetter = "";
var ptrGetter = [];

for(var i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('PESAPI_EXTERN') && line.endsWith(',')) {
        var j = 1;
        while(true) {
            let l = lines[i + j];
            if (typeof l == 'undefined') break;
            l = l.trim();
            line += l;
            if (l.endsWith(';')) {
                i += j;
                break;
            }
            j++;
        }
    }
    let m = line.match(/^PESAPI_EXTERN\s+([\w\*]+)\s+(pesapi_[^\(]+)(.+);/);
    if (m) {
        //console.log(`${m[1]} ${m[2]} ${m[3]}`);
        let [_, returnType, functionName, paramertsDef] = m;
        functionName = functionName.trim();
        if (functionName != "pesapi_init") {
            apiImpl += `typedef ${returnType} (*${functionName}Type)${paramertsDef};\n`;
            apiImpl += `static ${functionName}Type ${functionName}_ptr;\n`;
            apiImpl += `${returnType} ${functionName} ${paramertsDef} {\n`;
            let argsList = paramertsDef.split(',').map(x=>x.trim().replace(/.+\s+(\w+)/, '$1').replace('[]', '')).join(', ');
            apiImpl += '    ' + (returnType.trim() == 'void' ? '' : 'return ') + `${functionName}_ptr(${argsList};\n`;
            apiImpl += '}\n\n';
            
            ptrSetter += `    ${functionName}_ptr = (${functionName}Type)func_array[${funcIndex++}];\n`;
            ptrGetter.push(`(pesapi_func_ptr)&${functionName}`);
        }
    }
}

var pesapi_adpt = '#define PESAPI_ADPT_C\n\n#include <pesapi.h>\n\nEXTERN_C_START\n\n' + apiImpl
                  + '\nvoid pesapi_init(pesapi_func_ptr* func_array){'
                  + ptrSetter + '}\n\nEXTERN_C_END\n';
                  
fs.writeFileSync('pesapi_adpt.c', pesapi_adpt);

console.log(ptrGetter.join(', \n'));
