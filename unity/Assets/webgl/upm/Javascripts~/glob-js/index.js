/**
 * 收集resources目录所有的JS
 * 为minigame构建时，全数拷贝至微信插件导出的项目目录
 * 为browser构建时，将它们全数合并到一个js文件里，由HTML加载。
 */
const fs = require("fs");
const path = require("path");
const glob = require('glob');
const mkdirp = require("mkdirp");
const babel = require('@babel/core');

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
    mkdirp.sync(path.dirname(targetPath));
    fs.writeFileSync(targetPath, `
        window.PUERTS_JS_RESOURCES = {${Object.keys(puerts_js_file).map(resourceName => {
            return `"${resourceName}": ${puerts_js_file[resourceName]}`
        }).join(',')
        }};
    `);
}
function buildForMinigame(allJSFile, outputpath) {
    const outputdir = path.join(outputpath, 'puerts_minigame_js_resources');
    mkdirp.sync(outputdir);

    allJSFile.forEach(({ resourceName, jsfile }) => {
        const resourceFilePath = path.join(outputdir, resourceName);
        mkdirp.sync(path.dirname(resourceFilePath));
        fs.writeFileSync(
            !resourceFilePath.endsWith('.js') ? resourceFilePath + ".js" : resourceFilePath,
            fs.readFileSync(jsfile, 'utf-8')
        );
    })
}

function buildHTML(outputpath) {
    fs.writeFileSync(path.join(outputpath, 'index.html'), `
    <!DOCTYPE html>
<html lang="en-us">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Unity WebGL Player | puerts_unity_webgl_demo</title>
    <link rel="shortcut icon" href="TemplateData/favicon.ico">
    <link rel="stylesheet" href="TemplateData/style.css">
    <script src="TemplateData/UnityProgress.js"></script>
    <script src="Build/UnityLoader.js"></script>
  </head>
  <body>
    <div class="webgl-content">
      <div id="unityContainer" style="width: 960px; height: 600px"></div>
      <div class="footer">
        <div class="webgl-logo"></div>
        <div class="fullscreen" onclick="unityInstance.SetFullscreen(1)"></div>
        <div class="title">puerts_unity_webgl_demo</div>
      </div>
    </div>
    <script>
      function getScript(url, callback) {
        var script = document.createElement("script");
        script.src = url;
        script.onload = callback;
        document.body.appendChild(script);
      }
      getScript('puerts_browser_js_resources.js', function() {
        var unityInstance = UnityLoader.instantiate("unityContainer", "Build/${path.basename(outputpath)}.json", {onProgress: UnityProgress});
      })

    </script>
  </body>
</html>
    `)
}

function getAllJSFile (fileGlobbers) {
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

exports.buildForMinigame = function (fileGlobbers, outputpath) {

    buildForMinigame(getAllJSFile(fileGlobbers), outputpath);
}
exports.buildForBrowser = function (fileGlobbers, outputpath) {

    buildForBrowser(getAllJSFile(fileGlobbers), outputpath);
}