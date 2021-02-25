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


// <SourceLocation file 'D:\\Program Files\\Epic Games\\UE_4.24\\Engine\\Source\\Runtime\\Core\\Public\\Math/Color.h', line 483, column 19>
// unsupported method : operator+= void (const FColor &) __attribute__((thiscall))


static void* _FColorNew_(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            FColor* Obj = new FColor();
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            EForceInit Arg0 = EForceInit(Info[0]->ToInt32(Context).ToLocalChecked()->Value());
            FColor* Obj = new FColor(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FColorNew_:%p"), Obj);
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
            
            uint8 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            uint8 Arg1 = Info[1]->ToInteger(Context).ToLocalChecked()->Value();
            uint8 Arg2 = Info[2]->ToInteger(Context).ToLocalChecked()->Value();
            uint8 Arg3 = Info[3]->ToInteger(Context).ToLocalChecked()->Value();
            FColor* Obj = new FColor(Arg0, Arg1, Arg2, Arg3);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FColorNew_:%p"), Obj);
            return Obj;
        }
    }
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsNumber())
        {
            
            uint32 Arg0 = Info[0]->ToInteger(Context).ToLocalChecked()->Value();
            FColor* Obj = new FColor(Arg0);
            
            
            // UE_LOG(LogTemp, Warning, TEXT("_FColorNew_:%p"), Obj);
            return Obj;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
    return nullptr;
}

static void FColorM_DWColor(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_DWColor] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->DWColor();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_DWColor] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->DWColor();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_op_Equality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FColor* Arg0 = puerts::DataTransfer::GetPoninterFast<FColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_op_Equality] Attempt to access a NULL self pointer");
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

static void FColorM_op_Inequality(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 1)
    {
        if (
            Info[0]->IsObject() &&
            
            puerts::DataTransfer::IsInstanceOf<FColor>(Isolate, Info[0]->ToObject(Context).ToLocalChecked())
            )
        {
            
            const FColor* Arg0 = puerts::DataTransfer::GetPoninterFast<FColor>(Info[0]->ToObject(Context).ToLocalChecked());
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_op_Inequality] Attempt to access a NULL self pointer");
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

static void FColorM_FromRGBE(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_FromRGBE] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->FromRGBE();
            void* Ptr = new FLinearColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorS_FromHex(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FColor::FromHex(Arg0);
            void* Ptr = new FColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorS_MakeRandomColor(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto MethodResult = FColor::MakeRandomColor();
            void* Ptr = new FColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorS_MakeRedToGreenColorFromScalar(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FColor::MakeRedToGreenColorFromScalar(Arg0);
            void* Ptr = new FColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorS_MakeFromColorTemperature(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto MethodResult = FColor::MakeFromColorTemperature(Arg0);
            void* Ptr = new FColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_WithAlpha(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_WithAlpha] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->WithAlpha(Arg0);
            void* Ptr = new FColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_ReinterpretAsLinear(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ReinterpretAsLinear] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ReinterpretAsLinear();
            void* Ptr = new FLinearColor(MethodResult);
                
            auto V8Result = puerts::DataTransfer::FindOrAddStruct<FLinearColor>(Isolate, Context, Ptr, false);
                
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_ToHex(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ToHex] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToHex();
            auto V8Result = v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*MethodResult), v8::NewStringType::kNormal).ToLocalChecked();
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_ToString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ToString] Attempt to access a NULL self pointer");
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

static void FColorM_InitFromString(const v8::FunctionCallbackInfo<v8::Value>& Info)
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
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_InitFromString] Attempt to access a NULL self pointer");
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

static void FColorM_ToPackedARGB(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ToPackedARGB] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToPackedARGB();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_ToPackedABGR(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ToPackedABGR] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToPackedABGR();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_ToPackedRGBA(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ToPackedRGBA] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToPackedRGBA();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}

static void FColorM_ToPackedBGRA(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (Info.Length() == 0)
    {
        if (true)
        {
            
            auto Self = puerts::DataTransfer::GetPoninterFast<FColor>(Info.Holder());
            if (!Self)
            {
                puerts::DataTransfer::ThrowException(Isolate, "[FColor::M_ToPackedBGRA] Attempt to access a NULL self pointer");
                return;
            }
            auto MethodResult = Self->ToPackedBGRA();
            auto V8Result = v8::Integer::New(Isolate, MethodResult);
            Info.GetReturnValue().Set(V8Result);
            
            return;
        }
    }
    puerts::DataTransfer::ThrowException(Isolate, "Invalid argument!");
}


struct AutoRegisterForFColor
{
    AutoRegisterForFColor()
    {
        puerts::JSClassDefinition Def = JSClassEmptyDefinition;

        static puerts::JSPropertyInfo Properties[] = {
            {0, 0, 0}
        };

        static puerts::JSFunctionInfo Methods[] = {
            {"DWColor", FColorM_DWColor},
            {"op_Equality", FColorM_op_Equality},
            {"op_Inequality", FColorM_op_Inequality},
            {"FromRGBE", FColorM_FromRGBE},
            {"WithAlpha", FColorM_WithAlpha},
            {"ReinterpretAsLinear", FColorM_ReinterpretAsLinear},
            {"ToHex", FColorM_ToHex},
            {"ToString", FColorM_ToString},
            {"InitFromString", FColorM_InitFromString},
            {"ToPackedARGB", FColorM_ToPackedARGB},
            {"ToPackedABGR", FColorM_ToPackedABGR},
            {"ToPackedRGBA", FColorM_ToPackedRGBA},
            {"ToPackedBGRA", FColorM_ToPackedBGRA},
            {0, 0}
        };

        static puerts::JSFunctionInfo Functions[] = {
            {"FromHex", FColorS_FromHex},
            {"MakeRandomColor", FColorS_MakeRandomColor},
            {"MakeRedToGreenColorFromScalar", FColorS_MakeRedToGreenColorFromScalar},
            {"MakeFromColorTemperature", FColorS_MakeFromColorTemperature},
            {0, 0}
        };

        Def.UStructName = "FColor";

        Def.Initialize = _FColorNew_;
        Def.Propertys = Properties;
        Def.Methods = Methods;
        Def.Functions = Functions;

        puerts::RegisterClass(Def);
        
    }
};

AutoRegisterForFColor _AutoRegisterForFColor_;