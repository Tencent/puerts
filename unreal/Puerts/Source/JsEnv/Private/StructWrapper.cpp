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
#include "PathEscape.h"

namespace PUERTS_NAMESPACE
{
void FStructWrapper::AddExtensionMethods(const std::vector<UFunction*>& InExtensionMethods)
{
    ExtensionMethods.insert(ExtensionMethods.end(), InExtensionMethods.begin(), InExtensionMethods.end());
}

std::shared_ptr<FPropertyTranslator> FStructWrapper::GetPropertyTranslator(PropertyMacro* InProperty)
{
    auto Iter = PropertiesMap.Find(InProperty->GetFName());
    if (!Iter)
    {
        std::shared_ptr<FPropertyTranslator> PropertyTranslator = FPropertyTranslator::Create(InProperty);
        if (PropertyTranslator)
        {
            PropertiesMap.Add(InProperty->GetFName(), PropertyTranslator);
            Properties.push_back(PropertyTranslator);
        }
        return PropertyTranslator;
    }
    FPropertyTranslator::CreateOn(InProperty, Iter->get());
    return *Iter;
}

std::shared_ptr<FFunctionTranslator> FStructWrapper::GetMethodTranslator(UFunction* InFunction, bool IsExtension)
{
    auto Iter = MethodsMap.Find(InFunction->GetFName());
    if (!Iter)
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
        MethodsMap.Add(InFunction->GetFName(), FunctionTranslator);
        return FunctionTranslator;
    }
    Iter->get()->Init(InFunction, false);
    return *Iter;
}

std::shared_ptr<FFunctionTranslator> FStructWrapper::GetFunctionTranslator(UFunction* InFunction)
{
    auto Iter = FunctionsMap.Find(InFunction->GetFName());
    if (!Iter)
    {
        auto FunctionTranslator = std::make_shared<FFunctionTranslator>(InFunction, false);
        FunctionsMap.Add(InFunction->GetFName(), FunctionTranslator);
        return FunctionTranslator;
    }
    Iter->get()->Init(InFunction, false);
    return *Iter;
}

void FStructWrapper::RefreshMethod(UFunction* InFunction)
{
    if (!InFunction->HasAnyFunctionFlags(FUNC_Static))
    {
        GetMethodTranslator(InFunction, false);
    }
}

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
void FStructWrapper::InitTemplateProperties(
    v8::Isolate* Isolate, UStruct* InStruct, v8::Local<v8::FunctionTemplate> Template, bool IsReuseTemplate)
{
    auto ClassDefinition = FindClassByType(Struct.Get());
    TSet<FName> AddedProperties;
    if (ClassDefinition)
    {
        JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            AddedProperties.Add(PropertyInfo->Name);
            if (!IsReuseTemplate)
            {
                v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
                if (!PropertyInfo->Setter)
                    PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
                auto GetterData = PropertyInfo->GetterData
                                      ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->GetterData))
                                      : v8::Local<v8::Value>();

                auto SetterData = PropertyInfo->SetterData
                                      ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->SetterData))
                                      : v8::Local<v8::Value>();

                Template->PrototypeTemplate()->SetAccessorProperty(FV8Utils::InternalString(Isolate, PropertyInfo->Name),
                    PropertyInfo->Getter
                        ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Getter, GetterData)
                        : v8::Local<v8::FunctionTemplate>(),
                    PropertyInfo->Setter
                        ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Setter, SetterData)
                        : v8::Local<v8::FunctionTemplate>(),
                    PropertyAttribute);
            }
            ++PropertyInfo;
        }

        if (!IsReuseTemplate)
        {
            PropertyInfo = ClassDefinition->Variables;
            while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
            {
                v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
                if (!PropertyInfo->Setter)
                    PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
                auto GetterData = PropertyInfo->GetterData
                                      ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->GetterData))
                                      : v8::Local<v8::Value>();

                auto SetterData = PropertyInfo->SetterData
                                      ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->SetterData))
                                      : v8::Local<v8::Value>();

                Template->SetAccessorProperty(FV8Utils::InternalString(Isolate, PropertyInfo->Name),
                    PropertyInfo->Getter
                        ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Getter, GetterData)
                        : v8::Local<v8::FunctionTemplate>(),
                    PropertyInfo->Setter
                        ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Setter, SetterData)
                        : v8::Local<v8::FunctionTemplate>(),
                    PropertyAttribute);
                ++PropertyInfo;
            }
        }
    }
    for (TFieldIterator<PropertyMacro> PropertyIt(InStruct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        PropertyMacro* Property = *PropertyIt;
        if (AddedProperties.Contains(Property->GetFName()))
        {
            continue;
        }

        auto PropertyTranslator = GetPropertyTranslator(Property);
        if (PropertyTranslator)
        {
            if (!IsReuseTemplate)
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
    auto ClassDefinition = FindClassByType(Struct.Get());
    bool IsReuseTemplate = false;
#if PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
    IsReuseTemplate = true;
    if (CachedFunctionTemplate.IsEmpty())
    {
        IsReuseTemplate = false;
        auto Temp = v8::FunctionTemplate::New(Isolate, Construtor, v8::External::New(Isolate, this));
        Temp->InstanceTemplate()->SetInternalFieldCount(4);
        CachedFunctionTemplate.Reset(Isolate, Temp);
    }
    auto Result = CachedFunctionTemplate.Get(Isolate);
#else
    auto Result = v8::FunctionTemplate::New(
        Isolate, Construtor, v8::External::New(Isolate, this));    // 和class的区别就这里传的函数不一样，后续尽量重用
    Result->InstanceTemplate()->SetInternalFieldCount(4);
#endif

    TSet<FName> AddedMethods;
    TSet<FName> AddedFunctions;

    if (ClassDefinition)
    {
        ExternalInitialize = (V8InitializeFuncType) ClassDefinition->Initialize;
        ExternalFinalize = ClassDefinition->Finalize;
        JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            AddedMethods.Add(FunctionInfo->Name);
            if (!IsReuseTemplate)
            {
#ifndef WITH_QUICKJS
                auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
                if (FastCallInfo)
                {
                    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name),
                        v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) FunctionInfo->Callback,
                            FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                               : v8::Local<v8::Value>(),
                            v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect,
                            FastCallInfo));
                }
                else
#endif
                {
                    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name),
                        v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) FunctionInfo->Callback,
                            FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                               : v8::Local<v8::Value>()));
                }
            }
            ++FunctionInfo;
        }
        FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            AddedFunctions.Add(FunctionInfo->Name);
            if (!IsReuseTemplate)
            {
#ifndef WITH_QUICKJS
                auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
                if (FastCallInfo)
                {
                    Result->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name),
                        v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) FunctionInfo->Callback,
                            FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                               : v8::Local<v8::Value>(),
                            v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect,
                            FastCallInfo));
                }
                else
#endif
                {
                    Result->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name),
                        v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) FunctionInfo->Callback,
                            FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                               : v8::Local<v8::Value>()));
                }
            }
            ++FunctionInfo;
        }
    }

    InitTemplateProperties(Isolate, Struct.Get(), Result, IsReuseTemplate);

    if (const auto Class = Cast<UClass>(Struct.Get()))
    {
        for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
        {
            UFunction* Function = *FuncIt;

            if ((Function->HasAnyFunctionFlags(FUNC_Static) && AddedFunctions.Contains(Function->GetFName())) ||
                (!Function->HasAnyFunctionFlags(FUNC_Static) && AddedMethods.Contains(Function->GetFName())))
            {
                // UE_LOG(LogTemp, Warning, TEXT("%s added"), *Function->GetName());
                continue;
            }

            FString FuncName = Function->GetName();
            auto Key = FV8Utils::InternalString(Isolate, FuncName);
#ifdef PUERTS_WITH_EDITOR_SUFFIX
            // 这里同时绑定带Suffix和不带Suffix的后缀是为了兼容现有的一些js写的代码(PuertsEditor)
            v8::Local<v8::String> AdditionalKey{};
            if (puerts::IsEditorOnlyUFunction(Function))
            {
                FString SuffixFuncName = FuncName + EditorOnlyPropertySuffix.GetData();
                AdditionalKey = FV8Utils::InternalString(Isolate, SuffixFuncName);
            }
#endif
            // 这里同时绑定带Suffix和不带Suffix的后缀是为了兼容现有的一些js写的代码(PuertsEditor)

            if (Function->HasAnyFunctionFlags(FUNC_Static))
            {
                auto FunctionTranslator = GetFunctionTranslator(Function);
                AddedFunctions.Add(Function->GetFName());
                if (!IsReuseTemplate)
                {
                    Result->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
#ifdef PUERTS_WITH_EDITOR_SUFFIX
                    if (!AdditionalKey.IsEmpty())
                    {
                        Result->Set(AdditionalKey, FunctionTranslator->ToFunctionTemplate(Isolate));
                    }
#endif
                }
            }
            else
            {
                auto FunctionTranslator = GetMethodTranslator(Function, false);
                AddedMethods.Add(Function->GetFName());
                if (!IsReuseTemplate)
                {
                    Result->PrototypeTemplate()->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
#ifdef PUERTS_WITH_EDITOR_SUFFIX
                    if (!AdditionalKey.IsEmpty())
                    {
                        Result->PrototypeTemplate()->Set(AdditionalKey, FunctionTranslator->ToFunctionTemplate(Isolate));
                    }
#endif
                }
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
                    if (!ItfFunction->HasAnyFunctionFlags(FUNC_Static) && !AddedMethods.Contains(ItfFunction->GetFName()))
                    {
                        auto ItfFunctionTranslator = GetMethodTranslator(ItfFunction, false);
                        AddedMethods.Add(ItfFunction->GetFName());
                        if (!IsReuseTemplate)
                            Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, ItfFunction->GetName()),
                                ItfFunctionTranslator->ToFunctionTemplate(Isolate));
                    }
                }
            }
        }
        if (!IsReuseTemplate)
        {
            Result->Set(FV8Utils::InternalString(Isolate, "Find"),
                v8::FunctionTemplate::New(Isolate, Find, v8::External::New(Isolate, this)));
            Result->Set(FV8Utils::InternalString(Isolate, "Load"),
                v8::FunctionTemplate::New(Isolate, Load, v8::External::New(Isolate, this)));
        }
    }

    for (auto Iter = ExtensionMethods.begin(); Iter != ExtensionMethods.end(); ++Iter)
    {
        UFunction* Function = *Iter;

        if (AddedMethods.Contains(Function->GetFName()))
        {
            continue;
        }

        auto FunctionTranslator = GetMethodTranslator(Function, true);

        AddedMethods.Add(Function->GetFName());
        if (!IsReuseTemplate)
        {
            auto Key = FV8Utils::InternalString(Isolate, Function->GetName());
            Result->PrototypeTemplate()->Set(Key, FunctionTranslator->ToFunctionTemplate(Isolate));
        }
    }

    if (!IsReuseTemplate)
        Result->Set(FV8Utils::InternalString(Isolate, "StaticClass"),
            v8::FunctionTemplate::New(Isolate, StaticClass, v8::External::New(Isolate, this)));

    if (!Struct->IsA<UClass>() && !IsReuseTemplate)
    {
        Result->Set(FV8Utils::InternalString(Isolate, "StaticStruct"),
            v8::FunctionTemplate::New(Isolate, StaticClass, v8::External::New(Isolate, this)));
    }

#ifndef WITH_QUICKJS
    if (!IsReuseTemplate)
        Result->InstanceTemplate()->SetHandler(v8::NamedPropertyHandlerConfiguration(
            [](v8::Local<v8::Name> Property, const v8::PropertyCallbackInfo<v8::Value>& Info)
            {
                if (Property->IsSymbol())
                    return;
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
                        while (!DescriptorVal->IsObject())
                        {
                            auto Parent = Proto->GetPrototype();
                            if (!Parent->IsObject())
                                break;
                            Proto = Parent.As<v8::Object>();
                            DescriptorVal = Proto->GetOwnPropertyDescriptor(Context, FixedPropertyName).ToLocalChecked();
                        }
                        if (DescriptorVal->IsObject())
                        {
                            auto Descriptor = DescriptorVal.As<v8::Object>();
                            auto Getter = Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "get")).ToLocalChecked();
                            if (!Getter->IsFunction())
                            {
                                auto Value = Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "value")).ToLocalChecked();
                                (void) (Proto->Set(Context, Property, Value));
                            }
                            else
                            {
                                Proto->SetAccessorProperty(Property, Getter.As<v8::Function>(),
                                    Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "set"))
                                        .ToLocalChecked()
                                        .As<v8::Function>());
                            }
                        }
                    }
                }
            },
            [](v8::Local<v8::Name> Property, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<v8::Value>& Info)
            {
                if (Property->IsSymbol())
                    return;
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
                        Info.GetReturnValue().Set(Value);
                        auto DescriptorVal = Proto->GetOwnPropertyDescriptor(Context, FixedPropertyName).ToLocalChecked();
                        while (!DescriptorVal->IsObject())
                        {
                            auto Parent = Proto->GetPrototype();
                            if (!Parent->IsObject())
                                break;
                            Proto = Parent.As<v8::Object>();
                            DescriptorVal = Proto->GetOwnPropertyDescriptor(Context, FixedPropertyName).ToLocalChecked();
                        }
                        if (DescriptorVal->IsObject())
                        {
                            auto Descriptor = DescriptorVal.As<v8::Object>();
                            // set first, mush set accessor of object
                            Proto->SetAccessorProperty(Property,
                                Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "get"))
                                    .ToLocalChecked()
                                    .As<v8::Function>(),
                                Descriptor->Get(Context, FV8Utils::ToV8String(InnerIsolate, "set"))
                                    .ToLocalChecked()
                                    .As<v8::Function>());
                        }
                    }
                }
            },
            nullptr, nullptr, nullptr, v8::Local<v8::Value>(), v8::PropertyHandlerFlags::kNonMasking));
#endif

    return Result;
}
MSVC_PRAGMA(warning(pop))

void FStructWrapper::StaticClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FStructWrapper* This = reinterpret_cast<FStructWrapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());

    if (!This->Struct.IsValid())
    {
        FV8Utils::ThrowException(Isolate, "Associated UStruct had been GC");
        return;
    }

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

    if (!This->Struct.IsValid())
    {
        FV8Utils::ThrowException(Isolate, "Associated UStruct had been GC");
        return;
    }

    UClass* Class = Cast<UClass>(This->Struct);

    if (Class && Info.Length() >= 1 && Info[0]->IsString())
    {
        UObject* Object = nullptr;
        if (Info.Length() > 1)
        {
            UObject* Outer = FV8Utils::GetUObject(Context, Info[1]);
            Object = StaticFindObject(Class, Outer, *FV8Utils::ToFString(Isolate, Info[0]), false);
        }
        else
        {
#if (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 1) || ENGINE_MAJOR_VERSION > 5
            Object = StaticFindFirstObject(Class, *FV8Utils::ToFString(Isolate, Info[0]));
#else
            Object = StaticFindObject(Class, ANY_PACKAGE, *FV8Utils::ToFString(Isolate, Info[0]), false);
#endif
        }

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

    if (!This->Struct.IsValid())
    {
        FV8Utils::ThrowException(Isolate, "Associated UStruct had been GC");
        return;
    }

    UClass* Class = Cast<UClass>(This->Struct);

    if (Class && Info.Length() > 0 && Info[0]->IsString())
    {
        bool UnEscape = false;
        if (Info.Length() > 1)
        {
            UnEscape = Info[1]->BooleanValue(Isolate);
        }
        auto Path = FV8Utils::ToFString(Isolate, Info[0]);
        auto Object =
            StaticLoadObject(Class, nullptr, UnEscape ? *TypeScriptVariableNameToFilename(Path) : *Path, nullptr, LOAD_NoWarn);
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
    if (!This->Struct.IsValid())
    {
        FV8Utils::ThrowException(Isolate, "Associated UStruct had been GC");
        return;
    }
    This->New(Isolate, Context, Info);
}

void FScriptStructWrapper::New(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (Info.IsConstructCall())
    {
        auto Self = Info.This();
        void* Memory = nullptr;

        {
            if (ExternalInitialize)
            {
                Memory = ExternalInitialize(Info);
                if (!Memory)    // do not bind nullptr
                {
                    return;
                }
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
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->BindStruct(this, Memory, Self, false);
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

void FScriptStructWrapper::Free(TWeakObjectPtr<UStruct> InStruct, pesapi_finalize InExternalFinalize, void* Ptr)
{
    if (InExternalFinalize)
    {
        InExternalFinalize(Ptr, nullptr, nullptr);
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
    FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindStruct(ScriptStructWrapper, ScriptStructMemory);
    Free(ScriptStructWrapper->Struct, ScriptStructWrapper->ExternalFinalize, ScriptStructMemory);
}

void FScriptStructWrapper::OnGarbageCollected(const v8::WeakCallbackInfo<FScriptStructWrapper>& Data)
{
    void* ScriptStructMemory = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindStruct(Data.GetParameter(), ScriptStructMemory);
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
    if (!This->Struct.IsValid())
    {
        FV8Utils::ThrowException(Isolate, "Associated UStruct had been GC");
        return;
    }
    This->New(Isolate, Context, Info);
}

void FClassWrapper::New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (Info.IsConstructCall())
    {
        auto Self = Info.This();

        UObject* Object = nullptr;
        auto Class = static_cast<UClass*>(Struct.Get());

        {
            UObject* Outer = GetTransientPackage();
            FName Name = NAME_None;
            EObjectFlags ObjectFlags = RF_NoFlags;
            if (Info.Length() > 0)
            {
                Outer = FV8Utils::GetUObject(Context, Info[0]);
                if (FV8Utils::IsReleasedPtr(Outer))
                {
                    FV8Utils::ThrowException(Isolate, "passing a invalid object");
                    return;
                }
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

        FV8Utils::IsolateData<IObjectMapper>(Isolate)->Bind(this, Object, Self);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
    }
}
}    // namespace PUERTS_NAMESPACE
