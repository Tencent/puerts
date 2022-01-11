/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
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

std::shared_ptr<FPropertyTranslator> FStructWrapper::GetPropertyTranslator(PropertyMacro* InProperty)
{
    auto Iter = PropertiesMap.find(InProperty->GetName());
    if (Iter == PropertiesMap.end())
    {
        std::shared_ptr<FPropertyTranslator> PropertyTranslator = FPropertyTranslator::Create(InProperty);
        if (PropertyTranslator)
        {
            PropertiesMap[InProperty->GetName()] = PropertyTranslator;
            Properties.push_back(PropertyTranslator);
        }
        return PropertyTranslator;
    }
    FPropertyTranslator::CreateOn(InProperty, Iter->second.get());
    return Iter->second;
}

std::shared_ptr<FFunctionTranslator> FStructWrapper::GetMethodTranslator(UFunction* InFunction, bool IsExtension)
{
    auto Iter = MethodsMap.find(InFunction->GetName());
    if (Iter == MethodsMap.end())
    {
        std::shared_ptr<FFunctionTranslator> FunctionTranslator;
        if (IsExtension)
        {
            FunctionTranslator = std::make_shared<FExtensionMethodTranslator>(InFunction);
        }
        else
        {
            FunctionTranslator = std::make_shared<FFunctionTranslator>(InFunction, false);
        }
        MethodsMap[InFunction->GetName()] = FunctionTranslator;
        return FunctionTranslator;
    }
    Iter->second->Init(InFunction, false);
    return Iter->second;
}

std::shared_ptr<FFunctionTranslator> FStructWrapper::GetFunctionTranslator(UFunction* InFunction)
{
    auto Iter = FunctionsMap.find(InFunction->GetName());
    if (Iter == FunctionsMap.end())
    {
        auto FunctionTranslator = std::make_shared<FFunctionTranslator>(InFunction, false);
        FunctionsMap[InFunction->GetName()] = FunctionTranslator;
        return FunctionTranslator;
    }
    Iter->second->Init(InFunction, false);
    return Iter->second;
}

void FStructWrapper::InitTemplateProperties(v8::Isolate* Isolate, UStruct* InStruct, v8::Local<v8::FunctionTemplate> Template)
{
    auto ClassDefinition = FindClassByType(Struct.Get());
    TSet<FString> AddedProperties;
    if (ClassDefinition)
    {
        JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            AddedProperties.Add(UTF8_TO_TCHAR(PropertyInfo->Name));
            v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
            if (!PropertyInfo->Setter)
                PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            auto Data = PropertyInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->Data))
                                           : v8::Local<v8::Value>();

            Template->PrototypeTemplate()->SetAccessorProperty(FV8Utils::InternalString(Isolate, PropertyInfo->Name),
                v8::FunctionTemplate::New(Isolate, PropertyInfo->Getter, Data),
                v8::FunctionTemplate::New(Isolate, PropertyInfo->Setter, Data), PropertyAttribute);
            ++PropertyInfo;
        }
    }
    for (TFieldIterator<PropertyMacro> PropertyIt(InStruct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        PropertyMacro* Property = *PropertyIt;
        if (AddedProperties.Contains(Property->GetName()))
        {
            continue;
        }
        auto PropertyTranslator = GetPropertyTranslator(Property);
        if (PropertyTranslator)
        {
            PropertyTranslator->SetAccessor(Isolate, Template);
        }
        else
        {
            // UE_LOG(LogTemp, Warning, TEXT("%s:%s not supported"), *Property->GetOwnerStruct()->GetName(), *Property->GetName());
        }
    }
}

v8::Local<v8::FunctionTemplate> FStructWrapper::ToFunctionTemplate(v8::Isolate* Isolate, v8::FunctionCallback Construtor)
{
    v8::EscapableHandleScope HandleScope(Isolate);
    auto ClassDefinition = FindClassByType(Struct.Get());
    auto Result = v8::FunctionTemplate::New(
        Isolate, Construtor, v8::External::New(Isolate, this));    //和class的区别就这里传的函数不一样，后续尽量重用
    Result->InstanceTemplate()->SetInternalFieldCount(4);

    TSet<FString> AddedMethods;
    TSet<FString> AddedFunctions;

    if (ClassDefinition)
    {
        ExternalInitialize = ClassDefinition->Initialize;
        ExternalFinalize = ClassDefinition->Finalize;
        JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            AddedMethods.Add(UTF8_TO_TCHAR(FunctionInfo->Name));
            Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name),
                v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback,
                    FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                       : v8::Local<v8::Value>()));
            ++FunctionInfo;
        }
        FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            AddedFunctions.Add(UTF8_TO_TCHAR(FunctionInfo->Name));
            Result->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name),
                v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback,
                    FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                       : v8::Local<v8::Value>()));
            ++FunctionInfo;
        }
    }

    InitTemplateProperties(Isolate, Struct.Get(), Result);

    if (const auto Class = Cast<UClass>(Struct.Get()))
    {
        for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
        {
            UFunction* Function = *FuncIt;

            if ((Function->HasAnyFunctionFlags(FUNC_Static) && AddedFunctions.Contains(Function->GetName())) ||
                (!Function->HasAnyFunctionFlags(FUNC_Static) && AddedMethods.Contains(Function->GetName())))
            {
                // UE_LOG(LogTemp, Warning, TEXT("%s added"), *Function->GetName());
                continue;
            }

            auto Key = FV8Utils::InternalString(Isolate, Function->GetName());

            if (Function->HasAnyFunctionFlags(FUNC_Static))
            {
                auto FunctionTranslator = GetFunctionTranslator(Function);
                AddedFunctions.Add(Function->GetName());
                Result->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
            }
            else
            {
                auto FunctionTranslator = GetMethodTranslator(Function, false);
                AddedMethods.Add(Function->GetName());
                Result->PrototypeTemplate()->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
            }
        }

        for (const FImplementedInterface& Interface : Class->Interfaces)
        {
            if (Interface.Class)
            {
                for (TFieldIterator<UFunction> ItfFuncIt(Interface.Class, EFieldIteratorFlags::ExcludeSuper); ItfFuncIt;
                     ++ItfFuncIt)
                {
                    UFunction* ItfFunction = *ItfFuncIt;
                    if (!ItfFunction->HasAnyFunctionFlags(FUNC_Static) && !AddedMethods.Contains(ItfFunction->GetName()))
                    {
                        auto ItfFunctionTranslator = GetMethodTranslator(ItfFunction, false);
                        AddedMethods.Add(ItfFunction->GetName());
                        Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, ItfFunction->GetName()),
                            ItfFunctionTranslator->ToFunctionTemplate(Isolate));
                    }
                }
            }
        }

        Result->Set(
            FV8Utils::InternalString(Isolate, "Find"), v8::FunctionTemplate::New(Isolate, Find, v8::External::New(Isolate, this)));
        Result->Set(
            FV8Utils::InternalString(Isolate, "Load"), v8::FunctionTemplate::New(Isolate, Load, v8::External::New(Isolate, this)));
    }

    for (auto Iter = ExtensionMethods.begin(); Iter != ExtensionMethods.end(); ++Iter)
    {
        UFunction* Function = *Iter;

        if (AddedMethods.Contains(Function->GetName()))
        {
            continue;
        }

        auto FunctionTranslator = GetMethodTranslator(Function, true);

        auto Key = FV8Utils::InternalString(Isolate, Function->GetName());

        AddedMethods.Add(Function->GetName());
        Result->PrototypeTemplate()->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
    }

    Result->Set(FV8Utils::InternalString(Isolate, "StaticClass"),
        v8::FunctionTemplate::New(Isolate, StaticClass, v8::External::New(Isolate, this)));

#ifndef WITH_QUICKJS
    Result->InstanceTemplate()->SetHandler(v8::NamedPropertyHandlerConfiguration(
        [](v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
        {
            auto InnerIsolate = Info.GetIsolate();
            auto Context = InnerIsolate->GetCurrentContext();
            auto This = Info.This();
            FName RequiredFName(*FV8Utils::ToFString(Info.GetIsolate(), Property));
            auto FixedPropertyName = FV8Utils::ToV8String(InnerIsolate, RequiredFName);
            if (This->GetPrototype()->IsObject())
            {
                auto Proto = This->GetPrototype().As<v8::Object>();
                if (Proto->Has(Context, FixedPropertyName).FromMaybe(false))
                {
                    Info.GetReturnValue().Set(This->Get(Context, FixedPropertyName).ToLocalChecked());
                    auto DescriptorVal = Proto->GetOwnPropertyDescriptor(Context, FixedPropertyName).ToLocalChecked();
                    if (DescriptorVal->IsObject())
                    {
                        auto Descriptor = DescriptorVal.As<v8::Object>();
                        Proto->SetAccessorProperty(Property,
                            Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "get")).ToLocalChecked().As<v8::Function>(),
                            Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "set"))
                                .ToLocalChecked()
                                .As<v8::Function>());
                    }
                }
            }
        },
        [](v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<v8::Value>& Info)
        {
            auto InnerIsolate = Info.GetIsolate();
            auto Context = InnerIsolate->GetCurrentContext();
            auto This = Info.This();
            FName RequiredFName(*FV8Utils::ToFString(Info.GetIsolate(), Property));
            auto FixedPropertyName = FV8Utils::ToV8String(InnerIsolate, RequiredFName);
            if (This->GetPrototype()->IsObject())
            {
                auto Proto = This->GetPrototype().As<v8::Object>();
                if (Proto->Has(Context, FixedPropertyName).FromMaybe(false))
                {
                    auto _UnUsed = This->Set(Context, FixedPropertyName, Value);
                    auto DescriptorVal = Proto->GetOwnPropertyDescriptor(Context, FixedPropertyName).ToLocalChecked();
                    if (DescriptorVal->IsObject())
                    {
                        auto Descriptor = DescriptorVal.As<v8::Object>();
                        // set first, mush set accessor of object
                        This->SetAccessorProperty(Property,
                            Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "get")).ToLocalChecked().As<v8::Function>(),
                            Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "set"))
                                .ToLocalChecked()
                                .As<v8::Function>());
                    }
                }
            }
        },
        nullptr, nullptr, nullptr, v8::Local<v8::Value>(), v8::PropertyHandlerFlags::kNonMasking));
#endif

    return HandleScope.Escape(Result);
}

void FStructWrapper::StaticClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FStructWrapper* This = reinterpret_cast<FStructWrapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

    auto Result =
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, This->Struct->GetClass(), This->Struct.Get());
    Info.GetReturnValue().Set(Result);
}

void FStructWrapper::Find(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FStructWrapper* This = reinterpret_cast<FStructWrapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

    UClass* Class = Cast<UClass>(This->Struct);

    if (Class && Info.Length() >= 1 && Info[0]->IsString())
    {
        UObject* Outer = ANY_PACKAGE;

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

    FStructWrapper* This = reinterpret_cast<FStructWrapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

    UClass* Class = Cast<UClass>(This->Struct);

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

void FScriptStructWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FScriptStructWrapper* This = reinterpret_cast<FScriptStructWrapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->New(Isolate, Context, Info);
}

void FScriptStructWrapper::New(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (Info.IsConstructCall())
    {
        auto Self = Info.This();
        void* Memory = nullptr;

        bool PassByPointer = false;

        if (Info.Length() == 2 && Info[0]->IsExternal())    // Call by Native
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
                Memory = Alloc(static_cast<UScriptStruct*>(Struct.Get()));
                const int Count = Info.Length() < Properties.size() ? Info.Length() : Properties.size();
                for (int i = 0; i < Count; ++i)
                {
                    Properties[i]->JsToUEInContainer(Isolate, Context, Info[i], Memory, false);
                }
            }
        }
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->BindStruct(this, Memory, Self, PassByPointer);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
    }
}

void* FScriptStructWrapper::Alloc(UScriptStruct* InScriptStruct)
{
    void* ScriptStructMemory = new char[InScriptStruct->GetStructureSize()];
    InScriptStruct->InitializeStruct(ScriptStructMemory);
    return ScriptStructMemory;
}

void FScriptStructWrapper::Free(TWeakObjectPtr<UStruct> InStruct, FinalizeFunc InExternalFinalize, void* Ptr)
{
    if (InExternalFinalize)
    {
        InExternalFinalize(Ptr);
    }
    else
    {
        if (InStruct.IsValid())
            InStruct->DestroyStruct(Ptr);
        delete[] static_cast<char*>(Ptr);
    }
}

void FScriptStructWrapper::OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<FScriptStructWrapper>& Data)
{
    FScriptStructWrapper* ScriptStructWrapper = Data.GetParameter();
    void* ScriptStructMemory = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindStruct(ScriptStructMemory);
    Free(ScriptStructWrapper->Struct, ScriptStructWrapper->ExternalFinalize, ScriptStructMemory);
}

void FScriptStructWrapper::OnGarbageCollected(const v8::WeakCallbackInfo<UScriptStruct>& Data)
{
    void* ScriptStructMemory = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindStruct(ScriptStructMemory);
}

void FClassWrapper::OnGarbageCollected(const v8::WeakCallbackInfo<UClass>& Data)
{
    FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())
        ->UnBind(Data.GetParameter(), reinterpret_cast<UObject*>(DataTransfer::MakeAddressWithHighPartOfTwo(
                                          Data.GetInternalField(0), Data.GetInternalField(1))));
}

void FClassWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FClassWrapper* This = reinterpret_cast<FClassWrapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->New(Isolate, Context, Info);
}

void FClassWrapper::New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (Info.IsConstructCall())
    {
        auto Self = Info.This();

        UObject* Object = nullptr;
        auto Class = static_cast<UClass*>(Struct.Get());

        if (Info.Length() == 1 && Info[0]->IsExternal())    // Call by Native
        {
            Object = reinterpret_cast<UObject*>(v8::Local<v8::External>::Cast(Info[0])->Value());
            if (!Object->IsValidLowLevel())
            {
                Object = nullptr;
            }
        }
        else    // Call by js new
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
                ObjectFlags = (EObjectFlags) (Info[2]->Int32Value(Context).ToChecked());
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
}    // namespace puerts
