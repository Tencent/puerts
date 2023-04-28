#pragma once
#include "CoreMinimal.h"
#include "wasm3.h"
#include "m3_env.h"
#include "WasmBindingTemplate.hpp"

typedef bool (*WasmStaticLinkClassFunction)(IM3Module _Module);

class WASMCORE_API WasmStaticLinkClass
{
public:
    WasmStaticLinkClass(WasmStaticLinkClassFunction func, int Category);

    static bool Link(IM3Module _Module, int Category);
};

#define WASM_BEGIN_LINK_GLOBAL(GlobalID, Category)                           \
    static bool _WASM_##GlobalID##_Link_##Category##_Func(IM3Module _Module) \
    {
#define WASM_LINK_GLOBAL(Func)                                          \
    if (!wasm_link_wrapper<decltype(Func), Func>::link(_Module, #Func)) \
        return false;

#define WASM_LINK_GLOBAL_WITH_NAME(Func, LinkName)                          \
    if (!wasm_link_wrapper<decltype(Func), Func>::link(_Module, #LinkName)) \
        return false;

#define WASM_END_LINK_GLOBAL(GlobalID, Category)                                       \
    return true;                                                                       \
    }                                                                                  \
    ;                                                                                  \
    static WasmStaticLinkClass _WASM_##GlobalID##_Link_##Category##_Func_ExportMember( \
        _WASM_##GlobalID##_Link_##Category##_Func, Category);
