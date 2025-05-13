/**
 * 收集resources目录所有的JS
 * 为minigame构建时，全数拷贝至微信插件导出的项目目录
 * 为browser构建时，将它们全数合并到一个js文件里，由HTML加载。
 */
const fs = require("fs");
const path = require("path");
const glob = require('glob');
const babel = require('@babel/core');
const { mkdir } = require('@puerts/shell-util');
const { program } = require('commander');

function buildForBrowser(allJSFile, outputpath) {
    const puerts_js_file = {};
    allJSFile.forEach(({ resourceName, jsfile }) => {
        const code = fs.readFileSync(jsfile, 'utf-8');
        puerts_js_file[resourceName] = `(function(exports, require, module, __filename, __dirname) {
            ${babel.transformSync(code, {
            cwd: __dirname,
            "presets": [
                ["@babel/preset-env", { targets: { chrome: "84", esmodules: false } }]
            ]
        }).code}
        })`;
    })
    const targetPath = path.join(outputpath, 'puerts_browser_js_resources.js');
    mkdir('-p', path.dirname(targetPath));
    fs.writeFileSync(targetPath, `
        window.PUERTS_JS_RESOURCES = {${Object.keys(puerts_js_file).map(resourceName => {
            return `"${resourceName}": ${puerts_js_file[resourceName]}`
        }).join(',')
        }};
    `);
}
function buildForMinigame(allJSFile, outputpath) {
    const outputdir = path.join(outputpath, 'puerts_minigame_js_resources');
    mkdir('-p', outputdir);

    allJSFile.forEach(({ resourceName, jsfile }) => {
        const resourceFilePath = path.join(outputdir, resourceName);
        mkdir('-p', path.dirname(resourceFilePath));
        fs.writeFileSync(
            !resourceFilePath.endsWith('.js') ? resourceFilePath + ".js" : resourceFilePath,
            fs.readFileSync(jsfile, 'utf-8')
        );
    })
}

function globAllJSFile (fileGlobbers) {
    const allJSFile = fileGlobbers
        .reduce((retArr, globber)=> {
            return retArr.concat(
                glob.sync(path.normalize(globber).replace(/\\/g, '/'))
            )
        }, [])
        .filter(jsfile => {
            return jsfile.indexOf('Editor') == -1 && jsfile.indexOf('node_modules') == -1
        })
        .map(jsfile => {
            let resourceNameMatcher = jsfile.split('Resources/');
            let resourceName = resourceNameMatcher[resourceNameMatcher.length - 1];
            resourceName = resourceName.replace(/\.txt$/, '');

            return {
                resourceName,
                jsfile
            }
        })

    return allJSFile;
}

program.name('js resources combiner')
    .description('CLI tool for building JavaScript resources for different platforms')
    .version('1.0.0');

// Build for Minigame command
program.command('buildForMinigame')
    .description('Build JS resources for minigame platforms')
    .requiredOption('-o, --output <path>', 'Output directory path')
    .requiredOption('-p, --patterns <patterns...>', 'File glob patterns')
    .action((command) => {
        buildForMinigame(globAllJSFile(command.patterns), command.output);
        console.log(`Minigame resources built successfully at: ${command.output}`);
    });

// Build for Browser command
program.command('buildForBrowser')
    .description('Build JS bundle for browser platforms')
    .requiredOption('-o, --output <path>', 'Output directory path')
    .requiredOption('-p, --patterns <patterns...>', 'File glob patterns')
    .action((command) => {
        buildForBrowser(globAllJSFile(command.patterns), command.output);
        console.log(`Browser bundle built successfully at: ${path.join(command.output, 'puerts_browser_js_resources.js')}`);
    });

program.parse(process.argv);
