const { existsSync } = require('node:fs');
const cp = require('node:child_process');

if (!existsSync(__dirname + "/../node_modules")) {
    console.log('installing node_modules');
    cp.execSync("npm i", { cwd: __dirname + "/.." })
}

console.log(`node --loader ts-node/esm ${__dirname}/cmd.mts ${process.argv.slice(2).join(' ')}`);

const p = cp.exec(`node --loader ts-node/esm ${__dirname}/cmd.mts ${process.argv.slice(2).join(' ')}`);

p.stdout.on('data', console.log)
p.stderr.on('data', console.error)

p.on('exit', ()=> {
    process.exit(p.exitCode)
})