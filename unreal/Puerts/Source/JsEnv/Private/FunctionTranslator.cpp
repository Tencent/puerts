/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "FunctionTranslator.h"
#include "V8Utils.h"
#include "Misc/DefaultValueHelper.h"

static TMap<FName, TMap<FName, TMap<FName, FString>>> ParamDefaultMetas;

static TMap<FName, TMap<FName, FString>>* PC = nullptr;
static TMap<FName, FString>* PF = nullptr;

PRAGMA_DISABLE_OPTIMIZATION
static int ParamDefaultMetasInit()
{
    // PC = &ParamDefaultMetas.Add(TEXT("MainObject"));
    // PF = &PC->Add(TEXT("DefaultTest"));
    // PF->Add(TEXT("Str"), TEXT("i am default"));
    // PF->Add(TEXT("I"), TEXT("10"));
    // PF->Add(TEXT("Vec"), TEXT("1.100000,2.200000,3.300000"));
#include "InitParamDefaultMetas.inl"
    return 0;
}
PRAGMA_ENABLE_OPTIMIZATION

int gDummy_ParamDefaultMetasInit_Ret = ParamDefaultMetasInit();

TMap<FName, FString>* GetParamDefaultMetaFor(UFunction* InFunction)
{
    UClass* OuterClass = InFunction->GetOuterUClass();
    auto ClassParamDefaultMeta = ParamDefaultMetas.Find(OuterClass->GetFName());
    if (ClassParamDefaultMeta)
    {
        return ClassParamDefaultMeta->Find(InFunction->GetFName());
    }
    return nullptr;
}

namespace puerts
{
static const int ARG_ARRAY_SIZE = 8;

#if defined(USE_GLOBAL_PARAMS_BUFFER)
// Global Buffer, Not thread safe
static void* Buffer = nullptr;
static int BufferSize = 0;

static void RequireBuffer(int RequireSize)
{
    if (RequireSize > BufferSize)
    {
        if (Buffer)
            FMemory::Free(Buffer);
        Buffer = FMemory::Malloc(RequireSize, 16);
        BufferSize = RequireSize;
    }
}

class GlobalBufferAutoRelease
{
public:
    ~GlobalBufferAutoRelease()
    {
        if (Buffer)
            FMemory::Free(Buffer);
        Buffer = nullptr;
        BufferSize = 0;
    }
};

static GlobalBufferAutoRelease Dummy;
#endif

FFunctionTranslator::FFunctionTranslator(UFunction* InFunction, bool IsDelegate)
{
    Init(InFunction, IsDelegate);
}
void FFunctionTranslator::Init(UFunction* InFunction, bool IsDelegate)
{
    check(InFunction);
    Function = InFunction;
#if WITH_EDITOR
    FunctionName = Function->GetFName();
#endif
    ParamsBufferSize = InFunction->PropertiesSize > InFunction->ParmsSize ? InFunction->PropertiesSize : InFunction->ParmsSize;

#if defined(USE_GLOBAL_PARAMS_BUFFER)
    RequireBuffer(ParamsBufferSize);
#endif

    if (IsDelegate)
    {
        IsInterfaceFunction = false;
        IsStatic = false;
    }
    else
    {
        UClass* OuterClass = InFunction->GetOuterUClass();
        IsInterfaceFunction = (OuterClass->HasAnyClassFlags(CLASS_Interface) && OuterClass != UInterface::StaticClass());
        IsStatic = InFunction->HasAnyFunctionFlags(FUNC_Static);
    }
    Arguments.clear();
    for (TFieldIterator<PropertyMacro> It(InFunction); It && (It->PropertyFlags & CPF_Parm); ++It)
    {
        PropertyMacro* Property = *It;
        if (Property->HasAnyPropertyFlags(CPF_ReturnParm))
        {
            Return = FPropertyTranslator::Create(Property);
        }
        else
        {
            Arguments.push_back(FPropertyTranslator::Create(Property));
        }
    }

    ArgumentDefaultValues = nullptr;

    if (!IsDelegate)
    {
        TMap<FName, FString>* MetaMap = GetParamDefaultMetaFor(InFunction);
        if (MetaMap)
        {
            for (TFieldIterator<PropertyMacro> ParamIt(InFunction); ParamIt; ++ParamIt)
            {
                auto Property = *ParamIt;
                if (Property->PropertyFlags & CPF_Parm)
                {
                    if (!(Property->PropertyFlags & CPF_ReturnParm))
                    {
                        // const FName MetadataCppDefaultValueKey(*(FString(TEXT("CPP_Default_")) + Property->GetName()));
                        FString* DefaultValuePtr = nullptr;
                        DefaultValuePtr = MetaMap->Find(Property->GetFName());
                        if (DefaultValuePtr && !DefaultValuePtr->IsEmpty())
                        {
                            // UE_LOG(LogTemp, Warning, TEXT("Meta %s %s"), *Property->GetFName().ToString(), **DefaultValuePtr);
                            if (!ArgumentDefaultValues)
                            {
                                ArgumentDefaultValues = FMemory::Malloc(ParamsBufferSize, 16);
                                InFunction->InitializeStruct(ArgumentDefaultValues);
                            }

                            void* PropValuePtr = Property->ContainerPtrToValuePtr<void>(ArgumentDefaultValues);

                            if (const StructPropertyMacro* StructProp = CastFieldMacro<StructPropertyMacro>(Property))
                            {
                                if (StructProp->Struct == TBaseStructure<FVector>::Get())
                                {
                                    FVector* Vector = (FVector*) PropValuePtr;
                                    FDefaultValueHelper::ParseVector(**DefaultValuePtr, *Vector);
                                    continue;
                                }
                                else if (StructProp->Struct == TBaseStructure<FVector2D>::Get())
                                {
                                    FVector2D* Vector2D = (FVector2D*) PropValuePtr;
                                    FDefaultValueHelper::ParseVector2D(**DefaultValuePtr, *Vector2D);
                                    continue;
                                }
                                else if (StructProp->Struct == TBaseStructure<FRotator>::Get())
                                {
                                    FRotator* Rotator = (FRotator*) PropValuePtr;
                                    FDefaultValueHelper::ParseRotator(**DefaultValuePtr, *Rotator);
                                    continue;
                                }
                                else if (StructProp->Struct == TBaseStructure<FColor>::Get())
                                {
                                    FColor* Color = (FColor*) PropValuePtr;
                                    FDefaultValueHelper::ParseColor(**DefaultValuePtr, *Color);
                                    continue;
                                }
                                else if (StructProp->Struct == TBaseStructure<FLinearColor>::Get())
                                {
                                    FLinearColor* LinearColor = (FLinearColor*) PropValuePtr;
                                    LinearColor->InitFromString(**DefaultValuePtr);
                                    continue;
                                }
                            }

                            Property->ImportText(**DefaultValuePtr, PropValuePtr, PPF_None, nullptr);
                        }
                    }
                }
            }
        }
    }
}

v8::Local<v8::FunctionTemplate> FFunctionTranslator::ToFunctionTemplate(v8::Isolate* Isolate)
{
    v8::EscapableHandleScope HandleScope(Isolate);
    return HandleScope.Escape(v8::FunctionTemplate::New(Isolate, Call, v8::External::New(Isolate, this)));
}

void FFunctionTranslator::Call(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    FFunctionTranslator* This = static_cast<FFunctionTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->Call(Isolate, Context, Info);
}

void FFunctionTranslator::Call(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    UObject* CallObject = IsStatic ? BindObject.Get() : FV8Utils::GetUObject(Info.Holder());
    if (!CallObject)
    {
        if (IsStatic)    //延时初始化
        {
            CallObject = Function->GetOuterUClass()->GetDefaultObject();
            BindObject = CallObject;
        }
        if (!CallObject)
        {
            FV8Utils::ThrowException(Isolate, "access a null object");
            return;
        }
    }
    if (FV8Utils::IsReleasedPtr(CallObject))
    {
        FV8Utils::ThrowException(Isolate, "access a invalid object");
        return;
    }
    TWeakObjectPtr<UFunction> CallFunction =
        !IsInterfaceFunction ? Function : (CallObject->GetClass()->FindFunctionByName(Function->GetFName()));
#if defined(USE_GLOBAL_PARAMS_BUFFER)
    void* Params = Buffer;
#else
    void* Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif
#if WITH_EDITOR
    if (!CallFunction.IsValid())
    {
        CallFunction = CallObject->GetClass()->FindFunctionByName(FunctionName);
        Init(CallFunction.Get(), false);
    }
#endif
    if (Params)
        CallFunction->InitializeStruct(Params);
    for (int i = 0; i < Arguments.size(); ++i)
    {
        if (UNLIKELY(ArgumentDefaultValues && Info[i]->IsUndefined()))
        {
            Arguments[i]->Property->CopyCompleteValue_InContainer(Params, ArgumentDefaultValues);
        }
        else if (!Arguments[i]->JsToUEInContainer(Isolate, Context, Info[i], Params, false))
        {
            return;
        }
    }

    CallObject->UObject::ProcessEvent(CallFunction.Get(), Params);

    if (Return)
    {
        Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
        Return->Property->DestroyValue_InContainer(Params);
    }

    for (int i = 0; i < Arguments.size(); ++i)
    {
        Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i], Params, false);
    }

    if (Params)
    {
        for (int i = 0; i < Arguments.size(); ++i)
        {
            if (Arguments[i]->ParamShallowCopySize == 0)
            {
                Arguments[i]->Property->DestroyValue_InContainer(Params);
            }
        }
    }
}

void FFunctionTranslator::Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
    const v8::FunctionCallbackInfo<v8::Value>& Info, std::function<void(void*)> OnCall)
{
#if defined(USE_GLOBAL_PARAMS_BUFFER)
    void* Params = Buffer;
#else
    void* Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

    if (Params)
        Function->InitializeStruct(Params);
    for (int i = 0; i < Arguments.size(); ++i)
    {
        if (!Arguments[i]->JsToUEInContainer(Isolate, Context, Info[i], Params, false))
        {
            return;
        }
    }

    OnCall(Params);

    if (Return)
    {
        Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
        Return->Property->DestroyValue_InContainer(Params);
    }

    for (int i = 0; i < Arguments.size(); ++i)
    {
        Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i], Params, false);
    }

    if (Params)
    {
        for (int i = 0; i < Arguments.size(); ++i)
        {
            if (Arguments[i]->ParamShallowCopySize == 0)
            {
                Arguments[i]->Property->DestroyValue_InContainer(Params);
            }
        }
    }
}

void FFunctionTranslator::CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction,
    v8::Local<v8::Value> This, void* Params)
{
    v8::Local<v8::Value>* Args =
        static_cast<v8::Local<v8::Value>*>(FMemory_Alloca(sizeof(v8::Local<v8::Value>) * Arguments.size()));
    FMemory::Memset(Args, 0, sizeof(v8::Local<v8::Value>) * Arguments.size());
    for (int i = 0; i < Arguments.size(); ++i)
    {
        Args[i] = Arguments[i]->UEToJsInContainer(Isolate, Context, Params, false);
    }
    auto Result = JsFunction->Call(Context, This, Arguments.size(), Args);

    if (!Result.IsEmpty())    // empty mean exception
    {
        if (Return)
        {
            Return->JsToUEInContainer(Isolate, Context, Result.ToLocalChecked(), Params, true);
        }

        for (int i = 0; i < Arguments.size(); ++i)
        {
            Arguments[i]->JsToUEOutInContainer(Isolate, Context, Args[i], Params, true);
        }
    }
}

static FOutParmRec* GetMatchOutParmRec(FOutParmRec* OutParam, PropertyMacro* OutProperty)
{
    FOutParmRec* Out = OutParam;
    while (Out)
    {
        if (Out->Property == OutProperty)
        {
            return Out;
        }
        Out = Out->NextOutParm;
    }
    return nullptr;
}

void FFunctionTranslator::CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction,
    v8::Local<v8::Value> This, UObject* ContextObject, FFrame& Stack, void* RESULT_PARAM)
{
    void* Params = Stack.Locals;

    auto OldOutParms = Stack.OutParms;

    if (Stack.Node != Stack.CurrentNativeFunction)
    {
#if defined(USE_GLOBAL_PARAMS_BUFFER)
        void* Params = Buffer;
#else
        Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

        if (Params)
        {
            FOutParmRec** LastOut = nullptr;
            if (!Stack.OutParms)
                LastOut = &Stack.OutParms;
            // ScriptCore.cpp
            for (PropertyMacro* Property = (PropertyMacro*) (
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
                     Function->ChildProperties
#else
                     Function->Children
#endif
                 );
                 *Stack.Code != EX_EndFunctionParms; Property = (PropertyMacro*) (Property->Next))
            {
                checkfSlow(Property, TEXT("NULL Property in Function %s"), *Function->GetPathName());

                Property->InitializeValue_InContainer(Params);

                if ((Property->PropertyFlags & CPF_ReturnParm) != 0)
                {
                    continue;
                }
                Stack.MostRecentPropertyAddress = nullptr;

                if (Property->PropertyFlags & CPF_OutParm)
                {
                    Stack.Step(Stack.Object, Property->ContainerPtrToValuePtr<uint8>(Params));

                    if (LastOut)
                    {
                        CA_SUPPRESS(6263)
                        FOutParmRec* Out = (FOutParmRec*) FMemory_Alloca(sizeof(FOutParmRec));
                        ensure(Stack.MostRecentPropertyAddress);
                        Out->PropAddr = (Stack.MostRecentPropertyAddress != NULL) ? Stack.MostRecentPropertyAddress
                                                                                  : Property->ContainerPtrToValuePtr<uint8>(Params);
                        Out->Property = Property;

                        if (*LastOut)
                        {
                            (*LastOut)->NextOutParm = Out;
                            LastOut = &(*LastOut)->NextOutParm;
                        }
                        else
                        {
                            *LastOut = Out;
                        }
                    }
                }
                else
                {
                    Stack.Step(Stack.Object, Property->ContainerPtrToValuePtr<uint8>(Params));
                }
            }
        }
        if (Stack.Code)
        {
            check(Stack.PeekCode() == EX_EndFunctionParms);
            Stack.SkipCode(1);    // skip EX_EndFunctionParms
        }
    }

    v8::Local<v8::Value>* Args =
        static_cast<v8::Local<v8::Value>*>(FMemory_Alloca(sizeof(v8::Local<v8::Value>) * Arguments.size()));
    FMemory::Memset(Args, 0, sizeof(v8::Local<v8::Value>) * Arguments.size());
    for (int i = 0; i < Arguments.size(); ++i)
    {
        Args[i] = Arguments[i]->UEToJsInContainer(Isolate, Context, Params, false);
    }
    auto Result = JsFunction->Call(Context, This, Arguments.size(), Args);

    if (!Result.IsEmpty())    // empty mean exception
    {
        if (Return)
        {
            Return->JsToUE(Isolate, Context, Result.ToLocalChecked(), RESULT_PARAM, true);
        }

        for (int i = 0; i < Arguments.size(); ++i)
        {
            if (Arguments[i]->IsOut())
            {
                auto OutParmRec = GetMatchOutParmRec(Stack.OutParms, Arguments[i]->Property);
                if (OutParmRec)
                {
                    Arguments[i]->JsToUEOut(Isolate, Context, Args[i], OutParmRec->PropAddr, true);
                }
            }
        }
    }
    Stack.OutParms = OldOutParms;
}

FExtensionMethodTranslator::FExtensionMethodTranslator(UFunction* InFunction) : FFunctionTranslator(InFunction, false)
{
    TFieldIterator<PropertyMacro> It(InFunction);
    PropertyMacro* Property = *It;
    IsUObject = Property->IsA<ObjectPropertyBaseMacro>();
    Arguments[0] = FPropertyTranslator::Create(Property, true);
}

v8::Local<v8::FunctionTemplate> FExtensionMethodTranslator::ToFunctionTemplate(v8::Isolate* Isolate)
{
    v8::EscapableHandleScope HandleScope(Isolate);
    return HandleScope.Escape(v8::FunctionTemplate::New(Isolate, CallExtension, v8::External::New(Isolate, this)));
}

void FExtensionMethodTranslator::CallExtension(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FExtensionMethodTranslator* This =
        reinterpret_cast<FExtensionMethodTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->CallExtension(Isolate, Context, Info);
}

void FExtensionMethodTranslator::CallExtension(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
#if defined(USE_GLOBAL_PARAMS_BUFFER)
    void* Params = Buffer;
#else
    void* Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

    if (Params)
        Function->InitializeStruct(Params);

    if (!Arguments[0]->JsToUEInContainer(Isolate, Context, Info.Holder(), Params, false))
    {
        if (Params)
        {
            for (int i = 0; i < Arguments.size(); ++i)
            {
                if (Arguments[i]->ParamShallowCopySize == 0)
                {
                    Arguments[i]->Property->DestroyValue_InContainer(Params);
                }
            }
        }
        FV8Utils::ThrowException(Isolate, "access a invalid object");
        return;
    }

    for (int i = 1; i < Arguments.size(); ++i)
    {
        if (UNLIKELY(ArgumentDefaultValues && Info[i - 1]->IsUndefined()))
        {
            Arguments[i]->Property->CopyCompleteValue_InContainer(Params, ArgumentDefaultValues);
        }
        else if (!Arguments[i]->JsToUEInContainer(Isolate, Context, Info[i - 1], Params, false))
        {
            return;
        }
    }

    if (!BindObject.IsValid())
    {
        BindObject = Function->GetOuterUClass()->GetDefaultObject();
    }

    BindObject->UObject::ProcessEvent(Function.Get(), Params);

    if (Return)
    {
        Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
        Return->Property->DestroyValue_InContainer(Params);
    }

    for (int i = 1; i < Arguments.size(); ++i)
    {
        Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i - 1], Params, false);
    }

    // Function->HasAnyFlags()
    if (!IsUObject)    // FScriptStruct, so copy back
    {
        auto StructProperty = Arguments[0]->StructProperty;
        StructProperty->CopySingleValue(FV8Utils::GetPointer(Info.Holder()), StructProperty->ContainerPtrToValuePtr<void>(Params));
    }

    if (Params)
    {
        for (int i = 0; i < Arguments.size(); ++i)
        {
            if (Arguments[i]->ParamShallowCopySize == 0)
            {
                Arguments[i]->Property->DestroyValue_InContainer(Params);
            }
        }
    }
}
};    // namespace puerts
