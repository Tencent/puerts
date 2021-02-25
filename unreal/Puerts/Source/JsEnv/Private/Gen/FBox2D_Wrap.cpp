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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Box2D.h', line 111, column 22>
// unsupported method : operator+= FBox2D &(const FVector2D &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Box2D.h', line 130, column 22>
// unsupported method : operator+= FBox2D &(const FBox2D &) __attribute__((thiscall))


static void* _FBox2DNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FBox2D* Obj = new FBox2D();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FBox2DNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FBox2D* Obj = new FBox2D(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FBox2DNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector2D* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[1]->ToObject(Context).ToLocalChecked());
            FBox2D* Obj = new FBox2D(*Arg0, *Arg1);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FBox2DNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
                
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
                 && 
            Info[1]->IsNumber())
        {
            
            const FVector2D * Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            const int32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            FBox2D* Obj = new FBox2D(Arg0, Arg1);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FBox2DNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FBox2DM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FBox2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FBox2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_op_Equality] Attempt to access a NULL self pointer");
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

static void FBox2DM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FBox2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FBox2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_op_Inequality] Attempt to access a NULL self pointer");
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

static void FBox2DM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FBox2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FBox2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FBox2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FBox2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FBox2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FBox2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_set_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_set_Item] Attempt to access a NULL self pointer");
                return;
            }
            Self->operator[](Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_ComputeSquaredDistanceToPoint(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_ComputeSquaredDistanceToPoint] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ComputeSquaredDistanceToPoint(*Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_ExpandBy(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            const float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_ExpandBy] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ExpandBy(Arg0);
            void* Ptr = new FBox2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FBox2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_GetArea(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_GetArea] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetArea();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_GetCenter(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_GetCenter] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetCenter();
            void* Ptr = new FVector2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_GetCenterAndExtents(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[0])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked())
             && Info[1]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[1])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked())
            )
        {
            
            FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked());
            FVector2D* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector2D>(puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_GetCenterAndExtents] Attempt to access a NULL self pointer");
                return;
            }
            Self->GetCenterAndExtents(*Arg0, *Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_GetClosestPointTo(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_GetClosestPointTo] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetClosestPointTo(*Arg0);
            void* Ptr = new FVector2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_GetExtent(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_GetExtent] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetExtent();
            void* Ptr = new FVector2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_GetSize(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_GetSize] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetSize();
            void* Ptr = new FVector2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_Init(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_Init] Attempt to access a NULL self pointer");
                return;
            }
            Self->Init();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_Intersect(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FBox2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FBox2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_Intersect] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Intersect(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_IsInside(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_IsInside] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsInside(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FBox2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FBox2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_IsInside] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsInside(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_ShiftBy(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector2D>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_ShiftBy] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ShiftBy(*Arg0);
            void* Ptr = new FBox2D(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FBox2D>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FBox2DM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FBox2D::M_ToString] Attempt to access a NULL self pointer");
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

static void _FBox2DMinGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.This());

    auto V8Result =
    puerts::DataTransfer::FindOrAddStruct<FVector2D>(Isolate, Context, &(Self->Min), true);
        
    Info.GetReturnValue().Set(V8Result);
}
static void _FBox2DMinSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.This());

    Self->Min =*puerts::DataTransfer::GetPoninterFast<FVector2D>(Value->ToObject(Context).ToLocalChecked());
}
static void _FBox2DMaxGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.This());

    auto V8Result =
    puerts::DataTransfer::FindOrAddStruct<FVector2D>(Isolate, Context, &(Self->Max), true);
        
    Info.GetReturnValue().Set(V8Result);
}
static void _FBox2DMaxSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.This());

    Self->Max =*puerts::DataTransfer::GetPoninterFast<FVector2D>(Value->ToObject(Context).ToLocalChecked());
}
static void _FBox2DbIsValidGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.This());

    auto V8Result =v8::Boolean::New(Isolate, Self->bIsValid);
    Info.GetReturnValue().Set(V8Result);
}
static void _FBox2DbIsValidSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FBox2D>(Info.This());

    Self->bIsValid =Value->ToBoolean(Isolate)->Value();
}

struct AutoRegisterForFBox2D
{
    AutoRegisterForFBox2D()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {"Min", _FBox2DMinGet_, _FBox2DMinSet_},
            {"Max", _FBox2DMaxGet_, _FBox2DMaxSet_},
            {"bIsValid", _FBox2DbIsValidGet_, _FBox2DbIsValidSet_},
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"op_Equality", FBox2DM_op_Equality},
            {"op_Inequality", FBox2DM_op_Inequality},
            {"op_Addition", FBox2DM_op_Addition},
            {"set_Item", FBox2DM_set_Item},
            {"ComputeSquaredDistanceToPoint", FBox2DM_ComputeSquaredDistanceToPoint},
            {"ExpandBy", FBox2DM_ExpandBy},
            {"GetArea", FBox2DM_GetArea},
            {"GetCenter", FBox2DM_GetCenter},
            {"GetCenterAndExtents", FBox2DM_GetCenterAndExtents},
            {"GetClosestPointTo", FBox2DM_GetClosestPointTo},
            {"GetExtent", FBox2DM_GetExtent},
            {"GetSize", FBox2DM_GetSize},
            {"Init", FBox2DM_Init},
            {"Intersect", FBox2DM_Intersect},
            {"IsInside", FBox2DM_IsInside},
            {"ShiftBy", FBox2DM_ShiftBy},
            {"ToString", FBox2DM_ToString},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {0, 0}
        };

        Def.UStructName = "FBox2D";

        Def.Initialize = _FBox2DNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFBox2D _AutoRegisterForFBox2D_;