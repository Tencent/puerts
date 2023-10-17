/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
#if USE_WASM3
#include "WasmJsFunctionParams.h"
#include "ContainerMeta.h"
#include "Misc/FileHelper.h"
#include "Serialization/JsonReader.h"
#include "WasmRuntime.h"
#include "V8Utils.h"
#include "JSLogger.h"
#include "../ObjectMapper.h"
#include "UECompatible.h"
#include "WasmModuleInstance.h"
#include "GenericPlatform/GenericPlatformMemory.h"

namespace PUERTS_NAMESPACE
{
static void NormalInstanceCall(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    IM3Function _Function = static_cast<IM3Function>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    int argCount = _Function->funcType->numArgs;
    check(Info.Length() >= argCount);

    auto Isolate = Info.GetIsolate();
    auto Context = Isolate->GetCurrentContext();
    int64* args = (int64*) FMemory_Alloca(sizeof(int64) * argCount);
    void** argsPointer = (void**) FMemory_Alloca(sizeof(void*) * argCount);
    for (int Index = 0; Index < argCount; Index++)
    {
        const int type = _Function->funcType->types[_Function->funcType->numRets + Index];
        switch (type)
        {
            case c_m3Type_i32:
                check(Info[Index]->IsNumber());
                *((int*) (args + Index)) = Info[Index]->Int32Value(Context).ToChecked();
                argsPointer[Index] = args + Index;
                break;
            case c_m3Type_i64:
                check(Info[Index]->IsBigInt());
                *(args + Index) = Info[Index]->ToBigInt(Context).ToLocalChecked()->Int64Value();
                argsPointer[Index] = args + Index;
                break;
            case c_m3Type_f32:
                check(Info[Index]->IsNumber());
                *((float*) (args + Index)) = (float) Info[Index]->NumberValue(Context).ToChecked();
                argsPointer[Index] = args + Index;
                break;
            case c_m3Type_f64:
                check(Info[Index]->IsNumber());
                *((double*) (args + Index)) = Info[Index]->NumberValue(Context).ToChecked();
                argsPointer[Index] = args + Index;
                break;
            default:
                check(0);
        }
    }
    if (Export_m3_Call(_Function, argCount, (const void**) argsPointer))
    {
        check(_Function->funcType->numRets <= 1);
        if (_Function->funcType->numRets == 1)
        {
            int64 RetValue;
            void* ret[1] = {&RetValue};
            if (Export_m3_GetResults(_Function, 1, (const void**) ret))
            {
                const int type = _Function->funcType->types[0];
                switch (type)
                {
                    case c_m3Type_i32:
                        Info.GetReturnValue().Set(*((int*) (&RetValue)));
                        break;
                    case c_m3Type_i64:
                        Info.GetReturnValue().Set(v8::BigInt::New(Isolate, RetValue));
                        break;
                    case c_m3Type_f32:
                        Info.GetReturnValue().Set(*((float*) (&RetValue)));
                        break;
                    case c_m3Type_f64:
                        Info.GetReturnValue().Set(*((double*) (&RetValue)));
                    default:
                        check(0);
                }
            }
            else
            {
                FV8Utils::ThrowException(Isolate, "call wasm get results failed");
            }
        }
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "call wasm failed");
    }
}

static const void* NormalInstanceLink(IM3Runtime runtime, IM3ImportContext _ctx, uint64_t* _sp, void* _mem)
{
    IM3Function _Function = _ctx->function;
    WasmNormalLinkInfo* _Info = (WasmNormalLinkInfo*) _ctx->userdata;
    check(_Function->funcType->numRets <= 1);
    uint64_t* raw_sp = _sp;
    if (_Function->funcType->numRets > 0)
    {
        _sp++;
    }
    TArray<v8::Local<v8::Value>, TInlineAllocator<20>> Params;
    check(_Function->funcType->numArgs < 20);
    for (int i = 0; i < _Function->funcType->numArgs; i++)
    {
        const int type = _Function->funcType->types[_Function->funcType->numRets + i];
        switch (type)
        {
            case c_m3Type_i32:
                Params.Add(v8::Int32::New(_Info->Isolate, *((int32*) (_sp + i))));
                break;
            case c_m3Type_i64:
                Params.Add(v8::BigInt::New(_Info->Isolate, *(_sp + i)));
                break;
            case c_m3Type_f32:
                Params.Add(v8::Number::New(_Info->Isolate, *((float*) (_sp + i))));
                break;
            case c_m3Type_f64:
                Params.Add(v8::Number::New(_Info->Isolate, *((double*) (_sp + i))));
                break;
            default:
                check(0);
        }
    }
    v8::TryCatch TryCatch(_Info->Isolate);
    auto Ret = _Info->CachedFunction.Get(_Info->Isolate)
                   ->Call(_Info->Isolate->GetCurrentContext(), v8::Undefined(_Info->Isolate), Params.Num(), Params.GetData());
    if (TryCatch.HasCaught())
    {
        UE_LOG(Puerts, Error, TEXT("%s"), *FV8Utils::TryCatchToString(_Info->Isolate, &TryCatch));
        return "some error";
    }
    if (_Function->funcType->numRets == 1)
    {
        v8::Local<v8::Value> RetValue = Ret.ToLocalChecked();
        const int type = _Function->funcType->types[0];
        switch (type)
        {
            case c_m3Type_i32:
                check(RetValue->IsNumber());
                *((int*) (raw_sp)) = RetValue->Int32Value(_Info->Isolate->GetCurrentContext()).ToChecked();
                break;
            case c_m3Type_i64:
                check(RetValue->IsBigInt());
                *raw_sp = RetValue->ToBigInt(_Info->Isolate->GetCurrentContext()).ToLocalChecked()->Int64Value();
                break;
            case c_m3Type_f32:
                check(RetValue->IsNumber());
                *((float*) (raw_sp)) = RetValue->NumberValue(_Info->Isolate->GetCurrentContext()).ToChecked();
                break;
            case c_m3Type_f64:
                check(RetValue->IsNumber());
                *((double*) (raw_sp)) = RetValue->NumberValue(_Info->Isolate->GetCurrentContext()).ToChecked();
                break;
            default:
                check(0);
        }
    }
    return nullptr;
}

WasmRuntime* NormalInstanceModule(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, TArray<uint8>& InData,
    v8::Local<v8::Object>& ExportsObject, v8::Local<v8::Value> ImportsValue,
    const TArray<std::shared_ptr<WasmRuntime>>& RuntimeList, TArray<WasmNormalLinkInfo*>& CachedLinkFunctionList)
{
    WasmRuntime* UsedRuntime = RuntimeList[0].get();

    v8::Local<v8::Object> MemoryObject;
    v8::Local<v8::Object> ImportsObject;
    //需要同时支持使用js mem以及 env memory
    if (ImportsValue->IsObject())
    {
        v8::Local<v8::Object> EnvObject;
        ImportsObject = ImportsValue.As<v8::Object>();
        {
            auto MaybeEnvValue = ImportsObject->Get(Context, FV8Utils::ToV8String(Isolate, "env"));
            if (!MaybeEnvValue.IsEmpty())
            {
                auto EnvValue = MaybeEnvValue.ToLocalChecked();
                if (EnvValue->IsObject())
                {
                    EnvObject = EnvValue.As<v8::Object>();

                    auto MaybeMemory = EnvObject->Get(Context, FV8Utils::ToV8String(Isolate, "memory"));
                    if (!MaybeMemory.IsEmpty())
                    {
                        auto MemoryValue = MaybeMemory.ToLocalChecked();
                        if (MemoryValue->IsObject())
                        {
                            MemoryObject = MemoryValue.As<v8::Object>();
                        }
                    }
                }
            }
        }
        if (EnvObject.IsEmpty())
        {
            auto MaybeEnvValue = ImportsObject->Get(Context, FV8Utils::ToV8String(Isolate, "js"));
            if (!MaybeEnvValue.IsEmpty())
            {
                auto EnvValue = MaybeEnvValue.ToLocalChecked();
                if (EnvValue->IsObject())
                {
                    EnvObject = EnvValue.As<v8::Object>();

                    auto MaybeMemory = EnvObject->Get(Context, FV8Utils::ToV8String(Isolate, "mem"));
                    if (!MaybeMemory.IsEmpty())
                    {
                        auto MemoryValue = MaybeMemory.ToLocalChecked();
                        if (MemoryValue->IsObject())
                        {
                            MemoryObject = MemoryValue.As<v8::Object>();
                        }
                    }
                }
            }
        }
    }

    //默认情况下使用第一个runtime,其他情况使用memory里面指定的
    if (!MemoryObject.IsEmpty())
    {
        int Seq =
            MemoryObject->Get(Context, FV8Utils::ToV8String(Isolate, "_Seq")).ToLocalChecked()->Int32Value(Context).ToChecked();
        for (auto r : RuntimeList)
        {
            if (r->GetRuntimeSeq() == Seq)
            {
                UsedRuntime = r.get();
                break;
            }
        }
    }

    auto CustomLinkFunc = [&](IM3Module _Module) -> bool
    {
        if (!ImportsObject.IsEmpty())
        {
            auto ModuleNames = ImportsObject->GetOwnPropertyNames(Context).ToLocalChecked();
            for (decltype(ModuleNames->Length()) j = 0; j < ModuleNames->Length(); ++j)
            {
                v8::Local<v8::Value> ModuleName;
                v8::Local<v8::Value> ModuleValue;
                if (ModuleNames->Get(Context, j).ToLocal(&ModuleName) &&
                    ImportsObject->Get(Context, ModuleName).ToLocal(&ModuleValue))
                {
                    auto Module = ModuleValue.As<v8::Object>();
                    v8::String::Utf8Value UtfModuleName(Isolate, ModuleName);
                    auto FunctionNames = Module->GetOwnPropertyNames(Context).ToLocalChecked();
                    for (decltype(FunctionNames->Length()) i = 0; i < FunctionNames->Length(); ++i)
                    {
                        v8::Local<v8::Value> FunctionName;
                        v8::Local<v8::Value> FunctionValue;
                        if (FunctionNames->Get(Context, i).ToLocal(&FunctionName) &&
                            Module->Get(Context, FunctionName).ToLocal(&FunctionValue))
                        {
                            if (FunctionValue->IsFunction())
                            {
                                WasmNormalLinkInfo* NewInfo = new WasmNormalLinkInfo();
                                NewInfo->CachedFunction.Reset(Isolate, FunctionValue.As<v8::Function>());
                                NewInfo->Isolate = Isolate;
                                CachedLinkFunctionList.Add(NewInfo);
                                if (!Export_m3_LinkRawFunctionEx(_Module, *UtfModuleName,
                                        (*(v8::String::Utf8Value(Isolate, FunctionName))), nullptr, &NormalInstanceLink, NewInfo))
                                {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    };

    WasmModuleInstance* NewInstance = new WasmModuleInstance(InData);
    if (NewInstance->ParseModule(UsedRuntime->GetEnv()))
    {
        //如果没有指明需要import memory,那么使用默认的runtime即可,即便外面传入了memory也不生效
        if (!NewInstance->GetModule()->memoryImported)
        {
            UsedRuntime = RuntimeList[0].get();
        }

        if (!NewInstance->LoadModule(UsedRuntime, 0, CustomLinkFunc))
        {
            delete NewInstance;
            NewInstance = nullptr;
        }
    }
    else
    {
        delete NewInstance;
        NewInstance = nullptr;
    }
    if (NewInstance && NewInstance->GetAllExportFunctions().Num())
    {
        IM3Module _Module = NewInstance->GetModule();
        for (uint32 i = 0; i < _Module->numFunctions; ++i)
        {
            IM3Function f = &_Module->functions[i];
            if (f->compiled && f->export_name && *(f->export_name))
            {
                auto Data = v8::External::New(Isolate, f);
                auto Func = v8::Function::New(Context, NormalInstanceCall, Data).ToLocalChecked();
                Func->Set(Context, FV8Utils::ToV8String(Isolate, M3_FUNCTION_KEY), Data);
                (void) ExportsObject->Set(Context, FV8Utils::ToV8String(Isolate, f->export_name), Func);
            }
        }
    }
    if (NewInstance->GetModule()->memoryExportName)
    {
        (void) ExportsObject->Set(Context, FV8Utils::ToV8String(Isolate, "__memoryExport"),
            FV8Utils::ToV8String(Isolate, NewInstance->GetModule()->memoryExportName));
    }
    if (NewInstance->GetModule()->tableExportName)
    {
        (void) ExportsObject->Set(Context, FV8Utils::ToV8String(Isolate, "__tableExport"),
            FV8Utils::ToV8String(Isolate, NewInstance->GetModule()->tableExportName));
        (void) ExportsObject->Set(
            Context, FV8Utils::ToV8String(Isolate, "__moduleIndex"), v8::Integer::New(Isolate, NewInstance->Index));
    }
    return UsedRuntime;
}

}    // namespace PUERTS_NAMESPACE
#endif