"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UE = require("ue");
const puerts_1 = require("puerts");
const ts = require("typescript");
const tsi = require("./TypeScriptInternal");
const uemeta = require("./UEMeta");
const cpp = require("cpp");
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
        return res;
    }
    function write(s) {
    }
    function readFile(path, encoding) {
        let data = (0, puerts_1.$ref)(undefined);
        const res = UE.FileSystemOperation.ReadFile(path, data);
        if (res) {
            return (0, puerts_1.$unref)(data);
        }
        else {
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
        }
        else {
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
    CPF_SkipSerialization: 0x0080000000000000, ///< Property shouldn't be serialized, can still be exported to text
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
    "COND_Never": 15, // This property will never be replicated						
};
function readAndParseConfigFile(configFilePath) {
    let readResult = ts.readConfigFile(configFilePath, customSystem.readFile);
    return ts.parseJsonConfigFileContent(readResult.config, {
        useCaseSensitiveFileNames: true,
        readDirectory: customSystem.readDirectory,
        fileExists: customSystem.fileExists,
        readFile: customSystem.readFile,
        trace: s => { }
    }, customSystem.getCurrentDirectory());
}
function watch(configFilePath) {
    let { fileNames, options } = readAndParseConfigFile(configFilePath);
    const versionsFilePath = tsi.getDirectoryPath(configFilePath) + "/ts_file_versions_info.json";
    const fileVersions = {};
    let beginTime = new Date().getTime();
    fileNames.forEach(fileName => {
        fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false, isBP: false };
    });
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
                return undefined;
            }
            if (!(fileName in fileVersions)) {
                fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false };
            }
            if (!scriptSnapshotsCache.has(fileName)) {
                const sourceFile = customSystem.readFile(fileName);
                if (!sourceFile) {
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
                    return undefined;
                }
                scriptSnapshotsInfo.version = fileVersions[fileName].version;
                scriptSnapshotsInfo.scriptSnapshot = ts.ScriptSnapshot.fromString(sourceFile);
            }
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
            }
            //An exception causes a new Language Service to be created. It is possible that it will continue to fail. UE file reading will occasionally fail, and after the failure, ts incremental compilation will continue to fail the assertion at tryReuseStructureFromOldProgram
            service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        }
    }
    let pendingBlueprintRefleshJobs = [];
    function isChildOf(a, b) {
        let baseTypes = a.getBaseTypes();
        if (baseTypes.indexOf(b) >= 0) {
            return true;
        }
        for (let i = 0; i < baseTypes.length; ++i) {
            if (isChildOf(baseTypes[i], b)) {
                return true;
            }
        }
        return false;
    }
    function topologicalSort(classes) {
        const visited = new Set();
        const result = [];
        function visit(node) {
            if (!visited.has(node)) {
                visited.add(node);
                for (const other of classes) {
                    if (isChildOf(node.type, other.type)) {
                        visit(other);
                    }
                }
                result.push(node);
            }
        }
        for (const cls of classes) {
            visit(cls);
        }
        return result;
    }
    function refreshBlueprints() {
        if (pendingBlueprintRefleshJobs.length > 0) {
            pendingBlueprintRefleshJobs = topologicalSort(pendingBlueprintRefleshJobs);
            pendingBlueprintRefleshJobs.forEach(job => {
                job.op();
            });
            pendingBlueprintRefleshJobs = [];
        }
    }
    beginTime = new Date().getTime();
    let program = getProgramFromService();
    let diagnostics = ts.getPreEmitDiagnostics(program);
    let restoredFileVersions = {};
    var changed = false;
    const versionsFileExisted = customSystem.fileExists(versionsFilePath);
    if (versionsFileExisted) {
        try {
            restoredFileVersions = JSON.parse(customSystem.readFile(versionsFilePath));
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
            if (versionsFileExisted && (!(fileName in restoredFileVersions)))
                return;
            if (versionsFileExisted && (!restoredFileVersions[fileName].isBP))
                return;
            const { moduleFileName, modulePath } = getClassPathInfo(fileName);
            let BPExisted = false;
            if (moduleFileName) {
                BPExisted = UE.PEBlueprintAsset.Existed(moduleFileName, modulePath);
            }
            if (!versionsFileExisted || restoredFileVersions[fileName].version != fileVersions[fileName].version || !restoredFileVersions[fileName].processed || !BPExisted) {
                onSourceFileAddOrChange(fileName, false, program, false);
                changed = true;
            }
            else {
                fileVersions[fileName].processed = true;
            }
        });
        refreshBlueprints();
        if (changed) {
            UE.FileSystemOperation.WriteFile(versionsFilePath, JSON.stringify(fileVersions, null, 4));
        }
    }
    var dirWatcher = new UE.PEDirectoryWatcher();
    global.__dirWatcher = dirWatcher; //prevent it from being released?
    dirWatcher.OnChanged.Add((added, modified, removed) => {
        setTimeout(() => {
            var changed = false;
            let modifiedFiles = [];
            for (var i = 0; i < modified.Num(); i++) {
                modifiedFiles.push(modified.Get(i));
            }
            let removedSet = new Set();
            for (var i = 0; i < removed.Num(); i++) {
                removedSet.add(removed.Get(i));
            }
            let addFiles = [];
            for (var i = 0; i < added.Num(); i++) {
                let fileName = added.Get(i);
                //remove and add is the same as modified
                if (removedSet.has(fileName)) {
                    modifiedFiles.push(fileName);
                }
                else {
                    addFiles.push(fileName);
                }
            }
            if (addFiles.length > 0) {
                onFileAdded();
                changed = true;
            }
            modifiedFiles.forEach(fileName => {
                if (fileName in fileVersions) {
                    let md5 = UE.FileSystemOperation.FileMD5Hash(fileName);
                    if (md5 === fileVersions[fileName].version) {
                    }
                    else {
                        fileVersions[fileName].version = md5;
                        onSourceFileAddOrChange(fileName, true);
                        changed = true;
                    }
                }
            });
            refreshBlueprints();
            if (changed) {
                UE.FileSystemOperation.WriteFile(versionsFilePath, JSON.stringify(fileVersions, null, 4));
            }
        }, 100); //Delay 100 milliseconds to prevent file reading failure due to read conflict
    });
    dirWatcher.Watch(customSystem.getCurrentDirectory());
    function onFileAdded() {
        let cmdLine = readAndParseConfigFile(configFilePath);
        let newFiles = [];
        cmdLine.fileNames.forEach(fileName => {
            if (!(fileName in fileVersions)) {
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
                                UE.FileSystemOperation.WriteFile(output.name, output.text);
                            }
                            if (output.name.endsWith(".js") || output.name.endsWith(".mjs")) {
                                jsSource = output.text;
                                if (options.outDir && output.name.startsWith(options.outDir)) {
                                    moduleFileName = output.name.substr(options.outDir.length + 1);
                                    modulePath = tsi.getDirectoryPath(moduleFileName);
                                    moduleFileName = tsi.removeExtension(moduleFileName, output.name.endsWith(".js") ? ".js" : ".mjs");
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
                                    return;
                                }
                                if (baseTypeUClass) {
                                    if (isSubclassOf(type, "Subsystem")) {
                                        return;
                                    }
                                    if (!baseTypeUClass.IsNative()) {
                                        let moduleNames = getModuleNames(baseTypes[0]);
                                        if (moduleNames.length > 1 && moduleNames[0] == 'ue') {
                                            return;
                                        }
                                    }
                                    foundType = type;
                                    foundBaseTypeUClass = baseTypeUClass;
                                }
                                else {
                                }
                            }
                        });
                        if (foundType && foundBaseTypeUClass) {
                            fileVersions[sourceFilePath].isBP = true;
                            //onBlueprintTypeAddOrChange(foundBaseTypeUClass, foundType, modulePath);
                            pendingBlueprintRefleshJobs.push({ type: foundType, op: () => onBlueprintTypeAddOrChange(foundBaseTypeUClass, foundType, modulePath) });
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
                        }
                    }
                    else if (moduleNames.length == 2) {
                        let classPath = '/' + moduleNames[1] + '.' + type.symbol.getName();
                        return UE.Field.Load(classPath, true);
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
                    let sourceFile = type.symbol.valueDeclaration.getSourceFile();
                    let sourceFileName;
                    program.emit(sourceFile, writeFile, undefined, false, undefined);
                    function writeFile(fileName, text, writeByteOrderMark) {
                        if (fileName.endsWith('.js')) {
                            sourceFileName = tsi.removeExtension(fileName, '.js');
                        }
                    }
                    if (tsi.getBaseFileName(sourceFileName) != type.symbol.getName()) {
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
                                return undefined;
                            }
                            if (node) {
                                node.forEachChild(child => {
                                    children.push(child);
                                });
                            }
                            let result = tsTypeToPinType(typeArguments[0], children[1]);
                            if (!result || result.pinType.PinContainerType != UE.EPinContainerType.None && typeName != '$Ref' && typeName != '$InRef') {
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
                                return undefined;
                        }
                        let pinType = new UE.PEGraphPinType(category, undefined, UE.EPinContainerType.None, false, false);
                        return { pinType: pinType };
                    }
                }
                catch (e) {
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
            function onBlueprintTypeAddOrChange(baseTypeUClass, type, modulePath) {
                let lsFunctionLibrary = baseTypeUClass && baseTypeUClass.GetName() === "BlueprintFunctionLibrary";
                let bp = new UE.PEBlueprintAsset();
                bp.LoadOrCreateWithMetaData(type.getSymbol().getName(), modulePath, baseTypeUClass, 0, 0, uemeta.compileClassMetaData(type));
                let hasConstructor = false;
                let properties = [];
                type.symbol.valueDeclaration.forEachChild(x => {
                    if (ts.isMethodDeclaration(x) && !manualSkip(x)) {
                        let isStatic = !!(ts.getCombinedModifierFlags(x) & ts.ModifierFlags.Static);
                        if (isStatic && !lsFunctionLibrary) {
                            return;
                        }
                        if (!isStatic && lsFunctionLibrary) {
                            return;
                        }
                        if (x.name.getText() === 'ReceiveInit') {
                            if (baseTypeUClass == UE.GameInstance.StaticClass() || baseTypeUClass.IsChildOf(UE.GameInstance.StaticClass())) {
                                return;
                            }
                        }
                        properties.push(checker.getSymbolAtLocation(x.name));
                    }
                    else if (ts.isPropertyDeclaration(x) && !manualSkip(x)) {
                        let isStatic = !!(ts.getCombinedModifierFlags(x) & ts.ModifierFlags.Static);
                        if (isStatic) {
                            return;
                        }
                        properties.push(checker.getSymbolAtLocation(x.name));
                    }
                });
                let attachments = UE.NewMap(UE.BuiltinName, UE.BuiltinName);
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
                            return;
                        }
                        if (signatures.length != 1) {
                            return;
                        }
                        let signature = signatures[0];
                        for (var i = 0; i < signature.parameters.length; i++) {
                            let paramType = checker.getTypeOfSymbolAtLocation(signature.parameters[i], signature.parameters[i].valueDeclaration);
                            let paramPinType = tsTypeToPinType(paramType, getSymbolTypeNode(signature.parameters[i]));
                            if (!paramPinType) {
                                bp.ClearParameter();
                                return;
                            }
                            postProcessPinType(signature.parameters[i].valueDeclaration, paramPinType.pinType, false);
                            // bp.AddParameter(signature.parameters[i].getName(), paramPinType.pinType, paramPinType.pinValueType);
                            bp.AddParameterWithMetaData(signature.parameters[i].getName(), paramPinType.pinType, paramPinType.pinValueType, uemeta.compileParamMetaData(signature.parameters[i]));
                        }
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
                            bp.AddFunctionWithMetaData(symbol.getName(), true, undefined, undefined, flags, clearFlags, uemeta.compileFunctionMetaData(symbol));
                        }
                        else {
                            let returnType = signature.getReturnType();
                            let resultPinType = tsTypeToPinType(returnType, getSymbolTypeNode(symbol));
                            if (!resultPinType) {
                                bp.ClearParameter();
                                return;
                            }
                            postProcessPinType(symbol.valueDeclaration, resultPinType.pinType, true);
                            // bp.AddFunction(symbol.getName(), false, resultPinType.pinType, resultPinType.pinValueType, flags, clearFlags);
                            bp.AddFunctionWithMetaData(symbol.getName(), false, resultPinType.pinType, resultPinType.pinValueType, flags, clearFlags, uemeta.compileFunctionMetaData(symbol));
                        }
                        bp.ClearParameter();
                    }
                    else {
                        let propType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                        let propPinType = tsTypeToPinType(propType, getSymbolTypeNode(symbol));
                        if (!propPinType) {
                        }
                        else {
                            postProcessPinType(symbol.valueDeclaration, propPinType.pinType, true);
                            let sflags = tryGetAnnotation(symbol.valueDeclaration, "flags", true);
                            let localFlags = BigInt(getFlagsValue(sflags, PropertyFlags)); // From //@flags
                            let cond = 0;

                            if (symbol.valueDeclaration && symbol.valueDeclaration.decorators) {
                                // Handle @flags() decorator
                                localFlags |= getDecoratorFlagsValue(symbol.valueDeclaration, "flags", PropertyFlags);

                                // Handle @condition() for CPF_Net
                                cond = Number(getDecoratorFlagsValue(symbol.valueDeclaration, "condition", ELifetimeCondition));
                                if (cond != 0) {
                                    localFlags |= BigInt(PropertyFlags.CPF_Net); 
                                }

                                // Handle specific @edit_on_instance decorator as an override
                                if (hasDecorator(symbol.valueDeclaration, "edit_on_instance")) {
                                    localFlags &= ~BigInt(PropertyFlags.CPF_DisableEditOnInstance); // Remove restriction
                                    localFlags |= BigInt(PropertyFlags.CPF_Edit); // Ensure it's editable if this is used
                                }
                                
                                // Attachment logic (preserved)
                                symbol.valueDeclaration.decorators.forEach((decorator) => {
                                    let expression = decorator.expression;
                                    if (ts.isCallExpression(expression)) {
                                        if (expression.expression.getFullText().endsWith("uproperty.attach")) {
                                            expression.arguments.forEach((value) => {
                                                attachments.Add(symbol.getName(), value.getFullText().slice(1, -1));
                                            });
                                        }
                                    }
                                });
                            }

                            let propertyMetaData = uemeta.compilePropertyMetaData(symbol);

                            // If UEMeta provides no metadata (e.g. no @uproperty decorator on the member) AND
                            // localFlags themselves don't already make the property editable, 
                            // then apply a default CPF_DisableEditOnInstance to localFlags.
                            // This makes un-decorated or un-annotated properties non-editable on instances by default.
                            if (!propertyMetaData && !(localFlags & BigInt(PropertyFlags.CPF_Edit))) {
                                // Check hasDecorator again because the main decorators loop might not have run if no decorators exist at all
                                if (!symbol.valueDeclaration || !symbol.valueDeclaration.decorators || !hasDecorator(symbol.valueDeclaration, "edit_on_instance")) { 
                                     localFlags |= BigInt(PropertyFlags.CPF_DisableEditOnInstance);
                                }
                            }
                            // When propertyMetaData *is* present, its internal flags (derived by UEMeta.js from EditAnywhere etc.)
                            // are authoritative. localFlags here are for truly additional/override flags.

                            bp.AddMemberVariableWithMetaData(symbol.getName(), propPinType.pinType, propPinType.pinValueType, Number(localFlags & 0xffffffffn), Number(localFlags >> 32n), cond, propertyMetaData);
                        }
                    }
                });
                bp.RemoveNotExistedComponent();
                bp.RemoveNotExistedMemberVariable();
                bp.RemoveNotExistedFunction();
                bp.SetupAttachments(attachments);
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
    function list(pattern) {
        var re = new RegExp(pattern ? pattern : '.*');
        for (var key in fileVersions) {
            var value = fileVersions[key];
            if (!pattern || re.test(key)) {
            }
        }
    }
    function compile(id) {
        for (var key in fileVersions) {
            var value = fileVersions[key];
            if (value.version === id.trim()) {
                onSourceFileAddOrChange(key, true);
            }
        }
        refreshBlueprints();
    }
    function dispatchCmd(cmd, args) {
        if (cmd == 'ls') {
            list(args);
        }
        else if (cmd == 'compile') {
            compile(args);
        }
        else {
        }
    }
    cpp.FPuertsEditorModule.SetCmdCallback(dispatchCmd);
}
watch(customSystem.getCurrentDirectory() + "tsconfig.json");
//# sourceMappingURL=CodeAnalyze.js.map