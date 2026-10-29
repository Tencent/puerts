/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PropertyTranslator.h"
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
#include "DelegateWrapper.h"
#include "SoftObjectWrapper.h"
#include "JsObject.h"
#include "PapiUtils.h"
#ifdef PUERTS_FTEXT_AS_OBJECT
#include "TypeInfo.hpp"
#endif

namespace PUERTS_NAMESPACE
{
static FORCEINLINE bool IsDelegatePropertyForAccessor(PropertyMacro* InProperty)
{
    return InProperty->IsA<DelegatePropertyMacro>() || InProperty->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
           || InProperty->IsA<MulticastInlineDelegatePropertyMacro>() || InProperty->IsA<MulticastSparseDelegatePropertyMacro>()
#endif
        ;
}

void FPropertyTranslator::InitAccessorInfo()
{
    AccessorInfo.Name = nullptr;
    if (IsDelegatePropertyForAccessor(Property))
    {
        AccessorInfo.Getter = &FPropertyTranslator::DelegateGetter;
        AccessorInfo.Setter = nullptr;
    }
    else
    {
        AccessorInfo.Getter = &FPropertyTranslator::Getter;
        AccessorInfo.Setter = &FPropertyTranslator::Setter;
    }
    AccessorInfo.GetterData = this;
    AccessorInfo.SetterData = this;
}

void FPropertyTranslator::Getter(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    static_cast<FPropertyTranslator*>(Apis->get_userdata(Info))->Getter(Apis, Apis->get_env(Info), Info);
}

void FPropertyTranslator::Getter(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info)
{
    if (!IsPropertyValid())
    {
        Apis->throw_by_string(Info, "Property is invalid!");
        return;
    }

    pesapi_value Ret;
    void* HolderPtr = Apis->get_native_holder_ptr(Info);

    if (OwnerIsClass)
    {
        UObject* Object = PapiDataTransfer::GetUObjectOfNativePtr(Apis->get_native_holder_typeid(Info), HolderPtr);
        if (!Object)
        {
            Apis->throw_by_string(Info, "access a null object");
            return;
        }
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "access a invalid object");
            return;
        }
        Ret = UEToJsInContainer(Apis, Env, Object, true);
    }
    else
    {
        if (!HolderPtr)
        {
            Apis->throw_by_string(Info, "access a null struct");
            return;
        }
        Ret = UEToJsInContainer(Apis, Env, HolderPtr, true);
    }
    if (NeedLinkOuter)
    {
        PapiDataTransfer::LinkOuter(Apis, Env, Apis->get_this(Info), Ret);
    }
    Apis->add_return(Info, Ret);
}

void FPropertyTranslator::Setter(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    static_cast<FPropertyTranslator*>(Apis->get_userdata(Info))->Setter(Apis, Apis->get_env(Info), Apis->get_arg(Info, 0), Info);
}

void FPropertyTranslator::Setter(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, pesapi_callback_info Info)
{
    if (!IsPropertyValid())
    {
        Apis->throw_by_string(Info, "Property is invalid!");
        return;
    }

    void* HolderPtr = Apis->get_native_holder_ptr(Info);

    if (OwnerIsClass)
    {
        UObject* Object = PapiDataTransfer::GetUObjectOfNativePtr(Apis->get_native_holder_typeid(Info), HolderPtr);
        if (!Object)
        {
            Apis->throw_by_string(Info, "access a null object");
            return;
        }
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "access a invalid object");
            return;
        }
        JsToUEInContainer(Apis, Env, Value, Object, true);
    }
    else
    {
        if (!HolderPtr)
        {
            Apis->throw_by_string(Info, "access a null struct");
            return;
        }
        JsToUEInContainer(Apis, Env, Value, HolderPtr, true);
    }
}

void FPropertyTranslator::DelegateGetter(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    FPropertyTranslator* PropertyTranslator = static_cast<FPropertyTranslator*>(Apis->get_userdata(Info));
    if (!PropertyTranslator->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "Property is invalid!");
        return;
    }

    auto Object = PapiDataTransfer::GetUObjectOfHolder(Apis, Info);
    if (!Object)
    {
        Apis->throw_by_string(Info, "access a null object");
        return;
    }
    if (PapiUtils::IsReleasedPtr(Object))
    {
        Apis->throw_by_string(Info, "access a invalid object");
        return;
    }
    auto DelegatePtr = PropertyTranslator->Property->ContainerPtrToValuePtr<void>(Object);

    Apis->add_return(
        Info, PapiUtils::FindOrAddDelegate(Apis, Apis->get_env(Info), Object, PropertyTranslator->Property, DelegatePtr, true));
}

bool FPropertyTranslator::GetAccessorName(FString& OutName) const
{
    if (IsDelegatePropertyForAccessor(Property))
    {
        // only uobject support, the accessor is read only (AccessorInfo has no setter)
        if (!Property->GetOwnerStruct()->IsA<UClass>())
        {
            return false;
        }
        OutName = Property->GetName();
        return true;
    }
#if !defined(ENGINE_INDEPENDENT_JSENV)
    auto OwnerStruct = Property->GetOwnerStruct();
    OutName = OwnerStruct && OwnerStruct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                    Property->GetAuthoredName()
#else
                                                                    Property->GetDisplayNameText().ToString()
#endif
                                                                    : Property->GetName();
#ifdef PUERTS_WITH_EDITOR_SUFFIX
    if (Property->IsEditorOnlyProperty())
    {
        OutName += EditorOnlyPropertySuffix;
    }
#endif
#else
    OutName = Property->GetName();
#endif
    return true;
}

// helpers of the papi based translators

static FORCEINLINE FString PapiToFString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    return PapiUtils::ToFString(Apis, Env, Value);
}

static FORCEINLINE pesapi_value PapiFromFString(struct pesapi_ffi* Apis, pesapi_env Env, const FString& Str)
{
    return PapiUtils::FromFString(Apis, Env, Str);
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
        if (Apis->is_binary(Env, Value) && Apis->is_undefined(Env, Apis->get_property(Env, Value, "buffer")))
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
        return Apis->native_object_to_value(Env, StaticTypeId<FText>::get(),
            PassByPointer ? const_cast<void*>(ValuePtr) : new FText(TextProperty->GetPropertyValue(ValuePtr)), !PassByPointer);
#endif
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
#ifndef PUERTS_FTEXT_AS_OBJECT
        TextProperty->SetPropertyValue(ValuePtr, FText::FromString(PapiToFString(Apis, Env, Value)));
#else
        auto TextPtr = static_cast<FText*>(Apis->get_native_object_ptr(Env, Value));
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        UObject* UEObject = ObjectBaseProperty->GetObjectPropertyValue(ValuePtr);

        if (!UEObject || !UEObject->IsValidLowLevelFast() || UEObjectIsPendingKill(UEObject))
        {
            return Apis->create_undefined(Env);
        }
        return PapiUtils::FindOrAddUObject(Apis, Env, UEObject->GetClass(), UEObject);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        auto Object = PapiUtils::GetUObject(Apis, Env, Value);
        if (PapiUtils::IsReleasedPtr(Object))
        {
            PapiUtils::ThrowException(Apis, Env, "passing a invalid object");
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        const FSoftObjectPtr* Ptr = SoftObjectProperty->GetPropertyValuePtr(ValuePtr);
        return FSoftObjectWrapper::Wrap(Apis, Env, *Ptr, SoftObjectProperty->PropertyClass, false);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        FSoftObjectPtr* Ptr = FSoftObjectWrapper::SoftObjectPtrOf(Apis, Env, Value);
        if (!Ptr)
        {
            PapiUtils::ThrowException(Apis, Env, "passing a invalid object for FSoftObjectPtr");
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        const FSoftObjectPtr* Ptr = SoftObjectProperty->GetPropertyValuePtr(ValuePtr);
        return FSoftObjectWrapper::Wrap(Apis, Env, *Ptr, SoftClassProperty->MetaClass, true);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        FSoftObjectPtr* Ptr = FSoftObjectWrapper::SoftObjectPtrOf(Apis, Env, Value);
        if (!Ptr)
        {
            PapiUtils::ThrowException(Apis, Env, "passing a invalid object for FSoftObjectPtr");
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
            PapiUtils::ThrowException(Apis, Env, FString::Printf(TEXT("invalid FieldPath: %s"), *Path));
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        const FScriptInterface& Interface = InterfaceProperty->GetPropertyValue(ValuePtr);

        UObject* Object = Interface.GetObject();
        if (!Object || !Object->IsValidLowLevelFast() || UEObjectIsPendingKill(Object))
        {
            return Apis->create_undefined(Env);
        }
        return PapiUtils::FindOrAddUObject(Apis, Env, Object->GetClass(), Object);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        UObject* Object = PapiUtils::GetUObject(Apis, Env, Value);
        if (PapiUtils::IsReleasedPtr(Object))
        {
            PapiUtils::ThrowException(Apis, Env, "passing a invalid object");
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
        void* Ptr = NativeValueOf(Apis, Env, Value);

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

    //还是得有个指针模式，否则不能通过obj.xx.xx直接修改struct值，倒是和性能无关，应该强制js测不许保存指针型对象的引用（从native侧进入，最后一层退出时清空？）
    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        void* Ptr = const_cast<void*>(ValuePtr);

        if (!PassByPointer)
        {
            // FScriptStructWrapper::Alloc using new, so delete in static wrapper is safe
            Ptr = FScriptStructWrapper::Alloc(StructProperty->Struct);
            StructProperty->CopySingleValue(Ptr, ValuePtr);
        }
        return PapiUtils::FindOrAddStruct(Apis, Env, StructProperty->Struct, Ptr, PassByPointer);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        void* Ptr = Apis->get_native_object_ptr(Env, Value);

        if (Ptr)
        {
            if (UNLIKELY(!IsStructValue(Apis->get_native_object_typeid(Env, Value))))
            {
                ThrowInvalidValue(Apis, Env);
                return false;
            }
            if (DeepCopy || !ParamShallowCopySize)
            {
                StructProperty->CopySingleValue(ValuePtr, Ptr);
            }
            else
            {
                FMemory::Memcpy(ValuePtr, Ptr, ParamShallowCopySize);
            }
        }
        else if (Apis->is_object(Env, Value))
        {
            // a native object without pointer (e.g. the object of a destroyed UObject) is not merged as a plain object
            if (UNLIKELY(Apis->get_native_object_typeid(Env, Value) != nullptr))
            {
                ThrowInvalidValue(Apis, Env);
                return false;
            }
            PapiUtils::Merge(Apis, Env, Value, StructProperty->Struct, ValuePtr);
        }
        return true;
    }

    void* NativeValueOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value) const override
    {
        void* Ptr = Apis->get_native_object_ptr(Env, Value);
        // a mismatched object is rejected by JsToUE
        return Ptr && IsStructValue(Apis->get_native_object_typeid(Env, Value)) ? Ptr : nullptr;
    }

private:
    // the native object of a value can be read as the struct if it is an object of the struct or a derived one. A wrapper
    // lives until the module shuts down (FStructWrapper::ReleaseAll, the translators are released with it), the exact match
    // is cached
    bool IsStructValue(const void* TypeId) const
    {
        if (LIKELY(TypeId == MatchedTypeId))
        {
            return true;
        }
        const FScriptStructWrapper* Wrapper = FScriptStructWrapper::FromStructTypeId(TypeId);
        UStruct* Struct = Wrapper ? Wrapper->GetStruct() : nullptr;
        if (!Struct || !Struct->IsChildOf(StructProperty->Struct))
        {
            return false;
        }
        if (Struct == StructProperty->Struct)
        {
            MatchedTypeId = TypeId;
        }
        return true;
    }

    void ThrowInvalidValue(struct pesapi_ffi* Apis, pesapi_env Env) const
    {
        PapiUtils::ThrowException(
            Apis, Env, FString::Printf(TEXT("passing a invalid object for %s"), *StructProperty->Struct->GetName()));
    }

    mutable const void* MatchedTypeId = nullptr;
};

class FArrayBufferPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FArrayBufferPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        FArrayBuffer* ArrayBuffer = static_cast<FArrayBuffer*>(const_cast<void*>(ValuePtr));
        if (ArrayBuffer->bCopy)
        {
            return Apis->create_binary_by_value(Env, ArrayBuffer->Data, ArrayBuffer->Length);
        }
        return Apis->create_binary(Env, ArrayBuffer->Data, ArrayBuffer->Length);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        FArrayBuffer ArrayBuffer;
        // an ArrayBuffer or an ArrayBufferView
        if (Apis->is_binary(Env, Value))
        {
            size_t ByteLength = 0;
            ArrayBuffer.Data = Apis->get_value_binary(Env, Value, &ByteLength);
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        FArrayBufferValue* ArrayBuffer = static_cast<FArrayBufferValue*>(const_cast<void*>(ValuePtr));
        return Apis->create_binary_by_value(Env, ArrayBuffer->Data.GetData(), static_cast<size_t>(ArrayBuffer->Data.Num()));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        FArrayBufferValue* ArrayBuffer = static_cast<FArrayBufferValue*>(ValuePtr);
        size_t Len = 0;
        char* Data = nullptr;
        // an ArrayBuffer or an ArrayBufferView
        if (Apis->is_binary(Env, Value))
        {
            Data = static_cast<char*>(Apis->get_value_binary(Env, Value, &Len));
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        if (!ValuePtr)
            return Apis->create_undefined(Env);
        return static_cast<const FJsObject*>(ValuePtr)->GetValue(Apis, Env);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        if (Apis->is_object(Env, Value))
        {
            *static_cast<FJsObject*>(ValuePtr) = FJsObject(Apis, Env, Value);
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

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        auto Object = PapiUtils::GetUObject(Apis, Env, Value);
        if (PapiUtils::IsReleasedPtr(Object))
        {
            PapiUtils::ThrowException(Apis, Env, "passing a invalid object");
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool ByPointer) const override
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
        return PapiUtils::FindOrAddContainer(Apis, Env, ArrayProperty->Inner, ScriptArray, ByPointer);
    }

    void* NativeValueOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value) const override
    {
        return ContainerOfValue(Apis, Env, Value, FScriptArrayWrapper::GetClassDefinition()->TypeId);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        auto Ptr = NativeValueOf(Apis, Env, Value);
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool ByPointer) const override
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
        return PapiUtils::FindOrAddContainer(Apis, Env, SetProperty->ElementProp, ScriptSet, ByPointer);
    }

    void* NativeValueOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value) const override
    {
        return ContainerOfValue(Apis, Env, Value, FScriptSetWrapper::GetClassDefinition()->TypeId);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        auto Ptr = NativeValueOf(Apis, Env, Value);
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool ByPointer) const override
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
        return PapiUtils::FindOrAddContainer(Apis, Env, MapProperty->KeyProp, MapProperty->ValueProp, ScriptMap, ByPointer);
    }

    void* NativeValueOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value) const override
    {
        return ContainerOfValue(Apis, Env, Value, FScriptMapWrapper::GetClassDefinition()->TypeId);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        auto Ptr = NativeValueOf(Apis, Env, Value);
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        return PapiUtils::CreateArray(Apis, Env, Inner.get(), const_cast<void*>(ValuePtr));
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
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

    pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const override
    {
        auto DelegatePtr = static_cast<FScriptDelegate*>(const_cast<void*>(ValuePtr));

        if (DelegatePtr)
        {
            UObject* UEObject = DelegatePtr->GetUObject();
            if (UEObject && UEObject->IsValidLowLevelFast() && !UEObjectIsPendingKill(UEObject))
            {
                return PapiUtils::FindOrAddDelegate(Apis, Env, UEObject, DelegateProperty, DelegatePtr, PassByPointer);
            }
        }
        return Apis->create_undefined(Env);
    }

    bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, void* ValuePtr, bool DeepCopy) const override
    {
        FScriptDelegate* Des = DelegateProperty->GetPropertyValuePtr(ValuePtr);
        if (Apis->is_function(Env, Value))
        {
            *Des = PapiUtils::NewDelegate(Apis, Env, nullptr, Value, DelegateProperty->SignatureFunction);
        }
        else
        {
            // only a delegate wrapper (the other wrappers were misread as a FScriptDelegate before)
            auto Src = Apis->get_native_object_typeid(Env, Value) == FDelegateWrapper::TypeId()
                           ? static_cast<FScriptDelegate*>(Apis->get_native_object_ptr(Env, Value))
                           : nullptr;
            if (Des && Src)
            {
                *Des = *Src;
            }
            else if (Des && Apis->is_array(Env, Value))
            {
                auto Obj = PapiUtils::GetUObject(Apis, Env, Apis->get_property_uint32(Env, Value, 0));
                if (Obj)
                {
                    if (PapiUtils::IsReleasedPtr(Obj))
                    {
                        PapiUtils::ThrowException(Apis, Env, "passing a invalid object");
                        return false;
                    }

                    auto Func = Apis->get_property_uint32(Env, Value, 1);
                    if (Apis->is_string(Env, Func))
                    {
                        FScriptDelegate Delegate;
                        Delegate.BindUFunction(Obj, *PapiUtils::ToFString(Apis, Env, Func));
                        *Des = Delegate;
                    }
                    else if (Apis->is_function(Env, Func))
                    {
                        *Des = PapiUtils::NewDelegate(Apis, Env, Obj, Func, DelegateProperty->SignatureFunction);
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
                auto Ptr = Inner->NativeValueOf(Apis, Env, Realvalue);
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
