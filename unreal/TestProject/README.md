# PuertsTest

Headless regression / benchmark project for the Unreal plugin (`unreal/Puerts`). It is the M0 safety net of the papi unification work (see `doc/unreal/zhcn/papi_unification_design.md`): every later batch must keep the functional suite green and the behaviour baselines unchanged, unless the change is intended and the baseline is updated in the same commit.

Tests are regular UE Automation tests (`IMPLEMENT_SIMPLE_AUTOMATION_TEST`) that start an `FJsEnv`, run a script under `Content/JavaScript/tests/` and report through `UPuertsTestReporter`.

## Run

```powershell
# functional suite (builds PuertsTestEditor first)
powershell -ExecutionPolicy Bypass -File unreal/TestProject/RunTests.ps1

# options
#   -Engine "D:\Program Files\Epic Games\UE_5.8"   engine root (default: $env:UE_ROOT or the path above)
#   -SkipBuild                                     reuse existing binaries
#   -Filter Puerts.Functional.Mixin                run a subset
#   -UpdateBaseline                                rewrite Baseline/*.txt from the current run
#   -Bench [-BenchLabel name]                      run Puerts.Bench.All, writes Saved/PuertsBench/<name>.json
```

The script exits with a non-zero code when any test fails, so it can be used from a self-hosted CI runner that has the engine installed. GitHub hosted runners have no UE, so there is no workflow for it yet.

What `RunTests.ps1` does:

1. creates the junction `Plugins/Puerts -> ../Puerts` (UBT only runs UHT exporters of plugins located under `<Project>/Plugins`, and JsEnv needs its generated `InitParamDefaultMetas.inl`);
2. copies the plugin runtime scripts into `Content/JavaScript` (only `tests/` is tracked);
3. builds `PuertsTestEditor Win64 Development`;
4. runs `UnrealEditor-Cmd -ExecCmds="Automation RunTests <filter>;Quit" -nullrhi ...` and parses `Saved/AutomationReport/index.json`.

Do not pass `-NoShaderCompile`: on UE 5.8 the editor dereferences null shader compiler stats during init and crashes.

Because the plugin is built in place, `JsEnv.Build.cs` copies `Content/` and `Typing/` to `<plugin>/../../`, i.e. the repository root. Those folders are ignored in the root `.gitignore`.

## Layout

| Path | Purpose |
| --- | --- |
| `Source/PuertsTest/Public/PuertsTestTypes.h` | reflected fixtures: properties of every kind, functions, containers, delegates, events, mixin target, reporter |
| `Source/PuertsTest/Private/PuertsTestCppBinding.cpp` | template binding fixture (`require('cpp').FPuertsTestCppClass`) |
| `Source/PuertsTest/Private/Tests/PuertsTestRunner.*` | starts a JsEnv, drives multi-step scripts with full GC between steps, compares baselines |
| `Source/PuertsTest/Private/Tests/PuertsFunctionalTests.cpp` | `Puerts.Functional.*` |
| `Source/PuertsTest/Private/Tests/PuertsBenchmarks.cpp` | `Puerts.Bench.All` |
| `Content/JavaScript/tests/framework.js` | `test/step/eq/near/assert/catchError/note/observe/run` |
| `Baseline/*.txt` | observed behaviour of the current implementation (`observe`/`note` output) |
| `Baseline/bench_baseline.json` | reference numbers measured before the papi refactoring |

`eq/assert` are for behaviour that must hold. Anything that is merely "how it currently behaves" (error texts, edge cases, odd results) goes through `observe`/`note` into the baseline so that refactoring changes show up as diffs instead of silently.

## Known issues found by M0

These are recorded, not fixed, so that the baseline reflects the implementation before refactoring:

- `blueprint.mixin` on a native class overrides `BlueprintImplementableEvent` but not `BlueprintNativeEvent` called from C++ (`Mixin.txt`).
- Many argument type mismatches do not throw (`Errors.txt`, `<no throw>` lines), e.g. `obj.Add('a', 'b')`.
- `TSet` wrapper has no `Remove`; `Multicast.IsBound` is missing.
- Non-const `TArray&` parameters are only written back when passed via `$ref`.
