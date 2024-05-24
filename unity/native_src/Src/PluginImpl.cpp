/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "IPuertsPlugin.h"
#include "JSEngine.h"

namespace PUERTS_NAMESPACE
{

class V8Plugin : public puerts::IPuertsPlugin
{
public:
    V8Plugin(void* external_quickjs_runtime, void* external_quickjs_context)
        : jsEngine(this, external_quickjs_runtime, external_quickjs_context)
    {
    }
    
    virtual ~V8Plugin() override
    {
    }
    
    virtual int GetType() override;
    
    virtual void SetGlobalFunction(const char *Name, puerts::FuncPtr Callback, int64_t Data) override;

    virtual void SetModuleResolver(puerts::FuncPtr Resolver, int32_t Idx) override;

    virtual void* Eval(const char *Code, const char* Path) override;

    virtual bool ClearModuleCache(const char* Path) override;
    
    virtual int RegisterClass(int BaseTypeId, const char *FullName, puerts::FuncPtr Constructor, puerts::FuncPtr Destructor, int64_t Data, int Size) override;
    
    virtual int RegisterFunction(int ClassID, const char *Name, int IsStatic, puerts::FuncPtr Callback, int64_t Data) override;

    virtual int RegisterProperty(int ClassID, const char *Name, int IsStatic, puerts::FuncPtr Getter, int64_t GetterData, puerts::FuncPtr Setter, int64_t SetterData, int DontDelete) override;

    virtual const char* GetLastExceptionInfo(int *Length) override;

    virtual void LowMemoryNotification() override;
    
    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) override;
    
    virtual void RequestMinorGarbageCollectionForTesting() override;
    
    virtual void RequestFullGarbageCollectionForTesting() override;


    virtual void SetGeneralDestructor(puerts::FuncPtr GeneralDestructor) override;

    virtual void* GetJSObjectValueGetter() override;

    virtual void* GetModuleExecutor() override;
    
    virtual void* GetResultInfo() override;

    virtual const char* GetJSStackTrace(int* Length) override;

    //-------------------------- begin js call cs --------------------------
    virtual void* GetArgumentValue(const void* Info, int Index) override;

    virtual puerts::JsValueType GetJsValueType(const void* Value, int IsOut) override;

    virtual puerts::JsValueType GetArgumentType(const void* Info, int Index, int IsOut) override;
    
    virtual double GetNumberFromValue(void* Value, int IsOut) override;

    virtual void SetNumberToOutValue(void* Value, double Number) override;

    virtual double GetDateFromValue(void* Value, int IsOut) override;

    virtual void SetDateToOutValue(void* Value, double Date) override;

    virtual const char *GetStringFromValue(void* Value, int *Length, int IsOut) override;

    virtual void SetStringToOutValue(void* Value, const char *Str, int size) override;

    virtual int GetBooleanFromValue(void* Value, int IsOut) override;

    virtual void SetBooleanToOutValue(void* Value, int B) override;

    virtual int ValueIsBigInt(void* Value, int IsOut) override;

    virtual int64_t GetBigIntFromValue(void* Value, int IsOut) override;

    virtual void SetBigIntToOutValue(void* Value, int64_t BigInt) override;

    virtual const char* GetArrayBufferFromValue(void* Value, int *Length, int IsOut) override;

    virtual void SetArrayBufferToOutValue(void* Value, unsigned char *Bytes, int Length) override;

    virtual void *GetObjectFromValue(void* Value, int IsOut) override;

    virtual int GetTypeIdFromValue(void* Value, int IsOut) override;

    virtual void SetObjectToOutValue(void* Value, int ClassID, void* Ptr) override;

    virtual void SetNullToOutValue(void* Value) override;

    virtual void* GetFunctionFromValue(void* Value, int IsOut) override;

    virtual void* GetJSObjectFromValue(void* Value, int IsOut) override;

    virtual void ReleaseJSFunction(void* Function) override;
    
    virtual void ReleaseJSObject(void* Object) override;

    virtual void ThrowException(const char * Message) override;

    virtual void ReturnClass(const void* Info, int ClassID) override;

    virtual void ReturnObject(const void* Info, int ClassID, void* Ptr) override;

    virtual void ReturnNumber(const void* Info, double Number) override;

    virtual void ReturnString(const void* Info, const char* String, int size) override;

    virtual void ReturnBigInt(const void* Info, int64_t BigInt) override;

    virtual void ReturnArrayBuffer(const void* Info, unsigned char *Bytes, int Length) override;

    virtual void ReturnBoolean(const void* Info, int Bool) override;

    virtual void ReturnDate(const void* Info, double Date) override;

    virtual void ReturnNull(const void* Info) override;

    virtual void ReturnFunction(const void* Info, void* Function) override;

    virtual void ReturnCSharpFunctionCallback(const void* Info, puerts::FuncPtr Callback, int64_t Data) override;

    virtual void ReturnJSObject(const void* Info, void* Object) override;
    //-------------------------- end js call cs --------------------------

    //-------------------------- bengin cs call js --------------------------

    virtual void PushNullForJSFunction(void* Function) override;

    virtual void PushDateForJSFunction(void* Function, double DateValue) override;

    virtual void PushBooleanForJSFunction(void* Function, int B) override;

    virtual void PushBigIntForJSFunction(void* Function, int64_t V) override;

    virtual void PushArrayBufferForJSFunction(void* Function, unsigned char * Bytes, int Length) override;

    virtual void PushStringForJSFunction(void* Function, const char* S, int size) override;

    virtual void PushNumberForJSFunction(void* Function, double D) override;

    virtual void PushObjectForJSFunction(void* Function, int ClassID, void* Ptr) override;

    virtual void PushJSFunctionForJSFunction(void* Function, void* V) override;

    virtual void PushJSObjectForJSFunction(void* Function, void* V) override;

    virtual void* InvokeJSFunction(void* Function, int HasResult) override;

    virtual puerts::JsValueType GetResultType(void* ResultInfo) override;

    virtual double GetNumberFromResult(void* ResultInfo) override;

    virtual double GetDateFromResult(void* ResultInfo) override;

    virtual const char *GetStringFromResult(void* ResultInfo, int *Length) override;

    virtual int GetBooleanFromResult(void* ResultInfo) override;

    virtual int ResultIsBigInt(void* ResultInfo) override;

    virtual int64_t GetBigIntFromResult(void* ResultInfo) override;

    virtual const char *GetArrayBufferFromResult(void* ResultInfo, int *Length) override;

    virtual void *GetObjectFromResult(void* ResultInfo) override;

    virtual int GetTypeIdFromResult(void* ResultInfo) override;

    virtual void* GetJSObjectFromResult(void* ResultInfo) override;

    virtual void* GetFunctionFromResult(void* ResultInfo) override;

    virtual void ResetResult(void* ResultInfo) override;

    virtual const char* GetFunctionLastExceptionInfo(void* Function, int *Length) override;

    //-------------------------- end cs call js --------------------------

    //-------------------------- begin debug --------------------------

    virtual void CreateInspector(int32_t Port) override;

    virtual void DestroyInspector() override;

    virtual int InspectorTick() override;

    virtual void LogicTick() override;

    //-------------------------- end debug --------------------------
    
private:
    PUERTS_NAMESPACE::JSEngine jsEngine;
};

int V8Plugin::GetType()
{
#ifdef V8_BACKEND
    return 0;
#endif
#ifdef QJS_BACKEND
    return 2;
#endif
}

void V8Plugin::SetGlobalFunction(const char *Name, puerts::FuncPtr Callback, int64_t Data)
{
    jsEngine.SetGlobalFunction(Name, (PUERTS_NAMESPACE::CSharpFunctionCallback)Callback, Data);
}

void V8Plugin::SetModuleResolver(puerts::FuncPtr Resolver, int32_t Idx)
{
    jsEngine.Idx = Idx; 
}

void* V8Plugin::Eval(const char *Code, const char* Path)
{
    if (jsEngine.Eval(Code, Path))
    {
        return &(jsEngine.ResultInfo);
    }
    else
    {
        return nullptr;
    }
}

bool V8Plugin::ClearModuleCache(const char* Path)
{
    return jsEngine.ClearModuleCache(Path);
}

int V8Plugin::RegisterClass(int BaseTypeId, const char *FullName, puerts::FuncPtr Constructor, puerts::FuncPtr Destructor, int64_t Data, int Size)
{
    return jsEngine.RegisterClass(FullName, BaseTypeId, (PUERTS_NAMESPACE::CSharpConstructorCallback)Constructor, (PUERTS_NAMESPACE::CSharpDestructorCallback)Destructor, Data, Size);
}

int V8Plugin::RegisterFunction(int ClassID, const char *Name, int IsStatic, puerts::FuncPtr Callback, int64_t Data)
{
    return jsEngine.RegisterFunction(ClassID, Name, IsStatic, (PUERTS_NAMESPACE::CSharpFunctionCallback)Callback, Data) ? 1 : 0;
}

int V8Plugin::RegisterProperty(int ClassID, const char *Name, int IsStatic, puerts::FuncPtr Getter, int64_t GetterData, puerts::FuncPtr Setter, int64_t SetterData, int DontDelete)
{
    return jsEngine.RegisterProperty(ClassID, Name, IsStatic, (PUERTS_NAMESPACE::CSharpFunctionCallback)Getter, GetterData, (PUERTS_NAMESPACE::CSharpFunctionCallback)Setter, SetterData, DontDelete) ? 1 : 0;
}

const char*  V8Plugin::GetLastExceptionInfo(int *Length)
{
    *Length = static_cast<int>(strlen(jsEngine.LastExceptionInfo.c_str()));
    return jsEngine.LastExceptionInfo.c_str();
}

void V8Plugin::LowMemoryNotification()
{
    jsEngine.LowMemoryNotification();
}

bool V8Plugin::IdleNotificationDeadline(double DeadlineInSeconds)
{
    return jsEngine.IdleNotificationDeadline(DeadlineInSeconds);
}

void V8Plugin::RequestMinorGarbageCollectionForTesting()
{
    jsEngine.RequestMinorGarbageCollectionForTesting();
}

void V8Plugin::RequestFullGarbageCollectionForTesting()
{
    jsEngine.RequestFullGarbageCollectionForTesting();
}

void V8Plugin::SetGeneralDestructor(puerts::FuncPtr GeneralDestructor)
{
    jsEngine.GeneralDestructor = (PUERTS_NAMESPACE::CSharpDestructorCallback)GeneralDestructor;
}

void* V8Plugin::GetJSObjectValueGetter()
{
    return jsEngine.JSObjectValueGetter;
}

void* V8Plugin::GetModuleExecutor()
{
    return jsEngine.GetModuleExecutor();
}

void* V8Plugin::GetResultInfo()
{
    return &(jsEngine.ResultInfo);
}

const char* V8Plugin::GetJSStackTrace(int* Length)
{
    std::string str = jsEngine.GetJSStackTrace();
    *Length = static_cast<int>(str.length());
    if (jsEngine.StrBuffer.size() < *Length + 1)
        jsEngine.StrBuffer.reserve(*Length + 1);
    memcpy(jsEngine.StrBuffer.data(), str.c_str(), *Length);
    return jsEngine.StrBuffer.data();
}

//-------------------------- begin js call cs --------------------------
void* V8Plugin::GetArgumentValue(const void* pInfo, int Index)
{
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    return *Info[Index];
}

puerts::JsValueType V8Plugin::GetJsValueType(const void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        if (Value->IsObject())
        {
            auto Context = Isolate->GetCurrentContext();
            auto Outer = Value->ToObject(Context).ToLocalChecked();
            auto MaybeValue = Outer->Get(Context, 0);
            if (MaybeValue.IsEmpty())
            {
                return puerts::NullOrUndefined;
            }
            auto Realvalue = MaybeValue.ToLocalChecked();
            return GetJsValueType(*Realvalue, false);
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

puerts::JsValueType V8Plugin::GetArgumentType(const void* pInfo, int Index, int IsOut)
{
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    return GetJsValueType(*Info[Index], IsOut);
}

double V8Plugin::GetNumberFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetNumberFromValue(*Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        auto maybeNumber = Value->NumberValue(Context);
        if (maybeNumber.IsNothing())
            return 0;
        return maybeNumber.ToChecked();
    }
}

void V8Plugin::SetNumberToOutValue(void* pValue, double Number)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, v8::Number::New(Isolate, Number));
    }
}

double V8Plugin::GetDateFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    v8::Value *Value = (v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetDateFromValue(*Realvalue, false);
    }
    else
    {
        return v8::Date::Cast(Value)->ValueOf();
    }
}

void V8Plugin::SetDateToOutValue(void* pValue, double Date)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, v8::Date::New(Context, Date).ToLocalChecked());
    }
}

const char *V8Plugin::GetStringFromValue(void* pValue, int *Length, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetStringFromValue(*Realvalue, Length, false);
    }
    else
    {
        if (Value->IsNullOrUndefined())
        {
            *Length = 0;
            return nullptr;
        }
        auto Context = Isolate->GetCurrentContext();
        v8::Local<v8::String> Str;
        if (!Value->ToString(Context).ToLocal(&Str)) return nullptr;
        *Length = Str->Utf8Length(Isolate);
        if (jsEngine.StrBuffer.size() < *Length + 1) jsEngine.StrBuffer.reserve(*Length + 1);
        Str->WriteUtf8(Isolate, jsEngine.StrBuffer.data());
        
        return jsEngine.StrBuffer.data();
    }
}

void V8Plugin::SetStringToOutValue(void* pValue, const char *Str, int size)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, v8::String::NewFromUtf8(Isolate, Str, v8::NewStringType::kNormal, size).ToLocalChecked());
    }
}

int V8Plugin::GetBooleanFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetBooleanFromValue(*Realvalue, false);
    }
    else
    {
        return Value->BooleanValue(Isolate) ? 1 : 0;
    }
}

void V8Plugin::SetBooleanToOutValue(void* pValue, int B)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, v8::Boolean::New(Isolate, B));
    }
}

int V8Plugin::ValueIsBigInt(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return ValueIsBigInt(*Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return Value->IsBigInt() ? 1 : 0;
    }
}

int64_t V8Plugin::GetBigIntFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetBigIntFromValue(*Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return Value->ToBigInt(Context).ToLocalChecked()->Int64Value();
    }
}

void V8Plugin::SetBigIntToOutValue(void* pValue, int64_t BigInt)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, v8::BigInt::New(Isolate, BigInt));
    }
}

const char* V8Plugin::GetArrayBufferFromValue(void* pValue, int *Length, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    v8::Value *Value = (v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetArrayBufferFromValue(*Realvalue, Length, false);
    }
    else
    {
        if (Value->IsArrayBufferView())
        {
            v8::ArrayBufferView * BuffView = v8::ArrayBufferView::Cast(Value);
            *Length = static_cast<int>(BuffView->ByteLength());
            auto ABS = BuffView->Buffer()->GetBackingStore();
            return static_cast<char*>(ABS->Data()) + BuffView->ByteOffset();
        }
        else if (Value->IsArrayBuffer())
        {
            auto Ab = v8::ArrayBuffer::Cast(Value);
            auto ABS = Ab->GetBackingStore();
            *Length = static_cast<int>(ABS->ByteLength());
            return static_cast<char*>(ABS->Data());
        }
        else
        {
            return nullptr;
        }
    }
}

void V8Plugin::SetArrayBufferToOutValue(void* pValue, unsigned char *Bytes, int Length)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        v8::Local<v8::ArrayBuffer> Ab = PUERTS_NAMESPACE::NewArrayBuffer(Isolate, Bytes, Length);
        auto ReturnVal = Outer->Set(Context, 0, Ab);
    }
}

void* V8Plugin::GetObjectFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    v8::Value *Value = (v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetObjectFromValue(*Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        return FV8Utils::GetPoninter(Context, Value);
    }
}

int V8Plugin::GetTypeIdFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    v8::Value *Value = (v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetTypeIdFromValue(*Realvalue, false);
    }
    else
    {
        if (Value->IsFunction())
        {
            auto Context = Isolate->GetCurrentContext();
            auto Function = v8::Local<v8::Function>::Cast(Value->ToObject(Context).ToLocalChecked());
            auto MaybeMap = Function->Get(Context, FV8Utils::V8String(Isolate, "__puertsMetadata"));
            if (MaybeMap.IsEmpty()) return -1;
            auto MaybeValue = v8::Local<v8::Map>::Cast(MaybeMap.ToLocalChecked())->Get(Context, FV8Utils::V8String(Isolate, "classid"));
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

void V8Plugin::SetObjectToOutValue(void* pValue, int ClassID, void* Ptr)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Object = jsEngine.FindOrAddObject(Isolate, Context, ClassID, Ptr);
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, Object);
    }
}

void V8Plugin::SetNullToOutValue(void* pValue)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (Value->IsObject())
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto ReturnVal = Outer->Set(Context, 0, v8::Null(Isolate));
    }
}

void* V8Plugin::GetFunctionFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetFunctionFromValue(*Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        auto Function = v8::Local<v8::Function>::Cast(Value->ToObject(Context).ToLocalChecked());
        return jsEngine.CreateJSFunction(Isolate, Context, Function);
    }
}

void* V8Plugin::GetJSObjectFromValue(void* pValue, int IsOut)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::Value *Value = (const v8::Value *)pValue;
    if (IsOut)
    {
        auto Context = Isolate->GetCurrentContext();
        auto Outer = Value->ToObject(Context).ToLocalChecked();
        auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
        return GetJSObjectFromValue(*Realvalue, false);
    }
    else
    {
        auto Context = Isolate->GetCurrentContext();
        auto JSObject = v8::Local<v8::Object>::Cast(Value->ToObject(Context).ToLocalChecked());
        return jsEngine.CreateJSObject(Isolate, Context, JSObject);
    }
}

void V8Plugin::ReleaseJSFunction(void* pFunction)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    if (Function)
    {
        jsEngine.ReleaseJSFunction(Function);
    }
}

void V8Plugin::ReleaseJSObject(void* pObject)
{
    PUERTS_NAMESPACE::JSObject *Object = (PUERTS_NAMESPACE::JSObject *)pObject;
    if (Object)
    {
        jsEngine.ReleaseJSObject(Object);
    }
}

void V8Plugin::ThrowException(const char * Message)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, Message);
}

void V8Plugin::ReturnClass(const void* pInfo, int ClassID)
{
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(jsEngine.GetClassConstructor(ClassID));
}

void V8Plugin::ReturnObject(const void* pInfo, int ClassID, void* Ptr)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(jsEngine.FindOrAddObject(Isolate, Isolate->GetCurrentContext(), ClassID, Ptr));
}

void V8Plugin::ReturnNumber(const void* pInfo, double Number)
{
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(Number);
}

void V8Plugin::ReturnString(const void* pInfo, const char* String, int size)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(v8::String::NewFromUtf8(Isolate, String, v8::NewStringType::kNormal, size).ToLocalChecked());
}

void V8Plugin::ReturnBigInt(const void* pInfo, int64_t BigInt)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(v8::BigInt::New(Isolate, BigInt));
}

void V8Plugin::ReturnArrayBuffer(const void* pInfo, unsigned char *Bytes, int Length)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(PUERTS_NAMESPACE::NewArrayBuffer(Isolate, Bytes, Length));
}

void V8Plugin::ReturnBoolean(const void* pInfo, int Bool)
{
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(Bool ? true : false);
}

void V8Plugin::ReturnDate(const void* pInfo, double Date)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(v8::Date::New(Isolate->GetCurrentContext(), Date).ToLocalChecked());
}

void V8Plugin::ReturnNull(const void* pInfo)
{
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().SetNull();
}

void V8Plugin::ReturnFunction(const void* pInfo, void* pFunction)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(Function->GFunction.Get(Isolate));
}

void V8Plugin::ReturnCSharpFunctionCallback(const void* pInfo, puerts::FuncPtr Callback, int64_t Data)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = jsEngine.ResultInfo.Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    Info.GetReturnValue().Set(jsEngine.ToTemplate(Isolate, false, (PUERTS_NAMESPACE::CSharpFunctionCallback)Callback, Data)->GetFunction(Context).ToLocalChecked());
}

void V8Plugin::ReturnJSObject(const void* pInfo, void* pObject)
{
    v8::Isolate* Isolate = jsEngine.MainIsolate;
    PUERTS_NAMESPACE::JSObject *Object = (PUERTS_NAMESPACE::JSObject *)pObject;
    const v8::FunctionCallbackInfo<v8::Value>& Info =  *(const v8::FunctionCallbackInfo<v8::Value>*)pInfo;
    Info.GetReturnValue().Set(Object->GObject.Get(Isolate));
}
//-------------------------- end js call cs --------------------------

//-------------------------- bengin cs call js --------------------------

void V8Plugin::PushNullForJSFunction(void* pFunction)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::NullOrUndefined;
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushDateForJSFunction(void* pFunction, double DateValue)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::Date;
    Value.Number = DateValue;
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushBooleanForJSFunction(void* pFunction, int B)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::Boolean;
    Value.Boolean = B;
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushBigIntForJSFunction(void* pFunction, int64_t V)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::BigInt;
    Value.BigInt = V;
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushArrayBufferForJSFunction(void* pFunction, unsigned char * Bytes, int Length)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    auto Isolate = Function->ResultInfo.Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Function->ResultInfo.Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    FValue Value;
    Value.Type = puerts::ArrayBuffer;
    Value.Persistent.Reset(Isolate, PUERTS_NAMESPACE::NewArrayBuffer(Isolate, Bytes, Length));
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushStringForJSFunction(void* pFunction, const char* S, int size)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::String;
    Value.Str = std::string(S, size);
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushNumberForJSFunction(void* pFunction, double D)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::Number;
    Value.Number = D;
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushObjectForJSFunction(void* pFunction, int ClassID, void* Ptr)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::NativeObject;
    auto Isolate = Function->ResultInfo.Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Function->ResultInfo.Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto localObj = jsEngine.FindOrAddObject(Isolate, Context, ClassID, Ptr);
    Value.Persistent.Reset(Isolate, localObj);
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushJSFunctionForJSFunction(void* pFunction, void* V)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::Function;
    Value.FunctionPtr = (PUERTS_NAMESPACE::JSFunction *)V; // TODO: 直接传指针安全吗？
    Function->Arguments.push_back(std::move(Value));
}

void V8Plugin::PushJSObjectForJSFunction(void* pFunction, void* V)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    FValue Value;
    Value.Type = puerts::JsObject;
    Value.JSObjectPtr = (PUERTS_NAMESPACE::JSObject *)V;
    Function->Arguments.push_back(std::move(Value));
}

void* V8Plugin::InvokeJSFunction(void* pFunction, int HasResult)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    if (Function->Invoke(HasResult))
    {
        return &(Function->ResultInfo);
    }
    else
    {
        return nullptr;
    }
}

puerts::JsValueType V8Plugin::GetResultType(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    if (ResultInfo->Result.IsEmpty())
    {
        return puerts::NullOrUndefined;
    }
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);
    return FV8Utils::GetType(Context, *Result);
}

double V8Plugin::GetNumberFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->NumberValue(Context).ToChecked();
}

double V8Plugin::GetDateFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return v8::Date::Cast(*Result)->ValueOf();
}

const char *V8Plugin::GetStringFromResult(void* pResultInfo, int *Length)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::String> Str;
    auto Result = ResultInfo->Result.Get(Isolate);
    if (Result->IsNullOrUndefined() || !Result->ToString(Context).ToLocal(&Str))
    {
        *Length = 0;
        return nullptr;
    }
    *Length = Str->Utf8Length(Isolate);
    if (jsEngine.StrBuffer.size() < *Length + 1) jsEngine.StrBuffer.reserve(*Length + 1);
    Str->WriteUtf8(Isolate, jsEngine.StrBuffer.data());

    return jsEngine.StrBuffer.data();
}

int V8Plugin::GetBooleanFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->BooleanValue(Isolate) ? 1 : 0;
}

int V8Plugin::ResultIsBigInt(void* pResultInfo) //TODO: ?
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->IsBigInt() ? 1 : 0;
}

int64_t V8Plugin::GetBigIntFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return Result->ToBigInt(Context).ToLocalChecked()->Int64Value();
}

const char *V8Plugin::GetArrayBufferFromResult(void* pResultInfo, int *Length)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    auto Value = ResultInfo->Result.Get(Isolate);
    if (Value->IsArrayBufferView())
    {
        v8::Local<v8::ArrayBufferView>  BuffView = Value.As<v8::ArrayBufferView>();
        *Length = static_cast<int>(BuffView->ByteLength());
        auto ABS = BuffView->Buffer()->GetBackingStore();
        return static_cast<char*>(ABS->Data()) + BuffView->ByteOffset();
    }
    else if (Value->IsArrayBuffer())
    {
        auto Ab = v8::Local <v8::ArrayBuffer>::Cast(Value);
        auto ABS = Ab->GetBackingStore();
        *Length = static_cast<int>(ABS->ByteLength());
        return static_cast<char*>(ABS->Data());
    }
    else
    {
        return nullptr;
    }
}

void *V8Plugin::GetObjectFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    return FV8Utils::GetPoninter(Context, Result);
}

int V8Plugin::GetTypeIdFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    auto LifeCycleInfo = static_cast<PUERTS_NAMESPACE::FLifeCycleInfo *>(FV8Utils::GetPoninter(Context, Result, 1));
    return LifeCycleInfo ? LifeCycleInfo->ClassID : -1;
}

void* V8Plugin::GetJSObjectFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    auto V8Object = v8::Local<v8::Object>::Cast(Result->ToObject(Context).ToLocalChecked());
    return jsEngine.CreateJSObject(Isolate, Context, V8Object);
}

void* V8Plugin::GetFunctionFromResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    v8::Isolate* Isolate = ResultInfo->Isolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto Result = ResultInfo->Result.Get(Isolate);

    auto V8Function = v8::Local<v8::Function>::Cast(Result->ToObject(Context).ToLocalChecked());
    return jsEngine.CreateJSFunction(Isolate, Context, V8Function);
}

void V8Plugin::ResetResult(void* pResultInfo)
{
    PUERTS_NAMESPACE::FResultInfo *ResultInfo = (PUERTS_NAMESPACE::FResultInfo *)pResultInfo;
    ResultInfo->Result.Reset();
}

const char* V8Plugin::GetFunctionLastExceptionInfo(void* pFunction, int *Length)
{
    PUERTS_NAMESPACE::JSFunction *Function = (PUERTS_NAMESPACE::JSFunction *)pFunction;
    *Length = static_cast<int>(strlen(Function->LastExceptionInfo.c_str()));
    return Function->LastExceptionInfo.c_str();
}

//-------------------------- end cs call js --------------------------

//-------------------------- begin debug --------------------------

void V8Plugin::CreateInspector(int32_t Port)
{
    jsEngine.CreateInspector(Port);
}

void V8Plugin::V8Plugin::DestroyInspector()
{
    jsEngine.DestroyInspector();
}

int V8Plugin::InspectorTick()
{
    return jsEngine.InspectorTick() ? 1 : 0;
}

void V8Plugin::LogicTick()
{
    return jsEngine.LogicTick();
}

//-------------------------- end debug --------------------------

}

namespace puerts
{
#ifdef V8_BACKEND
    IPuertsPlugin* CreateV8Plugin(void* external_quickjs_runtime, void* external_quickjs_context)
    {
        return new PUERTS_NAMESPACE::V8Plugin(external_quickjs_runtime, external_quickjs_context);
    }
#endif

#ifdef QJS_BACKEND
    IPuertsPlugin* CreateQJSPlugin(void* external_quickjs_runtime, void* external_quickjs_context)
    {
        return new PUERTS_NAMESPACE::V8Plugin(external_quickjs_runtime, external_quickjs_context);
    }
#endif
}