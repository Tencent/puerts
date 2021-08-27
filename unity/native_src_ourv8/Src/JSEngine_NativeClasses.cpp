/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "JSEngine.h"

namespace puerts {

const char* JSEngine::NativeClassesJS = "                                               \
var global = global || (function () { return this; }());                              \
const classes = [function() { throw Error('invalid class') }];                          \
                                                                                        \
function inherit(subcls, basecls) {                                                     \
    const bridge = function () { };                                                     \
    bridge.prototype = basecls.prototype;                                               \
    subcls.prototype = new bridge();                                                    \
}                                                                                       \
                                                                                        \
const ClassManager = {                                                                  \
    getNextClassID() {                                                                  \
        return classes.length;                                                          \
    },                                                                                  \
                                                                                        \
    createClass(constructorFunction, id, baseid) {                                      \
        classes[id] = constructorFunction;                                              \
        if (baseid > 0) {                                                               \
            inherit(constructorFunction, classes[baseid]);                              \
        }                                                                               \
        return id;                                                                      \
    },                                                                                  \
                                                                                        \
    getClass(classid) {                                                                 \
        return classes[classid];                                                        \
    },                                                                                  \
                                                                                        \
    registerFunction(classid, name, static, handler) {                                  \
        if (static) {                                                                   \
            classes[classid][name] = PuertsV8.makeCallback(name, handler)               \
                                                                                        \
        } else {                                                                        \
            classes[classid].prototype[name] = PuertsV8.makeCallback(name, handler);    \
        }                                                                               \
    },                                                                                  \
                                                                                        \
    registerProperty(classid, name, static, getter, setter, dontdelete) {               \
        const accessor = {};                                                            \
        if (getter) {                                                                   \
            accessor.get = PuertsV8.makeCallback(name, getter);                         \
        }                                                                               \
        if (setter) {                                                                   \
            accessor.set = PuertsV8.makeCallback(name, setter);                         \
        }                                                                               \
        if (dontdelete) {                                                               \
            accessor.configurable = false;                                              \
        }                                                                               \
                                                                                        \
        if (static) {                                                                   \
            Object.defineProperty(classes[classid], name, accessor);                    \
                                                                                        \
        } else {                                                                        \
            Object.defineProperty(classes[classid].prototype, name, accessor);          \
                                                                                        \
        }                                                                               \
    },                                                                                  \
                                                                                        \
    newObject(classid, ...args) {                                                       \
        return new classes[classid](...args);                                           \
    },                                                                                  \
                                                                                        \
    makeGlobalFunction(name, handler) {                                                 \
        global[name] = PuertsV8.makeCallback(name, handler);                            \
    }                                                                                   \
};                                                                                      \
                                                                                        \
ClassManager;                                                                           \
";

v8::Local<v8::Object> JSEngine::MakeHandler(v8::Local<v8::Context> Context, v8::Puerts::CallbackFunction Callback, int64_t Data, bool isStatic) 
{
    v8::Local<v8::Object> handler = GHandlerTemplate
        .Get(MainIsolate)
        ->GetFunction(Context)
        .ToLocalChecked()
        ->NewInstance(Context, 0, nullptr)
        .ToLocalChecked();

    v8::Puerts::FunctionInfo* functionInfo = new v8::Puerts::FunctionInfo();
    functionInfo->callback = Callback;
    functionInfo->bindData = (void *)Data;
    functionInfo->isStatic = isStatic;

    handler->SetInternalField(0, v8::External::New(MainIsolate, (void*)functionInfo));

    return handler;
}

void JSEngine::InitNativeClasses(v8::Local<v8::Context> Context) 
{
    v8::Local<v8::FunctionTemplate> tpl = v8::FunctionTemplate::New(MainIsolate, nullptr);
    tpl->InstanceTemplate()->SetInternalFieldCount(1);//1: object id, 2: type id, 3: magic
    GHandlerTemplate.Reset(MainIsolate, tpl);

    v8::Local<v8::String> Url = FV8Utils::V8String(MainIsolate, "");
    v8::Local<v8::String> Source = FV8Utils::V8String(MainIsolate, NativeClassesJS);
    v8::ScriptOrigin Origin(Url);

    auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
    auto maybeValue = CompiledScript.ToLocalChecked()->Run(Context);//error info output

    v8::Object* JSClassManager = v8::Object::Cast(*maybeValue.ToLocalChecked());
    
    GJSCreateClass.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "createClass")).ToLocalChecked()
    );
    GJSRegisterProperty.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "registerProperty")).ToLocalChecked()
    );
    GJSRegisterFunction.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "registerFunction")).ToLocalChecked()
    );
    GJSNewObject.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "newObject")).ToLocalChecked()
    );
    GJSGetClass.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "getClass")).ToLocalChecked()
    );
    GJSGetNextClassID.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "getNextClassID")).ToLocalChecked()
    );
    GJSMakeGlobalFunction.Reset(MainIsolate, 
        JSClassManager->Get(Context, FV8Utils::V8String(MainIsolate, "makeGlobalFunction")).ToLocalChecked()
    );
}

static void NewWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.IsConstructCall())
    {
        auto Self = Info.This();
        auto LifeCycleInfo = FV8Utils::ExternalData<FLifeCycleInfo>(Info);
        void *Ptr = nullptr;
        if (Info[0]->IsExternal()) //Call by Native
        {
            Ptr = v8::Local<v8::External>::Cast(Info[0])->Value();
        }
        else // Call by js new
        {
            int length = Info.Length();
            if (LifeCycleInfo->Constructor) Ptr = LifeCycleInfo->Constructor(Isolate, v8::Puerts::FunctionCallbackInfo(Info[0], length), length, LifeCycleInfo->Data);
        }
        FV8Utils::IsolateData<JSEngine>(Isolate)->BindObject(LifeCycleInfo, Ptr, Self);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
    }
}

int JSEngine::RegisterClass(const char *FullName, int BaseClassId, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data, int Size)
{
    auto Iter = NameToTemplateID.find(FullName);
    if (Iter != NameToTemplateID.end())
    {
        return Iter->second;
    }

    v8::Isolate* Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    int ClassId = v8::Function::Cast(*GJSGetNextClassID.Get(MainIsolate))
        ->Call(Context, v8::Undefined(MainIsolate), 0, nullptr)
        .ToLocalChecked()
        ->IntegerValue(Context)
        .ToChecked();

    auto Pos = LifeCycleInfos.size();
    auto LifeCycleInfo = new FLifeCycleInfo(ClassId, Constructor, Destructor ? Destructor : GeneralDestructor, Data, Size);
    LifeCycleInfos.push_back(LifeCycleInfo);
    
    auto Template = v8::FunctionTemplate::New(Isolate, NewWrap, v8::External::New(Isolate, LifeCycleInfos[Pos]));
    
    Template->InstanceTemplate()->SetInternalFieldCount(3);//1: object id, 2: type id, 3: magic
    NameToTemplateID[FullName] = ClassId;

    v8::Function* JSRegisterClassFunction = v8::Function::Cast(*GJSCreateClass.Get(MainIsolate));
    
    v8::Local<v8::Value> args[3];
    args[0] = Template->GetFunction(Context).ToLocalChecked();
    args[1] = v8::Number::New(MainIsolate, ClassId);
    args[2] = v8::Number::New(MainIsolate, BaseClassId);
    
    JSRegisterClassFunction // registerClass(constructorFunction, id, baseid)
        ->Call(Context, Context->Global(), 3, args)
        .ToLocalChecked();
    
    return ClassId;
}

bool JSEngine::RegisterFunction(int ClassID, const char *Name, bool IsStatic, v8::Puerts::CallbackFunction Callback, int64_t Data)
{
    v8::Isolate::Scope IsolateScope(MainIsolate);
    v8::HandleScope HandleScope(MainIsolate);
    v8::Local<v8::Context> Context = ResultInfo.Context.Get(MainIsolate);
    v8::Context::Scope ContextScope(Context);
    
    v8::Function* JSRegisterFunctionFunction = v8::Function::Cast(*GJSRegisterFunction.Get(MainIsolate));
    
    v8::Local<v8::Object> handler = MakeHandler(Context, Callback, Data, IsStatic);

    v8::Local<v8::Value> args[4];
    args[0] = v8::Number::New(MainIsolate, ClassID);
    args[1] = FV8Utils::V8String(MainIsolate, Name);
    args[2] = v8::Boolean::New(MainIsolate, IsStatic);
    args[3] = handler;

    JSRegisterFunctionFunction // registerFunction(classid, name, static, handler) {  
        ->Call(Context, Context->Global(), 4, args)
        .ToLocalChecked();

    return true;
}

bool JSEngine::RegisterProperty(int ClassID, const char *Name, bool IsStatic, v8::Puerts::CallbackFunction Getter, int64_t GetterData, v8::Puerts::CallbackFunction Setter, int64_t SetterData, bool DontDelete)
{
    v8::Isolate::Scope IsolateScope(MainIsolate);
    v8::HandleScope HandleScope(MainIsolate);
    v8::Local<v8::Context> Context = ResultInfo.Context.Get(MainIsolate);
    v8::Context::Scope ContextScope(Context);

    v8::Function* JSRegisterPropertyFunction = v8::Function::Cast(*GJSRegisterProperty.Get(MainIsolate));
    
    v8::Local<v8::Object> getterHandler = MakeHandler(Context, Getter, GetterData, IsStatic);
    v8::Local<v8::Object> setterHandler = MakeHandler(Context, Setter, SetterData, IsStatic);

    v8::Local<v8::Value> args[6];
    args[0] = v8::Number::New(MainIsolate, ClassID);
    args[1] = FV8Utils::V8String(MainIsolate, Name);
    args[2] = v8::Boolean::New(MainIsolate, IsStatic);
    args[3] = getterHandler;
    args[4] = setterHandler;
    args[5] = v8::Boolean::New(MainIsolate, DontDelete);

    JSRegisterPropertyFunction // registerProperty(classid, name, static, getter, setter, dontdelete) 
        ->Call(Context, Context->Global(), 6, args)
        .ToLocalChecked();

    return true;
}
void JSEngine::SetGlobalFunction(
    const char *Name, 
    CSharpFunctionCallback Callback, 
    int64_t Data
)
{
    v8::Isolate* Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::Object> handler = MakeHandler(
        Context, Callback, Data, true
    );

    v8::Local<v8::Value> args[2];
    args[0] = FV8Utils::V8String(MainIsolate, Name);
    args[1] = handler;

    v8::Function* JSMakeGlobalFunction = v8::Function::Cast(*GJSMakeGlobalFunction.Get(MainIsolate));

    JSMakeGlobalFunction
        ->Call(Context, Context->Global(), 2, args)
        .ToLocalChecked();
}
}