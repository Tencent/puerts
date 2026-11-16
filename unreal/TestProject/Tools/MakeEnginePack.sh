#!/bin/bash
#
# Make the "editor runtime" overlay of Mini427 for macOS, so that RunTests.sh can run on a GitHub hosted runner.
# The mac counterpart of MakeEnginePack.ps1, see EnginePack/README_mac.md.
#
#   collect : run the tests on the full engine, record loaded dylibs and packages -> EnginePack/manifest_mac.txt
#   pack    : copy manifest files missing in (or different from) Mini427 to a staging dir, tar it -> build/enginepack/<Name>.tgz
#   verify  : Mini427 + overlay into a scratch engine dir, build and run RunTests.sh on it
#
# Usage:
#   Tools/MakeEnginePack.sh --full-engine "/Users/Shared/Epic Games/UE_4.27" --mini-engine <dir containing Engine/>
#   Tools/MakeEnginePack.sh --steps pack,verify ...      # reuse an existing manifest
#
# The project is built with Mini427 in collect too (RunTests.sh --build-only), then run on the full engine: the
# editor binaries of the two are identical, but only the engine headers of Mini427 are patched for a newer Xcode.
# Written for the bash 3.2 shipped with macOS (no associative arrays).

set -euo pipefail

FULL_ENGINE=""
MINI_ENGINE=""
STEPS="collect,pack,verify"
NAME="Mini427_mac_editor_runtime"
TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$TOOLS_DIR/.." && pwd)"
WORK_DIR="$PROJECT_DIR/../../build/enginepack"
TIMEOUT_SEC=2400

usage() {
    sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --full-engine) FULL_ENGINE="${2:?}"; shift 2 ;;
        --mini-engine) MINI_ENGINE="${2:?}"; shift 2 ;;
        --steps)       STEPS="${2:?}"; shift 2 ;;
        --name)        NAME="${2:?}"; shift 2 ;;
        --work-dir)    WORK_DIR="${2:?}"; shift 2 ;;
        --timeout)     TIMEOUT_SEC="${2:?}"; shift 2 ;;
        -h|--help)     usage 0 ;;
        *) echo "unknown argument: $1" >&2; usage 1 ;;
    esac
done
[ -n "$FULL_ENGINE" ] && [ -n "$MINI_ENGINE" ] || usage 1

RUN_TESTS="$PROJECT_DIR/RunTests.sh"
MANIFEST="$TOOLS_DIR/EnginePack/manifest_mac.txt"
FULL_ENGINE="$(cd "$FULL_ENGINE" && pwd)"
MINI_ENGINE="$(cd "$MINI_ENGINE" && pwd)"
mkdir -p "$WORK_DIR"
WORK_DIR="$(cd "$WORK_DIR" && pwd)"

# small, platform independent data the editor reads at startup (relative to the engine root), same as the ps1
WHITELIST_DIRS=(
    "Engine/Config"
    "Engine/Shaders"
    "Engine/Content/Slate"
    "Engine/Content/Editor/Slate/Fonts"
    "Engine/Content/Internationalization/icudt64l"
    # the whole bundle: Info.plist, Resources etc., not only the executable
    "Engine/Binaries/Mac/UE4Editor.app"
)
WHITELIST_FILES=(
    "Engine/Binaries/Mac/UE4Editor.modules"
    "Engine/Build/Build.version"
)
PACKAGE_EXT_RE='\.(uasset|umap|uexp|ubulk|uptnl)$'
EDITOR_REL="Engine/Binaries/Mac/UE4Editor.app/Contents/MacOS/UE4Editor"

log() { echo "$*"; }
die() { echo "error: $*" >&2; exit 1; }

# every file (and symlink) below a dir, relative to the engine root
list_tree() {
    local root="$1" rel="$2"
    [ -e "$root/$rel" ] || { log "whitelist entry missing in full engine: $rel"; return 0; }
    (cd "$root" && find "$rel" \( -type f -o -type l \) | grep -v '\.dSYM/' || true)
}

# run the editor with ExecCmds; 4.27 sometimes hangs on exit after the log is complete, so kill it 30s after Quit
invoke_editor() {
    local engine="$1" log_file="$2" exec_cmds="$3"
    rm -f "$log_file"
    # same dyld fallback as RunTests.sh (libpython for PapiPython, /usr/lib for the libc++ of v8)
    DYLD_FALLBACK_LIBRARY_PATH="$engine/Engine/Binaries/ThirdParty/Python3/Mac/lib:$HOME/lib:/usr/local/lib:/usr/lib" \
    "$engine/$EDITOR_REL" "$PROJECT_DIR/PuertsTest.uproject" "-ExecCmds=$exec_cmds" \
        -unattended -nullrhi -nosplash -nosound -NoP4 "-abslog=$log_file" >/dev/null 2>&1 &
    local pid=$! waited=0 quit_at=-1
    while kill -0 "$pid" 2>/dev/null; do
        if [ "$waited" -ge "$TIMEOUT_SEC" ]; then kill -9 "$pid"; die "editor timeout: $exec_cmds"; fi
        if [ "$quit_at" -lt 0 ] && [ -f "$log_file" ] && grep -q '\]Cmd: Quit' "$log_file"; then quit_at=$waited; fi
        if [ "$quit_at" -ge 0 ] && [ $((waited - quit_at)) -ge 30 ]; then kill -9 "$pid" 2>/dev/null || true; break; fi
        sleep 1
        waited=$((waited + 1))
    done
    wait "$pid" 2>/dev/null || true
}

step_collect() {
    local tmp="$WORK_DIR/collect"
    rm -rf "$tmp"
    mkdir -p "$tmp"
    local opened="$tmp/opened.txt" files="$tmp/files.txt"
    : > "$opened"

    # 0. build with Mini427 (the full Launcher engine may not compile with the local Xcode, see RunTests.sh)
    "$RUN_TESTS" --build-only --engine "$MINI_ENGINE" > "$WORK_DIR/collect_build.log" 2>&1 ||
        die "build with Mini427 failed, see $WORK_DIR/collect_build.log"

    # 1. dylibs: poll the files opened / mapped by the editor process while the whole test suite runs
    local pid_file="$PROJECT_DIR/Saved/Logs/RunTests.pid"
    rm -f "$pid_file"
    "$RUN_TESTS" --skip-build --engine "$FULL_ENGINE" --timeout "$TIMEOUT_SEC" > "$WORK_DIR/collect_runtests.log" 2>&1 &
    local rt=$!
    while kill -0 "$rt" 2>/dev/null; do
        if [ -f "$pid_file" ]; then
            local epid
            epid="$(cat "$pid_file" 2>/dev/null || true)"
            if [ -n "$epid" ]; then
                lsof -p "$epid" -Fn 2>/dev/null | sed -n 's/^n//p' | grep -F "$FULL_ENGINE/" >> "$opened" || true
            fi
        fi
        sleep 0.4
    done
    local rt_code=0
    wait "$rt" || rt_code=$?
    grep 'succeeded=' "$WORK_DIR/collect_runtests.log" | sed 's/^/full engine: /' || true
    [ "$rt_code" -eq 0 ] || die "RunTests on full engine failed ($rt_code), see $WORK_DIR/collect_runtests.log"

    sort -u "$opened" | sed "s|^$FULL_ENGINE/||" > "$tmp/opened_rel.txt"
    # binaries (dylibs, executables, bundle content) and the content packages that happened to be open
    grep '^Engine/\(Plugins/.*/\)\{0,1\}Binaries/' "$tmp/opened_rel.txt" | grep -v '\.dSYM/' > "$tmp/bins.txt" || true
    grep -E "/Content/.*$PACKAGE_EXT_RE" "$tmp/opened_rel.txt" > "$tmp/pkgfiles.txt" || true
    log "loaded engine dylibs: $(grep -c '\.dylib$' "$tmp/bins.txt" || true), open binaries total: $(wc -l < "$tmp/bins.txt" | tr -d ' ')"
    cat "$tmp/bins.txt" "$tmp/pkgfiles.txt" > "$files"

    # 2. packages: list the packages in memory after editor startup
    local pkg_log="$WORK_DIR/collect_packages.log"
    invoke_editor "$FULL_ENGINE" "$pkg_log" "obj list class=Package, Quit"
    grep -oE '[[:space:]]Package /[^[:space:]]+' "$pkg_log" | sed 's/.*Package //' | sort -u > "$tmp/packages.txt" || true
    log "loaded packages: $(wc -l < "$tmp/packages.txt" | tr -d ' ')"

    # 3. plugins owning a loaded dylib: .uplugin, .modules, Config; the content root is the mount point /<PluginName>/
    local mounts="$tmp/mounts.txt"
    printf 'Engine\tEngine/Content\n' > "$mounts"
    { grep '^Engine/Plugins/.*\.dylib$' "$tmp/bins.txt" || true; } | sed 's|/Binaries/.*$||' | sort -u | while IFS= read -r root; do
        local up
        up="$(ls "$FULL_ENGINE/$root"/*.uplugin 2>/dev/null | head -n 1 || true)"
        [ -n "$up" ] || continue
        echo "${up#$FULL_ENGINE/}" >> "$files"
        printf '%s\t%s\n' "$(basename "$up" .uplugin)" "$root/Content" >> "$mounts"
        if [ -f "$FULL_ENGINE/$root/Binaries/Mac/UE4Editor.modules" ]; then echo "$root/Binaries/Mac/UE4Editor.modules" >> "$files"; fi
        if [ -d "$FULL_ENGINE/$root/Config" ]; then list_tree "$FULL_ENGINE" "$root/Config" >> "$files"; fi
    done

    local unresolved="$tmp/unresolved.txt"
    : > "$unresolved"
    while IFS= read -r pk; do
        local mount rest content hit=0 ext
        mount="$(echo "$pk" | cut -d/ -f2)"
        rest="$(echo "$pk" | cut -d/ -f3-)"
        case "$mount" in Script|Temp|Game|Memory) continue ;; esac
        [ "$pk" = "/Engine/Transient" ] && continue
        content="$(awk -F'\t' -v m="$mount" '$1 == m { print $2; exit }' "$mounts")"
        if [ -n "$content" ] && [ -n "$rest" ]; then
            for ext in uasset umap uexp ubulk uptnl; do
                if [ -f "$FULL_ENGINE/$content/$rest.$ext" ]; then echo "$content/$rest.$ext" >> "$files"; hit=1; fi
            done
        fi
        [ "$hit" -eq 1 ] || echo "$pk" >> "$unresolved"
    done < "$tmp/packages.txt"
    if [ -s "$unresolved" ]; then log "packages not found on disk (ignored): $(tr '\n' ' ' < "$unresolved")"; fi

    local w
    for w in "${WHITELIST_DIRS[@]}"; do list_tree "$FULL_ENGINE" "$w" >> "$files"; done
    for w in "${WHITELIST_FILES[@]}"; do echo "$w" >> "$files"; done

    mkdir -p "$(dirname "$MANIFEST")"
    # lsof also reports directories (cwd etc.), keep files and symlinks only
    grep -v '\.dSYM/' "$files" | grep -v '\.dSYM$' | sort -u | while IFS= read -r rel; do
        if [ -L "$FULL_ENGINE/$rel" ] || [ -f "$FULL_ENGINE/$rel" ]; then echo "$rel"; fi
    done > "$MANIFEST"
    log "manifest: $(wc -l < "$MANIFEST" | tr -d ' ') files -> $MANIFEST"
}

step_pack() {
    local stage="$WORK_DIR/stage"
    rm -rf "$stage"
    mkdir -p "$stage"
    local added=0 bytes=0 rel src mini
    while IFS= read -r rel; do
        [ -n "$rel" ] || continue
        src="$FULL_ENGINE/$rel"
        if [ ! -e "$src" ] && [ ! -L "$src" ]; then log "missing in full engine: $rel"; continue; fi
        mini="$MINI_ENGINE/$rel"
        # compare content, not size: Mini427 is a different distribution of the engine
        if [ -L "$src" ]; then
            if [ -L "$mini" ] && [ "$(readlink "$src")" = "$(readlink "$mini")" ]; then continue; fi
        elif [ -f "$mini" ] && cmp -s "$src" "$mini"; then
            continue
        fi
        mkdir -p "$stage/$(dirname "$rel")"
        cp -pP "$src" "$stage/$rel"
        added=$((added + 1))
        if [ ! -L "$src" ]; then bytes=$((bytes + $(stat -f %z "$src"))); fi
    done < "$MANIFEST"
    local tgz="$WORK_DIR/$NAME.tgz"
    rm -f "$tgz"
    # bsdtar keeps symlinks and permissions; COPYFILE_DISABLE avoids ._ AppleDouble entries
    COPYFILE_DISABLE=1 tar -czf "$tgz" -C "$stage" Engine
    log "$added files, $((bytes / 1048576)) MB raw, $(( $(stat -f %z "$tgz") / 1048576 )) MB tgz -> $tgz"
}

# Every dependency of a shipped binary must resolve on a clean runner (system + Xcode): system libraries are fine,
# @rpath / @loader_path / @executable_path ones must be found in the assembled engine, anything else (Homebrew,
# /usr/local, Xcode toolchain, an absolute path into the full engine) is an error.
check_deps() {
    local engine="$1" bad="$WORK_DIR/verify_deps.txt" names="$WORK_DIR/verify_names.txt"
    : > "$bad"
    (cd "$engine" && find Engine -name '*.dylib' -o -name '*.so' | sed 's|.*/||') | sort -u > "$names"
    local rel bin dep base
    while IFS= read -r rel; do
        bin="$engine/$rel"
        [ -f "$bin" ] && [ ! -L "$bin" ] || continue
        case "$rel" in
            *.dylib|*/Contents/MacOS/*) ;;
            *) file -b "$bin" | grep -q 'Mach-O' || continue ;;
        esac
        # the 4.27 editor is x86_64 (Rosetta on Apple silicon), only that slice of universal binaries is loaded;
        # lines ending with ':' are the per file / per arch headers of otool
        otool -arch x86_64 -L "$bin" 2>/dev/null | { grep -v ':$' || true; } | sed 's/^[[:space:]]*//; s/ (compatibility.*$//' | while IFS= read -r dep; do
            case "$dep" in
                /usr/lib/*|/System/Library/*) ;;
                @rpath/*|@loader_path/*|@executable_path/*)
                    base="${dep##*/}"
                    # frameworks inside the bundle are referenced as X.framework/Versions/A/X
                    if ! grep -qxF "$base" "$names" && [ ! -e "$engine/Engine/Binaries/Mac/UE4Editor.app/Contents/Frameworks/$base" ]; then
                        case "$dep" in */*.framework/*) (cd "$engine" && find Engine -path "*${dep#*/}" | grep -q .) && continue ;; esac
                        echo "$rel -> $dep" >> "$bad"
                    fi ;;
                *) echo "$rel -> $dep" >> "$bad" ;;
            esac
        done
    done < "$MANIFEST"
    # dylibs referencing themselves by install name are listed by otool too, drop those
    if [ -s "$bad" ]; then
        log "dependencies that will not resolve on a clean machine:"
        sed 's/^/  /' "$bad"
        die "unresolved binary dependencies, see $bad"
    fi
    log "binary dependencies: ok"
}

step_verify() {
    local engine="$WORK_DIR/engine"
    rm -rf "$engine"
    mkdir -p "$engine"
    log "assembling $engine (Mini427 + overlay)"
    ditto "$MINI_ENGINE/Engine" "$engine/Engine"
    tar -xzf "$WORK_DIR/$NAME.tgz" -C "$engine"

    # CI builds with the Mini427 toolchain, so the overlay must not replace any of it
    if tar -tzf "$WORK_DIR/$NAME.tgz" | grep -E '^Engine/(Source|Build/BatchFiles|Binaries/DotNET)/|UnrealHeaderTool' | head -n 5 | grep .; then
        die "the overlay replaces build tools / engine sources of Mini427"
    fi
    check_deps "$engine"

    local code=0
    "$RUN_TESTS" --engine "$engine" --timeout "$TIMEOUT_SEC" || code=$?
    local log_file="$PROJECT_DIR/Saved/Logs/RunTests.log"
    local suspect
    suspect="$(grep -E "Failed to load|Can't find file|could not be found|Unable to load|Missing" "$log_file" 2>/dev/null |
        grep -v locres | head -n 30 || true)"
    if [ -n "$suspect" ]; then log "suspicious log lines:"; echo "$suspect" | sed 's/^/  /'; fi
    [ "$code" -eq 0 ] || die "RunTests on assembled engine failed ($code)"
}

IFS=',' read -r -a STEP_LIST <<< "$STEPS"
for s in "${STEP_LIST[@]}"; do
    log "== $s"
    case "$s" in
        collect) step_collect ;;
        pack)    step_pack ;;
        verify)  step_verify ;;
        *) die "unknown step $s" ;;
    esac
done
