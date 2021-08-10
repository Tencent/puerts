const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

//console.log(__dirname)

const jsSroucePath = path.join(__dirname, 'Content/JavaScript');
const jsBasePath = path.join(__dirname, '../../Content/JavaScript');
const tsModulePath = path.join(jsBasePath, 'PuertsEditor/node_modules/typescript');
const tsconfigFilePath =  path.join(__dirname, '../../tsconfig.json');
const puertsConfigPath = path.join(__dirname, '../../Config/DefaultPuerts.ini');
const tsSroucePath = path.join(__dirname, '../../TypeScript');

const jsDefaultConfig = {
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "jsx": "react",
    "sourceMap": true,
    "typeRoots": [
      "Plugins/Puerts/Typing",
      "./node_modules/@types"
    ],
    "outDir": "Content/JavaScript"
  },
  "include": [
    "TypeScript/**/*"
  ]
}

const puertsConfig = `


[/Script/Puerts.PuertsSetting]
AutoModeEnable=True

`

function copyFileSync( source, target ) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, targetFolder ) {
    var files = [];

    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    //copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, path.join( targetFolder, file) );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

if (!fs.existsSync(jsBasePath)) {
    console.log('copy js files');
    copyFolderRecursiveSync(jsSroucePath, jsBasePath);
}

if (!fs.existsSync(tsconfigFilePath)) {
    console.log('emit tsconfig.json');
    fs.writeFileSync(tsconfigFilePath, JSON.stringify(jsDefaultConfig, null, 4));
} else {
    throw new Error(tsconfigFilePath + " existed!");
}

if (!fs.existsSync(puertsConfigPath)) {
    console.log('emit DefaultPuerts.ini');
    fs.writeFileSync(puertsConfigPath, puertsConfig);
}

if (!fs.existsSync(tsSroucePath)) {
    console.log('create TypeScript folder');
    fs.mkdirSync( tsSroucePath );
}

if (!fs.existsSync(tsModulePath)) {
    console.log('npm install , please wait...');
    process.chdir(path.join(jsBasePath, 'PuertsEditor'));
    const output = execSync('npm install .', { encoding: 'utf-8' });  // the default is 'buffer'
    console.log(output);
}
