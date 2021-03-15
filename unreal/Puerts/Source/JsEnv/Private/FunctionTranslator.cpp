/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "FunctionTranslator.h"
#include "V8Utils.h"

namespace puerts
{
static const int ARG_ARRAY_SIZE = 8;

#if defined(USE_GLOBAL_PARAMS_BUFFER)
//Global Buffer, Not thread safe
static void *Buffer = nullptr;
static int BufferSize = 0;


static void RequireBuffer(int RequireSize)
{
    if (RequireSize > BufferSize)
    {
        if (Buffer)  FMemory::Free(Buffer);
        Buffer = FMemory::Malloc(RequireSize, 16);
        BufferSize = RequireSize;
    }
}

class GlobalBufferAutoRelease
{
public:
    ~GlobalBufferAutoRelease()
    {
        if (Buffer)  FMemory::Free(Buffer);
        Buffer = nullptr;
        BufferSize = 0;
    }
};

static GlobalBufferAutoRelease Dummy;
#endif

FFunctionTranslator::FFunctionTranslator(UFunction *InFunction)
{
    check(InFunction);
    Function = InFunction;

    ParamsBufferSize = InFunction->PropertiesSize > InFunction->ParmsSize ? InFunction->PropertiesSize : InFunction->ParmsSize;

#if defined(USE_GLOBAL_PARAMS_BUFFER)
    RequireBuffer(ParamsBufferSize);
#endif

    UClass *OuterClass = InFunction->GetOuterUClass();
    IsInterfaceFunction = (OuterClass->HasAnyClassFlags(CLASS_Interface) && OuterClass != UInterface::StaticClass());
    BindObject = InFunction->HasAnyFunctionFlags(FUNC_Static) ? OuterClass->GetDefaultObject() : nullptr;

    for (TFieldIterator<PropertyMacro> It(InFunction); It && (It->PropertyFlags & CPF_Parm); ++It)
    {
        PropertyMacro *Property = *It;
        if (Property->HasAnyPropertyFlags(CPF_ReturnParm))
        {
            Return = FPropertyTranslator::Create(Property);
        }
        else
        {
            Arguments.push_back(FPropertyTranslator::Create(Property));
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
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FFunctionTranslator* This = reinterpret_cast<FFunctionTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->Call(Isolate, Context, Info);
}

void FFunctionTranslator::Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    UObject * CallObject = BindObject ? BindObject : FV8Utils::GetUObject(Info.Holder());
    if (!CallObject)
    {
        FV8Utils::ThrowException(Isolate, "access a null object");
        return;
    }
    if (FV8Utils::IsReleasedPtr(CallObject))
    {
        FV8Utils::ThrowException(Isolate, "access a invalid object");
        return;
    }
    UFunction *CallFunction = !IsInterfaceFunction ? 
        Function : (CallObject->GetClass()->FindFunctionByName(Function->GetFName()));
#if defined(USE_GLOBAL_PARAMS_BUFFER)
    void *Params = Buffer;
#else
    void *Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

    if (Params) CallFunction->InitializeStruct(Params);
    for (int i = 0; i < Arguments.size(); ++i)
    {
        if (!Arguments[i]->JsToUEInContainer(Isolate, Context, Info[i], Params, false))
        {
            return;
        }
    }

    CallObject->UObject::ProcessEvent(CallFunction, Params);

    if (Return)
    {
        Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
    }

    for (int i = 0; i < Arguments.size(); ++i)
    {
        Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i], Params, false);
    }

    if (Params) CallFunction->DestroyStruct(Params);
}

void FFunctionTranslator::Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info, std::function<void(void *)> OnCall)
{
#if defined(USE_GLOBAL_PARAMS_BUFFER)
    void *Params = Buffer;
#else
    void *Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

    if (Params) Function->InitializeStruct(Params);
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
    }

    for (int i = 0; i < Arguments.size(); ++i)
    {
        Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i], Params, false);
    }

    if (Params) Function->DestroyStruct(Params);
}

void FFunctionTranslator::CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction, v8::Local<v8::Value> This, void *Params)
{
    std::vector< v8::Local<v8::Value>> Args;
    for (int i = 0; i < Arguments.size(); ++i)
    {
        Args.push_back(Arguments[i]->UEToJsInContainer(Isolate, Context, Params, false));
    }
    auto Result = JsFunction->Call(Context, This, Args.size(), Args.data());

    if (!Result.IsEmpty()) // empty mean exception
    {
        if (Return)
        {
            Return->JsToUEInContainer(Isolate, Context, Result.ToLocalChecked(), Params, true);
        }

        for (int i = 0; i < Arguments.size(); ++i)
        {
            Arguments[i]->JsToUEOutInContainer(Isolate, Context, Args[i], Params, false);
        }
    }
}

static FOutParmRec* GetMatchOutParmRec(FOutParmRec *OutParam, PropertyMacro *OutProperty)
{
    FOutParmRec *Out = OutParam;
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
    v8::Local<v8::Value> This, UObject *ContextObject, FFrame &Stack, void *RESULT_PARAM)
{
    void *Params = Stack.Locals;

    if (Stack.Node != Stack.CurrentNativeFunction)
    {
#if defined(USE_GLOBAL_PARAMS_BUFFER)
        void *Params = Buffer;
#else
        Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif
            
        if (Params)
        {
            for (TFieldIterator<PropertyMacro> It(Function); It && (It->PropertyFlags & CPF_Parm) == CPF_Parm; ++It)
            {
                Stack.Step(Stack.Object, It->ContainerPtrToValuePtr<uint8>(Params));
            }
        }
    }

    if (Stack.Code)
    {
        check(Stack.PeekCode() == EX_EndFunctionParms);
        Stack.SkipCode(1);          // skip EX_EndFunctionParms
    }

    std::vector< v8::Local<v8::Value>> Args;
    for (int i = 0; i < Arguments.size(); ++i)
    {
        Args.push_back(Arguments[i]->UEToJsInContainer(Isolate, Context, Params, false));
    }
    auto Result = JsFunction->Call(Context, This, Args.size(), Args.data());

    if (!Result.IsEmpty()) // empty mean exception
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
                check(OutParmRec);
                Arguments[i]->JsToUEOut(Isolate, Context, Args[i], OutParmRec->PropAddr, false);
            }
        }
    }
}

FExtensionMethodTranslator::FExtensionMethodTranslator(UFunction *InFunction) : FFunctionTranslator(InFunction)
{
    TFieldIterator<PropertyMacro> It(InFunction);
    PropertyMacro *Property = *It;
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

    FExtensionMethodTranslator* This = reinterpret_cast<FExtensionMethodTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->CallExtension(Isolate, Context, Info);
}
    
void FExtensionMethodTranslator::CallExtension(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    UObject * CallObject = FV8Utils::GetUObject(Info.Holder());
    if (!CallObject)
    {
        FV8Utils::ThrowException(Isolate, "access a null object");
        return;
    }
    if (FV8Utils::IsReleasedPtr(CallObject))
    {
        FV8Utils::ThrowException(Isolate, "access a invalid object");
        return;
    }

#if defined(USE_GLOBAL_PARAMS_BUFFER)
    void *Params = Buffer;
#else
    void *Params = ParamsBufferSize > 0 ? FMemory_Alloca(ParamsBufferSize) : nullptr;
#endif

    if (Params) Function->InitializeStruct(Params);

    Arguments[0]->JsToUEInContainer(Isolate, Context, Info.Holder(), Params, false);

    for (int i = 1; i < Arguments.size(); ++i)
    {
        if (!Arguments[i]->JsToUEInContainer(Isolate, Context, Info[i - 1], Params, false))
        {
            return;
        }
    }

    BindObject->UObject::ProcessEvent(Function, Params);

    if (Return)
    {
        Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
    }

    for (int i = 1; i < Arguments.size(); ++i)
    {
        Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i - 1], Params, false);
    }

    //Function->HasAnyFlags()
    if (!IsUObject)// FScriptStruct, so copy back
    {
        auto StructProperty = Arguments[0]->StructProperty;
        StructProperty->CopySingleValue(FV8Utils::GetPoninter(Info.Holder()), StructProperty->ContainerPtrToValuePtr<void>(Params));
    }

    if (Params) Function->DestroyStruct(Params);

}
};
