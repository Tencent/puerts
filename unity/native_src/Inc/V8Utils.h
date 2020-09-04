/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <string>
#include <sstream>

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
const intptr_t OBJECT_MAGIC = 0xFA0E5D68;

enum JsValueType
{
    NullOrUndefined = 1,
    BigInt          = 2,
    Number          = 4,
    String          = 8,
    Boolean         = 16,
    NativeObject    = 32,
    JsObject        = 64,
    Array           = 128,
    Function        = 256,
    Date            = 512,
    ArrayBuffer     = 1024,
    Unknow          = 2048,
};

class FV8Utils
{
public:

    V8_INLINE static void ThrowException(v8::Isolate* Isolate, const char * Message)
    {
        auto ExceptionStr = v8::String::NewFromUtf8(Isolate, Message,
            v8::NewStringType::kNormal).ToLocalChecked();
        Isolate->ThrowException(v8::Exception::Error(ExceptionStr));
    }

    template<typename T>
    V8_INLINE static T* IsolateData(v8::Isolate* Isolate)
    {
        return reinterpret_cast<T*>(Isolate->GetData(0));
    }

    template<typename T>
    V8_INLINE static T* ExternalData(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        return reinterpret_cast<T*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    }

    V8_INLINE static v8::Local<v8::String> V8String(v8::Isolate* Isolate, const char* String)
    {
        return v8::String::NewFromUtf8(Isolate, String, v8::NewStringType::kNormal).ToLocalChecked();
    }

    V8_INLINE static std::string ExceptionToString(v8::Isolate* Isolate, const v8::TryCatch &TryCatch)
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::String::Utf8Value Exception(Isolate, TryCatch.Exception());
        std::string ExceptionStr(*Exception);
        v8::Local<v8::Message> Message = TryCatch.Message();
        if (Message.IsEmpty())
        {
            // 如果没有提供更详细的信息，直接输出Exception
            return ExceptionStr;
        }
        else
        {
            v8::Local<v8::Context> Context(Isolate->GetCurrentContext());

            // 输出 (filename):(line number): (message).
            std::ostringstream stm;
            v8::String::Utf8Value FileName(Isolate, Message->GetScriptOrigin().ResourceName());
            int LineNum = Message->GetLineNumber(Context).FromJust();
            stm << *FileName << ":" << LineNum << ": " << ExceptionStr;

            stm << std::endl;

            // 输出错误的一行源码
            v8::String::Utf8Value SourceLine(Isolate, Message->GetSourceLine(Context).ToLocalChecked());
            stm << *SourceLine << std::endl;

            // 输出波浪下划线
            std::string WavyUnderlineStr;
            int Start = Message->GetStartColumn(Context).FromJust();
            for (int Index = 0; Index < Start; Index++) {
                WavyUnderlineStr = WavyUnderlineStr.append(" ");
            }
            int End = Message->GetEndColumn(Context).FromJust();
            for (int Index = Start; Index < End; Index++) {
                WavyUnderlineStr = WavyUnderlineStr.append("^");
            }

            stm << WavyUnderlineStr;

            // 输出调用栈信息
            v8::Local<v8::Value> StackTrace;
            if (TryCatch.StackTrace(Context).ToLocal(&StackTrace) &&
                StackTrace->IsString() &&
                v8::Local<v8::String>::Cast(StackTrace)->Length() > 0)
            {
                v8::String::Utf8Value StackTraceVal(Isolate, StackTrace);
                stm << std::endl << *StackTraceVal;
            }
            return stm.str();
        }
    }

    V8_INLINE static void * GetPoninter(v8::Local<v8::Context>& Context, v8::Local<v8::Value> Value, int Index = 0)
    {
        if (Value.IsEmpty() || !Value->IsObject() || Value->IsUndefined() || Value->IsNull())
        {
            return nullptr;
        }
        auto Object = Value->ToObject(Context).ToLocalChecked();
        return Object->InternalFieldCount() > Index ?
            Object->GetAlignedPointerFromInternalField(Index) : nullptr;
    }

    V8_INLINE static void * GetPoninter(v8::Local<v8::Context>& Context, v8::Value *Value, int Index = 0)
    {
        if (!Value->IsObject() || Value->IsUndefined() || Value->IsNull())
        {
            return nullptr;
        }
        auto Object = Value->ToObject(Context).ToLocalChecked();
        return Object->InternalFieldCount() > Index ?
            Object->GetAlignedPointerFromInternalField(Index) : nullptr;
    }

    V8_INLINE static void * GetPoninter(v8::Local<v8::Object> Object, int Index = 0)
    {
        if (Object.IsEmpty() || Object->IsUndefined() || Object->IsNull())
        {
            return nullptr;
        }
        return Object->InternalFieldCount() > Index ?
            Object->GetAlignedPointerFromInternalField(Index) : nullptr;
    }

    V8_INLINE static JsValueType GetType(v8::Local<v8::Context> Context, const v8::Value *Value)
    {
        if (!Value) return NullOrUndefined;

        if (Value->IsNullOrUndefined())
        {
            return NullOrUndefined;
        }
        else if (Value->IsBigInt())
        {
            return BigInt;
        }
        else if (Value->IsNumber())
        {
            return Number;
        }
        else if (Value->IsString() || Value->IsRegExp())
        {
            return String;
        }
        else if (Value->IsBoolean())
        {
            return Boolean;
        }
        else if (Value->IsFunction())
        {
            return Function;
        }
        else if (Value->IsDate())
        {
            return Date;
        }
        else if (Value->IsArrayBufferView() || Value->IsArrayBuffer())
        {
            return ArrayBuffer;
        }
        else if (Value->IsObject())
        {
            auto Object = Value->ToObject(Context).ToLocalChecked();
            if (Object->InternalFieldCount() == 3 && (intptr_t)Object->GetAlignedPointerFromInternalField(2) == OBJECT_MAGIC)
            {
                return NativeObject;
            }
            else
            { 
                return JsObject;
            }
        }
        else
        {
            return Unknow;
        }
    }
};
}