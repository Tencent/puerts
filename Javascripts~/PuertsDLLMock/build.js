const rimraf = require('rimraf');
const { compileTypescriptProject } = require('@puerts/build-util')
const { join } = require('path');
const { renameSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mkdirp = require('mkdirp');

module.exports = function (lastBuildPath) {
    // tsc 
    compileTypescriptProject(join(__dirname, 'tsconfig.json'));

    // webpack
    execSync('npx webpack -c webpack.config.js', { 
        cwd: path.join(__dirname, 'PuertsDLLMock')
    })

    rimraf.sync(join(__dirname, "output"));

    mkdirp.sync(lastBuildPath);

    renameSync(
        path.join(__dirname, 'dist/puerts-runtime.js'),
        path.join(lastBuildPath, 'puerts-runtime.js')
    )
};
