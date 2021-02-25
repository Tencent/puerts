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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Vector4.h', line 123, column 23>
// unsupported method : operator+= FVector4 (const FVector4 &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Vector4.h', line 139, column 23>
// unsupported method : operator-= FVector4 (const FVector4 &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Vector4.h', line 179, column 11>
// unsupported method : operator*= FVector4 (const FVector4 &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Vector4.h', line 187, column 11>
// unsupported method : operator/= FVector4 (const FVector4 &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Vector4.h', line 195, column 11>
// unsupported method : operator*= FVector4 (float) __attribute__((thiscall))


static void* _FVector4New_(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            FVector4* Obj = new FVector4(*Arg0, Arg1);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FVector4New_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FLinearColor* Arg0 = puerts::DataTransfer::GetPoninterFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            FVector4* Obj = new FVector4(*Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FVector4New_:%p"), Obj);
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
            FVector4* Obj = new FVector4(Arg0, Arg1, Arg2, Arg3);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FVector4New_:%p"), Obj);
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
            
            FVector2D* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[0]->ToObject(Context).ToLocalChecked());
            FVector2D* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector2D>(Info[1]->ToObject(Context).ToLocalChecked());
            FVector4* Obj = new FVector4(*Arg0, *Arg1);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FVector4New_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FVector4* Obj = new FVector4(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FVector4New_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FVector4M_set_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_set_Item] Attempt to access a NULL self pointer");
                return;
            }
            Self->operator[](Arg0);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_get_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_get_Item] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator[](Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_op_UnaryNegation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_UnaryNegation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-();
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_op_Subtraction(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Subtraction] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector4* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector4>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_op_Division(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FVector4* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector4>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Equality] Attempt to access a NULL self pointer");
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

static void FVector4M_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_Inequality] Attempt to access a NULL self pointer");
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

static void FVector4M_op_ExclusiveOr(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_op_ExclusiveOr] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator^(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Component(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Component] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Component(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Component] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Component(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Equals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
             && 
            Info[1]->IsNumber())
        {
            
            const FVector4* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector4>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Equals] Attempt to access a NULL self pointer");
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

static void FVector4M_IsUnit3(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_IsUnit3] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsUnit3(Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_ToString] Attempt to access a NULL self pointer");
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

static void FVector4M_InitFromString(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_InitFromString] Attempt to access a NULL self pointer");
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

static void FVector4M_GetSafeNormal(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_GetSafeNormal] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetSafeNormal(Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_GetUnsafeNormal3(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_GetUnsafeNormal3] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetUnsafeNormal3();
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_ToOrientationRotator(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_ToOrientationRotator] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToOrientationRotator();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_ToOrientationQuat(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_ToOrientationQuat] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToOrientationQuat();
            void* Ptr = new FQuat(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FQuat>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Rotation(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Rotation] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Rotation();
            void* Ptr = new FRotator(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FRotator>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Set(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Set] Attempt to access a NULL self pointer");
                return;
            }
            Self->Set(Arg0, Arg1, Arg2, Arg3);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Size3(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Size3] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Size3();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_SizeSquared3(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_SizeSquared3] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->SizeSquared3();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Size(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Size] Attempt to access a NULL self pointer");
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

static void FVector4M_SizeSquared(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_SizeSquared] Attempt to access a NULL self pointer");
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

static void FVector4M_ContainsNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_ContainsNaN] Attempt to access a NULL self pointer");
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

static void FVector4M_IsNearlyZero3(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_IsNearlyZero3] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsNearlyZero3(Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_Reflect3(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_Reflect3] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Reflect3(*Arg0);
            void* Ptr = new FVector4(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FVector4>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_FindBestAxisVectors3(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[0])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked())
             && Info[1]->IsObject() &&
            puerts::DataTransfer::UnRef(Isolate, Info[1])->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FVector4>(Isolate, puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked())
            )
        {
            
            FVector4* Arg0 = puerts::DataTransfer::GetPoninterFast<FVector4>(puerts::DataTransfer::UnRef(Isolate, Info[0])->ToObject(Context).ToLocalChecked());
            FVector4* Arg1 = puerts::DataTransfer::GetPoninterFast<FVector4>(puerts::DataTransfer::UnRef(Isolate, Info[1])->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_FindBestAxisVectors3] Attempt to access a NULL self pointer");
                return;
            }
            Self->FindBestAxisVectors3(*Arg0, *Arg1);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FVector4M_DiagnosticCheckNaN(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FVector4::M_DiagnosticCheckNaN] Attempt to access a NULL self pointer");
                return;
            }
            Self->DiagnosticCheckNaN();
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FVector4XGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->X);
    Info.GetReturnValue().Set(V8Result);
}
static void _FVector4XSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    Self->X =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FVector4YGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Y);
    Info.GetReturnValue().Set(V8Result);
}
static void _FVector4YSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    Self->Y =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FVector4ZGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->Z);
    Info.GetReturnValue().Set(V8Result);
}
static void _FVector4ZSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    Self->Z =Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FVector4WGet_(v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    auto V8Result =v8::Number::New(Isolate, Self->W);
    Info.GetReturnValue().Set(V8Result);
}
static void _FVector4WSet_(v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = puerts::DataTransfer::GetPoninterFast<FVector4>(Info.This());

    Self->W =Value->ToNumber(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFVector4
{
    AutoRegisterForFVector4()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {"X", _FVector4XGet_, _FVector4XSet_},
            {"Y", _FVector4YGet_, _FVector4YSet_},
            {"Z", _FVector4ZGet_, _FVector4ZSet_},
            {"W", _FVector4WGet_, _FVector4WSet_},
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"set_Item", FVector4M_set_Item},
            {"get_Item", FVector4M_get_Item},
            {"op_UnaryNegation", FVector4M_op_UnaryNegation},
            {"op_Addition", FVector4M_op_Addition},
            {"op_Subtraction", FVector4M_op_Subtraction},
            {"op_Multiply", FVector4M_op_Multiply},
            {"op_Division", FVector4M_op_Division},
            {"op_Equality", FVector4M_op_Equality},
            {"op_Inequality", FVector4M_op_Inequality},
            {"op_ExclusiveOr", FVector4M_op_ExclusiveOr},
            {"Component", FVector4M_Component},
            {"Equals", FVector4M_Equals},
            {"IsUnit3", FVector4M_IsUnit3},
            {"ToString", FVector4M_ToString},
            {"InitFromString", FVector4M_InitFromString},
            {"GetSafeNormal", FVector4M_GetSafeNormal},
            {"GetUnsafeNormal3", FVector4M_GetUnsafeNormal3},
            {"ToOrientationRotator", FVector4M_ToOrientationRotator},
            {"ToOrientationQuat", FVector4M_ToOrientationQuat},
            {"Rotation", FVector4M_Rotation},
            {"Set", FVector4M_Set},
            {"Size3", FVector4M_Size3},
            {"SizeSquared3", FVector4M_SizeSquared3},
            {"Size", FVector4M_Size},
            {"SizeSquared", FVector4M_SizeSquared},
            {"ContainsNaN", FVector4M_ContainsNaN},
            {"IsNearlyZero3", FVector4M_IsNearlyZero3},
            {"Reflect3", FVector4M_Reflect3},
            {"FindBestAxisVectors3", FVector4M_FindBestAxisVectors3},
            {"DiagnosticCheckNaN", FVector4M_DiagnosticCheckNaN},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {0, 0}
        };

        Def.UStructName = "FVector4";

        Def.Initialize = _FVector4New_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFVector4 _AutoRegisterForFVector4_;