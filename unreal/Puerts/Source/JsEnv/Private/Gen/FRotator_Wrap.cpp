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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Rotator.h', line 129, column 11>
// unsupported method : operator*= FRotator (float) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Rotator.h', line 158, column 11>
// unsupported method : operator+= FRotator (const FRotator &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Rotator.h', line 166, column 11>
// unsupported method : operator-= FRotator (const FRotator &) __attribute__((thiscall))


static void* _FRotatorNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FRotator* Obj = new FRotator();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FRotatorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            FRotator* Obj = new FRotator(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FRotatorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsNumber() && 
            Info[1]->IsNumber() && 
            Info[2]->IsNumber())
        {
            
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            FRotator* Obj = new FRotator(Arg0, Arg1, Arg2);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FRotatorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FRotator* Obj = new FRotator(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FRotatorNew_:%p"), Obj);
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
            FRotator* Obj = new FRotator(*Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FRotatorNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FRotatorM_DiagnosticCheckNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_DiagnosticCheckNaN] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_op_Subtraction(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_op_Subtraction] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-(*Arg0);
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(Arg0);
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_op_Equality] Attempt to access a NULL self pointer");
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

static void FRotatorM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_op_Inequality] Attempt to access a NULL self pointer");
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

static void FRotatorM_IsNearlyZero(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_IsNearlyZero] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsNearlyZero(Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_IsZero(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_IsZero] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsZero();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_Equals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Equals] Attempt to access a NULL self pointer");
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

static void FRotatorM_Add(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsNumber() && 
            Info[1]->IsNumber() && 
            Info[2]->IsNumber())
        {
            
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Add] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Add(Arg0, Arg1, Arg2);
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetInverse(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetInverse] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetInverse();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GridSnap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GridSnap] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GridSnap(*Arg0);
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_Vector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Vector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Vector();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_Quaternion(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Quaternion] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Quaternion();
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_Euler(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Euler] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Euler();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_RotateVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_RotateVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->RotateVector(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_UnrotateVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_UnrotateVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->UnrotateVector(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_Clamp(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Clamp] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Clamp();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetNormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetNormalized] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetNormalized();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetDenormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetDenormalized] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetDenormalized();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetComponentForAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetComponentForAxis] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetComponentForAxis(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_SetComponentForAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_SetComponentForAxis] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetComponentForAxis(Arg0, Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_Normalize(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_Normalize] Attempt to access a NULL self pointer");
                return;
            }
            Self->Normalize();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetWindingAndRemainder(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[0])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked())
             && Info[1]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[1])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked())
            )
        {
            
            FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked());
            FRotator* Arg1 = puerts::DataTransfer::GetPoninterFast<FRotator>(puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetWindingAndRemainder] Attempt to access a NULL self pointer");
                return;
            }
            Self->GetWindingAndRemainder(*Arg0, *Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetManhattanDistance(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetManhattanDistance] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetManhattanDistance(*Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_GetEquivalentRotator(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_GetEquivalentRotator] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetEquivalentRotator();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_SetClosestToMe(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[0])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FRotator>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked())
            )
        {
            
            FRotator* Arg0 = puerts::DataTransfer::GetPoninterFast<FRotator>(puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_SetClosestToMe] Attempt to access a NULL self pointer");
                return;
            }
            Self->SetClosestToMe(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_ToString] Attempt to access a NULL self pointer");
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

static void FRotatorM_ToCompactString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_ToCompactString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToCompactString();
            auto V8Result = v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorM_InitFromString(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_InitFromString] Attempt to access a NULL self pointer");
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

static void FRotatorM_ContainsNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FRotator::M_ContainsNaN] Attempt to access a NULL self pointer");
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

static void FRotatorS_ClampAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FRotator::ClampAxis(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorS_NormalizeAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FRotator::NormalizeAxis(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorS_CompressAxisToByte(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FRotator::CompressAxisToByte(Arg0);
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorS_DecompressAxisFromByte(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            uint8 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto MethodResult = FRotator::DecompressAxisFromByte(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorS_CompressAxisToShort(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FRotator::CompressAxisToShort(Arg0);
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorS_DecompressAxisFromShort(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            uint16 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto MethodResult = FRotator::DecompressAxisFromShort(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FRotatorS_MakeFromEuler(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FRotator::MakeFromEuler(*Arg0);
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FRotatorPitchGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Pitch);
    Info.GetReturnValue().Set(V8Result);
}
static void _FRotatorPitchSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.This());

    Self->Pitch =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FRotatorYawGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Yaw);
    Info.GetReturnValue().Set(V8Result);
}
static void _FRotatorYawSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.This());

    Self->Yaw =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FRotatorRollGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Roll);
    Info.GetReturnValue().Set(V8Result);
}
static void _FRotatorRollSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FRotator>(Info.This());

    Self->Roll =Value->ToNumber(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFRotator
{
    AutoRegisterForFRotator()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {"Pitch", _FRotatorPitchGet_, _FRotatorPitchSet_},
            {"Yaw", _FRotatorYawGet_, _FRotatorYawSet_},
            {"Roll", _FRotatorRollGet_, _FRotatorRollSet_},
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"DiagnosticCheckNaN", FRotatorM_DiagnosticCheckNaN},
            {"op_Addition", FRotatorM_op_Addition},
            {"op_Subtraction", FRotatorM_op_Subtraction},
            {"op_Multiply", FRotatorM_op_Multiply},
            {"op_Equality", FRotatorM_op_Equality},
            {"op_Inequality", FRotatorM_op_Inequality},
            {"IsNearlyZero", FRotatorM_IsNearlyZero},
            {"IsZero", FRotatorM_IsZero},
            {"Equals", FRotatorM_Equals},
            {"Add", FRotatorM_Add},
            {"GetInverse", FRotatorM_GetInverse},
            {"GridSnap", FRotatorM_GridSnap},
            {"Vector", FRotatorM_Vector},
            {"Quaternion", FRotatorM_Quaternion},
            {"Euler", FRotatorM_Euler},
            {"RotateVector", FRotatorM_RotateVector},
            {"UnrotateVector", FRotatorM_UnrotateVector},
            {"Clamp", FRotatorM_Clamp},
            {"GetNormalized", FRotatorM_GetNormalized},
            {"GetDenormalized", FRotatorM_GetDenormalized},
            {"GetComponentForAxis", FRotatorM_GetComponentForAxis},
            {"SetComponentForAxis", FRotatorM_SetComponentForAxis},
            {"Normalize", FRotatorM_Normalize},
            {"GetWindingAndRemainder", FRotatorM_GetWindingAndRemainder},
            {"GetManhattanDistance", FRotatorM_GetManhattanDistance},
            {"GetEquivalentRotator", FRotatorM_GetEquivalentRotator},
            {"SetClosestToMe", FRotatorM_SetClosestToMe},
            {"ToString", FRotatorM_ToString},
            {"ToCompactString", FRotatorM_ToCompactString},
            {"InitFromString", FRotatorM_InitFromString},
            {"ContainsNaN", FRotatorM_ContainsNaN},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {"ClampAxis", FRotatorS_ClampAxis},
            {"NormalizeAxis", FRotatorS_NormalizeAxis},
            {"CompressAxisToByte", FRotatorS_CompressAxisToByte},
            {"DecompressAxisFromByte", FRotatorS_DecompressAxisFromByte},
            {"CompressAxisToShort", FRotatorS_CompressAxisToShort},
            {"DecompressAxisFromShort", FRotatorS_DecompressAxisFromShort},
            {"MakeFromEuler", FRotatorS_MakeFromEuler},
            {0, 0}
        };

        Def.UStructName = "FRotator";

        Def.Initialize = _FRotatorNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFRotator _AutoRegisterForFRotator_;