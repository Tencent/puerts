/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if !defined(ENGINE_INDEPENDENT_JSENV)

#include "ScriptEnvMixin.h"
#include "ScriptEnvMixinApi.h"
#include "ScriptEnvImpl.h"
#include "Binding.hpp"
#include "PapiDataTransfer.h"
#include "PapiUtils.h"
#include "PapiEnvScope.h"
#include "StructWrapper.h"
#include "JSGeneratedClass.h"
#include "JSGeneratedFunction.h"
#include "Blueprint/WidgetBlueprintGeneratedClass.h"

// the type of puerts.__mixin
UsingNamedCppType(PUERTS_NAMESPACE::FScriptEnvMixin, PuertsScriptEnvMixin);

namespace PUERTS_NAMESPACE
{
static const FName MixinExtensionName(TEXT("Mixin"));

// the mixin methods of the env
class FSelfMixinInvoker : public IMixinInvoker
{
public:
    explicit FSelfMixinInvoker(FScriptEnvMixin* InParent) : Parent(InParent)
    {
    }

    virtual void InvokeMixinMethod(
        UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
    {
        Parent->InvokeMixinMethod(ContextObject, Function, Stack, RESULT_PARAM);
    }

    FScriptEnvMixin* Parent;
};

// the mixin methods of a group, called in the env chosen by the selector
class FGroupMixinInvoker : public IMixinInvoker
{
public:
    explicit FGroupMixinInvoker(std::vector<FScriptEnvMixin*> InMixins) : Mixins(std::move(InMixins))
    {
    }

    FORCEINLINE int GetSelectIndex(UObject* Object)
    {
        int Size = Mixins.size();
        int Index = Selector ? Selector(Object, Size) : 0;
        return (Index > 0 && Index < Size) ? Index : 0;
    }

    virtual void InvokeMixinMethod(
        UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
    {
        Mixins[GetSelectIndex(ContextObject)]->InvokeMixinMethod(ContextObject, Function, Stack, RESULT_PARAM);
    }

    std::vector<FScriptEnvMixin*> Mixins;

    std::function<int(UObject*, int)> Selector;
};

template <FScriptEnvMixin::PapiMethodCallback Method>
void FScriptEnvMixin::PapiMethod(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (Apis->get_native_holder_typeid(Info) != StaticTypeId<FScriptEnvMixin>::get())
    {
        Apis->throw_by_string(Info, "the receiver is not puerts.__mixin");
        return;
    }
    (static_cast<FScriptEnvMixin*>(Apis->get_native_holder_ptr(Info))->*Method)(Apis, Info);
}

void FScriptEnvMixin::RegisterMixinClass()
{
    static bool Registered = false;
    if (Registered)
    {
        return;
    }
    Registered = true;
    DefineClass<FScriptEnvMixin>()
        .Method("mixin", &PapiMethod<&FScriptEnvMixin::Mixin>, nullptr)
        .Method("unmixin", &PapiMethod<&FScriptEnvMixin::Unmixin>, nullptr)
        // the mixin is owned by the env
        .Register(nullptr);
}

FScriptEnvMixin* FScriptEnvMixin::Enable(FScriptEnvImpl* ScriptEnv)
{
    if (FScriptEnvMixin* Existed = Get(ScriptEnv))
    {
        return Existed;
    }
    FScriptEnvMixin* Ret = nullptr;
    {
        FPapiEnvScope EnvScope(ScriptEnv->GetApis(), ScriptEnv->GetMainEnvRef());
        if (!EnvScope)
        {
            return nullptr;
        }
        pesapi_env Env = EnvScope.GetEnv();
        struct pesapi_ffi* Apis = ScriptEnv->GetApis();
        // blueprint.mixin is of the js scripts (puerts/mixin.js)
        if (!Apis->is_object(Env, Apis->get_property(Env, Apis->global(Env), "puerts")))
        {
            ScriptEnv->GetLogger()->Warn(TEXT("mixin is only supported by the js backends"));
            return nullptr;
        }
        auto Mixin = std::make_unique<FScriptEnvMixin>(Apis, Env, ScriptEnv->GetLogger());
        Ret = Mixin.get();
        ScriptEnv->AddExtension(std::move(Mixin));
    }
    // adds blueprint.mixin/unmixin, takes puerts.__mixin away
    static_cast<IPapiScriptHost*>(ScriptEnv)->ExecuteModule(TEXT("puerts/mixin.js"));
    return Ret;
}

FScriptEnvMixin* FScriptEnvMixin::Get(FScriptEnvImpl* ScriptEnv)
{
    return static_cast<FScriptEnvMixin*>(ScriptEnv->FindExtension(MixinExtensionName));
}

void FScriptEnvMixin::EnableGroup(const std::vector<FScriptEnvImpl*>& ScriptEnvs)
{
    std::vector<FScriptEnvMixin*> Mixins;
    for (FScriptEnvImpl* ScriptEnv : ScriptEnvs)
    {
        FScriptEnvMixin* Mixin = Enable(ScriptEnv);
        if (!Mixin)
        {
            return;
        }
        Mixins.push_back(Mixin);
    }
    if (Mixins.empty() || Mixins[0]->GroupInvoker)
    {
        return;
    }
    auto Group = MakeShared<FGroupMixinInvoker, ESPMode::ThreadSafe>(Mixins);
    for (FScriptEnvMixin* Mixin : Mixins)
    {
        Mixin->Invoker = Group;
        Mixin->GroupInvoker = &Group.Get();
    }
}

void FScriptEnvMixin::SetGroupSelector(FScriptEnvImpl* ScriptEnv, std::function<int(UObject*, int)> InSelector)
{
    FScriptEnvMixin* Mixin = Get(ScriptEnv);
    if (Mixin && Mixin->GroupInvoker)
    {
        Mixin->GroupInvoker->Selector = InSelector;
    }
}

FScriptEnvMixin::FScriptEnvMixin(struct pesapi_ffi* InApis, pesapi_env Env, std::shared_ptr<ILogger> InLogger)
    : MainApis(InApis), Logger(std::move(InLogger))
{
#ifdef SINGLE_THREAD_VERIFY
    BoundThreadId = FPlatformTLS::GetCurrentThreadId();
#endif
    Invoker = MakeShared<FSelfMixinInvoker, ESPMode::ThreadSafe>(this);

    RegisterMixinClass();
    pesapi_value PapiPuertsObj = MainApis->get_property(Env, MainApis->global(Env), "puerts");
    MainApis->set_property(
        Env, PapiPuertsObj, "__mixin", MainApis->native_object_to_value(Env, StaticTypeId<FScriptEnvMixin>::get(), this, false));
}

FScriptEnvMixin::~FScriptEnvMixin()
{
}

FName FScriptEnvMixin::GetExtensionName() const
{
    return MixinExtensionName;
}

void FScriptEnvMixin::OnEnvExit()
{
    MixinFunctionMap.Empty();
}

void FScriptEnvMixin::OnEnvReleased()
{
    Invoker.Reset();
    GroupInvoker = nullptr;

    for (size_t i = 0; i < MixinClasses.Num(); i++)
    {
        if (MixinClasses[i].IsValid())
        {
            UJSGeneratedClass::Restore(MixinClasses[i].Get());
        }
    }
}

void FScriptEnvMixin::NotifyUObjectDeleted(const class UObjectBase* Object)
{
    MixinFunctionMap.Remove((UFunction*) Object);
}

void FScriptEnvMixin::InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto JsFuncPtr = MixinFunctionMap.Find(Function);
    if (!JsFuncPtr || !*JsFuncPtr)
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        UJSGeneratedFunction::SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }

    struct pesapi_ffi* Apis = MainApis;
    pesapi_env_ref EnvRef = Apis->get_ref_associated_env(JsFuncPtr->GetRef());
    pesapi_scope_memory ScopeMemory;
    pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
    pesapi_env Env = Apis->get_env_from_ref(EnvRef);

    pesapi_value Self = PapiUtils::ObjectMapperOf(Apis, Env)->FindOrAdd(Env, ContextObject->GetClass(), ContextObject);

    Function->FunctionTranslator->CallJs(Apis, Env, JsFuncPtr->Get(Env), Self, ContextObject, Stack, RESULT_PARAM);

    if (Apis->has_caught(Scope))
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope, true))));
    }
    Apis->close_scope_placement(Scope);
}

UClass* FScriptEnvMixin::GetClassArg(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);

    UClass* To = nullptr;
    if (UObject* Object = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 0)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return nullptr;
        }
        To = Cast<UClass>(Object);
    }

    if (!To)
    {
        Apis->throw_by_string(Info, "#0 parameter expect a Blueprint UClass");
    }
    return To;
}

void FScriptEnvMixin::Unmixin(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject);

    UClass* To = GetClassArg(Apis, Info);
    if (!To)
    {
        return;
    }
    MixinClasses.Remove(To);
    UJSGeneratedClass::Restore(To);
}

void FScriptEnvMixin::Mixin(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject, EArgObject);

    pesapi_env Env = Apis->get_env(Info);

    UClass* To = GetClassArg(Apis, Info);
    if (!To)
    {
        return;
    }

    if (MixinClasses.Contains(To))
    {
        Apis->throw_by_string(Info, "had mixin");
        return;
    }

    auto BoolArg = [Apis, Env, Info](int Index)
    {
        pesapi_value Arg = Apis->get_arg(Info, Index);
        return Apis->is_boolean(Env, Arg) && Apis->get_value_bool(Env, Arg);
    };

    pesapi_value MixinMethods = Apis->get_arg(Info, 1);

    bool Inherit = BoolArg(2);

    bool NoWarning = BoolArg(3);

    UClass* New = To;

    if (Inherit)
    {
        New = NewObject<UClass>(To->GetOuter(), To->GetClass(),
            MakeUniqueObjectName(To->GetOuter(), To->GetClass(), *(To->GetName() + TEXT("_MixinGen_"))));
        New->PropertyLink = To->PropertyLink;
        New->ClassWithin = To->ClassWithin;
        New->ClassConfigName = To->ClassConfigName;
        New->ClassFlags = To->ClassFlags;
        New->ClassCastFlags = To->ClassCastFlags;
        New->ClassConstructor = To->ClassConstructor;
        New->ClassFlags = New->ClassFlags | EClassFlags::CLASS_Transient;
        New->ClassFlags = New->ClassFlags & (~EClassFlags::CLASS_Intrinsic);
        New->SetFlags(EObjectFlags::RF_Transient);
        New->SetSuperStruct(To);
    }

    // papi has no own property enumeration, use Object.getOwnPropertyNames (mixin is not a hot path)
    static const char GetNamesCode[] = "Object.getOwnPropertyNames";
    pesapi_value GetNames = Apis->eval(Env, (const uint8_t*) GetNamesCode, sizeof(GetNamesCode) - 1, "puerts/mixin_names");
    pesapi_value GetNamesArgs[] = {MixinMethods};
    pesapi_value Keys = GetNames ? Apis->call_function(Env, GetNames, nullptr, 1, GetNamesArgs) : nullptr;
    if (!Keys)
    {
        return;    // the exception propagates to the js caller
    }
    TArray<FName> ReplaceMethodNames;
    const uint32_t KeysLen = Apis->get_array_length(Env, Keys);
    TArray<char> KeyBuf;
    for (uint32_t i = 0; i < KeysLen; ++i)
    {
        pesapi_value Key = Apis->get_property_uint32(Env, Keys, i);
        size_t KeyLen = 0;
        Apis->get_value_string_utf8(Env, Key, nullptr, &KeyLen);
        KeyBuf.SetNumUninitialized(static_cast<int32>(KeyLen) + 1);
        Apis->get_value_string_utf8(Env, Key, KeyBuf.GetData(), &KeyLen);
        KeyBuf[static_cast<int32>(KeyLen)] = '\0';
        FName MethodName = UTF8_TO_TCHAR(KeyBuf.GetData());
        auto Function = To->FindFunctionByName(MethodName);
        if (Function)
        {
            pesapi_value JsFunc = Apis->get_property(Env, MixinMethods, KeyBuf.GetData());
            auto MixinedFunc = UJSGeneratedClass::Mixin(New, Function, Invoker, !NoWarning);
            MixinFunctionMap.Emplace(MixinedFunc, FPapiValueRef(Apis, Env, JsFunc));
            ReplaceMethodNames.Add(MethodName);
        }
    }

    if (Inherit)
    {
        New->Bind();
        New->StaticLink(true);

        auto CDO = New->GetDefaultObject();
        if (auto WidgetClass = Cast<UWidgetBlueprintGeneratedClass>(New))
        {
            WidgetClass->UpdateCustomPropertyListForPostConstruction();
        }
        else if (auto BPClass = Cast<UBlueprintGeneratedClass>(New))
        {
            BPClass->UpdateCustomPropertyListForPostConstruction();
        }

        if (CDO->IsA<AActor>())
        {
            if (UBlueprintGeneratedClass* BPGClass = Cast<UBlueprintGeneratedClass>(New))
            {
                BPGClass->bCooked = true;
            }
        }

#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION > 12
        // 拷贝创建的Class需要手动重新创建ReferenceTokenStream
        New->AssembleReferenceTokenStream(true);
#endif
    }
    else
    {
        To->ClearFunctionMapsCaches();
        auto StructWrapper = FStructWrapper::FindOrAdd(To);
        for (int i = 0; i < ReplaceMethodNames.Num(); i++)
        {
            StructWrapper->RefreshMethod(To->FindFunctionByName(ReplaceMethodNames[i]));
        }
    }
    MixinClasses.Add(New);

    Apis->add_return(Info, PapiUtils::ObjectMapperOf(Apis, Env)->FindOrAdd(Env, New->GetClass(), New));
}

void EnableMixin(FScriptEnv& Env)
{
    FScriptEnvMixin::Enable(static_cast<FScriptEnvImpl*>(Env.GetScriptEnv()));
}

void EnableMixin(FScriptEnvGroup& Group)
{
    std::vector<FScriptEnvImpl*> ScriptEnvs;
    for (int i = 0; i < Group.Num(); i++)
    {
        ScriptEnvs.push_back(static_cast<FScriptEnvImpl*>(Group.Get(i).get()));
    }
    FScriptEnvMixin::EnableGroup(ScriptEnvs);
}

void SetMixinSelector(FScriptEnvGroup& Group, std::function<int(UObject*, int)> InSelector)
{
    if (Group.Num() > 0)
    {
        FScriptEnvMixin::SetGroupSelector(static_cast<FScriptEnvImpl*>(Group.Get(0).get()), InSelector);
    }
}

}    // namespace PUERTS_NAMESPACE

#else

#include "ScriptEnvMixinApi.h"

namespace PUERTS_NAMESPACE
{
void EnableMixin(FScriptEnv& Env)
{
}
}    // namespace PUERTS_NAMESPACE

#endif
