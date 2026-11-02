#!/bin/bash
#
# Make a stand-alone mini UE5 engine for macOS CI that can build PuertsTest and run its tests (RunTests.sh).
# Unlike MakeEnginePack.sh (an overlay on top of Mini427), there is no prepared base for UE5, so the mini engine
# is cut out of a full Launcher install: every file the build and the test run read is kept, nothing else.
# See EnginePack/README_mac_ue5.md.
#
#   collect : clean build + full test run on the full engine, files read (atime) -> EnginePack/manifest_mac_<ver>.txt
#   manifest: only regenerate the manifest from the files read in the last collect (included in collect)
#   pack    : copy the manifest to a staging dir, thin Mach-O files to arm64 + ad-hoc re-sign, tar it
#   verify  : extract into a scratch dir, clean build + run RunTests.sh on it; the full engine must not be read
#
# Usage:
#   Tools/MakeMiniEngine.sh --full-engine "/Users/Shared/Epic Games/UE_5.8"
#   Tools/MakeMiniEngine.sh --full-engine ... --steps pack,verify       # reuse an existing manifest
#
# Tracking by access time: before a run the atime of every engine file is reset to 2000-01-01, afterwards the files
# with a newer atime are the ones that were read (APFS updates atime when it is older than mtime). Files only
# stat'ed are not caught: they are added from UBT's JsonExport of the target and a few rules (see step_manifest),
# verify on the extracted mini engine is what proves the manifest complete.
# The tracking runs on an APFS clone of the engine below the work dir, see SRC_ENGINE.
# Written for the bash 3.2 shipped with macOS.

set -euo pipefail

FULL_ENGINE=""
STEPS="collect,pack,verify"
NAME=""
ARCH="arm64"
TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$TOOLS_DIR/.." && pwd)"
PLUGIN_DIR="$(cd "$PROJECT_DIR/../Puerts" && pwd)"
WORK_DIR="$PROJECT_DIR/../../build/enginepack"
TIMEOUT_SEC=2400
# an empty DDC, as on CI: data derived from engine content then has to be built from what is in the mini engine
EDITOR_ARGS=(--editor-arg -ddc=Cold)

usage() {
    sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --full-engine) FULL_ENGINE="${2:?}"; shift 2 ;;
        --steps)       STEPS="${2:?}"; shift 2 ;;
        --name)        NAME="${2:?}"; shift 2 ;;
        --arch)        ARCH="${2:?}"; shift 2 ;;
        --work-dir)    WORK_DIR="${2:?}"; shift 2 ;;
        --timeout)     TIMEOUT_SEC="${2:?}"; shift 2 ;;
        -h|--help)     usage 0 ;;
        *) echo "unknown argument: $1" >&2; usage 1 ;;
    esac
done
[ -n "$FULL_ENGINE" ] || usage 1

RUN_TESTS="$PROJECT_DIR/RunTests.sh"
FULL_ENGINE="$(cd "$FULL_ENGINE" && pwd)"
VERSION_FILE="$FULL_ENGINE/Engine/Build/Build.version"
VER_MAJOR="$(sed -n 's/.*"MajorVersion"[^0-9]*\([0-9]*\).*/\1/p' "$VERSION_FILE")"
VER_MINOR="$(sed -n 's/.*"MinorVersion"[^0-9]*\([0-9]*\).*/\1/p' "$VERSION_FILE")"
[ "$VER_MAJOR" -ge 5 ] || { echo "UE5 only, use MakeEnginePack.sh for 4.27" >&2; exit 1; }
VER_TAG="${VER_MAJOR}${VER_MINOR}"
[ -n "$NAME" ] || NAME="Mini${VER_TAG}_mac"
MANIFEST="$TOOLS_DIR/EnginePack/manifest_mac_${VER_MAJOR}.${VER_MINOR}.txt"
mkdir -p "$WORK_DIR"
WORK_DIR="$(cd "$WORK_DIR" && pwd)"
MINI_DIR="$WORK_DIR/ue${VER_TAG}"
TGZ="$WORK_DIR/$NAME.tgz"

# Resetting atime changes ctime, which makes Spotlight re-index the engine and read every text file (thousands of
# engine .cpp end up "read"). Spotlight skips directories named *.noindex, so tracking runs on an APFS clone
# (cp -c, no extra disk space) of the engine in such a directory. The clone is kept and reused.
SRC_ENGINE="$WORK_DIR/UE_${VER_MAJOR}.${VER_MINOR}.noindex"
if [ ! -f "$SRC_ENGINE/Engine/Build/Build.version" ] || ! cmp -s "$SRC_ENGINE/Engine/Build/Build.version" "$VERSION_FILE"; then
    echo "cloning $FULL_ENGINE -> $SRC_ENGINE (APFS clone)"
    rm -rf "$SRC_ENGINE"
    mkdir -p "$SRC_ENGINE"
    # the DDC pak is never shipped and is 2.8GB, Intermediate holds the engine's own build products
    (cd "$FULL_ENGINE" && find Engine -mindepth 1 -maxdepth 1 ! -name DerivedDataCache ! -name Saved) | while IFS= read -r d; do
        cp -cR "$FULL_ENGINE/$d" "$SRC_ENGINE/Engine/" 2>/dev/null || cp -c -R "$FULL_ENGINE/$d" "$SRC_ENGINE/Engine/"
    done
fi

# kept whole although only part of them is read: small, and what is read depends on the configuration
WHITELIST_DIRS=(
    "Engine/Config"
    "Engine/Shaders"
    # precompiled rules assemblies + their manifests (UBT maps rules types back to source files through the json)
    "Engine/Intermediate/Build/BuildRules"
)
WHITELIST_FILES=(
    "Engine/Build/Build.version"
    "Engine/Build/InstalledBuild.txt"
)
# rules sources: UBT only checks they exist (no read, so atime misses them), but fails with RulesError without them.
# -iname: some are spelled *.build.cs (CorePreciseFP)
WHITELIST_FIND=(Engine/Source Engine/Plugins -type f "(" -iname "*.Build.cs" -o -iname "*.Target.cs" ")")
# never shipped, even if read: the engine shader DDC pak (2.8GB, CI runs with an empty DDC), debug info, logs
EXCLUDE_RE='(^Engine/DerivedDataCache/|\.dSYM/|^Engine/Saved/|/\.DS_Store$)'

log() { echo "$*"; }
die() { echo "error: $*" >&2; exit 1; }

reset_atime() {
    local engine="$1" marker="$2"
    log "resetting atime of $(find "$engine/Engine" -type f | wc -l | tr -d ' ') files in $engine"
    find "$engine/Engine" -type f -print0 | xargs -0 touch -a -t 200001010000
    # the marker's mtime is the reference: files read later get an atime newer than it
    sleep 1
    touch "$marker"
    sleep 1
}

files_read_since() {
    local engine="$1" marker="$2"
    (cd "$engine" && find Engine -type f -neweram "$marker") | sort
}

# force a full rebuild of the project and plugin for this engine, so every header / library / rules file is read
clean_project() {
    rm -rf "$PROJECT_DIR/Intermediate" "$PROJECT_DIR/Binaries" "$PROJECT_DIR/DerivedDataCache" \
        "$PLUGIN_DIR/Intermediate" "$PLUGIN_DIR/Source/CSharpParamDefaultValueMetas/obj"
    rm -f "$PLUGIN_DIR/Binaries/Mac"/libUnrealEditor-* "$PLUGIN_DIR/Binaries/Mac/UnrealEditor.modules"
}

is_macho() { file -b "$1" | grep -q 'Mach-O'; }

# manifest entries ending in '/' are directories (created empty), the others files
manifest_files() { grep -v '/$' "$MANIFEST" || true; }

# RunTests with an empty dotnet user dir, like a fresh CI runner: with the ~/.dotnet first-use sentinels of a dev
# machine, dotnet's first-run code (and the files it loads) would never be exercised by collect / verify
RUN_TESTS_FRESH=run_tests_fresh
run_tests_fresh() {
    local home code=0
    home="$(mktemp -d "${TMPDIR:-/tmp}/dotnet_home.XXXXXX")"
    DOTNET_CLI_HOME="$home" "$RUN_TESTS" "$@" || code=$?
    rm -rf "$home"
    return "$code"
}

step_collect() {
    local tmp="$WORK_DIR/collect_ue${VER_TAG}"
    rm -rf "$tmp"
    mkdir -p "$tmp"
    local marker="$tmp/marker"

    reset_atime "$SRC_ENGINE" "$marker"
    clean_project
    local code=0
    "$RUN_TESTS_FRESH" --engine "$SRC_ENGINE" --timeout "$TIMEOUT_SEC" "${EDITOR_ARGS[@]}" > "$tmp/runtests.log" 2>&1 || code=$?
    grep 'succeeded=' "$tmp/runtests.log" | sed 's/^/full engine: /' || true
    [ "$code" -eq 0 ] || die "RunTests on the full engine failed ($code), see $tmp/runtests.log"

    files_read_since "$SRC_ENGINE" "$marker" > "$tmp/read.txt"
    log "files read: $(wc -l < "$tmp/read.txt" | tr -d ' ')"
    step_manifest
}

# Paths UBT only checks for existence while setting up the build, so atime does not catch them: module directories
# and include paths (directories, shipped empty when nothing in them is read), rules files, static libraries,
# runtime dependencies. Taken from UBT's own view of the target (-Mode=JsonExport on the full engine).
# Prints engine-relative paths, directories with a trailing '/'.
ubt_paths() {
    local json="$WORK_DIR/collect_ue${VER_TAG}/target.json"
    rm -f "$json"
    (
        set +eu
        source "$SRC_ENGINE/Engine/Build/BatchFiles/Mac/SetupEnvironment.sh" -dotnet "$SRC_ENGINE/Engine/Build/BatchFiles/Mac" > /dev/null
        set -e
        cd "$PROJECT_DIR"
        dotnet "$SRC_ENGINE/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.dll" PuertsTestEditor Mac Development \
            -Project="$PROJECT_DIR/PuertsTest.uproject" -Mode=JsonExport -OutputFile="$json" -NoUBA > "$json.log" 2>&1
    ) || die "UBT JsonExport failed, see $json.log"
    python3 - "$json" "$SRC_ENGINE/" <<'EOF'
import json, os, sys
modules = json.load(open(sys.argv[1]))["Modules"]
root = sys.argv[2]
out = set()
def walk(v):
    if isinstance(v, dict):
        for x in v.values(): walk(x)
    elif isinstance(v, list):
        for x in v: walk(x)
    elif isinstance(v, str) and v.startswith(root) and "..." not in v and "*" not in v:
        if os.path.isdir(v): out.add(v[len(root):].rstrip("/") + "/")
        elif os.path.isfile(v): out.add(v[len(root):])
walk(modules)
print("\n".join(sorted(out)))
EOF
}

# read.txt of collect + whitelist -> manifest (separate step, so the filters can be tuned without a new run)
step_manifest() {
    local tmp="$WORK_DIR/collect_ue${VER_TAG}"
    [ -f "$tmp/read.txt" ] || die "no $tmp/read.txt, run collect first"
    ubt_paths > "$tmp/ubt_paths.txt"
    log "paths from UBT: $(grep -vc '/$' "$tmp/ubt_paths.txt") files, $(grep -c '/$' "$tmp/ubt_paths.txt") directories"
    {
        cat "$tmp/read.txt" "$tmp/ubt_paths.txt"
        local w
        for w in "${WHITELIST_DIRS[@]}"; do (cd "$SRC_ENGINE" && find "$w" -type f); done
        for w in "${WHITELIST_FILES[@]}"; do echo "$w"; done
        (cd "$SRC_ENGINE" && find "${WHITELIST_FIND[@]}")
        # Python only uses __pycache__/<mod>.cpython-XY.pyc when <mod>.py exists (stat'ed for its mtime, not read),
        # and os.py is the landmark getpath uses to find the stdlib
        { grep '/__pycache__/[^/]*\.pyc$' "$tmp/read.txt" || true; } | sed -E 's|/__pycache__/([^/.]*)\.[^/]*\.pyc$|/\1.py|'
        # an app bundle is kept whole once anything in it was read (Info.plist, resources, code signature)
        { grep -o '^.*\.app/' "$tmp/read.txt" || true; } | sort -u | while IFS= read -r app; do
            (cd "$SRC_ENGINE" && find "${app%/}" -type f)
        done
    } | grep -vE "$EXCLUDE_RE" | sort -u | while IFS= read -r rel; do
        case "$rel" in
            */) if [ -d "$SRC_ENGINE/$rel" ]; then echo "$rel"; fi ;;
            *)  if [ -f "$SRC_ENGINE/$rel" ]; then echo "$rel"; fi ;;
        esac
    done > "$MANIFEST"

    local bytes
    bytes="$(manifest_files | tr '\n' '\0' | (cd "$SRC_ENGINE" && xargs -0 stat -f %z) | awk '{s += $1} END {print s}')"
    log "manifest: $(manifest_files | wc -l | tr -d ' ') files + $(grep -c '/$' "$MANIFEST") directories, $((bytes / 1048576)) MB (universal) -> $MANIFEST"
    log "by top directory (MB):"
    manifest_files | tr '\n' '\0' | (cd "$SRC_ENGINE" && xargs -0 stat -f '%z %N') |
        awk '{ split($2, p, "/"); k = p[1] "/" p[2] "/" p[3]; s[k] += $1 } END { for (k in s) printf "  %8.1f %s\n", s[k] / 1048576, k }' |
        sort -rn | head -n 15
}

# thin a Mach-O file to $ARCH; executables and dylibs are re-signed ad-hoc (the Epic signature is broken by lipo,
# and arm64 code must be signed to run)
thin_file() {
    local f="$1" archs
    archs="$(lipo -archs "$f" 2>/dev/null || true)"
    case " $archs " in
        *" $ARCH "*) ;;
        *) return 0 ;;
    esac
    if [ "$archs" != "$ARCH" ]; then
        lipo "$f" -thin "$ARCH" -output "$f.thin" && mv "$f.thin" "$f"
    fi
    case "$(file -b "$f")" in
        *executable*|*"dynamically linked shared library"*|*bundle*)
            codesign -f -s - "$f" 2>/dev/null || die "codesign failed: $f" ;;
    esac
}

step_pack() {
    [ -f "$MANIFEST" ] || die "no manifest, run collect first: $MANIFEST"
    local stage="$WORK_DIR/stage_ue${VER_TAG}"
    rm -rf "$stage"
    mkdir -p "$stage"
    log "copying $(manifest_files | wc -l | tr -d ' ') files"
    manifest_files > "$stage.files"
    (cd "$SRC_ENGINE" && tar -cf - -T "$stage.files") | (cd "$stage" && tar -xf -)
    [ "$(find "$stage/Engine" -type f | wc -l | tr -d ' ')" -eq "$(wc -l < "$stage.files" | tr -d ' ')" ] ||
        die "staging dir does not hold every manifest file"
    rm -f "$stage.files"
    { grep '/$' "$MANIFEST" || true; } | while IFS= read -r d; do mkdir -p "$stage/$d"; done

    log "thinning Mach-O files to $ARCH"
    local f thinned=0
    while IFS= read -r f; do
        is_macho "$f" || continue
        thin_file "$f"
        thinned=$((thinned + 1))
    done < <(find "$stage/Engine" -type f \( -name '*.dylib' -o -name '*.a' -o -name '*.so' -o -perm -u+x \) ! -name '*.sh')
    # the bundles' own signatures cover the (now re-signed) executables inside them
    find "$stage/Engine" -type d -name '*.app' -prune | while IFS= read -r app; do
        codesign -f -s - "$app" 2>/dev/null || die "codesign failed: $app"
    done
    log "Mach-O files processed: $thinned"

    rm -f "$TGZ"
    # bsdtar keeps permissions; COPYFILE_DISABLE avoids ._ AppleDouble entries
    COPYFILE_DISABLE=1 tar -czf "$TGZ" -C "$stage" Engine
    log "$(du -sm "$stage" | cut -f1) MB raw, $(( $(stat -f %z "$TGZ") / 1048576 )) MB tgz -> $TGZ"
}

# Every dependency of a shipped binary must resolve on a clean runner (system + Xcode): system libraries are fine,
# @rpath / @loader_path / @executable_path ones must be found in the mini engine, anything else is an error.
check_deps() {
    local engine="$1" bad="$WORK_DIR/verify_deps_ue${VER_TAG}.txt" names="$WORK_DIR/verify_names_ue${VER_TAG}.txt"
    : > "$bad"
    (cd "$engine" && find Engine \( -name '*.dylib' -o -name '*.so' \) | sed 's|.*/||') | sort -u > "$names"
    local bin dep base self_id
    while IFS= read -r bin; do
        is_macho "$bin" || continue
        # otool -L also prints the dylib's own install name (LC_ID_DYLIB), which is not a dependency
        self_id="$(otool -D "$bin" 2>/dev/null | sed -n '2p')"
        otool -L "$bin" 2>/dev/null | { grep -v ':$' || true; } | sed 's/^[[:space:]]*//; s/ (compatibility.*$//' | while IFS= read -r dep; do
            [ "$dep" != "$self_id" ] || continue
            case "$dep" in
                /usr/lib/*|/System/Library/*) ;;
                @rpath/*|@loader_path/*|@executable_path/*)
                    base="${dep##*/}"
                    if ! grep -qxF "$base" "$names"; then
                        case "$dep" in */*.framework/*) (cd "$engine" && find Engine -path "*${dep#*/}" | grep -q .) && continue ;; esac
                        echo "${bin#$engine/} -> $dep" >> "$bad"
                    fi ;;
                *) echo "${bin#$engine/} -> $dep" >> "$bad" ;;
            esac
        done
    done < <(find "$engine/Engine" -type f \( -name '*.dylib' -o -name '*.so' -o -perm -u+x \) ! -name '*.sh' ! -path '*/DotNet/*')
    if [ -s "$bad" ]; then
        log "dependencies that will not resolve on a clean machine:"
        sed 's/^/  /' "$bad"
        die "unresolved binary dependencies, see $bad"
    fi
    log "binary dependencies: ok"
}

step_verify() {
    [ -f "$TGZ" ] || die "no package, run pack first: $TGZ"
    rm -rf "$MINI_DIR"
    mkdir -p "$MINI_DIR"
    log "extracting into $MINI_DIR"
    tar -xzf "$TGZ" -C "$MINI_DIR"
    check_deps "$MINI_DIR"

    # the full engine must stay untouched: a read there means the mini engine is not self-contained
    local marker="$WORK_DIR/verify_marker_ue${VER_TAG}"
    reset_atime "$SRC_ENGINE" "$marker"
    clean_project
    local code=0
    "$RUN_TESTS_FRESH" --engine "$MINI_DIR" --timeout "$TIMEOUT_SEC" "${EDITOR_ARGS[@]}" || code=$?

    local leaked="$WORK_DIR/verify_leaked_ue${VER_TAG}.txt"
    files_read_since "$SRC_ENGINE" "$marker" > "$leaked"
    if [ -s "$leaked" ]; then
        log "files of the full engine read while running on the mini engine:"
        head -n 30 "$leaked" | sed 's/^/  /'
    fi
    local log_file="$PROJECT_DIR/Saved/Logs/RunTests.log" suspect
    suspect="$(grep -E "Failed to load|Can't find file|could not be found|Unable to load|Missing|LogShaderCompilers: Error" "$log_file" 2>/dev/null |
        grep -v locres | head -n 30 || true)"
    if [ -n "$suspect" ]; then log "suspicious log lines:"; echo "$suspect" | sed 's/^/  /'; fi
    [ "$code" -eq 0 ] || die "RunTests on the mini engine failed ($code)"
    [ ! -s "$leaked" ] || die "the mini engine is not self-contained, see $leaked"
    log "mini engine ok: $MINI_DIR"
}

IFS=',' read -r -a STEP_LIST <<< "$STEPS"
for s in "${STEP_LIST[@]}"; do
    log "== $s"
    case "$s" in
        collect) step_collect ;;
        manifest) step_manifest ;;
        pack)    step_pack ;;
        verify)  step_verify ;;
        *) die "unknown step $s" ;;
    esac
done
