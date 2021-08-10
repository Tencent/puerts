import * as UE from 'ue'
import {$ref, $unref, $set} from 'puerts';
import * as ts from "typescript";

//这部分代码从typescript库拷贝过来，另外一方案是实现node的fs以及buffer，这工作量也不少，而且typescript库拷贝过来的一些东西还是可以用得上的
//-----------------------begin copy form typescript--------------------
function some<T>(array: ReadonlyArray<T> | undefined): array is ReadonlyArray<T>;
function some<T>(array: ReadonlyArray<T> | undefined, predicate: (value: T) => boolean): boolean;
function some<T>(array: ReadonlyArray<T> | undefined, predicate?: (value: T) => boolean): boolean {
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
const commonPackageFolders: ReadonlyArray<string> = ["node_modules", "bower_components", "jspm_packages"];
const implicitExcludePathRegexPattern = `(?!(${commonPackageFolders.join("|")})(/|$))`;

function normalizeSlashes(path: string): string {
    return path.replace(backslashRegExp, directorySeparator);
}

const enum CharacterCodes {
    nullCharacter = 0,
    maxAsciiCharacter = 0x7F,

    lineFeed = 0x0A,              // \n
    carriageReturn = 0x0D,        // \r
    lineSeparator = 0x2028,
    paragraphSeparator = 0x2029,
    nextLine = 0x0085,

    // Unicode 3.0 space characters
    space = 0x0020,   // " "
    nonBreakingSpace = 0x00A0,   //
    enQuad = 0x2000,
    emQuad = 0x2001,
    enSpace = 0x2002,
    emSpace = 0x2003,
    threePerEmSpace = 0x2004,
    fourPerEmSpace = 0x2005,
    sixPerEmSpace = 0x2006,
    figureSpace = 0x2007,
    punctuationSpace = 0x2008,
    thinSpace = 0x2009,
    hairSpace = 0x200A,
    zeroWidthSpace = 0x200B,
    narrowNoBreakSpace = 0x202F,
    ideographicSpace = 0x3000,
    mathematicalSpace = 0x205F,
    ogham = 0x1680,

    _ = 0x5F,
    $ = 0x24,

    _0 = 0x30,
    _1 = 0x31,
    _2 = 0x32,
    _3 = 0x33,
    _4 = 0x34,
    _5 = 0x35,
    _6 = 0x36,
    _7 = 0x37,
    _8 = 0x38,
    _9 = 0x39,

    a = 0x61,
    b = 0x62,
    c = 0x63,
    d = 0x64,
    e = 0x65,
    f = 0x66,
    g = 0x67,
    h = 0x68,
    i = 0x69,
    j = 0x6A,
    k = 0x6B,
    l = 0x6C,
    m = 0x6D,
    n = 0x6E,
    o = 0x6F,
    p = 0x70,
    q = 0x71,
    r = 0x72,
    s = 0x73,
    t = 0x74,
    u = 0x75,
    v = 0x76,
    w = 0x77,
    x = 0x78,
    y = 0x79,
    z = 0x7A,

    A = 0x41,
    B = 0x42,
    C = 0x43,
    D = 0x44,
    E = 0x45,
    F = 0x46,
    G = 0x47,
    H = 0x48,
    I = 0x49,
    J = 0x4A,
    K = 0x4B,
    L = 0x4C,
    M = 0x4D,
    N = 0x4E,
    O = 0x4F,
    P = 0x50,
    Q = 0x51,
    R = 0x52,
    S = 0x53,
    T = 0x54,
    U = 0x55,
    V = 0x56,
    W = 0x57,
    X = 0x58,
    Y = 0x59,
    Z = 0x5a,

    ampersand = 0x26,             // &
    asterisk = 0x2A,              // *
    at = 0x40,                    // @
    backslash = 0x5C,             // \
    backtick = 0x60,              // `
    bar = 0x7C,                   // |
    caret = 0x5E,                 // ^
    closeBrace = 0x7D,            // }
    closeBracket = 0x5D,          // ]
    closeParen = 0x29,            // )
    colon = 0x3A,                 // :
    comma = 0x2C,                 // ,
    dot = 0x2E,                   // .
    doubleQuote = 0x22,           // "
    equals = 0x3D,                // =
    exclamation = 0x21,           // !
    greaterThan = 0x3E,           // >
    hash = 0x23,                  // #
    lessThan = 0x3C,              // <
    minus = 0x2D,                 // -
    openBrace = 0x7B,             // {
    openBracket = 0x5B,           // [
    openParen = 0x28,             // (
    percent = 0x25,               // %
    plus = 0x2B,                  // +
    question = 0x3F,              // ?
    semicolon = 0x3B,             // ;
    singleQuote = 0x27,           // '
    slash = 0x2F,                 // /
    tilde = 0x7E,                 // ~

    backspace = 0x08,             // \b
    formFeed = 0x0C,              // \f
    byteOrderMark = 0xFEFF,
    tab = 0x09,                   // \t
    verticalTab = 0x0B,           // \v
}

function isVolumeCharacter(charCode: number) {
    return (charCode >= CharacterCodes.a && charCode <= CharacterCodes.z) ||
        (charCode >= CharacterCodes.A && charCode <= CharacterCodes.Z);
}

function getFileUrlVolumeSeparatorEnd(url: string, start: number) {
    const ch0 = url.charCodeAt(start);
    if (ch0 === CharacterCodes.colon) return start + 1;
    if (ch0 === CharacterCodes.percent && url.charCodeAt(start + 1) === CharacterCodes._3) {
        const ch2 = url.charCodeAt(start + 2);
        if (ch2 === CharacterCodes.a || ch2 === CharacterCodes.A) return start + 3;
    }
    return -1;
}

function getEncodedRootLength(path: string): number {
    if (!path) return 0;
    const ch0 = path.charCodeAt(0);

    // POSIX or UNC
    if (ch0 === CharacterCodes.slash || ch0 === CharacterCodes.backslash) {
        if (path.charCodeAt(1) !== ch0) return 1; // POSIX: "/" (or non-normalized "\")

        const p1 = path.indexOf(ch0 === CharacterCodes.slash ? directorySeparator : altDirectorySeparator, 2);
        if (p1 < 0) return path.length; // UNC: "//server" or "\\server"

        return p1 + 1; // UNC: "//server/" or "\\server\"
    }

    // DOS
    if (isVolumeCharacter(ch0) && path.charCodeAt(1) === CharacterCodes.colon) {
        const ch2 = path.charCodeAt(2);
        if (ch2 === CharacterCodes.slash || ch2 === CharacterCodes.backslash) return 3; // DOS: "c:/" or "c:\"
        if (path.length === 2) return 2; // DOS: "c:" (but not "c:d")
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
                    if (path.charCodeAt(volumeSeparatorEnd) === CharacterCodes.slash) {
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

function getRootLength(path: string) {
    const rootLength = getEncodedRootLength(path);
    return rootLength < 0 ? ~rootLength : rootLength;
}

function hasTrailingDirectorySeparator(path: string) {
    if (path.length === 0) return false;
    const ch = path.charCodeAt(path.length - 1);
    return ch === CharacterCodes.slash || ch === CharacterCodes.backslash;
}

type Path = string & { __pathBrand: any };

function ensureTrailingDirectorySeparator(path: Path): Path;
function ensureTrailingDirectorySeparator(path: string): string;
function ensureTrailingDirectorySeparator(path: string) {
    if (!hasTrailingDirectorySeparator(path)) {
        return path + directorySeparator;
    }

    return path;
}

function combinePaths(path: string, ...paths: (string | undefined)[]): string {
    if (path) path = normalizeSlashes(path);
    for (let relativePath of paths) {
        if (!relativePath) continue;
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

function lastOrUndefined<T>(array: ReadonlyArray<T>): T | undefined {
    return array.length === 0 ? undefined : array[array.length - 1];
}

function pathComponents(path: string, rootLength: number) {
    const root = path.substring(0, rootLength);
    const rest = path.substring(rootLength).split(directorySeparator);
    if (rest.length && !lastOrUndefined(rest)) rest.pop();
    return [root, ...rest];
}

function getPathComponents(path: string, currentDirectory = "") {
    path = combinePaths(currentDirectory, path);
    const rootLength = getRootLength(path);
    return pathComponents(path, rootLength);
}

function reducePathComponents(components: ReadonlyArray<string>) {
    if (!some(components)) return [];
    const reduced = [components[0]];
    for (let i = 1; i < components.length; i++) {
        const component = components[i];
        if (!component) continue;
        if (component === ".") continue;
        if (component === "..") {
            if (reduced.length > 1) {
                if (reduced[reduced.length - 1] !== "..") {
                    reduced.pop();
                    continue;
                }
            }
            else if (reduced[0]) continue;
        }
        reduced.push(component);
    }
    return reduced;
}

function getPathFromPathComponents(pathComponents: ReadonlyArray<string>) {
    if (pathComponents.length === 0) return "";

    const root = pathComponents[0] && ensureTrailingDirectorySeparator(pathComponents[0]);
    return root + pathComponents.slice(1).join(directorySeparator);
}

function resolvePath(path: string, ...paths: (string | undefined)[]): string {
    const combined = some(paths) ? combinePaths(path, ...paths) : normalizeSlashes(path);
    const normalized = getPathFromPathComponents(reducePathComponents(getPathComponents(combined)));
    return normalized && hasTrailingDirectorySeparator(combined) ? ensureTrailingDirectorySeparator(normalized) : normalized;
}

function directoryExists(path: string): boolean {
    let res = UE.FileSystemOperation.DirectoryExists(path);
    return res;
}

function createDirectory(path: string): void {
    UE.FileSystemOperation.CreateDirectory(path);
}

function realpath(path: string): string {
    return path;
}

const emptyArray: never[] = [] as never[];

const emptyFileSystemEntries: FileSystemEntries = {
    files: emptyArray,
    directories: emptyArray
};

function getAccessibleFileSystemEntries(path: string): FileSystemEntries {
    try {
        const files: string[] = [];
        const directories: string[] = [];
        let dirArray = UE.FileSystemOperation.GetDirectories(path);
        for(var i=0; i < dirArray.Num(); i++) {
            directories.push(dirArray.Get(i));
        }
        let fileArray = UE.FileSystemOperation.GetFiles(path);
        for(var i = 0; i < fileArray.Num(); i++) {
            files.push(fileArray.Get(i));
        }
        return { files, directories };
    }
    catch (e) {
        return emptyFileSystemEntries;
    }
}

function normalizePath(path: string): string {
    return resolvePath(path);
}

function map<T, U>(array: ReadonlyArray<T>, f: (x: T, i: number) => U): U[];
function map<T, U>(array: ReadonlyArray<T> | undefined, f: (x: T, i: number) => U): U[] | undefined;
function map<T, U>(array: ReadonlyArray<T> | undefined, f: (x: T, i: number) => U): U[] | undefined {
    let result: U[] | undefined;
    if (array) {
        result = [];
        for (let i = 0; i < array.length; i++) {
            result.push(f(array[i], i));
        }
    }
    return result;
}

function isArray(value: any): value is ReadonlyArray<{}> {
    return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

function toOffset(array: ReadonlyArray<any>, offset: number) {
    return offset < 0 ? array.length + offset : offset;
}

function addRange<T>(to: T[], from: ReadonlyArray<T> | undefined, start?: number, end?: number): T[];
function addRange<T>(to: T[] | undefined, from: ReadonlyArray<T> | undefined, start?: number, end?: number): T[] | undefined;
function addRange<T>(to: T[] | undefined, from: ReadonlyArray<T> | undefined, start?: number, end?: number): T[] | undefined {
    if (from === undefined || from.length === 0) return to;
    if (to === undefined) return from.slice(start, end);
    start = start === undefined ? 0 : toOffset(from, start);
    end = end === undefined ? from.length : toOffset(from, end);
    for (let i = start; i < end && i < from.length; i++) {
        if (from[i] !== undefined) {
            to.push(from[i]);
        }
    }
    return to;
}

interface Push<T> {
    push(...values: T[]): void;
}

function append<TArray extends any[] | undefined, TValue extends NonNullable<TArray>[number] | undefined>(to: TArray, value: TValue): [undefined, undefined] extends [TArray, TValue] ? TArray : NonNullable<TArray>[number][];
function append<T>(to: T[], value: T | undefined): T[];
function append<T>(to: T[] | undefined, value: T): T[];
function append<T>(to: T[] | undefined, value: T | undefined): T[] | undefined;
function append<T>(to: Push<T>, value: T | undefined): void;
function append<T>(to: T[], value: T | undefined): T[] | undefined {
    if (value === undefined) return to;
    if (to === undefined) return [value];
    to.push(value);
    return to;
}

function flatMap<T, U>(array: ReadonlyArray<T> | undefined, mapfn: (x: T, i: number) => U | ReadonlyArray<U> | undefined): ReadonlyArray<U> {
    let result: U[] | undefined;
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

function getNormalizedPathComponents(path: string, currentDirectory: string | undefined) {
    return reducePathComponents(getPathComponents(path, currentDirectory));
}

function last<T>(array: ReadonlyArray<T>): T {
    return array[array.length - 1];
}

function removeTrailingDirectorySeparator(path: Path): Path;
function removeTrailingDirectorySeparator(path: string): string;
function removeTrailingDirectorySeparator(path: string) {
    if (hasTrailingDirectorySeparator(path)) {
        return path.substr(0, path.length - 1);
    }

    return path;
}

function isImplicitGlob(lastPathComponent: string): boolean {
    return !/[.*?]/.test(lastPathComponent);
}

function getSubPatternFromSpec(spec: string, basePath: string, usage: "files" | "directories" | "exclude", { singleAsteriskRegexFragment, doubleAsteriskRegexFragment, replaceWildcardCharacter }: WildcardMatcher): string | undefined {
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
                if (component.charCodeAt(0) === CharacterCodes.asterisk) {
                    componentPattern += "([^./]" + singleAsteriskRegexFragment + ")?";
                    component = component.substr(1);
                }
                else if (component.charCodeAt(0) === CharacterCodes.question) {
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

function replaceWildcardCharacter(match: string, singleAsteriskRegexFragment: string) {
    return match === "*" ? singleAsteriskRegexFragment : match === "?" ? "[^/]" : "\\" + match;
}

interface WildcardMatcher {
    singleAsteriskRegexFragment: string;
    doubleAsteriskRegexFragment: string;
    replaceWildcardCharacter: (match: string) => string;
}

const filesMatcher: WildcardMatcher = {
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

const directoriesMatcher: WildcardMatcher = {
    singleAsteriskRegexFragment: "[^/]*",
    /**
     * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
     * files or directories, does not match subdirectories that start with a . character
     */
    doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
    replaceWildcardCharacter: match => replaceWildcardCharacter(match, directoriesMatcher.singleAsteriskRegexFragment)
};

const excludeMatcher: WildcardMatcher = {
    singleAsteriskRegexFragment: "[^/]*",
    doubleAsteriskRegexFragment: "(/.+?)?",
    replaceWildcardCharacter: match => replaceWildcardCharacter(match, excludeMatcher.singleAsteriskRegexFragment)
};

const wildcardMatchers = {
    files: filesMatcher,
    directories: directoriesMatcher,
    exclude: excludeMatcher
};

function getRegularExpressionsForWildcards(specs: ReadonlyArray<string> | undefined, basePath: string, usage: "files" | "directories" | "exclude"): ReadonlyArray<string> | undefined {
    if (specs === undefined || specs.length === 0) {
        return undefined;
    }

    return flatMap(specs, spec =>
        spec && getSubPatternFromSpec(spec, basePath, usage, wildcardMatchers[usage]));
}

function getRegularExpressionForWildcard(specs: ReadonlyArray<string> | undefined, basePath: string, usage: "files" | "directories" | "exclude"): string | undefined {
    const patterns = getRegularExpressionsForWildcards(specs, basePath, usage);
    if (!patterns || !patterns.length) {
        return undefined;
    }

    const pattern = patterns.map(pattern => `(${pattern})`).join("|");
    // If excluding, match "foo/bar/baz...", but if including, only allow "foo".
    const terminator = usage === "exclude" ? "($|/)" : "$";
    return `^(${pattern})${terminator}`;
}

function isRootedDiskPath(path: string) {
    return getEncodedRootLength(path) > 0;
}

type EqualityComparer<T> = (a: T, b: T) => boolean;

function contains<T>(array: ReadonlyArray<T> | undefined, value: T, equalityComparer: EqualityComparer<T> = equateValues): boolean {
    if (array) {
        for (const v of array) {
            if (equalityComparer(v, value)) {
                return true;
            }
        }
    }
    return false;
}

function equateStringsCaseInsensitive(a: string, b: string) {
    return a === b
        || a !== undefined
        && b !== undefined
        && a.toUpperCase() === b.toUpperCase();
}

function equateValues<T>(a: T, b: T) {
    return a === b;
}

function equateStringsCaseSensitive(a: string, b: string) {
    return equateValues(a, b);
}

function startsWith(str: string, prefix: string): boolean {
    return str.lastIndexOf(prefix, 0) === 0;
}

function getAnyExtensionFromPathWorker(path: string, extensions: string | ReadonlyArray<string>, stringEqualityComparer: (a: string, b: string) => boolean) {
    if (typeof extensions === "string") extensions = [extensions];
    for (let extension of extensions) {
        if (!startsWith(extension, ".")) extension = "." + extension;
        if (path.length >= extension.length && path.charAt(path.length - extension.length) === ".") {
            const pathExtension = path.slice(path.length - extension.length);
            if (stringEqualityComparer(pathExtension, extension)) {
                return pathExtension;
            }
        }
    }
    return "";
}

function getAnyExtensionFromPath(path: string): string;
function getAnyExtensionFromPath(path: string, extensions: string | ReadonlyArray<string>, ignoreCase: boolean): string;
function getAnyExtensionFromPath(path: string, extensions?: string | ReadonlyArray<string>, ignoreCase?: boolean): string {
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

function getBaseFileName(path: string): string;
function getBaseFileName(path: string, extensions: string | ReadonlyArray<string>, ignoreCase: boolean): string;
function getBaseFileName(path: string, extensions?: string | ReadonlyArray<string>, ignoreCase?: boolean) {
    path = normalizeSlashes(path);

    // if the path provided is itself the root, then it has not file name.
    const rootLength = getRootLength(path);
    if (rootLength === path.length) return "";

    // return the trailing portion of the path starting after the last (non-terminal) directory
    // separator but not including any trailing directory separator.
    path = removeTrailingDirectorySeparator(path);
    const name = path.slice(Math.max(getRootLength(path), path.lastIndexOf(directorySeparator) + 1));
    const extension = extensions !== undefined && ignoreCase !== undefined ? getAnyExtensionFromPath(name, extensions, ignoreCase) : undefined;
    return extension ? name.slice(0, name.length - extension.length) : name;
}

function stringContains(str: string, substring: string): boolean {
    return str.indexOf(substring) !== -1;
}

function hasExtension(fileName: string): boolean {
    return stringContains(getBaseFileName(fileName), ".");
}

function indexOfAnyCharCode(text: string, charCodes: ReadonlyArray<number>, start?: number): number {
    for (let i = start || 0; i < text.length; i++) {
        if (contains(charCodes, text.charCodeAt(i))) {
            return i;
        }
    }
    return -1;
}

const wildcardCharCodes = [CharacterCodes.asterisk, CharacterCodes.question];

function getDirectoryPath(path: string): string;
function getDirectoryPath(path: string): string {
    path = normalizeSlashes(path);

    // If the path provided is itself the root, then return it.
    const rootLength = getRootLength(path);
    if (rootLength === path.length) return path;

    // return the leading portion of the path up to the last (non-terminal) directory separator
    // but not including any trailing directory separator.
    path = removeTrailingDirectorySeparator(path);
    return path.slice(0, Math.max(rootLength, path.lastIndexOf(directorySeparator)));
}

function getIncludeBasePath(absolute: string): string {
    const wildcardOffset = indexOfAnyCharCode(absolute, wildcardCharCodes);
    if (wildcardOffset < 0) {
        // No "*" or "?" in the path
        return !hasExtension(absolute)
            ? absolute
            : removeTrailingDirectorySeparator(getDirectoryPath(absolute));
    }
    return absolute.substring(0, absolute.lastIndexOf(directorySeparator, wildcardOffset));
}

const enum Comparison {
    LessThan    = -1,
    EqualTo     = 0,
    GreaterThan = 1
}

function compareComparableValues(a: string | undefined, b: string | undefined): Comparison;
function compareComparableValues(a: number | undefined, b: number | undefined): Comparison;
function compareComparableValues(a: string | number | undefined, b: string | number | undefined) {
    return a === b ? Comparison.EqualTo :
        a === undefined ? Comparison.LessThan :
        b === undefined ? Comparison.GreaterThan :
        a < b ? Comparison.LessThan :
        Comparison.GreaterThan;
}

function compareStringsCaseInsensitive(a: string, b: string) {
    if (a === b) return Comparison.EqualTo;
    if (a === undefined) return Comparison.LessThan;
    if (b === undefined) return Comparison.GreaterThan;
    a = a.toUpperCase();
    b = b.toUpperCase();
    return a < b ? Comparison.LessThan : a > b ? Comparison.GreaterThan : Comparison.EqualTo;
}

function compareStringsCaseSensitive(a: string | undefined, b: string | undefined): Comparison {
    return compareComparableValues(a, b);
}

function getStringComparer(ignoreCase?: boolean) {
    return ignoreCase ? compareStringsCaseInsensitive : compareStringsCaseSensitive;
}

function containsPath(parent: string, child: string, ignoreCase?: boolean): boolean;
function containsPath(parent: string, child: string, currentDirectory: string, ignoreCase?: boolean): boolean;
function containsPath(parent: string, child: string, currentDirectory?: string | boolean, ignoreCase?: boolean) {
    if (typeof currentDirectory === "string") {
        parent = combinePaths(currentDirectory, parent);
        child = combinePaths(currentDirectory, child);
    }
    else if (typeof currentDirectory === "boolean") {
        ignoreCase = currentDirectory;
    }
    if (parent === undefined || child === undefined) return false;
    if (parent === child) return true;
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

function every<T>(array: ReadonlyArray<T>, callback: (element: T, index: number) => boolean): boolean {
    if (array) {
        for (let i = 0; i < array.length; i++) {
            if (!callback(array[i], i)) {
                return false;
            }
        }
    }

    return true;
}

function getBasePaths(path: string, includes: ReadonlyArray<string> | undefined, useCaseSensitiveFileNames: boolean): string[] {
    // Storage for our results in the form of literal paths (e.g. the paths as written by the user).
    const basePaths: string[] = [path];

    if (includes) {
        // Storage for literal base paths amongst the include patterns.
        const includeBasePaths: string[] = [];
        for (const include of includes) {
            // We also need to check the relative paths by converting them to absolute and normalizing
            // in case they escape the base path (e.g "..\somedirectory")
            const absolute: string = isRootedDiskPath(include) ? include : normalizePath(combinePaths(path, include));
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

interface FileMatcherPatterns {
    /** One pattern for each "include" spec. */
    includeFilePatterns: ReadonlyArray<string> | undefined;
    /** One pattern matching one of any of the "include" specs. */
    includeFilePattern: string | undefined;
    includeDirectoryPattern: string | undefined;
    excludePattern: string | undefined;
    basePaths: ReadonlyArray<string>;
}

function getFileMatcherPatterns(path: string, excludes: ReadonlyArray<string> | undefined, includes: ReadonlyArray<string> | undefined, useCaseSensitiveFileNames: boolean, currentDirectory: string): FileMatcherPatterns {
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

function getRegexFromPattern(pattern: string, useCaseSensitiveFileNames: boolean): RegExp {
    return new RegExp(pattern, useCaseSensitiveFileNames ? "" : "i");
}

function createMap<T>(): Map<string, T> {
    return new Map<string, T>();
}

function identity<T>(x: T) { return x; }

function toLowerCase(x: string) { return x.toLowerCase(); }

type GetCanonicalFileName = (fileName: string) => string;
function createGetCanonicalFileName(useCaseSensitiveFileNames: boolean): GetCanonicalFileName {
    return useCaseSensitiveFileNames ? identity : toLowerCase;
}

function flatten<T>(array: T[][] | ReadonlyArray<T | ReadonlyArray<T> | undefined>): T[] {
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

function endsWith(str: string, suffix: string): boolean {
    const expectedPos = str.length - suffix.length;
    return expectedPos >= 0 && str.indexOf(suffix, expectedPos) === expectedPos;
}

function fileExtensionIs(path: string, extension: string): boolean {
    return path.length > extension.length && endsWith(path, extension);
}

function fileExtensionIsOneOf(path: string, extensions: ReadonlyArray<string>): boolean {
    for (const extension of extensions) {
        if (fileExtensionIs(path, extension)) {
            return true;
        }
    }

    return false;
}

type Comparer<T> = (a: T, b: T) => Comparison;

interface SortedReadonlyArray<T> extends ReadonlyArray<T> {
    " __sortedArrayBrand": any;
}

function sort<T>(array: ReadonlyArray<T>, comparer?: Comparer<T>): SortedReadonlyArray<T> {
    return (array.length === 0 ? array : array.slice().sort(comparer)) as SortedReadonlyArray<T>;
}

function findIndex<T>(array: ReadonlyArray<T>, predicate: (element: T, index: number) => boolean, startIndex?: number): number {
    for (let i = startIndex || 0; i < array.length; i++) {
        if (predicate(array[i], i)) {
            return i;
        }
    }
    return -1;
}

interface FileSystemEntries {
    readonly files: ReadonlyArray<string>;
    readonly directories: ReadonlyArray<string>;
}

function matchFiles(path: string, extensions: ReadonlyArray<string> | undefined, excludes: ReadonlyArray<string> | undefined, includes: ReadonlyArray<string> | undefined, useCaseSensitiveFileNames: boolean,
        currentDirectory: string, depth: number | undefined,
        getFileSystemEntries: (path: string) => FileSystemEntries, realpath: (path: string) => string): string[] {
    path = normalizePath(path);
    currentDirectory = normalizePath(currentDirectory);

    const patterns = getFileMatcherPatterns(path, excludes, includes, useCaseSensitiveFileNames, currentDirectory);

    const includeFileRegexes = patterns.includeFilePatterns && patterns.includeFilePatterns.map(pattern => getRegexFromPattern(pattern, useCaseSensitiveFileNames));
    const includeDirectoryRegex = patterns.includeDirectoryPattern && getRegexFromPattern(patterns.includeDirectoryPattern, useCaseSensitiveFileNames);
    const excludeRegex = patterns.excludePattern && getRegexFromPattern(patterns.excludePattern, useCaseSensitiveFileNames);

    // Associate an array of results with each include regex. This keeps results in order of the "include" order.
    // If there are no "includes", then just put everything in results[0].
    const results: string[][] = includeFileRegexes ? includeFileRegexes.map(() => []) : [[]];
    const visited = createMap<true>();
    const toCanonical = createGetCanonicalFileName(useCaseSensitiveFileNames);
    for (const basePath of patterns.basePaths) {
        visitDirectory(basePath, combinePaths(currentDirectory, basePath), depth);
    }

    return flatten(results);

    function visitDirectory(path: string, absolutePath: string, depth: number | undefined) {
        const canonicalPath = toCanonical(realpath(absolutePath));
        if (visited.has(canonicalPath)) return;
        visited.set(canonicalPath, true);
        const { files, directories } = getFileSystemEntries(path);

        for (const current of sort<string>(files, compareStringsCaseSensitive)) {
            const name = combinePaths(path, current);
            const absoluteName = combinePaths(absolutePath, current);
            if (extensions && !fileExtensionIsOneOf(name, extensions)) continue;
            if (excludeRegex && excludeRegex.test(absoluteName)) continue;
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

        for (const current of sort<string>(directories, compareStringsCaseSensitive)) {
            const name = combinePaths(path, current);
            const absoluteName = combinePaths(absolutePath, current);
            if ((!includeDirectoryRegex || includeDirectoryRegex.test(absoluteName)) &&
                (!excludeRegex || !excludeRegex.test(absoluteName))) {
                visitDirectory(name, absoluteName, depth);
            }
        }
    }
}

const enum Extension {
    Ts = ".ts",
    Tsx = ".tsx",
    Dts = ".d.ts",
    Js = ".js",
    Jsx = ".jsx",
    Json = ".json",
    TsBuildInfo = ".tsbuildinfo"
}

const extensionsToRemove = [Extension.Dts, Extension.Ts, Extension.Js, Extension.Tsx, Extension.Jsx, Extension.Json];
function removeFileExtension(path: string): string {
    for (const ext of extensionsToRemove) {
        const extensionless = tryRemoveExtension(path, ext);
        if (extensionless !== undefined) {
            return extensionless;
        }
    }
    return path;
}

function tryRemoveExtension(path: string, extension: string): string | undefined {
    return fileExtensionIs(path, extension) ? removeExtension(path, extension) : undefined;
}

function removeExtension(path: string, extension: string): string {
    return path.substring(0, path.length - extension.length);
}

function getSourceFilePathInNewDir(fileName: string, currentDirectory: string, commonSourceDirectory:string, newDirPath: string): string {
    return getSourceFilePathInNewDirWorker(fileName, newDirPath, currentDirectory, commonSourceDirectory, createGetCanonicalFileName(true));
}

function getNormalizedAbsolutePath(fileName: string, currentDirectory: string | undefined) {
    return getPathFromPathComponents(getNormalizedPathComponents(fileName, currentDirectory));
}

function getSourceFilePathInNewDirWorker(fileName: string, newDirPath: string, currentDirectory: string, commonSourceDirectory: string, getCanonicalFileName: GetCanonicalFileName): string {
    let sourceFilePath = getNormalizedAbsolutePath(fileName, currentDirectory);
    const isSourceFileInCommonSourceDirectory = getCanonicalFileName(sourceFilePath).indexOf(getCanonicalFileName(commonSourceDirectory)) === 0;
    sourceFilePath = isSourceFileInCommonSourceDirectory ? sourceFilePath.substring(commonSourceDirectory.length) : sourceFilePath;
    return combinePaths(newDirPath, sourceFilePath);
}
//-----------------------end copy form typescript--------------------

function getCustomSystem(): ts.System {
    const customSystem: ts.System = {
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
    }

    function fileExists(path: string): boolean {
        let res = UE.FileSystemOperation.FileExists(path);
        //console.log(`${path} exists? ${res}`);
        return res;
    }

    function write(s: string): void {
        console.log(s);
    }

    function readFile(path: string, encoding?: string): string | undefined {
        let data = $ref<string>(undefined);
        const res = UE.FileSystemOperation.ReadFile(path, data);
        if (res) {
            return $unref(data);
        } else {
            console.warn("readFile: read file fail! path=" + path);
            return undefined;
        }
    }

    function writeFile(path: string, data: string, writeByteOrderMark?: boolean): void {
        throw new Error("forbiden!")
    }

    /*function resolvePath(path: string): string {
        throw new Error("resolvePath no supported!");
    }*/

    function readDirectory(path: string, extensions?: ReadonlyArray<string>, excludes?: ReadonlyArray<string>, includes?: ReadonlyArray<string>, depth?: number): string[] {
        //throw new Error("readDirectory no supported!");
        return matchFiles(path, extensions, excludes, includes, true, getCurrentDirectory(), depth, getAccessibleFileSystemEntries, realpath);
    }

    function exit(exitCode?: number): void {
        throw new Error("exit with code:" + exitCode);
    }

    function getExecutingFilePath(): string {
        return getCurrentDirectory() + "Content/JavaScript/PuertsEditor/node_modules/typescript/lib/tsc.js";
    }

    function getCurrentDirectory(): string {
        return UE.FileSystemOperation.GetCurrentDirectory();
    }
    
    function getDirectories(path: string): string[] {
        let result: string[] = [];
        let dirs = UE.FileSystemOperation.GetDirectories(path);
        for(var i=0; i < dirs.Num(); i++) {
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

let customSystem = getCustomSystem()
if (!ts.sys) {
    let t : any = ts;
    t.sys = customSystem;
}

function logErrors(allDiagnostics: readonly ts.Diagnostic[]) {
    allDiagnostics.forEach(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (diagnostic.file) {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start!
        );
        console.warn(`  Error ${diagnostic.file.fileName} (${line + 1},${character +1}): ${message}`);
      } else {
        console.warn(`  Error: ${message}`);
      }
    });
}

type PinCategory = "bool" | "class" | "int64" | "string" | "object" | "struct" | "float" | "enum" | "softobject" | "softclass";

const FunctionFlags = {
    FUNC_None				: 0x00000000,

	FUNC_Final				: 0x00000001,	// Function is final (prebindable, non-overridable function).
	FUNC_RequiredAPI			: 0x00000002,	// Indicates this function is DLL exported/imported.
	FUNC_BlueprintAuthorityOnly: 0x00000004,   // Function will only run if the object has network authority
	FUNC_BlueprintCosmetic	: 0x00000008,   // Function is cosmetic in nature and should not be invoked on dedicated servers
	// FUNC_				: 0x00000010,   // unused.
	// FUNC_				: 0x00000020,   // unused.
	FUNC_Net				: 0x00000040,   // Function is network-replicated.
	FUNC_NetReliable		: 0x00000080,   // Function should be sent reliably on the network.
	FUNC_NetRequest			: 0x00000100,	// Function is sent to a net service
	FUNC_Exec				: 0x00000200,	// Executable from command line.
	FUNC_Native				: 0x00000400,	// Native function.
	FUNC_Event				: 0x00000800,   // Event function.
	FUNC_NetResponse		: 0x00001000,   // Function response from a net service
	FUNC_Static				: 0x00002000,   // Static function.
	FUNC_NetMulticast		: 0x00004000,	// Function is networked multicast Server -> All Clients
	FUNC_UbergraphFunction	: 0x00008000,   // Function is used as the merge 'ubergraph' for a blueprint, only assigned when using the persistent 'ubergraph' frame
	FUNC_MulticastDelegate	: 0x00010000,	// Function is a multi-cast delegate signature (also requires FUNC_Delegate to be set!)
	FUNC_Public				: 0x00020000,	// Function is accessible in all classes (if overridden, parameters must remain unchanged).
	FUNC_Private			: 0x00040000,	// Function is accessible only in the class it is defined in (cannot be overridden, but function name may be reused in subclasses.  IOW: if overridden, parameters don't need to match, and Super.Func() cannot be accessed since it's private.)
	FUNC_Protected			: 0x00080000,	// Function is accessible only in the class it is defined in and subclasses (if overridden, parameters much remain unchanged).
	FUNC_Delegate			: 0x00100000,	// Function is delegate signature (either single-cast or multi-cast, depending on whether FUNC_MulticastDelegate is set.)
	FUNC_NetServer			: 0x00200000,	// Function is executed on servers (set by replication code if passes check)
	FUNC_HasOutParms		: 0x00400000,	// function has out (pass by reference) parameters
	FUNC_HasDefaults		: 0x00800000,	// function has structs that contain defaults
	FUNC_NetClient			: 0x01000000,	// function is executed on clients
	FUNC_DLLImport			: 0x02000000,	// function is imported from a DLL
	FUNC_BlueprintCallable	: 0x04000000,	// function can be called from blueprint code
	FUNC_BlueprintEvent		: 0x08000000,	// function can be overridden/implemented from a blueprint
	FUNC_BlueprintPure		: 0x10000000,	// function can be called from blueprint code, and is also pure (produces no side effects). If you set this, you should set FUNC_BlueprintCallable as well.
	FUNC_EditorOnly			: 0x20000000,	// function can only be called from an editor scrippt.
	FUNC_Const				: 0x40000000,	// function can be called from blueprint code, and only reads state (never writes state)
	FUNC_NetValidate		: 0x80000000,	// function must supply a _Validate implementation

	FUNC_AllFlags		: 0xFFFFFFFF,
};

const PropertyFlags = {
	CPF_None : 0,

	CPF_Edit							: 0x0000000000000001,	///< Property is user-settable in the editor.
	CPF_ConstParm						: 0x0000000000000002,	///< This is a constant function parameter
	CPF_BlueprintVisible				: 0x0000000000000004,	///< This property can be read by blueprint code
	CPF_ExportObject					: 0x0000000000000008,	///< Object can be exported with actor.
	CPF_BlueprintReadOnly				: 0x0000000000000010,	///< This property cannot be modified by blueprint code
	CPF_Net								: 0x0000000000000020,	///< Property is relevant to network replication.
	CPF_EditFixedSize					: 0x0000000000000040,	///< Indicates that elements of an array can be modified, but its size cannot be changed.
	CPF_Parm							: 0x0000000000000080,	///< Function/When call parameter.
	CPF_OutParm							: 0x0000000000000100,	///< Value is copied out after function call.
	CPF_ZeroConstructor					: 0x0000000000000200,	///< memset is fine for construction
	CPF_ReturnParm						: 0x0000000000000400,	///< Return value.
	CPF_DisableEditOnTemplate			: 0x0000000000000800,	///< Disable editing of this property on an archetype/sub-blueprint
	//CPF_      						: 0x0000000000001000,	///< 
	CPF_Transient   					: 0x0000000000002000,	///< Property is transient: shouldn't be saved or loaded, except for Blueprint CDOs.
	CPF_Config      					: 0x0000000000004000,	///< Property should be loaded/saved as permanent profile.
	//CPF_								: 0x0000000000008000,	///< 
	CPF_DisableEditOnInstance			: 0x0000000000010000,	///< Disable editing on an instance of this class
	CPF_EditConst   					: 0x0000000000020000,	///< Property is uneditable in the editor.
	CPF_GlobalConfig					: 0x0000000000040000,	///< Load config from base class, not subclass.
	CPF_InstancedReference				: 0x0000000000080000,	///< Property is a component references.
	//CPF_								: 0x0000000000100000,	///<
	CPF_DuplicateTransient				: 0x0000000000200000,	///< Property should always be reset to the default value during any type of duplication (copy/paste, binary duplication, etc.)
	CPF_SubobjectReference				: 0x0000000000400000,	///< Property contains subobject references (TSubobjectPtr)
	//CPF_    							: 0x0000000000800000,	///< 
	CPF_SaveGame						: 0x0000000001000000,	///< Property should be serialized for save games, this is only checked for game-specific archives with ArIsSaveGame
	CPF_NoClear							: 0x0000000002000000,	///< Hide clear (and browse) button.
	//CPF_  							: 0x0000000004000000,	///<
	CPF_ReferenceParm					: 0x0000000008000000,	///< Value is passed by reference; CPF_OutParam and CPF_Param should also be set.
	CPF_BlueprintAssignable				: 0x0000000010000000,	///< MC Delegates only.  Property should be exposed for assigning in blueprint code
	CPF_Deprecated  					: 0x0000000020000000,	///< Property is deprecated.  Read it from an archive, but don't save it.
	CPF_IsPlainOldData					: 0x0000000040000000,	///< If this is set, then the property can be memcopied instead of CopyCompleteValue / CopySingleValue
	CPF_RepSkip							: 0x0000000080000000,	///< Not replicated. For non replicated properties in replicated structs 
	CPF_RepNotify						: 0x0000000100000000,	///< Notify actors when a property is replicated
	CPF_Interp							: 0x0000000200000000,	///< interpolatable property for use with matinee
	CPF_NonTransactional				: 0x0000000400000000,	///< Property isn't transacted
	CPF_EditorOnly						: 0x0000000800000000,	///< Property should only be loaded in the editor
	CPF_NoDestructor					: 0x0000001000000000,	///< No destructor
	//CPF_								: 0x0000002000000000,	///<
	CPF_AutoWeak						: 0x0000004000000000,	///< Only used for weak pointers, means the export type is autoweak
	CPF_ContainsInstancedReference		: 0x0000008000000000,	///< Property contains component references.
	CPF_AssetRegistrySearchable			: 0x0000010000000000,	///< asset instances will add properties with this flag to the asset registry automatically
	CPF_SimpleDisplay					: 0x0000020000000000,	///< The property is visible by default in the editor details view
	CPF_AdvancedDisplay					: 0x0000040000000000,	///< The property is advanced and not visible by default in the editor details view
	CPF_Protected						: 0x0000080000000000,	///< property is protected from the perspective of script
	CPF_BlueprintCallable				: 0x0000100000000000,	///< MC Delegates only.  Property should be exposed for calling in blueprint code
	CPF_BlueprintAuthorityOnly			: 0x0000200000000000,	///< MC Delegates only.  This delegate accepts (only in blueprint) only events with BlueprintAuthorityOnly.
	CPF_TextExportTransient				: 0x0000400000000000,	///< Property shouldn't be exported to text format (e.g. copy/paste)
	CPF_NonPIEDuplicateTransient		: 0x0000800000000000,	///< Property should only be copied in PIE
	CPF_ExposeOnSpawn					: 0x0001000000000000,	///< Property is exposed on spawn
	CPF_PersistentInstance				: 0x0002000000000000,	///< A object referenced by the property is duplicated like a component. (Each actor should have an own instance.)
	CPF_UObjectWrapper					: 0x0004000000000000,	///< Property was parsed as a wrapper class like TSubclassOf<T>, FScriptInterface etc., rather than a USomething*
	CPF_HasGetValueTypeHash				: 0x0008000000000000,	///< This property can generate a meaningful hash value.
	CPF_NativeAccessSpecifierPublic		: 0x0010000000000000,	///< Public native access specifier
	CPF_NativeAccessSpecifierProtected	: 0x0020000000000000,	///< Protected native access specifier
	CPF_NativeAccessSpecifierPrivate	: 0x0040000000000000,	///< Private native access specifier
	CPF_SkipSerialization				: 0x0080000000000000,	///< Property shouldn't be serialized, can still be exported to text
};

const ELifetimeCondition = {
    "COND_InitialOnly" : 1					    ,   // This property will only attempt to send on the initial bunch
    "COND_OwnerOnly" : 2						,   // This property will only send to the actor's owner
    "COND_SkipOwner" : 3						,   // This property send to every connection EXCEPT the owner
    "COND_SimulatedOnly" : 4					,   // This property will only send to simulated actors
    "COND_AutonomousOnly" : 5					,   // This property will only send to autonomous actors
    "COND_SimulatedOrPhysics" : 6				,   // This property will send to simulated OR bRepPhysics actors
    "COND_InitialOrOwner" : 7					,   // This property will send on the initial packet, or to the actors owner
    "COND_Custom" : 8							,   // This property has no particular condition, but wants the ability to toggle on/off via SetCustomIsActiveOverride
    "COND_ReplayOrOwner" : 9					,   // This property will only send to the replay connection, or to the actors owner
    "COND_ReplayOnly" : 10					    ,   // This property will only send to the replay connection
    "COND_SimulatedOnlyNoReplay" : 11			,   // This property will send to actors only, but not to replay connections
    "COND_SimulatedOrPhysicsNoReplay" : 12	    ,   // This property will send to simulated Or bRepPhysics actors, but not to replay connections
    "COND_SkipReplay" : 13				    	,   // This property will not send to the replay connection
    "COND_Never" : 15							,   // This property will never be replicated						
};

declare var global:any

function readAndParseConfigFile(configFilePath: string) : ts.ParsedCommandLine {
    let readResult = ts.readConfigFile(configFilePath, customSystem.readFile);

    return ts.parseJsonConfigFileContent(readResult.config, {
        useCaseSensitiveFileNames: true,
        readDirectory: customSystem.readDirectory,
        fileExists: customSystem.fileExists,
        readFile: customSystem.readFile,
        trace: s => console.log(s)
    }, customSystem.getCurrentDirectory());
}

function watch(configFilePath:string) {
    let {fileNames, options} = readAndParseConfigFile(configFilePath);

    console.log("start watch..", JSON.stringify({fileNames:fileNames, options: options}))
    const fileVersions: ts.MapLike<{ version: string }> = {};
  
    // initialize the list of files
    fileNames.forEach(fileName => {
      fileVersions[fileName] = { version: "" };
    });

    function getDefaultLibLocation(): string {
        return getDirectoryPath(normalizePath(customSystem.getExecutingFilePath()));
    }
  
    // Create the language service host to allow the LS to communicate with the host
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => fileNames,
      getScriptVersion: fileName => {
          if(fileName in fileVersions) {
              return fileVersions[fileName] && fileVersions[fileName].version.toString();
          } else {
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
        while(true) {
            try {
                return service.getProgram();
            } catch (e) {
                console.error(e);
            }
            //异常了从新创建Language Service，有可能不断失败,UE的文件读取偶尔会失败，失败后ts增量编译会不断的在tryReuseStructureFromOldProgram那断言失败
            service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        }
    }

    let beginTime = new Date().getTime();
    let program = getProgramFromService();
    console.log ("full compile using " + (new Date().getTime() - beginTime) + "ms");
    let diagnostics =  ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) {
        logErrors(diagnostics);
    } else {
        fileNames.forEach(fileName => {
            onSourceFileAddOrChange(fileName, false, program, true, false);
        });
        fileNames.forEach(fileName => {
            onSourceFileAddOrChange(fileName, false, program, false);
        });
    }

    var dirWatcher = new UE.PEDirectoryWatcher();
    global.__dirWatcher = dirWatcher; //防止被释放?

    dirWatcher.OnChanged.Add((added, modified, removed) => {
        setTimeout(() =>{
            if (added.Num() > 0) {
                onFileAdded();
            }
            if (modified.Num() > 0) {
                for(var i = 0; i < modified.Num(); i++) {
                    const fileName =  modified.Get(i);
                    if (fileName in fileVersions) {
                        let md5 = UE.FileSystemOperation.FileMD5Hash(fileName);
                        if (md5 === fileVersions[fileName].version) {
                            console.log(fileName + " md5 not changed, so skiped!");
                        } else {
                            console.log(`${fileName} md5 from ${fileVersions[fileName].version} to ${md5}`);
                            fileVersions[fileName].version = md5;
                            onSourceFileAddOrChange(fileName, true);
                        }
                    }
                }
            }
        }, 100);//延时100毫秒，防止因为读冲突而文件读取失败
    });

    dirWatcher.Watch(customSystem.getCurrentDirectory());

    function onFileAdded(): void {
        let cmdLine = readAndParseConfigFile(configFilePath);
        let newFiles: Array<string> = [];
        cmdLine.fileNames.forEach(fileName => {
            if (!(fileName in fileVersions)) {
                console.log(`new file: ${fileName} ...`)
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

    function onSourceFileAddOrChange(sourceFilePath: string, reload: boolean, program?: ts.Program, doEmitJs: boolean = true, doEmitBP:boolean = true) {
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
            } else {
                if (!sourceFile.isDeclarationFile) {
                    let emitOutput = service.getEmitOutput(sourceFilePath);
                    
                    if (!emitOutput.emitSkipped) {
                        let modulePath:string = undefined;
                        let moduleFileName:string = undefined;
                        let jsSource:string = undefined;
                        emitOutput.outputFiles.forEach(output => {
                            if (doEmitJs) {
                                console.log(`write ${output.name} ...` )
                                UE.FileSystemOperation.WriteFile(output.name, output.text);
                            }
                            
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

                        if (!doEmitBP) return;

                        let foundType: ts.Type = undefined;
                        let foundBaseTypeUClass: UE.Class  = undefined;
                        ts.forEachChild(sourceFile, (node) => {
                            if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
                                const type = checker.getTypeAtLocation(node.expression);
                                if (!type || !type.getSymbol()) return;
                                if (type.getSymbol().getName() != getBaseFileName(moduleFileName)) {
                                    //console.error("type name must the same as file name!");
                                    return;
                                }
                                let baseTypes = type.getBaseTypes();
                                if (!baseTypes || baseTypes.length != 1) return;
                                let baseTypeUClass = getUClassOfType(baseTypes[0]);
                                if (baseTypeUClass) {
                                    foundType = type;
                                    foundBaseTypeUClass = baseTypeUClass;
                                } else {
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

            function typeNameToString(node: ts.EntityName): string {
                if (ts.isIdentifier(node)) {
                    return node.text;
                }
                else {
                    return node.right.text;
                }
            }

            function getUClassOfType(type: ts.Type) : UE.Object {
                if (!type) return undefined;
                if (getModule(type) == 'ue') {
                    try {
                        let jsCls = (UE as any)[type.symbol.getName()]; 
                        if (typeof jsCls.StaticClass == 'function') {
                            return jsCls.StaticClass();
                        } 
                    } catch (e) {
                        console.error(`load ue type [${type.symbol.getName()}], throw: ${e}`);
                    }
                } else if ( type.symbol &&  type.symbol.valueDeclaration) {
                    //eturn undefined;
                    let baseTypes = type.getBaseTypes();
                    if (baseTypes.length != 1) return undefined;
                    let baseTypeUClass = getUClassOfType(baseTypes[0]);
                    if (!baseTypeUClass) return undefined;

                    //console.error("modulePath:", getModulePath(type.symbol.valueDeclaration.getSourceFile().fileName));
                    let sourceFile = type.symbol.valueDeclaration.getSourceFile();
                    let sourceFileName: string
                    program.emit(sourceFile, writeFile, undefined, false, undefined);
                    function writeFile(fileName: string, text: string, writeByteOrderMark: boolean) {
                        if (fileName.endsWith('.js')) {
                            sourceFileName = removeExtension(fileName, '.js');
                        }
                    } 
                    if ( getBaseFileName(sourceFileName) != type.symbol.getName()) {
                        console.error("type name must the same as file name!");
                        return undefined;
                    } 

                    if (options.outDir && sourceFileName.startsWith(options.outDir)) {
                        let moduleFileName = sourceFileName.substr(options.outDir.length + 1);
                        let modulePath = getDirectoryPath(moduleFileName);
                        let bp = new UE.PEBlueprintAsset();
                        bp.LoadOrCreate(type.getSymbol().getName(), modulePath, baseTypeUClass, 0, 0);
                        bp.Save();
                        return bp.GeneratedClass;
                    }
                }
            }

            function getSymbolTypeNode(symbol: ts.Symbol) : ts.Node {
                if (symbol.valueDeclaration) {
                    for(var i = symbol.valueDeclaration.getChildCount() - 1 ; i >= 0; i--) {
                        var child = symbol.valueDeclaration.getChildAt(i);
                        if (child.kind == ts.SyntaxKind.TypeReference) {
                            return child;
                        }
                    }
                }
            }

            function tsTypeToPinType(type: ts.Type, node: ts.Node) : { pinType: UE.PEGraphPinType, pinValueType?: UE.PEGraphTerminalType} | undefined {
                if (!type) return undefined;
                try {
                    let typeNode = checker.typeToTypeNode(type);
                    //console.log(checker.typeToString(type), tds)
                    if (ts.isTypeReferenceNode(typeNode)) {
                        let typeName = type.symbol.getName();
                        if (typeName == 'BigInt') {
                            let category:PinCategory = "int64";
                            let pinType = new UE.PEGraphPinType(category, undefined, UE.EPinContainerType.None, false);
                            return {pinType: pinType};
                        }
                        if (!typeNode.typeArguments || typeNode.typeArguments.length == 0) { 
                            let category:PinCategory = "object";
                            let uclass = getUClassOfType(type);
                            if (!uclass) {
                                let uenum = UE.Enum.Find(type.symbol.getName());
                                if (uenum) {
                                    return {pinType: new UE.PEGraphPinType("byte", uenum, UE.EPinContainerType.None, false)};
                                }
                                console.warn("can not find type of " + typeName);
                                return undefined;
                            }
                            
                            let pinType = new UE.PEGraphPinType(category, uclass, UE.EPinContainerType.None, false);
                            return {pinType: pinType};
                        } else { //TArray, TSet, TMap
                            let typeRef = type as ts.TypeReference;
                            var children: ts.Node[] = [];

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
                                })
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
                            } else if (typeName == 'TSubclassOf') {
                                let category:PinCategory = "class";
                                result.pinType.PinCategory = category;
                                return result;
                            } else if (typeName == 'TSoftObjectPtr') {
                                let category:PinCategory = "softobject";
                                result.pinType.PinCategory = category;
                                return result;
                            } else if (typeName == 'TSoftClassPtr') {
                                let category:PinCategory = "softclass";
                                result.pinType.PinCategory = category;
                                return result;
                            } else if (typeName ==  '$Ref') {
                                result.pinType.bIsReference = true;
                                return result;
                            } else if (typeName == 'TMap') {
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
                            } else {
                                console.warn("not support generic type: " + typeName);
                                return undefined;
                            }
                        }
                    } else {
                        //"bool" | "class" | "int64" | "string" | "object" | "struct" | "float";
                        let category:PinCategory;
                        
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
                        return {pinType: pinType};
                    }
                } catch (e) {
                    console.error(e.stack || e);
                    return undefined;
                }
            }

            function manualSkip(symbol: ts.Symbol): boolean {
                const commentRanges = ts.getLeadingCommentRanges(
                    sourceFile.getFullText(), 
                    symbol.valueDeclaration.getFullStart());
                return !!(commentRanges && commentRanges.find(r => sourceFile.getFullText().slice(r.pos,r.end).indexOf("@no-blueprint" ) > 0)) || hasDecorator(symbol.valueDeclaration, "no_blueprint");
            }

            function tryGetAnnotation(valueDeclaration: ts.Node, key:string, leading: boolean): string {
                const commentRanges = (leading ? ts.getLeadingCommentRanges : ts.getTrailingCommentRanges)(
                    sourceFile.getFullText(), 
                    valueDeclaration.getFullStart() + (leading ? 0 : valueDeclaration.getFullWidth()));
                if (commentRanges) {
                    let ret: string
                    commentRanges.forEach(r => {
                        let m =  sourceFile.getFullText().slice(r.pos, r.end).match(new RegExp(`@${key}:([^*]*)`));
                        if (m) {
                            ret = m[1].trim();
                        }
                    });
                    return ret;
                } 
            }

            function postProcessPinType(valueDeclaration: ts.Node,  pinType: UE.PEGraphPinType, leading: boolean):void {
                if (pinType.PinContainerType == UE.EPinContainerType.None) {
                    let pc = pinType.PinCategory;
                    if (pc === "float") {
                        let cppType = tryGetAnnotation(valueDeclaration, "cpp", leading);
                        if (cppType === "int" || cppType === "byte") {
                            pinType.PinCategory = cppType;
                        }
                    } else if (pc === "string") {
                        let cppType = tryGetAnnotation(valueDeclaration, "cpp", leading);
                        if (cppType === "name" || cppType === "text") {
                            pinType.PinCategory = cppType;
                        }
                    }
                }
            }

            function getFlagsValue(str: string, flagsDef:object):number {
                if (!str) return 0;
                return str.split("|").map(x => x.trim()).map(x => x in flagsDef ? flagsDef[x] as number : 0).reduce((x, y) => x | y);
            }

            function getDecoratorFlagsValue(valueDeclaration:ts.Node, posfix: string, flagsDef:object): bigint {
                if (valueDeclaration && valueDeclaration.decorators) {
                    let decorators = valueDeclaration.decorators;
                    let ret:bigint = 0n;
                    decorators.forEach((decorator, index) => {
                        let expression = decorator.expression;
                        if (ts.isCallExpression(expression)) {
                            if (expression.expression.getFullText() == posfix|| expression.expression.getFullText().endsWith('.' + posfix)) {
                                expression.arguments.forEach((value, index) => {
                                    let e = value.getFullText().split("|").map(x => x.trim().replace(/^.*[\.]/, ''))
                                        .map(x => x in flagsDef ? BigInt(flagsDef[x]) : 0n)
                                        .reduce((x, y) => BigInt(x) | BigInt(y));
                                    ret = ret | e;
                                })
                            }
                        }
                    });
                    return ret;
                } else {
                    return 0n;
                }
            }

            function hasDecorator(valueDeclaration:ts.Node, posfix: string): boolean {
                let ret = false;
                if (valueDeclaration && valueDeclaration.decorators) {
                    let decorators = valueDeclaration.decorators;
                    decorators.forEach((decorator, index) => {
                        let expression = decorator.expression;
                        if (ts.isCallExpression(expression)) {
                            if (expression.expression.getFullText() == posfix|| expression.expression.getFullText().endsWith('.' + posfix)) {
                                ret = true;
                            }
                        }
                    });
                } 
                return ret;
            }

            function onBlueprintTypeAddOrChange(baseTypeUClass: UE.Class, type: ts.Type, modulePath:string) {
                console.log(`gen blueprint for ${type.getSymbol().getName()}, path: ${modulePath}`);
                let bp = new UE.PEBlueprintAsset();
                bp.LoadOrCreate(type.getSymbol().getName(), modulePath, baseTypeUClass, 0, 0);
                let hasConstructor = false;
                checker.getPropertiesOfType(type)
                        .filter(x => ts.isClassDeclaration(x.valueDeclaration.parent) && checker.getSymbolAtLocation(x.valueDeclaration.parent.name) == type.symbol)
                        .filter(x => !manualSkip(x))
                        .forEach((symbol) => {
                            if (ts.isMethodDeclaration(symbol.valueDeclaration!)) {
                                if (symbol.getName() === 'Constructor') {
                                    hasConstructor = true;
                                    return;
                                }

                                let methodType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
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
                                    let paramType:ts.Type = checker.getTypeOfSymbolAtLocation(signature.parameters[i], signature.parameters[i].valueDeclaration!);
                                    let paramPinType = tsTypeToPinType(paramType, getSymbolTypeNode(signature.parameters[i]));
                                    if (!paramPinType)  {
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
                                let clearFlags = 0;

                                if (symbol.valueDeclaration && symbol.valueDeclaration.decorators) {
                                    flags |= Number(getDecoratorFlagsValue(symbol.valueDeclaration, "flags", FunctionFlags));
                                    flags |= Number(getDecoratorFlagsValue(symbol.valueDeclaration, "set_flags", FunctionFlags));
                                    clearFlags = Number(getDecoratorFlagsValue(symbol.valueDeclaration, "clear_flags", FunctionFlags));
                                }
                                
                                if (symbol.valueDeclaration.type && (ts.SyntaxKind.VoidKeyword === symbol.valueDeclaration.type.kind)) {
                                    bp.AddFunction(symbol.getName(), true, undefined, undefined, flags, clearFlags);
                                } else {
                                    let returnType = signature.getReturnType();
                                    let resultPinType = tsTypeToPinType(returnType, getSymbolTypeNode(symbol));
                                    if (!resultPinType) {
                                        console.warn(symbol.getName() + " of " + checker.typeToString(type) + " has not supported return type!");
                                        bp.ClearParameter();
                                        return;
                                    }
                                    postProcessPinType(symbol.valueDeclaration, resultPinType.pinType, true);
                                    
                                    bp.AddFunction(symbol.getName(), false, resultPinType.pinType, resultPinType.pinValueType, flags, clearFlags);
                                }
                                bp.ClearParameter();

                            } else {
                                let propType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
                                let propPinType = tsTypeToPinType(propType, getSymbolTypeNode(symbol));
                                if (!propPinType) {
                                    console.warn(symbol.getName() + " of " + checker.typeToString(type) + " not support!");
                                } else {
                                    postProcessPinType(symbol.valueDeclaration, propPinType.pinType, true);
                                    //console.log("add member variable", symbol.getName());
                                    let sflags = tryGetAnnotation(symbol.valueDeclaration, "flags", true);
                                    let flags:bigint = BigInt(getFlagsValue(sflags, PropertyFlags));
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
                                    
                                    bp.AddMemberVariable(symbol.getName(), propPinType.pinType, propPinType.pinValueType, Number(flags & 0xffffffffn), Number(flags >> 32n), cond);
                                }
                            }
                        });
                bp.RemoveNotExistedMemberVariable();
                bp.RemoveNotExistedFunction();
                bp.HasConstructor = hasConstructor;
                bp.Save();
            }

            function getModule(type: ts.Type) {
                if(type.symbol && type.symbol.valueDeclaration && type.symbol.valueDeclaration.parent && ts.isModuleBlock(type.symbol.valueDeclaration.parent)) {
                    return type.symbol.valueDeclaration.parent.parent.name.text;
                } 
            }
        }
    }

    //function getOwnEmitOutputFilePath(fileName: string) {
    function getModulePath(fileName: string) {
        const compilerOptions = options;
        let emitOutputFilePathWithoutExtension: string;
        if (compilerOptions.outDir) {
            emitOutputFilePathWithoutExtension = removeFileExtension(getSourceFilePathInNewDir(fileName, customSystem.getCurrentDirectory(), (program as any).getCommonSourceDirectory(), options.outDir));
        }
        else {
            emitOutputFilePathWithoutExtension = removeFileExtension(fileName);
        }

        return emitOutputFilePathWithoutExtension;
    }
}

watch(customSystem.getCurrentDirectory() + "tsconfig.json");
