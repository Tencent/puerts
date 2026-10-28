#!/bin/bash
#
# Build the PuertsTest host project and run PuerTS automation tests headless (macOS).
#
# Usage:
#   ./RunTests.sh                                  # build + run Puerts.Functional
#   ./RunTests.sh --skip-build --filter Puerts.Functional.Lifecycle
#   ./RunTests.sh --update-baseline                # rewrite Baseline/*.txt from the current implementation
#   ./RunTests.sh --bench --bench-label before_m1  # run Puerts.Bench, result in Saved/PuertsBench/before_m1.json
#
# Env: UE_ROOT overrides the engine root (defaults to the newest UE_5.x under
# /Users/Shared/Epic Games, the standard install location of the Epic Games Launcher).

set -euo pipefail

find_engine() {
    local candidate
    # read line by line: the install path contains a space ("Epic Games"), so an unquoted
    # $(ls ...) in a for list would be word split into non-existent paths
    while IFS= read -r candidate; do
        if [ -n "$candidate" ] && [ -x "$candidate/Engine/Build/BatchFiles/Mac/Build.sh" ]; then
            echo "$candidate"
            return 0
        fi
    done < <(ls -d "/Users/Shared/Epic Games"/UE_5.* 2>/dev/null | sort -V -r)
    return 1
}

ENGINE="${UE_ROOT:-$(find_engine || true)}"
FILTER="Puerts.Functional"
SKIP_BUILD=0
UPDATE_BASELINE=0
BENCH=0
BENCH_LABEL="latest"
CONFIGURATION="Development"
TIMEOUT_SEC=600

usage() {
    sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --engine)          ENGINE="${2:?--engine needs a value}"; shift 2 ;;
        --engine=*)        ENGINE="${1#*=}"; shift ;;
        --filter)          FILTER="${2:?--filter needs a value}"; shift 2 ;;
        --filter=*)        FILTER="${1#*=}"; shift ;;
        --skip-build)      SKIP_BUILD=1; shift ;;
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

if [ -z "$ENGINE" ] || [ ! -x "$ENGINE/Engine/Build/BatchFiles/Mac/Build.sh" ]; then
    echo "engine not found: ${ENGINE:-<none under /Users/Shared/Epic Games>} (set UE_ROOT or pass --engine)" >&2
    exit 3
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
#
# -NoUBA: Plugins/Puerts is a symlink. UBA tracks compiler outputs under the symlink path
# while clang writes them to the resolved path, so the linker later reports the .o files as
# missing. The plain parallel executor does not have this problem.
if [ "$SKIP_BUILD" -eq 0 ]; then
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
        dotnet "$ENGINE/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.dll" \
            PuertsTestEditor Mac "$CONFIGURATION" -Project="$PROJECT" -WaitMutex -NoUBA
    ) || { echo "build failed" >&2; exit 1; }
fi

# 4. run
if [ "$BENCH" -eq 1 ]; then FILTER="Puerts.Bench"; fi
REPORT_DIR="$PROJECT_DIR/Saved/AutomationReport"
rm -rf "$REPORT_DIR"
LOG_FILE="$PROJECT_DIR/Saved/Logs/RunTests.log"
STDOUT_FILE="$PROJECT_DIR/Saved/Logs/RunTests.stdout.txt"
mkdir -p "$(dirname "$LOG_FILE")"
rm -f "$LOG_FILE" "$STDOUT_FILE"

EDITOR_CMD="$ENGINE/Engine/Binaries/Mac/UnrealEditor-Cmd"
EDITOR_ARGS=(
    "$PROJECT"
    "-ExecCmds=Automation RunTests $FILTER;Quit"
    "-TestExit=Automation Test Queue Empty"
    "-ReportExportPath=$REPORT_DIR"
    -unattended -nullrhi -nosplash -nosound -NoP4 -stdout -FullStdOutLogOutput
    "-abslog=$LOG_FILE"
)
if [ "$UPDATE_BASELINE" -eq 1 ]; then EDITOR_ARGS+=(-PuertsUpdateBaseline); fi
if [ "$BENCH" -eq 1 ]; then EDITOR_ARGS+=("-PuertsBenchLabel=$BENCH_LABEL"); fi

echo "running: $FILTER (timeout ${TIMEOUT_SEC}s)"
# Plugins/Puerts is a symlink. UBT bakes rpaths of the plugin dylibs relative to the symlinked
# location, but dyld expands @loader_path from the resolved location, so libraries outside the
# engine binaries (libpython3.x.dylib for PapiPython / PapiPythonPreload) are not found.
# DYLD_FALLBACK_LIBRARY_PATH is only consulted after the normal lookup fails.
PY_LIB_DIR="$ENGINE/Engine/Binaries/ThirdParty/Python3/Mac/lib"
DYLD_FALLBACK_LIBRARY_PATH="$PY_LIB_DIR${DYLD_FALLBACK_LIBRARY_PATH:+:$DYLD_FALLBACK_LIBRARY_PATH}" \
    "$EDITOR_CMD" "${EDITOR_ARGS[@]}" >"$STDOUT_FILE" 2>&1 &
EDITOR_PID=$!

# Poll instead of relying on an external `timeout`, which macOS does not ship.
elapsed=0
while kill -0 "$EDITOR_PID" 2>/dev/null; do
    if [ "$elapsed" -ge "$TIMEOUT_SEC" ]; then
        kill -9 "$EDITOR_PID" 2>/dev/null || true
        wait "$EDITOR_PID" 2>/dev/null || true
        echo "TIMEOUT after ${TIMEOUT_SEC}s, editor killed. Last log lines:"
        tail -n 15 "$LOG_FILE" 2>/dev/null | sed 's/^/  /' || true
        exit 2
    fi
    sleep 1
    elapsed=$((elapsed + 1))
done
set +e
wait "$EDITOR_PID"
EDITOR_EXIT=$?
set -e

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
with open(index_path, encoding="utf-8") as f:
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
