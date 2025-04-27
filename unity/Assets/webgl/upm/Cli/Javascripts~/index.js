const fs = require('fs');
const cp = require('child_process');
const path = require('path');

if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  cp.exec('npm i', { cwd: __dirname }, (error, stdout, stderr) => {
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

function executeCommand () {
    require('./cmd.js');
};
