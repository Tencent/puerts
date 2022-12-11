import { existsSync, readFileSync } from "fs";
import { glob } from "glob";
import { join, normalize } from "path";
import ts from "typescript";
import PuerBuiltinTranspiler from "./base";

const DEFAULT_TS_CONFIG = {
    "target": ts.ScriptTarget.ESNext,
    "module": ts.ModuleKind.ES2015,
    "sourceMap": true,
    "inlineSourceMap": true,
    "noImplicitAny": true
}

class PuerTSCTranspiler extends PuerBuiltinTranspiler {
    protected services: ts.LanguageService;

    constructor(tsRootPath: string) {
        super();
        let compilerOptions: ts.CompilerOptions;
        const maybeTSConfigPath = join(tsRootPath, 'tsconfig.json');
        if (!existsSync(maybeTSConfigPath)) {
            compilerOptions = DEFAULT_TS_CONFIG;

        } else {
            const cl: ts.ParsedCommandLine | undefined = ts.getParsedCommandLineOfConfigFile(
                maybeTSConfigPath,
                {},
                Object.assign({ onUnRecoverableConfigFileDiagnostic: (d: any) => d }, ts.sys)
            );
            if (cl?.options) {
                compilerOptions = cl.options;

            } else {
                compilerOptions = DEFAULT_TS_CONFIG
            }
        }
        
        this.services = ts.createLanguageService({
            getScriptFileNames: () => []
                .concat(glob.sync(normalize(tsRootPath + "/**/*.ts").replace(/\\/g, '/')) as any)
                .concat(glob.sync(normalize(tsRootPath + "/**/*.mts").replace(/\\/g, '/')) as any),
            getCompilationSettings: () => compilerOptions,
            getScriptVersion: () => Math.random().toString(),
            getScriptSnapshot: fileName => {
                if (!existsSync(fileName)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(readFileSync(fileName).toString());
            },
            getCurrentDirectory: () => process.cwd(),
            getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile,
            // getCustomTransformers: () => {
            //     return {
            //         before: [transformer]
            //     }
            // }
        }, ts.createDocumentRegistry());
    }

    transpile(filepath: string): string {
        filepath = process.platform == 'win32' ? normalize(filepath) : normalize(filepath)
        const emitOutput = this.services.getEmitOutput(filepath);
        
        if (emitOutput.outputFiles.length > 1) {
            throw new Error('please set sourcemap config to "inline"');
        }
        return emitOutput.outputFiles[0].text;
    }
}

export default PuerTSCTranspiler