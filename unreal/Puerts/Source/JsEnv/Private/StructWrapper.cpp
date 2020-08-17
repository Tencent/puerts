/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "StructWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"

namespace puerts
{
    void FStructWrapper::AddExtensionMethods(std::vector<UFunction*> InExtensionMethods)
    {
        ExtensionMethods.insert(ExtensionMethods.end(), InExtensionMethods.begin(), InExtensionMethods.end());
    }

    void FStructWrapper::InitTemplateProperties(v8::Isolate* Isolate, UStruct *InStruct, v8::Local<v8::FunctionTemplate> Template)
    {
        auto ClassDefinition = FindClassByType(Struct);
        TSet<FString> AddedProperties;
        if (ClassDefinition)
        {
            JSPropertyInfo* PropertyInfo = ClassDefinition->Propertys;
            while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
            {
                AddedProperties.Add(UTF8_TO_TCHAR(PropertyInfo->Name));
                v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
                if (!PropertyInfo->Setter) PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
                Template->PrototypeTemplate()->SetAccessor(FV8Utils::InternalString(Isolate, PropertyInfo->Name), PropertyInfo->Getter, PropertyInfo->Setter,
                    v8::Local<v8::Value>(), v8::DEFAULT, PropertyAttribute);
                ++PropertyInfo;
            }
        }
        for (TFieldIterator<PropertyMacro> PropertyIt(InStruct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
        {
            PropertyMacro *Property = *PropertyIt;
            if (AddedProperties.Contains(Property->GetName()))
            {
                continue;
            }
            auto PropertyTranslator = FPropertyTranslator::Create(Property);
            if (PropertyTranslator)
            {
                PropertyTranslator->SetAccessor(Isolate, Template);
                Properties.push_back(std::move(PropertyTranslator));
            }
            else
            {
                //UE_LOG(LogTemp, Warning, TEXT("%s:%s not supported"), *Property->GetOwnerStruct()->GetName(), *Property->GetName());
            }
        }
    }

    v8::Local<v8::FunctionTemplate> FStructWrapper::ToFunctionTemplate(v8::Isolate* Isolate, v8::FunctionCallback Construtor)
    {
        v8::EscapableHandleScope HandleScope(Isolate);
        auto ClassDefinition = FindClassByType(Struct);
        auto Result = v8::FunctionTemplate::New(Isolate, Construtor, v8::External::New(Isolate, this)); //和class的区别就这里传的函数不一样，后续尽量重用
        Result->InstanceTemplate()->SetInternalFieldCount(4);

        TSet<FString> AddedMethods;
        TSet<FString> AddedFunctions;

        if (ClassDefinition)
        {
            ExternalInitialize = ClassDefinition->Initialize;
            JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
                AddedMethods.Add(UTF8_TO_TCHAR(FunctionInfo->Name));
                Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name), v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback));
                ++FunctionInfo;
            }
            FunctionInfo = ClassDefinition->Functions;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
                AddedFunctions.Add(UTF8_TO_TCHAR(FunctionInfo->Name));
                Result->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name), v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback));
                ++FunctionInfo;
            }
        }

        InitTemplateProperties(Isolate, Struct, Result);

        if (Struct->IsA<UClass>())
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if ((Function->HasAnyFunctionFlags(FUNC_Static) && AddedFunctions.Contains(Function->GetName())) 
                    || (!Function->HasAnyFunctionFlags(FUNC_Static) && AddedMethods.Contains(Function->GetName())))
                {
                    //UE_LOG(LogTemp, Warning, TEXT("%s added"), *Function->GetName());
                    continue;
                }

                auto FunctionTranslator = std::make_unique<FFunctionTranslator>(Function);

                auto Key = FV8Utils::InternalString(Isolate, Function->GetName());

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    Result->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
                }
                else
                {
                    Result->PrototypeTemplate()->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
                }
                Functions.push_back(std::move(FunctionTranslator));
            }

            Result->Set(FV8Utils::InternalString(Isolate, "Find"), v8::FunctionTemplate::New(Isolate, Find, v8::External::New(Isolate, this)));
            Result->Set(FV8Utils::InternalString(Isolate, "Load"), v8::FunctionTemplate::New(Isolate, Load, v8::External::New(Isolate, this)));
        }

        for (auto Iter = ExtensionMethods.begin(); Iter != ExtensionMethods.end(); ++Iter)
        {
            UFunction* Function = *Iter;

            auto FunctionTranslator = std::make_unique<FExtensionMethodTranslator>(Function);

            auto Key = FV8Utils::InternalString(Isolate, Function->GetName());

            Result->PrototypeTemplate()->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));

            Functions.push_back(std::move(FunctionTranslator));
        }

        Result->Set(FV8Utils::InternalString(Isolate, "StaticClass"), v8::FunctionTemplate::New(Isolate, StaticClass, v8::External::New(Isolate, this)));

        

        return HandleScope.Escape(Result);
    }

    void FStructWrapper::StaticClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        FStructWrapper * This = reinterpret_cast<FStructWrapper *>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

        auto Result = FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, This->Struct->GetClass(), This->Struct);
        Info.GetReturnValue().Set(Result);
    }

    void FStructWrapper::Find(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        FStructWrapper * This = reinterpret_cast<FStructWrapper *>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

        UClass *Class = Cast<UClass>(This->Struct);

        if (Class && Info.Length() >= 1 && Info[0]->IsString())
        {
            UObject *Outer = ANY_PACKAGE;

            if (Info.Length() > 1)
            {
                Outer = FV8Utils::GetUObject(Context, Info[1]);
            }

            auto Object = StaticFindObject(Class, Outer, *FV8Utils::ToFString(Isolate, Info[0]), false);
            if (Object)
            {
                auto Result = FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Object->GetClass(), Object);
                Info.GetReturnValue().Set(Result);
            }
            else
            {
                Info.GetReturnValue().Set(v8::Undefined(Isolate));
            }
        }
        else
        {
            FV8Utils::ThrowException(Isolate, "invalid argument");
        }
    }

    void FStructWrapper::Load(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        FStructWrapper * This = reinterpret_cast<FStructWrapper *>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

        UClass *Class = Cast<UClass>(This->Struct);

        if (Class && Info.Length() == 1 && Info[0]->IsString())
        {
            auto Object = StaticLoadObject(Class, nullptr, *FV8Utils::ToFString(Isolate, Info[0]));
            if (Object)
            {
                auto Result = FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Object->GetClass(), Object);
                Info.GetReturnValue().Set(Result);
            }
            else
            {
                Info.GetReturnValue().Set(v8::Undefined(Isolate));
            }
        }
        else
        {
            FV8Utils::ThrowException(Isolate, "invalid argument");
        }
    }

    v8::Local<v8::FunctionTemplate> FScriptStructWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
    {
        return FStructWrapper::ToFunctionTemplate(Isolate, New);
    }

    void FScriptStructWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        FScriptStructWrapper * This = reinterpret_cast<FScriptStructWrapper *>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        This->New(Isolate, Context, Info);
    }

    void FScriptStructWrapper::New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        if (Info.IsConstructCall())
        {
            auto Self = Info.This();
            void *Memory = nullptr;

            bool PassByPointer = false;

            if (Info.Length() == 2 && Info[0]->IsExternal()) //Call by Native
            {
                Memory = v8::Local<v8::External>::Cast(Info[0])->Value();
                PassByPointer = Info[1]->BooleanValue(Isolate);
            }
            else
            {
                if (ExternalInitialize)
                {
                    Memory = ExternalInitialize(Info);
                }
                else
                {
                    Memory = Alloc(ScriptStruct);
                    for (int i = 0; i < Properties.size(); ++i)
                    {
                        Properties[i]->JsToUEInContainer(Isolate, Context, Info[i], Memory, false);
                    }
                }
            }
            FV8Utils::IsolateData<IObjectMapper>(Isolate)->BindStruct(ScriptStruct, Memory, Self, PassByPointer);
        }
        else
        {
            FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
        }
    }

    void * FScriptStructWrapper::Alloc(UScriptStruct *InScriptStruct)
    {
        UScriptStruct::ICppStructOps *CppStructOps = InScriptStruct->GetCppStructOps();
        int32 Alignment = CppStructOps ? CppStructOps->GetAlignment() : InScriptStruct->GetMinAlignment();
        void *ScriptStructMemory = FMemory::Malloc(InScriptStruct->GetStructureSize(), Alignment);
        InScriptStruct->InitializeStruct(ScriptStructMemory);
        return ScriptStructMemory;
    }

    void FScriptStructWrapper::OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<UScriptStruct>& Data)
    {
        UScriptStruct *ScriptStruct = Data.GetParameter();
        void *ScriptStructMemory = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindStruct(ScriptStruct, ScriptStructMemory);
        ScriptStruct->DestroyStruct(ScriptStructMemory);
        FMemory::Free(ScriptStructMemory);
    }

    void  FScriptStructWrapper::OnGarbageCollected(const v8::WeakCallbackInfo<UScriptStruct>& Data)
    {
        UScriptStruct *ScriptStruct = Data.GetParameter();
        void *ScriptStructMemory = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindStruct(ScriptStruct, ScriptStructMemory);
    }

    v8::Local<v8::FunctionTemplate> FClassWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
    {
        return FStructWrapper::ToFunctionTemplate(Isolate, New);
    }

    void FClassWrapper::OnGarbageCollected(const v8::WeakCallbackInfo<UClass>& Data)
    {
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBind(Data.GetParameter(), reinterpret_cast<UObject*>(DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1))));
    }


    void FClassWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        FClassWrapper * This = reinterpret_cast<FClassWrapper *>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        This->New(Isolate, Context, Info);
    }

    void FClassWrapper::New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        if (Info.IsConstructCall())
        {
            auto Self = Info.This();

            UObject* Object = nullptr;

            
            if (Info.Length() == 1 && Info[0]->IsExternal()) //Call by Native
            {
                Object = reinterpret_cast<UObject*>(v8::Local<v8::External>::Cast(Info[0])->Value());
                if (!Object->IsValidLowLevel())
                {
                    Object = nullptr;
                }
            }
            else // Call by js new
            {
                UObject* Outer = GetTransientPackage();
                FName Name = NAME_None;
                EObjectFlags ObjectFlags = RF_NoFlags;
                if (Info.Length() > 0)
                {
                    Outer = FV8Utils::GetUObject(Context, Info[0]);
                }
                if (Info.Length() > 1)
                {
                    Name = FName(*FV8Utils::ToFString(Isolate, Info[1]));
                }
                if (Info.Length() > 2)
                {
                    ObjectFlags = (EObjectFlags)(Info[2]->Int32Value(Context).ToChecked());
                }
                Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags); 
            }
            
            FV8Utils::IsolateData<IObjectMapper>(Isolate)->Bind(Class, Object, Self);
        }
        else
        {
            FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
        }
    }
}
