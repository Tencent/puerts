# UE 5.7 Plugin Build Fixes

This document records the issues encountered when building the Puerts plugin against
Unreal Engine 5.7 with `RunUAT BuildPlugin` and the configuration changes that resolved them.

---

## Problem 1 — `AdditionalCompilerArguments` silently ignored in UE 5.7

### Symptom

The `BuildConfiguration.xml` contained:

```xml
<WindowsPlatform>
    <AdditionalCompilerArguments>/Zm300</AdditionalCompilerArguments>
</WindowsPlatform>
```

UBT emitted a schema validation warning at build start:

```
warning: The element 'WindowsPlatform' has invalid child element 'AdditionalCompilerArguments'.
```

The element was silently dropped, so the `/Zm300` flag was never passed to `cl.exe`.

### Root cause

UE 5.7 removed `AdditionalCompilerArguments` from the `WindowsPlatform` section of
`BuildConfiguration.xml`. The replacement field is `PCHMemoryAllocationFactor`, which maps
directly to the MSVC `/Zm<N>` compiler switch.

### Fix

```xml
<!-- Before -->
<AdditionalCompilerArguments>/Zm300</AdditionalCompilerArguments>

<!-- After -->
<PCHMemoryAllocationFactor>300</PCHMemoryAllocationFactor>
```

---

## Problem 2 — `C1076` / `C3859` PCH memory exhaustion under XGE executor

### Symptom

Even after Problem 1 was fixed and `/Zm300` was confirmed present in the compiler response
files (`.rsp`), the build still failed with:

```
c1xx: error C3859: Failed to create virtual memory for PCH
c1xx: note: the system returned code 1455: The paging file is too small for this operation to complete.
c1xx: fatal error C1076: compiler limit: internal heap limit reached
```

The errors appeared for 16+ translation units in a single burst.

### Root cause

The build was using the **XGE (Incredibuild) executor** (`Total time in XGE executor`).
Although Incredibuild had no active license (remote agents were unavailable), UBT still
dispatched the build through the XGE executor in local mode — and that executor **ignores
`MaxParallelActions`** from `BuildConfiguration.xml`. It can schedule far more concurrent
`cl.exe` processes than the configured limit.

Each process that creates or loads a shared PCH with `/Zm300` reserves a large block of
virtual address space. With many processes running simultaneously, the system's commit
charge (physical RAM + page file) was exhausted, triggering error 1455.

### Fix

Two changes to `BuildConfiguration.xml`:

1. **Disable the XGE executor** so that UBT falls back to the UBA local executor, which
   correctly honours `MaxParallelActions`:

   ```xml
   <BuildConfiguration>
       <bAllowXGE>false</bAllowXGE>
   </BuildConfiguration>
   ```

2. **Reduce `MaxParallelActions`** from 8 to 4 to limit peak memory demand from
   concurrent PCH allocations:

   ```xml
   <BuildConfiguration>
       <MaxParallelActions>4</MaxParallelActions>
   </BuildConfiguration>
   ```

---

## Final `BuildConfiguration.xml`

Location: `%APPDATA%\Unreal Engine\UnrealBuildTool\BuildConfiguration.xml`

```xml
<?xml version="1.0" encoding="utf-8" ?>
<Configuration xmlns="https://www.unrealengine.com/BuildConfiguration">
    <BuildConfiguration>
        <MaxParallelActions>4</MaxParallelActions>
        <bAllowXGE>false</bAllowXGE>
    </BuildConfiguration>
    <WindowsPlatform>
        <PCHMemoryAllocationFactor>300</PCHMemoryAllocationFactor>
    </WindowsPlatform>
</Configuration>
```

---

## Build command

```bat
set CL=/Zm300
"C:\Program Files\Epic Games\UE_5.7\Engine\Build\BatchFiles\RunUAT.bat" BuildPlugin ^
  -Plugin="<repo>\unreal\Puerts\Puerts.uplugin" ^
  -Package="<output-dir>" ^
  -Rocket
```

> **Note:** The `set CL=/Zm300` line is only effective when the command is run in a
> `cmd.exe` shell. When invoked through PowerShell or a Bash-based tool, use the
> `PCHMemoryAllocationFactor` setting in `BuildConfiguration.xml` instead (which is the
> recommended approach regardless).
