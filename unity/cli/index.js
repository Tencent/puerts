console.log(`node --loader ts-node/esm ${__dirname}/cmd.mts ${process.argv.slice(2).join(' ')}`);

const p = require('child_process')
    .exec(`node --loader ts-node/esm ${__dirname}/cmd.mts ${process.argv.slice(2).join(' ')}`);

p.stdout.on('data', console.log)
p.stderr.on('data', console.error)

procses.exit(p.exitCode)