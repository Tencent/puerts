#!/bin/bash
#
# Make the UE4.27 toolchain usable with a clang newer than the one Mini427 was patched for.
# Sourced by RunTests.sh and by the BuildPlugin CI job (mac_ios_ci): BuildPlugin compiles engine sources
# through the project's own UnrealHeaderTool (needed by the ParamDefaultValueMetas UHT plugin), so the
# engine header problems below show up there as well and can not be fixed in the plugin.
#
# UE4.27 compiles with -Werror, and Mini427 patches the engine headers only as far as the Xcode 15
# of the GitHub macos-14 runner needs. A newer clang reports more deprecations in the engine headers
# (-Wdeprecated-literal-operator, ...) and rejects private member access in uninstantiated templates
# (ScriptInterface.h: the friend operator<< of TScriptInterface is not accepted as a friend of the
# FScriptInterface base, so the private Serialize is reported).
#
# CCC_OVERRIDE_OPTIONS is read by the clang driver: '#' keeps it quiet, '+' appends an argument.
# Call the command in the same shell after sourcing this file.

CLANG_MAJOR="$(clang --version 2>/dev/null | sed -n 's/.*clang version \([0-9]*\).*/\1/p' | head -n 1)"
if [ "${CLANG_MAJOR:-0}" -gt 15 ]; then
    echo "clang $CLANG_MAJOR is newer than UE4.27 supports, building with -Wno-error -fno-access-control"
    export CCC_OVERRIDE_OPTIONS="# +-Wno-error +-fno-access-control"
fi
