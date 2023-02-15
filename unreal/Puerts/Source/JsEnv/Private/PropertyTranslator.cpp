/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PropertyTranslator.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "StructWrapper.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "Engine/UserDefinedStruct.h"
#endif
#include "ArrayBuffer.h"
#include "ContainerWrapper.h"
#include "JsObject.h"
#ifdef PUERTS_FTEXT_AS_OBJECT
#include "TypeInfo.hpp"
#endif

namespace puerts
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
    if (!PropertyWeakPtr.IsValid())
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
    if (!PropertyWeakPtr.IsValid())
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
    if (!PropertyTranslator->PropertyWeakPtr.IsValid())
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
        Template->PrototypeTemplate()->SetAccessorProperty(
            FV8Utils::InternalString(Isolate, OwnerStruct && OwnerStruct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                                                    Property->GetAuthoredName()
#else
                                                                                                    Property->GetDisplayNameText()
                                                                                                        .ToString()
#endif
                                                                                                    : Property->GetName()),
            GetterTemplate, SetterTemplate, v8::DontDelete);
#else
        Template->PrototypeTemplate()->SetAccessorProperty(
            FV8Utils::InternalString(Isolate, Property->GetName()), GetterTemplate, SetterTemplate, v8::DontDelete);
#endif
    }
}

class FInt32PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FInt32PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::Integer::New(Isolate, static_cast<int32>(NumericProperty->GetSignedIntPropertyValue(ValuePtr)));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        NumericProperty->SetIntPropertyValue(ValuePtr, static_cast<uint64>(Value->Int32Value(Context).ToChecked()));
        return true;
    }
};

class FUInt32PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FUInt32PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::Integer::NewFromUnsigned(Isolate, static_cast<uint32>(NumericProperty->GetUnsignedIntPropertyValue(ValuePtr)));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        NumericProperty->SetIntPropertyValue(ValuePtr, static_cast<uint64>(Value->Uint32Value(Context).ToChecked()));
        return true;
    }
};

class FInt64PropertyTranslator : public FPropertyTranslator
{
public:
    explicit FInt64PropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::BigInt::New(Isolate, NumericProperty->GetSignedIntPropertyValue(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        if (Value->IsBigInt())
        {
            NumericProperty->SetIntPropertyValue(
                ValuePtr, static_cast<int64>(Value->ToBigInt(Context).ToLocalChecked()->Int64Value()));
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::BigInt::NewFromUnsigned(Isolate, NumericProperty->GetUnsignedIntPropertyValue(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        if (Value->IsBigInt())
        {
            NumericProperty->SetIntPropertyValue(
                ValuePtr, static_cast<uint64>(Value->ToBigInt(Context).ToLocalChecked()->Uint64Value()));
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::Number::New(Isolate, NumericProperty->GetFloatingPointPropertyValue(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        NumericProperty->SetFloatingPointPropertyValue(ValuePtr, Value->NumberValue(Context).ToChecked());
        return true;
    }
};

class FBooleanPropertyTranslator : public FPropertyTranslator
{
public:
    explicit FBooleanPropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::Boolean::New(Isolate, BoolProperty->GetPropertyValue(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        BoolProperty->SetPropertyValue(ValuePtr, Value->BooleanValue(Isolate));
        return true;
    }
};

class FEnumPropertyTranslator : public FPropertyTranslator
{
public:
    explicit FEnumPropertyTranslator(PropertyMacro* InProperty) : FPropertyTranslator(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::Integer::New(
            Isolate, static_cast<int32>(EnumProperty->GetUnderlyingProperty()->GetSignedIntPropertyValue(ValuePtr)));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        EnumProperty->GetUnderlyingProperty()->SetIntPropertyValue(
            ValuePtr, static_cast<uint64>(Value->Int32Value(Context).ToChecked()));
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return FV8Utils::ToV8String(Isolate, StringProperty->GetPropertyValue(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        auto Str = FV8Utils::ToFString(Isolate, Value);
        // TCHAR* Str = (TCHAR*)(*(v8::String::Value(Isolate, Value)));
        StringProperty->SetPropertyValue(ValuePtr, Str);
        return true;
    }
};

class FNamePropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FNamePropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return FV8Utils::ToV8String(Isolate, NameProperty->GetPropertyValue(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        if (Value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(Value);
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            size_t ByteLength;
            auto Data = v8::ArrayBuffer_Get_Data(Ab, ByteLength);
            if (ByteLength == sizeof(FName))
            {
                NameProperty->SetPropertyValue(ValuePtr, *static_cast<FName*>(Data));
                return true;
            }
#else
            if (Ab->GetContents().ByteLength() == sizeof(FName))
            {
                NameProperty->SetPropertyValue(ValuePtr, *static_cast<FName*>(Ab->GetContents().Data()));
                return true;
            }
#endif
        }
        NameProperty->SetPropertyValue(ValuePtr, FV8Utils::ToFName(Isolate, Value));
        return true;
    }
};

class FTextPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FTextPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
#ifndef PUERTS_FTEXT_AS_OBJECT
        return FV8Utils::ToV8String(Isolate, TextProperty->GetPropertyValue(ValuePtr));
#else
        return DataTransfer::FindOrAddCData(Context->GetIsolate(), Context, puerts::StaticTypeId<FText>::get(),
            PassByPointer ? ValuePtr : new FText(TextProperty->GetPropertyValue(ValuePtr)), PassByPointer);
#endif
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
#ifndef PUERTS_FTEXT_AS_OBJECT
        TextProperty->SetPropertyValue(ValuePtr, FText::FromString(FV8Utils::ToFString(Isolate, Value)));
#else
        auto TextPtr = DataTransfer::GetPointerFast<FText>(Value.As<v8::Object>());
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        UObject* UEObject = ObjectBaseProperty->GetObjectPropertyValue(ValuePtr);

        if (!UEObject || !UEObject->IsValidLowLevelFast() || UEObjectIsPendingKill(UEObject))
        {
            return v8::Undefined(Isolate);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, UEObject->GetClass(), UEObject);
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        const FSoftObjectPtr* Ptr = SoftObjectProperty->GetPropertyValuePtr(ValuePtr);
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->AddSoftObjectPtr(
            Isolate, Context, new FSoftObjectPtr(*Ptr), SoftObjectProperty->PropertyClass, false);
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        const FSoftObjectPtr* Ptr = SoftObjectProperty->GetPropertyValuePtr(ValuePtr);
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->AddSoftObjectPtr(
            Isolate, Context, new FSoftObjectPtr(*Ptr), SoftClassProperty->MetaClass, true);
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

#ifdef GetObject
#undef GetObject
#endif

class FInterfacePropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FInterfacePropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        const FScriptInterface& Interface = InterfaceProperty->GetPropertyValue(ValuePtr);

        UObject* Object = Interface.GetObject();
        if (!Object || !Object->IsValidLowLevelFast() || UEObjectIsPendingKill(Object))
        {
            return v8::Undefined(Isolate);
        }
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Object->GetClass(), Object);
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    virtual bool JsToUEFast(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value,
        void* TempBuff, void** OutValuePtr) const override
    {
        void* Ptr = FV8Utils::GetPointer(Context, Value);

        if (Ptr)
        {
            *OutValuePtr = Ptr;
            return true;
        }
        *OutValuePtr = TempBuff;
        return JsToUE(Isolate, Context, Value, TempBuff, false);
    }
};

class FScriptStructPropertyTranslator : public FFastPropertyTranslator
{
public:
    explicit FScriptStructPropertyTranslator(PropertyMacro* InProperty) : FFastPropertyTranslator(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const
        override    //还是得有个指针模式，否则不能通过obj.xx.xx直接修改struct值，倒是和性能无关，应该强制js测不许保存指针型对象的引用（从native侧进入，最后一层退出时清空？）
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

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        void* Ptr = const_cast<void*>(ValuePtr);

        FArrayBuffer* ArrayBuffer = static_cast<FArrayBuffer*>(Ptr);
        if (ArrayBuffer->bCopy)
        {
            v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, ArrayBuffer->Length);
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            void* Buff = static_cast<char*>(v8::ArrayBuffer_Get_Data(Ab));
#else
            void* Buff = Ab->GetContents().Data();
#endif
            ::memcpy(Buff, ArrayBuffer->Data, ArrayBuffer->Length);
            return Ab;
        }
        else
        {
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            return v8::ArrayBuffer_New_Without_Stl(Isolate, ArrayBuffer->Data, ArrayBuffer->Length);
#else
            return v8::ArrayBuffer::New(Isolate, ArrayBuffer->Data, ArrayBuffer->Length);
#endif
        }
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        FArrayBuffer ArrayBuffer;
        if (Value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = Value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            ArrayBuffer.Data = static_cast<char*>(v8::ArrayBuffer_Get_Data(Ab)) + BuffView->ByteOffset();
#else
            ArrayBuffer.Data = static_cast<char*>(Ab->GetContents().Data()) + BuffView->ByteOffset();
#endif
            ArrayBuffer.Length = BuffView->ByteLength();
        }
        else if (Value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(Value);
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            size_t ByteLength;
            ArrayBuffer.Data = v8::ArrayBuffer_Get_Data(Ab, ByteLength);
            ArrayBuffer.Length = ByteLength;
#else
            ArrayBuffer.Data = Ab->GetContents().Data();
            ArrayBuffer.Length = Ab->GetContents().ByteLength();
#endif
        }

        StructProperty->CopySingleValue(ValuePtr, &ArrayBuffer);

        return true;
    }
};

class FJsObjectPropertyTranslator : public FPropertyWithDestructorReflection
{
public:
    explicit FJsObjectPropertyTranslator(PropertyMacro* InProperty) : FPropertyWithDestructorReflection(InProperty)
    {
    }

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        if (!ValuePtr)
            return v8::Undefined(Isolate);
        const FJsObject* JsObject = static_cast<const FJsObject*>(ValuePtr);
        return JsObject->GetJsObject();
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool ByPointer) const override
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

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool ByPointer) const override
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

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool ByPointer) const override
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

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return v8::Undefined(Isolate);
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->CreateArray(
            Isolate, Context, Inner.get(), const_cast<void*>(ValuePtr));
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
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

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        FScriptDelegate* Des = DelegateProperty->GetPropertyValuePtr(ValuePtr);
        if (Value->IsFunction())
        {
            *Des = FV8Utils::IsolateData<IObjectMapper>(Isolate)->NewManualReleaseDelegate(
                Isolate, Context, Value.As<v8::Function>(), DelegateProperty->SignatureFunction);
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

                    auto FuncName = Array->Get(Context, 1).ToLocalChecked();
                    if (FuncName->IsString())
                    {
                        FScriptDelegate Delegate;
                        Delegate.BindUFunction(Obj, *FV8Utils::ToFString(Isolate, FuncName));
                        *Des = Delegate;
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

    v8::Local<v8::Value> UEToJs(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* ValuePtr, bool PassByPointer) const override
    {
        auto Result = v8::Object::New(Isolate);
        auto ReturnVal = Result->Set(Context, 0, Inner->UEToJs(Isolate, Context, ValuePtr, PassByPointer));
        return Result;
    }

    bool JsToUE(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        if (Value->IsObject())
        {
            auto Outer = Value->ToObject(Context).ToLocalChecked();
            auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
            return Inner->JsToUE(Isolate, Context, Realvalue, ValuePtr, DeepCopy);
        }
        return true;
    }

    virtual bool JsToUEFast(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value,
        void* TempBuff, void** OutValuePtr) const override
    {
        if (Value->IsObject())
        {
            auto Outer = Value->ToObject(Context).ToLocalChecked();
            auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
            return Inner->JsToUEFast(Isolate, Context, Realvalue, TempBuff, OutValuePtr);
        }
        *OutValuePtr = TempBuff;
        return true;
    }

    void UEOutToJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, const void* ValuePtr,
        bool PassByPointer) const override
    {
        if (Value->IsObject())
        {
            auto Outer = Value->ToObject(Context).ToLocalChecked();
            if (Inner->ParamShallowCopySize)
            {
                auto Realvalue = Outer->Get(Context, 0).ToLocalChecked();
                auto Ptr = FV8Utils::GetPointer(Context, Realvalue);
                if (Ptr && Ptr != ValuePtr)
                {
                    FMemory::Memcpy(Ptr, ValuePtr, ParamShallowCopySize);
                    return;
                }
            }

            auto ReturnVal = Outer->Set(Context, 0, Inner->UEToJs(Isolate, Context, ValuePtr, PassByPointer));
            if (Inner->ParamShallowCopySize)    // $ref(undefined) for shallow copy type
            {
                Property->DestroyValue(const_cast<void*>(ValuePtr));
            }
        }
    }

    bool JsToUEOut(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::Local<v8::Value>& Value, void* ValuePtr,
        bool DeepCopy) const override
    {
        return JsToUE(Isolate, Context, Value, ValuePtr, DeepCopy);
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

}    // namespace puerts
