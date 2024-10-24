/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <type_traits>
#include <string>
#include <functional>
#include "DataTransfer.h"
#include "JSClassRegister.h"

#define __DefObjectType_v8_impl(CLS)                  \
    namespace PUERTS_NAMESPACE                        \
    {                                                 \
    template <>                                       \
    struct is_objecttype<CLS> : public std::true_type \
    {                                                 \
    };                                                \
    }

#define __DefCDataPointerConverter_v8_impl(CLS)                                                   \
    namespace PUERTS_NAMESPACE                                                                    \
    {                                                                                             \
    namespace v8_impl                                                                             \
    {                                                                                             \
    template <>                                                                                   \
    struct Converter<CLS*>                                                                        \
    {                                                                                             \
        static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, CLS* value)          \
        {                                                                                         \
            return ::PUERTS_NAMESPACE::DataTransfer::FindOrAddCData(                              \
                context->GetIsolate(), context, DynamicTypeId<CLS>::get(value), value, true);     \
        }                                                                                         \
        static CLS* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)      \
        {                                                                                         \
            return ::PUERTS_NAMESPACE::DataTransfer::GetPointerFast<CLS>(value.As<v8::Object>()); \
        }                                                                                         \
        static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)     \
        {                                                                                         \
            return ::PUERTS_NAMESPACE::DataTransfer::IsInstanceOf(                                \
                context->GetIsolate(), StaticTypeId<CLS>::get(), value.As<v8::Object>());         \
        }                                                                                         \
    };                                                                                            \
    }                                                                                             \
    }

namespace PUERTS_NAMESPACE
{
namespace v8_impl
{
template <typename T, typename Enable = void>
struct Converter;

template <typename T, typename = void>
struct CustomArgumentBufferType
{
    static constexpr bool enable = false;
};

struct API
{
    typedef const v8::FunctionCallbackInfo<v8::Value>& CallbackInfoType;
    typedef v8::Local<v8::Context> ContextType;
    typedef v8::Local<v8::Value> ValueType;
    typedef v8::FunctionCallback FunctionCallbackType;
    typedef void* (*InitializeFuncType)(const v8::FunctionCallbackInfo<v8::Value>& Info);
    typedef void (*FinalizeFuncType)(void* Ptr, void* ClassData, void* EnvData);
    typedef JSFunctionInfo GeneralFunctionInfo;
    typedef JSPropertyInfo GeneralPropertyInfo;
    typedef NamedFunctionInfo GeneralFunctionReflectionInfo;
    typedef NamedPropertyInfo GeneralPropertyReflectionInfo;

    V8_INLINE static int GetArgsLen(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.Length();
    }

    V8_INLINE static v8::Local<v8::Value> GetArg(const v8::FunctionCallbackInfo<v8::Value>& info, int index)
    {
        return info[index];
    }

    V8_INLINE static v8::Local<v8::Context> GetContext(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.GetIsolate()->GetCurrentContext();
    }
    V8_INLINE static v8::Local<v8::Object> GetThis(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.This();
    }

    V8_INLINE static v8::Local<v8::Object> GetHolder(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.Holder();
    }

    // use where GetSelfFromData is true
    V8_INLINE static void* GetFunctionData(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return v8::Local<v8::External>::Cast(info.Data())->Value();
    }

    V8_INLINE static void ThrowException(const v8::FunctionCallbackInfo<v8::Value>& info, const char* msg)
    {
        v8::Isolate* isolate = info.GetIsolate();
        isolate->ThrowException(
            v8::Exception::Error(v8::String::NewFromUtf8(isolate, msg, v8::NewStringType::kNormal).ToLocalChecked()));
    }

    V8_INLINE static void SetReturn(const v8::FunctionCallbackInfo<v8::Value>& info, v8::Local<v8::Value> value)
    {
        info.GetReturnValue().Set(value);
    }

    template <typename T1, typename T2>
    V8_INLINE static void LinkOuter(v8::Local<v8::Context> Context, v8::Local<v8::Value> Outer, v8::Local<v8::Value> Inner)
    {
        LinkOuterImpl(Context, Outer, Inner);
    }

    V8_INLINE static void UpdateRefValue(v8::Local<v8::Context> context, v8::Local<v8::Value> holder, v8::Local<v8::Value> value)
    {
        if (holder->IsObject())
        {
            auto outer = holder->ToObject(context).ToLocalChecked();
            (void) (outer->Set(context, 0, value));
        }
    }

    template <typename T>
    V8_INLINE static T* FastGetNativeObjectPointer(v8::Local<v8::Context> context, v8::Local<v8::Object> Object)
    {
        return DataTransfer::GetPointerFast<T>(Object);
    }

    V8_INLINE static v8::Local<v8::Value> GetUndefined(v8::Local<v8::Context> context)
    {
        return v8::Undefined(context->GetIsolate());
    }

    V8_INLINE static bool IsNullOrUndefined(v8::Local<v8::Context> context, v8::Local<v8::Value> val)
    {
        return val->IsNullOrUndefined();
    }

    template <typename T, typename CDB>
    static void Register(FinalizeFuncType Finalize, const CDB& Cdb)
    {
        const bool isUEType = is_uetype<T>::value;
        static std::vector<JSFunctionInfo> s_functions_{};
        static std::vector<JSFunctionInfo> s_methods_{};
        static std::vector<JSPropertyInfo> s_properties_{};
        static std::vector<JSPropertyInfo> s_variables_{};

        static std::vector<NamedFunctionInfo> s_constructorInfos_{};
        static std::vector<NamedFunctionInfo> s_methodInfos_{};
        static std::vector<NamedFunctionInfo> s_functionInfos_{};
        static std::vector<NamedPropertyInfo> s_propertyInfos_{};
        static std::vector<NamedPropertyInfo> s_variableInfos_{};

        JSClassDefinition ClassDef = JSClassEmptyDefinition;

        if (isUEType)
        {
            ClassDef.UETypeName = Cdb.className_;
        }
        else
        {
            ClassDef.ScriptName = Cdb.className_;
            ClassDef.TypeId = StaticTypeId<T>::get();
            ClassDef.SuperTypeId = Cdb.superTypeId_;
        }

        ClassDef.Initialize = reinterpret_cast<pesapi_constructor>(Cdb.constructor_);
        ClassDef.Finalize = Finalize;

        s_functions_ = std::move(Cdb.functions_);
        s_functions_.push_back(JSFunctionInfo());
        ClassDef.Functions = s_functions_.data();

        s_methods_ = std::move(Cdb.methods_);
        s_methods_.push_back(JSFunctionInfo());
        ClassDef.Methods = s_methods_.data();

        s_properties_ = std::move(Cdb.properties_);
        s_properties_.push_back(JSPropertyInfo());
        ClassDef.Properties = s_properties_.data();

        s_variables_ = std::move(Cdb.variables_);
        s_variables_.push_back(JSPropertyInfo());
        ClassDef.Variables = s_variables_.data();

        s_constructorInfos_ = std::move(Cdb.constructorInfos_);
        s_constructorInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});
        ClassDef.ConstructorInfos = s_constructorInfos_.data();

        s_methodInfos_ = std::move(Cdb.methodInfos_);
        s_methodInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});
        ClassDef.MethodInfos = s_methodInfos_.data();

        s_functionInfos_ = std::move(Cdb.functionInfos_);
        s_functionInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});
        ClassDef.FunctionInfos = s_functionInfos_.data();

        s_propertyInfos_ = std::move(Cdb.propertyInfos_);
        s_propertyInfos_.push_back(NamedPropertyInfo{nullptr, nullptr});
        ClassDef.PropertyInfos = s_propertyInfos_.data();

        s_variableInfos_ = std::move(Cdb.variableInfos_);
        s_variableInfos_.push_back(NamedPropertyInfo{nullptr, nullptr});
        ClassDef.VariableInfos = s_variableInfos_.data();

        RegisterJSClass(ClassDef);
    }

    template <typename T>
    using Converter = Converter<T>;

    template <typename T>
    using CustomArgumentBufferType = CustomArgumentBufferType<T>;
};

class StringHolder
{
public:
    StringHolder(v8::Local<v8::Context> context, const v8::Local<v8::Value> value)
    {
        needFree = false;
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
        }
        else if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab));
        }
        else
        {
            if (value.IsEmpty())
                return;
            const auto isolate = context->GetIsolate();
            v8::TryCatch try_catch(isolate);
            v8::Local<v8::String> str;
            if (!value->ToString(context).ToLocal(&str))
                return;
            const int length = str->Utf8Length(isolate);
            data = new char[length + 1];
            str->WriteUtf8(isolate, data);
            needFree = true;
        }
    }

    ~StringHolder()
    {
        if (needFree && data)
        {
            delete[] data;
        }
    }

    const char* Data() const
    {
        return data;
    }

    // Disallow copying and assigning.
    StringHolder(const StringHolder&) = delete;
    void operator=(const StringHolder&) = delete;

private:
    char* data;

    bool needFree;
};

template <>
struct CustomArgumentBufferType<const char*>
{
    using type = StringHolder;
    static constexpr bool enable = true;
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && std::is_signed<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::BigInt::New(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBigInt() ? static_cast<T>(value->ToBigInt(context).ToLocalChecked()->Int64Value()) : 0;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBigInt();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && !std::is_signed<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::BigInt::NewFromUnsigned(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBigInt() ? static_cast<T>(value->ToBigInt(context).ToLocalChecked()->Uint64Value()) : 0;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBigInt();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && std::is_signed<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Integer::New(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->Int32Value(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsInt32();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && !std::is_signed<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Integer::NewFromUnsigned(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->Uint32Value(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsUint32();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_enum<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Integer::New(context->GetIsolate(), static_cast<int>(value));
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->Int32Value(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsInt32();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_floating_point<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Number::New(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->NumberValue(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsNumber();
    }
};

template <>
struct Converter<std::string>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, std::string value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), value.c_str(), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static std::string toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return *v8::String::Utf8Value(context->GetIsolate(), value);
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<const char*>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const char* value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), value, v8::NewStringType::kNormal).ToLocalChecked();
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<void*>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, void* value)
    {
        return DataTransfer::NewArrayBuffer(context, value, 0);
    }

    static void* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            return static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
        }
        if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            return DataTransfer::GetArrayBufferData(Ab);
        }
        if (value->IsObject())
        {
            return DataTransfer::GetPointerFast<void>(value.As<v8::Object>());
        }

        return nullptr;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsArrayBuffer() || value->IsArrayBufferView();
    }
};

template <>
struct Converter<bool>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, bool value)
    {
        return v8::Boolean::New(context->GetIsolate(), value);
    }

    static bool toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->BooleanValue(context->GetIsolate());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBoolean();
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>, typename std::enable_if<!is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const T& value)
    {
        auto result = v8::Object::New(context->GetIsolate());
        auto _unused = result->Set(context, 0, Converter<T>::toScript(context, value));
        return result;
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value->IsObject())
        {
            auto outer = value->ToObject(context).ToLocalChecked();
            auto realvalue = outer->Get(context, 0).ToLocalChecked();
            return Converter<T>::toCpp(context, realvalue);
        }
        return {};
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsObject();    // do not checked inner
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>, typename std::enable_if<is_objecttype<T>::value || is_uetype<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const T& value)
    {
        auto result = v8::Object::New(context->GetIsolate());
        auto _unused = result->Set(context, 0, Converter<T>::toScript(context, value));
        return result;
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (!value.IsEmpty() && value->IsObject())
        {
            auto outer = value->ToObject(context).ToLocalChecked();
            auto realvalue = outer->Get(context, 0).ToLocalChecked();
            return Converter<typename std::decay<T>::type*>::toCpp(context, realvalue);
        }
        return nullptr;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsObject();    // do not checked inner
    }
};

template <typename T>
struct Converter<T,
    typename std::enable_if<is_script_type<typename std::remove_pointer<T>::type>::value && !std::is_array<T>::value &&
                            !std::is_const<typename std::remove_pointer<T>::type>::value && std::is_pointer<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return DataTransfer::NewArrayBuffer(context, value, 0);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            return reinterpret_cast<T>(static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset());
        }
        if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            return static_cast<T>(DataTransfer::GetArrayBufferData(Ab));
        }
        return nullptr;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsArrayBuffer() || value->IsArrayBufferView();
    }
};

template <typename T, std::size_t Size>
struct Converter<T[Size], typename std::enable_if<is_script_type<T>::value && !std::is_const<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value[Size])
    {
        return DataTransfer::NewArrayBuffer(context, &(value[0]), sizeof(T) * Size);
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> buffView = value.As<v8::ArrayBufferView>();
            return buffView->ByteLength() >= sizeof(T) * Size;
        }
        if (value->IsArrayBuffer())
        {
            auto ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            size_t byteLength;
            (void) (DataTransfer::GetArrayBufferData(ab, byteLength));
            return byteLength >= sizeof(T) * Size;
        }
        return false;
    }
};

template <class T>
struct Converter<T, typename std::enable_if<std::is_copy_constructible<T>::value && std::is_constructible<T>::value &&
                                            is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return DataTransfer::FindOrAddCData(context->GetIsolate(), context, DynamicTypeId<T>::get(&value), new T(value), false);
    }
    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* ptr = DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return ptr ? *ptr : T{};
    }
    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::IsInstanceOf(context->GetIsolate(), StaticTypeId<T>::get(), value.As<v8::Object>());
    }
};

template <class T>
struct Converter<const T*,
    typename std::enable_if<(is_objecttype<T>::value || std::is_same<T, void>::value || is_script_type<T>::value) &&
                            !is_uetype<T>::value && !std::is_same<T, char>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const T* value)
    {
        return Converter<T*>::toScript(context, const_cast<T*>(value));
    }
    static const T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return Converter<T*>::toCpp(context, value);
    }
    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return Converter<T*>::accept(context, value);
    }
};

}    // namespace v8_impl
}    // namespace PUERTS_NAMESPACE
