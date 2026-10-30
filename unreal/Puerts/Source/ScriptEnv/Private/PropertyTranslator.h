/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <memory>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "Runtime/Launch/Resources/Version.h"
#include "PropertyMacros.h"

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
#include "UObject/WeakFieldPtr.h"
#endif

#include "NamespaceDef.h"
#include "ArrayBuffer.h"
#include "JsObject.h"
#include "pesapi.h"
#include "JSClassRegister.h"

namespace PUERTS_NAMESPACE
{
class FPropertyTranslator
{
public:
    static std::unique_ptr<FPropertyTranslator> Create(PropertyMacro* InProperty, bool IgnoreOut = false);

    static void CreateOn(PropertyMacro* InProperty, FPropertyTranslator* InOldProperty);

    // papi entries, the translators are implemented against these

    virtual pesapi_value UEToJs(struct pesapi_ffi* Apis, pesapi_env Env, const void* ValuePtr, bool PassByPointer) const = 0;

    virtual bool JsToUE(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Value, void* ValuePtr,
        bool DeepCopy) const = 0;

    virtual bool JsToUEFast(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Value, void* TempBuff,
        void** OutValuePtr) const
    {
        *OutValuePtr = TempBuff;    // using temp buffer by default
        return JsToUE(Apis, Env, Info, Value, TempBuff, false);
    }

    virtual void UEOutToJs(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, const void* ValuePtr, bool PassByPointer) const
    {
    }

    virtual bool JsToUEOut(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Value, void* ValuePtr, bool DeepCopy) const
    {
        return true;
    }

    // the native value (of the property type) wrapped by a js value, nullptr if there is none
    virtual void* NativeValueOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value) const
    {
        return Apis->get_native_object_ptr(Env, Value);
    }

    FORCEINLINE pesapi_value UEToJsInContainer(
        struct pesapi_ffi* Apis, pesapi_env Env, const void* ContainerPtr, bool PassByPointer = false) const
    {
        return UEToJs(Apis, Env, Property->ContainerPtrToValuePtr<void>(ContainerPtr), PassByPointer);
    }

    FORCEINLINE bool JsToUEInContainer(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Value,
        void* ContainerPtr, bool DeepCopy) const
    {
        return JsToUE(Apis, Env, Info, Value, Property->ContainerPtrToValuePtr<void>(ContainerPtr), DeepCopy);
    }

    FORCEINLINE bool JsToUEFastInContainer(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Value,
        void* TempBuff, void** OutValuePtr) const
    {
        return JsToUEFast(Apis, Env, Info, Value, Property->ContainerPtrToValuePtr<void>(TempBuff), OutValuePtr);
    }

    FORCEINLINE void UEOutToJsInContainer(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, const void* ContainerPtr, bool PassByPointer) const
    {
        UEOutToJs(Apis, Env, Value, Property->ContainerPtrToValuePtr<void>(ContainerPtr), PassByPointer);
    }

    FORCEINLINE bool JsToUEOutInContainer(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Value,
        void* ContainerPtr, bool PassByPointer) const
    {
        return JsToUEOut(Apis, Env, Info, Value, Property->ContainerPtrToValuePtr<void>(ContainerPtr), PassByPointer);
    }

    virtual void Cleanup(void* ContainerPtr) const
    {
    }

    virtual bool IsOut() const
    {
        return false;
    }

    explicit FPropertyTranslator(PropertyMacro* InProperty)
    {
        Init(InProperty);
        InitAccessorInfo();
    }

    FORCEINLINE void Init(PropertyMacro* InProperty)
    {
        Property = InProperty;
        PropertyWeakPtr = InProperty;
        OwnerIsClass = InProperty->GetOwnerClass() != nullptr;
        NeedLinkOuter = false;
        if (!OwnerIsClass)
        {
            if ((InProperty->IsA<StructPropertyMacro>() && StructProperty->Struct != FArrayBuffer::StaticStruct() &&
                    StructProperty->Struct != FArrayBufferValue::StaticStruct() &&
                    StructProperty->Struct != FJsObject::StaticStruct()) ||
                InProperty->IsA<MapPropertyMacro>() || InProperty->IsA<ArrayPropertyMacro>() || InProperty->IsA<SetPropertyMacro>())
            {
                NeedLinkOuter = true;
            }
        }
    }

    virtual ~FPropertyTranslator()
    {
    }

    union
    {
        PropertyMacro* Property;
        NumericPropertyMacro* NumericProperty;
        IntPropertyMacro* IntProperty;
        EnumPropertyMacro* EnumProperty;
        BoolPropertyMacro* BoolProperty;
        ObjectPropertyBaseMacro* ObjectBaseProperty;
        SoftObjectPropertyMacro* SoftObjectProperty;
        SoftClassPropertyMacro* SoftClassProperty;
        InterfacePropertyMacro* InterfaceProperty;
        NamePropertyMacro* NameProperty;
        StrPropertyMacro* StringProperty;
        TextPropertyMacro* TextProperty;
        ArrayPropertyMacro* ArrayProperty;
        MapPropertyMacro* MapProperty;
        SetPropertyMacro* SetProperty;
        StructPropertyMacro* StructProperty;
        DelegatePropertyMacro* DelegateProperty;
        MulticastDelegatePropertyMacro* MulticastDelegateProperty;
        ClassPropertyMacro* ClassProperty;
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        FFieldPathProperty* FieldPathProperty;
#endif
    };

    bool OwnerIsClass;

    bool NeedLinkOuter;

    size_t ParamShallowCopySize = 0;

    std::unique_ptr<FPropertyTranslator> Inner;

    // pesapi style accessors, the userdata is the translator (see AccessorInfo)
    static void Getter(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void Getter(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info);

    static void Setter(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void Setter(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, pesapi_callback_info Info);

    static void DelegateGetter(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // name of the accessor on the prototype of the owner class, false if the property is not exposed as an accessor
    bool GetAccessorName(FString& OutName) const;

    // registry style accessor entry, filled on construction (also by CreateOn), so templates created before a
    // CreateOn still dispatch to this translator
    JSPropertyInfo AccessorInfo;

    void InitAccessorInfo();

    bool IsPropertyValid()
    {
        if (!PropertyWeakPtr.IsValid())
        {
            return false;
        }
#if WITH_EDITOR
        FProperty* TestP = PropertyWeakPtr.Get();
        if (TestP != Property)
        {
            Init(TestP);
        }
#endif
        return true;
    }

    // the property is destroyed or replaced by a new one (a blueprint or user defined struct recompiled in the editor)
    bool IsPropertyStale() const
    {
        return PropertyWeakPtr.Get() != Property;
    }

private:
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
    TWeakObjectPtr<PropertyMacro> PropertyWeakPtr;
#else
    TWeakFieldPtr<PropertyMacro> PropertyWeakPtr;
#endif
};
}    // namespace PUERTS_NAMESPACE
