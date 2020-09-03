/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSEngine.h"
#include "V8Utils.h"
#include "Log.h"
#include <memory>

namespace puerts
{
    typedef void(*FreeCallback)(char* Data);

    class ObjectLifeCycleTrace
    {
    public:
        inline ObjectLifeCycleTrace(v8::Isolate* InIsolate,
            v8::Local<v8::Object> InObject,
            FreeCallback InCallback,
            char* InData)
            : Persistent(InIsolate, InObject),
            Callback(InCallback),
            Data(InData)
        {
            Persistent.SetWeak(this, WeakCallback, v8::WeakCallbackType::kParameter);
            InIsolate->AdjustAmountOfExternalAllocatedMemory(sizeof(*this));
        }
    private:
        static void WeakCallback(const v8::WeakCallbackInfo<ObjectLifeCycleTrace>& Info)
        {
            ObjectLifeCycleTrace* Self = Info.GetParameter();
            Self->WeakCallback(Info.GetIsolate());
            delete Self;
        }

        inline void WeakCallback(v8::Isolate* InIsolate)
        {
            Callback(Data);
            int64_t ChangeInBytes = -static_cast<int64_t>(sizeof(*this));
            InIsolate->AdjustAmountOfExternalAllocatedMemory(ChangeInBytes);
        }

    private:
        v8::Global<v8::Object> Persistent;
        FreeCallback const Callback;
        char* const Data;
    };

    static void Free(char* Data)
    {
        ::free(Data);
    }

    v8::Local<v8::ArrayBuffer> NewArrayBuffer(v8::Isolate* Isolate, void *Ptr, size_t Size, bool Copy)
    {
        void *Data = Ptr;

        if (Copy)
        {
            Data = ::malloc(Size);
            ::memcpy(Data, Ptr, Size);
        }

        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, Data, Size);
        new ObjectLifeCycleTrace(Isolate, Ab, Free, static_cast<char*>(Data));
        return Ab;
    }

    static void EvalWithPath(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        if (Info.Length() != 2 || !Info[0]->IsString() || !Info[1]->IsString())
        {
            FV8Utils::ThrowException(Isolate, "invalid argument for evalScript");
            return;
        }

        v8::Local<v8::String> Source = Info[0]->ToString(Context).ToLocalChecked();
        v8::Local<v8::String> Name = Info[1]->ToString(Context).ToLocalChecked();
        v8::ScriptOrigin Origin(Name);
        auto Script = v8::Script::Compile(Context, Source, &Origin);
        if (Script.IsEmpty())
        {
            return;
        }
        auto Result = Script.ToLocalChecked()->Run(Context);
        if (Result.IsEmpty())
        {
            return;
        }
        Info.GetReturnValue().Set(Result.ToLocalChecked());
    }

    JSEngine::JSEngine()
    {
        GeneralDestructor = nullptr;
        Inspector = nullptr;
        if (!GPlatform)
        {
            GPlatform = v8::platform::NewDefaultPlatform();
            v8::V8::InitializePlatform(GPlatform.get());
            v8::V8::Initialize();
        }
#if PLATFORM_IOS
        std::string Flags = "--jitless";
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
#endif

#if PLATFORM_ANDROID
        std::string Flags = "--trace-gc-object-stats";
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
#endif

        if (!NativesBlob)
        {
            NativesBlob = std::make_unique<v8::StartupData>();
            NativesBlob->data = (const char *)NativesBlobCode;
            NativesBlob->raw_size = sizeof(NativesBlobCode);
        }
        if (!SnapshotBlob)
        {
            SnapshotBlob = std::make_unique<v8::StartupData>();//TODO: 直接用局部变量就可以了吧？
            SnapshotBlob->data = (const char *)SnapshotBlobCode;
            SnapshotBlob->raw_size = sizeof(SnapshotBlobCode);
        }

        // 初始化Isolate和DefaultContext
        v8::V8::SetNativesDataBlob(NativesBlob.get());
        v8::V8::SetSnapshotDataBlob(SnapshotBlob.get());

        CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
        MainIsolate = v8::Isolate::New(CreateParams);
        auto Isolate = MainIsolate;
        ResultInfo.Isolate = MainIsolate;
        Isolate->SetData(0, this);

        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);

        v8::Local<v8::Context> Context = v8::Context::New(Isolate);
        ResultInfo.Context.Reset(Isolate, Context);
        v8::Local<v8::Object> Global = Context->Global();

        Global->Set(Context, FV8Utils::V8String(Isolate, "__tgjsEvalScript"), v8::FunctionTemplate::New(Isolate, &EvalWithPath)->GetFunction(Context).ToLocalChecked()).Check();
    }

    JSEngine::~JSEngine()
    {
        if (Inspector)
        {
            delete Inspector;
            Inspector = nullptr;
        }

        for (int i = 0; i < Templates.size(); ++i)
        {
            Templates[i].Reset();
        }

        {
            auto Isolate = MainIsolate;
            v8::Isolate::Scope Isolatescope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = ResultInfo.Context.Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            for (auto Iter = ObjectMap.begin(); Iter != ObjectMap.end(); ++Iter)
            {
                auto Value = Iter->second.Get(MainIsolate);
                if (Value->IsObject())
                {
                    auto Object = Value->ToObject(Context).ToLocalChecked();
                    auto LifeCycleInfo = static_cast<FLifeCycleInfo *>(FV8Utils::GetPoninter(Object, 1));
                    if (LifeCycleInfo && LifeCycleInfo->Size > 0)
                    {
                        auto Ptr = FV8Utils::GetPoninter(Object);
                        free(Ptr);
                    }
                }
                Iter->second.Reset();
            }
        }

        {
            std::lock_guard<std::mutex> guard(JSFunctionsMutex);
            for (auto Iter = JSFunctions.begin(); Iter != JSFunctions.end(); ++Iter)
            {
                delete *Iter;
            }
        }

        ResultInfo.Context.Reset();
        MainIsolate->Dispose();
        MainIsolate = nullptr;
        delete CreateParams.array_buffer_allocator;

        for (int i = 0; i < CallbackInfos.size(); ++i)
        {
            delete CallbackInfos[i];
        }

        for (int i = 0; i < LifeCycleInfos.size(); ++i)
        {
            delete LifeCycleInfos[i];
        }

        for (int i = 0; i < IndexedInfos.size(); ++i)
        {
            delete IndexedInfos[i];
        }
    }

    JSFunction* JSEngine::CreateJSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction)
    {
        std::lock_guard<std::mutex> guard(JSFunctionsMutex);
        JSFunction* Function = new JSFunction(InIsolate, InContext, InFunction);
        JSFunctions.insert(Function);
        return Function;
    }

    void JSEngine::ReleaseJSFunction(JSFunction* InFunction)
    {
        std::lock_guard<std::mutex> guard(JSFunctionsMutex);
        auto Iter = JSFunctions.find(InFunction);
        if (Iter != JSFunctions.end())
        {
            JSFunctions.erase(Iter);
            delete InFunction;
        }
    }

    static void CSharpFunctionCallbackWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        FCallbackInfo* CallbackInfo = reinterpret_cast<FCallbackInfo*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

        void* Ptr = CallbackInfo->IsStatic ? nullptr : FV8Utils::GetPoninter(Info.Holder());

        CallbackInfo->Callback(Isolate, Info, Ptr, Info.Length(), CallbackInfo->Data);
    }

    static void CSharpIndexedGetterWrap(uint32_t Index, const v8::PropertyCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        FIndexedInfo* IndexedInfo = reinterpret_cast<FIndexedInfo*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        IndexedInfo->Getter(Isolate, Info, FV8Utils::GetPoninter(Info.This()), Index, IndexedInfo->Data);
    }

    static void CSharpIndexedSetterWrap(
        uint32_t Index,
        v8::Local<v8::Value> Value,
        const v8::PropertyCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        FIndexedInfo* IndexedInfo = reinterpret_cast<FIndexedInfo*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        IndexedInfo->Setter(Isolate, Info, FV8Utils::GetPoninter(Info.This()), Index, *Value, IndexedInfo->Data);
    }

    v8::Local<v8::FunctionTemplate> JSEngine::ToTemplate(v8::Isolate* Isolate, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data)
    {
        auto Pos = CallbackInfos.size();
        auto CallbackInfo = new FCallbackInfo(IsStatic, Callback, Data);
        CallbackInfos.push_back(CallbackInfo);
        return v8::FunctionTemplate::New(Isolate, CSharpFunctionCallbackWrap, v8::External::New(Isolate, CallbackInfos[Pos]));
    }

    void JSEngine::SetGlobalFunction(const char *Name, CSharpFunctionCallback Callback, int64_t Data)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::Object> Global = Context->Global();

        Global->Set(Context, FV8Utils::V8String(Isolate, Name), ToTemplate(Isolate, true, Callback, Data)->GetFunction(Context).ToLocalChecked()).Check();
    }

    bool JSEngine::Eval(const char *Code, const char* Path)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::String> Url = FV8Utils::V8String(Isolate, Path == nullptr ? "" : Path);
        v8::Local<v8::String> Source = FV8Utils::V8String(Isolate, Code);
        v8::ScriptOrigin Origin(Url);
        v8::TryCatch TryCatch(Isolate);

        auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
        if (CompiledScript.IsEmpty())
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }
        auto maybeValue = CompiledScript.ToLocalChecked()->Run(Context);//error info output
        if (TryCatch.HasCaught())
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }

        if (!maybeValue.IsEmpty())
        {
            ResultInfo.Result.Reset(Isolate, maybeValue.ToLocalChecked());
        }

        return true;
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
                if (LifeCycleInfo->Constructor) Ptr = LifeCycleInfo->Constructor(Isolate, Info, Info.Length(), LifeCycleInfo->Data);
            }
            FV8Utils::IsolateData<JSEngine>(Isolate)->BindObject(LifeCycleInfo, Ptr, Self);
        }
        else
        {
            FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
        }
    }

    static void OnGarbageCollected(const v8::WeakCallbackInfo<FLifeCycleInfo>& Data)
    {
        FV8Utils::IsolateData<JSEngine>(Data.GetIsolate())->UnBindObject(Data.GetParameter(), Data.GetInternalField(0));
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

        int ClassId = static_cast<int>(Templates.size());

        auto Pos = LifeCycleInfos.size();
        auto LifeCycleInfo = new FLifeCycleInfo(ClassId, Constructor, Destructor ? Destructor : GeneralDestructor, Data, Size);
        LifeCycleInfos.push_back(LifeCycleInfo);
        
        auto Template = v8::FunctionTemplate::New(Isolate, NewWrap, v8::External::New(Isolate, LifeCycleInfos[Pos]));
        
        Template->InstanceTemplate()->SetInternalFieldCount(3);//1: object id, 2: type id, 3: magic
        Templates.push_back(v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template));
        NameToTemplateID[FullName] = ClassId;

        if (BaseClassId >= 0)
        {
            Template->Inherit(Templates[BaseClassId].Get(Isolate));
        }
        return ClassId;
    }

    bool JSEngine::RegisterFunction(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (ClassID >= Templates.size()) return false;

        if (IsStatic)
        {
            Templates[ClassID].Get(Isolate)->Set(FV8Utils::V8String(Isolate, Name), ToTemplate(Isolate, IsStatic, Callback, Data));
        }
        else
        {
            Templates[ClassID].Get(Isolate)->PrototypeTemplate()->Set(FV8Utils::V8String(Isolate, Name), ToTemplate(Isolate, IsStatic, Callback, Data));
        }

        return true;
    }

    bool JSEngine::RegisterProperty(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Getter, int64_t GetterData, CSharpFunctionCallback Setter, int64_t SetterData)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (ClassID >= Templates.size()) return false;

        auto Attr = (Setter == nullptr) ? (v8::PropertyAttribute)(v8::DontDelete | v8::ReadOnly) : v8::DontDelete;

        if (IsStatic)
        {
            Templates[ClassID].Get(Isolate)->SetAccessorProperty(FV8Utils::V8String(Isolate, Name), ToTemplate(Isolate, IsStatic, Getter, GetterData)
                , Setter == nullptr ? v8::Local<v8::FunctionTemplate>() : ToTemplate(Isolate, IsStatic, Setter, SetterData), Attr);
        }
        else
        {
            Templates[ClassID].Get(Isolate)->PrototypeTemplate()->SetAccessorProperty(FV8Utils::V8String(Isolate, Name), ToTemplate(Isolate, IsStatic, Getter, GetterData)
                , Setter == nullptr ? v8::Local<v8::FunctionTemplate>() : ToTemplate(Isolate, IsStatic, Setter, SetterData), Attr);
        }

        return true;
    }

    bool JSEngine::RegisterIndexedProperty(int ClassID, CSharpIndexedGetterCallback Getter, CSharpIndexedSetterCallback Setter, int64_t Data)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (ClassID >= Templates.size()) return false;

        auto Pos = IndexedInfos.size();
        auto IndexedInfo = new FIndexedInfo(Getter, Setter, Data);
        IndexedInfos.push_back(IndexedInfo);

        Templates[ClassID].Get(Isolate)->PrototypeTemplate()->SetHandler(v8::IndexedPropertyHandlerConfiguration(
            CSharpIndexedGetterWrap, CSharpIndexedSetterWrap, nullptr, nullptr, nullptr, v8::External::New(Isolate, IndexedInfos[Pos])));

        return true;
    }

    v8::Local<v8::Value> JSEngine::GetClassConstructor(int ClassID)
    {
        v8::Isolate* Isolate = MainIsolate;
        if (ClassID >= Templates.size()) return v8::Undefined(Isolate);

        auto Context = Isolate->GetCurrentContext();

        auto Result = Templates[ClassID].Get(Isolate)->GetFunction(Context).ToLocalChecked();
        Result->Set(Context, FV8Utils::V8String(Isolate, "$cid"), v8::Integer::New(Isolate, ClassID));
        return Result;
    }

    v8::Local<v8::Value> JSEngine::FindOrAddObject(v8::Isolate* Isolate, v8::Local<v8::Context> Context, int ClassID, void *Ptr)
    {
        if (!Ptr)
        {
            return v8::Undefined(Isolate);
        }

        auto Iter = ObjectMap.find(Ptr);
        if (Iter == ObjectMap.end())//create and link
        {
            auto BindTo = v8::External::New(Context->GetIsolate(), Ptr);
            v8::Handle<v8::Value> Args[] = { BindTo };
            return Templates[ClassID].Get(Isolate)->GetFunction(Context).ToLocalChecked()->NewInstance(Context, 1, Args).ToLocalChecked();
        }
        else
        {
            return v8::Local<v8::Value>::New(Isolate, Iter->second);
        }
    }

    void JSEngine::BindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr, v8::Local<v8::Object> JSObject)
    {
        if (LifeCycleInfo->Size > 0)
        {
            void *Val = malloc(LifeCycleInfo->Size);
            if (Ptr != nullptr)
            {
                memcpy(Val, Ptr, LifeCycleInfo->Size);
            }
            JSObject->SetAlignedPointerInInternalField(0, Val);
            Ptr = Val;
        }
        else
        {
            JSObject->SetAlignedPointerInInternalField(0, Ptr);
        }
        
        JSObject->SetAlignedPointerInInternalField(1, LifeCycleInfo);
        JSObject->SetAlignedPointerInInternalField(2, reinterpret_cast<void *>(OBJECT_MAGIC));
        ObjectMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
        ObjectMap[Ptr].SetWeak<FLifeCycleInfo>(LifeCycleInfo, OnGarbageCollected, v8::WeakCallbackType::kInternalFields);
    }

    void JSEngine::UnBindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr)
    {
        ObjectMap.erase(Ptr);

        if (LifeCycleInfo->Size > 0)
        {
            free(Ptr);
        }
        else
        {
            if (LifeCycleInfo->Destructor)
            {
                LifeCycleInfo->Destructor(Ptr, LifeCycleInfo->Data);
            }
        }
    }

    void JSEngine::LowMemoryNotification()
    {
        MainIsolate->LowMemoryNotification();
    }

    void JSEngine::CreateInspector(int32_t Port)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (Inspector == nullptr)
        {
            Inspector = CreateV8Inspector(Port, &Context);
        }
    }

    void JSEngine::DestroyInspector()
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (Inspector != nullptr)
        {
            delete Inspector;
            Inspector = nullptr;
        }
    }

    bool JSEngine::InspectorTick()
    {
        if (Inspector != nullptr)
        {
            return Inspector->Tick();
        }
        return true;
    }
}
