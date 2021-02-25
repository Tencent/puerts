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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 262, column 7>
// unsupported method : DebugEqualMatrix bool (const FMatrix &) __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 275, column 26>
// unsupported method : operator= FTransform &(const FTransform &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 285, column 22>
// unsupported method : ToMatrixWithScale FMatrix () __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 336, column 22>
// unsupported method : ToInverseMatrixWithScale FMatrix () __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 361, column 22>
// unsupported method : ToMatrixNoScale FMatrix () __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 489, column 26>
// unsupported method : operator+= FTransform &(const FTransform &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 503, column 26>
// unsupported method : operator*= FTransform &(const ScalarRegister &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 513, column 21>
// unsupported method : operator*= void (const FTransform &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/TransformVectorized.h', line 515, column 21>
// unsupported method : operator*= void (const FQuat &) __attribute__((thiscall))


static void* _FTransformNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FTransform* Obj = new FTransform();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            FTransform* Obj = new FTransform(*Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            FTransform* Obj = new FTransform(*Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            FTransform* Obj = new FTransform(*Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[1]->ToObject(Context).ToLocalChecked());
            const FVector* Arg2 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[2]->ToObject(Context).ToLocalChecked());
            FTransform* Obj = new FTransform(*Arg0, *Arg1, *Arg2);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[1]->ToObject(Context).ToLocalChecked());
            const FVector* Arg2 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[2]->ToObject(Context).ToLocalChecked());
            FTransform* Obj = new FTransform(*Arg0, *Arg1, *Arg2);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            ENoInit Arg0 = ENoInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FTransform* Obj = new FTransform(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 4)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
             && 
            Info[3]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[3]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[1]->ToObject(Context).ToLocalChecked());
            const FVector* Arg2 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[2]->ToObject(Context).ToLocalChecked());
            const FVector* Arg3 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[3]->ToObject(Context).ToLocalChecked());
            FTransform* Obj = new FTransform(*Arg0, *Arg1, *Arg2, *Arg3);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FTransformNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FTransformM_DiagnosticCheckNaN_Translate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_DiagnosticCheckNaN_Translate] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN_Translate();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_DiagnosticCheckNaN_Rotate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_DiagnosticCheckNaN_Rotate] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN_Rotate();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_DiagnosticCheckNaN_Scale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_DiagnosticCheckNaN_Scale3D] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN_Scale3D();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_DiagnosticCheckNaN_All(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_DiagnosticCheckNaN_All] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN_All();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_DiagnosticCheck_IsValid(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_DiagnosticCheck_IsValid] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheck_IsValid();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_DebugPrint(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_DebugPrint] Attempt to access a NULL self pointer");
                return;
            }
            Self->DebugPrint();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_ToHumanReadableString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_ToHumanReadableString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToHumanReadableString();
            auto V8Result = v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_ToString] Attempt to access a NULL self pointer");
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

static void FTransformM_InitFromString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsString())
        {
            
            const FString Arg0 = UTF8_TO_TCHAR(*(v8::String::Utf8Value(Isolate, Info[0])));
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_InitFromString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InitFromString(Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Inverse(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Inverse] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Inverse();
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Blend(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform* Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Blend] Attempt to access a NULL self pointer");
                return;
            }
            Self->Blend(*Arg0, *Arg1, Arg2);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_BlendWith(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_BlendWith] Attempt to access a NULL self pointer");
                return;
            }
            Self->BlendWith(*Arg0, Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(*Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(*Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_AnyHasNegativeScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FTransform::AnyHasNegativeScale(*Arg0, *Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_ScaleTranslation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_ScaleTranslation] Attempt to access a NULL self pointer");
                return;
            }
            Self->ScaleTranslation(*Arg0);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            const float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_ScaleTranslation] Attempt to access a NULL self pointer");
                return;
            }
            Self->ScaleTranslation(Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_RemoveScaling(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_RemoveScaling] Attempt to access a NULL self pointer");
                return;
            }
            Self->RemoveScaling(Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetMaximumAxisScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetMaximumAxisScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMaximumAxisScale();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetMinimumAxisScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetMinimumAxisScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMinimumAxisScale();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetRelativeTransform(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetRelativeTransform] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetRelativeTransform(*Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetRelativeTransformReverse(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetRelativeTransformReverse] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetRelativeTransformReverse(*Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetToRelativeTransform(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetToRelativeTransform] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetToRelativeTransform(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformFVector4(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector4* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector4>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformFVector4] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformFVector4(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformFVector4NoScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector4* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector4>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformFVector4NoScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformFVector4NoScale(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformPosition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformPosition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformPosition(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformPositionNoScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformPositionNoScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformPositionNoScale(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_InverseTransformPosition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_InverseTransformPosition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InverseTransformPosition(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_InverseTransformPositionNoScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_InverseTransformPositionNoScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InverseTransformPositionNoScale(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformVector(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformVectorNoScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformVectorNoScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformVectorNoScale(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_InverseTransformVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_InverseTransformVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InverseTransformVector(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_InverseTransformVectorNoScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_InverseTransformVectorNoScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InverseTransformVectorNoScale(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TransformRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TransformRotation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TransformRotation(*Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_InverseTransformRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_InverseTransformRotation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InverseTransformRotation(*Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetScaled(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetScaled] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetScaled(Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetScaled] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetScaled(*Arg0);
            void* Ptr = new FTransform(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FTransform>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetScaledAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EAxis::Type Arg0 = EAxis::Type(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetScaledAxis] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetScaledAxis(Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetUnitAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EAxis::Type Arg0 = EAxis::Type(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetUnitAxis] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetUnitAxis(Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Mirror(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsNumber() && 
            Info[1]->IsNumber())
        {
            
            EAxis::Type Arg0 = EAxis::Type(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            EAxis::Type Arg1 = EAxis::Type(Info[1]->ToInt32(Context).ToLocalChecked()->Value());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Mirror] Attempt to access a NULL self pointer");
                return;
            }
            Self->Mirror(Arg0, Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_GetSafeScaleReciprocal(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FTransform::GetSafeScaleReciprocal(*Arg0, Arg1);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetLocation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetLocation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetLocation();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Rotator(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Rotator] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Rotator();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetDeterminant(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetDeterminant] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetDeterminant();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetLocation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetLocation] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetLocation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_ContainsNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_ContainsNaN] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ContainsNaN();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_IsValid(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_IsValid] Attempt to access a NULL self pointer");
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

static void FTransformS_AreRotationsEqual(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform* Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FTransform::AreRotationsEqual(*Arg0, *Arg1, Arg2);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_AreTranslationsEqual(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform* Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FTransform::AreTranslationsEqual(*Arg0, *Arg1, Arg2);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_AreScale3DsEqual(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform* Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FTransform::AreScale3DsEqual(*Arg0, *Arg1, Arg2);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_RotationEquals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_RotationEquals] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->RotationEquals(*Arg0, Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_TranslationEquals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_TranslationEquals] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->TranslationEquals(*Arg0, Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Scale3DEquals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Scale3DEquals] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Scale3DEquals(*Arg0, Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Equals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Equals] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Equals(*Arg0, Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_EqualsNoScale(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_EqualsNoScale] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->EqualsNoScale(*Arg0, Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
                
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
                 && 
            Info[1]->IsObject() &&
                
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
                 && 
            Info[2]->IsObject() &&
                
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
                )
        {
            
            FTransform * Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform * Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            const FTransform * Arg2 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[2]->ToObject(Context).ToLocalChecked());
            FTransform::Multiply(Arg0, Arg1, Arg2);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetComponents(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[1]->ToObject(Context).ToLocalChecked());
            const FVector* Arg2 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[2]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetComponents] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetComponents(*Arg0, *Arg1, *Arg2);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetIdentity(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetIdentity] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetIdentity();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_MultiplyScale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_MultiplyScale3D] Attempt to access a NULL self pointer");
                return;
            }
            Self->MultiplyScale3D(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetTranslation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetTranslation] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetTranslation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_CopyTranslation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_CopyTranslation] Attempt to access a NULL self pointer");
                return;
            }
            Self->CopyTranslation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_ConcatenateRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_ConcatenateRotation] Attempt to access a NULL self pointer");
                return;
            }
            Self->ConcatenateRotation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_AddToTranslation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_AddToTranslation] Attempt to access a NULL self pointer");
                return;
            }
            Self->AddToTranslation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_AddTranslations(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform* Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FTransform::AddTranslations(*Arg0, *Arg1);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformS_SubtractTranslations(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            const FTransform* Arg1 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FTransform::SubtractTranslations(*Arg0, *Arg1);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetRotation] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetRotation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_CopyRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_CopyRotation] Attempt to access a NULL self pointer");
                return;
            }
            Self->CopyRotation(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetScale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetScale3D] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetScale3D(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_CopyScale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_CopyScale3D] Attempt to access a NULL self pointer");
                return;
            }
            Self->CopyScale3D(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_SetTranslationAndScale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            const FVector* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[1]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_SetTranslationAndScale3D] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetTranslationAndScale3D(*Arg0, *Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_Accumulate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_Accumulate] Attempt to access a NULL self pointer");
                return;
            }
            Self->Accumulate(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_NormalizeRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_NormalizeRotation] Attempt to access a NULL self pointer");
                return;
            }
            Self->NormalizeRotation();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_IsRotationNormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_IsRotationNormalized] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsRotationNormalized();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetRotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetRotation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetRotation();
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetTranslation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetTranslation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetTranslation();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_GetScale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_GetScale3D] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetScale3D();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_CopyRotationPart(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_CopyRotationPart] Attempt to access a NULL self pointer");
                return;
            }
            Self->CopyRotationPart(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FTransformM_CopyTranslationAndScale3D(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FTransform>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FTransform* Arg0 = puerts::DataTransfer::GetPoninterFast<FTransform>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FTransform>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FTransform::M_CopyTranslationAndScale3D] Attempt to access a NULL self pointer");
                return;
            }
            Self->CopyTranslationAndScale3D(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}


struct AutoRegisterForFTransform
{
    AutoRegisterForFTransform()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"DiagnosticCheckNaN_Translate", FTransformM_DiagnosticCheckNaN_Translate},
            {"DiagnosticCheckNaN_Rotate", FTransformM_DiagnosticCheckNaN_Rotate},
            {"DiagnosticCheckNaN_Scale3D", FTransformM_DiagnosticCheckNaN_Scale3D},
            {"DiagnosticCheckNaN_All", FTransformM_DiagnosticCheckNaN_All},
            {"DiagnosticCheck_IsValid", FTransformM_DiagnosticCheck_IsValid},
            {"DebugPrint", FTransformM_DebugPrint},
            {"ToHumanReadableString", FTransformM_ToHumanReadableString},
            {"ToString", FTransformM_ToString},
            {"InitFromString", FTransformM_InitFromString},
            {"Inverse", FTransformM_Inverse},
            {"Blend", FTransformM_Blend},
            {"BlendWith", FTransformM_BlendWith},
            {"op_Addition", FTransformM_op_Addition},
            {"op_Multiply", FTransformM_op_Multiply},
            {"ScaleTranslation", FTransformM_ScaleTranslation},
            {"RemoveScaling", FTransformM_RemoveScaling},
            {"GetMaximumAxisScale", FTransformM_GetMaximumAxisScale},
            {"GetMinimumAxisScale", FTransformM_GetMinimumAxisScale},
            {"GetRelativeTransform", FTransformM_GetRelativeTransform},
            {"GetRelativeTransformReverse", FTransformM_GetRelativeTransformReverse},
            {"SetToRelativeTransform", FTransformM_SetToRelativeTransform},
            {"TransformFVector4", FTransformM_TransformFVector4},
            {"TransformFVector4NoScale", FTransformM_TransformFVector4NoScale},
            {"TransformPosition", FTransformM_TransformPosition},
            {"TransformPositionNoScale", FTransformM_TransformPositionNoScale},
            {"InverseTransformPosition", FTransformM_InverseTransformPosition},
            {"InverseTransformPositionNoScale", FTransformM_InverseTransformPositionNoScale},
            {"TransformVector", FTransformM_TransformVector},
            {"TransformVectorNoScale", FTransformM_TransformVectorNoScale},
            {"InverseTransformVector", FTransformM_InverseTransformVector},
            {"InverseTransformVectorNoScale", FTransformM_InverseTransformVectorNoScale},
            {"TransformRotation", FTransformM_TransformRotation},
            {"InverseTransformRotation", FTransformM_InverseTransformRotation},
            {"GetScaled", FTransformM_GetScaled},
            {"GetScaledAxis", FTransformM_GetScaledAxis},
            {"GetUnitAxis", FTransformM_GetUnitAxis},
            {"Mirror", FTransformM_Mirror},
            {"GetLocation", FTransformM_GetLocation},
            {"Rotator", FTransformM_Rotator},
            {"GetDeterminant", FTransformM_GetDeterminant},
            {"SetLocation", FTransformM_SetLocation},
            {"ContainsNaN", FTransformM_ContainsNaN},
            {"IsValid", FTransformM_IsValid},
            {"RotationEquals", FTransformM_RotationEquals},
            {"TranslationEquals", FTransformM_TranslationEquals},
            {"Scale3DEquals", FTransformM_Scale3DEquals},
            {"Equals", FTransformM_Equals},
            {"EqualsNoScale", FTransformM_EqualsNoScale},
            {"SetComponents", FTransformM_SetComponents},
            {"SetIdentity", FTransformM_SetIdentity},
            {"MultiplyScale3D", FTransformM_MultiplyScale3D},
            {"SetTranslation", FTransformM_SetTranslation},
            {"CopyTranslation", FTransformM_CopyTranslation},
            {"ConcatenateRotation", FTransformM_ConcatenateRotation},
            {"AddToTranslation", FTransformM_AddToTranslation},
            {"SetRotation", FTransformM_SetRotation},
            {"CopyRotation", FTransformM_CopyRotation},
            {"SetScale3D", FTransformM_SetScale3D},
            {"CopyScale3D", FTransformM_CopyScale3D},
            {"SetTranslationAndScale3D", FTransformM_SetTranslationAndScale3D},
            {"Accumulate", FTransformM_Accumulate},
            {"NormalizeRotation", FTransformM_NormalizeRotation},
            {"IsRotationNormalized", FTransformM_IsRotationNormalized},
            {"GetRotation", FTransformM_GetRotation},
            {"GetTranslation", FTransformM_GetTranslation},
            {"GetScale3D", FTransformM_GetScale3D},
            {"CopyRotationPart", FTransformM_CopyRotationPart},
            {"CopyTranslationAndScale3D", FTransformM_CopyTranslationAndScale3D},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {"AnyHasNegativeScale", FTransformS_AnyHasNegativeScale},
            {"GetSafeScaleReciprocal", FTransformS_GetSafeScaleReciprocal},
            {"AreRotationsEqual", FTransformS_AreRotationsEqual},
            {"AreTranslationsEqual", FTransformS_AreTranslationsEqual},
            {"AreScale3DsEqual", FTransformS_AreScale3DsEqual},
            {"Multiply", FTransformS_Multiply},
            {"AddTranslations", FTransformS_AddTranslations},
            {"SubtractTranslations", FTransformS_SubtractTranslations},
            {0, 0}
        };

        Def.UStructName = "FTransform";

        Def.Initialize = _FTransformNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFTransform _AutoRegisterForFTransform_;