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
#include <mutex>

static TMap<FName, TMap<FName, TMap<FName, FString>>> ParamDefaultMetas;

static TMap<FName, TMap<FName, FString>>* PC = nullptr;
static TMap<FName, FString>* PF = nullptr;

PRAGMA_DISABLE_OPTIMIZATION
static void ParamDefaultMetasInit()
{
    // PC = &ParamDefaultMetas.Add(TEXT("MainObject"));
    // PF = &PC->Add(TEXT("DefaultTest"));
    // PF->Add(TEXT("Str"), TEXT("i am default"));
    // PF->Add(TEXT("I"), TEXT("10"));
    // PF->Add(TEXT("Vec"), TEXT("1.100000,2.200000,3.300000"));
#include "InitParamDefaultMetas.inl"
    return;
}
PRAGMA_ENABLE_OPTIMIZATION

std::once_flag ParamDefaultMetasInitFlag;

TMap<FName, FString>* GetParamDefaultMetaFor(UFunction* InFunction)
{
    std::call_once(ParamDefaultMetasInitFlag, ParamDefaultMetasInit);
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

    SkipWorldContextInArg0 = false;
    for (TFieldIterator<PropertyMacro> It(InFunction); It && (It->PropertyFlags & CPF_Parm); ++It)
    {
        PropertyMacro* Property = *It;
        static const FName WorldContextPinName(TEXT("__WorldContext"));
        if (IsStatic && !InFunction->IsNative() && Property->GetFName() == WorldContextPinName && Arguments.size() == 0)
        {
            SkipWorldContextInArg0 = true;
            ;
        }
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

#if ENGINE_MINOR_VERSION > 0 && ENGINE_MAJOR_VERSION > 4
                            Property->ImportText_Direct(**DefaultValuePtr, PropValuePtr, nullptr, PPF_None);
#else
                            Property->ImportText(**DefaultValuePtr, PropValuePtr, PPF_None, nullptr);
#endif
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

    auto CallFunctionPtr = CallFunction.Get();
    if ((Function->FunctionFlags & FUNC_Native) && !(Function->FunctionFlags & FUNC_Net) &&
        !CallFunctionPtr->HasAnyFunctionFlags(FUNC_UbergraphFunction))
    {
        FastCall(Isolate, Context, Info, CallObject, CallFunctionPtr, Params);
    }
    else
    {
        SlowCall(Isolate, Context, Info, CallObject, CallFunctionPtr, Params);
    }
}

void FFunctionTranslator::SlowCall(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
    const v8::FunctionCallbackInfo<v8::Value>& Info, UObject* CallObject, UFunction* CallFunction, void* Params)
{
    if (Params)
    {
        FMemory::Memzero(Params, ParamsBufferSize);
    }

    if (!Call_ProcessParams(Isolate, Context, Info, Params, 0))
    {
        return;
    }

    CallObject->UObject::ProcessEvent(CallFunction, Params);

    Call_ProcessReturnAndOutParams(Isolate, Context, Info, Params, 0);
}

void FFunctionTranslator::FastCall(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
    const v8::FunctionCallbackInfo<v8::Value>& Info, UObject* CallObject, UFunction* CallFunction, void* Params)
{
    if (Params)
    {
        FMemory::Memzero(Params, ParamsBufferSize);
        if (Return)
        {
            Return->Property->InitializeValue_InContainer(Params);
        }
    }
    FFrame NewStack(CallObject, CallFunction, Params, nullptr,
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        Function->ChildProperties
#else
        Function->Children
#endif
    );

    checkSlow(NewStack.Locals || Function->ParmsSize == 0);
    FOutParmRec** LastOut = &NewStack.OutParms;
    int Index = 0;
    for (TFieldIterator<PropertyMacro> It(CallFunction); It && (It->PropertyFlags & CPF_Parm); ++It)
    {
        PropertyMacro* Property = *It;
        FOutParmRec* Out = nullptr;
        if (Property->HasAnyPropertyFlags(CPF_OutParm))
        {
            CA_SUPPRESS(6263)
            Out = (FOutParmRec*) FMemory_Alloca(sizeof(FOutParmRec));
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

        if (Property->HasAnyPropertyFlags(CPF_ReturnParm))
        {
            if (Property->HasAnyPropertyFlags(CPF_OutParm))
            {
                Out->PropAddr = Property->ContainerPtrToValuePtr<uint8>(Params);
            }
            continue;
        }

        if (UNLIKELY(ArgumentDefaultValues && Info[Index]->IsUndefined()))
        {
            Property->CopyCompleteValue_InContainer(Params, ArgumentDefaultValues);
            if (Property->HasAnyPropertyFlags(CPF_OutParm))
            {
                Out->PropAddr = Property->ContainerPtrToValuePtr<uint8>(Params);
            }
        }
        else
        {
            Property->InitializeValue_InContainer(Params);
            if (Property->HasAnyPropertyFlags(CPF_OutParm))
            {
                if (!Arguments[Index]->JsToUEFastInContainer(
                        Isolate, Context, Info[Index], Params, reinterpret_cast<void**>(&(Out->PropAddr))))
                {
                    return;
                }
            }
            else
            {
                if (!Arguments[Index]->JsToUEInContainer(Isolate, Context, Info[Index], Params, false))
                {
                    return;
                }
            }
        }
        ++Index;
    }
    if (CallFunction->HasAnyFunctionFlags(FUNC_HasOutParms))
    {
        if (*LastOut)
        {
            (*LastOut)->NextOutParm = NULL;
        }
    }

    const bool bHasReturnParam = CallFunction->ReturnValueOffset != MAX_uint16;
    uint8* ReturnValueAddress = bHasReturnParam ? ((uint8*) Params + CallFunction->ReturnValueOffset) : nullptr;
    CallFunction->Invoke(CallObject, NewStack, ReturnValueAddress);

    if (Return)
    {
        Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
        Return->Property->DestroyValue_InContainer(Params);
    }

    LastOut = &NewStack.OutParms;
    for (int i = 0; i < Arguments.size(); ++i)
    {
        auto PropertyFlags = Arguments[i]->Property->PropertyFlags;
        if (PropertyFlags & CPF_OutParm)
        {
            if ((PropertyFlags & CPF_Parm) && (!(PropertyFlags & CPF_ConstParm)) && (!(PropertyFlags & CPF_ReturnParm)))
            {
                if ((*LastOut)->PropAddr >= (uint8*) Params && (*LastOut)->PropAddr < ((uint8*) Params + ParamsBufferSize))
                {
                    Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i], Params, false);
                }
                else
                {
                    LastOut = &(*LastOut)->NextOutParm;
                    continue;
                }
            }
            LastOut = &(*LastOut)->NextOutParm;
        }
        if (Arguments[i]->ParamShallowCopySize == 0)
        {
            Arguments[i]->Property->DestroyValue_InContainer(Params);
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
        FMemory::Memzero(Params, ParamsBufferSize);

    Call_ProcessParams(Isolate, Context, Info, Params, 0);

    OnCall(Params);

    Call_ProcessReturnAndOutParams(Isolate, Context, Info, Params, 0);
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

    v8::MaybeLocal<v8::Value> Result;
    if (UNLIKELY(SkipWorldContextInArg0))
    {
        Result = JsFunction->Call(Context, This, Arguments.size() - 1, &Args[0] + 1);
    }
    else
    {
        Result = JsFunction->Call(Context, This, Arguments.size(), Args);
    }

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

    FOutParmRec* NewOutParms = nullptr;

    if (Stack.Node != Stack.CurrentNativeFunction)
    {
#if defined(USE_GLOBAL_PARAMS_BUFFER)
        void* Params = Buffer;
#else
        Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

        if (Params)
        {
            FMemory::Memzero(Params, ParamsBufferSize);
            FOutParmRec** LastOut = &NewOutParms;

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

    v8::MaybeLocal<v8::Value> Result;
    if (UNLIKELY(SkipWorldContextInArg0))
    {
        Result = JsFunction->Call(Context, This, Arguments.size() - 1, &Args[0] + 1);
    }
    else
    {
        Result = JsFunction->Call(Context, This, Arguments.size(), Args);
    }

    if (!Result.IsEmpty())    // empty mean exception
    {
        if (Return)
        {
            Return->JsToUE(Isolate, Context, Result.ToLocalChecked(), RESULT_PARAM, true);
        }

        auto OutParms = NewOutParms ? NewOutParms : Stack.OutParms;

        for (int i = 0; i < Arguments.size(); ++i)
        {
            if (Arguments[i]->IsOut())
            {
                auto OutParmRec = GetMatchOutParmRec(OutParms, Arguments[i]->Property);
                if (OutParmRec)
                {
                    Arguments[i]->JsToUEOut(Isolate, Context, Args[i], OutParmRec->PropAddr, true);
                }
            }
        }
    }

    if (Params && Params != Stack.Locals)
    {
        // destruct properties on the stack, except for out params since we know we didn't use that memory
        for (PropertyMacro* Destruct = Function->DestructorLink; Destruct; Destruct = Destruct->DestructorLinkNext)
        {
            if (!Destruct->HasAnyPropertyFlags(CPF_OutParm))
            {
                Destruct->DestroyValue_InContainer(Params);
            }
        }
    }
}

bool FFunctionTranslator::IsValid() const
{
    return Function.IsValid();
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
