/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include <cstring>
#include "IPuertsPlugin.h"
#include "Log.h"

#ifdef _WIN32

#ifdef BUILDING_V8_SHARED
# define PUERTS_EXPORT __declspec(dllexport)
#elif USING_V8_SHARED
# define PUERTS_EXPORT __declspec(dllimport)
#else
# define PUERTS_EXPORT
#endif  // BUILDING_V8_SHARED

#else  // _WIN32

// Setup for Linux shared library export.
#if V8_HAS_ATTRIBUTE_VISIBILITY
# ifdef BUILDING_V8_SHARED
#  define PUERTS_EXPORT __attribute__ ((visibility("default")))
# else
#  define PUERTS_EXPORT
# endif
#else
# define PUERTS_EXPORT
#endif
#endif  // _WIN32

#define API_LEVEL 33

LogCallback GLogCallback = nullptr;
LogCallback GLogWarningCallback = nullptr;
LogCallback GLogErrorCallback = nullptr;

#ifdef __cplusplus
extern "C" {
#endif

// deprecated, delete in 1.4 plz
PUERTS_EXPORT int GetLibVersion()
{
    return API_LEVEL;
}
PUERTS_EXPORT int GetApiLevel()
{
    return API_LEVEL;
}

PUERTS_EXPORT int GetLibBackend(puerts::IPuertsPlugin* plugin)
{
    return 0;
}

PUERTS_EXPORT puerts::IPuertsPlugin* CreateJSEngine(int backend)
{
#ifdef V8_BACKEND
    if (0 == backend)
    {
        return puerts::CreateV8Plugin(nullptr, nullptr);
    }
#endif

#ifdef QJS_BACKEND
    if (2 == backend)
    {
        return puerts::CreateQJSPlugin(nullptr, nullptr);
    }
#endif
    return nullptr;
}

PUERTS_EXPORT puerts::IPuertsPlugin* CreateJSEngineWithExternalEnv(int backend, void* external_quickjs_runtime, void* external_quickjs_context)
{
#if QJS_BACKEND
    if (2 == backend)
    {
        return puerts::CreateQJSPlugin(external_quickjs_runtime, external_quickjs_context);
    }
#else
    return nullptr;
#endif
}

PUERTS_EXPORT void DestroyJSEngine(puerts::IPuertsPlugin* plugin)
{
    delete plugin;
}

PUERTS_EXPORT void SetGlobalFunction(puerts::IPuertsPlugin* plugin, const char *Name, puerts::FuncPtr Callback, int64_t Data)
{
    plugin->SetGlobalFunction(Name, Callback, Data);
}

PUERTS_EXPORT void SetModuleResolver(puerts::IPuertsPlugin* plugin, puerts::FuncPtr Resolver, int32_t Idx)
{
    plugin->SetModuleResolver(Resolver, Idx);
}

PUERTS_EXPORT void* Eval(puerts::IPuertsPlugin* plugin, const char *Code, const char* Path)
{
    if (plugin->Eval(Code, Path))
    {
        return plugin->GetResultInfo();
    }
    else
    {
        return nullptr;
    }
}

PUERTS_EXPORT bool ClearModuleCache(puerts::IPuertsPlugin* plugin, const char* Path)
{
    return plugin->ClearModuleCache(Path);
}   

PUERTS_EXPORT int _RegisterClass(puerts::IPuertsPlugin* plugin, int BaseTypeId, const char *FullName, puerts::FuncPtr Constructor, puerts::FuncPtr Destructor, int64_t Data)
{
    return plugin->RegisterClass(BaseTypeId, FullName, Constructor, Destructor, Data, 0);
}

PUERTS_EXPORT int RegisterStruct(puerts::IPuertsPlugin* plugin, int BaseTypeId, const char *FullName, puerts::FuncPtr Constructor, puerts::FuncPtr Destructor, int64_t Data, int Size)
{
    return plugin->RegisterClass(BaseTypeId, FullName, Constructor, Destructor, Data, Size);
}

PUERTS_EXPORT int RegisterFunction(puerts::IPuertsPlugin* plugin, int ClassID, const char *Name, int IsStatic, puerts::FuncPtr Callback, int64_t Data)
{
    return plugin->RegisterFunction(ClassID, Name, IsStatic, Callback, Data) ? 1 : 0;
}

PUERTS_EXPORT int RegisterProperty(puerts::IPuertsPlugin* plugin, int ClassID, const char *Name, int IsStatic, puerts::FuncPtr Getter, int64_t GetterData, puerts::FuncPtr Setter, int64_t SetterData, int DontDelete)
{
    return plugin->RegisterProperty(ClassID, Name, IsStatic, Getter, GetterData, Setter, SetterData, DontDelete) ? 1 : 0;
}

PUERTS_EXPORT const char* GetLastExceptionInfo(puerts::IPuertsPlugin* plugin, int *Length)
{
    return plugin->GetLastExceptionInfo(Length);
}

PUERTS_EXPORT void LowMemoryNotification(puerts::IPuertsPlugin* plugin)
{
    plugin->LowMemoryNotification();
}
PUERTS_EXPORT bool IdleNotificationDeadline(puerts::IPuertsPlugin* plugin, double DeadlineInSeconds)
{
    return plugin->IdleNotificationDeadline(DeadlineInSeconds);
}
PUERTS_EXPORT void RequestMinorGarbageCollectionForTesting(puerts::IPuertsPlugin* plugin)
{
    plugin->RequestMinorGarbageCollectionForTesting();
}
PUERTS_EXPORT void RequestFullGarbageCollectionForTesting(puerts::IPuertsPlugin* plugin)
{
    plugin->RequestFullGarbageCollectionForTesting();
}

PUERTS_EXPORT void SetGeneralDestructor(puerts::IPuertsPlugin* plugin, puerts::FuncPtr GeneralDestructor)
{
    plugin->SetGeneralDestructor(GeneralDestructor);
}

PUERTS_EXPORT void* GetJSObjectValueGetter(puerts::IPuertsPlugin* plugin)
{
    return plugin->GetJSObjectValueGetter();
}

PUERTS_EXPORT void* GetModuleExecutor(puerts::IPuertsPlugin* plugin)
{
    return plugin->GetModuleExecutor();
}

//-------------------------- begin js call cs --------------------------
PUERTS_EXPORT const void* GetArgumentValue(puerts::IPuertsPlugin* plugin, const void* Info, int Index)
{
    return plugin->GetArgumentValue(Info, Index);
}

PUERTS_EXPORT puerts::JsValueType GetJsValueType(puerts::IPuertsPlugin* plugin, const void* Value, int IsOut)
{
    return plugin->GetJsValueType(Value, IsOut);
}

PUERTS_EXPORT puerts::JsValueType GetArgumentType(puerts::IPuertsPlugin* plugin, const void* Info, int Index, int IsOut)
{
    return plugin->GetArgumentType(Info, Index, IsOut);
}

PUERTS_EXPORT double GetNumberFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetNumberFromValue(Value, IsOut);
}

PUERTS_EXPORT void SetNumberToOutValue(puerts::IPuertsPlugin* plugin, void* Value, double Number)
{
    plugin->SetNumberToOutValue(Value, Number);
}

PUERTS_EXPORT double GetDateFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetDateFromValue(Value, IsOut);
}

PUERTS_EXPORT void SetDateToOutValue(puerts::IPuertsPlugin* plugin, void* Value, double Date)
{
    plugin->SetDateToOutValue(Value, Date);
}

PUERTS_EXPORT const char *GetStringFromValue(puerts::IPuertsPlugin* plugin, void* Value, int *Length, int IsOut)
{
    return plugin->GetStringFromValue(Value, Length, IsOut);
}

PUERTS_EXPORT void SetStringToOutValue(puerts::IPuertsPlugin* plugin, void* Value, const char *Str)
{
    plugin->SetStringToOutValue(Value, Str);
}

PUERTS_EXPORT int GetBooleanFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetBooleanFromValue(Value, IsOut);
}

PUERTS_EXPORT void SetBooleanToOutValue(puerts::IPuertsPlugin* plugin, void* Value, int B)
{
    plugin->SetBooleanToOutValue(Value, B);
}

PUERTS_EXPORT int ValueIsBigInt(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->ValueIsBigInt(Value, IsOut);
}

PUERTS_EXPORT int64_t GetBigIntFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetBigIntFromValue(Value, IsOut);
}

PUERTS_EXPORT void SetBigIntToOutValue(puerts::IPuertsPlugin* plugin, void* Value, int64_t BigInt)
{
    plugin->SetBigIntToOutValue(Value, BigInt);
}

PUERTS_EXPORT const char* GetArrayBufferFromValue(puerts::IPuertsPlugin* plugin, void* Value, int *Length, int IsOut)
{
    return plugin->GetArrayBufferFromValue(Value, Length, IsOut);
}

PUERTS_EXPORT void SetArrayBufferToOutValue(puerts::IPuertsPlugin* plugin, void* Value, unsigned char *Bytes, int Length)
{
    plugin->SetArrayBufferToOutValue(Value, Bytes, Length);
}

PUERTS_EXPORT void *GetObjectFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetObjectFromValue(Value, IsOut);
}

PUERTS_EXPORT int GetTypeIdFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetTypeIdFromValue(Value, IsOut);
}

PUERTS_EXPORT void SetObjectToOutValue(puerts::IPuertsPlugin* plugin, void* Value, int ClassID, void* Ptr)
{
    plugin->SetObjectToOutValue(Value, ClassID, Ptr);
}

PUERTS_EXPORT void SetNullToOutValue(puerts::IPuertsPlugin* plugin, void* Value)
{
    plugin->SetNullToOutValue(Value);
}

PUERTS_EXPORT void* GetFunctionFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetFunctionFromValue(Value, IsOut);
}

PUERTS_EXPORT void* GetJSObjectFromValue(puerts::IPuertsPlugin* plugin, void* Value, int IsOut)
{
    return plugin->GetJSObjectFromValue(Value, IsOut);
}

PUERTS_EXPORT void ReleaseJSFunction(puerts::IPuertsPlugin* plugin, void* Function)
{
    plugin->ReleaseJSFunction(Function);
}
PUERTS_EXPORT void ReleaseJSObject(puerts::IPuertsPlugin* plugin, void* Object)
{
    plugin->ReleaseJSObject(Object);
}

PUERTS_EXPORT void ThrowException(puerts::IPuertsPlugin* plugin, const char * Message)
{
    plugin->ThrowException(Message);
}

PUERTS_EXPORT void ReturnClass(puerts::IPuertsPlugin* plugin, const void* Info, int ClassID)
{
    plugin->ReturnClass(Info, ClassID);
}

PUERTS_EXPORT void ReturnObject(puerts::IPuertsPlugin* plugin, const void* Info, int ClassID, void* Ptr)
{
    plugin->ReturnObject(Info, ClassID, Ptr);
}

PUERTS_EXPORT void ReturnNumber(puerts::IPuertsPlugin* plugin, const void* Info, double Number)
{
    plugin->ReturnNumber(Info, Number);
}

PUERTS_EXPORT void ReturnString(puerts::IPuertsPlugin* plugin, const void* Info, const char* String)
{
    plugin->ReturnString(Info, String);
}

PUERTS_EXPORT void ReturnBigInt(puerts::IPuertsPlugin* plugin, const void* Info, int64_t BigInt)
{
    plugin->ReturnBigInt(Info, BigInt);
}

PUERTS_EXPORT void ReturnArrayBuffer(puerts::IPuertsPlugin* plugin, const void* Info, unsigned char *Bytes, int Length)
{
    plugin->ReturnArrayBuffer(Info, Bytes, Length);
}

PUERTS_EXPORT void ReturnBoolean(puerts::IPuertsPlugin* plugin, const void* Info, int Bool)
{
    plugin->ReturnBoolean(Info, Bool);
}

PUERTS_EXPORT void ReturnDate(puerts::IPuertsPlugin* plugin, const void* Info, double Date)
{
    plugin->ReturnDate(Info, Date);
}

PUERTS_EXPORT void ReturnNull(puerts::IPuertsPlugin* plugin, const void* Info)
{
    plugin->ReturnNull(Info);
}

PUERTS_EXPORT void ReturnFunction(puerts::IPuertsPlugin* plugin, const void* Info, void* Function)
{
   plugin->ReturnFunction(Info, Function);
}

PUERTS_EXPORT void ReturnCSharpFunctionCallback(puerts::IPuertsPlugin* plugin, const void* Info, puerts::FuncPtr Callback, int64_t Data)
{
    plugin->ReturnCSharpFunctionCallback(Info, Callback, Data);
}

PUERTS_EXPORT void ReturnJSObject(puerts::IPuertsPlugin* plugin, const void* Info, void* Object)
{
   plugin->ReturnJSObject(Info, Object);
}

//-------------------------- end js call cs --------------------------

//-------------------------- bengin cs call js --------------------------

PUERTS_EXPORT void PushNullForJSFunction(puerts::PuertsPluginStore* Function)
{
    Function->PuertsPlugin->PushNullForJSFunction(Function);
}

PUERTS_EXPORT void PushDateForJSFunction(puerts::PuertsPluginStore* Function, double DateValue)
{
    Function->PuertsPlugin->PushDateForJSFunction(Function, DateValue);
}

PUERTS_EXPORT void PushBooleanForJSFunction(puerts::PuertsPluginStore* Function, int B)
{
    Function->PuertsPlugin->PushBooleanForJSFunction(Function, B);
}

PUERTS_EXPORT void PushBigIntForJSFunction(puerts::PuertsPluginStore* Function, int64_t V)
{
    Function->PuertsPlugin->PushBigIntForJSFunction(Function, V);
}

PUERTS_EXPORT void PushArrayBufferForJSFunction(puerts::PuertsPluginStore* Function, unsigned char * Bytes, int Length)
{
    Function->PuertsPlugin->PushArrayBufferForJSFunction(Function, Bytes, Length);
}

PUERTS_EXPORT void PushStringForJSFunction(puerts::PuertsPluginStore* Function, const char* S)
{
    Function->PuertsPlugin->PushStringForJSFunction(Function, S);
}

PUERTS_EXPORT void PushNumberForJSFunction(puerts::PuertsPluginStore* Function, double D)
{
    Function->PuertsPlugin->PushNumberForJSFunction(Function, D);
}

PUERTS_EXPORT void PushObjectForJSFunction(puerts::PuertsPluginStore* Function, int ClassID, void* Ptr)
{
    Function->PuertsPlugin->PushObjectForJSFunction(Function, ClassID, Ptr);
}

PUERTS_EXPORT void PushJSFunctionForJSFunction(puerts::PuertsPluginStore* Function, void* V)
{
   Function->PuertsPlugin->PushJSFunctionForJSFunction(Function, V);
}

PUERTS_EXPORT void PushJSObjectForJSFunction(puerts::PuertsPluginStore* Function, void* V)
{
   Function->PuertsPlugin->PushJSObjectForJSFunction(Function, V);
}

PUERTS_EXPORT void* InvokeJSFunction(puerts::PuertsPluginStore* Function, int HasResult)
{
    return Function->PuertsPlugin->InvokeJSFunction(Function, HasResult);
}

PUERTS_EXPORT puerts::JsValueType GetResultType(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetResultType(ResultInfo);
}

PUERTS_EXPORT double GetNumberFromResult(puerts::PuertsPluginStore* ResultInfo)
{
     return ResultInfo->PuertsPlugin->GetNumberFromResult(ResultInfo);
}

PUERTS_EXPORT double GetDateFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetDateFromResult(ResultInfo);
}

PUERTS_EXPORT const char *GetStringFromResult(puerts::PuertsPluginStore* ResultInfo, int *Length)
{
    return ResultInfo->PuertsPlugin->GetStringFromResult(ResultInfo, Length);
}

PUERTS_EXPORT int GetBooleanFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetBooleanFromResult(ResultInfo);
}

PUERTS_EXPORT int ResultIsBigInt(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->ResultIsBigInt(ResultInfo);
}

PUERTS_EXPORT int64_t GetBigIntFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetBigIntFromResult(ResultInfo);
}

PUERTS_EXPORT const char *GetArrayBufferFromResult(puerts::PuertsPluginStore* ResultInfo, int *Length)
{
    return ResultInfo->PuertsPlugin->GetArrayBufferFromResult(ResultInfo, Length);
}

PUERTS_EXPORT void *GetObjectFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetObjectFromResult(ResultInfo);
}

PUERTS_EXPORT int GetTypeIdFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetTypeIdFromResult(ResultInfo);
}

PUERTS_EXPORT void* GetJSObjectFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetJSObjectFromResult(ResultInfo);
}

PUERTS_EXPORT void* GetFunctionFromResult(puerts::PuertsPluginStore* ResultInfo)
{
    return ResultInfo->PuertsPlugin->GetFunctionFromResult(ResultInfo);
}

PUERTS_EXPORT void ResetResult(puerts::PuertsPluginStore* ResultInfo)
{
    ResultInfo->PuertsPlugin->ResetResult(ResultInfo);
}

PUERTS_EXPORT const char* GetFunctionLastExceptionInfo(puerts::PuertsPluginStore* Function, int *Length)
{
    return Function->PuertsPlugin->GetFunctionLastExceptionInfo(Function, Length);
}

//-------------------------- end cs call js --------------------------

//-------------------------- begin debug --------------------------

PUERTS_EXPORT void CreateInspector(puerts::IPuertsPlugin* plugin, int32_t Port)
{
    plugin->CreateInspector(Port);
}

PUERTS_EXPORT void DestroyInspector(puerts::IPuertsPlugin* plugin)
{
    plugin->DestroyInspector();
}

PUERTS_EXPORT int InspectorTick(puerts::IPuertsPlugin* plugin)
{
    return plugin->InspectorTick() ? 1 : 0;
}

PUERTS_EXPORT void LogicTick(puerts::IPuertsPlugin* plugin)
{
    return plugin->LogicTick();
}

PUERTS_EXPORT void SetLogCallback(LogCallback Log, LogCallback LogWarning, LogCallback LogError)
{
    GLogCallback = Log;
    GLogWarningCallback = LogError;
    GLogErrorCallback = LogWarning;
}

//-------------------------- end debug --------------------------

#ifdef __cplusplus
}
#endif