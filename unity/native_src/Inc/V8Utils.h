﻿/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <string>
#include <sstream>
#include "Common.h"

namespace PUERTS_NAMESPACE
{
const intptr_t OBJECT_MAGIC = 0xFA0E5D68; // a random value

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

    V8_INLINE static std::string ExceptionToString(v8::Isolate* Isolate, v8::Local<v8::Value> ExceptionValue)
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::String::Utf8Value Exception(Isolate, ExceptionValue);
        const char * StrException = *Exception;
        std::string ExceptionStr(StrException == nullptr ? "" : StrException);
        v8::Local<v8::Message> Message = v8::Exception::CreateMessage(Isolate, ExceptionValue);
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
            stm << ExceptionStr;

            // 输出调用栈信息
            v8::MaybeLocal<v8::Value> MaybeStackTrace = v8::TryCatch::StackTrace(Context, ExceptionValue);
            if (!MaybeStackTrace.IsEmpty())
            {
                v8::String::Utf8Value StackTraceVal(Isolate, MaybeStackTrace.ToLocalChecked());
                stm << std::endl << *StackTraceVal;
            }
            else
            {
                v8::String::Utf8Value FileName(Isolate, Message->GetScriptResourceName());
                int LineNum = Message->GetLineNumber(Context).FromJust();
                int StartColumn = Message->GetStartColumn();
                const char * StrFileName = *FileName;
                stm << " at (" << (StrFileName == nullptr ? "unknow file" : StrFileName) << " : " << LineNum << " : " << StartColumn << ")";
            }
            stm << std::endl;
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

    V8_INLINE static puerts::JsValueType GetType(v8::Local<v8::Context> Context, const v8::Value *Value)
    {
        if (!Value) return puerts::NullOrUndefined;

        if (Value->IsNullOrUndefined())
        {
            return puerts::NullOrUndefined;
        }
        else if (Value->IsBigInt())
        {
            return puerts::BigInt;
        }
        else if (Value->IsNumber())
        {
            return puerts::Number;
        }
        else if (Value->IsString() || Value->IsRegExp())
        {
            return puerts::String;
        }
        else if (Value->IsBoolean())
        {
            return puerts::Boolean;
        }
        else if (Value->IsFunction())
        {
            return puerts::Function;
        }
        else if (Value->IsDate())
        {
            return puerts::Date;
        }
        else if (Value->IsArrayBufferView() || Value->IsArrayBuffer())
        {
            return puerts::ArrayBuffer;
        }
        else if (Value->IsObject())
        {
            auto Object = Value->ToObject(Context).ToLocalChecked();
            if (Object->InternalFieldCount() == 3 && (intptr_t)Object->GetAlignedPointerFromInternalField(2) == OBJECT_MAGIC)
            {
                return puerts::NativeObject;
            }
            else
            { 
                return puerts::JsObject;
            }
        }
        else
        {
            return puerts::Unknow;
        }
    }
};
}