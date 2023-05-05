/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ContainerMeta.h"
#include "WasmJsFunctionParams.h"
#include "Misc/FileHelper.h"
#include "Serialization/JsonReader.h"
#include "WasmRuntime.h"
#include "V8Utils.h"
#include "JSLogger.h"
#include "../ObjectMapper.h"
#include "UECompatible.h"
namespace puerts
{
static bool PushOneParam(v8::Isolate* Isoate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& JsObject,
    WasmJsParamDesc& ParamDesc, WasmRuntime* Runtime, uint64* ValuePtr, void*& ArgPtr)
{
    ArgPtr = ValuePtr;
    switch (ParamDesc.ParamType)
    {
        case WasmJsParamType::Type_Float:
            if (ParamDesc.IsReference)
            {
                check(JsObject->IsObject());
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(float));
                WASM_PTR NewPtr = NewInfo.PtrInWasm;
                float* RealPtr = (float*) NewInfo.RealPtr;
                *RealPtr = JsObject.As<v8::Object>()->Get(Context, 0).ToLocalChecked()->NumberValue(Context).ToChecked();
                *((WASM_PTR*) ArgPtr) = NewPtr;
            }
            else
            {
                float* ptr = (float*) (ValuePtr);
                *ptr = JsObject->NumberValue(Context).ToChecked();
                ArgPtr = ptr;
            }
            return true;
        case WasmJsParamType::Type_Int:
            if (ParamDesc.IsReference)
            {
                check(JsObject->IsObject());
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(int));
                WASM_PTR NewPtr = NewInfo.PtrInWasm;
                int* RealPtr = (int*) NewInfo.RealPtr;
                *RealPtr = JsObject.As<v8::Object>()->Get(Context, 0).ToLocalChecked()->Int32Value(Context).ToChecked();
                *((WASM_PTR*) ArgPtr) = NewPtr;
            }
            else
            {
                int* ptr = (int*) (ValuePtr);
                *ptr = JsObject->Int32Value(Context).ToChecked();
                ArgPtr = ptr;
            }
            return true;
        case WasmJsParamType::Type_Bool:
            if (ParamDesc.IsReference)
            {
                check(JsObject->IsObject());
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(bool));
                WASM_PTR NewPtr = NewInfo.PtrInWasm;
                bool* RealPtr = (bool*) NewInfo.RealPtr;
                *RealPtr = JsObject.As<v8::Object>()->Get(Context, 0).ToLocalChecked()->BooleanValue(Isoate);
                *((WASM_PTR*) ArgPtr) = NewPtr;
            }
            else
            {
                bool* ptr = (bool*) (ValuePtr);
                *ptr = JsObject->BooleanValue(Isoate);
            }
            return true;
        case WasmJsParamType::Type_Double:
            if (ParamDesc.IsReference)
            {
                check(JsObject->IsObject());
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(double));
                WASM_PTR NewPtr = NewInfo.PtrInWasm;
                double* RealPtr = (double*) NewInfo.RealPtr;
                *RealPtr = JsObject.As<v8::Object>()->Get(Context, 0).ToLocalChecked()->NumberValue(Context).ToChecked();
                *((WASM_PTR*) ArgPtr) = NewPtr;
            }
            else
            {
                double* ptr = (double*) (ValuePtr);
                *ptr = JsObject->NumberValue(Context).ToChecked();
                ArgPtr = ptr;
            }
            return true;
        case WasmJsParamType::Type_Int64:
            if (ParamDesc.IsReference)
            {
                check(JsObject->IsObject());
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(int64));
                WASM_PTR NewPtr = NewInfo.PtrInWasm;
                int64* RealPtr = (int64*) NewInfo.RealPtr;
                *RealPtr = JsObject.As<v8::Object>()->Get(Context, 0).ToLocalChecked()->IntegerValue(Context).ToChecked();
                *((WASM_PTR*) ArgPtr) = NewPtr;
            }
            else
            {
                int64* ptr = (int64*) (ValuePtr);
                *ptr = JsObject->IntegerValue(Context).ToChecked();
                ArgPtr = ptr;
            }
            return true;
        case WasmJsParamType::Type_Pointer:
            if (ParamDesc.IsReference)
            {
                FV8Utils::ThrowException(Isoate, "pointer cannot be reference");
                return false;
            }
            if (ParamDesc.IsUObject)
            {
                using object_type = typename wasm_pointer_support_ptr_in_wasm<UObject*>::type;
                UObject* Object = FV8Utils::GetUObject(Context, JsObject);
                if (Object == RELEASED_UOBJECT)
                {
                    FV8Utils::ThrowException(Isoate, "uobject has been freed");
                    return false;
                }
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(void*));
                *((object_type*) NewInfo.RealPtr) = static_cast<object_type>(Object);
                *((WASM_PTR*) ArgPtr) = NewInfo.PtrInWasm;
            }
            else
            {
                void* Object = (void*) FV8Utils::GetPointer(Context, JsObject);
                WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(sizeof(void*));
                *((void**) NewInfo.RealPtr) = Object;
                *((WASM_PTR*) ArgPtr) = NewInfo.PtrInWasm;
            }
            return true;
        case WasmJsParamType::Type_Struct:
        {
            check(JsObject->IsObject());
            v8::Local<v8::Object> UseObject = JsObject.As<v8::Object>();
            if (ParamDesc.IsReference)
            {
                v8::Local<v8::Value> Temp = UseObject->Get(Context, 0).ToLocalChecked();
                check(Temp->IsObject());
                UseObject = Temp.As<v8::Object>();
            }
            WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(ParamDesc.Struct->GetStructureSize());
            void* RawPtr = FV8Utils::GetPointer(UseObject);
            FMemory::Memcpy(NewInfo.RealPtr, RawPtr, ParamDesc.Struct->GetStructureSize());
            *((WASM_PTR*) ArgPtr) = NewInfo.PtrInWasm;
            return true;
        }
        default:
            check(0);
            return false;
    }
}

static void CallWasm(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    WasmJsFunctionDesc* FunctionDesc = reinterpret_cast<WasmJsFunctionDesc*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    WasmRuntime* Runtime = WasmRuntime::StaticGetWasmRuntime(FunctionDesc->Function->GetFunction()->module->runtime);

    WasmStackAllocCacheInfo Backup = Runtime->GetCurrentStackAllocInfo();

    int MaxCount = FunctionDesc->ParamList.Num() + 1;
    uint64* ParamValueMem = (uint64*) FMemory_Alloca(sizeof(int64) * MaxCount);
    void** ArgsToWasm = (void**) FMemory_Alloca(sizeof(void*) * MaxCount);
    int ArgsCount = 0;
    int ArgsIndexBegin = 0;
    // struct 的返回值是要放在Args里面的
    if (FunctionDesc->ReturnValue.ParamType == WasmJsParamType::Type_Struct)
    {
        WasmJsParamDesc& ParamDesc = FunctionDesc->ReturnValue;
        WasmStackAllocCacheInfo NewInfo = Runtime->AllocStackParam(ParamDesc.Struct->GetStructureSize());
        ParamDesc.Struct->InitializeStruct(NewInfo.RealPtr);
        ParamValueMem[0] = NewInfo.PtrInWasm;
        ArgsToWasm[0] = ParamValueMem;
        ArgsCount++;
        ArgsIndexBegin = 1;
    }
    for (int Index = 0; Index < FunctionDesc->ParamList.Num(); Index++)
    {
        if (!PushOneParam(Isolate, Context, Info[Index], FunctionDesc->ParamList[Index], Runtime, ParamValueMem + ArgsCount,
                ArgsToWasm[ArgsCount]))
        {
            Runtime->RestoreCurrentStackAllocInfo(Backup);
            return;
        }
        ArgsCount++;
    }
    if (!FunctionDesc->Function->CallWithArgsNoReturn(ArgsCount, (const void**) ArgsToWasm))
    {
        Runtime->RestoreCurrentStackAllocInfo(Backup);
        FV8Utils::ThrowException(Isolate, "Call Wasm Function Error");
        return;
    }

    WasmJsParamDesc& Return = FunctionDesc->ReturnValue;
    switch (Return.ParamType)
    {
        case WasmJsParamType::Type_Float:
        {
            float Ret = FunctionDesc->Function->GetReturnValue<float>();
            Info.GetReturnValue().Set(v8::Number::New(Isolate, Ret));
            break;
        }
        case WasmJsParamType::Type_Int:
        {
            int Ret = FunctionDesc->Function->GetReturnValue<int>();
            Info.GetReturnValue().Set(v8::Integer::New(Isolate, Ret));
            break;
        }
        case WasmJsParamType::Type_Void:
            break;
        case WasmJsParamType::Type_Bool:
        {
            bool Ret = FunctionDesc->Function->GetReturnValue<bool>();
            Info.GetReturnValue().Set(v8::Boolean::New(Isolate, Ret));
            break;
        }
        case WasmJsParamType::Type_Double:
        {
            double Ret = FunctionDesc->Function->GetReturnValue<double>();
            Info.GetReturnValue().Set(v8::Number::New(Isolate, Ret));
            break;
        }
        case WasmJsParamType::Type_Int64:
        {
            int64 Ret = FunctionDesc->Function->GetReturnValue<int64>();
            Info.GetReturnValue().Set(v8::BigInt::New(Isolate, Ret));
            break;
        }
        case WasmJsParamType::Type_Pointer:
        {
            if (Return.IsUObject)
            {
                UObject* Object = FunctionDesc->Function->GetReturnValue<UObject*>();
                IObjectMapper* Wrapper = DataTransfer::IsolateData<IObjectMapper>(Isolate);
                Info.GetReturnValue().Set(Wrapper->FindOrAdd(Isolate, Context, Object->GetClass(), Object));
            }
            else
            {
                check(0);    //暂时不支持uobject之外的指针
            }
            break;
        }
        case WasmJsParamType::Type_Struct:
        {
            //结构体的返回值在参数的第一个
            WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + 0));

            IObjectMapper* Wrapper = DataTransfer::IsolateData<IObjectMapper>(Isolate);
            void* RetMem = FScriptStructWrapper::Alloc(Return.Struct);
            Return.Struct->CopyScriptStruct(RetMem, Runtime->GetPlatformAddress(Ptr));
            Info.GetReturnValue().Set(Wrapper->FindOrAddStruct(Isolate, Context, Return.Struct, RetMem, false));
            break;
        }
        default:
            check(0);
    }

    for (int Index = 0; Index < FunctionDesc->ParamList.Num(); Index++)
    {
        WasmJsParamDesc& ParamDesc = FunctionDesc->ParamList[Index];
        if (ParamDesc.IsReference)
        {
            if (ParamDesc.IsConst)
            {
            }
            else
            {
                switch (ParamDesc.ParamType)
                {
                    case WasmJsParamType::Type_Int:
                    {
                        WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + Index + ArgsIndexBegin));
                        int* RealPtr = (int*) Runtime->GetPlatformAddress(Ptr);
                        (void) Info[Index].As<v8::Object>()->Set(Context, 0, v8::Integer::New(Isolate, *RealPtr));
                        break;
                    }
                    case WasmJsParamType::Type_Float:
                    {
                        WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + Index + ArgsIndexBegin));
                        float* RealPtr = (float*) Runtime->GetPlatformAddress(Ptr);
                        (void) Info[Index].As<v8::Object>()->Set(Context, 0, v8::Number::New(Isolate, *RealPtr));
                        break;
                    }
                    case WasmJsParamType::Type_Bool:
                    {
                        WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + Index + ArgsIndexBegin));
                        bool* RealPtr = (bool*) Runtime->GetPlatformAddress(Ptr);
                        (void) Info[Index].As<v8::Object>()->Set(Context, 0, v8::Boolean::New(Isolate, *RealPtr));
                        break;
                    }
                    case WasmJsParamType::Type_Int64:
                    {
                        WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + Index + ArgsIndexBegin));
                        int64* RealPtr = (int64*) Runtime->GetPlatformAddress(Ptr);
                        (void) Info[Index].As<v8::Object>()->Set(Context, 0, v8::BigInt::New(Isolate, *RealPtr));
                        break;
                    }
                    case WasmJsParamType::Type_Double:
                    {
                        WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + Index + ArgsIndexBegin));
                        double* RealPtr = (double*) Runtime->GetPlatformAddress(Ptr);
                        (void) Info[Index].As<v8::Object>()->Set(Context, 0, v8::Number::New(Isolate, *RealPtr));
                        break;
                    }
                    case WasmJsParamType::Type_Struct:
                    {
                        WASM_PTR Ptr = *((WASM_PTR*) (ParamValueMem + Index + ArgsIndexBegin));
                        double* RealPtr = (double*) Runtime->GetPlatformAddress(Ptr);
                        void* SourcePtr =
                            FV8Utils::GetPointer(Context, Info[Index].As<v8::Object>()->Get(Context, 0).ToLocalChecked());
                        ParamDesc.Struct->CopyScriptStruct(SourcePtr, RealPtr);
                        break;
                    }
                    case WasmJsParamType::Type_Pointer:
                    {
                        check(0);
                        break;
                    }
                    default:
                        check(0);
                        break;
                }
            }
        }
    }
    Runtime->RestoreCurrentStackAllocInfo(Backup);
    return;
}

static void InitWasmParamsFromJson(WasmJsParamDesc& TargetParamDesc, const TSharedPtr<FJsonObject>& JsonObject)
{
    static TMap<FString, WasmJsParamType> InnerMap = {
        {TEXT("Void"), WasmJsParamType::Type_Void},
        {TEXT("Bool"), WasmJsParamType::Type_Bool},
        {TEXT("Int"), WasmJsParamType::Type_Int},
        {TEXT("Int64"), WasmJsParamType::Type_Int64},
        {TEXT("Float"), WasmJsParamType::Type_Float},
        {TEXT("Double"), WasmJsParamType::Type_Double},
        {TEXT("Struct"), WasmJsParamType::Type_Struct},
        {TEXT("Pointer"), WasmJsParamType::Type_Pointer},
    };
    FString ParamType = JsonObject->GetStringField(TEXT("Type"));
    TargetParamDesc.ParamType = InnerMap.FindChecked(ParamType);
    bool IsConst = false;
    (void) JsonObject->TryGetBoolField(TEXT("IsConst"), IsConst);
    bool IsReference = false;
    (void) JsonObject->TryGetBoolField(TEXT("IsReference"), IsReference);
    bool IsUObject = true;
    (void) JsonObject->TryGetBoolField(TEXT("IsUObject"), IsUObject);

    FString ClassName;
    UScriptStruct* Struct = nullptr;
    if (JsonObject->TryGetStringField(TEXT("ClassName"), ClassName))
    {
        Struct = FindAnyType<UScriptStruct>(*ClassName + 1);
        check(Struct->GetCppStructOps()->IsPlainOldData() && Struct->IsNative());
    }

    TargetParamDesc.IsConst = IsConst;
    TargetParamDesc.IsReference = IsReference;
    TargetParamDesc.IsUObject = IsUObject;
    TargetParamDesc.Struct = Struct;
}

static void InitWasmModuleToJsObject(v8::Local<v8::Object>& TargetObject, WasmModule* TargetModule, const FString& RootPath,
    const FString& ModulePath, WasmJsModuleDesc& TargetModuleDesc)
{
    FString Content;
    {
        FString FilePath = (RootPath / ModulePath) + TEXT(".json");
        if (!FFileHelper::LoadFileToString(Content, *FilePath))
        {
            UE_LOG(Puerts, Error, TEXT("File:%s Load Failed"), *FilePath);
            return;
        }
    }

    TSharedPtr<FJsonObject> ModulesObject = MakeShared<FJsonObject>();
    {
        TSharedRef<TJsonReader<>> JsonReader = TJsonReaderFactory<>::Create(Content);
        if (!FJsonSerializer::Deserialize(JsonReader, ModulesObject))
        {
            UE_LOG(Puerts, Error, TEXT("Json Parse Failed for Wasm Modules Config %s"), *ModulePath);
            return;
        }
    }

    const TSharedPtr<FJsonObject>* Exports = nullptr;
    if (!ModulesObject->TryGetObjectField(TEXT("Exports"), Exports))
    {
        UE_LOG(Puerts, Error, TEXT("cannot find expoorts in module %s"), *ModulePath);
        return;
    }
    v8::Isolate* Isolate = TargetObject->GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    TargetModuleDesc.FunctionList.AddDefaulted((*Exports)->Values.Num());
    int Index = 0;
    for (auto Iter = (*Exports)->Values.CreateConstIterator(); Iter; ++Iter)
    {
        WasmJsFunctionDesc& TargetFunctionDesc = TargetModuleDesc.FunctionList[Index];
        Index++;
        const TSharedPtr<FJsonObject>* FunctionDesc = nullptr;
        if (Iter->Value->TryGetObject(FunctionDesc))
        {
            const TSharedPtr<FJsonObject> Return = (*FunctionDesc)->GetObjectField(TEXT("Return"));
            InitWasmParamsFromJson(TargetFunctionDesc.ReturnValue, Return);
            if (TargetFunctionDesc.ReturnValue.IsReference)
            {
                UE_LOG(Puerts, Fatal, TEXT("return value can not be reference"));
            }
            if (TargetFunctionDesc.ReturnValue.ParamType == WasmJsParamType::Type_Pointer &&
                !TargetFunctionDesc.ReturnValue.IsUObject)
            {
                UE_LOG(Puerts, Fatal, TEXT("can not return cpp bind object"));
            }
            const TArray<TSharedPtr<FJsonValue>> ParamList = (*FunctionDesc)->GetArrayField(TEXT("ParamList"));
            TargetFunctionDesc.ParamList.AddDefaulted(ParamList.Num());
            for (int i = 0; i < ParamList.Num(); i++)
            {
                InitWasmParamsFromJson(TargetFunctionDesc.ParamList[i], ParamList[i]->AsObject());
            }

            const FString& FunctionName = Iter->Key;
            const WasmFunction* const* TargetFunction = TargetModule->GetAllExportFunctions().Find(*FunctionName);
            if (TargetFunction && *TargetFunction)
            {
                TargetFunctionDesc.Function = *TargetFunction;
                auto NewFunction =
                    v8::Function::New(Context, CallWasm, v8::External::New(Isolate, &TargetFunctionDesc)).ToLocalChecked();
                (void) (TargetObject->Set(Context, FV8Utils::ToV8String(Isolate, FunctionName), NewFunction));
            }
        }
    }
}

void InitWasmRuntimeToJsObject(v8::Local<v8::Object>& GlobalObject, WasmRuntime* TargetRuntime, const FString& RootPath,
    TArray<WasmJsModuleDesc>& AllWasmJsModuleDesc)
{
    AllWasmJsModuleDesc.Empty();
    FString Content;
    {
        FString ModulesPath = RootPath / TEXT("modules.json");
        if (!FFileHelper::LoadFileToString(Content, *ModulesPath))
        {
            UE_LOG(Puerts, Error, TEXT("File:%s Load Failed"), *ModulesPath);
            return;
        }
    }

    TSharedPtr<FJsonObject> ModulesObject = MakeShareable(new FJsonObject());
    {
        TSharedRef<TJsonReader<>> JsonReader = TJsonReaderFactory<>::Create(Content);
        if (!FJsonSerializer::Deserialize(JsonReader, ModulesObject))
        {
            UE_LOG(Puerts, Error, TEXT("Json Parse Failed for Wasm Modules Config"));
            return;
        }
    }

    AllWasmJsModuleDesc.AddDefaulted(ModulesObject->Values.Num());
    int Index = 0;
    for (auto Iter = ModulesObject->Values.CreateConstIterator(); Iter; ++Iter)
    {
        WasmJsModuleDesc& Target = AllWasmJsModuleDesc[Index];
        Index++;
        const TSharedPtr<FJsonObject>* ModuleDesc = nullptr;
        if (Iter->Value->TryGetObject(ModuleDesc))
        {
            int LinkCategory = (*ModuleDesc)->GetIntegerField(TEXT("LinkCategory"));
            FString GlobalNameInTs = (*ModuleDesc)->GetStringField(TEXT("GlobalNameInTs"));
            FString ModulePath = Iter->Key;
            FString ModulePathWithEditor = ModulePath;
#if WITH_EDITOR
            ModulePathWithEditor = ModulePathWithEditor + TEXT("_Editor");
#endif
            //只有wasm文件需要editor后缀
            WasmModule* TargetModule =
                TargetRuntime->LoadModule(*((RootPath / ModulePathWithEditor) + TEXT(".wasm")), LinkCategory);

            v8::Isolate* Isolate = GlobalObject->GetIsolate();
            v8::Local<v8::Object> ModuleJsObject = v8::Object::New(Isolate);
            (void) GlobalObject->Set(Isolate->GetCurrentContext(), FV8Utils::ToV8String(Isolate, GlobalNameInTs), ModuleJsObject);
            InitWasmModuleToJsObject(ModuleJsObject, TargetModule, RootPath, ModulePath, Target);
        }
    }

    // TargetRuntime->WasmMalloc(8);
}

}    // namespace puerts
