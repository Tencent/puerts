"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const glob_1 = require("glob");
const path_1 = require("path");
const typescript_1 = __importDefault(require("typescript"));
const base_1 = __importDefault(require("./base"));
const DEFAULT_TS_CONFIG = {
    "target": typescript_1.default.ScriptTarget.ESNext,
    "module": typescript_1.default.ModuleKind.ES2015,
    "sourceMap": true,
    "inlineSourceMap": true,
    "noImplicitAny": true
};
class PuerTSCTranspiler extends base_1.default {
    constructor(tsRootPath) {
        super();
        let compilerOptions;
        const maybeTSConfigPath = (0, path_1.join)(tsRootPath, 'tsconfig.json');
        if (!(0, fs_1.existsSync)(maybeTSConfigPath)) {
            compilerOptions = DEFAULT_TS_CONFIG;
        }
        else {
            const cl = typescript_1.default.getParsedCommandLineOfConfigFile(maybeTSConfigPath, {}, Object.assign({ onUnRecoverableConfigFileDiagnostic: (d) => d }, typescript_1.default.sys));
            if (cl === null || cl === void 0 ? void 0 : cl.options) {
                compilerOptions = cl.options;
            }
            else {
                compilerOptions = DEFAULT_TS_CONFIG;
            }
        }
        this.services = typescript_1.default.createLanguageService({
            getScriptFileNames: () => []
                .concat(glob_1.glob.sync((0, path_1.normalize)(tsRootPath + "/**/*.ts").replace(/\\/g, '/')))
                .concat(glob_1.glob.sync((0, path_1.normalize)(tsRootPath + "/**/*.mts").replace(/\\/g, '/'))),
            getCompilationSettings: () => compilerOptions,
            getScriptVersion: () => Math.random().toString(),
            getScriptSnapshot: fileName => {
                if (!(0, fs_1.existsSync)(fileName)) {
                    return undefined;
                }
                return typescript_1.default.ScriptSnapshot.fromString((0, fs_1.readFileSync)(fileName).toString());
            },
            getCurrentDirectory: () => process.cwd(),
            getDefaultLibFileName: options => typescript_1.default.getDefaultLibFilePath(options),
            fileExists: typescript_1.default.sys.fileExists,
            readFile: typescript_1.default.sys.readFile,
            // getCustomTransformers: () => {
            //     return {
            //         before: [transformer]
            //     }
            // }
        }, typescript_1.default.createDocumentRegistry());
    }
    transpile(filepath) {
        filepath = process.platform == 'win32' ? (0, path_1.normalize)(filepath) : (0, path_1.normalize)(filepath);
        const emitOutput = this.services.getEmitOutput(filepath);
        if (emitOutput.outputFiles.length > 1) {
            throw new Error('please set sourcemap config to "inline"');
        }
        return emitOutput.outputFiles[0].text;
    }
}
exports.default = PuerTSCTranspiler;
