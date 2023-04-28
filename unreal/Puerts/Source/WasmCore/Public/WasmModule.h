#pragma once
#include "CoreMinimal.h"
#include "wasm3.h"
#include "m3_env.h"

class WasmRuntime;
class WasmFunction;

class WASMCORE_API WasmModule final
{
private:
    IM3Module _Module;
    TMap<FName, WasmFunction*> _AllExportFunctions;

public:
    WasmModule(const TCHAR* Path, WasmRuntime* Runtime, int LinkCategory);
    ~WasmModule();
    FORCEINLINE const TMap<FName, WasmFunction*>& GetAllExportFunctions() const
    {
        return _AllExportFunctions;
    }
};