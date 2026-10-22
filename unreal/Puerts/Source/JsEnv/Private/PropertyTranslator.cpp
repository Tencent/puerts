/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PropertyTranslator.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "StructWrapper.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#if (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 5)
#include "StructUtils/UserDefinedStruct.h"
#else
#include "Engine/UserDefinedStruct.h"
#endif
#endif
#include "ArrayBuffer.h"
#include "ContainerWrapper.h"
#include "JsObject.h"
#ifdef PUERTS_FTEXT_AS_OBJECT
#include "TypeInfo.hpp"
#endif

namespace PUERTS_NAMESPACE
{
void FPropertyTranslator::Getter(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    FPropertyTranslator* This = static_cast<FPropertyTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->Getter(Isolate, Context, Info);
}

void FPropertyTranslator::Getter(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (!IsPropertyValid())
    {
        FV8Utils::ThrowException(Isolate, "Property is invalid!");
        return;
    }

    v8::Local<v8::Value> Ret;

    if (OwnerIsClass)
    {
        UObject* Object = FV8Utils::GetUObject(Info.Holder());
        if (!Object)
        {
            FV8Utils::ThrowException(Isolate, "access a null object");
            return;
        }
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "access a invalid object");
            return;
        }
        Ret = UEToJsInContainer(Isolate, Context, Object, true);
    }
    else
    {
        auto Ptr = FV8Utils::GetPointer(Info.Holder());
        if (!Ptr)
        {
            FV8Utils::ThrowException(Isolate, "access a null struct");
            return;
        }
        Ret = UEToJsInContainer(Isolate, Context, Ptr, true);
    }
    if (NeedLinkOuter)
    {
        LinkOuterImpl(Context, Info.Holder(), Ret);
    }
    Info.GetReturnValue().Set(Ret);
}

void FPropertyTranslator::Setter(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    FPropertyTranslator* This = static_cast<FPropertyTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    This->Setter(Isolate, Context, Info[0], Info);
}

void FPropertyTranslator::Setter(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Value> Value,
    const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (!IsPropertyValid())
    {
        FV8Utils::ThrowException(Isolate, "Property is invalid!");
        return;
    }

    if (OwnerIsClass)
    {
        UObject* Object = FV8Utils::GetUObject(Info.Holder());
        if (!Object)
        {
            FV8Utils::ThrowException(Isolate, "access a null object");
            return;
        }
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "access a invalid object");
            return;
        }
        JsToUEInContainer(Isolate, Context, Value, Object, true);
    }
    else
    {
        auto Ptr = FV8Utils::GetPointer(Info.Holder());
        if (!Ptr)
        {
            FV8Utils::ThrowException(Isolate, "access a null struct");
            return;
        }
        JsToUEInContainer(Isolate, Context, Value, Ptr, true);
    }
}

void FPropertyTranslator::DelegateGetter(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    FPropertyTranslator* PropertyTranslator =
        static_cast<FPropertyTranslator*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    if (!PropertyTranslator->IsPropertyValid())
    {
        FV8Utils::ThrowException(Isolate, "Property is invalid!");
        return;
    }

    auto Object = FV8Utils::GetUObject(Info.Holder());
    if (!Object)
    {
        FV8Utils::ThrowException(Isolate, "access a null object");
        return;
    }
    if (FV8Utils::IsReleasedPtr(Object))
    {
        FV8Utils::ThrowException(Isolate, "access a invalid object");
        return;
    }
    auto DelegatePtr = PropertyTranslator->Property->ContainerPtrToValuePtr<void>(Object);

    Info.GetReturnValue().Set(FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddDelegate(
        Isolate, Context, Object, PropertyTranslator->Property, DelegatePtr, true));
}

void FPropertyTranslator::SetAccessor(v8::Isolate* Isolate, v8::Local<v8::FunctionTemplate> Template)
{
    if (Property->IsA<DelegatePropertyMacro>() || Property->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
        || Property->IsA<MulticastInlineDelegatePropertyMacro>() || Property->IsA<MulticastSparseDelegatePropertyMacro>()
#endif
    )
    {
        if (Property->GetOwnerStruct()->IsA<UClass>())    // only uobject support
        {
            auto DelegateGetterTemplate = v8::FunctionTemplate::New(Isolate, DelegateGetter, v8::External::New(Isolate, this));
            Template->PrototypeTemplate()->SetAccessorProperty(FV8Utils::InternalString(Isolate, Property->GetName()),
                DelegateGetterTemplate, v8::Local<v8::FunctionTemplate>(), (v8::PropertyAttribute)(v8::DontDelete | v8::ReadOnly));
        }
    }
    else
    {
        auto OwnerStruct = Property->GetOwnerStruct();
        auto Self = v8::External::New(Isolate, this);
        auto GetterTemplate = v8::FunctionTemplate::New(Isolate, Getter, Self);
        auto SetterTemplate = v8::FunctionTemplate::New(Isolate, Setter, Self);
#if !defined(ENGINE_INDEPENDENT_JSENV)
        FString PropertyName = OwnerStruct && OwnerStruct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                                     Property->GetAuthoredName()
#else
                                                                                     Property->GetDisplayNameText().ToString()
#endif
                                                                                     : Property->GetName();
#ifdef PUERTS_WITH_EDITOR_SUFFIX
        if (Property->IsEditorOnlyProperty())
        {
            PropertyName += EditorOnlyPropertySuffix;
        }
#endif

        Template->PrototypeTemplate()->SetAccessorProperty(
            FV8Utils::InternalString(Isolate, PropertyName), GetterTemplate, SetterTemplate, v8::DontDelete);
#else
        Template->PrototypeTemplate()->SetAccessorProperty(
            FV8Utils::InternalString(Isolate, Property->GetName()), GetterTemplate, SetterTemplate, v8::DontDelete);
#endif
    }
}

// helpers of the papi based translators

static FORCEINLINE FString PapiToFString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    FString Ret;
    size_t Len = 0;
    Apis->get_value_string_utf16(Env, Value, nullptr, &Len);
    if (Len > 0)
    {
        TArray<TCHAR>& CharArray = Ret.GetCharArray();
        CharArray.SetNumUninitialized(static_cast<int32>(Len) + 1);
        Apis->get_value_string_utf16(Env, Value, reinterpret_cast<uint16_t*>(CharArray.GetData()), &Len);
        CharArray[static_cast<int32>(Len)] = TEXT('\0');
    }
    return Ret;
}

static FORCEINLINE pesapi_value PapiFromFString(struct pesapi_ffi* Apis, pesapi_env Env, const FString& Str)
{
    static_assert(sizeof(TCHAR) == sizeof(uint16_t), "TCHAR must be UTF-16");
    return Apis->create_string_utf16(Env, reinterpret_cast<const uint16_t*>(*Str), static_cast<size_t>(Str.Len()));
}

// the same as FV8Utils::ToV8String(FName): comparison entry plus "_N" suffix
static FORCEINLINE FString NameToFString(const FName& Name)
{
    const FNameEntry* Entry = Name.GetComparisonNameEntry();
    FString Out;
    if (Name.GetNumber() == NAME_NO_NUMBER_INTERNAL)
    {
        Out.Empty(Entry->GetNameLength());
        Entry->AppendNameToString(Out);
    }
    else
    {
        Out.Empty(Entry->GetNameLength() + 6);
        Entry->AppendNameToString(Out);

        Out += TEXT('_');
        Out.AppendInt(NAME_INTERNAL_TO_EXTERNAL(Name.GetNumber()));
    }
    return Out;
}

// translators not migrated yet (they still depend on IObjectMapper/DataTransfer) implement UEToJsV8/JsToUEV8, the papi
// entries forward to them through papi_bridge, to be removed in M4
#define PUERTS_PAPI_FORWARD_UETOJS()                                                                                      \
    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override \
    {                                                                                                                     \
        v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);                                                          \
        return papi_bridge::ToPapi(UEToJsV8(Context->GetIsolate(), Context, ValuePtr, PassByPointer));                    \
    }

#define PUERTS_PAPI_FORWARD_JSTOUE()                                                                                       \
    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override \
    {                                                                                                                      \
        v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);                                                           \
        return JsToUEV8(Context->GetIsolate(), Context, papi_bridge::ToV8(Value), ValuePtr, DeepCopy);                     \
    }

class FInt32PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FInt32PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_int32(Env, static_cast<int32>(NumericProperty->GetSignedIntPropertyValue(ValuePtr)));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        NumericProperty->SetIntPropertyValue(ValuePtr, static_cast<uint64>(Apis->get_value_int32(Env, Value)));
        return true;
    }
};

class FUInt32PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FUInt32PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_uint32(Env, static_cast<uint32>(NumericProperty->GetUnsignedIntPropertyValue(ValuePtr)));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        NumericProperty->SetIntPropertyValue(ValuePtr, static_cast<uint64>(Apis->get_value_uint32(Env, Value)));
        return true;
    }
};

class FInt64PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FInt64PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_int64(Env, NumericProperty->GetSignedIntPropertyValue(ValuePtr));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        if (Apis->is_int64(Env, Value))    // keep the value untouched if not a BigInt
        {
            NumericProperty->SetIntPropertyValue(ValuePtr, static_cast<int64>(Apis->get_value_int64(Env, Value)));
        }
        return true;
    }
};

class FUInt64PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FUInt64PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_uint64(Env, NumericProperty->GetUnsignedIntPropertyValue(ValuePtr));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        if (Apis->is_int64(Env, Value))    // keep the value untouched if not a BigInt
        {
            NumericProperty->SetIntPropertyValue(ValuePtr, static_cast<uint64>(Apis->get_value_uint64(Env, Value)));
        }
        return true;
    }
};

class FNumberPropertyTranslator : public FPropertyTranslator
{
public:
    explicit FNumberPropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_double(Env, NumericProperty->GetFloatingPointPropertyValue(ValuePtr));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        NumericProperty->SetFloatingPointPropertyValue(ValuePtr, Apis->get_value_double(Env, Value));
        return true;
    }
};

class FBooleanPropertyTranslator : public FPropertyTranslator
{
public:
    explicit FBooleanPropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_boolean(Env, BoolProperty->GetPropertyValue(ValuePtr));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        BoolProperty->SetPropertyValue(ValuePtr, Apis->get_value_bool(Env, Value) != 0);
        return true;
    }
};

class FEnumPropertyTranslator : public FPropertyTranslator
{
public:
    explicit FEnumPropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_int32(
            Env, static_cast<int32>(EnumProperty->GetUnderlyingProperty()->GetSignedIntPropertyValue(ValuePtr)));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        EnumProperty->GetUnderlyingProperty()->SetIntPropertyValue(
            ValuePtr, static_cast<uint64>(Apis->get_value_int32(Env, Value)));
        return true;
    }
};

class FPropertyWithDestructorReflection : public FPropertyTranslator
{
public:
    explicit FPropertyWithDestructorReflection(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    void Cleanup(void* ContainerPtr) const override
    {
        Property->DestroyValue_InContainer(ContainerPtr);
    }
};

//----------------------------string-----------------------------

class FStringPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FStringPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return PapiFromFString(Apis, Env, StringProperty->GetPropertyValue(ValuePtr));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        StringProperty->SetPropertyValue(ValuePtr, PapiToFString(Apis, Env, Value));
        return true;
    }
};

class FNamePropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FNamePropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return PapiFromFString(Apis, Env, NameToFString(NameProperty->GetPropertyValue(ValuePtr)));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        // a FName passed by value (ArrayBuffer of sizeof(FName)), only a plain ArrayBuffer, not a view
        if (papi_bridge::ToV8(Value)->IsArrayBuffer())
        {
            size_t ByteLength = 0;
            auto Data = Apis->get_value_binary(Env, Value, &ByteLength);
            if (ByteLength == sizeof(FName))
            {
                NameProperty->SetPropertyValue(ValuePtr, *static_cast<FName*>(Data));
                return true;
            }
        }
        NameProperty->SetPropertyValue(ValuePtr, FName(*PapiToFString(Apis, Env, Value)));
        return true;
    }
};

class FTextPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FTextPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
#ifndef PUERTS_FTEXT_AS_OBJECT
        return PapiFromFString(Apis, Env, TextProperty->GetPropertyValue(ValuePtr).ToString());
#else
        v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
        return papi_bridge::ToPapi(DataTransfer::FindOrAddCData(Context->GetIsolate(), Context, StaticTypeId<FText>::get(),
            PassByPointer ? ValuePtr : new FText(TextProperty->GetPropertyValue(ValuePtr)), PassByPointer));
#endif
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
#ifndef PUERTS_FTEXT_AS_OBJECT
        TextProperty->SetPropertyValue(ValuePtr, FText::FromString(PapiToFString(Apis, Env, Value)));
#else
        auto TextPtr = DataTransfer::GetPointerFast<FText>(papi_bridge::ToV8(Value).As<v8::Object>());
        TextProperty->SetPropertyValue(ValuePtr, TextPtr ? *TextPtr : FText());
#endif
        return true;
    }
};

// object,  class, struct
class FObjectPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FObjectPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        UObject* UEObject = ObjectBaseProperty->GetObjectPropertyValue(ValuePtr);

        if (!UEObject || !UEObject->IsValidLowLevelFast() || UEObjectIsPendingKill(UEObject))
        {
            return v8::Undefined(Isolate);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, UEObject->GetClass(), UEObject);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        auto Object = FV8Utils::GetUObject(Context, Value);
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return false;
        }
        ObjectBaseProperty->SetObjectPropertyValue(ValuePtr, Object);
        return true;
    }

private:
};

class FSoftObjectPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FSoftObjectPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        const FSoftObjectPtr* Ptr = SoftObjectProperty->GetPropertyValuePtr(ValuePtr);
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->AddSoftObjectPtr(
            Isolate, Context, new FSoftObjectPtr(*Ptr), SoftObjectProperty->PropertyClass, false);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        FSoftObjectPtr* Ptr = static_cast<FSoftObjectPtr*>(FV8Utils::GetPointer(Context, Value));
        if (!Ptr)
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object for FSoftObjectPtr");
            return false;
        }

        SoftObjectProperty->SetPropertyValue(ValuePtr, *Ptr);

        return true;
    }
};

class FSoftClassPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FSoftClassPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        const FSoftObjectPtr* Ptr = SoftObjectProperty->GetPropertyValuePtr(ValuePtr);
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->AddSoftObjectPtr(
            Isolate, Context, new FSoftObjectPtr(*Ptr), SoftClassProperty->MetaClass, true);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        FSoftObjectPtr* Ptr = static_cast<FSoftObjectPtr*>(FV8Utils::GetPointer(Context, Value));
        if (!Ptr)
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object for FSoftObjectPtr");
            return false;
        }

        SoftObjectProperty->SetPropertyValue(ValuePtr, *Ptr);

        return true;
    }
};

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
class FFieldPathPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FFieldPathPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return PapiFromFString(Apis, Env, FieldPathProperty->GetPropertyValuePtr(ValuePtr)->ToString());
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        auto Path = PapiToFString(Apis, Env, Value);
        FFieldPath FieldPath;
        FieldPath.Generate(*Path);

        if (!FieldPath.GetTyped(FieldPathProperty->PropertyClass))
        {
            // pesapi_throw_by_string needs the callback info, which is not available here
            FV8Utils::ThrowException(papi_bridge::IsolateOf(Env), FString::Printf(TEXT("invalid FieldPath: %s"), *Path));
            return false;
        }

        FieldPathProperty->SetPropertyValue(ValuePtr, FieldPath);

        return true;
    }
};
#endif

#ifdef GetObject
#undef GetObject
#endif

class FInterfacePropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FInterfacePropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        const FScriptInterface& Interface = InterfaceProperty->GetPropertyValue(ValuePtr);

        UObject* Object = Interface.GetObject();
        if (!Object || !Object->IsValidLowLevelFast() || UEObjectIsPendingKill(Object))
        {
            return v8::Undefined(Isolate);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Object->GetClass(), Object);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        UObject* Object = FV8Utils::GetUObject(Context, Value);
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return false;
        }
        FScriptInterface* Interface = reinterpret_cast<FScriptInterface*>(ValuePtr);
        Interface->SetObject(Object);
        Interface->SetInterface(Object ? Object->GetInterfaceAddress(InterfaceProperty->InterfaceClass) : nullptr);
        return true;
    }
};

class FFastPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FFastPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    bool JsToUEFast(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* TempBuff, void** OutValuePtr) const override
    {
        v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
        void* Ptr = FV8Utils::GetPointer(Context, papi_bridge::ToV8(Value));

        if (Ptr)
        {
            *OutValuePtr = Ptr;
            return true;
        }
        *OutValuePtr = TempBuff;
        return JsToUE(Apis, Env, Value, TempBuff, false);
    }
};

class FScriptStructPropertyTranslator : public FFastPropertyTranslator
{
public:
    explicit FScriptStructPropertyTranslator(PropertyMacro* InProperty) : FFastPropertyTranslator(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer)
        const    //还是得有个指针模式，否则不能通过obj.xx.xx直接修改struct值，倒是和性能无关，应该强制js测不许保存指针型对象的引用（从native侧进入，最后一层退出时清空？）
    {
        void* Ptr = const_cast<void*>(ValuePtr);

        if (!PassByPointer)
        {
            // FScriptStructWrapper::Alloc using new, so delete in static wrapper is safe
            Ptr = FScriptStructWrapper::Alloc(StructProperty->Struct);
            StructProperty->CopySingleValue(Ptr, ValuePtr);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddStruct(
            Isolate, Context, StructProperty->Struct, Ptr, PassByPointer);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        void* Ptr = FV8Utils::GetPointer(Context, Value);

        if (Ptr)
        {
            if (DeepCopy || !ParamShallowCopySize)
            {
                StructProperty->CopySingleValue(ValuePtr, Ptr);
            }
            else
            {
                FMemory::Memcpy(ValuePtr, Ptr, ParamShallowCopySize);
            }
        }
        else if (Value->IsObject())
        {
            FV8Utils::IsolateData<IObjectMapper>(Isolate)->Merge(
                Isolate, Context, Value->ToObject(Context).ToLocalChecked(), StructProperty->Struct, ValuePtr);
        }
        return true;
    }
};

class FArrayBufferPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FArrayBufferPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        void* Ptr = const_cast<void*>(ValuePtr);

        FArrayBuffer* ArrayBuffer = static_cast<FArrayBuffer*>(Ptr);
        if (ArrayBuffer->bCopy)
        {
            v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, ArrayBuffer->Length);
            void* Buff = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab));
            ::memcpy(Buff, ArrayBuffer->Data, ArrayBuffer->Length);
            return Ab;
        }
        else
        {
            return DataTransfer::NewArrayBuffer(Context, ArrayBuffer->Data, ArrayBuffer->Length);
        }
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        FArrayBuffer ArrayBuffer;
        if (Value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = Value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            ArrayBuffer.Data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
            ArrayBuffer.Length = BuffView->ByteLength();
        }
        else if (Value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(Value);
            size_t ByteLength;
            ArrayBuffer.Data = DataTransfer::GetArrayBufferData(Ab, ByteLength);
            ArrayBuffer.Length = ByteLength;
        }

        StructProperty->CopySingleValue(ValuePtr, &ArrayBuffer);

        return true;
    }
};

class FArrayBufferValuePropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FArrayBufferValuePropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        void* Ptr = const_cast<void*>(ValuePtr);

        FArrayBufferValue* ArrayBuffer = static_cast<FArrayBufferValue*>(Ptr);
        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, ArrayBuffer->Data.Num());
        void* Buff = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab));
        ::memcpy(Buff, ArrayBuffer->Data.GetData(), ArrayBuffer->Data.Num());
        return Ab;
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        FArrayBufferValue* ArrayBuffer = static_cast<FArrayBufferValue*>(ValuePtr);
        size_t Len = 0;
        char* Data = nullptr;
        if (Value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = Value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            Data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
            Len = BuffView->ByteLength();
        }
        else if (Value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(Value);
            Data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab, Len));
        }

        if (Len > 0 && Data)
        {
            ArrayBuffer->Data.AddUninitialized(Len);
            ::memcpy(ArrayBuffer->Data.GetData(), Data, Len);
        }
        else
        {
            ArrayBuffer->Data.Reset();
        }

        return true;
    }
};

class FJsObjectPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FJsObjectPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        if (!ValuePtr)
            return v8::Undefined(Isolate);
        const FJsObject* JsObject = static_cast<const FJsObject*>(ValuePtr);
        return JsObject->GetJsObject();
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        if (Value->IsObject())
        {
            auto Object = Value.As<v8::Object>();
            FJsObject JsObject(Context, Object);
            *static_cast<FJsObject*>(ValuePtr) = JsObject;
        }

        return true;
    }
};

class FClassPropertyTranslator : public FObjectPropertyTranslator
{
public:
    explicit FClassPropertyTranslator(PropertyMacro* InProperty) : FObjectPropertyTranslator(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        auto Object = FV8Utils::GetUObject(Context, Value);
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return false;
        }
        UClass* Class = Cast<UClass>(Object);
        ObjectBaseProperty->SetObjectPropertyValue(
            ValuePtr, (Class && Class->IsChildOf(ClassProperty->MetaClass)) ? Class : nullptr);
        return true;
    }
};

// containers

class FScriptArrayPropertyTranslator : public FFastPropertyTranslator
{
public:
    explicit FScriptArrayPropertyTranslator(PropertyMacro* InProperty) : FFastPropertyTranslator(InProperty)
    {
        if (Property->HasAnyPropertyFlags(CPF_OutParm) && !Property->HasAnyPropertyFlags(CPF_ConstParm))
        {
            ParamShallowCopySize = sizeof(FScriptArray);
        }
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool ByPointer) const
    {
        FScriptArray* ScriptArray;
        if (ByPointer)
        {
            ScriptArray =
                const_cast<FScriptArray*>(reinterpret_cast<const FScriptArray*>(&ArrayProperty->GetPropertyValue(ValuePtr)));
        }
        else
        {
            ScriptArray = reinterpret_cast<FScriptArray*>(new FScriptArrayEx(ArrayProperty->Inner));
            ArrayProperty->CopyCompleteValue(ScriptArray, ValuePtr);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddContainer(
            Isolate, Context, ArrayProperty->Inner, ScriptArray, ByPointer);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        auto Ptr = FV8Utils::GetPointer(Context, Value);
        if (Ptr)
        {
            if (DeepCopy || !ParamShallowCopySize)
            {
                ArrayProperty->CopyCompleteValue(ValuePtr, Ptr);
            }
            else
            {
                FMemory::Memcpy(ValuePtr, Ptr, sizeof(FScriptArray));
            }
        }
        return true;
    }

private:
};

class FScriptSetPropertyTranslator : public FFastPropertyTranslator
{
public:
    explicit FScriptSetPropertyTranslator(PropertyMacro* InProperty) : FFastPropertyTranslator(InProperty)
    {
        if (Property->HasAnyPropertyFlags(CPF_OutParm) && !Property->HasAnyPropertyFlags(CPF_ConstParm))
        {
            ParamShallowCopySize = sizeof(FScriptSet);
        }
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool ByPointer) const
    {
        FScriptSet* ScriptSet;
        if (ByPointer)
        {
            ScriptSet = const_cast<FScriptSet*>(reinterpret_cast<const FScriptSet*>(&SetProperty->GetPropertyValue(ValuePtr)));
        }
        else
        {
            ScriptSet = reinterpret_cast<FScriptSet*>(new FScriptSetEx(SetProperty->ElementProp));
            SetProperty->CopyCompleteValue(ScriptSet, ValuePtr);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddContainer(
            Isolate, Context, SetProperty->ElementProp, ScriptSet, ByPointer);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        auto Ptr = FV8Utils::GetPointer(Context, Value);
        if (Ptr)
        {
            if (DeepCopy || !ParamShallowCopySize)
            {
                SetProperty->CopyCompleteValue(ValuePtr, Ptr);
            }
            else
            {
                FMemory::Memcpy(ValuePtr, Ptr, sizeof(FScriptSet));
            }
        }
        return true;
    }

private:
};

class FScriptMapPropertyTranslator : public FFastPropertyTranslator
{
public:
    explicit FScriptMapPropertyTranslator(PropertyMacro* InProperty) : FFastPropertyTranslator(InProperty)
    {
        if (Property->HasAnyPropertyFlags(CPF_OutParm) && !Property->HasAnyPropertyFlags(CPF_ConstParm))
        {
            ParamShallowCopySize = sizeof(FScriptMap);
        }
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool ByPointer) const
    {
        FScriptMap* ScriptMap;
        if (ByPointer)
        {
            ScriptMap = const_cast<FScriptMap*>(reinterpret_cast<const FScriptMap*>(&MapProperty->GetPropertyValue(ValuePtr)));
        }
        else
        {
            ScriptMap = reinterpret_cast<FScriptMap*>(new FScriptMapEx(MapProperty->KeyProp, MapProperty->ValueProp));
            MapProperty->CopyCompleteValue(ScriptMap, ValuePtr);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddContainer(
            Isolate, Context, MapProperty->KeyProp, MapProperty->ValueProp, ScriptMap, ByPointer);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        auto Ptr = FV8Utils::GetPointer(Context, Value);
        if (Ptr)
        {
            if (DeepCopy || !ParamShallowCopySize)
            {
                MapProperty->CopyCompleteValue(ValuePtr, Ptr);
            }
            else
            {
                FMemory::Memcpy(ValuePtr, Ptr, sizeof(FScriptMap));
            }
        }
        return true;
    }

private:
};

// delegate

//另外特殊处理
class DoNothingPropertyTranslator : public FPropertyTranslator
{
public:
    explicit DoNothingPropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return Apis->create_undefined(Env);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        return true;
    }
};

// fix array
class FFixArrayReflection : public FPropertyTranslator
{
public:
    explicit FFixArrayReflection(std::unique_ptr<FPropertyTranslator> InInner) : FPropertyTranslator(InInner->Property)
    {
        Inner = std::move(InInner);
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->CreateArray(
            Isolate, Context, Inner.get(), const_cast<void*>(ValuePtr));
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        // Fix Size Array do not assignable
        return true;
    }

    virtual void Cleanup(void* ContainerPtr) const
    {
        Inner->Cleanup(ContainerPtr);
    }
};

// delegate
class FDelegatePropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FDelegatePropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    PUERTS_PAPI_FORWARD_UETOJS()

    v8::Local<v8::Value> UEToJsV8(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
    {
        auto DelegatePtr = static_cast<FScriptDelegate*>(const_cast<void*>(ValuePtr));

        if (DelegatePtr)
        {
            UObject* UEObject = DelegatePtr->GetUObject();
            if (UEObject && UEObject->IsValidLowLevelFast() && !UEObjectIsPendingKill(UEObject))
            {
                return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddDelegate(
                    Isolate, Context, UEObject, DelegateProperty, DelegatePtr, PassByPointer);
            }
        }
        return v8::Undefined(Isolate);
    }

    PUERTS_PAPI_FORWARD_JSTOUE()

    bool JsToUEV8(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        FScriptDelegate* Des = DelegateProperty->GetPropertyValuePtr(ValuePtr);
        if (Value->IsFunction())
        {
            *Des = FV8Utils::IsolateData<IObjectMapper>(Isolate)->NewDelegate(
                Isolate, Context, nullptr, Value.As<v8::Function>(), DelegateProperty->SignatureFunction);
        }
        else
        {
            auto Src = static_cast<FScriptDelegate*>(FV8Utils::GetPointer(Context, Value, 0));
            if (Des && Src)
            {
                *Des = *Src;
            }
            else if (Des && Value->IsArray())
            {
                auto Array = Value->ToObject(Context).ToLocalChecked();
                auto Obj = FV8Utils::GetUObject(Context, Array->Get(Context, 0).ToLocalChecked());
                if (Obj)
                {
                    if (FV8Utils::IsReleasedPtr(Obj))
                    {
                        FV8Utils::ThrowException(Isolate, "passing a invalid object");
                        return false;
                    }

                    auto Func = Array->Get(Context, 1).ToLocalChecked();
                    if (Func->IsString())
                    {
                        FScriptDelegate Delegate;
                        Delegate.BindUFunction(Obj, *FV8Utils::ToFString(Isolate, Func));
                        *Des = Delegate;
                    }
                    else if (Func->IsFunction())
                    {
                        *Des = FV8Utils::IsolateData<IObjectMapper>(Isolate)->NewDelegate(
                            Isolate, Context, Obj, Func.As<v8::Function>(), DelegateProperty->SignatureFunction);
                    }
                }
            }
        }
        return true;
    }

private:
};

class FOutReflection : public FPropertyTranslator
{
public:
    explicit FOutReflection(std::unique_ptr<FPropertyTranslator> InInner) : FPropertyTranslator(InInner->Property)
    {
        Inner = std::move(InInner);
        ParamShallowCopySize = Inner->ParamShallowCopySize;
    }

    // {
    //    value : realvalue
    // }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        auto Result = Apis->create_object(Env);
        Apis->set_property_uint32(Env, Result, 0, Inner->UEToJs(Apis, Env, ValuePtr, PassByPointer));
        return Result;
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        if (Apis->is_object(Env, Value))
        {
            auto Realvalue = Apis->get_property_uint32(Env, Value, 0);
            return Inner->JsToUE(Apis, Env, Realvalue, ValuePtr, DeepCopy);
        }
        return true;
    }

    bool JsToUEFast(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* TempBuff, void** OutValuePtr) const override
    {
        if (Apis->is_object(Env, Value))
        {
            auto Realvalue = Apis->get_property_uint32(Env, Value, 0);
            return Inner->JsToUEFast(Apis, Env, Realvalue, TempBuff, OutValuePtr);
        }
        *OutValuePtr = TempBuff;
        return true;
    }

    void UEOutToJs(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, const void* ValuePtr, bool PassByPointer) const override
    {
        if (Apis->is_object(Env, Value))
        {
            if (Inner->ParamShallowCopySize)
            {
                auto Realvalue = Apis->get_property_uint32(Env, Value, 0);
                v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
                auto Ptr = FV8Utils::GetPointer(Context, papi_bridge::ToV8(Realvalue));
                if (Ptr && Ptr != ValuePtr)
                {
                    FMemory::Memcpy(Ptr, ValuePtr, ParamShallowCopySize);
                    return;
                }
            }

            Apis->set_property_uint32(Env, Value, 0, Inner->UEToJs(Apis, Env, ValuePtr, PassByPointer));
            if (Inner->ParamShallowCopySize)    // $ref(undefined) for shallow copy type
            {
                Property->DestroyValue(const_cast<void*>(ValuePtr));
            }
        }
    }

    bool JsToUEOut(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        return JsToUE(Apis, Env, Value, ValuePtr, DeepCopy);
    }

    bool IsOut() const override
    {
        return true;
    }

    void Cleanup(void* ContainerPtr) const override
    {
        Inner->Cleanup(ContainerPtr);
    }
};

template <template <class> class Creator, typename Ret>
struct PropertyTranslatorCreator
{
    // #lizard forgives
    static Ret Do(PropertyMacro* InProperty, bool IgnoreOut, void* Ptr)
    {
        if (InProperty->IsA<BytePropertyMacro>() || InProperty->IsA<Int8PropertyMacro>() || InProperty->IsA<Int16PropertyMacro>() ||
            InProperty->IsA<IntPropertyMacro>() || InProperty->IsA<UInt16PropertyMacro>())
        {
            return Creator<FInt32PropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<Int64PropertyMacro>())
        {
            return Creator<FInt64PropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<UInt32PropertyMacro>())
        {
            return Creator<FUInt32PropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<UInt64PropertyMacro>())
        {
            return Creator<FUInt64PropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<DoublePropertyMacro>() || InProperty->IsA<FloatPropertyMacro>())    // 11
        {
            return Creator<FNumberPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<EnumPropertyMacro>())
        {
            return Creator<FEnumPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<BoolPropertyMacro>())
        {
            return Creator<FBooleanPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<StrPropertyMacro>())
        {
            return Creator<FStringPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<NamePropertyMacro>())
        {
            return Creator<FNamePropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<TextPropertyMacro>())
        {
            return Creator<FTextPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<ClassPropertyMacro>())
        {
            return Creator<FClassPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<ObjectPropertyMacro>() || InProperty->IsA<WeakObjectPropertyMacro>() ||
                 InProperty->IsA<LazyObjectPropertyMacro>())
        {
            return Creator<FObjectPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<SoftClassPropertyMacro>())
        {
            return Creator<FSoftClassPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<SoftObjectPropertyMacro>())
        {
            return Creator<FSoftObjectPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<StructPropertyMacro>())
        {
            auto StructProperty = CastFieldMacro<StructPropertyMacro>(InProperty);
            if (StructProperty->Struct == FArrayBuffer::StaticStruct())
            {
                return Creator<FArrayBufferPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
            }
            else if (StructProperty->Struct == FArrayBufferValue::StaticStruct())
            {
                return Creator<FArrayBufferValuePropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
            }
            else if (StructProperty->Struct == FJsObject::StaticStruct())
            {
                return Creator<FJsObjectPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
            }
            else
            {
                return Creator<FScriptStructPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
            }
        }
        else if (InProperty->IsA<InterfacePropertyMacro>())
        {
            return Creator<FInterfacePropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<ArrayPropertyMacro>())
        {
            return Creator<FScriptArrayPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<MapPropertyMacro>())
        {
            return Creator<FScriptMapPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<SetPropertyMacro>())
        {
            return Creator<FScriptSetPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<DelegatePropertyMacro>())
        {
            return Creator<FDelegatePropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
        else if (InProperty->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                 || InProperty->IsA<MulticastInlineDelegatePropertyMacro>() ||
                 InProperty->IsA<MulticastSparseDelegatePropertyMacro>()
#endif
        )
        {
            return Creator<DoNothingPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);    //统一在别的地方处理
        }
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        else if (InProperty->IsA<FFieldPathProperty>())
        {
            return Creator<FFieldPathPropertyTranslator>::Do(InProperty, IgnoreOut, Ptr);
        }
#endif
        else
        {
            return Creator<DoNothingPropertyTranslator>::Do(InProperty, IgnoreOut,
                Ptr);    //还没做支持的忽略掉加载错误好了，ts那本来对这种不支持的类型就不生成ts声明，忽略影响也不大
        }
    }
};

template <typename T>
std::unique_ptr<FPropertyTranslator> TCreateIgnoreOut(PropertyMacro* InProperty)
{
    if (InProperty->ArrayDim > 1)
    {
        return std::make_unique<FFixArrayReflection>(std::make_unique<T>(InProperty));
    }
    else
    {
        return std::make_unique<T>(InProperty);
    }
}

template <typename T>
struct UniquePtrCreator
{
    static std::unique_ptr<FPropertyTranslator> Do(PropertyMacro* InProperty, bool IgnoreOut, void* Ptr)
    {
        if (!IgnoreOut && (InProperty->PropertyFlags & CPF_Parm) && (InProperty->PropertyFlags & CPF_OutParm) &&
            (!(InProperty->PropertyFlags & CPF_ConstParm)) && (!(InProperty->PropertyFlags & CPF_ReturnParm)))
        {
            return std::make_unique<FOutReflection>(TCreateIgnoreOut<T>(InProperty));
        }
        else
        {
            return TCreateIgnoreOut<T>(InProperty);
        }
    }
};

template <>
struct UniquePtrCreator<DoNothingPropertyTranslator>
{
    static std::unique_ptr<FPropertyTranslator> Do(PropertyMacro* InProperty, bool IgnoreOut, void* Ptr)
    {
        return std::make_unique<DoNothingPropertyTranslator>(InProperty);
    }
};

std::unique_ptr<FPropertyTranslator> FPropertyTranslator::Create(PropertyMacro* InProperty, bool IgnoreOut)
{
    return PropertyTranslatorCreator<UniquePtrCreator, std::unique_ptr<FPropertyTranslator>>::Do(InProperty, IgnoreOut, nullptr);
}

template <typename T>
struct PlacementNewCreator
{
    static FPropertyTranslator* Do(PropertyMacro* InProperty, bool IgnoreOut, void* Ptr)
    {
        if (InProperty->ArrayDim > 1)
        {
            return new (Ptr) FFixArrayReflection(std::make_unique<T>(InProperty));
        }
        else
        {
            return new (Ptr) T(InProperty);
        }
    }
};

template <>
struct PlacementNewCreator<DoNothingPropertyTranslator>
{
    static FPropertyTranslator* Do(PropertyMacro* InProperty, bool IgnoreOut, void* Ptr)
    {
        return new (Ptr) DoNothingPropertyTranslator(InProperty);
    }
};

void FPropertyTranslator::CreateOn(PropertyMacro* InProperty, FPropertyTranslator* InOldProperty)
{
    check(InOldProperty);
    PropertyTranslatorCreator<PlacementNewCreator, FPropertyTranslator*>::Do(InProperty, true, InOldProperty);
}

}    // namespace PUERTS_NAMESPACE
