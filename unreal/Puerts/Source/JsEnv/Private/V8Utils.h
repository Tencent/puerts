/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <vector>

#include "CoreMinimal.h"
#include "CoreUObject.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "DataTransfer.h"

namespace puerts
{
enum ArgType
{
    Int32,
    Number,
    String,
    External,
    Function,
    Object
};

#define RELEASED_UOBJECT ((UObject*)12)
#define RELEASED_UOBJECT_MEMBER ((void*)12)

class FV8Utils
{
public:
    FORCEINLINE static void ThrowException(v8::Isolate* Isolate, const FString &Message)
    {
        ThrowException(Isolate, TCHAR_TO_ANSI(*Message));
    }

    FORCEINLINE static void ThrowException(v8::Isolate* Isolate, const char * Message)
    {
        auto ExceptionStr = v8::String::NewFromUtf8(Isolate, Message,
            v8::NewStringType::kNormal).ToLocalChecked();
        Isolate->ThrowException(v8::Exception::Error(ExceptionStr));
    }

    //替代 Object->SetAlignedPointerInInternalField(Index, Ptr);
    FORCEINLINE static void SetPointer(v8::Isolate* Isolate, v8::Local<v8::Object> Object, void *Ptr, int Index)
    {
        //Object->SetInternalField(Index, v8::External::New(Isolate, Ptr));
        //Object->SetAlignedPointerInInternalField(Index, Ptr);
        UPTRINT High;
        UPTRINT Low;
        DataTransfer::SplitAddressToHighPartOfTwo(Ptr, High, Low);
        Object->SetAlignedPointerInInternalField(Index * 2, reinterpret_cast<void*>(High));
        Object->SetAlignedPointerInInternalField(Index * 2 + 1, reinterpret_cast<void*>(Low));
    }

    FORCEINLINE static void * GetPoninter(v8::Local<v8::Context>& Context, v8::Local<v8::Value> Value, int Index = 0)
    {
        if (Value.IsEmpty() || !Value->IsObject() || Value->IsUndefined() || Value->IsNull())
        {
            return nullptr;
        }
        auto Object = Value->ToObject(Context).ToLocalChecked();
        return GetPoninterFast<void>(Object, Index);
    }

    FORCEINLINE static void * GetPoninter(v8::Local<v8::Object> Object, int Index = 0)
    {
        if (Object.IsEmpty() || Object->IsUndefined() || Object->IsNull())
        {
            return nullptr;
        }
        return GetPoninterFast<void>(Object, Index);
    }

    template<typename T>
    FORCEINLINE static T * GetPoninterFast(v8::Local<v8::Object> Object, int Index = 0)
    {
        return DataTransfer::GetPoninterFast<T>(Object, Index);
    }

    FORCEINLINE static UObject * GetUObject(v8::Local<v8::Context>& Context, v8::Local<v8::Value> Value, int Index = 0)
    {
        auto UEObject = reinterpret_cast<UObject*>(GetPoninter(Context, Value, Index));
        return (!UEObject || (UEObject != RELEASED_UOBJECT && UEObject->IsValidLowLevelFast() && !UEObject->IsPendingKill())) ? UEObject : RELEASED_UOBJECT;
    }

    FORCEINLINE static UObject * GetUObject(v8::Local<v8::Object> Object, int Index = 0)
    {
        auto UEObject = reinterpret_cast<UObject*>(GetPoninter(Object, Index));
        return (!UEObject || (UEObject != RELEASED_UOBJECT && UEObject->IsValidLowLevelFast() && !UEObject->IsPendingKill())) ? UEObject : RELEASED_UOBJECT;
    }

    FORCEINLINE static bool IsReleasedPtr(void *Ptr)
    {
        return RELEASED_UOBJECT_MEMBER == Ptr;
    }

    FORCEINLINE static v8::Local<v8::String> InternalString(v8::Isolate* Isolate, const FString& String)
    {
        return v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*String), v8::NewStringType::kNormal).ToLocalChecked();
    }

    FORCEINLINE static v8::Local<v8::String> InternalString(v8::Isolate* Isolate, const char* String)
    {
        return v8::String::NewFromUtf8(Isolate, String, v8::NewStringType::kNormal).ToLocalChecked();
    }

    FORCEINLINE static FString ToFString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
    {
        return UTF8_TO_TCHAR(*(v8::String::Utf8Value(Isolate, Value)));
            
    }

    FORCEINLINE static v8::Local<v8::String> ToV8String(v8::Isolate* Isolate, const FString &String)
    {
        //return ToV8String(Isolate, TCHAR_TO_UTF8(*String));
        return ToV8String(Isolate, *String);
    }

    FORCEINLINE static v8::Local<v8::String> ToV8String(v8::Isolate* Isolate, const FName &String)
    {
        return ToV8String(Isolate, String.ToString());
    }

    FORCEINLINE static v8::Local<v8::String> ToV8String(v8::Isolate* Isolate, const FText &String)
    {
        return ToV8String(Isolate, String.ToString());
    }

    FORCEINLINE static v8::Local<v8::String> ToV8String(v8::Isolate* Isolate, const TCHAR *String)
    {
        return v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(String),
            v8::NewStringType::kNormal).ToLocalChecked();
            
    }

    FORCEINLINE static v8::Local<v8::String> ToV8String(v8::Isolate* Isolate, const char *String)
    {
        return v8::String::NewFromUtf8(Isolate, String,
            v8::NewStringType::kNormal).ToLocalChecked();
    }

    template<typename T>
    FORCEINLINE static T* IsolateData(v8::Isolate* Isolate)
    {
        return reinterpret_cast<T*>(Isolate->GetData(0));
    }

    FORCEINLINE static bool CheckArgumentLength(const v8::FunctionCallbackInfo<v8::Value>& Info, int32 Length)
    {
        if (Info.Length() < Length)
        {
            ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters, the function expect %d, but  %d provided."), Length, Info.Length()));
            return false;
        }
        return true;
    }

    FORCEINLINE static bool CheckArguement(const v8::FunctionCallbackInfo<v8::Value>& Info, const std::vector<ArgType> &TypesExpect)
    {
        if (Info.Length() < TypesExpect.size())
        {
            ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters, the function expect %d, but  %d provided."), TypesExpect.size(), Info.Length()));
            return false;
        }

        for (int i = 0; i < TypesExpect.size(); ++i)
        {
            switch (TypesExpect[i])
            {
            case Int32:
                if (!Info[i]->IsInt32())
                {
                    ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters #%d, expect a int32."), i));
                    return false;
                }
                else
                {
                    break;
                }
            case Number:
                if (!Info[i]->IsNumber())
                {
                    ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters #%d, expect a int32."), i));
                    return false;
                }
                else
                {
                    break;
                }
            case String:
                if (!Info[i]->IsString())
                {
                    ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters #%d, expect a string."), i));
                    return false;
                }
                else
                {
                    break;
                }
            case External:
                if (!Info[i]->IsExternal())
                {
                    ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters #%d, expect an external."), i));
                    return false;
                }
                else
                {
                    break;
                }
            case Function:
                if (!Info[i]->IsFunction())
                {
                    ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters #%d, expect a function."), i));
                    return false;
                }
                else
                {
                    break;
                }
            case Object:
                if (!Info[i]->IsObject())
                {
                    ThrowException(Info.GetIsolate(), FString::Printf(TEXT("Bad parameters #%d, expect a object."), i));
                    return false;
                }
                else
                {
                    break;
                }
            default:
                break;
            }
        }

        return true;
    }
};
}

#define CHECK_V8_ARGS_LEN(Length) \
if (!FV8Utils::CheckArgumentLength(Info, Length)) \
{ \
    return; \
}

#define CHECK_V8_ARGS(...) \
static std::vector<ArgType> ArgExpect = { __VA_ARGS__ }; \
if (!FV8Utils::CheckArguement(Info, ArgExpect)) \
{ \
    return; \
}
