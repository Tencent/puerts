/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

// gen by puerts gen tools

#include "GenHeaders.h"
#include "CoreMinimal.h"
#include "DataTransfer.h"
#include "JSClassRegister.h"



static void* _FGuidNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FGuid* Obj = new FGuid();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FGuidNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 4)
    {
        if (
            Info[0]->IsNumber() && 
            Info[1]->IsNumber() && 
            Info[2]->IsNumber() && 
            Info[3]->IsNumber())
        {
            
            uint32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            uint32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            uint32 Arg2 = Info[2]->ToInteger(Context).ToLocalChecked()->Value();
            uint32 Arg3 = Info[3]->ToInteger(Context).ToLocalChecked()->Value();
            FGuid* Obj = new FGuid(Arg0, Arg1, Arg2, Arg3);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FGuidNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FGuidM_set_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FGuid::M_set_Item] Attempt to access a NULL self pointer");
                return;
            }
            Self->operator[](Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidM_get_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FGuid::M_get_Item] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator[](Arg0);
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidM_Invalidate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FGuid::M_Invalidate] Attempt to access a NULL self pointer");
                return;
            }
            Self->Invalidate();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidM_IsValid(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FGuid::M_IsValid] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsValid();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FGuid::M_ToString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToString();
            auto V8Result = v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EGuidFormats Arg0 = EGuidFormats(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FGuid::M_ToString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToString(Arg0);
            auto V8Result = v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidS_NewGuid(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto MethodResult = FGuid::NewGuid();
            void* Ptr = new FGuid(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FGuid>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidS_Parse(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsString() && Info[1]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[1])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FGuid>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FString Arg0 = UTF8_TO_TCHAR(*(v8::String::Utf8Value(Isolate, Info[0])));
            FGuid* Arg1 = puerts::DataTransfer::GetPoninterFast<FGuid>(puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked());
            auto MethodResult = FGuid::Parse(Arg0, *Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FGuidS_ParseExact(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsString() && 
            Info[1]->IsNumber() && Info[2]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[2])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FGuid>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[2])->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FString Arg0 = UTF8_TO_TCHAR(*(v8::String::Utf8Value(Isolate, Info[0])));
            EGuidFormats Arg1 = EGuidFormats(Info[1]->ToInt32(Context).ToLocalChecked()->Value());
            FGuid* Arg2 = puerts::DataTransfer::GetPoninterFast<FGuid>(puerts::DataTransfer::UnRef(Isolate, Info[2])->ToObject(Context).ToLocalChecked());
            auto MethodResult = FGuid::ParseExact(Arg0, Arg1, *Arg2);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FGuidAGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    auto V8Result =v8::Integer::New(Isolate, Self->A);
    Info.GetReturnValue().Set(V8Result);
}
static void _FGuidASet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    Self->A =Value->ToInteger(Context).ToLocalChecked()->Value();
}
static void _FGuidBGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    auto V8Result =v8::Integer::New(Isolate, Self->B);
    Info.GetReturnValue().Set(V8Result);
}
static void _FGuidBSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    Self->B =Value->ToInteger(Context).ToLocalChecked()->Value();
}
static void _FGuidCGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    auto V8Result =v8::Integer::New(Isolate, Self->C);
    Info.GetReturnValue().Set(V8Result);
}
static void _FGuidCSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    Self->C =Value->ToInteger(Context).ToLocalChecked()->Value();
}
static void _FGuidDGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    auto V8Result =v8::Integer::New(Isolate, Self->D);
    Info.GetReturnValue().Set(V8Result);
}
static void _FGuidDSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FGuid>(Info.This());

    Self->D =Value->ToInteger(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFGuid
{
    AutoRegisterForFGuid()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {"A", _FGuidAGet_, _FGuidASet_},
            {"B", _FGuidBGet_, _FGuidBSet_},
            {"C", _FGuidCGet_, _FGuidCSet_},
            {"D", _FGuidDGet_, _FGuidDSet_},
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"set_Item", FGuidM_set_Item},
            {"get_Item", FGuidM_get_Item},
            {"Invalidate", FGuidM_Invalidate},
            {"IsValid", FGuidM_IsValid},
            {"ToString", FGuidM_ToString},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {"NewGuid", FGuidS_NewGuid},
            {"Parse", FGuidS_Parse},
            {"ParseExact", FGuidS_ParseExact},
            {0, 0}
        };

        Def.UStructName = "FGuid";

        Def.Initialize = _FGuidNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFGuid _AutoRegisterForFGuid_;