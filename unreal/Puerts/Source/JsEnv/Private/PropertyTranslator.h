/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <memory>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyMacros.h"

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
#include "UObject/WeakFieldPtr.h"
#endif

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
class FPropertyTranslator
{
public:
    static std::unique_ptr<FPropertyTranslator> Create(PropertyMacro* InProperty, bool IgnoreOut = false);

    static void CreateOn(PropertyMacro* InProperty, FPropertyTranslator* InOldProperty);

    FORCEINLINE v8::Local<v8::Value> UEToJsInContainer(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ContainerPtr, bool PassByPointer = false) const
    {
        return UEToJs(Isolate, Context, Property->ContainerPtrToValuePtr<void>(ContainerPtr), PassByPointer);
    }

    FORCEINLINE bool JsToUEInContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value,
        void* ContainerPtr, bool DeepCopy) const
    {
        return JsToUE(Isolate, Context, Value, Property->ContainerPtrToValuePtr<void>(ContainerPtr), DeepCopy);
    }

    FORCEINLINE void UEOutToJsInContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value,
        const void* ContainerPtr, bool PassByPointer) const
    {
        UEOutToJs(Isolate, Context, Value, Property->ContainerPtrToValuePtr<void>(ContainerPtr), PassByPointer);
    }

    FORCEINLINE bool JsToUEOutInContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value,
        void* ContainerPtr, bool PassByPointer) const
    {
        return JsToUEOut(Isolate, Context, Value, Property->ContainerPtrToValuePtr<void>(ContainerPtr), PassByPointer);
    }

    virtual v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const = 0;

    virtual bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const = 0;

    virtual void Cleanup(void* ContainerPtr) const
    {
    }

    virtual void UEOutToJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value,
        const void* ValuePtr, bool PassByPointer) const
    {
    }

    virtual bool JsToUEOut(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const
    {
        return true;
    }

    virtual bool IsOut() const
    {
        return false;
    }

    explicit FPropertyTranslator(PropertyMacro* InProperty)
    {
        Init(InProperty);
    }

    FORCEINLINE void Init(PropertyMacro* InProperty)
    {
        Property = InProperty;
        PropertyWeakPtr = InProperty;
        OwnerIsClass = InProperty->GetOwnerClass() != nullptr;
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
    };

#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
    TWeakObjectPtr<PropertyMacro> PropertyWeakPtr;
#else
    TWeakFieldPtr<PropertyMacro> PropertyWeakPtr;
#endif

    bool OwnerIsClass;

    size_t ParamShallowCopySize = 0;

    std::unique_ptr<FPropertyTranslator> Inner;

    static void Getter(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Getter(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Setter(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Setter(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Value> Value,
        const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void DelegateGetter(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetAccessor(v8::Isolate* Isolate, v8::Local<v8::FunctionTemplate> Template);
};
}    // namespace puerts
