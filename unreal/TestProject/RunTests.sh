#!/bin/bash
#
# Build the PuertsTest host project and run PuerTS automation tests headless (macOS).
#
# Usage:
#   ./RunTests.sh                                  # build + run Puerts.Functional
#   ./RunTests.sh --skip-build --filter Puerts.Functional.Lifecycle
#   ./RunTests.sh --update-baseline                # rewrite Baseline/*.txt from the current implementation
#   ./RunTests.sh --bench --bench-label before_m1  # run Puerts.Bench, result in Saved/PuertsBench/before_m1.json
#   ./RunTests.sh --engine "/Users/Shared/Epic Games/UE_4.27"   # UE5 and UE4.27 are both supported
#   ./RunTests.sh --build-only --engine <Mini427>   # build with one engine, then run with another via --skip-build
#
# Env: UE_ROOT overrides the engine root (defaults to the newest UE_5.x, then UE_4.x, under
# /Users/Shared/Epic Games, the standard install location of the Epic Games Launcher).

set -euo pipefail

find_engine() {
    local candidate
    # read line by line: the install path contains a space ("Epic Games"), so an unquoted
    # $(ls ...) in a for list would be word split into non-existent paths
    while IFS= read -r candidate; do
        if [ -n "$candidate" ] && [ -f "$candidate/Engine/Build/Build.version" ]; then
            echo "$candidate"
            return 0
        fi
    done < <({ ls -d "/Users/Shared/Epic Games"/UE_5.* 2>/dev/null | sort -V -r;
               ls -d "/Users/Shared/Epic Games"/UE_4.* 2>/dev/null | sort -V -r; })
    return 1
}

ENGINE="${UE_ROOT:-$(find_engine || true)}"
FILTER="Puerts.Functional"
SKIP_BUILD=0
BUILD_ONLY=0
UPDATE_BASELINE=0
BENCH=0
BENCH_LABEL="latest"
CONFIGURATION="Development"
TIMEOUT_SEC=600

usage() {
    sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --engine)          ENGINE="${2:?--engine needs a value}"; shift 2 ;;
        --engine=*)        ENGINE="${1#*=}"; shift ;;
        --filter)          FILTER="${2:?--filter needs a value}"; shift 2 ;;
        --filter=*)        FILTER="${1#*=}"; shift ;;
        --skip-build)      SKIP_BUILD=1; shift ;;
        --build-only)      BUILD_ONLY=1; shift ;;
        --update-baseline) UPDATE_BASELINE=1; shift ;;
        --bench)           BENCH=1; shift ;;
        --bench-label)     BENCH_LABEL="${2:?--bench-label needs a value}"; shift 2 ;;
        --bench-label=*)   BENCH_LABEL="${1#*=}"; shift ;;
        --configuration)   CONFIGURATION="${2:?--configuration needs a value}"; shift 2 ;;
        --configuration=*) CONFIGURATION="${1#*=}"; shift ;;
        --timeout)         TIMEOUT_SEC="${2:?--timeout needs a value}"; shift 2 ;;
        --timeout=*)       TIMEOUT_SEC="${1#*=}"; shift ;;
        -h|--help)         usage 0 ;;
        *) echo "unknown argument: $1" >&2; usage 1 ;;
    esac
done

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="$PROJECT_DIR/PuertsTest.uproject"
PLUGIN_SRC="$(cd "$PROJECT_DIR/../Puerts" && pwd)"

if [ -z "$ENGINE" ] || [ ! -f "$ENGINE/Engine/Build/Build.version" ]; then
    echo "engine not found: ${ENGINE:-<none under /Users/Shared/Epic Games>} (set UE_ROOT or pass --engine)" >&2
    exit 3
fi
ENGINE="$(cd "$ENGINE" && pwd)"

# engine version from Build.version, e.g. "4.27" / "5.8"
ENGINE_MAJOR="$(sed -n 's/.*"MajorVersion"[^0-9]*\([0-9]*\).*/\1/p' "$ENGINE/Engine/Build/Build.version")"
ENGINE_MINOR="$(sed -n 's/.*"MinorVersion"[^0-9]*\([0-9]*\).*/\1/p' "$ENGINE/Engine/Build/Build.version")"
ENGINE_TAG="$ENGINE_MAJOR.$ENGINE_MINOR"
echo "engine: $ENGINE ($ENGINE_TAG)"

# 0. the rules assembly (Intermediate/Build/BuildRules) is shared by all engine versions, and the one built by
#    another engine can not be reused, so drop it on engine switch (same as RunTests.ps1)
RULES_DIR="$PROJECT_DIR/Intermediate/Build/BuildRules"
RULES_STAMP="$PROJECT_DIR/Intermediate/Build/BuildRules.engine"
LAST_ENGINE=""
if [ -f "$RULES_STAMP" ]; then LAST_ENGINE="$(tr -d '[:space:]' < "$RULES_STAMP")"; fi
if [ "$LAST_ENGINE" != "$ENGINE_TAG" ] && [ -d "$RULES_DIR" ]; then
    rm -rf "$RULES_DIR"
    echo "engine switched (${LAST_ENGINE:-?} -> $ENGINE_TAG), removed $RULES_DIR"
fi

# 1. plugin symlink (UBT only discovers the UHT exporter plugin of plugins under <Project>/Plugins)
PLUGIN_LINK="$PROJECT_DIR/Plugins/Puerts"
if [ ! -e "$PLUGIN_LINK" ]; then
    mkdir -p "$(dirname "$PLUGIN_LINK")"
    ln -s "$PLUGIN_SRC" "$PLUGIN_LINK"
    echo "created symlink $PLUGIN_LINK -> $PLUGIN_SRC"
fi

# 2. runtime scripts of the plugin (puerts/*.js etc.) must be under <Project>/Content/JavaScript
JS_DST="$PROJECT_DIR/Content/JavaScript"
for src in "$PLUGIN_SRC/Content/JavaScript"/*/; do
    [ -d "$src" ] || continue
    name="$(basename "$src")"
    dst="$JS_DST/$name"
    # the project's own test scripts live here and must survive the sync
    if [ "$name" = "tests" ]; then
        echo "skip syncing 'tests' ($dst is the project's own test suite)"
        continue
    fi
    rm -rf "$dst"
    cp -R "$src" "$dst"
done

# 3. build
# UBT is run from the project directory (like RunTests.ps1 does) instead of through Build.sh,
# because Build.sh cd's into the engine root and the ubtplugin derives its OutputPath from
# the MSBuild startup directory.
if [ "$SKIP_BUILD" -eq 0 ]; then
    if [ "$ENGINE_MAJOR" -ge 5 ]; then
        # MSBuild can only create the leaf output folder below an existing directory, so on a clean
        # tree GenerateDepsFile throws DirectoryNotFoundException unless the parent exists.
        mkdir -p "$PROJECT_DIR/Binaries/DotNET/UnrealBuildTool/Plugins/CSharpParamDefaultValueMetas"
        (
            # SetupDotnet.sh probes unset variables and relies on unbound-safe semantics,
            # so run it without nounset/errexit like UBT's own shell scripts do.
            set +eu
            source "$ENGINE/Engine/Build/BatchFiles/Mac/SetupEnvironment.sh" -dotnet "$ENGINE/Engine/Build/BatchFiles/Mac"
            set -e
            cd "$PROJECT_DIR"
            # -NoUBA: Plugins/Puerts is a symlink. UBA tracks compiler outputs under the symlink path
            # while clang writes them to the resolved path, so the linker later reports the .o files as
            # missing. The plain parallel executor does not have this problem.
            dotnet "$ENGINE/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.dll" \
                PuertsTestEditor Mac "$CONFIGURATION" -Project="$PROJECT" -WaitMutex -NoUBA
        ) || { echo "build failed" >&2; exit 1; }
    else
        # UE4: UnrealBuildTool.exe on mono. The engine's SetupEnvironment.sh is not sourced: in Mini427 (the CI
        # engine) the Mac batch files have CRLF line endings and fail in bash, so mono is located here instead:
        # system mono (the GitHub macOS runner has one), Mono.framework, then the mono bundled with a Launcher
        # UE4 install (Mini427 does not ship one).
        MONO="$(command -v mono || true)"
        if [ -z "$MONO" ] && [ -x /Library/Frameworks/Mono.framework/Versions/Current/Commands/mono ]; then
            MONO=/Library/Frameworks/Mono.framework/Versions/Current/Commands/mono
        fi
        if [ -z "$MONO" ]; then
            while IFS= read -r candidate; do
                if [ -x "$candidate/Engine/Binaries/ThirdParty/Mono/Mac/bin/mono" ]; then
                    MONO_DIR="$candidate/Engine/Binaries/ThirdParty/Mono/Mac"
                    break
                fi
            done < <(echo "$ENGINE"; ls -d "/Users/Shared/Epic Games"/UE_4.* 2>/dev/null | sort -V -r)
            if [ -z "${MONO_DIR:-}" ]; then echo "mono not found (install mono or a UE4 from the Launcher)" >&2; exit 1; fi
            # same variables as Engine/Build/BatchFiles/Mac/SetupMono.sh, bin/mcs uses $UE_MONO_DIR
            export UE_MONO_DIR="$MONO_DIR"
            export PATH="$MONO_DIR/bin:$PATH"
            export MONO_PATH="$MONO_DIR/lib${MONO_PATH:+:$MONO_PATH}"
            MONO="$MONO_DIR/bin/mono"
        fi
        echo "mono: $MONO"
        (
            set +e
            cd "$PROJECT_DIR"
            # UE4.27 compiles with -Werror, and Mini427 patches the engine headers only as far as the Xcode 15
            # of the GitHub macos-14 runner needs. A newer clang reports more deprecations in the engine headers
            # (-Wdeprecated-literal-operator, ...) and rejects private member access in uninstantiated templates
            # (ScriptInterface.h). The project specific UnrealHeaderTool (needed by the ParamDefaultValueMetas UHT
            # plugin) compiles engine sources too, so this can not be fixed in the plugin.
            # CCC_OVERRIDE_OPTIONS is read by the clang driver: '#' keeps it quiet, '+' appends an argument.
            CLANG_MAJOR="$(clang --version 2>/dev/null | sed -n 's/.*clang version \([0-9]*\).*/\1/p' | head -n 1)"
            if [ "${CLANG_MAJOR:-0}" -gt 15 ]; then
                echo "clang $CLANG_MAJOR is newer than UE4.27 supports, building with -Wno-error -fno-access-control"
                export CCC_OVERRIDE_OPTIONS="# +-Wno-error +-fno-access-control"
            fi
            "$MONO" "$ENGINE/Engine/Binaries/DotNET/UnrealBuildTool.exe" \
                PuertsTestEditor Mac "$CONFIGURATION" -Project="$PROJECT" -WaitMutex
            code=$?
            # same as Engine/Build/BatchFiles/Mac/Build.sh: 2 means "target is up to date"
            if [ $code -eq 2 ]; then code=0; fi
            exit $code
        ) || { echo "build failed" >&2; exit 1; }
    fi
    mkdir -p "$(dirname "$RULES_STAMP")"
    printf '%s' "$ENGINE_TAG" > "$RULES_STAMP"
fi
if [ "$BUILD_ONLY" -eq 1 ]; then exit 0; fi

# 4. run
if [ "$BENCH" -eq 1 ]; then FILTER="Puerts.Bench"; fi
REPORT_DIR="$PROJECT_DIR/Saved/AutomationReport"
rm -rf "$REPORT_DIR"
LOG_FILE="$PROJECT_DIR/Saved/Logs/RunTests.log"
STDOUT_FILE="$PROJECT_DIR/Saved/Logs/RunTests.stdout.txt"
mkdir -p "$(dirname "$LOG_FILE")"
rm -f "$LOG_FILE" "$STDOUT_FILE"

if [ "$ENGINE_MAJOR" -ge 5 ]; then
    EDITOR_CMD="$ENGINE/Engine/Binaries/Mac/UnrealEditor-Cmd"
else
    # UE4 on Mac has no -Cmd variant, the bundle executable runs headless with -nullrhi -unattended
    EDITOR_CMD="$ENGINE/Engine/Binaries/Mac/UE4Editor.app/Contents/MacOS/UE4Editor"
fi
EDITOR_ARGS=(
    "$PROJECT"
    "-ExecCmds=Automation RunTests $FILTER;Quit"
    "-TestExit=Automation Test Queue Empty"
    "-ReportExportPath=$REPORT_DIR"
    -unattended -nullrhi -nosplash -nosound -NoP4 -stdout -FullStdOutLogOutput
    # The Mac editor checks the hardware against a min spec (>= 8GB RAM, known Mac models) before the log
    # is even opened and shows a modal NSAlert that ignores -unattended. GitHub macos runners (7GB,
    # VirtualMac2,1) fail it, so the editor hangs there silently until the timeout.
    -skipminspeccheck
    "-abslog=$LOG_FILE"
)
if [ "$UPDATE_BASELINE" -eq 1 ]; then EDITOR_ARGS+=(-PuertsUpdateBaseline); fi
if [ "$BENCH" -eq 1 ]; then EDITOR_ARGS+=("-PuertsBenchLabel=$BENCH_LABEL"); fi

echo "running: $FILTER (timeout ${TIMEOUT_SEC}s)"
# Plugins/Puerts is a symlink. UBT bakes rpaths of the plugin dylibs relative to the symlinked
# location, but dyld expands @loader_path from the resolved location, so libraries outside the
# engine binaries (libpython3.x.dylib for PapiPython / PapiPythonPreload) are not found.
# DYLD_FALLBACK_LIBRARY_PATH is only consulted after the normal lookup fails.
#
# Setting the variable replaces dyld's built-in fallback ($HOME/lib:/usr/local/lib:/usr/lib),
# so it has to be appended explicitly: the prebuilt v8 dylibs reference @rpath/libc++.dylib,
# which is not shipped with them and only resolves through that default /usr/lib fallback.
PY_LIB_DIR="$ENGINE/Engine/Binaries/ThirdParty/Python3/Mac/lib"
DYLD_DEFAULT_FALLBACK="$HOME/lib:/usr/local/lib:/usr/lib"
DYLD_FALLBACK_LIBRARY_PATH="$PY_LIB_DIR:${DYLD_FALLBACK_LIBRARY_PATH:-$DYLD_DEFAULT_FALLBACK}" \
    "$EDITOR_CMD" "${EDITOR_ARGS[@]}" >"$STDOUT_FILE" 2>&1 &
EDITOR_PID=$!
# for tools that watch the editor process (Tools/MakeEnginePack.sh)
echo "$EDITOR_PID" > "$PROJECT_DIR/Saved/Logs/RunTests.pid"

# Poll instead of relying on an external `timeout`, which macOS does not ship.
# A heartbeat with the last log line is printed every minute, so a stuck run on CI shows where it is.
# Once the log says the tests are complete, the editor gets 60s to exit before it is killed (the report is
# already written by then), UE4 can hang in its shutdown.
elapsed=0
complete_at=-1
while kill -0 "$EDITOR_PID" 2>/dev/null; do
    if [ "$elapsed" -ge "$TIMEOUT_SEC" ]; then
        echo "TIMEOUT after ${TIMEOUT_SEC}s, main thread stack of the editor:"
        sample "$EDITOR_PID" 2 -file "$PROJECT_DIR/Saved/Logs/RunTests.sample.txt" >/dev/null 2>&1 || true
        grep -m1 -A40 'Thread_.*DispatchQueue_1' "$PROJECT_DIR/Saved/Logs/RunTests.sample.txt" 2>/dev/null | sed 's/^/  /' || true
        kill -9 "$EDITOR_PID" 2>/dev/null || true
        wait "$EDITOR_PID" 2>/dev/null || true
        echo "TIMEOUT after ${TIMEOUT_SEC}s, editor killed. Last log lines:"
        tail -n 40 "$LOG_FILE" 2>/dev/null | sed 's/^/  /' || true
        echo "Last stdout lines:"
        tail -n 20 "$STDOUT_FILE" 2>/dev/null | sed 's/^/  /' || true
        exit 2
    fi
    if [ "$complete_at" -lt 0 ] && grep -q 'TEST COMPLETE\. EXIT CODE' "$LOG_FILE" 2>/dev/null; then
        complete_at=$elapsed
    fi
    if [ "$complete_at" -ge 0 ] && [ $((elapsed - complete_at)) -ge 60 ]; then
        echo "tests complete but the editor did not exit within 60s, killing it"
        kill -9 "$EDITOR_PID" 2>/dev/null || true
        break
    fi
    if [ "$elapsed" -gt 0 ] && [ $((elapsed % 60)) -eq 0 ]; then
        if [ -f "$LOG_FILE" ]; then
            echo "[${elapsed}s] $(tail -n 1 "$LOG_FILE" 2>/dev/null | cut -c1-200)"
        else
            echo "[${elapsed}s] no log yet; stdout: $(tail -n 1 "$STDOUT_FILE" 2>/dev/null | cut -c1-200)"
        fi
    fi
    sleep 1
    elapsed=$((elapsed + 1))
done
set +e
wait "$EDITOR_PID"
EDITOR_EXIT=$?
set -e
rm -f "$PROJECT_DIR/Saved/Logs/RunTests.pid"

# 5. report
INDEX="$REPORT_DIR/index.json"
if [ ! -f "$INDEX" ]; then
    echo "no automation report generated (editor exit $EDITOR_EXIT), see $LOG_FILE" >&2
    exit 1
fi

# Parsing index.json is done in python3 because bash has no JSON support.
python3 - "$INDEX" "$LOG_FILE" "$BENCH" <<'PY'
import json
import sys

index_path, log_file, bench = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
# UE writes index.json with a UTF-8 BOM, hence utf-8-sig.
with open(index_path, encoding="utf-8-sig") as f:
    report = json.load(f)

tests = report.get("tests") or []
for t in tests:
    state = t.get("state", "")
    mark = "PASS" if state == "Success" else state.upper()
    print("{:<6} {}".format(mark, t.get("fullTestPath", "")))
    for e in t.get("entries") or []:
        event = e.get("event") or {}
        etype = event.get("type")
        if etype in ("Error", "Warning") or (bench and etype == "Info"):
            print("       [{}] {}".format(etype, event.get("message", "")))

print("succeeded={0} warnings={1} failed={2} notRun={3}".format(
    report.get("succeeded", 0),
    report.get("succeededWithWarnings", 0),
    report.get("failed", 0),
    report.get("notRun", 0),
))
print("log: {}".format(log_file))

sys.exit(1 if (report.get("failed", 0) > 0 or len(tests) == 0) else 0)
PY
