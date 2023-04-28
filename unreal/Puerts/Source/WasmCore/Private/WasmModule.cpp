#include "WasmModule.h"
#include "Misc/FileHelper.h"
#include "WasmRuntime.h"
#include "WasmFunction.h"
#include "WasmStaticLink.h"

WasmModule::WasmModule(const TCHAR* Path, WasmRuntime* Runtime, int LinkCategory)
{
    TArray<uint8> Data;
    FFileHelper::LoadFileToArray(Data, Path);

    _Module = nullptr;
    M3Result err = m3_ParseModule(Runtime->GetEnv(), &_Module, Data.GetData(), Data.Num());    // m3_FreeModule
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_ParseModule:%s"), ANSI_TO_TCHAR(err));
        return;
    }
    IM3Runtime m3Runtime = Runtime->GetRuntime();
    //初始的page设置为已经分配的,防止realloc
    if (_Module->memoryInfo.initPages < m3Runtime->memory.numPages)
    {
        _Module->memoryInfo.initPages = m3Runtime->memory.numPages;
    }
    if (_Module->memoryInfo.maxPages == 0)
    {
        _Module->memoryInfo.maxPages = m3Runtime->memory.maxPages;
    }
    if (_Module->memoryInfo.maxPages > m3Runtime->memory.maxPages)
    {
        UE_LOG(LogTemp, Fatal, TEXT("not enough memory for module %s"), Path);
    }

    err = m3_LoadModule(m3Runtime, _Module);
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_LoadModule:%s"), ANSI_TO_TCHAR(err));
        _Module = nullptr;
        return;
    }

    if (LinkCategory >= 0)
    {
        if (!WasmStaticLinkClass::Link(_Module, LinkCategory))
        {
            return;
        }
    }

    for (u32 i = 0; i < _Module->numFunctions; ++i)
    {
        IM3Function f = &_Module->functions[i];
        //这里需要把所有函数都compile掉,否则在函数调用的过程中如果触发compile,会有写越界
        //这是因为compile需要读取wasm的原始数据(类似v8需要js原始代码一样)
        //这里暂时不想保留wasm的源码,所以先全部compile
        //未来如果有crash,就再考虑保留源码
        // if (f->export_name && *(f->export_name))
        {
            if (!f->compiled)
            {
                err = CompileFunction(f);
                if (err)
                {
                    UE_LOG(LogTemp, Error, TEXT("m3_ExportFunctions:%s %s"), ANSI_TO_TCHAR(err), ANSI_TO_TCHAR(f->export_name));
                }
            }
            if (f->compiled && f->export_name && *(f->export_name))
            {
                _AllExportFunctions.Add(f->export_name, new WasmFunction(f));
            }
        }
    }
}

WasmModule::~WasmModule()
{
    for (auto Iter = _AllExportFunctions.CreateIterator(); Iter; ++Iter)
    {
        delete Iter->Value;
    }
    // free runtime 的时候会调用,所以不用freemodule?
    if (_Module)
    {
        // m3_FreeModule(_Module);
    }
}
