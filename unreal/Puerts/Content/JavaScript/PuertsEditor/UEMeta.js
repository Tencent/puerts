"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UE = require("ue");
const ts = require("typescript");
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
exports.compileClassMetaData = compileClassMetaData;
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
exports.compileFunctionMetaData = compileFunctionMetaData;
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
exports.compileParamMetaData = compileParamMetaData;
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
exports.compilePropertyMetaData = compilePropertyMetaData;
//# sourceMappingURL=UEMeta.js.map