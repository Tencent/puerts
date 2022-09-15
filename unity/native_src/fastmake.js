// node quickmake.js na8d
// equals to node make.js --backend nodejs_16 --platform android --arch arm64 --config Debug


const cp = require('child_process');
const command = process.argv[2];

let realCommand = 'node make.js'

switch (command[0]) {
    case 'v':
        realCommand += ' --backend v8_9.4'; break;
    case 'n':
        realCommand += ' --backend nodejs_16'; break;
    case 'q':
        realCommand += ' --backend quickjs'; break;

    default:
        throw new Error(`invalid command[0] : ${command[0]}`);
}

switch (command[1]) {
    case 'a':
        realCommand += ' --platform android'; break;
    case 'i':
        realCommand += ' --platform ios'; break;
    case 'w':
        realCommand += ' --platform win'; break;
    case 'o':
        realCommand += ' --platform osx'; break;
    case 'l':
        realCommand += ' --platform linux'; break;

    default:
        throw new Error(`invalid command[1] : ${command[1]}`);
}

switch (command[2]) {
    case '3':
        realCommand += ' --arch ia32'; break;
    case '6':
        realCommand += ' --arch x64'; break;
    case '7':
        realCommand += ' --arch armv7'; break;
    case '8':
        realCommand += ' --arch arm64'; break;

    default:
        throw new Error(`invalid command[2] : ${command[2]}`);
}

switch (command[2] || "") {
    case 'd':
        realCommand += ' --config Debug'; break;

    default:
        realCommand += ' --config Release'; break;
}

console.log(realCommand);
const p = cp.exec(realCommand);
p.stdout.on('data', (b) => {
    console.log(b.toString())
})
p.stderr.on('data', (b) => {
    console.error(b.toString())
})