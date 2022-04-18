const rimraf = require('rimraf');
const { compileTypescriptProject } = require('@puerts/build-util')
const { join } = require('path');
const { renameSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function (lastBuildPath) {
    // tsc 
    compileTypescriptProject(join(__dirname, 'PuertsDLLMock/tsconfig.json'));

    // webpack
    execSync('npx webpack -c webpack.config.js', { 
        cwd: path.join(__dirname, 'PuertsDLLMock')
    })

    rimraf.sync(join(__dirname, "PuertsDLLMock/output"));

    renameSync(
        path.join(__dirname, 'PuertsDLLMock/dist/puerts-runtime.js'),
        path.join(lastBuildPath, 'puerts-runtime.js')
    )
};
