"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UE = require("ue");
const puerts_1 = require("puerts");
const ts = require("typescript");
function some(array, predicate) {
    if (array) {
        if (predicate) {
            for (const v of array) {
                if (predicate(v)) {
                    return true;
                }
            }
        }
        else {
            return array.length > 0;
        }
    }
    return false;
}
const directorySeparator = "/";
const altDirectorySeparator = "\\";
const urlSchemeSeparator = "://";
const backslashRegExp = /\\/g;
const reservedCharacterPattern = /[^\w\s\/]/g;
const commonPackageFolders = ["node_modules", "bower_components", "jspm_packages"];
const implicitExcludePathRegexPattern = `(?!(${commonPackageFolders.join("|")})(/|$))`;
function normalizeSlashes(path) {
    return path.replace(backslashRegExp, directorySeparator);
}
function isVolumeCharacter(charCode) {
    return (charCode >= 97 /* a */ && charCode <= 122 /* z */) ||
        (charCode >= 65 /* A */ && charCode <= 90 /* Z */);
}
function getFileUrlVolumeSeparatorEnd(url, start) {
    const ch0 = url.charCodeAt(start);
    if (ch0 === 58 /* colon */)
        return start + 1;
    if (ch0 === 37 /* percent */ && url.charCodeAt(start + 1) === 51 /* _3 */) {
        const ch2 = url.charCodeAt(start + 2);
        if (ch2 === 97 /* a */ || ch2 === 65 /* A */)
            return start + 3;
    }
    return -1;
}
function getEncodedRootLength(path) {
    if (!path)
        return 0;
    const ch0 = path.charCodeAt(0);
    // POSIX or UNC
    if (ch0 === 47 /* slash */ || ch0 === 92 /* backslash */) {
        if (path.charCodeAt(1) !== ch0)
            return 1; // POSIX: "/" (or non-normalized "\")
        const p1 = path.indexOf(ch0 === 47 /* slash */ ? directorySeparator : altDirectorySeparator, 2);
        if (p1 < 0)
            return path.length; // UNC: "//server" or "\\server"
        return p1 + 1; // UNC: "//server/" or "\\server\"
    }
    // DOS
    if (isVolumeCharacter(ch0) && path.charCodeAt(1) === 58 /* colon */) {
        const ch2 = path.charCodeAt(2);
        if (ch2 === 47 /* slash */ || ch2 === 92 /* backslash */)
            return 3; // DOS: "c:/" or "c:\"
        if (path.length === 2)
            return 2; // DOS: "c:" (but not "c:d")
    }
    // URL
    const schemeEnd = path.indexOf(urlSchemeSeparator);
    if (schemeEnd !== -1) {
        const authorityStart = schemeEnd + urlSchemeSeparator.length;
        const authorityEnd = path.indexOf(directorySeparator, authorityStart);
        if (authorityEnd !== -1) { // URL: "file:///", "file://server/", "file://server/path"
            // For local "file" URLs, include the leading DOS volume (if present).
            // Per https://www.ietf.org/rfc/rfc1738.txt, a host of "" or "localhost" is a
            // special case interpreted as "the machine from which the URL is being interpreted".
            const scheme = path.slice(0, schemeEnd);
            const authority = path.slice(authorityStart, authorityEnd);
            if (scheme === "file" && (authority === "" || authority === "localhost") &&
                isVolumeCharacter(path.charCodeAt(authorityEnd + 1))) {
                const volumeSeparatorEnd = getFileUrlVolumeSeparatorEnd(path, authorityEnd + 2);
                if (volumeSeparatorEnd !== -1) {
                    if (path.charCodeAt(volumeSeparatorEnd) === 47 /* slash */) {
                        // URL: "file:///c:/", "file://localhost/c:/", "file:///c%3a/", "file://localhost/c%3a/"
                        return ~(volumeSeparatorEnd + 1);
                    }
                    if (volumeSeparatorEnd === path.length) {
                        // URL: "file:///c:", "file://localhost/c:", "file:///c$3a", "file://localhost/c%3a"
                        // but not "file:///c:d" or "file:///c%3ad"
                        return ~volumeSeparatorEnd;
                    }
                }
            }
            return ~(authorityEnd + 1); // URL: "file://server/", "http://server/"
        }
        return ~path.length; // URL: "file://server", "http://server"
    }
    // relative
    return 0;
}
function getRootLength(path) {
    const rootLength = getEncodedRootLength(path);
    return rootLength < 0 ? ~rootLength : rootLength;
}
function hasTrailingDirectorySeparator(path) {
    if (path.length === 0)
        return false;
    const ch = path.charCodeAt(path.length - 1);
    return ch === 47 /* slash */ || ch === 92 /* backslash */;
}
function ensureTrailingDirectorySeparator(path) {
    if (!hasTrailingDirectorySeparator(path)) {
        return path + directorySeparator;
    }
    return path;
}
function combinePaths(path, ...paths) {
    if (path)
        path = normalizeSlashes(path);
    for (let relativePath of paths) {
        if (!relativePath)
            continue;
        relativePath = normalizeSlashes(relativePath);
        if (!path || getRootLength(relativePath) !== 0) {
            path = relativePath;
        }
        else {
            path = ensureTrailingDirectorySeparator(path) + relativePath;
        }
    }
    return path;
}
function lastOrUndefined(array) {
    return array.length === 0 ? undefined : array[array.length - 1];
}
function pathComponents(path, rootLength) {
    const root = path.substring(0, rootLength);
    const rest = path.substring(rootLength).split(directorySeparator);
    if (rest.length && !lastOrUndefined(rest))
        rest.pop();
    return [root, ...rest];
}
function getPathComponents(path, currentDirectory = "") {
    path = combinePaths(currentDirectory, path);
    const rootLength = getRootLength(path);
    return pathComponents(path, rootLength);
}
function reducePathComponents(components) {
    if (!some(components))
        return [];
    const reduced = [components[0]];
    for (let i = 1; i < components.length; i++) {
        const component = components[i];
        if (!component)
            continue;
        if (component === ".")
            continue;
        if (component === "..") {
            if (reduced.length > 1) {
                if (reduced[reduced.length - 1] !== "..") {
                    reduced.pop();
                    continue;
                }
            }
            else if (reduced[0])
                continue;
        }
        reduced.push(component);
    }
    return reduced;
}
function getPathFromPathComponents(pathComponents) {
    if (pathComponents.length === 0)
        return "";
    const root = pathComponents[0] && ensureTrailingDirectorySeparator(pathComponents[0]);
    return root + pathComponents.slice(1).join(directorySeparator);
}
function resolvePath(path, ...paths) {
    const combined = some(paths) ? combinePaths(path, ...paths) : normalizeSlashes(path);
    const normalized = getPathFromPathComponents(reducePathComponents(getPathComponents(combined)));
    return normalized && hasTrailingDirectorySeparator(combined) ? ensureTrailingDirectorySeparator(normalized) : normalized;
}
function directoryExists(path) {
    let res = UE.FileSystemOperation.DirectoryExists(path);
    return res;
}
function createDirectory(path) {
    UE.FileSystemOperation.CreateDirectory(path);
}
function realpath(path) {
    return path;
}
const emptyArray = [];
const emptyFileSystemEntries = {
    files: emptyArray,
    directories: emptyArray
};
function getAccessibleFileSystemEntries(path) {
    try {
        const files = [];
        const directories = [];
        let dirArray = UE.FileSystemOperation.GetDirectories(path);
        for (var i = 0; i < dirArray.Num(); i++) {
            directories.push(dirArray.Get(i));
        }
        let fileArray = UE.FileSystemOperation.GetFiles(path);
        for (var i = 0; i < fileArray.Num(); i++) {
            files.push(fileArray.Get(i));
        }
        return { files, directories };
    }
    catch (e) {
        return emptyFileSystemEntries;
    }
}
function normalizePath(path) {
    return resolvePath(path);
}
function map(array, f) {
    let result;
    if (array) {
        result = [];
        for (let i = 0; i < array.length; i++) {
            result.push(f(array[i], i));
        }
    }
    return result;
}
function isArray(value) {
    return Array.isArray ? Array.isArray(value) : value instanceof Array;
}
function toOffset(array, offset) {
    return offset < 0 ? array.length + offset : offset;
}
function addRange(to, from, start, end) {
    if (from === undefined || from.length === 0)
        return to;
    if (to === undefined)
        return from.slice(start, end);
    start = start === undefined ? 0 : toOffset(from, start);
    end = end === undefined ? from.length : toOffset(from, end);
    for (let i = start; i < end && i < from.length; i++) {
        if (from[i] !== undefined) {
            to.push(from[i]);
        }
    }
    return to;
}
function append(to, value) {
    if (value === undefined)
        return to;
    if (to === undefined)
        return [value];
    to.push(value);
    return to;
}
function flatMap(array, mapfn) {
    let result;
    if (array) {
        for (let i = 0; i < array.length; i++) {
            const v = mapfn(array[i], i);
            if (v) {
                if (isArray(v)) {
                    result = addRange(result, v);
                }
                else {
                    result = append(result, v);
                }
            }
        }
    }
    return result || emptyArray;
}
function getNormalizedPathComponents(path, currentDirectory) {
    return reducePathComponents(getPathComponents(path, currentDirectory));
}
function last(array) {
    return array[array.length - 1];
}
function removeTrailingDirectorySeparator(path) {
    if (hasTrailingDirectorySeparator(path)) {
        return path.substr(0, path.length - 1);
    }
    return path;
}
function isImplicitGlob(lastPathComponent) {
    return !/[.*?]/.test(lastPathComponent);
}
function getSubPatternFromSpec(spec, basePath, usage, { singleAsteriskRegexFragment, doubleAsteriskRegexFragment, replaceWildcardCharacter }) {
    let subpattern = "";
    let hasWrittenComponent = false;
    const components = getNormalizedPathComponents(spec, basePath);
    const lastComponent = last(components);
    if (usage !== "exclude" && lastComponent === "**") {
        return undefined;
    }
    // getNormalizedPathComponents includes the separator for the root component.
    // We need to remove to create our regex correctly.
    components[0] = removeTrailingDirectorySeparator(components[0]);
    if (isImplicitGlob(lastComponent)) {
        components.push("**", "*");
    }
    let optionalCount = 0;
    for (let component of components) {
        if (component === "**") {
            subpattern += doubleAsteriskRegexFragment;
        }
        else {
            if (usage === "directories") {
                subpattern += "(";
                optionalCount++;
            }
            if (hasWrittenComponent) {
                subpattern += directorySeparator;
            }
            if (usage !== "exclude") {
                let componentPattern = "";
                // The * and ? wildcards should not match directories or files that start with . if they
                // appear first in a component. Dotted directories and files can be included explicitly
                // like so: **/.*/.*
                if (component.charCodeAt(0) === 42 /* asterisk */) {
                    componentPattern += "([^./]" + singleAsteriskRegexFragment + ")?";
                    component = component.substr(1);
                }
                else if (component.charCodeAt(0) === 63 /* question */) {
                    componentPattern += "[^./]";
                    component = component.substr(1);
                }
                componentPattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);
                // Patterns should not include subfolders like node_modules unless they are
                // explicitly included as part of the path.
                //
                // As an optimization, if the component pattern is the same as the component,
                // then there definitely were no wildcard characters and we do not need to
                // add the exclusion pattern.
                if (componentPattern !== component) {
                    subpattern += implicitExcludePathRegexPattern;
                }
                subpattern += componentPattern;
            }
            else {
                subpattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);
            }
        }
        //modify by john, 如果使用相对路径，最后面的pattern会添加一个/到开头，导致匹配失败
        // hasWrittenComponent = !!component;
        //modify by zombie，上述改动会导致Mac无法watch到TS文件，据车神说现在已经不用相对路径，因此回滚
        hasWrittenComponent = true;
    }
    while (optionalCount > 0) {
        subpattern += ")?";
        optionalCount--;
    }
    return subpattern;
}
function replaceWildcardCharacter(match, singleAsteriskRegexFragment) {
    return match === "*" ? singleAsteriskRegexFragment : match === "?" ? "[^/]" : "\\" + match;
}
const filesMatcher = {
    /**
     * Matches any single directory segment unless it is the last segment and a .min.js file
     * Breakdown:
     *  [^./]                   # matches everything up to the first . character (excluding directory separators)
     *  (\\.(?!min\\.js$))?     # matches . characters but not if they are part of the .min.js file extension
     */
    singleAsteriskRegexFragment: "([^./]|(\\.(?!min\\.js$))?)*",
    /**
     * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
     * files or directories, does not match subdirectories that start with a . character
     */
    doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
    replaceWildcardCharacter: match => replaceWildcardCharacter(match, filesMatcher.singleAsteriskRegexFragment)
};
const directoriesMatcher = {
    singleAsteriskRegexFragment: "[^/]*",
    /**
     * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
     * files or directories, does not match subdirectories that start with a . character
     */
    doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
    replaceWildcardCharacter: match => replaceWildcardCharacter(match, directoriesMatcher.singleAsteriskRegexFragment)
};
const excludeMatcher = {
    singleAsteriskRegexFragment: "[^/]*",
    doubleAsteriskRegexFragment: "(/.+?)?",
    replaceWildcardCharacter: match => replaceWildcardCharacter(match, excludeMatcher.singleAsteriskRegexFragment)
};
const wildcardMatchers = {
    files: filesMatcher,
    directories: directoriesMatcher,
    exclude: excludeMatcher
};
function getRegularExpressionsForWildcards(specs, basePath, usage) {
    if (specs === undefined || specs.length === 0) {
        return undefined;
    }
    return flatMap(specs, spec => spec && getSubPatternFromSpec(spec, basePath, usage, wildcardMatchers[usage]));
}
function getRegularExpressionForWildcard(specs, basePath, usage) {
    const patterns = getRegularExpressionsForWildcards(specs, basePath, usage);
    if (!patterns || !patterns.length) {
        return undefined;
    }
    const pattern = patterns.map(pattern => `(${pattern})`).join("|");
    // If excluding, match "foo/bar/baz...", but if including, only allow "foo".
    const terminator = usage === "exclude" ? "($|/)" : "$";
    return `^(${pattern})${terminator}`;
}
function isRootedDiskPath(path) {
    return getEncodedRootLength(path) > 0;
}
function contains(array, value, equalityComparer = equateValues) {
    if (array) {
        for (const v of array) {
            if (equalityComparer(v, value)) {
                return true;
            }
        }
    }
    return false;
}
function equateStringsCaseInsensitive(a, b) {
    return a === b
        || a !== undefined
            && b !== undefined
            && a.toUpperCase() === b.toUpperCase();
}
function equateValues(a, b) {
    return a === b;
}
function equateStringsCaseSensitive(a, b) {
    return equateValues(a, b);
}
function startsWith(str, prefix) {
    return str.lastIndexOf(prefix, 0) === 0;
}
function getAnyExtensionFromPathWorker(path, extensions, stringEqualityComparer) {
    if (typeof extensions === "string")
        extensions = [extensions];
    for (let extension of extensions) {
        if (!startsWith(extension, "."))
            extension = "." + extension;
        if (path.length >= extension.length && path.charAt(path.length - extension.length) === ".") {
            const pathExtension = path.slice(path.length - extension.length);
            if (stringEqualityComparer(pathExtension, extension)) {
                return pathExtension;
            }
        }
    }
    return "";
}
function getAnyExtensionFromPath(path, extensions, ignoreCase) {
    // Retrieves any string from the final "." onwards from a base file name.
    // Unlike extensionFromPath, which throws an exception on unrecognized extensions.
    if (extensions) {
        return getAnyExtensionFromPathWorker(path, extensions, ignoreCase ? equateStringsCaseInsensitive : equateStringsCaseSensitive);
    }
    const baseFileName = getBaseFileName(path);
    const extensionIndex = baseFileName.lastIndexOf(".");
    if (extensionIndex >= 0) {
        return baseFileName.substring(extensionIndex);
    }
    return "";
}
function getBaseFileName(path, extensions, ignoreCase) {
    path = normalizeSlashes(path);
    // if the path provided is itself the root, then it has not file name.
    const rootLength = getRootLength(path);
    if (rootLength === path.length)
        return "";
    // return the trailing portion of the path starting after the last (non-terminal) directory
    // separator but not including any trailing directory separator.
    path = removeTrailingDirectorySeparator(path);
    const name = path.slice(Math.max(getRootLength(path), path.lastIndexOf(directorySeparator) + 1));
    const extension = extensions !== undefined && ignoreCase !== undefined ? getAnyExtensionFromPath(name, extensions, ignoreCase) : undefined;
    return extension ? name.slice(0, name.length - extension.length) : name;
}
function stringContains(str, substring) {
    return str.indexOf(substring) !== -1;
}
function hasExtension(fileName) {
    return stringContains(getBaseFileName(fileName), ".");
}
function indexOfAnyCharCode(text, charCodes, start) {
    for (let i = start || 0; i < text.length; i++) {
        if (contains(charCodes, text.charCodeAt(i))) {
            return i;
        }
    }
    return -1;
}
const wildcardCharCodes = [42 /* asterisk */, 63 /* question */];
function getDirectoryPath(path) {
    path = normalizeSlashes(path);
    // If the path provided is itself the root, then return it.
    const rootLength = getRootLength(path);
    if (rootLength === path.length)
        return path;
    // return the leading portion of the path up to the last (non-terminal) directory separator
    // but not including any trailing directory separator.
    path = removeTrailingDirectorySeparator(path);
    return path.slice(0, Math.max(rootLength, path.lastIndexOf(directorySeparator)));
}
function getIncludeBasePath(absolute) {
    const wildcardOffset = indexOfAnyCharCode(absolute, wildcardCharCodes);
    if (wildcardOffset < 0) {
        // No "*" or "?" in the path
        return !hasExtension(absolute)
            ? absolute
            : removeTrailingDirectorySeparator(getDirectoryPath(absolute));
    }
    return absolute.substring(0, absolute.lastIndexOf(directorySeparator, wildcardOffset));
}
function compareComparableValues(a, b) {
    return a === b ? 0 /* EqualTo */ :
        a === undefined ? -1 /* LessThan */ :
            b === undefined ? 1 /* GreaterThan */ :
                a < b ? -1 /* LessThan */ :
                    1 /* GreaterThan */;
}
function compareStringsCaseInsensitive(a, b) {
    if (a === b)
        return 0 /* EqualTo */;
    if (a === undefined)
        return -1 /* LessThan */;
    if (b === undefined)
        return 1 /* GreaterThan */;
    a = a.toUpperCase();
    b = b.toUpperCase();
    return a < b ? -1 /* LessThan */ : a > b ? 1 /* GreaterThan */ : 0 /* EqualTo */;
}
function compareStringsCaseSensitive(a, b) {
    return compareComparableValues(a, b);
}
function getStringComparer(ignoreCase) {
    return ignoreCase ? compareStringsCaseInsensitive : compareStringsCaseSensitive;
}
function containsPath(parent, child, currentDirectory, ignoreCase) {
    if (typeof currentDirectory === "string") {
        parent = combinePaths(currentDirectory, parent);
        child = combinePaths(currentDirectory, child);
    }
    else if (typeof currentDirectory === "boolean") {
        ignoreCase = currentDirectory;
    }
    if (parent === undefined || child === undefined)
        return false;
    if (parent === child)
        return true;
    const parentComponents = reducePathComponents(getPathComponents(parent));
    const childComponents = reducePathComponents(getPathComponents(child));
    if (childComponents.length < parentComponents.length) {
        return false;
    }
    const componentEqualityComparer = ignoreCase ? equateStringsCaseInsensitive : equateStringsCaseSensitive;
    for (let i = 0; i < parentComponents.length; i++) {
        const equalityComparer = i === 0 ? equateStringsCaseInsensitive : componentEqualityComparer;
        if (!equalityComparer(parentComponents[i], childComponents[i])) {
            return false;
        }
    }
    return true;
}
function every(array, callback) {
    if (array) {
        for (let i = 0; i < array.length; i++) {
            if (!callback(array[i], i)) {
                return false;
            }
        }
    }
    return true;
}
function getBasePaths(path, includes, useCaseSensitiveFileNames) {
    // Storage for our results in the form of literal paths (e.g. the paths as written by the user).
    const basePaths = [path];
    if (includes) {
        // Storage for literal base paths amongst the include patterns.
        const includeBasePaths = [];
        for (const include of includes) {
            // We also need to check the relative paths by converting them to absolute and normalizing
            // in case they escape the base path (e.g "..\somedirectory")
            const absolute = isRootedDiskPath(include) ? include : normalizePath(combinePaths(path, include));
            // Append the literal and canonical candidate base paths.
            includeBasePaths.push(getIncludeBasePath(absolute));
        }
        // Sort the offsets array using either the literal or canonical path representations.
        includeBasePaths.sort(getStringComparer(!useCaseSensitiveFileNames));
        // Iterate over each include base path and include unique base paths that are not a
        // subpath of an existing base path
        for (const includeBasePath of includeBasePaths) {
            if (every(basePaths, basePath => !containsPath(basePath, includeBasePath, path, !useCaseSensitiveFileNames))) {
                basePaths.push(includeBasePath);
            }
        }
    }
    return basePaths;
}
function getFileMatcherPatterns(path, excludes, includes, useCaseSensitiveFileNames, currentDirectory) {
    path = normalizePath(path);
    currentDirectory = normalizePath(currentDirectory);
    const absolutePath = combinePaths(currentDirectory, path);
    return {
        includeFilePatterns: map(getRegularExpressionsForWildcards(includes, absolutePath, "files"), pattern => `^${pattern}$`),
        includeFilePattern: getRegularExpressionForWildcard(includes, absolutePath, "files"),
        includeDirectoryPattern: getRegularExpressionForWildcard(includes, absolutePath, "directories"),
        excludePattern: getRegularExpressionForWildcard(excludes, absolutePath, "exclude"),
        basePaths: getBasePaths(path, includes, useCaseSensitiveFileNames)
    };
}
function getRegexFromPattern(pattern, useCaseSensitiveFileNames) {
    return new RegExp(pattern, useCaseSensitiveFileNames ? "" : "i");
}
function createMap() {
    return new Map();
}
function identity(x) { return x; }
function toLowerCase(x) { return x.toLowerCase(); }
function createGetCanonicalFileName(useCaseSensitiveFileNames) {
    return useCaseSensitiveFileNames ? identity : toLowerCase;
}
function flatten(array) {
    const result = [];
    for (const v of array) {
        if (v) {
            if (isArray(v)) {
                addRange(result, v);
            }
            else {
                result.push(v);
            }
        }
    }
    return result;
}
function endsWith(str, suffix) {
    const expectedPos = str.length - suffix.length;
    return expectedPos >= 0 && str.indexOf(suffix, expectedPos) === expectedPos;
}
function fileExtensionIs(path, extension) {
    return path.length > extension.length && endsWith(path, extension);
}
function fileExtensionIsOneOf(path, extensions) {
    for (const extension of extensions) {
        if (fileExtensionIs(path, extension)) {
            return true;
        }
    }
    return false;
}
function sort(array, comparer) {
    return (array.length === 0 ? array : array.slice().sort(comparer));
}
function findIndex(array, predicate, startIndex) {
    for (let i = startIndex || 0; i < array.length; i++) {
        if (predicate(array[i], i)) {
            return i;
        }
    }
    return -1;
}
function matchFiles(path, extensions, excludes, includes, useCaseSensitiveFileNames, currentDirectory, depth, getFileSystemEntries, realpath) {
    path = normalizePath(path);
    currentDirectory = normalizePath(currentDirectory);
    const patterns = getFileMatcherPatterns(path, excludes, includes, useCaseSensitiveFileNames, currentDirectory);
    const includeFileRegexes = patterns.includeFilePatterns && patterns.includeFilePatterns.map(pattern => getRegexFromPattern(pattern, useCaseSensitiveFileNames));
    const includeDirectoryRegex = patterns.includeDirectoryPattern && getRegexFromPattern(patterns.includeDirectoryPattern, useCaseSensitiveFileNames);
    const excludeRegex = patterns.excludePattern && getRegexFromPattern(patterns.excludePattern, useCaseSensitiveFileNames);
    // Associate an array of results with each include regex. This keeps results in order of the "include" order.
    // If there are no "includes", then just put everything in results[0].
    const results = includeFileRegexes ? includeFileRegexes.map(() => []) : [[]];
    const visited = createMap();
    const toCanonical = createGetCanonicalFileName(useCaseSensitiveFileNames);
    for (const basePath of patterns.basePaths) {
        visitDirectory(basePath, combinePaths(currentDirectory, basePath), depth);
    }
    return flatten(results);
    function visitDirectory(path, absolutePath, depth) {
        const canonicalPath = toCanonical(realpath(absolutePath));
        if (visited.has(canonicalPath))
            return;
        visited.set(canonicalPath, true);
        const { files, directories } = getFileSystemEntries(path);
        for (const current of sort(files, compareStringsCaseSensitive)) {
            const name = combinePaths(path, current);
            const absoluteName = combinePaths(absolutePath, current);
            if (extensions && !fileExtensionIsOneOf(name, extensions))
                continue;
            if (excludeRegex && excludeRegex.test(absoluteName))
                continue;
            if (!includeFileRegexes) {
                results[0].push(name);
            }
            else {
                const includeIndex = findIndex(includeFileRegexes, re => re.test(absoluteName));
                if (includeIndex !== -1) {
                    results[includeIndex].push(name);
                }
            }
        }
        if (depth !== undefined) {
            depth--;
            if (depth === 0) {
                return;
            }
        }
        for (const current of sort(directories, compareStringsCaseSensitive)) {
            const name = combinePaths(path, current);
            const absoluteName = combinePaths(absolutePath, current);
            if ((!includeDirectoryRegex || includeDirectoryRegex.test(absoluteName)) &&
                (!excludeRegex || !excludeRegex.test(absoluteName))) {
                visitDirectory(name, absoluteName, depth);
            }
        }
    }
}
const extensionsToRemove = [".d.ts" /* Dts */, ".ts" /* Ts */, ".js" /* Js */, ".tsx" /* Tsx */, ".jsx" /* Jsx */, ".json" /* Json */];
function removeFileExtension(path) {
    for (const ext of extensionsToRemove) {
        const extensionless = tryRemoveExtension(path, ext);
        if (extensionless !== undefined) {
            return extensionless;
        }
    }
    return path;
}
function tryRemoveExtension(path, extension) {
    return fileExtensionIs(path, extension) ? removeExtension(path, extension) : undefined;
}
function removeExtension(path, extension) {
    return path.substring(0, path.length - extension.length);
}
function getSourceFilePathInNewDir(fileName, currentDirectory, commonSourceDirectory, newDirPath) {
    return getSourceFilePathInNewDirWorker(fileName, newDirPath, currentDirectory, commonSourceDirectory, createGetCanonicalFileName(true));
}
function getNormalizedAbsolutePath(fileName, currentDirectory) {
    return getPathFromPathComponents(getNormalizedPathComponents(fileName, currentDirectory));
}
function getSourceFilePathInNewDirWorker(fileName, newDirPath, currentDirectory, commonSourceDirectory, getCanonicalFileName) {
    let sourceFilePath = getNormalizedAbsolutePath(fileName, currentDirectory);
    const isSourceFileInCommonSourceDirectory = getCanonicalFileName(sourceFilePath).indexOf(getCanonicalFileName(commonSourceDirectory)) === 0;
    sourceFilePath = isSourceFileInCommonSourceDirectory ? sourceFilePath.substring(commonSourceDirectory.length) : sourceFilePath;
    return combinePaths(newDirPath, sourceFilePath);
}
//-----------------------end copy form typescript--------------------
function getCustomSystem() {
    const customSystem = {
        args: [],
        newLine: '\n',
        useCaseSensitiveFileNames: true,
        write,
        readFile,
        writeFile,
        resolvePath,
        fileExists,
        directoryExists,
        createDirectory,
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
            console.warn("readFile: read file fail! path=" + path);
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
        return matchFiles(path, extensions, excludes, includes, true, getCurrentDirectory(), depth, getAccessibleFileSystemEntries, realpath);
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
            console.warn(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.warn(`  Error: ${message}`);
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
    const fileVersions = {};
    // initialize the list of files
    fileNames.forEach(fileName => {
        fileVersions[fileName] = { version: "" };
    });
    function getDefaultLibLocation() {
        return getDirectoryPath(normalizePath(customSystem.getExecutingFilePath()));
    }
    // Create the language service host to allow the LS to communicate with the host
    const servicesHost = {
        getScriptFileNames: () => fileNames,
        getScriptVersion: fileName => {
            if (fileName in fileVersions) {
                return fileVersions[fileName] && fileVersions[fileName].version.toString();
            }
            else {
                let md5 = UE.FileSystemOperation.FileMD5Hash(fileName);
                fileVersions[fileName] = { version: md5 };
                return md5;
            }
        },
        getScriptSnapshot: fileName => {
            if (!customSystem.fileExists(fileName)) {
                console.log("getScriptSnapshot: file not existed! path=" + fileName);
                return undefined;
            }
            //console.log("getScriptSnapshot:"+ fileName + ",in:" + new Error().stack)
            return ts.ScriptSnapshot.fromString(customSystem.readFile(fileName));
        },
        getCurrentDirectory: customSystem.getCurrentDirectory,
        getCompilationSettings: () => options,
        getDefaultLibFileName: options => combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options)),
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
    let beginTime = new Date().getTime();
    let program = getProgramFromService();
    console.log("full compile using " + (new Date().getTime() - beginTime) + "ms");
    let diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) {
        logErrors(diagnostics);
    }
    else {
        fileNames.forEach(fileName => {
            onSourceFileAddOrChange(fileName, false, program);
        });
    }
    var dirWatcher = new UE.PEDirectoryWatcher();
    global.__dirWatcher = dirWatcher; //防止被释放?
    dirWatcher.OnChanged.Add((added, modified, removed) => {
        setTimeout(() => {
            if (added.Num() > 0) {
                onFileAdded();
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
                        }
                    }
                }
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
                fileVersions[fileName] = { version: "" };
            }
        });
        if (newFiles.length > 0) {
            fileNames = cmdLine.fileNames;
            options = cmdLine.options;
            program = getProgramFromService();
            newFiles.forEach(fileName => onSourceFileAddOrChange(fileName, true, program));
        }
    }
    function onSourceFileAddOrChange(sourceFilePath, reload, program) {
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
                if (!sourceFile.isDeclarationFile) {
                    let emitOutput = service.getEmitOutput(sourceFilePath);
                    if (!emitOutput.emitSkipped) {
                        let modulePath = undefined;
                        let moduleFileName = undefined;
                        let jsSource = undefined;
                        emitOutput.outputFiles.forEach(output => {
                            console.log(`write ${output.name} ...`);
                            UE.FileSystemOperation.WriteFile(output.name, output.text);
                            if (output.name.endsWith(".js")) {
                                jsSource = output.text;
                                if (options.outDir && output.name.startsWith(options.outDir)) {
                                    moduleFileName = output.name.substr(options.outDir.length + 1);
                                    modulePath = getDirectoryPath(moduleFileName);
                                    moduleFileName = removeExtension(moduleFileName, ".js");
                                }
                            }
                        });
                        if (moduleFileName && reload) {
                            UE.FileSystemOperation.PuertsNotifyChange(moduleFileName, jsSource);
                        }
                        let foundType = undefined;
                        let foundBaseTypeUClass = undefined;
                        ts.forEachChild(sourceFile, (node) => {
                            if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
                                const type = checker.getTypeAtLocation(node.expression);
                                if (!type || !type.getSymbol())
                                    return;
                                if (type.getSymbol().getName() != getBaseFileName(moduleFileName)) {
                                    //console.error("type name must the same as file name!");
                                    return;
                                }
                                let baseTypes = type.getBaseTypes();
                                if (!baseTypes || baseTypes.length != 1)
                                    return;
                                let baseTypeUClass = getUClassOfType(baseTypes[0]);
                                if (baseTypeUClass) {
                                    foundType = type;
                                    foundBaseTypeUClass = baseTypeUClass;
                                }
                                else {
                                    console.warn("can not find base for " + checker.typeToString(type));
                                }
                            }
                        });
                        if (foundType && foundBaseTypeUClass) {
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
            function getUClassOfType(type) {
                if (!type)
                    return undefined;
                if (getModule(type) == 'ue') {
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
                else if (type.symbol && type.symbol.valueDeclaration) {
                    //eturn undefined;
                    let baseTypes = type.getBaseTypes();
                    if (baseTypes.length != 1)
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
                            sourceFileName = removeExtension(fileName, '.js');
                        }
                    }
                    if (getBaseFileName(sourceFileName) != type.symbol.getName()) {
                        console.error("type name must the same as file name!");
                        return undefined;
                    }
                    if (options.outDir && sourceFileName.startsWith(options.outDir)) {
                        let moduleFileName = sourceFileName.substr(options.outDir.length + 1);
                        let modulePath = getDirectoryPath(moduleFileName);
                        let bp = new UE.PEBlueprintAsset();
                        bp.LoadOrCreate(type.getSymbol().getName(), modulePath, baseTypeUClass);
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
                    let typeNode = checker.typeToTypeNode(type);
                    //console.log(checker.typeToString(type), tds)
                    if (ts.isTypeReferenceNode(typeNode)) {
                        let typeName = type.symbol.getName();
                        if (typeName == 'BigInt') {
                            let category = "int64";
                            let pinType = new UE.PEGraphPinType(category, undefined, UE.EPinContainerType.None, false);
                            return { pinType: pinType };
                        }
                        if (!typeNode.typeArguments || typeNode.typeArguments.length == 0) {
                            let category = "object";
                            let uclass = getUClassOfType(type);
                            if (!uclass) {
                                let uenum = UE.Enum.Find(type.symbol.getName());
                                if (uenum) {
                                    return { pinType: new UE.PEGraphPinType("byte", uenum, UE.EPinContainerType.None, false) };
                                }
                                console.warn("can not find type of " + typeName);
                                return undefined;
                            }
                            let pinType = new UE.PEGraphPinType(category, uclass, UE.EPinContainerType.None, false);
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
                            if (!result || result.pinType.PinContainerType != UE.EPinContainerType.None) {
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
                        let pinType = new UE.PEGraphPinType(category, undefined, UE.EPinContainerType.None, false);
                        return { pinType: pinType };
                    }
                }
                catch (e) {
                    console.error(e.stack || e);
                    return undefined;
                }
            }
            function manualSkip(symbol) {
                const commentRanges = ts.getLeadingCommentRanges(sourceFile.getFullText(), symbol.valueDeclaration.getFullStart());
                return !!(commentRanges && commentRanges.find(r => sourceFile.getFullText().slice(r.pos, r.end).indexOf("@no-blueprint") > 0));
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
                            if (expression.expression.getFullText().endsWith(posfix)) {
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
            function onBlueprintTypeAddOrChange(baseTypeUClass, type, modulePath) {
                console.log(`gen blueprint for ${type.getSymbol().getName()}, path: ${modulePath}`);
                let bp = new UE.PEBlueprintAsset();
                bp.LoadOrCreate(type.getSymbol().getName(), modulePath, baseTypeUClass);
                let hasConstructor = false;
                checker.getPropertiesOfType(type)
                    .filter(x => ts.isClassDeclaration(x.valueDeclaration.parent) && checker.getSymbolAtLocation(x.valueDeclaration.parent.name) == type.symbol)
                    .filter(x => !manualSkip(x))
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
                            bp.AddParameter(signature.parameters[i].getName(), paramPinType.pinType, paramPinType.pinValueType);
                        }
                        //console.log("add function", symbol.getName());
                        let sflags = tryGetAnnotation(symbol.valueDeclaration, "flags", true);
                        let flags = getFlagsValue(sflags, FunctionFlags);
                        if (symbol.valueDeclaration && symbol.valueDeclaration.decorators) {
                            flags = Number(getDecoratorFlagsValue(symbol.valueDeclaration, ".flags", FunctionFlags));
                        }
                        if (symbol.valueDeclaration.type && (ts.SyntaxKind.VoidKeyword === symbol.valueDeclaration.type.kind)) {
                            bp.AddFunction(symbol.getName(), true, undefined, undefined, flags);
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
                            bp.AddFunction(symbol.getName(), false, resultPinType.pinType, resultPinType.pinValueType, flags);
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
                                cond = Number(getDecoratorFlagsValue(symbol.valueDeclaration, ".condition", ELifetimeCondition));
                                if (cond != 0) {
                                    flags = flags | BigInt(PropertyFlags.CPF_Net);
                                }
                                flags = flags | getDecoratorFlagsValue(symbol.valueDeclaration, ".flags", PropertyFlags);
                            }
                            bp.AddMemberVariable(symbol.getName(), propPinType.pinType, propPinType.pinValueType, Number(flags & 0xffffffffn), Number(flags >> 32n), cond);
                        }
                    }
                });
                bp.RemoveNotExistedMemberVariable();
                bp.RemoveNotExistedFunction();
                bp.HasConstructor = hasConstructor;
                bp.Save();
            }
            function getModule(type) {
                if (type.symbol && type.symbol.valueDeclaration && type.symbol.valueDeclaration.parent && ts.isModuleBlock(type.symbol.valueDeclaration.parent)) {
                    return type.symbol.valueDeclaration.parent.parent.name.text;
                }
            }
        }
    }
    //function getOwnEmitOutputFilePath(fileName: string) {
    function getModulePath(fileName) {
        const compilerOptions = options;
        let emitOutputFilePathWithoutExtension;
        if (compilerOptions.outDir) {
            emitOutputFilePathWithoutExtension = removeFileExtension(getSourceFilePathInNewDir(fileName, customSystem.getCurrentDirectory(), program.getCommonSourceDirectory(), options.outDir));
        }
        else {
            emitOutputFilePathWithoutExtension = removeFileExtension(fileName);
        }
        return emitOutputFilePathWithoutExtension;
    }
}
watch(customSystem.getCurrentDirectory() + "tsconfig.json");
//# sourceMappingURL=CodeAnalyze.js.map