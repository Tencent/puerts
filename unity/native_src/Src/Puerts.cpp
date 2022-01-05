﻿/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "JSEngine.h"
#include <cstring>
#include "V8Utils.h"

#define LIB_VERSION 15

using puerts::JSEngine;
using puerts::FValue;
using puerts::FResultInfo;
using puerts::JSFunction;
using puerts::FV8Utils;
using puerts::FLifeCycleInfo;
using puerts::JsValueType;

#ifdef __cplusplus
extern "C" {
#endif

V8_EXPORT int GetLibVersion()
{
    return LIB_VERSION;
}

V8_EXPORT int GetLibBackend()
{
#if WITH_NODEJS
    return puerts::JSEngineBackend::Node;
#elif WITH_QUICKJS
    return puerts::JSEngineBackend::QuickJS;
#else
    return puerts::JSEngineBackend::V8;
#endif
}

V8_EXPORT v8::Isolate *CreateJSEngine()
{
    auto JsEngine = new JSEngine(nullptr, nullptr);
    return JsEngine->MainIsolate;
}

V8_EXPORT v8::Isolate *CreateJSEngineWithExternalEnv(void* external_quickjs_runtime, void* external_quickjs_context)
{
#if WITH_QUICKJS
    auto JsEngine = new JSEngine(external_quickjs_runtime, external_quickjs_context);
    return JsEngine->MainIsolate;
#else
    return nullptr;
#endif
}

V8_EXPORT void DestroyJSEngine(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    delete JsEngine;
}

V8_EXPORT void SetGlobalFunction(v8::Isolate *Isolate, const char *Name, CSharpFunctionCallback Callback, int64_t Data)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->SetGlobalFunction(Name, Callback, Data);
}

V8_EXPORT void SetModuleResolver(v8::Isolate *Isolate, CSharpModuleResolveCallback Resolver, int32_t Idx)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->ModuleResolver = Resolver;
    JsEngine->Idx = Idx;
}

V8_EXPORT FResultInfo * ExecuteModule(v8::Isolate *Isolate, const char* Path, const char* Exportee)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    if (JsEngine->ExecuteModule(Path, Exportee))
    {
        return &(JsEngine->ResultInfo);
    }
    else
    {
        return nullptr;
    }
}

V8_EXPORT FResultInfo * Eval(v8::Isolate *Isolate, const char *Code, const char* Path)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    if (JsEngine->Eval(Code, Path))
    {
        return &(JsEngine->ResultInfo);
    }
    else
    {
        return nullptr;
    }
}

V8_EXPORT int _RegisterClass(v8::Isolate *Isolate, int BaseTypeId, const char *FullName, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->RegisterClass(FullName, BaseTypeId, Constructor, Destructor, Data, 0);
}

V8_EXPORT int RegisterStruct(v8::Isolate *Isolate, int BaseTypeId, const char *FullName, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data, int Size)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->RegisterClass(FullName, BaseTypeId, Constructor, Destructor, Data, Size);
}

V8_EXPORT int RegisterFunction(v8::Isolate *Isolate, int ClassID, const char *Name, int IsStatic, CSharpFunctionCallback Callback, int64_t Data)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->RegisterFunction(ClassID, Name, IsStatic, Callback, Data) ? 1 : 0;
}

V8_EXPORT int RegisterProperty(v8::Isolate *Isolate, int ClassID, const char *Name, int IsStatic, CSharpFunctionCallback Getter, int64_t GetterData, CSharpFunctionCallback Setter, int64_t SetterData, int DontDelete)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->RegisterProperty(ClassID, Name, IsStatic, Getter, GetterData, Setter, SetterData, DontDelete) ? 1 : 0;
}

V8_EXPORT const char* GetLastExceptionInfo(v8::Isolate *Isolate, int *Length)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    *Length = static_cast<int>(strlen(JsEngine->LastExceptionInfo.c_str()));
    return JsEngine->LastExceptionInfo.c_str();
}

V8_EXPORT void LowMemoryNotification(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->LowMemoryNotification();
}

V8_EXPORT void SetGeneralDestructor(v8::Isolate *Isolate, CSharpDestructorCallback GeneralDestructor)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->GeneralDestructor = GeneralDestructor;
}

//-------------------------- begin js call cs --------------------------
V8_EXPORT const v8::Value *GetArgumentValue(const v8::FunctionCallbackInfo<v8::Value>& Info, int Index)
{
    return *Info[Index];
}

V8_EXPORT JsValueType GetJsValueType(v8::Isolate* Isolate, const v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        if (Value->IsObject())
        {
            auto Context = Isolate->GetCurrentContext();
            auto Outer = Value->ToObject(Context).ToLocalChecked();
            auto MaybeValue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value"));
            if (MaybeValue.IsEmpty())
            {
                return puerts::NullOrUndefined;
            }
            auto Realvalue = MaybeValue.ToLocalChecked();
            return GetJsValueType(Isolate, *Realvalue, false);
        }
        else
        {
            return puerts::NullOrUndefined;
        }
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return FV8Utils::GetType(Context, Value);
    }
}

V8_EXPORT JsValueType GetArgumentType(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int Index, int IsOut)
{
    return GetJsValueType(Isolate, *Info[Index], IsOut);
}

V8_EXPORT double GetNumberFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetNumberFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return Value->NumberValue(Context).ToChecked();
    }
}

V8_EXPORT void SetNumberToOutValue(v8::Isolate* Isolate, v8::Value *Value, double Number)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), v8::Number::New(Isolate, Number));
    }
}

V8_EXPORT double GetDateFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetDateFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        return v8::Date::Cast(Value)->ValueOf();
    }
}

V8_EXPORT void SetDateToOutValue(v8::Isolate* Isolate, v8::Value *Value, double Date)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), v8::Date::New(Context, Date).ToLocalChecked());
    }
}

V8_EXPORT const char *GetStringFromValue(v8::Isolate* Isolate, v8::Value *Value, int *Length, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetStringFromValue(Isolate, *Realvalue, Length, false);
    }
    else
    {
        if (Value->IsNullOrUndefined())
        {
            *Length = 0;
            return nullptr;
        }
        auto Context = Isolate->GetCurrentContext();
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        v8::Local<v8::String> Str;
        if (!Value->ToString(Context).ToLocal(&Str)) return nullptr;
        *Length = Str->Utf8Length(Isolate);
        if (JsEngine->StrBuffer.size() < *Length + 1) JsEngine->StrBuffer.reserve(*Length + 1);
        Str->WriteUtf8(Isolate, JsEngine->StrBuffer.data());
        
        return JsEngine->StrBuffer.data();
    }
}

V8_EXPORT void SetStringToOutValue(v8::Isolate* Isolate, v8::Value *Value, const char *Str)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), FV8Utils::V8String(Isolate, Str));
    }
}

V8_EXPORT int GetBooleanFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetBooleanFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        return Value->BooleanValue(Isolate) ? 1 : 0;
    }
}

V8_EXPORT void SetBooleanToOutValue(v8::Isolate* Isolate, v8::Value *Value, int B)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), v8::Boolean::New(Isolate, B));
    }
}

V8_EXPORT int ValueIsBigInt(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return ValueIsBigInt(Isolate, *Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return Value->IsBigInt() ? 1 : 0;
    }
}

V8_EXPORT int64_t GetBigIntFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetBigIntFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return Value->ToBigInt(Context).ToLocalChecked()->Int64Value();
    }
}

V8_EXPORT void SetBigIntToOutValue(v8::Isolate* Isolate, v8::Value *Value, int64_t BigInt)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), v8::BigInt::New(Isolate, BigInt));
    }
}

V8_EXPORT const char* GetArrayBufferFromValue(v8::Isolate* Isolate, v8::Value *Value, int *Length, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetArrayBufferFromValue(Isolate, *Realvalue, Length, false);
    }
    else
    {
        if (Value->IsArrayBufferView())
        {
            v8::ArrayBufferView * BuffView = v8::ArrayBufferView::Cast(Value);
            *Length = static_cast<int>(BuffView->ByteLength());
            auto ABC = BuffView->Buffer()->GetContents();
            return static_cast<char*>(ABC.Data()) + BuffView->ByteOffset();
        }
        else if (Value->IsArrayBuffer())
        {
            auto Ab = v8::ArrayBuffer::Cast(Value);
            auto ABC = Ab->GetContents();
            *Length = static_cast<int>(ABC.ByteLength());
            return static_cast<char*>(ABC.Data());
        }
        else
        {
            return nullptr;
        }
    }
}

V8_EXPORT void SetArrayBufferToOutValue(v8::Isolate* Isolate, v8::Value *Value, unsigned char *Bytes, int Length)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        v8::Local<v8::ArrayBuffer> Ab = puerts::NewArrayBuffer(Isolate, Bytes, Length);
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), Ab);
    }
}

V8_EXPORT void *GetObjectFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetObjectFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return FV8Utils::GetPoninter(Context, Value);
    }
}

V8_EXPORT int GetTypeIdFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetTypeIdFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        if (Value->IsFunction())
        {
            auto Context = Isolate->GetCurrentContext();
            auto Function = v8::Local<v8::Function>::Cast(Value->ToObject(Context).ToLocalChecked());
            auto MaybeValue = Function->Get(Context, FV8Utils::V8String(Isolate, "$cid"));
            if (MaybeValue.IsEmpty()) return -1;
            auto Value = MaybeValue.ToLocalChecked();
            if (!Value->IsInt32()) return -1;
            return Value->Int32Value(Context).ToChecked();
        }
        else
        {
            auto Context = Isolate->GetCurrentContext();
            auto LifeCycleInfo = static_cast<FLifeCycleInfo *>(FV8Utils::GetPoninter(Context, Value, 1));
            return LifeCycleInfo ? LifeCycleInfo->ClassID : -1;
        }
    }
}

V8_EXPORT void SetObjectToOutValue(v8::Isolate* Isolate, v8::Value *Value, int ClassID, void* Ptr)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), JsEngine->FindOrAddObject(Isolate, Context, ClassID, Ptr));
    }
}

V8_EXPORT void SetNullToOutValue(v8::Isolate* Isolate, v8::Value *Value)
{
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, FV8Utils::V8String(Isolate, "value"), v8::Null(Isolate));
    }
}

V8_EXPORT JSFunction *GetFunctionFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetFunctionFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        auto Function = v8::Local<v8::Function>::Cast(Value->ToObject(Context).ToLocalChecked());
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        return JsEngine->CreateJSFunction(Isolate, Context, Function);
    }
}

V8_EXPORT puerts::JSObject *GetJSObjectFromValue(v8::Isolate* Isolate, v8::Value *Value, int IsOut)
{
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, FV8Utils::V8String(Isolate, "value")).ToLocalChecked();
        return GetJSObjectFromValue(Isolate, *Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        auto JSObject = v8::Local<v8::Object>::Cast(Value->ToObject(Context).ToLocalChecked());
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        return JsEngine->CreateJSObject(Isolate, Context, JSObject);
    }
}

V8_EXPORT void ReleaseJSFunction(v8::Isolate* Isolate, JSFunction *Function)
{
    if (Isolate && Function)
    {
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        JsEngine->ReleaseJSFunction(Function);
    }
}
V8_EXPORT void ReleaseJSObject(v8::Isolate* Isolate, puerts::JSObject *Object)
{
    if (Isolate && Object)
    {
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        JsEngine->ReleaseJSObject(Object);
    }
}

V8_EXPORT void ThrowException(v8::Isolate* Isolate, const char * Message)
{
    FV8Utils::ThrowException(Isolate, Message);
}

V8_EXPORT void ReturnClass(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int ClassID)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    Info.GetReturnValue().Set(JsEngine->GetClassConstructor(ClassID));
}

V8_EXPORT void ReturnObject(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int ClassID, void* Ptr)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    Info.GetReturnValue().Set(JsEngine->FindOrAddObject(Isolate, Isolate->GetCurrentContext(), ClassID, Ptr));
}

V8_EXPORT void ReturnNumber(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, double Number)
{
    Info.GetReturnValue().Set(Number);
}

V8_EXPORT void ReturnString(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, const char* String)
{
    Info.GetReturnValue().Set(FV8Utils::V8String(Isolate, String));
}

V8_EXPORT void ReturnBigInt(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int64_t BigInt)
{
    Info.GetReturnValue().Set(v8::BigInt::New(Isolate, BigInt));
}

V8_EXPORT void ReturnArrayBuffer(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, unsigned char *Bytes, int Length)
{
    Info.GetReturnValue().Set(puerts::NewArrayBuffer(Isolate, Bytes, Length));
}

V8_EXPORT void ReturnBoolean(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int Bool)
{
    Info.GetReturnValue().Set(Bool ? true : false);
}

V8_EXPORT void ReturnDate(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, double Date)
{
    Info.GetReturnValue().Set(v8::Date::New(Isolate->GetCurrentContext(), Date).ToLocalChecked());
}

V8_EXPORT void ReturnNull(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    Info.GetReturnValue().SetNull();
}

V8_EXPORT void ReturnFunction(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, JSFunction *Function)
{
   Info.GetReturnValue().Set(Function->GFunction.Get(Isolate));
}

V8_EXPORT void ReturnJSObject(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, puerts::JSObject *Object)
{
   Info.GetReturnValue().Set(Object->GObject.Get(Isolate));
}

//-------------------------- end js call cs --------------------------

//-------------------------- bengin cs call js --------------------------

V8_EXPORT void PushNullForJSFunction(JSFunction *Function)
{
    FValue Value;
    Value.Type = puerts::NullOrUndefined;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushDateForJSFunction(JSFunction *Function, double DateValue)
{
    FValue Value;
    Value.Type = puerts::Date;
    Value.Number = DateValue;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushBooleanForJSFunction(JSFunction *Function, int B)
{
    FValue Value;
    Value.Type = puerts::Boolean;
    Value.Boolean = B;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushBigIntForJSFunction(JSFunction *Function, int64_t V)
{
    FValue Value;
    Value.Type = puerts::BigInt;
    Value.BigInt = V;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushArrayBufferForJSFunction(JSFunction *Function, unsigned char * Bytes, int Length)
{
    auto Isolate = Function->ResultInfo.Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Function->ResultInfo.Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    FValue Value;
    Value.Type = puerts::ArrayBuffer;
    Value.ArrayBuffer.Reset(Isolate, puerts::NewArrayBuffer(Isolate, Bytes, Length));
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushStringForJSFunction(JSFunction *Function, const char* S)
{
    FValue Value;
    Value.Type = puerts::String;
    Value.Str = S;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushNumberForJSFunction(JSFunction *Function, double D)
{
    FValue Value;
    Value.Type = puerts::Number;
    Value.Number = D;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushObjectForJSFunction(JSFunction *Function, int ClassID, void* Ptr)
{
    FValue Value;
    Value.Type = puerts::NativeObject;
    Value.ObjectInfo.ClassID = ClassID;
    Value.ObjectInfo.ObjectPtr = Ptr;
    Function->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushJSFunctionForJSFunction(JSFunction *F, JSFunction *V)
{
   FValue Value;
   Value.Type = puerts::Function;
   Value.FunctionPtr = V;
   F->Arguments.push_back(std::move(Value));
}

V8_EXPORT void PushJSObjectForJSFunction(JSFunction *F, puerts::JSObject *V)
{
   FValue Value;
   Value.Type = puerts::JsObject;
   Value.JSObjectPtr = V;
   F->Arguments.push_back(std::move(Value));
}

V8_EXPORT FResultInfo *InvokeJSFunction(JSFunction *Function, int HasResult)
{
    if (Function->Invoke(HasResult))
    {
        return &(Function->ResultInfo);
    }
    else
    {
        return nullptr;
    }
}

V8_EXPORT JsValueType GetResultType(FResultInfo *ResultInfo)
{
    if (ResultInfo->Result.IsEmpty())
    {
        return puerts::NullOrUndefined;
    }
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);
    return FV8Utils::GetType(Context, *Result);
}

V8_EXPORT double GetNumberFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->NumberValue(Context).ToChecked();
}

V8_EXPORT double GetDateFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return v8::Date::Cast(*Result)->ValueOf();
}

V8_EXPORT const char *GetStringFromResult(FResultInfo *ResultInfo, int *Length)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    v8::Local<v8::String> Str;
    auto Result = ResultInfo->Result.Get(Isolate);
    if (Result->IsNullOrUndefined() || !Result->ToString(Context).ToLocal(&Str))
    {
        *Length = 0;
        return nullptr;
    }
    *Length = Str->Utf8Length(Isolate);
    if (JsEngine->StrBuffer.size() < *Length + 1) JsEngine->StrBuffer.reserve(*Length + 1);
    Str->WriteUtf8(Isolate, JsEngine->StrBuffer.data());

    return JsEngine->StrBuffer.data();
}

V8_EXPORT int GetBooleanFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->BooleanValue(Isolate) ? 1 : 0;
}

V8_EXPORT int ResultIsBigInt(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->IsBigInt() ? 1 : 0;
}

V8_EXPORT int64_t GetBigIntFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->ToBigInt(Context).ToLocalChecked()->Int64Value();
}

V8_EXPORT const char *GetArrayBufferFromResult(FResultInfo *ResultInfo, int *Length)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    auto Value = ResultInfo->Result.Get(Isolate);
    if (Value->IsArrayBufferView())
    {
        v8::Local<v8::ArrayBufferView>  BuffView = Value.As<v8::ArrayBufferView>();
        *Length = static_cast<int>(BuffView->ByteLength());
        auto ABC = BuffView->Buffer()->GetContents();
        return static_cast<char*>(ABC.Data()) + BuffView->ByteOffset();
    }
    else if (Value->IsArrayBuffer())
    {
        auto Ab = v8::Local <v8::ArrayBuffer>::Cast(Value);
        auto ABC = Ab->GetContents();
        *Length = static_cast<int>(ABC.ByteLength());
        return static_cast<char*>(ABC.Data());
    }
    else
    {
        return nullptr;
    }
}

V8_EXPORT void *GetObjectFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return FV8Utils::GetPoninter(Context, Result);
}

V8_EXPORT int GetTypeIdFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    auto LifeCycleInfo = static_cast<FLifeCycleInfo *>(FV8Utils::GetPoninter(Context, Result, 1));
    return LifeCycleInfo ? LifeCycleInfo->ClassID : -1;
}

V8_EXPORT puerts::JSObject *GetJSObjectFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    auto V8Object = v8::Local<v8::Object>::Cast(Result->ToObject(Context).ToLocalChecked());
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->CreateJSObject(Isolate, Context, V8Object);
}

V8_EXPORT JSFunction *GetFunctionFromResult(FResultInfo *ResultInfo)
{
    v8::Isolate* Isolate = ResultInfo->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    auto V8Function = v8::Local<v8::Function>::Cast(Result->ToObject(Context).ToLocalChecked());
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->CreateJSFunction(Isolate, Context, V8Function);
}

V8_EXPORT void ResetResult(FResultInfo *ResultInfo)
{
    ResultInfo->Result.Reset();
}

V8_EXPORT const char* GetFunctionLastExceptionInfo(JSFunction *Function, int *Length)
{
    *Length = static_cast<int>(strlen(Function->LastExceptionInfo.c_str()));
    return Function->LastExceptionInfo.c_str();
}

//-------------------------- end cs call js --------------------------

//-------------------------- begin debug --------------------------

V8_EXPORT void CreateInspector(v8::Isolate *Isolate, int32_t Port)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->CreateInspector(Port);
}

V8_EXPORT void DestroyInspector(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->DestroyInspector();
}

V8_EXPORT int InspectorTick(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->InspectorTick() ? 1 : 0;
}

V8_EXPORT void LogicTick(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->LogicTick();
}

//-------------------------- end debug --------------------------

#ifdef __cplusplus
}
#endif