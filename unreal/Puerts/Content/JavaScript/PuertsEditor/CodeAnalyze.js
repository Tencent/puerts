"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UE = require("ue");
const puerts_1 = require("puerts");
const ts = require("typescript");
const tsi = require("./TypeScriptInternal");
/**
 * @brief the specifier read from the decorator
 */
class MetaSpecifier {
    /**
     * the constructor
     * @param specifier
     * @param values
     * @returns
     */
    constructor(specifier, values) {
        /**
         * the identity of the specifier
         */
        this.Specifier = "";
        this.Specifier = specifier;
        this.Values = values;
    }
    /**
     * apply the specifier to the meta data, return if the specifier is consumed
     *      null indicate the specifier is invalid in call context
     *      this function should called when parse the meta data defined via umeta
     * @param metaData
     */
    ApplyInMeta(metaData) {
        //  for specifier used in meta, only meta key and meta key value is valid
        if (this.Specifier == '' || (this.Values != null && this.Values.length != 1)) {
            return null;
        }
        //  the meta data set via umeta, we only treat it as key value pair
        metaData.set(this.Specifier, this.Values == null ? '' : this.Values[0]);
        return true;
    }
    /**
     * apply the specifier to the meta data, return if the specifier is consumed
     *      this function should called when parse the meta data defined via prefix e.g uclass/ufunction
     * @param metaData
     */
    ApplyInIdentity(metaData) {
        if (this.Specifier == '') {
            return null;
        }
        if (!MetaSpecifier.CommonMetaData.has(this.Specifier)) { // unknown specifier, need context to parse, don't do here
            return false;
        }
        if (!MetaSpecifier.CommonMetaData.get(this.Specifier).call(null, this, metaData)) { // we know the specifier is invalid for specific key
            return null;
        }
        return true;
    }
    /**
     * check if the specifier is meta key
     */
    IsMetaKey() {
        return this.Values == null;
    }
    /**
     * check if the specifier is meta key value
     * @returns
     */
    IsMetaKeyValue() {
        return this.Values != null && this.Values.length == 1;
    }
    /**
     * check if the specifier is meta key values
     * @returns
     */
    IsMetaKeyValues() {
        return this.Values != null;
    }
}
/**
 * the common meta data, the behavior is sync with unreal engine 5.0 early preview
 */
MetaSpecifier.CommonMetaData = new Map([
    ["DisplayName", (specifier, metaData) => {
            if (specifier.IsMetaKeyValue()) {
                metaData.set("DisplayName", specifier.Values[0]);
                return true;
            }
            return false;
        }],
    ["FriendlyName", (specifier, metaData) => {
            if (specifier.IsMetaKeyValue()) {
                metaData.set("FriendlyName", specifier.Values[0]);
                return true;
            }
            return false;
        }],
    ["BlueprintInternalUseOnly", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("BlueprintInternalUseOnly", 'true');
                metaData.set("BlueprintType", 'true');
                return true;
            }
            return false;
        }],
    ["BlueprintType", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("BlueprintType", 'true');
                return true;
            }
            return false;
        }],
    ["NotBlueprintType", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("NotBlueprintType", 'true');
                metaData.delete('BlueprintType');
                return true;
            }
            return false;
        }],
    ["Blueprintable", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("IsBlueprintBase", 'true');
                metaData.set("BlueprintType", 'true');
                return true;
            }
            return false;
        }],
    ["CallInEditor", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("CallInEditor", 'true');
                return true;
            }
            return false;
        }],
    ["NotBlueprintable", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("IsBlueprintBase", 'false');
                metaData.delete("BlueprintType");
                return true;
            }
            return false;
        }],
    ["Category", (specifier, metaData) => {
            if (specifier.IsMetaKeyValue()) {
                metaData.set("Category", specifier.Values[0]);
                return true;
            }
            return false;
        }],
    ["Experimental", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("DevelopmentStatus", "Experimental");
                return true;
            }
            return false;
        }],
    ["EarlyAccessPreview", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("DevelopmentStatus", "EarlyAccessPreview");
                return true;
            }
            return false;
        }],
    ["DocumentationPolicy", (specifier, metaData) => {
            if (specifier.IsMetaKey()) {
                metaData.set("DocumentationPolicy", 'Strict');
                return true;
            }
            return false;
        }],
    ["SparseClassDataType", (specifier, metaData) => {
            if (specifier.IsMetaKeyValue()) {
                metaData.set("SparseClassDataType", specifier.Values[0]);
                return true;
            }
            return false;
        }]
]);
;
function getCustomSystem() {
    const customSystem = {
        args: [],
        newLine: '\n',
        useCaseSensitiveFileNames: true,
        write,
        readFile,
        writeFile,
        resolvePath: tsi.resolvePath,
        fileExists,
        directoryExists: tsi.directoryExists,
        createDirectory: tsi.createDirectory,
        getExecutingFilePath,
        getCurrentDirectory,
        getDirectories,
        readDirectory,
        exit,
    };
    function fileExists(path) {
        let res = UE.FileSystemOperation.FileExists(path);
        //console.log(`${path} exists? ${res}`);
        return res;
    }
    function write(s) {
        console.log(s);
    }
    function readFile(path, encoding) {
        let data = puerts_1.$ref(undefined);
        const res = UE.FileSystemOperation.ReadFile(path, data);
        if (res) {
            return puerts_1.$unref(data);
        }
        else {
            console.warn("readFile: read file fail! path=" + path + ", stack:" + new Error().stack);
            return undefined;
        }
    }
    function writeFile(path, data, writeByteOrderMark) {
        throw new Error("forbiden!");
    }
    /*function resolvePath(path: string): string {
        throw new Error("resolvePath no supported!");
    }*/
    function readDirectory(path, extensions, excludes, includes, depth) {
        //throw new Error("readDirectory no supported!");
        return tsi.matchFiles(path, extensions, excludes, includes, true, getCurrentDirectory(), depth, tsi.getAccessibleFileSystemEntries, tsi.realpath);
    }
    function exit(exitCode) {
        throw new Error("exit with code:" + exitCode);
    }
    function getExecutingFilePath() {
        return getCurrentDirectory() + "Content/JavaScript/PuertsEditor/node_modules/typescript/lib/tsc.js";
    }
    function getCurrentDirectory() {
        return UE.FileSystemOperation.GetCurrentDirectory();
    }
    function getDirectories(path) {
        let result = [];
        let dirs = UE.FileSystemOperation.GetDirectories(path);
        for (var i = 0; i < dirs.Num(); i++) {
            result.push(dirs.Get(i));
        }
        return result;
    }
    //for debug only
    /*return new Proxy({}, {
        get: function(target, name) {
            if (!(name in target)) {
                if (typeof name === 'string') {
                    if (!(name in tgamejsSystem)) {
                        return undefined;
                    }
                    let maybeFunc = tgamejsSystem[name];
                    if (typeof maybeFunc === 'function') {
                        target[name] = function(...args: any[]) {
                            const res = maybeFunc(...args);
                            console.log("method:", name, ", args:", JSON.stringify(args), ",res:", res);
                            return res;
                        }
                    } else {
                        target[name] = tgamejsSystem[name];
                    }
                }
            }

            return target[name]
        }
    }) as ts.System;*/
    return customSystem;
}
let customSystem = getCustomSystem();
if (!ts.sys) {
    let t = ts;
    t.sys = customSystem;
}
function logErrors(allDiagnostics) {
    allDiagnostics.forEach(diagnostic => {
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            console.error(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.error(`  Error: ${message}`);
        }
    });
}
const FunctionFlags = {
    FUNC_None: 0x00000000,
    FUNC_Final: 0x00000001,
    FUNC_RequiredAPI: 0x00000002,
    FUNC_BlueprintAuthorityOnly: 0x00000004,
    FUNC_BlueprintCosmetic: 0x00000008,
    // FUNC_				: 0x00000010,   // unused.
    // FUNC_				: 0x00000020,   // unused.
    FUNC_Net: 0x00000040,
    FUNC_NetReliable: 0x00000080,
    FUNC_NetRequest: 0x00000100,
    FUNC_Exec: 0x00000200,
    FUNC_Native: 0x00000400,
    FUNC_Event: 0x00000800,
    FUNC_NetResponse: 0x00001000,
    FUNC_Static: 0x00002000,
    FUNC_NetMulticast: 0x00004000,
    FUNC_UbergraphFunction: 0x00008000,
    FUNC_MulticastDelegate: 0x00010000,
    FUNC_Public: 0x00020000,
    FUNC_Private: 0x00040000,
    FUNC_Protected: 0x00080000,
    FUNC_Delegate: 0x00100000,
    FUNC_NetServer: 0x00200000,
    FUNC_HasOutParms: 0x00400000,
    FUNC_HasDefaults: 0x00800000,
    FUNC_NetClient: 0x01000000,
    FUNC_DLLImport: 0x02000000,
    FUNC_BlueprintCallable: 0x04000000,
    FUNC_BlueprintEvent: 0x08000000,
    FUNC_BlueprintPure: 0x10000000,
    FUNC_EditorOnly: 0x20000000,
    FUNC_Const: 0x40000000,
    FUNC_NetValidate: 0x80000000,
    FUNC_AllFlags: 0xFFFFFFFF,
};
const PropertyFlags = {
    CPF_None: 0,
    CPF_Edit: 0x0000000000000001,
    CPF_ConstParm: 0x0000000000000002,
    CPF_BlueprintVisible: 0x0000000000000004,
    CPF_ExportObject: 0x0000000000000008,
    CPF_BlueprintReadOnly: 0x0000000000000010,
    CPF_Net: 0x0000000000000020,
    CPF_EditFixedSize: 0x0000000000000040,
    CPF_Parm: 0x0000000000000080,
    CPF_OutParm: 0x0000000000000100,
    CPF_ZeroConstructor: 0x0000000000000200,
    CPF_ReturnParm: 0x0000000000000400,
    CPF_DisableEditOnTemplate: 0x0000000000000800,
    //CPF_      						: 0x0000000000001000,	///< 
    CPF_Transient: 0x0000000000002000,
    CPF_Config: 0x0000000000004000,
    //CPF_								: 0x0000000000008000,	///< 
    CPF_DisableEditOnInstance: 0x0000000000010000,
    CPF_EditConst: 0x0000000000020000,
    CPF_GlobalConfig: 0x0000000000040000,
    CPF_InstancedReference: 0x0000000000080000,
    //CPF_								: 0x0000000000100000,	///<
    CPF_DuplicateTransient: 0x0000000000200000,
    CPF_SubobjectReference: 0x0000000000400000,
    //CPF_    							: 0x0000000000800000,	///< 
    CPF_SaveGame: 0x0000000001000000,
    CPF_NoClear: 0x0000000002000000,
    //CPF_  							: 0x0000000004000000,	///<
    CPF_ReferenceParm: 0x0000000008000000,
    CPF_BlueprintAssignable: 0x0000000010000000,
    CPF_Deprecated: 0x0000000020000000,
    CPF_IsPlainOldData: 0x0000000040000000,
    CPF_RepSkip: 0x0000000080000000,
    CPF_RepNotify: 0x0000000100000000,
    CPF_Interp: 0x0000000200000000,
    CPF_NonTransactional: 0x0000000400000000,
    CPF_EditorOnly: 0x0000000800000000,
    CPF_NoDestructor: 0x0000001000000000,
    //CPF_								: 0x0000002000000000,	///<
    CPF_AutoWeak: 0x0000004000000000,
    CPF_ContainsInstancedReference: 0x0000008000000000,
    CPF_AssetRegistrySearchable: 0x0000010000000000,
    CPF_SimpleDisplay: 0x0000020000000000,
    CPF_AdvancedDisplay: 0x0000040000000000,
    CPF_Protected: 0x0000080000000000,
    CPF_BlueprintCallable: 0x0000100000000000,
    CPF_BlueprintAuthorityOnly: 0x0000200000000000,
    CPF_TextExportTransient: 0x0000400000000000,
    CPF_NonPIEDuplicateTransient: 0x0000800000000000,
    CPF_ExposeOnSpawn: 0x0001000000000000,
    CPF_PersistentInstance: 0x0002000000000000,
    CPF_UObjectWrapper: 0x0004000000000000,
    CPF_HasGetValueTypeHash: 0x0008000000000000,
    CPF_NativeAccessSpecifierPublic: 0x0010000000000000,
    CPF_NativeAccessSpecifierProtected: 0x0020000000000000,
    CPF_NativeAccessSpecifierPrivate: 0x0040000000000000,
    CPF_SkipSerialization: 0x0080000000000000,
};
const ELifetimeCondition = {
    "COND_InitialOnly": 1,
    "COND_OwnerOnly": 2,
    "COND_SkipOwner": 3,
    "COND_SimulatedOnly": 4,
    "COND_AutonomousOnly": 5,
    "COND_SimulatedOrPhysics": 6,
    "COND_InitialOrOwner": 7,
    "COND_Custom": 8,
    "COND_ReplayOrOwner": 9,
    "COND_ReplayOnly": 10,
    "COND_SimulatedOnlyNoReplay": 11,
    "COND_SimulatedOrPhysicsNoReplay": 12,
    "COND_SkipReplay": 13,
    "COND_Never": 15,
};
function readAndParseConfigFile(configFilePath) {
    let readResult = ts.readConfigFile(configFilePath, customSystem.readFile);
    return ts.parseJsonConfigFileContent(readResult.config, {
        useCaseSensitiveFileNames: true,
        readDirectory: customSystem.readDirectory,
        fileExists: customSystem.fileExists,
        readFile: customSystem.readFile,
        trace: s => console.log(s)
    }, customSystem.getCurrentDirectory());
}
function watch(configFilePath) {
    let { fileNames, options } = readAndParseConfigFile(configFilePath);
    console.log("start watch..", JSON.stringify({ fileNames: fileNames, options: options }));
    const versionsFilePath = tsi.getDirectoryPath(configFilePath) + "/ts_file_versions_info.json";
    const fileVersions = {};
    let beginTime = new Date().getTime();
    fileNames.forEach(fileName => {
        fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false, isBP: false };
    });
    console.log("calc md5 using " + (new Date().getTime() - beginTime) + "ms");
    function getDefaultLibLocation() {
        return tsi.getDirectoryPath(tsi.normalizePath(customSystem.getExecutingFilePath()));
    }
    const scriptSnapshotsCache = new Map();
    // Create the language service host to allow the LS to communicate with the host
    const servicesHost = {
        getScriptFileNames: () => fileNames,
        getScriptVersion: fileName => {
            if (fileName in fileVersions) {
                return fileVersions[fileName] && fileVersions[fileName].version.toString();
            }
            else {
                let md5 = UE.FileSystemOperation.FileMD5Hash(fileName);
                fileVersions[fileName] = { version: md5, processed: false };
                return md5;
            }
        },
        getScriptSnapshot: fileName => {
            if (!customSystem.fileExists(fileName)) {
                console.error("getScriptSnapshot: file not existed! path=" + fileName);
                return undefined;
            }
            if (!(fileName in fileVersions)) {
                fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false };
            }
            if (!scriptSnapshotsCache.has(fileName)) {
                const sourceFile = customSystem.readFile(fileName);
                if (!sourceFile) {
                    console.error("getScriptSnapshot: read file failed! path=" + fileName);
                    return undefined;
                }
                scriptSnapshotsCache.set(fileName, {
                    version: fileVersions[fileName].version,
                    scriptSnapshot: ts.ScriptSnapshot.fromString(sourceFile)
                });
            }
            let scriptSnapshotsInfo = scriptSnapshotsCache.get(fileName);
            if (scriptSnapshotsInfo.version != fileVersions[fileName].version) {
                const sourceFile = customSystem.readFile(fileName);
                if (!sourceFile) {
                    console.error("getScriptSnapshot: read file failed! path=" + fileName);
                    return undefined;
                }
                scriptSnapshotsInfo.version = fileVersions[fileName].version;
                scriptSnapshotsInfo.scriptSnapshot = ts.ScriptSnapshot.fromString(sourceFile);
            }
            //console.log("getScriptSnapshot:"+ fileName + ",in:" + new Error().stack)
            return scriptSnapshotsInfo.scriptSnapshot;
        },
        getCurrentDirectory: customSystem.getCurrentDirectory,
        getCompilationSettings: () => options,
        getDefaultLibFileName: options => tsi.combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options)),
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories,
    };
    let service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    function getProgramFromService() {
        while (true) {
            try {
                return service.getProgram();
            }
            catch (e) {
                console.error(e);
            }
            //异常了从新创建Language Service，有可能不断失败,UE的文件读取偶尔会失败，失败后ts增量编译会不断的在tryReuseStructureFromOldProgram那断言失败
            service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        }
    }
    beginTime = new Date().getTime();
    let program = getProgramFromService();
    console.log("full compile using " + (new Date().getTime() - beginTime) + "ms");
    let diagnostics = ts.getPreEmitDiagnostics(program);
    let restoredFileVersions = {};
    var changed = false;
    if (customSystem.fileExists(versionsFilePath)) {
        try {
            restoredFileVersions = JSON.parse(customSystem.readFile(versionsFilePath));
            console.log("restore versions from ", versionsFilePath);
        }
        catch { }
    }
    if (diagnostics.length > 0) {
        fileNames.forEach(fileName => {
            fileVersions[fileName] = restoredFileVersions[fileName] || fileVersions[fileName];
        });
        logErrors(diagnostics);
    }
    else {
        function getClassPathInfo(sourceFilePath) {
            let modulePath = undefined;
            let moduleFileName = undefined;
            if (sourceFilePath.endsWith(".ts")) {
                if (options.baseUrl && sourceFilePath.startsWith(options.baseUrl)) {
                    moduleFileName = sourceFilePath.substr(options.baseUrl.length + 1);
                    modulePath = tsi.getDirectoryPath(moduleFileName);
                    moduleFileName = tsi.removeExtension(moduleFileName, ".ts");
                }
            }
            return { moduleFileName, modulePath };
        }
        fileNames.forEach(fileName => {
            if (!(fileName in restoredFileVersions) || restoredFileVersions[fileName].version != fileVersions[fileName].version || !restoredFileVersions[fileName].processed) {
                onSourceFileAddOrChange(fileName, false, program, true, false);
                changed = true;
            }
            else {
                fileVersions[fileName].processed = true;
            }
            if (fileName in restoredFileVersions) {
                fileVersions[fileName].isBP = restoredFileVersions[fileName].isBP;
            }
        });
        fileNames.forEach(fileName => {
            if (!(fileName in restoredFileVersions))
                return;
            if (!restoredFileVersions[fileName].isBP)
                return;
            const { moduleFileName, modulePath } = getClassPathInfo(fileName);
            let BPExisted = false;
            if (moduleFileName) {
                BPExisted = UE.PEBlueprintAsset.Existed(moduleFileName, modulePath);
            }
            if (restoredFileVersions[fileName].version != fileVersions[fileName].version || !restoredFileVersions[fileName].processed || !BPExisted) {
                onSourceFileAddOrChange(fileName, false, program, false);
                changed = true;
            }
            else {
                fileVersions[fileName].processed = true;
            }
        });
        if (changed) {
            UE.FileSystemOperation.WriteFile(versionsFilePath, JSON.stringify(fileVersions, null, 4));
        }
    }
    var dirWatcher = new UE.PEDirectoryWatcher();
    global.__dirWatcher = dirWatcher; //防止被释放?
    dirWatcher.OnChanged.Add((added, modified, removed) => {
        setTimeout(() => {
            var changed = false;
            if (added.Num() > 0) {
                onFileAdded();
                changed = true;
            }
            if (modified.Num() > 0) {
                for (var i = 0; i < modified.Num(); i++) {
                    const fileName = modified.Get(i);
                    if (fileName in fileVersions) {
                        let md5 = UE.FileSystemOperation.FileMD5Hash(fileName);
                        if (md5 === fileVersions[fileName].version) {
                            console.log(fileName + " md5 not changed, so skiped!");
                        }
                        else {
                            console.log(`${fileName} md5 from ${fileVersions[fileName].version} to ${md5}`);
                            fileVersions[fileName].version = md5;
                            onSourceFileAddOrChange(fileName, true);
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                console.log("versions saved to " + versionsFilePath);
                UE.FileSystemOperation.WriteFile(versionsFilePath, JSON.stringify(fileVersions, null, 4));
            }
        }, 100); //延时100毫秒，防止因为读冲突而文件读取失败
    });
    dirWatcher.Watch(customSystem.getCurrentDirectory());
    function onFileAdded() {
        let cmdLine = readAndParseConfigFile(configFilePath);
        let newFiles = [];
        cmdLine.fileNames.forEach(fileName => {
            if (!(fileName in fileVersions)) {
                console.log(`new file: ${fileName} ...`);
                newFiles.push(fileName);
                fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false };
            }
        });
        if (newFiles.length > 0) {
            fileNames = cmdLine.fileNames;
            options = cmdLine.options;
            program = getProgramFromService();
            newFiles.forEach(fileName => onSourceFileAddOrChange(fileName, true, program));
        }
    }
    function onSourceFileAddOrChange(sourceFilePath, reload, program, doEmitJs = true, doEmitBP = true) {
        if (!program) {
            let beginTime = new Date().getTime();
            program = getProgramFromService();
            console.log("incremental compile " + sourceFilePath + " using " + (new Date().getTime() - beginTime) + "ms");
        }
        let sourceFile = program.getSourceFile(sourceFilePath);
        if (sourceFile) {
            const diagnostics = [
                ...program.getSyntacticDiagnostics(sourceFile),
                ...program.getSemanticDiagnostics(sourceFile)
            ];
            let checker = program.getTypeChecker();
            if (diagnostics.length > 0) {
                logErrors(diagnostics);
            }
            else {
                if (doEmitBP) {
                    fileVersions[sourceFilePath].isBP = false;
                }
                fileVersions[sourceFilePath].processed = true;
                if (!sourceFile.isDeclarationFile) {
                    let emitOutput = service.getEmitOutput(sourceFilePath);
                    if (!emitOutput.emitSkipped) {
                        let modulePath = undefined;
                        let moduleFileName = undefined;
                        let jsSource = undefined;
                        emitOutput.outputFiles.forEach(output => {
                            if (doEmitJs) {
                                console.log(`write ${output.name} ...`);
                                UE.FileSystemOperation.WriteFile(output.name, output.text);
                            }
                            if (output.name.endsWith(".js")) {
                                jsSource = output.text;
                                if (options.outDir && output.name.startsWith(options.outDir)) {
                                    moduleFileName = output.name.substr(options.outDir.length + 1);
                                    modulePath = tsi.getDirectoryPath(moduleFileName);
                                    moduleFileName = tsi.removeExtension(moduleFileName, ".js");
                                }
                            }
                        });
                        if (moduleFileName && reload) {
                            UE.FileSystemOperation.PuertsNotifyChange(moduleFileName, jsSource);
                        }
                        if (!doEmitBP)
                            return;
                        let foundType = undefined;
                        let foundBaseTypeUClass = undefined;
                        ts.forEachChild(sourceFile, (node) => {
                            if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
                                const type = checker.getTypeAtLocation(node.expression);
                                if (!type || !type.getSymbol())
                                    return;
                                if (type.getSymbol().getName() != tsi.getBaseFileName(moduleFileName)) {
                                    //console.error("type name must the same as file name!");
                                    return;
                                }
                                let baseTypes = type.getBaseTypes();
                                if (!baseTypes || baseTypes.length != 1)
                                    return;
                                let structOfType = getUClassOfType(baseTypes[0]);
                                let baseTypeUClass = undefined;
                                if (!structOfType) {
                                    return;
                                }
                                if (structOfType.GetClass().IsChildOf(UE.Class.StaticClass())) {
                                    baseTypeUClass = structOfType;
                                }
                                else {
                                    console.warn("do not support UStruct:" + checker.typeToString(type));
                                    return;
                                }
                                if (baseTypeUClass) {
                                    if (isSubclassOf(type, "Subsystem")) {
                                        console.warn("do not support Subsystem " + checker.typeToString(type));
                                        return;
                                    }
                                    foundType = type;
                                    foundBaseTypeUClass = baseTypeUClass;
                                }
                                else {
                                    console.warn("can not find base for " + checker.typeToString(type));
                                }
                            }
                        });
                        if (foundType && foundBaseTypeUClass) {
                            fileVersions[sourceFilePath].isBP = true;
                            onBlueprintTypeAddOrChange(foundBaseTypeUClass, foundType, modulePath);
                        }
                    }
                }
            }
            function typeNameToString(node) {
                if (ts.isIdentifier(node)) {
                    return node.text;
                }
                else {
                    return node.right.text;
                }
            }
            function isSubclassOf(type, baseTypeName) {
                let baseTypes = type.getBaseTypes();
                if (baseTypes.length != 1)
                    return false;
                if (baseTypes[0].getSymbol().getName() == baseTypeName) {
                    return true;
                }
                return isSubclassOf(baseTypes[0], baseTypeName);
            }
            function getUClassOfType(type) {
                if (!type)
                    return undefined;
                let moduleNames = getModuleNames(type);
                if (moduleNames.length > 0 && moduleNames[0] == 'ue') {
                    if (moduleNames.length == 1) {
                        try {
                            let jsCls = UE[type.symbol.getName()];
                            if (typeof jsCls.StaticClass == 'function') {
                                return jsCls.StaticClass();
                            }
                        }
                        catch (e) {
                            console.error(`load ue type [${type.symbol.getName()}], throw: ${e}`);
                        }
                    }
                    else if (moduleNames.length == 2) {
                        let classPath = '/' + moduleNames[1] + '.' + type.symbol.getName();
                        return UE.Field.Load(classPath);
                    }
                }
                else if (type.symbol && type.symbol.valueDeclaration) {
                    //eturn undefined;
                    let baseTypes = type.getBaseTypes();
                    if (!baseTypes || baseTypes.length != 1)
                        return undefined;
                    let baseTypeUClass = getUClassOfType(baseTypes[0]);
                    if (!baseTypeUClass)
                        return undefined;
                    //console.error("modulePath:", getModulePath(type.symbol.valueDeclaration.getSourceFile().fileName));
                    let sourceFile = type.symbol.valueDeclaration.getSourceFile();
                    let sourceFileName;
                    program.emit(sourceFile, writeFile, undefined, false, undefined);
                    function writeFile(fileName, text, writeByteOrderMark) {
                        if (fileName.endsWith('.js')) {
                            sourceFileName = tsi.removeExtension(fileName, '.js');
                        }
                    }
                    if (tsi.getBaseFileName(sourceFileName) != type.symbol.getName()) {
                        console.error("type name must the same as file name!");
                        return undefined;
                    }
                    if (options.outDir && sourceFileName.startsWith(options.outDir)) {
                        let moduleFileName = sourceFileName.substr(options.outDir.length + 1);
                        let modulePath = tsi.getDirectoryPath(moduleFileName);
                        let bp = new UE.PEBlueprintAsset();
                        bp.LoadOrCreate(type.getSymbol().getName(), modulePath, baseTypeUClass, 0, 0);
                        bp.Save();
                        return bp.GeneratedClass;
                    }
                }
            }
            function getSymbolTypeNode(symbol) {
                if (symbol.valueDeclaration) {
                    for (var i = symbol.valueDeclaration.getChildCount() - 1; i >= 0; i--) {
                        var child = symbol.valueDeclaration.getChildAt(i);
                        if (child.kind == ts.SyntaxKind.TypeReference) {
                            return child;
                        }
                    }
                }
            }
            function tsTypeToPinType(type, node) {
                if (!type)
                    return undefined;
                try {
                    let typeNode = checker.typeToTypeNode(type, undefined, undefined);
                    //console.log(checker.typeToString(type), tds)
                    if (ts.isTypeReferenceNode(typeNode) && type.symbol) {
                        let typeName = type.symbol.getName();
                        if (typeName == 'BigInt') {
                            let category = "int64";
                            let pinType = new UE.PEGraphPinType(category, undefined, UE.EPinContainerType.None, false, false);
                            return { pinType: pinType };
                        }
                        if (!typeNode.typeArguments || typeNode.typeArguments.length == 0) {
                            let category = "object";
                            let uclass = getUClassOfType(type);
                            if (!uclass) {
                                let uenum = UE.Enum.Find(type.symbol.getName());
                                if (uenum) {
                                    return { pinType: new UE.PEGraphPinType("byte", uenum, UE.EPinContainerType.None, false, false) };
                                }
                                console.warn("can not find type of " + typeName);
                                return undefined;
                            }
                            let pinType = new UE.PEGraphPinType(category, uclass, UE.EPinContainerType.None, false, false);
                            return { pinType: pinType };
                        }
                        else { //TArray, TSet, TMap
                            let typeRef = type;
                            var children = [];
                            let typeArguments = typeRef.typeArguments || typeRef.aliasTypeArguments;
                            if (typeRef.aliasTypeArguments && typeRef.aliasSymbol) {
                                typeName = typeRef.aliasSymbol.getName();
                            }
                            if (!typeArguments) {
                                console.warn("can not find type arguments of " + node.getFullText());
                                return undefined;
                            }
                            if (node) {
                                node.forEachChild(child => {
                                    children.push(child);
                                });
                            }
                            let result = tsTypeToPinType(typeArguments[0], children[1]);
                            if (!result || result.pinType.PinContainerType != UE.EPinContainerType.None && typeName != '$Ref' && typeName != '$InRef') {
                                console.warn("can not find pin type of typeArguments[0] " + typeName);
                                return undefined;
                            }
                            if (children[1]) {
                                postProcessPinType(children[1], result.pinType, false);
                            }
                            if (typeName == 'TArray' || typeName == 'TSet') {
                                result.pinType.PinContainerType = typeName == 'TArray' ? UE.EPinContainerType.Array : UE.EPinContainerType.Set;
                                return result;
                            }
                            else if (typeName == 'TSubclassOf') {
                                let category = "class";
                                result.pinType.PinCategory = category;
                                return result;
                            }
                            else if (typeName == 'TSoftObjectPtr') {
                                let category = "softobject";
                                result.pinType.PinCategory = category;
                                return result;
                            }
                            else if (typeName == 'TSoftClassPtr') {
                                let category = "softclass";
                                result.pinType.PinCategory = category;
                                return result;
                            }
                            else if (typeName == '$Ref') {
                                result.pinType.bIsReference = true;
                                return result;
                            }
                            else if (typeName == '$InRef') {
                                result.pinType.bIsReference = true;
                                result.pinType.bIn = true;
                                return result;
                            }
                            else if (typeName == 'TMap') {
                                let valuePinType = tsTypeToPinType(typeArguments[1], undefined);
                                if (!valuePinType || valuePinType.pinType.PinContainerType != UE.EPinContainerType.None) {
                                    console.warn("can not find pin type of typeArguments[1] " + typeName);
                                    return undefined;
                                }
                                if (children[2]) {
                                    postProcessPinType(children[2], valuePinType.pinType, false);
                                }
                                result.pinType.PinContainerType = UE.EPinContainerType.Map;
                                result.pinValueType = new UE.PEGraphTerminalType(valuePinType.pinType.PinCategory, valuePinType.pinType.PinSubCategoryObject);
                                return result;
                            }
                            else {
                                console.warn("not support generic type: " + typeName);
                                return undefined;
                            }
                        }
                    }
                    else {
                        //"bool" | "class" | "int64" | "string" | "object" | "struct" | "float";
                        let category;
                        switch (typeNode.kind) {
                            case ts.SyntaxKind.NumberKeyword:
                                category = "float";
                                break;
                            case ts.SyntaxKind.StringKeyword:
                                category = 'string';
                                break;
                            case ts.SyntaxKind.BigIntKeyword:
                                category = 'int64';
                                break;
                            case ts.SyntaxKind.BooleanKeyword:
                                category = 'bool';
                                break;
                            default:
                                console.warn("not support kind: " + typeNode.kind);
                                return undefined;
                        }
                        let pinType = new UE.PEGraphPinType(category, undefined, UE.EPinContainerType.None, false, false);
                        return { pinType: pinType };
                    }
                }
                catch (e) {
                    console.error(e.stack || e);
                    return undefined;
                }
            }
            function manualSkip(valueDeclaration) {
                const commentRanges = ts.getLeadingCommentRanges(sourceFile.getFullText(), valueDeclaration.getFullStart());
                return !!(commentRanges && commentRanges.find(r => sourceFile.getFullText().slice(r.pos, r.end).indexOf("@no-blueprint") > 0)) || hasDecorator(valueDeclaration, "no_blueprint");
            }
            function tryGetAnnotation(valueDeclaration, key, leading) {
                const commentRanges = (leading ? ts.getLeadingCommentRanges : ts.getTrailingCommentRanges)(sourceFile.getFullText(), valueDeclaration.getFullStart() + (leading ? 0 : valueDeclaration.getFullWidth()));
                if (commentRanges) {
                    let ret;
                    commentRanges.forEach(r => {
                        let m = sourceFile.getFullText().slice(r.pos, r.end).match(new RegExp(`@${key}:([^*]*)`));
                        if (m) {
                            ret = m[1].trim();
                        }
                    });
                    return ret;
                }
            }
            function postProcessPinType(valueDeclaration, pinType, leading) {
                if (pinType.PinContainerType == UE.EPinContainerType.None) {
                    let pc = pinType.PinCategory;
                    if (pc === "float") {
                        let cppType = tryGetAnnotation(valueDeclaration, "cpp", leading);
                        if (cppType === "int" || cppType === "byte") {
                            pinType.PinCategory = cppType;
                        }
                    }
                    else if (pc === "string") {
                        let cppType = tryGetAnnotation(valueDeclaration, "cpp", leading);
                        if (cppType === "name" || cppType === "text") {
                            pinType.PinCategory = cppType;
                        }
                    }
                }
            }
            function getFlagsValue(str, flagsDef) {
                if (!str)
                    return 0;
                return str.split("|").map(x => x.trim()).map(x => x in flagsDef ? flagsDef[x] : 0).reduce((x, y) => x | y);
            }
            function getDecoratorFlagsValue(valueDeclaration, posfix, flagsDef) {
                if (valueDeclaration && valueDeclaration.decorators) {
                    let decorators = valueDeclaration.decorators;
                    let ret = 0n;
                    decorators.forEach((decorator, index) => {
                        let expression = decorator.expression;
                        if (ts.isCallExpression(expression)) {
                            if (expression.expression.getFullText() == posfix || expression.expression.getFullText().endsWith('.' + posfix)) {
                                expression.arguments.forEach((value, index) => {
                                    let e = value.getFullText().split("|").map(x => x.trim().replace(/^.*[\.]/, ''))
                                        .map(x => x in flagsDef ? BigInt(flagsDef[x]) : 0n)
                                        .reduce((x, y) => BigInt(x) | BigInt(y));
                                    ret = ret | e;
                                });
                            }
                        }
                    });
                    return ret;
                }
                else {
                    return 0n;
                }
            }
            function hasDecorator(valueDeclaration, posfix) {
                let ret = false;
                if (valueDeclaration && valueDeclaration.decorators) {
                    let decorators = valueDeclaration.decorators;
                    decorators.forEach((decorator, index) => {
                        let expression = decorator.expression;
                        if (ts.isCallExpression(expression)) {
                            if (expression.expression.getFullText() == posfix || expression.expression.getFullText().endsWith('.' + posfix)) {
                                ret = true;
                            }
                        }
                    });
                }
                return ret;
            }
            /**
             * a helper function used to extract the meta key from an expression
             * @param expression
             * @param prefix
             * @param regExp
             * @returns
             */
            function extractMetaSpecifierFromExpression(expression, prefix, regExp) {
                const execRegExp = regExp == null ? new RegExp(`^${prefix}\.([A-Za-z]+)$`) : regExp;
                const execResult = execRegExp.exec(expression.getText().trim());
                if (execResult == null) { // should capture the result
                    return null;
                }
                return new MetaSpecifier(execResult[1]);
            }
            /**
             * a helper function used to extract the meta key value from an expression
             * @param expression
             * @param prefix
             * @param regExp
             * @returns
             */
            function extractMetaSpecifierFromBinaryExpression(expression, prefix, regExp) {
                const execRegExp = regExp == null ? new RegExp(`^${prefix}\.([A-Za-z]+)$`) : regExp;
                const execResult = execRegExp.exec(expression.left.getText().trim());
                if (execResult == null) {
                    return null;
                }
                let values = new Array();
                if (ts.isStringLiteral(expression.right)) { // specifier = value
                    values.push(expression.right.text);
                }
                else if (ts.isArrayLiteralExpression(expression.right)) { // specifier = [value1, value2, value3]
                    let bValid = true;
                    expression.right.elements.forEach((value) => {
                        if (!bValid) {
                            return;
                        }
                        if (!ts.isStringLiteral(value)) {
                            bValid = false;
                            return;
                        }
                        values.push(value.text);
                    });
                    if (!bValid) {
                        return null;
                    }
                }
                else { // invalid format
                    return null;
                }
                return new MetaSpecifier(execResult[1], values);
            }
            /**
             * collect the meta data from the prefix section, @see ObjectMacros.h namespace uc,
             *      for meta data defined in umeta section, all kinds of meta data are valid
             * @param expressions
             * @param prefix
             * @param specifiers
             * @param metaData
             * @param keyRegExp
             * @param keyValueRegExp
             */
            function collectMetaDataFromIdentifyDecorator(expressions, prefix, specifiers, metaData, keyRegExp, keyValueRegExp) {
                const MetaKeyValueRegExp = keyValueRegExp == null ? new RegExp(`^${prefix}\.([A-Za-z]+)$`) : keyValueRegExp;
                const MetaKeyRegExp = keyRegExp == null ? new RegExp(`^${prefix}\.([A-Za-z]+)$`) : keyRegExp;
                expressions.forEach((value) => {
                    let metaSpecifier;
                    if (ts.isBinaryExpression(value)) { // should be the meta key value or , ${prefix}.identifier = (value);
                        metaSpecifier = extractMetaSpecifierFromBinaryExpression(value, prefix, MetaKeyValueRegExp);
                    }
                    else { // should be the meta key
                        metaSpecifier = extractMetaSpecifierFromExpression(value, prefix, MetaKeyRegExp);
                    }
                    if (metaSpecifier == null) {
                        console.warn(`the ${prefix}: ${value.getFullText()} is not valid meta data`);
                        return;
                    }
                    const applyResult = metaSpecifier.ApplyInIdentity(metaData);
                    if (applyResult == null) {
                        console.warn(`the ${prefix}: ${value.getFullText()} is not valid meta data`);
                    }
                    else if (applyResult == false) { // unknown specifier currently
                        specifiers.push(metaSpecifier);
                    }
                });
            }
            /**
             * collect the meta data from the umeta section, @see ObjectMacros.h namespace um,
             *      for meta data defined in umeta section, only key or key value is legal
             * @param expressions
             * @param prefix
             * @param specifiers
             * @param metaData
             * @param keyRegExp
             * @param keyValueRegExp
             */
            function collectMetaDataFromMetaDecorator(expressions, prefix, specifiers, metaData, keyRegExp, keyValueRegExp) {
                const MetaKeyValueRegExp = keyValueRegExp == null ? new RegExp(`^${prefix}\.([A-Za-z]+)$`) : keyValueRegExp;
                const MetaKeyRegExp = keyRegExp == null ? new RegExp(`^${prefix}\.([A-Za-z]+)$`) : keyRegExp;
                expressions.forEach((value) => {
                    let metaSpecifier;
                    if (ts.isBinaryExpression(value)) { // should be the meta key value or , ${prefix}.identifier.assign(value);
                        metaSpecifier = extractMetaSpecifierFromBinaryExpression(value, prefix, MetaKeyValueRegExp);
                    }
                    else { // should be the meta key
                        metaSpecifier = extractMetaSpecifierFromExpression(value, prefix, MetaKeyRegExp);
                    }
                    if (metaSpecifier == null) {
                        console.warn(`the umeta: ${value.getFullText()} is not valid meta data`);
                        return;
                    }
                    const applyResult = metaSpecifier.ApplyInMeta(metaData);
                    if (applyResult == null) {
                        console.warn(`the umeta: ${value.getFullText()} is not valid meta data`);
                    }
                    else if (applyResult == false) { // unknown specifier currently, this should never happen
                        console.warn(`logic error: umeta data should never be unrecognized`);
                    }
                });
            }
            /**
             * collect the meta data from a specific decorator, the format of decorator @see getMetaDataFromDecorators
             * @param decorator
             * @param prefix
             * @param specifiers
             * @param metaData
             */
            function collectMetaDataFromDecorator(decorator, prefix, specifiers, metaData) {
                let expression = decorator.expression;
                if (!ts.isCallExpression(expression)) {
                    return;
                }
                const expressionText = expression.expression.getFullText(); //  get the callable signature
                //  should use cache to hold the reg exp object ?
                if (new RegExp(`^${prefix}\.${prefix}$`).test(expressionText)) { // the decorator match @prefix.prefix
                    collectMetaDataFromIdentifyDecorator(expression.arguments, prefix, specifiers, metaData);
                }
                else if (new RegExp(`^${prefix}\.umeta$`).test(expressionText)) { // the decorator match @prefix.umeta
                    collectMetaDataFromMetaDecorator(expression.arguments, prefix, specifiers, metaData);
                }
            }
            /**
             * extract meta data from specific decorators, the format of the decorators follows:
             *      1. @${prefix}.${prefix}(meta1, ...),    e.g, @uclass.uclass(meta1, meta2, meta3...)
             *      2. @${prefix}.umeta(meta1, ...),        e.g, @uclass.umeta(meta1, meta2, meta3)
             * the meta data has there formats, the values used in meta data should be string literals
             *      1. ${prefix}.{identifier},                              e.g, @uclass.editinlinenew,                     this is a meta data key, put its name in array result
             *      2. ${prefix}.{identifier}.assign({value})               e.g, @uclass.DisplayName.assign("name")         this is a meta data key value, put its key and value in map result
             *      3. ${prefix}.{Identifier}.assign{{value1}, ... }        e.g, @uclass.hideCategories.assign("a", 'b')    this is a meta data key values, the values will pack into a string
             * @param decorators
             * @param prefix
             */
            function getMetaDataFromDecorators(decorators, prefix) {
                let specifiers = new Array();
                let metaData = new Map();
                if (decorators == null) {
                    return [specifiers, metaData];
                }
                decorators.forEach((value) => {
                    collectMetaDataFromDecorator(value, prefix, specifiers, metaData);
                });
                return [specifiers, metaData];
            }
            /**
             * process the specifiers specific to the class
             * @param specifiers
             * @param metaData
             */
            function processClassMetaData(specifiers, metaData) {
                let bValidSpecifiers = true;
                let InvalidSpecifier;
                let bWantsPlacable = false;
                let ClassFlags = UE.ClassFlags.CLASS_None;
                let WithIn = "";
                let ConfigName = "";
                let ShowCategories = new Set();
                let HideCategories = new Set();
                let ShowSubCategories = new Set();
                let HideFunctions = new Set();
                let ShowFunctions = new Set();
                let AutoExpandCategories = new Set();
                let AutoCollapseCategories = new Set();
                let DontAutoCollapseCategories = new Set();
                let ClassGroupNames = new Set();
                let SparseClassDataTypes = new Set();
                /**
                 * a helper function used to mark process error information
                 * @param specifier
                 */
                function markInvalidSpecifier(specifier) {
                    bValidSpecifiers = false;
                    InvalidSpecifier = specifier;
                }
                /**
                 * parse single meta specifier
                 * @param value
                 */
                function parseClassMetaSpecifier(value) {
                    if (!bValidSpecifiers) {
                        return;
                    }
                    switch (value.Specifier.toLowerCase()) {
                        case 'NoExport'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_NoExport;
                            break;
                        case 'Intrinsic'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_Intrinsic;
                            break;
                        case 'ComponentWrapperClass'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            metaData.set('IgnoreCategoryKeywordsInSubclasses', 'true');
                            break;
                        case 'Within'.toLowerCase():
                            if (!value.IsMetaKeyValue()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            WithIn = value.Values[0];
                            break;
                        case 'EditInlineNew'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_EditInlineNew;
                            break;
                        case 'NotEditInlineNew'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags & ~UE.ClassFlags.CLASS_EditInlineNew;
                            break;
                        case 'Placeable'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            bWantsPlacable = true;
                            ClassFlags = ClassFlags & ~UE.ClassFlags.CLASS_NotPlaceable;
                            break;
                        case 'DefaultToInstanced'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_DefaultToInstanced;
                            break;
                        case 'NotPlaceable'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_NotPlaceable;
                            break;
                        case 'HideDropdown'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_HideDropDown;
                            break;
                        case 'DependsOn'.toLowerCase():
                            console.log('currently depend on meta data specifier is not supported');
                            break;
                        case 'MinimalAPI'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_MinimalAPI;
                            break;
                        case 'Const'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_Const;
                            break;
                        case 'PerObjectConfig'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_PerObjectConfig;
                            break;
                        case 'ConfigDoNotCheckDefaults'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_ConfigDoNotCheckDefaults;
                            break;
                        case 'Abstract'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_Abstract;
                            break;
                        case 'Deprecated'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_Deprecated;
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_NotPlaceable;
                            break;
                        case 'Transient'.toLowerCase():
                            if (!value.IsMetaKey()) { // should be the meta key
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_Transient;
                            break;
                        case 'NonTransient'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags & ~UE.ClassFlags.CLASS_Transient;
                            break;
                        case 'CustomConstructor'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_CustomConstructor;
                            break;
                        case 'Config'.toLowerCase():
                            if (!value.IsMetaKeyValue()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ConfigName = value.Values[0];
                            break;
                        case 'DefaultConfig'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_DefaultConfig;
                            break;
                        case 'GlobalUserConfig'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_GlobalUserConfig;
                            break;
                        case 'ProjectUserConfig'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_ProjectUserConfig;
                            break;
                        case 'ShowCategories'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => { ShowCategories.add(value); });
                            break;
                        case 'HideCategories'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => { HideCategories.add(value); });
                            break;
                        case 'ShowFunctions'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => { ShowFunctions.add(value); });
                            break;
                        case 'HideFunctions'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => { HideFunctions.add(value); });
                            break;
                        case 'SparseClassDataTypes'.toLowerCase():
                            if (!value.IsMetaKeyValue()) { // currently only one sparse class data type is supported
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            SparseClassDataTypes.add(value.Values[0]);
                            break;
                        case 'ClassGroup'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => { ClassGroupNames.add(value); });
                            break;
                        case 'AutoExpandCategories'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => {
                                AutoCollapseCategories.delete(value);
                                AutoExpandCategories.add(value);
                            });
                            break;
                        case 'AutoCollapseCategories'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => {
                                AutoExpandCategories.delete(value);
                                AutoCollapseCategories.add(value);
                            });
                            break;
                        case 'DontAutoCollapseCategories'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            value.Values.forEach((value) => {
                                AutoCollapseCategories.delete(value);
                            });
                            break;
                        case 'CollapseCategories'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags | UE.ClassFlags.CLASS_CollapseCategories;
                            break;
                        case 'DontCollapseCategories'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            ClassFlags = ClassFlags & ~UE.ClassFlags.CLASS_CollapseCategories;
                            break;
                        case 'AdvancedClassDisplay'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            metaData.set('AdvancedClassDisplay', 'true');
                            break;
                        case 'ConversionRoot'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSpecifier(`${value.Specifier}`);
                            }
                            metaData.set('IsConversionRoot', 'true');
                            break;
                        default:
                            markInvalidSpecifier(`${value.Specifier}`);
                            break;
                    }
                }
                /**
                 * @brief
                 *      function body
                 */
                specifiers.forEach((value) => {
                    parseClassMetaSpecifier(value);
                });
                if (!bValidSpecifiers) {
                    console.warn(`invalid specifier for uclass: ${InvalidSpecifier}`);
                    return null;
                }
                let metaDataResult = new UE.PEClassMetaData();
                //  fill data to the class meta data structure
                metaDataResult.SetClassFlags(ClassFlags, bWantsPlacable);
                metaData.forEach((value, key) => { metaDataResult.SetMetaData(key, value); });
                metaDataResult.SetClassWithIn(WithIn);
                metaDataResult.SetConfig(ConfigName);
                HideCategories.forEach((value) => { metaDataResult.AddHideCategory(value); });
                ShowCategories.forEach((value) => { metaDataResult.AddShowCategory(value); });
                ShowSubCategories.forEach((value) => { metaDataResult.AddShowSubCategory(value); });
                HideFunctions.forEach((value) => { metaDataResult.AddHideFunction(value); });
                ShowFunctions.forEach((value) => { metaDataResult.AddShowFunction(value); });
                AutoExpandCategories.forEach((value) => { metaDataResult.AddAutoExpandCategory(value); });
                AutoCollapseCategories.forEach((value) => { metaDataResult.AddAutoCollapseCategory(value); });
                DontAutoCollapseCategories.forEach((value) => { metaDataResult.AddDontAutoCollapseCategory(value); });
                ClassGroupNames.forEach((value) => { metaDataResult.AddClassGroup(value); });
                SparseClassDataTypes.forEach((value) => { metaDataResult.AddSparseDataType(value); });
                return metaDataResult;
            }
            /**
             * process the meta data, some validation should do with owner class, for simplicity, we ignore it here
             * @param specifiers
             * @param metaData
             * @returns
             */
            function processFunctionMetaData(specifiers, metaData) {
                let bValidSpecifiers = true;
                let InvalidMessage;
                let FunctionFlags = BigInt(UE.FunctionFlags.FUNC_None);
                let FunctionExportFlags = 0n; // BigInt(UE.FunctionExportFlags.FUNCEXPORT_Final);
                let bSpecifiedUnreliable = false;
                let bSawPropertyAccessor = false;
                let bSealedEvent = false;
                let RPCId = 0;
                let RPCResponseId = 0;
                let EndpointName = '';
                let bForceBlueprintImpure = false;
                let CppValidationImplName = '';
                let CppImpName = '';
                let bAutomaticallyFinal = true;
                /**
                 * a helper function used to mark the meta data is invalid
                 * @param reason
                 */
                function markInvalidSince(reason) {
                    bValidSpecifiers = false;
                    InvalidMessage = reason;
                }
                /**
                 * a helper function used parse the net service identifier
                 * @param InIdentifiers
                 */
                function parseNetServiceIdentifiers(InIdentifiers) {
                    const IdTag = "Id";
                    const ResponseIdTag = "ResponseId";
                    const JSBridgePriTag = "Priority";
                    let bResult = true;
                    InIdentifiers.forEach((value) => {
                        if (!bResult) {
                            return;
                        }
                        if (value.indexOf('=') != -1) { // a tag with an argument
                            let TagAndArgument = value.split('=');
                            if (TagAndArgument.length != 2) {
                                return markInvalidSince(`Invalid format for net service identifers: ${value}`);
                            }
                            let Argument = parseInt(TagAndArgument[1]);
                            if (Argument == NaN || Argument < 0 || Argument > (1 << 16)) {
                                return markInvalidSince(`Invalid network identifier ${value} for function`);
                            }
                            if (TagAndArgument[0] == IdTag) {
                                RPCId = Argument;
                                return;
                            }
                            if (TagAndArgument[0] == ResponseIdTag || TagAndArgument[0] == JSBridgePriTag) {
                                RPCResponseId = Argument;
                                return;
                            }
                        }
                        else { //  an endpoint name
                            if (EndpointName.length != 0) {
                                bResult = false;
                                return markInvalidSince(`Function should not specify multiple endpoints - '${value}' found but already using '${EndpointName}'`);
                            }
                            EndpointName = value;
                        }
                    });
                    return bResult;
                }
                /**
                 *  a helper function used to parse teh meta specifier
                 * @param value
                 */
                function parseFunctionMetaSpecifier(value) {
                    if (!bValidSpecifiers) {
                        return;
                    }
                    switch (value.Specifier.toLowerCase()) {
                        case 'BlueprintNativeEvent'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince('BlueprintNativeEvent should be meta key');
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Net)) {
                                return markInvalidSince('BlueprintNativeEvent functions cannot be replicated!');
                            }
                            if ((FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) && !(FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Native))) {
                                return markInvalidSince('A function cannot be both BlueprintNativeEvent and BlueprintImplementableEvent!');
                            }
                            if (bSawPropertyAccessor) {
                                return markInvalidSince("A function cannot be both BlueprintNativeEvent and a Blueprint Property accessor!");
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Event);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintEvent);
                            break;
                        case 'BlueprintImplementableEvent'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Net)) {
                                return markInvalidSince('BlueprintImplementableEvent functions cannot be replicated!');
                            }
                            if ((FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) && (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Native))) {
                                return markInvalidSince('A function cannot be both BlueprintNativeEvent and BlueprintImplementableEvent!');
                            }
                            if (bSawPropertyAccessor) {
                                return markInvalidSince('A function cannot be both BlueprintImplementableEvent and a Blueprint Property accessor!');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Event);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintEvent);
                            FunctionFlags &= ~BigInt(UE.FunctionFlags.FUNC_Native);
                            break;
                        case 'Exec'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Net)) {
                                return markInvalidSince('Exec functions cannot be replicated!');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Exec);
                            break;
                        case 'SealedEvent'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            bSealedEvent = true;
                            break;
                        case 'Server'.toLowerCase():
                            if (!value.IsMetaKey() && !value.IsMetaKeyValue()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) {
                                return markInvalidSince('BlueprintImplementableEvent or BlueprintNativeEvent functions cannot be declared as Client or Server');
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Exec)) {
                                return markInvalidSince('Exec functions cannot be replicated!');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Net);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetServer);
                            if (value.IsMetaKeyValue()) {
                                CppImpName = value.Values[0];
                            }
                            break;
                        case 'Client'.toLowerCase():
                            if (!value.IsMetaKey() && !value.IsMetaKeyValue()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) {
                                return markInvalidSince('BlueprintImplementableEvent or BlueprintNativeEvent functions cannot be declared as Client or Server');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Net);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetClient);
                            if (value.IsMetaKeyValue()) {
                                CppImpName = value.Values[0];
                            }
                            break;
                        case 'NetMulticast'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) {
                                return markInvalidSince('BlueprintImplementableEvent or BlueprintNativeEvent functions cannot be declared as Multicast');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Net);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetMulticast);
                            break;
                        case 'ServiceRequest'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSince(`${value.Specifier} should be meta values`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) {
                                return markInvalidSince('BlueprintImplementableEvent or BlueprintNativeEvent functions cannot be declared as a ServiceRequest');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Net);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetReliable);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetRequest);
                            FunctionExportFlags |= BigInt(UE.FunctionExportFlags.FUNCEXPORT_CustomThunk);
                            parseNetServiceIdentifiers(value.Values);
                            if (bValidSpecifiers && EndpointName.length == 0) {
                                markInvalidSince('ServiceRequest needs to specify an endpoint name');
                            }
                            break;
                        case 'ServiceResponse'.toLowerCase():
                            if (!value.IsMetaKeyValues()) {
                                return markInvalidSince(`${value.Specifier} should be meta values`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) {
                                return markInvalidSince('BlueprintImplementableEvent or BlueprintNativeEvent functions cannot be declared as a ServiceResponse');
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Net);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetReliable);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetResponse);
                            parseNetServiceIdentifiers(value.Values);
                            if (bValidSpecifiers && EndpointName.length == 0) {
                                markInvalidSince('ServiceResponse needs to specify an endpoint name');
                            }
                            break;
                        case 'Reliable'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetReliable);
                            break;
                        case 'Unreliable'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            bSpecifiedUnreliable = true;
                            break;
                        case 'CustomThunk'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            FunctionExportFlags |= BigInt(UE.FunctionExportFlags.FUNCEXPORT_CustomThunk);
                            break;
                        case 'BlueprintCallable'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintCallable);
                            break;
                        case 'BlueprintGetter'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Event)) {
                                return markInvalidSince(`Function cannot be a blueprint event and a blueprint getter.`);
                            }
                            bSawPropertyAccessor = true;
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintCallable);
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintPure);
                            metaData.set("BlueprintGetter", "");
                            break;
                        case 'BlueprintSetter'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Event)) {
                                return markInvalidSince(`Function cannot be a blueprint event and a blueprint setter.`);
                            }
                            bSawPropertyAccessor = true;
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintCallable);
                            metaData.set("BlueprintSetter", "");
                            break;
                        case 'BlueprintPure'.toLowerCase():
                            {
                                if (!value.IsMetaKey() && !value.IsMetaKeyValue()) {
                                    return markInvalidSince(`${value.Specifier} should be meta key or meta value`);
                                }
                                let bPure = true;
                                if (value.IsMetaKeyValue()) {
                                    bPure = value.Values[0].toLowerCase() == 'true';
                                }
                                FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintCallable);
                                if (bPure) {
                                    FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintPure);
                                }
                                else {
                                    bForceBlueprintImpure = true;
                                }
                                break;
                            }
                        case 'BlueprintAuthorityOnly'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintAuthorityOnly);
                            break;
                        case 'BlueprintCosmetic'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be meta key`);
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_BlueprintCosmetic);
                            break;
                        case 'WithValidation'.toLowerCase():
                            if (!value.IsMetaKey() && !value.IsMetaKeyValue()) {
                                return markInvalidSince(`${value.Specifier} should be meta key or meta value`);
                            }
                            FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_NetValidate);
                            if (value.IsMetaKeyValue()) {
                                CppValidationImplName = value.Values[0];
                            }
                            break;
                        default:
                            markInvalidSince(`${value.Specifier} is not a valid specifier`);
                            break;
                    }
                }
                /**
                 * a helper function used to valid the function flags
                 */
                function validateFunctionFlags() {
                    if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Net)) {
                        FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Event);
                        const bIsNetService = !!(FunctionFlags & (BigInt(UE.FunctionFlags.FUNC_NetRequest) | BigInt(UE.FunctionFlags.FUNC_NetResponse)));
                        const bIsNetReliable = !!(FunctionFlags & BigInt(UE.FunctionFlags.FUNC_NetReliable));
                        //  replated function
                        //      1. not static 
                        //      2. reliable / unreliable should be specified, but never both
                        if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Static)) {
                            return markInvalidSince("Static functions can't be replicated");
                        }
                        if (!bIsNetReliable && !bSpecifiedUnreliable && !bIsNetService) {
                            return markInvalidSince("Replicated function: 'reliable' or 'unreliable' is required");
                        }
                        if (bIsNetReliable && bSpecifiedUnreliable && !bIsNetService) {
                            return markInvalidSince("'reliable' and 'unreliable' are mutually exclusive");
                        }
                    }
                    else if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_NetReliable)) //  only net function could mark reliable or unreliable
                     {
                        return markInvalidSince("'reliable' specified without 'client' or 'server'");
                    }
                    else if (bSpecifiedUnreliable) {
                        return markInvalidSince("'unreliable' specified without 'client' or 'server'");
                    }
                    if (bSealedEvent && !(FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Event))) //  sealed event could only used on events
                     {
                        return markInvalidSince("SealedEvent may only be used on events");
                    }
                    //  blueprint event could not be sealed
                    if (bSealedEvent && (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent))) {
                        return markInvalidSince("SealedEvent cannot be used on Blueprint events");
                    }
                    if (bForceBlueprintImpure && (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintPure))) {
                        return markInvalidSince("BlueprintPure (or BlueprintPure=true) and BlueprintPure=false should not both appear on the same function, they are mutually exclusive");
                    }
                    //  set custom thunk meta data
                    if ((FunctionExportFlags & BigInt(UE.FunctionExportFlags.FUNCEXPORT_CustomThunk)) && !metaData.has("CustomThunk")) {
                        metaData.set("CustomThunk", 'true');
                    }
                    if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_Net)) {
                        bAutomaticallyFinal = false;
                    }
                    if (FunctionFlags & BigInt(UE.FunctionFlags.FUNC_BlueprintEvent)) {
                        bAutomaticallyFinal = false;
                    }
                    if (bAutomaticallyFinal || bSealedEvent) {
                        FunctionFlags |= BigInt(UE.FunctionFlags.FUNC_Final);
                        FunctionExportFlags != BigInt(UE.FunctionExportFlags.FUNCEXPORT_Final);
                    }
                }
                /**
                 * @brief
                 *      function body
                 */
                if (metaData.has("CppFromBpEvent")) {
                    FunctionFlags = FunctionFlags | BigInt(UE.FunctionFlags.FUNC_Event);
                }
                specifiers.forEach((value) => {
                    parseFunctionMetaSpecifier(value);
                });
                if (bValidSpecifiers) {
                    validateFunctionFlags();
                }
                if (!bValidSpecifiers) {
                    console.warn(`invalid meta data for ufunction: ${InvalidMessage}`);
                    return null;
                }
                let metaDataResult = new UE.PEFunctionMetaData();
                metaDataResult.SetFunctionFlags(Number(FunctionFlags >> 32n), Number(FunctionFlags & 0xffffffffn));
                metaDataResult.SetFunctionExportFlags(Number(FunctionExportFlags));
                metaData.forEach((value, key) => { metaDataResult.SetMetaData(key, value); });
                metaDataResult.SetCppImplName(CppImpName);
                metaDataResult.SetCppValidationImplName(CppValidationImplName);
                metaDataResult.SetEndpointName(EndpointName);
                metaDataResult.SetRPCId(RPCId);
                metaDataResult.SetRPCResponseId(RPCResponseId);
                metaDataResult.SetIsSealedEvent(bSealedEvent);
                metaDataResult.SetForceBlueprintImpure(bForceBlueprintImpure);
                return metaDataResult;
            }
            /**
             * process the meta data of function parameters
             * @param specifiers
             * @param metaData
             */
            function processParamMetaData(specifiers, metaData) {
                let bValidSpecifiers = true;
                let InvalidMessage;
                let PropertyFlags = BigInt(UE.PropertyFlags.CPF_None);
                /**
                 * a helper function used to mark the meta data is invalid
                 * @param reason
                 */
                function markInvalidSince(reason) {
                    bValidSpecifiers = false;
                    InvalidMessage = reason;
                }
                /**
                *  a helper function used to parse the meta specifier
                * @param value
                */
                function parseParamMetaSpecifier(value) {
                    if (!bValidSpecifiers) {
                        return;
                    }
                    switch (value.Specifier.toLowerCase()) {
                        case 'Const'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_ConstParm);
                            break;
                        case 'Ref'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_OutParm) | BigInt(UE.PropertyFlags.CPF_ReferenceParm));
                            break;
                        case 'NotReplicated'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_RepSkip));
                            break;
                        default:
                            markInvalidSince(`${value.Specifier} is not a valid specifier`);
                            break;
                    }
                }
                /**
                 * @brief
                 *      function body
                 */
                specifiers.forEach((value) => {
                    parseParamMetaSpecifier(value);
                });
                if (!bValidSpecifiers) {
                    console.warn(`invalid meta data for uparam: ${InvalidMessage}`);
                    return null;
                }
                let metaDataResult = new UE.PEParamMetaData();
                metaDataResult.SetParamFlags(Number(PropertyFlags << 32n), Number(PropertyFlags & 0xffffffffn));
                metaData.forEach((value, key) => { metaDataResult.SetMetaData(key, value); });
                return metaDataResult;
            }
            /**
             * process the meta data of the property
             * @param specifiers
             * @param metaData
             * @returns
             */
            function processPropertyMetaData(specifiers, metaData) {
                let bValidSpecifiers = true;
                let InvalidMessage;
                let PropertyFlags = BigInt(UE.PropertyFlags.CPF_None);
                let ImpliedPropertyFlags = BigInt(UE.PropertyFlags.CPF_None);
                let bSeenEditSpecifier = false;
                let bSeenBlueprintWriteSpecifier = false;
                let bSeenBlueprintReadOnlySpecifier = false;
                let bSeenBlueprintGetterSpecifier = false;
                let RepCallbackName;
                /**
                * a helper function used to mark the meta data is invalid
                * @param reason
                */
                function markInvalidSince(reason) {
                    bValidSpecifiers = false;
                    InvalidMessage = reason;
                }
                /**
                *  a helper function used to parse the meta specifier
                * @param value
                */
                function parsePropertyMetaSpecifier(value) {
                    if (!bValidSpecifiers) {
                        return;
                    }
                    switch (value.Specifier.toLowerCase()) {
                        case 'EditAnywhere'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenEditSpecifier) {
                                return markInvalidSince(`found more than one edit/visibility specifier ${value.Specifier}, only one is allowed`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_Edit);
                            bSeenEditSpecifier = true;
                            break;
                        case 'EditInstanceOnly'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenEditSpecifier) {
                                return markInvalidSince(`found more than one edit/visibility specifier ${value.Specifier}, only one is allowed`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Edit) | BigInt(UE.PropertyFlags.CPF_DisableEditOnTemplate));
                            bSeenEditSpecifier = true;
                            break;
                        case 'EditDefaultOnly'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenEditSpecifier) {
                                return markInvalidSince(`found more than one edit/visibility specifier ${value.Specifier}, only one is allowed`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Edit) | BigInt(UE.PropertyFlags.CPF_DisableEditOnInstance));
                            bSeenEditSpecifier = true;
                            break;
                        case 'VisibleAnywhere'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenEditSpecifier) {
                                return markInvalidSince(`found more than one edit/visibility specifier ${value.Specifier}, only one is allowed`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Edit) | BigInt(UE.PropertyFlags.CPF_EditConst));
                            bSeenEditSpecifier = true;
                            break;
                        case `VisibleInstanceOnly`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenEditSpecifier) {
                                return markInvalidSince(`found more than one edit/visibility specifier ${value.Specifier}, only one is allowed`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Edit) | BigInt(UE.PropertyFlags.CPF_EditConst) | BigInt(UE.PropertyFlags.CPF_DisableEditOnTemplate));
                            bSeenEditSpecifier = true;
                            break;
                        case 'VisibleDefaultOnly'.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenEditSpecifier) {
                                return markInvalidSince(`found more than one edit/visibility specifier ${value.Specifier}, only one is allowed`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Edit) | BigInt(UE.PropertyFlags.CPF_EditConst) | BigInt(UE.PropertyFlags.CPF_DisableEditOnInstance));
                            bSeenEditSpecifier = true;
                            break;
                        case `BlueprintReadWrite`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenBlueprintReadOnlySpecifier) {
                                return markInvalidSince(`cannot specify a property as being both BlueprintReadOnly and BlueprintReadWrite`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintVisible);
                            bSeenBlueprintWriteSpecifier = true;
                            break;
                        case `BlueprintSetter`.toLowerCase():
                            if (!value.IsMetaKeyValue()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key value`);
                            }
                            if (bSeenBlueprintReadOnlySpecifier) {
                                return markInvalidSince(`can not specify a property as being both BlueprintReadOnly and having a BlueprintSetter`);
                            }
                            metaData.set('BlueprintSetter', value.Values[0]);
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintVisible);
                            bSeenBlueprintWriteSpecifier = true;
                            break;
                        case `BlueprintReadOnly`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            if (bSeenBlueprintWriteSpecifier) {
                                return markInvalidSince(`can not specify both BlueprintReadOnly and BlueprintReadWrite or BlueprintSetter for ${value.Specifier}`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_BlueprintVisible) | BigInt(UE.PropertyFlags.CPF_BlueprintReadOnly));
                            ImpliedPropertyFlags = ImpliedPropertyFlags & (~BigInt(UE.PropertyFlags.CPF_BlueprintReadOnly));
                            bSeenBlueprintReadOnlySpecifier = true;
                            break;
                        case `BlueprintGetter`.toLowerCase():
                            if (!value.IsMetaKeyValue()) {
                                return markInvalidSince(`${value.Specifier}, should be a meta key value`);
                            }
                            metaData.set("BlueprintGetter", value.Values[0]);
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintVisible);
                            bSeenBlueprintGetterSpecifier = true;
                            break;
                        case `Config`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_Config);
                            break;
                        case `GlobalConfig`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_GlobalConfig) | BigInt(UE.PropertyFlags.CPF_Config));
                            break;
                        case `Localized`.toLowerCase():
                            console.warn(`the localized specifier is deprecated`);
                            break;
                        case `Transient`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_Transient);
                            break;
                        case `DuplicateTransient`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_DuplicateTransient);
                            break;
                        case `TextExportTransient`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_TextExportTransient);
                            break;
                        case `NonPIETransient`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            console.warn('NonPIETransient is deprecated - NonPIEDuplicateTransient should be used instead');
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_NonPIEDuplicateTransient);
                            break;
                        case `NonPIEDuplicateTransient`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_NonPIEDuplicateTransient);
                            break;
                        case `Export`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_ExportObject);
                            break;
                        case `EditInline`.toLowerCase():
                            return markInvalidSince(`EditInline is deprecated. Remove it, or use Instanced instead`);
                        case `NoClear`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_NoClear);
                            break;
                        case `EditFixedSize`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_EditFixedSize);
                            break;
                        case `Replicated`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_Net);
                            break;
                        case `ReplicatedUsing`.toLowerCase():
                            if (!value.IsMetaKeyValue()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key value`);
                            }
                            RepCallbackName = value.Values[0];
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Net) | BigInt(UE.PropertyFlags.CPF_RepNotify));
                            break;
                        case `NotReplicated`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_RepSkip);
                            break;
                        case `RepRetry`.toLowerCase():
                            console.error('RepRetry is deprecated');
                            break;
                        case `Interp`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_Edit) | BigInt(UE.PropertyFlags.CPF_BlueprintVisible) | BigInt(UE.PropertyFlags.CPF_Interp));
                            break;
                        case `NonTransactional`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_NonTransactional);
                            break;
                        case `Instanced`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | (BigInt(UE.PropertyFlags.CPF_PersistentInstance) | BigInt(UE.PropertyFlags.CPF_ExportObject) | BigInt(UE.PropertyFlags.CPF_InstancedReference));
                            metaData.set(`EditInline`, 'true');
                            break;
                        case `BlueprintAssignable`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintAssignable);
                            break;
                        case `BlueprintCallable`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintCallable);
                            break;
                        case `BlueprintAuthorityOnly`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintAuthorityOnly);
                            break;
                        case `AssetRegistrySearchable`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_AssetRegistrySearchable);
                            break;
                        case `SimpleDisplay`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_SimpleDisplay);
                            break;
                        case `AdvancedDisplay`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_AdvancedDisplay);
                            break;
                        case `SaveGame`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_SaveGame);
                            break;
                        case `SkipSerialization`.toLowerCase():
                            if (!value.IsMetaKey()) {
                                return markInvalidSince(`${value.Specifier} should be a meta key`);
                            }
                            PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_SkipSerialization);
                            break;
                        default:
                            markInvalidSince(`${value.Specifier} is not a valid specifier`);
                            break;
                    }
                }
                /**
                 * a helper function used to validate the property flags
                 * @returns
                 */
                function validatePropertyFlags() {
                    // If we saw a BlueprintGetter but did not see BlueprintSetter or 
                    // or BlueprintReadWrite then treat as BlueprintReadOnly
                    if (bSeenBlueprintGetterSpecifier && !bSeenBlueprintWriteSpecifier) {
                        PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_BlueprintReadOnly);
                        ImpliedPropertyFlags = ImpliedPropertyFlags & (~BigInt(UE.PropertyFlags.CPF_BlueprintReadOnly));
                    }
                    if (metaData.has(`ExposeOnSpawn`)) {
                        if ((PropertyFlags & BigInt(UE.PropertyFlags.CPF_DisableEditOnInstance)) != 0n) {
                            return markInvalidSince(`property cannot have both DisableEditOnInstance and ExposeOnSpawn flags`);
                        }
                        if ((PropertyFlags & BigInt(UE.PropertyFlags.CPF_BlueprintVisible)) == 0n) {
                            return markInvalidSince(`property cannot have ExposeOnSpawn without BlueprintVisible flags`);
                        }
                        PropertyFlags = PropertyFlags | BigInt(UE.PropertyFlags.CPF_ExposeOnSpawn);
                    }
                    if (!(PropertyFlags & BigInt(UE.PropertyFlags.CPF_Edit))) {
                        if (PropertyFlags & BigInt(UE.PropertyFlags.CPF_DisableEditOnInstance)) {
                            return markInvalidSince(`property cannot have DisableEditOnInstance without being editable`);
                        }
                        if (PropertyFlags & BigInt(UE.PropertyFlags.CPF_DisableEditOnTemplate)) {
                            return markInvalidSince(`property cannot have DisableEditOnTemplate without being editable`);
                        }
                    }
                    const ParamFlags = BigInt(UE.PropertyFlags.CPF_Parm)
                        | BigInt(UE.PropertyFlags.CPF_OutParm)
                        | BigInt(UE.PropertyFlags.CPF_ReturnParm)
                        | BigInt(UE.PropertyFlags.CPF_ReferenceParm)
                        | BigInt(UE.PropertyFlags.CPF_ConstParm);
                    if (PropertyFlags & ParamFlags) {
                        return markInvalidSince(`Illegal type modifiers in member variable declaration`);
                    }
                }
                /**
                 * @brief
                 *      function body
                 */
                specifiers.forEach((value) => {
                    parsePropertyMetaSpecifier(value);
                });
                if (bValidSpecifiers) {
                    validatePropertyFlags();
                }
                if (!bValidSpecifiers) {
                    console.warn(`invalid meta data for uproperty: ${InvalidMessage}`);
                    return null;
                }
                let metaDataResult = new UE.PEPropertyMetaData();
                const FinalFlags = PropertyFlags | ImpliedPropertyFlags;
                metaDataResult.SetPropertyFlags(Number(FinalFlags >> 32n), Number(FinalFlags & 0xffffffffn));
                metaData.forEach((value, key) => { metaDataResult.SetMetaData(key, value); });
                metaDataResult.SetRepCallbackName(RepCallbackName);
                return metaDataResult;
            }
            /**
             *  compile the class data
             * @param type
             */
            function compileClassMetaData(type) {
                //  fetch the decorator
                let decorators = null;
                if (type.getSymbol().valueDeclaration != null) {
                    decorators = type.getSymbol().valueDeclaration.decorators;
                }
                if (decorators == null) { //  no decorators
                    return null;
                }
                let [specifiers, metaData] = getMetaDataFromDecorators(decorators, 'uclass');
                return processClassMetaData(specifiers, metaData);
            }
            /**
             * compile the function meta data
             * @param func
             */
            function compileFunctionMetaData(func) {
                //  fetch the decorator
                const decorators = func.valueDeclaration != null ? func.valueDeclaration.decorators : null;
                if (decorators == null) { //  no decorators
                    return null;
                }
                let [specifiers, metaData] = getMetaDataFromDecorators(decorators, 'ufunction');
                return processFunctionMetaData(specifiers, metaData);
            }
            /**
             * compile the function parameter meta data
             * @param param
             * @returns
             */
            function compileParamMetaData(param) {
                //  fetch the decorator
                const decorators = param.valueDeclaration != null ? param.valueDeclaration.decorators : null;
                if (decorators == null) {
                    return null;
                }
                let [specifiers, metaData] = getMetaDataFromDecorators(decorators, 'uparam');
                return processParamMetaData(specifiers, metaData);
            }
            /**
             * compile the property meta data
             * @param prop
             * @returns
             */
            function compilePropertyMetaData(prop) {
                //  fetch the decorator
                const decorators = prop.valueDeclaration != null ? prop.valueDeclaration.decorators : null;
                if (decorators == null) {
                    return null;
                }
                let [specifiers, metaData] = getMetaDataFromDecorators(decorators, 'uproperty');
                return processPropertyMetaData(specifiers, metaData);
            }
            function onBlueprintTypeAddOrChange(baseTypeUClass, type, modulePath) {
                console.log(`gen blueprint for ${type.getSymbol().getName()}, path: ${modulePath}`);
                let lsFunctionLibrary = baseTypeUClass && baseTypeUClass.GetName() === "BlueprintFunctionLibrary";
                let bp = new UE.PEBlueprintAsset();
                bp.LoadOrCreateWithMetaData(type.getSymbol().getName(), modulePath, baseTypeUClass, 0, 0, compileClassMetaData(type));
                let hasConstructor = false;
                let properties = [];
                type.symbol.valueDeclaration.forEachChild(x => {
                    if (ts.isMethodDeclaration(x) && !manualSkip(x)) {
                        let isStatic = !!(ts.getCombinedModifierFlags(x) & ts.ModifierFlags.Static);
                        if (isStatic && !lsFunctionLibrary) {
                            console.warn(`do not support static function [${x.name.getText()}]`);
                            return;
                        }
                        if (!isStatic && lsFunctionLibrary) {
                            console.warn(`do not support non-static function [${x.name.getText()}] in BlueprintFunctionLibrary`);
                            return;
                        }
                        properties.push(checker.getSymbolAtLocation(x.name));
                    }
                    else if (ts.isPropertyDeclaration(x) && !manualSkip(x)) {
                        let isStatic = !!(ts.getCombinedModifierFlags(x) & ts.ModifierFlags.Static);
                        if (isStatic) {
                            console.warn("static property:" + x.name.getText() + ' not support');
                            return;
                        }
                        properties.push(checker.getSymbolAtLocation(x.name));
                    }
                });
                properties
                    .filter(x => ts.isClassDeclaration(x.valueDeclaration.parent) && checker.getSymbolAtLocation(x.valueDeclaration.parent.name) == type.symbol)
                    .forEach((symbol) => {
                    if (ts.isMethodDeclaration(symbol.valueDeclaration)) {
                        if (symbol.getName() === 'Constructor') {
                            hasConstructor = true;
                            return;
                        }
                        let methodType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                        let signatures = checker.getSignaturesOfType(methodType, ts.SignatureKind.Call);
                        if (!signatures) {
                            console.warn(`can not find signature for ${symbol.getName()} `);
                            return;
                        }
                        if (signatures.length != 1) {
                            console.warn(`find more than one signature for ${symbol.getName()} `);
                            return;
                        }
                        let signature = signatures[0];
                        for (var i = 0; i < signature.parameters.length; i++) {
                            let paramType = checker.getTypeOfSymbolAtLocation(signature.parameters[i], signature.parameters[i].valueDeclaration);
                            let paramPinType = tsTypeToPinType(paramType, getSymbolTypeNode(signature.parameters[i]));
                            if (!paramPinType) {
                                console.warn(symbol.getName() + " of " + checker.typeToString(type) + " has not supported parameter!");
                                bp.ClearParameter();
                                return;
                            }
                            postProcessPinType(signature.parameters[i].valueDeclaration, paramPinType.pinType, false);
                            // bp.AddParameter(signature.parameters[i].getName(), paramPinType.pinType, paramPinType.pinValueType);
                            bp.AddParameterWithMetaData(signature.parameters[i].getName(), paramPinType.pinType, paramPinType.pinValueType, compileParamMetaData(signature.parameters[i]));
                        }
                        //console.log("add function", symbol.getName());
                        let sflags = tryGetAnnotation(symbol.valueDeclaration, "flags", true);
                        let flags = getFlagsValue(sflags, FunctionFlags);
                        let clearFlags = 0;
                        if (symbol.valueDeclaration && symbol.valueDeclaration.decorators) {
                            flags |= Number(getDecoratorFlagsValue(symbol.valueDeclaration, "flags", FunctionFlags));
                            flags |= Number(getDecoratorFlagsValue(symbol.valueDeclaration, "set_flags", FunctionFlags));
                            clearFlags = Number(getDecoratorFlagsValue(symbol.valueDeclaration, "clear_flags", FunctionFlags));
                        }
                        if (symbol.valueDeclaration.type && (ts.SyntaxKind.VoidKeyword === symbol.valueDeclaration.type.kind)) {
                            // bp.AddFunction(symbol.getName(), true, undefined, undefined, flags, clearFlags);
                            bp.AddFunctionWithMetaData(symbol.getName(), true, undefined, undefined, flags, clearFlags, compileFunctionMetaData(symbol));
                        }
                        else {
                            let returnType = signature.getReturnType();
                            let resultPinType = tsTypeToPinType(returnType, getSymbolTypeNode(symbol));
                            if (!resultPinType) {
                                console.warn(symbol.getName() + " of " + checker.typeToString(type) + " has not supported return type!");
                                bp.ClearParameter();
                                return;
                            }
                            postProcessPinType(symbol.valueDeclaration, resultPinType.pinType, true);
                            // bp.AddFunction(symbol.getName(), false, resultPinType.pinType, resultPinType.pinValueType, flags, clearFlags);
                            bp.AddFunctionWithMetaData(symbol.getName(), false, resultPinType.pinType, resultPinType.pinValueType, flags, clearFlags, compileFunctionMetaData(symbol));
                        }
                        bp.ClearParameter();
                    }
                    else {
                        let propType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                        let propPinType = tsTypeToPinType(propType, getSymbolTypeNode(symbol));
                        if (!propPinType) {
                            console.warn(symbol.getName() + " of " + checker.typeToString(type) + " not support!");
                        }
                        else {
                            postProcessPinType(symbol.valueDeclaration, propPinType.pinType, true);
                            //console.log("add member variable", symbol.getName());
                            let sflags = tryGetAnnotation(symbol.valueDeclaration, "flags", true);
                            let flags = BigInt(getFlagsValue(sflags, PropertyFlags));
                            let cond = 0;
                            if (symbol.valueDeclaration && symbol.valueDeclaration.decorators) {
                                cond = Number(getDecoratorFlagsValue(symbol.valueDeclaration, "condition", ELifetimeCondition));
                                if (cond != 0) {
                                    flags = flags | BigInt(PropertyFlags.CPF_Net);
                                }
                                flags = flags | getDecoratorFlagsValue(symbol.valueDeclaration, "flags", PropertyFlags);
                            }
                            if (!hasDecorator(symbol.valueDeclaration, "edit_on_instance")) {
                                flags = flags | BigInt(PropertyFlags.CPF_DisableEditOnInstance);
                            }
                            // bp.AddMemberVariable(symbol.getName(), propPinType.pinType, propPinType.pinValueType, Number(flags & 0xffffffffn), Number(flags >> 32n), cond);
                            bp.AddMemberVariableWithMetaData(symbol.getName(), propPinType.pinType, propPinType.pinValueType, Number(flags & 0xffffffffn), Number(flags >> 32n), cond, compilePropertyMetaData(symbol));
                        }
                    }
                });
                bp.RemoveNotExistedMemberVariable();
                bp.RemoveNotExistedFunction();
                bp.HasConstructor = hasConstructor;
                bp.Save();
            }
            function getModuleNames(type) {
                let ret = [];
                if (type.symbol && type.symbol.valueDeclaration && type.symbol.valueDeclaration.parent && ts.isModuleBlock(type.symbol.valueDeclaration.parent)) {
                    let moduleBody = type.symbol.valueDeclaration.parent;
                    while (moduleBody) {
                        let moduleDeclaration = moduleBody.parent;
                        let nameOfModule = undefined;
                        while (moduleDeclaration) {
                            let ns = moduleDeclaration.name.text;
                            ns = ns.startsWith("$") ? ns.substring(1) : ns;
                            nameOfModule = nameOfModule ? (ns + '/' + nameOfModule) : ns;
                            if (ts.isModuleDeclaration(moduleDeclaration.parent)) {
                                moduleDeclaration = moduleDeclaration.parent;
                            }
                            else {
                                break;
                            }
                        }
                        ret.push(nameOfModule);
                        if (moduleDeclaration && ts.isModuleBlock(moduleDeclaration.parent)) {
                            moduleBody = moduleDeclaration.parent;
                        }
                        else {
                            break;
                        }
                    }
                }
                return ret.reverse();
            }
        }
    }
    //function getOwnEmitOutputFilePath(fileName: string) {
    function getModulePath(fileName) {
        const compilerOptions = options;
        let emitOutputFilePathWithoutExtension;
        if (compilerOptions.outDir) {
            emitOutputFilePathWithoutExtension = tsi.removeFileExtension(tsi.getSourceFilePathInNewDir(fileName, customSystem.getCurrentDirectory(), program.getCommonSourceDirectory(), options.outDir));
        }
        else {
            emitOutputFilePathWithoutExtension = tsi.removeFileExtension(fileName);
        }
        return emitOutputFilePathWithoutExtension;
    }
}
watch(customSystem.getCurrentDirectory() + "tsconfig.json");
//# sourceMappingURL=CodeAnalyze.js.map