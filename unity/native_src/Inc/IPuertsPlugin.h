/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <stdint.h>
#include "Common.h"

namespace puerts
{

typedef void (*FuncPtr)(void);

class IPuertsPlugin
{
public:
    virtual int GetType() = 0;

    virtual void SetGlobalFunction(const char *Name, FuncPtr Callback, int64_t Data) = 0;

    virtual void SetModuleResolver(FuncPtr Resolver, int32_t Idx) = 0;

    virtual void* Eval(const char *Code, const char* Path) = 0;

    virtual bool ClearModuleCache(const char* Path) = 0;
    
    virtual int RegisterClass(int BaseTypeId, const char *FullName, FuncPtr Constructor, FuncPtr Destructor, int64_t Data, int Size) = 0;
    
    virtual int RegisterFunction(int ClassID, const char *Name, int IsStatic, FuncPtr Callback, int64_t Data) = 0;

    virtual int RegisterProperty(int ClassID, const char *Name, int IsStatic, FuncPtr Getter, int64_t GetterData, FuncPtr Setter, int64_t SetterData, int DontDelete) = 0;

    virtual const char* GetLastExceptionInfo(int *Length) = 0;

    virtual void LowMemoryNotification() = 0;
    
    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) = 0;
    
    virtual void RequestMinorGarbageCollectionForTesting() = 0;
    
    virtual void RequestFullGarbageCollectionForTesting() = 0;


    virtual void SetGeneralDestructor(FuncPtr GeneralDestructor) = 0;

    virtual void* GetJSObjectValueGetter() = 0;

    virtual void* GetModuleExecutor() = 0;
    
    virtual void* GetResultInfo() = 0;

    //-------------------------- begin js call cs --------------------------
    virtual void* GetArgumentValue(const void* Info, int Index) = 0;

    virtual JsValueType GetJsValueType(const void* Value, int IsOut) = 0;

    virtual JsValueType GetArgumentType(const void* Info, int Index, int IsOut) = 0;
    
    virtual double GetNumberFromValue(void* Value, int IsOut) = 0;

    virtual void SetNumberToOutValue(void* Value, double Number) = 0;

    virtual double GetDateFromValue(void* Value, int IsOut) = 0;

    virtual void SetDateToOutValue(void* Value, double Date) = 0;

    virtual const char *GetStringFromValue(void* Value, int *Length, int IsOut) = 0;

    virtual void SetStringToOutValue(void* Value, const char *Str) = 0;

    virtual int GetBooleanFromValue(void* Value, int IsOut) = 0;

    virtual void SetBooleanToOutValue(void* Value, int B) = 0;

    virtual int ValueIsBigInt(void* Value, int IsOut) = 0;

    virtual int64_t GetBigIntFromValue(void* Value, int IsOut) = 0;

    virtual void SetBigIntToOutValue(void* Value, int64_t BigInt) = 0;

    virtual const char* GetArrayBufferFromValue(void* Value, int *Length, int IsOut) = 0;

    virtual void SetArrayBufferToOutValue(void* Value, unsigned char *Bytes, int Length) = 0;

    virtual void *GetObjectFromValue(void* Value, int IsOut) = 0;

    virtual int GetTypeIdFromValue(void* Value, int IsOut) = 0;

    virtual void SetObjectToOutValue(void* Value, int ClassID, void* Ptr) = 0;

    virtual void SetNullToOutValue(void* Value) = 0;

    virtual void* GetFunctionFromValue(void* Value, int IsOut) = 0;

    virtual void* GetJSObjectFromValue(void* Value, int IsOut) = 0;

    virtual void ReleaseJSFunction(void* Function) = 0;
    
    virtual void ReleaseJSObject(void* Object) = 0;

    virtual void ThrowException(const char * Message) = 0;

    virtual void ReturnClass(const void* Info, int ClassID) = 0;

    virtual void ReturnObject(const void* Info, int ClassID, void* Ptr) = 0;

    virtual void ReturnNumber(const void* Info, double Number) = 0;

    virtual void ReturnString(const void* Info, const char* String) = 0;

    virtual void ReturnBigInt(const void* Info, int64_t BigInt) = 0;

    virtual void ReturnArrayBuffer(const void* Info, unsigned char *Bytes, int Length) = 0;

    virtual void ReturnBoolean(const void* Info, int Bool) = 0;

    virtual void ReturnDate(const void* Info, double Date) = 0;

    virtual void ReturnNull(const void* Info) = 0;

    virtual void ReturnFunction(const void* Info, void* Function) = 0;

    virtual void ReturnCSharpFunctionCallback(const void* Info, FuncPtr Callback, int64_t Data) = 0;

    virtual void ReturnJSObject(const void* Info, void* Object) = 0;
    //-------------------------- end js call cs --------------------------

    //-------------------------- bengin cs call js --------------------------

    virtual void PushNullForJSFunction(void* Function) = 0;

    virtual void PushDateForJSFunction(void* Function, double DateValue) = 0;

    virtual void PushBooleanForJSFunction(void* Function, int B) = 0;

    virtual void PushBigIntForJSFunction(void* Function, int64_t V) = 0;

    virtual void PushArrayBufferForJSFunction(void* Function, unsigned char * Bytes, int Length) = 0;

    virtual void PushStringForJSFunction(void* Function, const char* S) = 0;

    virtual void PushNumberForJSFunction(void* Function, double D) = 0;

    virtual void PushObjectForJSFunction(void* Function, int ClassID, void* Ptr) = 0;

    virtual void PushJSFunctionForJSFunction(void* Function, void* V) = 0;

    virtual void PushJSObjectForJSFunction(void* Function, void* V) = 0;

    virtual void* InvokeJSFunction(void* Function, int HasResult) = 0;

    virtual JsValueType GetResultType(void* ResultInfo) = 0;

    virtual double GetNumberFromResult(void* ResultInfo) = 0;

    virtual double GetDateFromResult(void* ResultInfo) = 0;

    virtual const char *GetStringFromResult(void* ResultInfo, int *Length) = 0;

    virtual int GetBooleanFromResult(void* ResultInfo) = 0;

    virtual int ResultIsBigInt(void* ResultInfo) = 0;

    virtual int64_t GetBigIntFromResult(void* ResultInfo) = 0;

    virtual const char *GetArrayBufferFromResult(void* ResultInfo, int *Length) = 0;

    virtual void *GetObjectFromResult(void* ResultInfo) = 0;

    virtual int GetTypeIdFromResult(void* ResultInfo) = 0;

    virtual void* GetJSObjectFromResult(void* ResultInfo) = 0;

    virtual void* GetFunctionFromResult(void* ResultInfo) = 0;

    virtual void ResetResult(void* ResultInfo) = 0;

    virtual const char* GetFunctionLastExceptionInfo(void* Function, int *Length) = 0;

    //-------------------------- end cs call js --------------------------

    //-------------------------- begin debug --------------------------

    virtual void CreateInspector(int32_t Port) = 0;

    virtual void DestroyInspector() = 0;

    virtual int InspectorTick() = 0;

    virtual void LogicTick() = 0;

    //-------------------------- end debug --------------------------
    
    virtual ~IPuertsPlugin()
    {
    }
};

struct PuertsPluginStore
{
    IPuertsPlugin* PuertsPlugin;
};

IPuertsPlugin* CreateV8Plugin(void* external_quickjs_runtime, void* external_quickjs_context);

IPuertsPlugin* CreateQJSPlugin(void* external_quickjs_runtime, void* external_quickjs_context);

}