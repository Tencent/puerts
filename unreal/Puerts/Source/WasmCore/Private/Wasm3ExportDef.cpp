#include "Wasm3ExportDef.h"

WASMCORE_API bool Export_m3_GetResults(IM3Function i_function, uint32_t i_retc, const void* o_retptrs[])
{
    M3Result err = m3_GetResults(i_function, i_retc, o_retptrs);
    if (err)
        return false;
    return true;
}

WASMCORE_API bool Export_m3_Call(IM3Function i_function, uint32_t i_argc, const void* i_argptrs[])
{
    M3Result err = m3_Call(i_function, i_argc, i_argptrs);
    if (err)
        return false;
    return true;
}

WASMCORE_API bool Export_m3_LinkRawFunctionEx(IM3Module io_module, const char* const i_moduleName, const char* const i_functionName,
    const char* const i_signature, M3RawCall i_function, const void* i_userdata)
{
    M3Result err = m3_LinkRawFunctionEx(io_module, i_moduleName, i_functionName, i_signature, i_function, i_userdata);
    if (err && err != m3Err_functionLookupFailed)
        return false;
    return true;
}
