# FAQ

## Warning: `new (std::nothrow) int[0]` Returns `nullptr`, Try Fixing It!

Unreal Engine overrides the `new` operator in a way that doesn't comply with the C++ standard: when using `std::nothrow` to allocate an array of length 0, it returns `nullptr`. According to the standard, it should return a valid pointer and only return `nullptr` on out-of-memory (OOM). This behavior misleads standard-compliant runtimes like V8 into thinking an OOM occurred, which causes an abort.

This issue is confirmed by Epic and currently only observed on Windows.

Puerts will detect this issue and patch the memory allocation behavior. When it does, it logs the warning:  
**“new (std::nothrow) int[0] return nullptr, try fix it!”**  
This is just an informational warning and does not impact functionality.

---

## Some Extension Functions Are Unavailable in Auto-Binding Mode

This happens because the Puerts module initializes early and cannot discover extension functions defined in modules that load afterward.

**Solution:**  
After all modules are initialized, call the following API to re-scan for extension methods:

```cpp
IPuertsModule::Get().InitExtensionMethodsMap();
```

---

## App Hangs When "Wait for Debugger" Option Is Checked

This option deliberately pauses the process to wait for a debugger to attach. Once a debugger connects, execution continues.

If you enabled it by accident and haven't configured a debugger, you can terminate the process and set the value to `False` in the following config file:

```
Config/DefaultPuerts.ini
```

---

## `StaticClass` Returns Unexpected `UClass` in TypeScript-Generated Blueprints

TypeScript classes do not have a `StaticClass()` method. When called, it returns the first class in the inheritance chain that does have this method, along with its `UClass`.

This can cause confusion—like missing subclass methods or `CreateDefaultSubobject` errors stating the class is abstract.

**Correct Usage:**  
Use the following to load a blueprint:

```ts
UE.Class.Load("path/to/your/blueprint/file")
```

---

## macOS Error: "Cannot open libv8.dylib because the developer cannot be verified"

Navigate to the directory containing the `.dylib` file (usually under:  
`YourProject/Plugins/Puerts/ThirdParty/v8/Lib/macOSdylib`) and run:

```bash
sudo xattr -r -d com.apple.quarantine *.dylib
```

---

## "XXXProject could not be compiled" Error in Blueprint-Only Projects

In Blueprint-only projects, Unreal Engine doesn't compile C++ plugins automatically. You need to manually generate a Visual Studio (or Xcode on macOS) project and compile from the IDE.

---

## Runtime Errors About Missing Fields After Packaging

This is usually due to inconsistent handling of `FName` between the editor and runtime—`FName` is case-sensitive in the editor but case-insensitive at runtime.

For example, if you defined a field `count` in Blueprints and generated code in the editor, it works fine. But after packaging, if somewhere a `Count` field is initialized first, it gets reused due to how `FName.ToString()` works.

So your script accessing `count` will fail because the actual field is `Count`.

---

## Error in UE5: "Construct TypeScript Object TestActor_C_1(...) on illegal thread!"

This is caused by UE5 enabling `AsyncLoadingThreadEnabled` by default.

**Solution:** Disable this setting to avoid the issue.

---

## Avoiding "Access Invalid Object" Exceptions

This exception is thrown by Puerts when it detects calls on an invalidated object. Any such call (including `UObject::IsValid`) will raise the exception.

Though technically easy to add a check API, doing so would clutter business logic. Instead:

- Design your logic to avoid holding onto invalid objects (e.g., clean up on scene transitions).
- If unavoidable and non-critical, use try-catch to suppress the exception.

---

## Garbage Collection (GC) Behavior

When a UE object is passed to TypeScript, Puerts creates a stub object that proxies native calls. There are two GC ownership models:

### 1. Stub Owns UE Object (managed by JS GC)

- If JS GC collects the stub, it drops its reference to the UE object.
- If UE has no other references to the object, UE GC will collect it.

### 2. UE Owns Stub (managed by UE GC)

- If UE GC collects the UE object, it also drops the stub reference.
- If JS has no remaining references to the stub, JS GC will collect it.

**Scenarios where UE owns stub:**

- TS class inherits a UE class
- Using `mixin` with `objectTakeByNative`
- Using deprecated `makeUClass`

In other cases, the stub usually owns the UE object and keeps it alive from the JS side.

**Important:**  
Even if an object is still referenced, UE can still forcibly destroy it (e.g., during scene transitions). This differs from garbage collectors in C#, Java, Lua, etc.

---

## UE Object Is Held by `Puerts_UserObjectRetainer`

This indicates that the JS-side proxy object hasn't been released yet.

GC requires:
1. No references to the object.
2. The object is found during GC and released.

For V8:
- It uses generational GC, so old generation scans aren't frequent.
- To speed up collection, use:

```cpp
FJsEnv::LowMemoryNotification();  // Hint V8 to GC
FJsEnv::RequestFullGarbageCollectionForTesting();  // Force full GC (slow)
```

---

## Scripts Not Running After Packaging (Mobile/PC)

Since JavaScript files aren't UE assets (`*.asset`), they must be manually included in packaging.

**Fix:**
Go to **Project Settings → Packaging → Additional Non-Asset Directories to Package**, and add the `Content/JavaScript` directory.

---

## TypeScript Version Upgrade

If UE class inheritance is enabled, Puerts uses the TypeScript compiler.

Installed under:  
`YourProject/Plugins/Puerts/Content/JavaScript/PuertsEditor`  
(and copied to `YourProject/Content/JavaScript/PuertsEditor`)

To upgrade:
1. Modify `package.json` in both locations.
2. Run `npm install .` in those directories.

**Version Compatibility:**

- Long-term stable: `3.4.5`, `4.4.4`, `4.7.4`
- Tested and works: `4.8.2`
- Not supported: `>4.8.3`

If UE class inheritance is **not** enabled, these version restrictions don't apply.

---

## `ue_bp.d.ts` Errors, Regeneration Doesn’t Help

Blueprint declaration files are generated incrementally. If dependencies change or the file is altered by version control, try full regeneration:

```bash
Puerts.Gen FULL
```

---

## TS Class Inheritance Doesn’t Generate Proxy Blueprints

### Troubleshooting:

1. In UE Command Line, run:
   ```bash
   puerts ls
   ```
   If it returns `Puerts command not initialized`, your setup might be incorrect. Check the installation steps.

2. To find a specific TS class:
   ```bash
   puerts ls TsTestActor
   ```
   - If it doesn't show, it’s not in the TS project. Check `tsconfig.json`.

3. If found, check `isBP` and `processed` columns:
   - If `isBP = false` and `processed = true`, format is incorrect. Refer to Puerts’ "Inheriting Engine Classes" documentation.

4. You can manually trigger compilation with:
   ```bash
   puerts compile <file-id>
   ```
   Replace `<file-id>` with the ID from `puerts ls`.

---

## Syntax Errors in `ue_bp.d.ts`

This usually comes from illegal characters (unsupported by TS) in Blueprint paths, field names, or parameters.

**Solutions:**
- If only a few Blueprints are affected, blacklist them in **Project Settings → Puerts**.
- For many invalid Blueprints, place valid ones in a separate directory and generate types for that path:
  ```bash
  Puerts.Gen PATH=/Game/StarterContent
  ```

---

## Intermittent "Maximum Call Stack Size Exceeded" Error

If this happens **occasionally** (not always), it’s likely due to multi-threaded access to `FJsEnv`.

**Solution:**  
Add `THREAD_SAFE` macro to `JsEnv.Build.cs`.

**Note:**
- On V8 backend, this resolves multi-threading issues.
- On QJS backend, multi-threading is **not supported** and may throw obscure `<unknown>:-1` errors.
- If the error is consistent, you likely have a recursive loop in your JS code.