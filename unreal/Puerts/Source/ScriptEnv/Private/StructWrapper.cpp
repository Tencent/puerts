/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "StructWrapper.h"
#include <algorithm>
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

// the type id of the virtual root class, a value id (PESAPI_VALUE_TYPE_ID) of the (aligned) tag
static int RootTypeTag = 0;

const void* FStructWrapper::RootTypeId()
{
    return PESAPI_VALUE_TYPE_ID(&RootTypeTag);
}

const JSClassDefinition* FStructWrapper::RootClassDefinition()
{
    // no constructor nor members, unnamed like the other fixed classes
    static const JSClassDefinition Definition = []()
    {
        JSClassDefinition Result = JSClassEmptyDefinition;
        Result.TypeId = RootTypeId();
        Result.ScriptName = "";
        return Result;
    }();
    return &Definition;
}

// the fixed classes, value type ids
const JSClassDefinition* FindBuiltinClass(const void* TypeId)
{
    if (TypeId == FStructWrapper::RootTypeId())
    {
        return FStructWrapper::RootClassDefinition();
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
    return FReflectedTypeTag::IsReflected(TypeId)
               ? static_cast<FStructWrapper*>(static_cast<FReflectedTypeTag*>(const_cast<void*>(TypeId)))
               : nullptr;
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
    PendingExtensionMethods().clear();
    ExtensionMethodsInited = false;
    // the type ids (the wrappers) are about to dangle
    UnregisterReflectedClasses(GetDefaultClassRegistry());
    StructWrappers().Empty();
    FContainerClass::ReleaseAll();
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

int FStructWrapper::OnClassNotFound(const void* TypeId)
{
    auto Wrapper = FromTypeId(TypeId);
    UStruct* S = Wrapper ? Wrapper->Struct.Get() : nullptr;
    if (!S)
    {
        return 0;
    }
    Wrapper->Define(S, false);
    return 1;
}

void FStructWrapper::Define(UStruct* InStruct, bool Refresh)
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

    if (DefinedStruct.Get() == InStruct)
    {
        if (Refresh)
        {
            CollectMembers(InStruct, nullptr);
        }
        return;
    }

    const void* SuperTypeId = RootTypeId();
    if (auto SuperStruct = InStruct->GetSuperStruct())
    {
        auto SuperWrapper = FindOrAdd(SuperStruct);
        SuperWrapper->Define(SuperStruct, false);
        SuperTypeId = SuperWrapper.get();
    }

    ExternalInitialize = nullptr;
    ExternalFinalize.Reset();
    // translators are kept in the maps (definitions defined before may still reference them), Properties is refilled below
    Properties.clear();

    FReflectedMembers Members;
    CollectMembers(InStruct, &Members);

#if WITH_EDITOR
    const FString ClassName = InStruct->GetPathName();
#else
    const FString ClassName = InStruct->GetName();
#endif
    const bool IsStruct = InStruct->IsA<UScriptStruct>();

    // an object type id (see FReflectedTypeTag), the wrapper lives until the module shuts down. The registry replaces the
    // previous definition (retired, the templates built from it keep working) and owns the copied names
    auto Reg = GetPesapiRegistryApi();
    Reg->define_class(nullptr, this, SuperTypeId, nullptr, TCHAR_TO_UTF8(*ClassName), &FStructWrapper::ReflectedConstruct,
        IsStruct ? &FScriptStructWrapper::ReflectedFinalize : nullptr, this, 1);
    Reg->set_property_info_size(nullptr, this, static_cast<int>(Members.Methods.size()), static_cast<int>(Members.Functions.size()),
        static_cast<int>(Members.Properties.size()), static_cast<int>(Members.Variables.size()));
    auto SetMethods = [Reg, this](const std::vector<JSFunctionInfo>& Infos, int IsStatic)
    {
        for (int i = 0; i < static_cast<int>(Infos.size()); ++i)
        {
            Reg->set_method_info(nullptr, this, i, Infos[i].Name, IsStatic, Infos[i].Callback, Infos[i].Data, 1);
        }
    };
    auto SetProperties = [Reg, this](const std::vector<JSPropertyInfo>& Infos, int IsStatic)
    {
        for (int i = 0; i < static_cast<int>(Infos.size()); ++i)
        {
            Reg->set_property_info(nullptr, this, i, Infos[i].Name, IsStatic, Infos[i].Getter, Infos[i].Setter, Infos[i].GetterData,
                Infos[i].SetterData, 1);
        }
    };
    SetMethods(Members.Methods, 0);
    SetMethods(Members.Functions, 1);
    SetProperties(Members.Properties, 0);
    SetProperties(Members.Variables, 1);

    // set_method_info drops the reflection info, the static bindings (FindClassByType) need it for fast calls (v8)
    if (auto Definition = const_cast<JSClassDefinition*>(FindClassByID(GetDefaultClassRegistry(), this)))
    {
        for (size_t i = 0; i < Members.Methods.size(); ++i)
        {
            Definition->Methods[i].ReflectionInfo = Members.Methods[i].ReflectionInfo;
        }
        for (size_t i = 0; i < Members.Functions.size(); ++i)
        {
            Definition->Functions[i].ReflectionInfo = Members.Functions[i].ReflectionInfo;
        }
    }

    if (!IsStruct)
    {
        // a UObject is never owned by js, the env keeps it alive while it is bound
        Reg->trace_native_object_lifecycle(nullptr, this, &FClassWrapper::ReflectedOnEnter, &FClassWrapper::ReflectedOnExit);
    }

    DefinedStruct = InStruct;
}

void FStructWrapper::CollectMembers(UStruct* InStruct, FReflectedMembers* Out)
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
                // 这里同时绑定带Suffix和不带Suffix的后缀是为了兼容现有的一些不带Suffix的js代码
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

    Apis->add_return(Info, PapiDataTransfer::FindOrAddObject(Apis, Env, This->Struct->GetClass(), This->Struct.Get()));
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
        const FString Name = PapiDataTransfer::ToFString(Apis, Env, NameValue);
        UObject* Object = nullptr;
        if (ArgCount > 1)
        {
            UObject* Outer = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 1));
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
            Apis->add_return(Info, PapiDataTransfer::FindOrAddObject(Apis, Env, Object->GetClass(), Object));
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
        auto Path = PapiDataTransfer::ToFString(Apis, Env, PathValue);

        if (FPackageName::DoesPackageExist(FSoftObjectPath(Path).GetLongPackageName()))
        {
            auto Object =
                StaticLoadObject(Class, nullptr, UnEscape ? *TypeScriptVariableNameToFilename(Path) : *Path, nullptr, LOAD_NoWarn);
            if (Object)
            {
                Apis->add_return(Info, PapiDataTransfer::FindOrAddObject(Apis, Env, Object->GetClass(), Object));
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
                Properties[i]->JsToUEInContainer(Apis, Env, Info, Apis->get_arg(Info, i), Memory, false);
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

void* FClassWrapper::ReflectedOnEnter(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Obj, void* Ptr, void* ClassData, void* EnvPrivate)
{
    if (auto ObjectMapper = static_cast<IObjectMapper*>(EnvPrivate))
    {
        return ObjectMapper->OnUObjectEnter(Env, Obj, static_cast<UObject*>(Ptr));
    }
    return nullptr;
}

void FClassWrapper::ReflectedOnExit(void* Ptr, void* ClassData, void* EnvPrivate, void* UserData)
{
    if (auto ObjectMapper = static_cast<IObjectMapper*>(EnvPrivate))
    {
        ObjectMapper->OnUObjectExit(static_cast<UObject*>(Ptr), UserData);
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
            Outer = PapiDataTransfer::GetUObjectOfValue(Apis, Env, OuterValue);
            if (!Outer || PapiUtils::IsReleasedPtr(Outer))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return nullptr;
            }
        }
    }
    if (ArgsLen > 1)
    {
        Name = FName(*PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 1)));
    }
    if (ArgsLen > 2)
    {
        ObjectFlags = (EObjectFlags) (Apis->get_value_int32(Env, Apis->get_arg(Info, 2)));
    }
    UObject* Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags);

    // the backend binds Object to the object being constructed (not owned by js) and calls ReflectedOnEnter
    return Object;
}
}    // namespace PUERTS_NAMESPACE
