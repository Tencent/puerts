/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "StructWrapper.h"
#include <algorithm>
#include <unordered_map>
#include "ObjectMapper.h"
#include "PathEscape.h"
#include "PapiUtils.h"
#include "ExtensionMethods.h"
#include "ContainerWrapper.h"
#include "DelegateWrapper.h"
#include "SoftObjectWrapper.h"
#include "WeakObjectPtrWrapper.h"

namespace PUERTS_NAMESPACE
{
void FExternalFinalizer::operator()(void* Ptr) const
{
    Finalize(GetPesapiFFI(), Ptr, ClassData, nullptr);
}

static TMap<FString, std::shared_ptr<FStructWrapper>>& StructWrappers()
{
    static TMap<FString, std::shared_ptr<FStructWrapper>> Wrappers;
    return Wrappers;
}

// type id (the wrapper) -> current class definition of the reflected classes
static std::unordered_map<const void*, const JSClassDefinition*>& ReflectedClassMap()
{
    static std::unordered_map<const void*, const JSClassDefinition*> Map;
    return Map;
}

const JSClassDefinition* FindReflectedClass(const void* TypeId)
{
    auto& Map = ReflectedClassMap();
    auto Iter = Map.find(TypeId);
    if (Iter != Map.end())
    {
        return Iter->second;
    }
    if (TypeId == FWeakObjectPtrWrapper::TypeId())
    {
        return FWeakObjectPtrWrapper::GetClassDefinition();
    }
    if (TypeId == FSoftObjectWrapper::TypeId())
    {
        return FSoftObjectWrapper::GetClassDefinition();
    }
    if (TypeId == FDelegateWrapper::TypeId())
    {
        return FDelegateWrapper::GetClassDefinition();
    }
    if (TypeId == FMulticastDelegateWrapper::TypeId())
    {
        return FMulticastDelegateWrapper::GetClassDefinition();
    }
    return FindContainerClass(TypeId);
}

FStructWrapper* FStructWrapper::FromTypeId(const void* TypeId)
{
    if (!TypeId)
    {
        return nullptr;
    }
    auto& Map = ReflectedClassMap();
    return Map.find(TypeId) != Map.end() ? static_cast<FStructWrapper*>(const_cast<void*>(TypeId)) : nullptr;
}

// extension methods found by the last scan, taken by the wrapper of the struct when its class definition is built
static std::map<UStruct*, std::vector<UFunction*>>& PendingExtensionMethods()
{
    static std::map<UStruct*, std::vector<UFunction*>> Map;
    return Map;
}

static bool ExtensionMethodsInited = false;

std::shared_ptr<FStructWrapper> FStructWrapper::FindOrAdd(UStruct* InStruct)
{
    const auto FullName = InStruct->GetFullName();
    auto& Wrappers = StructWrappers();
    if (auto Existed = Wrappers.Find(FullName))
    {
        (*Existed)->Struct = InStruct;
        return *Existed;
    }
    std::shared_ptr<FStructWrapper> Ret;
    if (auto ScriptStruct = Cast<UScriptStruct>(InStruct))
    {
        Ret = std::make_shared<FScriptStructWrapper>(ScriptStruct);
    }
    else
    {
        Ret = std::make_shared<FClassWrapper>(CastChecked<UClass>(InStruct));
    }
    Wrappers.Add(FullName, Ret);
    return Ret;
}

void FStructWrapper::ReleaseAll()
{
    ReflectedClassMap().clear();
    PendingExtensionMethods().clear();
    ExtensionMethodsInited = false;
    StructWrappers().Empty();
}

void FStructWrapper::InitExtensionMethodsMap()
{
#if !defined(ENGINE_INDEPENDENT_JSENV)
    auto& Pending = PendingExtensionMethods();
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        if (Class->IsChildOf<UExtensionMethods>() && Class->IsNative())
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    TFieldIterator<PropertyMacro> ParamIt(Function);
                    if (ParamIt &&
                        ((ParamIt->PropertyFlags & (CPF_Parm | CPF_ReturnParm)) == CPF_Parm))    // has at least one param
                    {
                        UStruct* Struct = nullptr;
                        if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(*ParamIt))
                        {
                            Struct = ObjectPropertyBase->PropertyClass;
                        }
                        else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(*ParamIt))
                        {
                            Struct = StructProperty->Struct;
                        }
                        if (Struct)
                        {
                            auto& Functions = Pending[Struct];
                            if (std::find(Functions.begin(), Functions.end(), Function) == Functions.end())
                            {
                                Functions.push_back(Function);
                            }
                        }
                    }
                }
            }
        }
    }
#endif
    ExtensionMethodsInited = true;
}

void FStructWrapper::AddExtensionMethods(const std::vector<UFunction*>& InExtensionMethods)
{
    for (auto Function : InExtensionMethods)
    {
        if (std::find(ExtensionMethods.begin(), ExtensionMethods.end(), Function) == ExtensionMethods.end())
        {
            ExtensionMethods.push_back(Function);
        }
    }
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
    // Properties is cleared when a new class definition is built, keep the declaration order for the struct constructor
    if (std::find(Properties.begin(), Properties.end(), *Iter) == Properties.end())
    {
        Properties.push_back(*Iter);
    }
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

const JSClassDefinition* FStructWrapper::GetClassDefinition(UStruct* InStruct, bool Refresh)
{
    if (!ExtensionMethodsInited)
    {
        InitExtensionMethodsMap();
    }
    auto& Pending = PendingExtensionMethods();
    auto PendingIter = Pending.find(InStruct);
    if (PendingIter != Pending.end())
    {
        AddExtensionMethods(PendingIter->second);
        Pending.erase(PendingIter);
    }

    Struct = InStruct;

    if (CurrentClass && CurrentClass->Struct.Get() == InStruct)
    {
        if (Refresh)
        {
            CollectMembers(InStruct, nullptr);
        }
        return &CurrentClass->Definition;
    }

    const void* SuperTypeId = nullptr;
    if (auto SuperStruct = InStruct->GetSuperStruct())
    {
        auto SuperWrapper = FindOrAdd(SuperStruct);
        SuperWrapper->GetClassDefinition(SuperStruct, false);
        SuperTypeId = SuperWrapper.get();
    }

    ExternalInitialize = nullptr;
    ExternalFinalize.Reset();
    // translators are kept in the maps (definitions built before may still reference them), Properties is refilled below
    Properties.clear();

    auto Out = std::make_shared<FReflectedClass>();
    Out->Struct = InStruct;
#if WITH_EDITOR
    Out->ClassName = TCHAR_TO_UTF8(*InStruct->GetPathName());
#else
    Out->ClassName = TCHAR_TO_UTF8(*InStruct->GetName());
#endif
    CollectMembers(InStruct, Out.get());

    // terminators
    Out->Methods.push_back(JSFunctionInfo());
    Out->Functions.push_back(JSFunctionInfo());
    Out->Properties.push_back(JSPropertyInfo());
    Out->Variables.push_back(JSPropertyInfo());

    auto& Definition = Out->Definition;
    Definition.TypeId = this;
    Definition.SuperTypeId = SuperTypeId;
    Definition.ScriptName = Out->ClassName.c_str();
    Definition.Initialize = &FStructWrapper::ReflectedConstruct;
    if (InStruct->IsA<UScriptStruct>())
    {
        Definition.Finalize = &FScriptStructWrapper::ReflectedFinalize;
    }
    else
    {
        Definition.Finalize = &FClassWrapper::ReflectedFinalize;
    }
    Definition.Methods = Out->Methods.data();
    Definition.Functions = Out->Functions.data();
    Definition.Properties = Out->Properties.data();
    Definition.Variables = Out->Variables.data();
    Definition.Data = this;

    ReflectedClassMap()[this] = &Definition;
    // the previous definition is released here unless an env holds it
    CurrentClass = std::move(Out);
    return &Definition;
}

void FStructWrapper::CollectMembers(UStruct* InStruct, FReflectedClass* Out)
{
    TSet<FName> AddedMethods;
    TSet<FName> AddedFunctions;
    TSet<FName> AddedProperties;

    if (auto ClassDefinition = FindClassByType(InStruct))
    {
        ExternalInitialize = ClassDefinition->Initialize;
        ExternalFinalize.Finalize = ClassDefinition->Finalize;
        ExternalFinalize.ClassData = ClassDefinition->Data;

        JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            AddedMethods.Add(FunctionInfo->Name);
            if (Out)
            {
                Out->Methods.push_back(*FunctionInfo);
                Out->Methods.back().Name = Out->AddName(FunctionInfo->Name);
            }
            ++FunctionInfo;
        }
        FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            AddedFunctions.Add(FunctionInfo->Name);
            if (Out)
            {
                Out->Functions.push_back(*FunctionInfo);
                Out->Functions.back().Name = Out->AddName(FunctionInfo->Name);
            }
            ++FunctionInfo;
        }
        JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            AddedProperties.Add(PropertyInfo->Name);
            if (Out)
            {
                Out->Properties.push_back(*PropertyInfo);
                Out->Properties.back().Name = Out->AddName(PropertyInfo->Name);
            }
            ++PropertyInfo;
        }
        PropertyInfo = ClassDefinition->Variables;
        while (Out && PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            Out->Variables.push_back(*PropertyInfo);
            Out->Variables.back().Name = Out->AddName(PropertyInfo->Name);
            ++PropertyInfo;
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
        FString AccessorName;
        if (Out && PropertyTranslator && PropertyTranslator->GetAccessorName(AccessorName))
        {
            Out->Properties.push_back(PropertyTranslator->AccessorInfo);
            Out->Properties.back().Name = Out->AddName(AccessorName);
        }
    }

    auto AddMethod = [Out](std::vector<JSFunctionInfo>& Infos, FFunctionTranslator* Translator, const FString& Name)
    {
        Infos.push_back(Translator->CallbackInfo);
        Infos.back().Name = Out->AddName(Name);
    };

    if (const auto Class = Cast<UClass>(InStruct))
    {
        for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
        {
            UFunction* Function = *FuncIt;
            const bool IsStatic = Function->HasAnyFunctionFlags(FUNC_Static);

            if ((IsStatic && AddedFunctions.Contains(Function->GetFName())) ||
                (!IsStatic && AddedMethods.Contains(Function->GetFName())))
            {
                continue;
            }

            FString FuncName = Function->GetName();
            auto FunctionTranslator = IsStatic ? GetFunctionTranslator(Function) : GetMethodTranslator(Function, false);
            (IsStatic ? AddedFunctions : AddedMethods).Add(Function->GetFName());
            if (Out)
            {
                auto& Infos = IsStatic ? Out->Functions : Out->Methods;
                AddMethod(Infos, FunctionTranslator.get(), FuncName);
#ifdef PUERTS_WITH_EDITOR_SUFFIX
                // 这里同时绑定带Suffix和不带Suffix的后缀是为了兼容现有的一些js写的代码(PuertsEditor)
                if (puerts::IsEditorOnlyUFunction(Function))
                {
                    AddMethod(Infos, FunctionTranslator.get(), FuncName + EditorOnlyPropertySuffix.GetData());
                }
#endif
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
                        if (Out)
                        {
                            AddMethod(Out->Methods, ItfFunctionTranslator.get(), ItfFunction->GetName());
                        }
                    }
                }
            }
        }

        if (Out)
        {
            Out->Functions.push_back(FindInfo);
            Out->Functions.back().Name = Out->AddName("Find");
            Out->Functions.push_back(LoadInfo);
            Out->Functions.back().Name = Out->AddName("Load");
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
        if (Out)
        {
            AddMethod(Out->Methods, FunctionTranslator.get(), Function->GetName());
        }
    }

    if (Out)
    {
        Out->Functions.push_back(StaticClassInfo);
        Out->Functions.back().Name = Out->AddName("StaticClass");
        if (!InStruct->IsA<UClass>())
        {
            Out->Functions.push_back(StaticClassInfo);
            Out->Functions.back().Name = Out->AddName("StaticStruct");
        }
    }
}

void* FStructWrapper::ReflectedConstruct(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    FStructWrapper* This = static_cast<FStructWrapper*>(Apis->get_userdata(Info));
    if (!This->Struct.IsValid())
    {
        Apis->throw_by_string(Info, "Associated UStruct had been GC");
        return nullptr;
    }
    if (!This->Struct->IsA<UClass>())
    {
        return static_cast<FScriptStructWrapper*>(This)->New(Apis, Info);
    }
    return static_cast<FClassWrapper*>(This)->New(Apis, Info);
}

void FStructWrapper::StaticClass(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    FStructWrapper* This = static_cast<FStructWrapper*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);

    if (!This->Struct.IsValid())
    {
        Apis->throw_by_string(Info, "Associated UStruct had been GC");
        return;
    }

    Apis->add_return(Info, PapiUtils::FindOrAddUObject(Apis, Env, This->Struct->GetClass(), This->Struct.Get()));
}

void FStructWrapper::Find(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    FStructWrapper* This = static_cast<FStructWrapper*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);

    if (!This->Struct.IsValid())
    {
        Apis->throw_by_string(Info, "Associated UStruct had been GC");
        return;
    }

    UClass* Class = Cast<UClass>(This->Struct);
    const int ArgCount = Apis->get_args_len(Info);
    pesapi_value NameValue = ArgCount >= 1 ? Apis->get_arg(Info, 0) : nullptr;

    if (Class && NameValue && Apis->is_string(Env, NameValue))
    {
        const FString Name = PapiUtils::ToFString(Apis, Env, NameValue);
        UObject* Object = nullptr;
        if (ArgCount > 1)
        {
            UObject* Outer = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 1));
#if ENGINE_MINOR_VERSION >= 7 && ENGINE_MAJOR_VERSION >= 5
            Object = StaticFindObject(Class, Outer, *Name, EFindObjectFlags::None);
#else
            Object = StaticFindObject(Class, Outer, *Name, false);
#endif
        }
        else
        {
#if (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 1) || ENGINE_MAJOR_VERSION > 5
            Object = StaticFindFirstObject(Class, *Name);
#else
            Object = StaticFindObject(Class, ANY_PACKAGE, *Name, false);
#endif
        }

        if (Object)
        {
            Apis->add_return(Info, PapiUtils::FindOrAddUObject(Apis, Env, Object->GetClass(), Object));
        }
        else
        {
            Apis->add_return(Info, Apis->create_undefined(Env));
        }
    }
    else
    {
        Apis->throw_by_string(Info, "invalid argument");
    }
}

void FStructWrapper::Load(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    FStructWrapper* This = static_cast<FStructWrapper*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);

    if (!This->Struct.IsValid())
    {
        Apis->throw_by_string(Info, "Associated UStruct had been GC");
        return;
    }

    UClass* Class = Cast<UClass>(This->Struct);
    const int ArgCount = Apis->get_args_len(Info);
    pesapi_value PathValue = ArgCount > 0 ? Apis->get_arg(Info, 0) : nullptr;

    if (Class && PathValue && Apis->is_string(Env, PathValue))
    {
        bool UnEscape = false;
        if (ArgCount > 1)
        {
            UnEscape = Apis->get_value_bool(Env, Apis->get_arg(Info, 1)) != 0;
        }
        auto Path = PapiUtils::ToFString(Apis, Env, PathValue);

        if (FPackageName::DoesPackageExist(FSoftObjectPath(Path).GetLongPackageName()))
        {
            auto Object =
                StaticLoadObject(Class, nullptr, UnEscape ? *TypeScriptVariableNameToFilename(Path) : *Path, nullptr, LOAD_NoWarn);
            if (Object)
            {
                Apis->add_return(Info, PapiUtils::FindOrAddUObject(Apis, Env, Object->GetClass(), Object));
            }
        }
        else
        {
            Apis->add_return(Info, Apis->create_undefined(Env));
        }
    }
    else
    {
        Apis->throw_by_string(Info, "invalid argument");
    }
}

void* FScriptStructWrapper::New(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    void* Memory = nullptr;
    UScriptStruct* ScriptStruct = static_cast<UScriptStruct*>(Struct.Get());
    if (ExternalInitialize)
    {
        Memory = ExternalInitialize(Apis, Info);
        if (!Memory)    // do not bind nullptr
        {
            return nullptr;
        }
    }
    else
    {
        Memory = Alloc(ScriptStruct);
        const int ArgsLen = Apis->get_args_len(Info);
        const int Count = ArgsLen < static_cast<int>(Properties.size()) ? ArgsLen : static_cast<int>(Properties.size());
        if (Count > 0)
        {
            pesapi_env Env = Apis->get_env(Info);
            for (int i = 0; i < Count; ++i)
            {
                Properties[i]->JsToUEInContainer(Apis, Env, Apis->get_arg(Info, i), Memory, false);
            }
        }
    }
    // only a pod struct may be bound in a backend specific way
    if ((ScriptStruct->StructFlags & EStructFlags::STRUCT_IsPlainOldData) &&
        PapiUtils::ObjectMapperOf(Apis, Apis->get_env(Info))->TryBindOwnedStruct(Info, this, Memory))
    {
        return nullptr;
    }
    // bound by the backend, the memory is freed by ReflectedFinalize
    return Memory;
}

void* FScriptStructWrapper::Alloc(UScriptStruct* InScriptStruct)
{
    void* ScriptStructMemory = new char[InScriptStruct->GetStructureSize()];
    InScriptStruct->InitializeStruct(ScriptStructMemory);
    return ScriptStructMemory;
}

void FScriptStructWrapper::Free(TWeakObjectPtr<UStruct> InStruct, const FExternalFinalizer& InExternalFinalize, void* Ptr)
{
    if (InExternalFinalize.IsSet())
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

void FScriptStructWrapper::ReflectedFinalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate)
{
    // the class data of a reflected class is its wrapper, it is process wide and outlives the envs
    static_cast<FScriptStructWrapper*>(static_cast<FStructWrapper*>(ClassData))->Free(Ptr);
}

void FClassWrapper::ReflectedFinalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate)
{
    // the native pointer of a UObject wrapper is a handle owned by the wrapper
    auto Handle = static_cast<FUObjectHandle*>(Ptr);
    if (FUObjectHandle::IsHandle(Handle) && Handle->Finalize)
    {
        Handle->Finalize(Handle);
    }
}

void* FClassWrapper::New(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int ArgsLen = Apis->get_args_len(Info);
    auto Class = static_cast<UClass*>(Struct.Get());

    UObject* Outer = GetTransientPackage();
    FName Name = NAME_None;
    EObjectFlags ObjectFlags = RF_NoFlags;
    if (ArgsLen > 0)
    {
        pesapi_value OuterValue = Apis->get_arg(Info, 0);
        if (!Apis->is_null(Env, OuterValue) && !Apis->is_undefined(Env, OuterValue))
        {
            Outer = PapiUtils::GetUObject(Apis, Env, OuterValue);
            if (!Outer || PapiUtils::IsReleasedPtr(Outer))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return nullptr;
            }
        }
    }
    if (ArgsLen > 1)
    {
        Name = FName(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1)));
    }
    if (ArgsLen > 2)
    {
        ObjectFlags = (EObjectFlags) (Apis->get_value_int32(Env, Apis->get_arg(Info, 2)));
    }
    UObject* Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags);

    // the object being constructed, papi has no accessor of it
    pesapi_value Self = Apis->get_this(Info);
    // the handle is bound to the object by the backend, freed by ReflectedFinalize
    return PapiUtils::ObjectMapperOf(Apis, Env)->Bind(Env, this, Object, Self);
}
}    // namespace PUERTS_NAMESPACE
