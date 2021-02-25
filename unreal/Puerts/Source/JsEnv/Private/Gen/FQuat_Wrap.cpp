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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Quat.h', line 120, column 20>
// unsupported method : operator+= FQuat (const FQuat &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Quat.h', line 156, column 20>
// unsupported method : operator-= FQuat (const FQuat &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Quat.h', line 178, column 20>
// unsupported method : operator*= FQuat (const FQuat &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Quat.h', line 198, column 10>
// unsupported method : op_Multiply FMatrix (const FMatrix &) __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Quat.h', line 206, column 20>
// unsupported method : operator*= FQuat (const float) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Quat.h', line 222, column 20>
// unsupported method : operator/= FQuat (const float) __attribute__((thiscall))


static void* _FQuatNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FQuat* Obj = new FQuat();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FQuatNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FQuat* Obj = new FQuat(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FQuatNew_:%p"), Obj);
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
            
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg3 = Info[3]->ToNumber(Context).ToLocalChecked()->Value();
            FQuat* Obj = new FQuat(Arg0, Arg1, Arg2, Arg3);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FQuatNew_:%p"), Obj);
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
            FQuat* Obj = new FQuat(*Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FQuatNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            FQuat* Obj = new FQuat(*Arg0, Arg1);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FQuatNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FQuatM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_op_Subtraction(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Subtraction] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-(*Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_Equals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Equals] Attempt to access a NULL self pointer");
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

static void FQuatM_IsIdentity(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_IsIdentity] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsIdentity(Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(*Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
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
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(*Arg0);
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            const float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_op_Division(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Equality] Attempt to access a NULL self pointer");
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

static void FQuatM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_Inequality] Attempt to access a NULL self pointer");
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

static void FQuatM_op_BitwiseOr(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_op_BitwiseOr] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator|(*Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_MakeFromEuler(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FQuat::MakeFromEuler(*Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_Euler(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Euler] Attempt to access a NULL self pointer");
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

static void FQuatM_Normalize(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Normalize] Attempt to access a NULL self pointer");
                return;
            }
            Self->Normalize(Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetNormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetNormalized] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetNormalized(Arg0);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_IsNormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_IsNormalized] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsNormalized();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_Size(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Size] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Size();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_SizeSquared(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_SizeSquared] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->SizeSquared();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetAngle(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetAngle] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetAngle();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_ToAxisAndAngle(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[0])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked())
             && Info[1]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[1])->IsNumber())
        {
            
            FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked());
            float Arg1 = puerts::DataTransfer::UnRef(Isolate, Info[1])->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_ToAxisAndAngle] Attempt to access a NULL self pointer");
                return;
            }
            Self->ToAxisAndAngle(*Arg0, Arg1);
            
            puerts::DataTransfer::UpdateRef(Isolate, Info[1], v8::Number::New(Isolate, Arg1));
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_ToSwingTwist(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && Info[1]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[1])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked())
             && Info[2]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[2])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[2])->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked());
            FQuat* Arg2 = puerts::DataTransfer::GetPoninterFast<FQuat>(puerts::DataTransfer::UnRef(Isolate, Info[2])->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_ToSwingTwist] Attempt to access a NULL self pointer");
                return;
            }
            Self->ToSwingTwist(*Arg0, *Arg1, *Arg2);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_RotateVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_RotateVector] Attempt to access a NULL self pointer");
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

static void FQuatM_UnrotateVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            FVector* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_UnrotateVector] Attempt to access a NULL self pointer");
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

static void FQuatM_Log(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Log] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Log();
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_Exp(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Exp] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Exp();
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_Inverse(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Inverse] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Inverse();
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_EnforceShortestArcWith(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_EnforceShortestArcWith] Attempt to access a NULL self pointer");
                return;
            }
            Self->EnforceShortestArcWith(*Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetAxisX(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetAxisX] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetAxisX();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetAxisY(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetAxisY] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetAxisY();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetAxisZ(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetAxisZ] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetAxisZ();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetForwardVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetForwardVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetForwardVector();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetRightVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetRightVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetRightVector();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_GetUpVector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetUpVector] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetUpVector();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_Vector(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Vector] Attempt to access a NULL self pointer");
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

static void FQuatM_Rotator(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_Rotator] Attempt to access a NULL self pointer");
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

static void FQuatM_GetRotationAxis(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_GetRotationAxis] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetRotationAxis();
            void* Ptr = new FVector(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_AngularDistance(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_AngularDistance] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->AngularDistance(*Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatM_ContainsNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_ContainsNaN] Attempt to access a NULL self pointer");
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

static void FQuatM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_ToString] Attempt to access a NULL self pointer");
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

static void FQuatM_InitFromString(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_InitFromString] Attempt to access a NULL self pointer");
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

static void FQuatM_DiagnosticCheckNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FQuat::M_DiagnosticCheckNaN] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_FindBetween(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FQuat::FindBetween(*Arg0, *Arg1);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_FindBetweenNormals(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FQuat::FindBetweenNormals(*Arg0, *Arg1);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_FindBetweenVectors(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FQuat::FindBetweenVectors(*Arg0, *Arg1);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_Error(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FQuat::Error(*Arg0, *Arg1);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_ErrorAutoNormalize(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FQuat::ErrorAutoNormalize(*Arg0, *Arg1);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_FastLerp(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            const float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::FastLerp(*Arg0, *Arg1, Arg2);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_FastBilerp(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 6)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
             && 
            Info[3]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[3]->ToObject(Context).ToLocalChecked())
             && 
            Info[4]->IsNumber() && 
            Info[5]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg2 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[2]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg3 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[3]->ToObject(Context).ToLocalChecked());
            float Arg4 = Info[4]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg5 = Info[5]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::FastBilerp(*Arg0, *Arg1, *Arg2, *Arg3, Arg4, Arg5);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_Slerp_NotNormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::Slerp_NotNormalized(*Arg0, *Arg1, Arg2);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_Slerp(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::Slerp(*Arg0, *Arg1, Arg2);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_SlerpFullPath_NotNormalized(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::SlerpFullPath_NotNormalized(*Arg0, *Arg1, Arg2);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_SlerpFullPath(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::SlerpFullPath(*Arg0, *Arg1, Arg2);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_Squad(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 5)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
             && 
            Info[3]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[3]->ToObject(Context).ToLocalChecked())
             && 
            Info[4]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg2 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[2]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg3 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[3]->ToObject(Context).ToLocalChecked());
            float Arg4 = Info[4]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::Squad(*Arg0, *Arg1, *Arg2, *Arg3, Arg4);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_SquadFullPath(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 5)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
             && 
            Info[3]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[3]->ToObject(Context).ToLocalChecked())
             && 
            Info[4]->IsNumber())
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg2 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[2]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg3 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[3]->ToObject(Context).ToLocalChecked());
            float Arg4 = Info[4]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FQuat::SquadFullPath(*Arg0, *Arg1, *Arg2, *Arg3, Arg4);
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FQuatS_CalcTangents(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 5)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[1]->ToObject(Context).ToLocalChecked())
             && 
            Info[2]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, Info[2]->ToObject(Context).ToLocalChecked())
             && 
            Info[3]->IsNumber() && Info[4]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[4])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FQuat>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[4])->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FQuat* Arg0 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[0]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg1 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[1]->ToObject(Context).ToLocalChecked());
            const FQuat* Arg2 = puerts::DataTransfer::GetPoninterFast<FQuat>(Info[2]->ToObject(Context).ToLocalChecked());
            float Arg3 = Info[3]->ToNumber(Context).ToLocalChecked()->Value();
            FQuat* Arg4 = puerts::DataTransfer::GetPoninterFast<FQuat>(puerts::DataTransfer::UnRef(Isolate, Info[4])->ToObject(Context).ToLocalChecked());
            FQuat::CalcTangents(*Arg0, *Arg1, *Arg2, Arg3, *Arg4);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FQuatXGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->X);
    Info.GetReturnValue().Set(V8Result);
}
static void _FQuatXSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    Self->X =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FQuatYGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Y);
    Info.GetReturnValue().Set(V8Result);
}
static void _FQuatYSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    Self->Y =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FQuatZGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Z);
    Info.GetReturnValue().Set(V8Result);
}
static void _FQuatZSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    Self->Z =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FQuatWGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->W);
    Info.GetReturnValue().Set(V8Result);
}
static void _FQuatWSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FQuat>(Info.This());

    Self->W =Value->ToNumber(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFQuat
{
    AutoRegisterForFQuat()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {"X", _FQuatXGet_, _FQuatXSet_},
            {"Y", _FQuatYGet_, _FQuatYSet_},
            {"Z", _FQuatZGet_, _FQuatZSet_},
            {"W", _FQuatWGet_, _FQuatWSet_},
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"op_Addition", FQuatM_op_Addition},
            {"op_Subtraction", FQuatM_op_Subtraction},
            {"Equals", FQuatM_Equals},
            {"IsIdentity", FQuatM_IsIdentity},
            {"op_Multiply", FQuatM_op_Multiply},
            {"op_Division", FQuatM_op_Division},
            {"op_Equality", FQuatM_op_Equality},
            {"op_Inequality", FQuatM_op_Inequality},
            {"op_BitwiseOr", FQuatM_op_BitwiseOr},
            {"Euler", FQuatM_Euler},
            {"Normalize", FQuatM_Normalize},
            {"GetNormalized", FQuatM_GetNormalized},
            {"IsNormalized", FQuatM_IsNormalized},
            {"Size", FQuatM_Size},
            {"SizeSquared", FQuatM_SizeSquared},
            {"GetAngle", FQuatM_GetAngle},
            {"ToAxisAndAngle", FQuatM_ToAxisAndAngle},
            {"ToSwingTwist", FQuatM_ToSwingTwist},
            {"RotateVector", FQuatM_RotateVector},
            {"UnrotateVector", FQuatM_UnrotateVector},
            {"Log", FQuatM_Log},
            {"Exp", FQuatM_Exp},
            {"Inverse", FQuatM_Inverse},
            {"EnforceShortestArcWith", FQuatM_EnforceShortestArcWith},
            {"GetAxisX", FQuatM_GetAxisX},
            {"GetAxisY", FQuatM_GetAxisY},
            {"GetAxisZ", FQuatM_GetAxisZ},
            {"GetForwardVector", FQuatM_GetForwardVector},
            {"GetRightVector", FQuatM_GetRightVector},
            {"GetUpVector", FQuatM_GetUpVector},
            {"Vector", FQuatM_Vector},
            {"Rotator", FQuatM_Rotator},
            {"GetRotationAxis", FQuatM_GetRotationAxis},
            {"AngularDistance", FQuatM_AngularDistance},
            {"ContainsNaN", FQuatM_ContainsNaN},
            {"ToString", FQuatM_ToString},
            {"InitFromString", FQuatM_InitFromString},
            {"DiagnosticCheckNaN", FQuatM_DiagnosticCheckNaN},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {"MakeFromEuler", FQuatS_MakeFromEuler},
            {"FindBetween", FQuatS_FindBetween},
            {"FindBetweenNormals", FQuatS_FindBetweenNormals},
            {"FindBetweenVectors", FQuatS_FindBetweenVectors},
            {"Error", FQuatS_Error},
            {"ErrorAutoNormalize", FQuatS_ErrorAutoNormalize},
            {"FastLerp", FQuatS_FastLerp},
            {"FastBilerp", FQuatS_FastBilerp},
            {"Slerp_NotNormalized", FQuatS_Slerp_NotNormalized},
            {"Slerp", FQuatS_Slerp},
            {"SlerpFullPath_NotNormalized", FQuatS_SlerpFullPath_NotNormalized},
            {"SlerpFullPath", FQuatS_SlerpFullPath},
            {"Squad", FQuatS_Squad},
            {"SquadFullPath", FQuatS_SquadFullPath},
            {"CalcTangents", FQuatS_CalcTangents},
            {0, 0}
        };

        Def.UStructName = "FQuat";

        Def.Initialize = _FQuatNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFQuat _AutoRegisterForFQuat_;