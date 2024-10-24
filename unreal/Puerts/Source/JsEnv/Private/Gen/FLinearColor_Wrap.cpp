/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// gen by puerts gen tools

#include "GenHeaders.h"
#include "CoreMinimal.h"
#include "DataTransfer.h"
#include "JSClassRegister.h"

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 112,
// column 28> unsupported method : operator+= FLinearColor &(const FLinearColor &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 130,
// column 28> unsupported method : operator-= FLinearColor &(const FLinearColor &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 148,
// column 28> unsupported method : operator*= FLinearColor &(const FLinearColor &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 167,
// column 28> unsupported method : operator*= FLinearColor &(float) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 185,
// column 28> unsupported method : operator/= FLinearColor &(const FLinearColor &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 204,
// column 28> unsupported method : operator/= FLinearColor &(float) __attribute__((thiscall))

static void* _FLinearColorNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            FLinearColor* Obj = new FLinearColor();

            // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FLinearColor* Obj = new FLinearColor(Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 4)
    {
        if (Info[0]->IsNumber() && Info[1]->IsNumber() && Info[2]->IsNumber() && Info[3]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg3 = Info[3]->ToNumber(Context).ToLocalChecked()->Value();
            FLinearColor* Obj = new FLinearColor(Arg0, Arg1, Arg2, Arg3);

            // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FColor>(Info[0]->ToObject(Context).ToLocalChecked());
            FLinearColor* Obj = new FLinearColor(*Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FVector* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            FLinearColor* Obj = new FLinearColor(*Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FVector4>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FVector4* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FVector4>(Info[0]->ToObject(Context).ToLocalChecked());
            FLinearColor* Obj = new FLinearColor(*Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorNew_:%p"), Obj);
            return Obj;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void _FLinearColorDelete_(void* Ptr, void* ClassData, void* EnvData)
{
    FLinearColor* Self = static_cast<FLinearColor*>(Ptr);
    // UE_LOG(LogTemp, Warning, TEXT("_FLinearColorDelete_:%p"), Self);
    delete Self;
}
static void FLinearColorM_ToRGBE(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_ToRGBE] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToRGBE();
            void* Ptr = new FColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorS_FromSRGBColor(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FLinearColor::FromSRGBColor(*Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorS_FromPow22Color(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FLinearColor::FromPow22Color(*Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_Component(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_Component] Attempt to access a NULL self pointer");
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
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_Component] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Component(Arg0);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_op_Subtraction(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Subtraction] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-(*Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(*Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_op_Division(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(*Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_GetClamped(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsNumber() && Info[1]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_GetClamped] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetClamped(Arg0, Arg1);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Equality] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator==(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_op_Inequality] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator!=(*Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_Equals(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()) &&
            Info[1]->IsNumber())
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            float Arg1 = Info[1]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_Equals] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Equals(*Arg0, Arg1);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_CopyWithNewOpacity(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_CopyWithNewOpacity] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->CopyWithNewOpacity(Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorS_MakeRandomColor(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto MethodResult = FLinearColor::MakeRandomColor();
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorS_MakeFromColorTemperature(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FLinearColor::MakeFromColorTemperature(Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorS_Dist(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()) &&
            Info[1]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[1]->ToObject(Context).ToLocalChecked()))
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            const FLinearColor* Arg1 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[1]->ToObject(Context).ToLocalChecked());
            auto MethodResult = FLinearColor::Dist(*Arg0, *Arg1);
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_LinearRGBToHSV(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_LinearRGBToHSV] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->LinearRGBToHSV();
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_HSVToLinearRGB(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_HSVToLinearRGB] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->HSVToLinearRGB();
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorS_LerpUsingHSV(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 3)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()) &&
            Info[1]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FLinearColor>(Isolate, Info[1]->ToObject(Context).ToLocalChecked()) &&
            Info[2]->IsNumber())
        {
            const FLinearColor* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[0]->ToObject(Context).ToLocalChecked());
            const FLinearColor* Arg1 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info[1]->ToObject(Context).ToLocalChecked());
            const float Arg2 = Info[2]->ToNumber(Context).ToLocalChecked()->Value();
            auto MethodResult = FLinearColor::LerpUsingHSV(*Arg0, *Arg1, Arg2);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

#if ENGINE_MAJOR_VERSION >= 5
static void FLinearColorM_QuantizeFloor(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_QuantizeFloor] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->QuantizeFloor();
            void* Ptr = new FColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}
#endif

static void FLinearColorM_Quantize(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
#if ENGINE_MAJOR_VERSION >= 5
    FLinearColorM_QuantizeFloor(Info);
#else
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_Quantize] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Quantize();
            void* Ptr = new FColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
#endif
}

static void FLinearColorM_QuantizeRound(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_QuantizeRound] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->QuantizeRound();
            void* Ptr = new FColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_ToFColor(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsBoolean())
        {
            const bool Arg0 = Info[0]->ToBoolean(Isolate)->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_ToFColor] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToFColor(Arg0);
            void* Ptr = new FColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_Desaturate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            float Arg0 = Info[0]->ToNumber(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_Desaturate] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Desaturate(Arg0);
            void* Ptr = new FLinearColor(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_ComputeLuminance(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_ComputeLuminance] Attempt to access a NULL self pointer");
                return;
            }
#if ENGINE_MAJOR_VERSION > 4
            auto MethodResult = Self->GetLuminance();
#else
            auto MethodResult = Self->ComputeLuminance();
#endif
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_GetMax(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_GetMax] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMax();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_IsAlmostBlack(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_IsAlmostBlack] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsAlmostBlack();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_GetMin(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_GetMin] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMin();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_GetLuminance(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_GetLuminance] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetLuminance();
            auto V8Result = v8::Number::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_ToString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToString();
            auto V8Result =
                v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FLinearColorM_InitFromString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsString())
        {
            const FString Arg0 = UTF8_TO_TCHAR(*(v8::String::Utf8Value(Isolate, Info[0])));
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FLinearColor::M_InitFromString] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->InitFromString(Arg0);
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FLinearColorRGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::R] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Number::New(Isolate, Self->R);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FLinearColor, float>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FLinearColorRSet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::R] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->R = Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FLinearColorGGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::G] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Number::New(Isolate, Self->G);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FLinearColor, float>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FLinearColorGSet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::G] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->G = Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FLinearColorBGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::B] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Number::New(Isolate, Self->B);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FLinearColor, float>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FLinearColorBSet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::B] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->B = Value->ToNumber(Context).ToLocalChecked()->Value();
}
static void _FLinearColorAGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::A] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Number::New(Isolate, Self->A);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FLinearColor, float>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FLinearColorASet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FLinearColor>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FLinearColor::A] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->A = Value->ToNumber(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFLinearColor
{
    AutoRegisterForFLinearColor()
    {
        PUERTS_NAMESPACE::JSClassDefinition Def = JSClassEmptyDefinition;

        static PUERTS_NAMESPACE::JSPropertyInfo Properties[] = {{"R", _FLinearColorRGet_, _FLinearColorRSet_},
            {"G", _FLinearColorGGet_, _FLinearColorGSet_}, {"B", _FLinearColorBGet_, _FLinearColorBSet_},
            {"A", _FLinearColorAGet_, _FLinearColorASet_}, {0, 0, 0}};

        static PUERTS_NAMESPACE::JSFunctionInfo Methods[] = {{"ToRGBE", FLinearColorM_ToRGBE},
            {"Component", FLinearColorM_Component}, {"op_Addition", FLinearColorM_op_Addition},
            {"op_Subtraction", FLinearColorM_op_Subtraction}, {"op_Multiply", FLinearColorM_op_Multiply},
            {"op_Division", FLinearColorM_op_Division}, {"GetClamped", FLinearColorM_GetClamped},
            {"op_Equality", FLinearColorM_op_Equality}, {"op_Inequality", FLinearColorM_op_Inequality},
            {"Equals", FLinearColorM_Equals}, {"CopyWithNewOpacity", FLinearColorM_CopyWithNewOpacity},
            {"LinearRGBToHSV", FLinearColorM_LinearRGBToHSV}, {"HSVToLinearRGB", FLinearColorM_HSVToLinearRGB},
            {"Quantize", FLinearColorM_Quantize}, {"QuantizeRound", FLinearColorM_QuantizeRound},
            {"ToFColor", FLinearColorM_ToFColor}, {"Desaturate", FLinearColorM_Desaturate},
            {"ComputeLuminance", FLinearColorM_ComputeLuminance}, {"GetMax", FLinearColorM_GetMax},
            {"IsAlmostBlack", FLinearColorM_IsAlmostBlack}, {"GetMin", FLinearColorM_GetMin},
            {"GetLuminance", FLinearColorM_GetLuminance}, {"ToString", FLinearColorM_ToString},
            {"InitFromString", FLinearColorM_InitFromString}, {0, 0}};

        static PUERTS_NAMESPACE::JSFunctionInfo Functions[] = {{"FromSRGBColor", FLinearColorS_FromSRGBColor},
            {"FromPow22Color", FLinearColorS_FromPow22Color}, {"MakeRandomColor", FLinearColorS_MakeRandomColor},
            {"MakeFromColorTemperature", FLinearColorS_MakeFromColorTemperature}, {"Dist", FLinearColorS_Dist},
            {"LerpUsingHSV", FLinearColorS_LerpUsingHSV}, {0, 0}};

        Def.UETypeName = "LinearColor";

        Def.SetInitialize(_FLinearColorNew_);
        Def.Finalize = _FLinearColorDelete_;
        Def.Properties = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        PUERTS_NAMESPACE::RegisterJSClass(Def);
    }
};

AutoRegisterForFLinearColor _AutoRegisterForFLinearColor_;