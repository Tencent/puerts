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

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 78,
// column 15> unsupported method : operator() const int32 &(int32) __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 86,
// column 9> unsupported method : operator() int32 &(int32) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 126,
// column 14> unsupported method : operator*= FIntVector &(int32) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 134,
// column 14> unsupported method : operator/= FIntVector &(int32) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 142,
// column 14> unsupported method : operator+= FIntVector &(const FIntVector &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 150,
// column 14> unsupported method : operator-= FIntVector &(const FIntVector &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 158,
// column 14> unsupported method : operator= FIntVector &(const FIntVector &) __attribute__((thiscall))

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 198,
// column 13> unsupported method : operator>> FIntVector (int32) __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 206,
// column 13> unsupported method : operator<< FIntVector (int32) __attribute__((thiscall)) const

// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/IntVector.h', line 214,
// column 13> unsupported method : operator& FIntVector (int32) __attribute__((thiscall)) const

static void* _FIntVectorNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            FIntVector* Obj = new FIntVector();

            // UE_LOG(LogTemp, Warning, TEXT("_FIntVectorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 3)
    {
        if (Info[0]->IsNumber() && Info[1]->IsNumber() && Info[2]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            int32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            int32 Arg2 = Info[2]->ToInteger(Context).ToLocalChecked()->Value();
            FIntVector* Obj = new FIntVector(Arg0, Arg1, Arg2);

            // UE_LOG(LogTemp, Warning, TEXT("_FIntVectorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            FIntVector* Obj = new FIntVector(Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FIntVectorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            FVector* Arg0 = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FVector>(Info[0]->ToObject(Context).ToLocalChecked());
            FIntVector* Obj = new FIntVector(*Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FIntVectorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FIntVector* Obj = new FIntVector(Arg0);

            // UE_LOG(LogTemp, Warning, TEXT("_FIntVectorNew_:%p"), Obj);
            return Obj;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void _FIntVectorDelete_(void* Ptr, void* ClassData, void* EnvData)
{
    FIntVector* Self = static_cast<FIntVector*>(Ptr);
    // UE_LOG(LogTemp, Warning, TEXT("_FIntVectorDelete_:%p"), Self);
    delete Self;
}
static void FIntVectorM_get_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_get_Item] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator[](Arg0);
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_set_Item(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_set_Item] Attempt to access a NULL self pointer");
                return;
            }
            Self->operator[](Arg0);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FIntVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FIntVector* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_op_Equality] Attempt to access a NULL self pointer");
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

static void FIntVectorM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FIntVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FIntVector* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_op_Inequality] Attempt to access a NULL self pointer");
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

static void FIntVectorM_op_Multiply(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_op_Multiply] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator*(Arg0);
            void* Ptr = new FIntVector(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FIntVector>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_op_Division(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsNumber())
        {
            int32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_op_Division] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator/(Arg0);
            void* Ptr = new FIntVector(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FIntVector>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_op_Addition(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FIntVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FIntVector* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_op_Addition] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator+(*Arg0);
            void* Ptr = new FIntVector(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FIntVector>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_op_Subtraction(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FIntVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()))
        {
            const FIntVector* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_op_Subtraction] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->operator-(*Arg0);
            void* Ptr = new FIntVector(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FIntVector>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_IsZero(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_IsZero] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->IsZero();
            auto V8Result = v8::Boolean::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_GetMax(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_GetMax] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMax();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_GetMin(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_GetMin] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->GetMin();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_Size(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_Size] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->Size();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
            if (!Self)
            {
                PUERTS_NAMESPACE::DataTransfer::ThrowException(
                    Isolate, "[FIntVector::M_ToString] Attempt to access a NULL self pointer");
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

static void FIntVectorS_DivideAndRoundUp(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 2)
    {
        if (Info[0]->IsObject() &&

            PUERTS_NAMESPACE::DataTransfer::IsInstanceOf<FIntVector>(Isolate, Info[0]->ToObject(Context).ToLocalChecked()) &&
            Info[1]->IsNumber())
        {
            FIntVector* Arg0 =
                PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info[0]->ToObject(Context).ToLocalChecked());
            int32 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            auto MethodResult = FIntVector::DivideAndRoundUp(*Arg0, Arg1);
            void* Ptr = new FIntVector(MethodResult);

            auto V8Result = PUERTS_NAMESPACE::DataTransfer::FindOrAddStruct<FIntVector>(Isolate, Context, Ptr, false);

            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FIntVectorS_Num(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            auto MethodResult = FIntVector::Num();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);

            return;
        }
    }
    PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void _FIntVectorXGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FIntVector::X] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Integer::New(Isolate, Self->X);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FIntVector, int32>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FIntVectorXSet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FIntVector::X] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->X = Value->ToInteger(Context).ToLocalChecked()->Value();
}
static void _FIntVectorYGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FIntVector::Y] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Integer::New(Isolate, Self->Y);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FIntVector, int32>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FIntVectorYSet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FIntVector::Y] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->Y = Value->ToInteger(Context).ToLocalChecked()->Value();
}
static void _FIntVectorZGet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());

    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FIntVector::Z] Attempt to access a NULL self pointer");
        return;
    }

    auto V8Result = v8::Integer::New(Isolate, Self->Z);
    PUERTS_NAMESPACE::DataTransfer::LinkOuter<FIntVector, int32>(Context, Info.Holder(), V8Result);
    Info.GetReturnValue().Set(V8Result);
}
static void _FIntVectorZSet_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Self = PUERTS_NAMESPACE::DataTransfer::GetPointerFast<FIntVector>(Info.Holder());
    if (!Self)
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "[FIntVector::Z] Attempt to access a NULL self pointer");
        return;
    }
    auto Value = Info[0];

    Self->Z = Value->ToInteger(Context).ToLocalChecked()->Value();
}

struct AutoRegisterForFIntVector
{
    AutoRegisterForFIntVector()
    {
        PUERTS_NAMESPACE::JSClassDefinition Def = JSClassEmptyDefinition;

        static PUERTS_NAMESPACE::JSPropertyInfo Properties[] = {{"X", _FIntVectorXGet_, _FIntVectorXSet_},
            {"Y", _FIntVectorYGet_, _FIntVectorYSet_}, {"Z", _FIntVectorZGet_, _FIntVectorZSet_}, {0, 0, 0}};

        static PUERTS_NAMESPACE::JSFunctionInfo Methods[] = {{"get_Item", FIntVectorM_get_Item}, {"set_Item", FIntVectorM_set_Item},
            {"op_Equality", FIntVectorM_op_Equality}, {"op_Inequality", FIntVectorM_op_Inequality},
            {"op_Multiply", FIntVectorM_op_Multiply}, {"op_Division", FIntVectorM_op_Division},
            {"op_Addition", FIntVectorM_op_Addition}, {"op_Subtraction", FIntVectorM_op_Subtraction},
            {"IsZero", FIntVectorM_IsZero}, {"GetMax", FIntVectorM_GetMax}, {"GetMin", FIntVectorM_GetMin},
            {"Size", FIntVectorM_Size}, {"ToString", FIntVectorM_ToString}, {0, 0}};

        static PUERTS_NAMESPACE::JSFunctionInfo Functions[] = {
            {"DivideAndRoundUp", FIntVectorS_DivideAndRoundUp}, {"Num", FIntVectorS_Num}, {0, 0}};

        Def.UETypeName = "IntVector";

        Def.Initialize = _FIntVectorNew_;
        Def.Finalize = _FIntVectorDelete_;
        Def.Properties = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        PUERTS_NAMESPACE::RegisterJSClass(Def);
    }
};

AutoRegisterForFIntVector _AutoRegisterForFIntVector_;