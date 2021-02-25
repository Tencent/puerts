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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 60, column 15>
// unsupported method : operator() const int32 &(int32) __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 68, column 9>
// unsupported method : operator() int32 &(int32) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 92, column 13>
// unsupported method : operator*= FIntPoint &(int32) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 100, column 13>
// unsupported method : operator/= FIntPoint &(int32) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 108, column 13>
// unsupported method : operator+= FIntPoint &(const FIntPoint &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 116, column 13>
// unsupported method : operator-= FIntPoint &(const FIntPoint &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 124, column 13>
// unsupported method : operator/= FIntPoint &(const FIntPoint &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntPoint.h', line 132, column 13>
// unsupported method : operator= FIntPoint &(const FIntPoint &) __attribute__((thiscall))


static void* _FIntPointNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FIntPoint* Obj = new FIntPoint();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FIntPointNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsNumber() && 
            Info[1]->IsNumber())
        {
            
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            int32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            FIntPoint* Obj = new FIntPoint(Arg0, Arg1);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FIntPointNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FIntPoint* Obj = new FIntPoint(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FIntPointNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FIntPointM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Equality] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator==(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Inequality] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator!=(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_op_Division(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(*Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_op_Subtraction(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_op_Subtraction] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-(*Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_set_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_set_Item] Attempt to access a NULL self pointer");
                return;
            }
            Self->operator[](Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_get_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_get_Item] Attempt to access a NULL self pointer");
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

static void FIntPointM_ComponentMin(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_ComponentMin] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ComponentMin(*Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_ComponentMax(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_ComponentMax] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ComponentMax(*Arg0);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_GetMax(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_GetMax] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMax();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_GetMin(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_GetMin] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMin();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_Size(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_Size] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Size();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_SizeSquared(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_SizeSquared] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->SizeSquared();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FIntPoint::M_ToString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToString();
            auto V8Result = v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointS_DivideAndRoundUp(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            int32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            auto MethodResult = FIntPoint::DivideAndRoundUp(*Arg0, Arg1);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            FIntPoint* Arg1 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FIntPoint::DivideAndRoundUp(*Arg0, *Arg1);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointS_DivideAndRoundDown(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FIntPoint>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            FIntPoint* Arg0 = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info[0]->ToObject(Context).ToLocalChecked());
            int32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            auto MethodResult = FIntPoint::DivideAndRoundDown(*Arg0, Arg1);
            void* Ptr = new FIntPoint(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FIntPoint>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntPointS_Num(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto MethodResult = FIntPoint::Num();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FIntPointXGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.This());

    auto V8Result =v8::Integer::New(Isolate, Self->X);
    Info.GetReturnValue().Set(V8Result);
}
static void _FIntPointXSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.This());

    Self->X =Value->ToInteger(Context).ToLocalChecked()->Value();
}
static void _FIntPointYGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.This());

    auto V8Result =v8::Integer::New(Isolate, Self->Y);
    Info.GetReturnValue().Set(V8Result);
}
static void _FIntPointYSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FIntPoint>(Info.This());

    Self->Y =Value->ToInteger(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFIntPoint
{
    AutoRegisterForFIntPoint()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {"X", _FIntPointXGet_, _FIntPointXSet_},
            {"Y", _FIntPointYGet_, _FIntPointYSet_},
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"op_Equality", FIntPointM_op_Equality},
            {"op_Inequality", FIntPointM_op_Inequality},
            {"op_Multiply", FIntPointM_op_Multiply},
            {"op_Division", FIntPointM_op_Division},
            {"op_Addition", FIntPointM_op_Addition},
            {"op_Subtraction", FIntPointM_op_Subtraction},
            {"set_Item", FIntPointM_set_Item},
            {"get_Item", FIntPointM_get_Item},
            {"ComponentMin", FIntPointM_ComponentMin},
            {"ComponentMax", FIntPointM_ComponentMax},
            {"GetMax", FIntPointM_GetMax},
            {"GetMin", FIntPointM_GetMin},
            {"Size", FIntPointM_Size},
            {"SizeSquared", FIntPointM_SizeSquared},
            {"ToString", FIntPointM_ToString},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {"DivideAndRoundUp", FIntPointS_DivideAndRoundUp},
            {"DivideAndRoundDown", FIntPointS_DivideAndRoundDown},
            {"Num", FIntPointS_Num},
            {0, 0}
        };

        Def.UStructName = "FIntPoint";

        Def.Initialize = _FIntPointNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFIntPoint _AutoRegisterForFIntPoint_;