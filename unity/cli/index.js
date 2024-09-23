const fs = require('fs');
const cp = require('child_process');

if (!fs.existsSync(__dirname + '/../node_modules')) {
  cp.exec('npm i', { cwd: __dirname + '/..' }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error in installing dependency ', error);
    } else {
      console.log('Success');
      executeCommand();
    }
  });
} else {
  executeCommand();
}

function executeCommand() {
  const command = `node`;
  const args = [`--loader`, `ts-node/esm`, `${__dirname}/cmd.mts`, ...process.argv.slice(2)];
  console.log(`${command} ${args.join(' ')}`);

  const p = cp.spawn(command, args, { stdio: 'inherit' });

  p.on('exit', (code) => {
    process.exit(code);
  });
}
