/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#ifndef JSENGINE_NATIVECLASS_DEFINE
#define JSENGINE_NATIVECLASS_DEFINE                                                                                                                                                                              \
private:                                                                                                                                                                                                         \
    v8::Persistent<v8::FunctionTemplate> GHandlerTemplate;                                                                                                                                                       \
    v8::Persistent<v8::Value> GJSCreateClass;                                                                                                                                                                    \
    v8::Persistent<v8::Value> GJSGetNextClassID;                                                                                                                                                                 \
    v8::Persistent<v8::Value> GJSRegisterProperty;                                                                                                                                                               \
    v8::Persistent<v8::Value> GJSRegisterFunction;                                                                                                                                                               \
    v8::Persistent<v8::Value> GJSNewObject;                                                                                                                                                                      \
    v8::Persistent<v8::Value> GJSGetClass;                                                                                                                                                                       \
    v8::Persistent<v8::Value> GJSMakeGlobalFunction;                                                                                                                                                                       \
    static const char* NativeClassesJS;                                                                                                                                                                          \
    v8::Local<v8::Object> MakeHandler(v8::Local<v8::Context> Context, v8::Puerts::CallbackFunction callback, int64_t Data, bool isStatic);                                                                                      \
public:                                                                                                                                                                                                          \
    void InitNativeClasses(v8::Local<v8::Context> Context);                                                                                                                                                      \
    int RegisterClass(const char *FullName, int BaseTypeId, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data, int Size);                                                 \
    bool RegisterFunction(int ClassID, const char *Name, bool IsStatic, v8::Puerts::CallbackFunction Callback, int64_t Data);                                                                                    \
    bool RegisterProperty(int ClassID, const char *Name, bool IsStatic, v8::Puerts::CallbackFunction Getter, int64_t GetterData, v8::Puerts::CallbackFunction Setter, int64_t SetterData, bool DontDelete);  
#endif