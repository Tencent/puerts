#pragma once
#include "CoreMinimal.h"
#include "wasm3.h"
#include "m3_env.h"

// true表示成功,false表示失败
WASMCORE_API bool Export_m3_GetResults(IM3Function i_function, uint32_t i_retc, const void* o_retptrs[]);
WASMCORE_API bool Export_m3_Call(IM3Function i_function, uint32_t i_argc, const void* i_argptrs[]);
WASMCORE_API bool Export_m3_LinkRawFunctionEx(IM3Module io_module, const char* const i_moduleName, const char* const i_functionName,
    const char* const i_signature, M3RawCall i_function, const void* i_userdata);
