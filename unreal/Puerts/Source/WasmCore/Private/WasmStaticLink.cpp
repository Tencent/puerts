#include "WasmStaticLink.h"

static TArray<TArray<WasmStaticLinkClassFunction> >* StaticLinkFunctionList = nullptr;

WasmStaticLinkClass::WasmStaticLinkClass(WasmStaticLinkClassFunction func, int Category)
{
    if (!StaticLinkFunctionList)
        StaticLinkFunctionList = new TArray<TArray<WasmStaticLinkClassFunction> >();
    if (StaticLinkFunctionList->Num() <= Category)
    {
        StaticLinkFunctionList->AddDefaulted(Category - StaticLinkFunctionList->Num() + 1);
    }
    TArray<TArray<WasmStaticLinkClassFunction> >& tmp = *StaticLinkFunctionList;
    tmp[Category].Add(func);
}

bool WasmStaticLinkClass::Link(IM3Module _Module, int Category)
{
    if (StaticLinkFunctionList)
    {
        TArray<TArray<WasmStaticLinkClassFunction> >& tmp = *StaticLinkFunctionList;
        if (tmp.Num() > Category)
        {
            for (WasmStaticLinkClassFunction& func : tmp[Category])
            {
                if (!func(_Module))
                {
                    return false;
                }
            }
        }
    }
    return true;
}
