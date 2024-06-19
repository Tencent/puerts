/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "FFIBinding.h"
#ifdef WITH_FFI
#include "JSClassRegister.h"
#include "V8Utils.h"
#if _MSC_VER
#define FFI_BUILDING
#endif

#if PLATFORM_ANDROID_ARM
#include "armeabi-v7a/ffi.h"
#elif PLATFORM_ANDROID_ARM64
#include "arm64-v8a/ffi.h"
#else
#include "ffi.h"
#endif

static FuncPtr* GFuncArray = nullptr;
static uint32_t GFuncArrayLength = 0;

void SetFunctionArray(FuncPtr* FuncArray, uint32_t FuncArrayLength)
{
    GFuncArray = FuncArray;
    GFuncArrayLength = FuncArrayLength;
}

static v8::Local<v8::Uint8Array> WrapPointer(v8::Isolate* Isolate, void* Ptr, size_t Length)
{
    v8::Local<v8::ArrayBuffer> ab = v8::ArrayBuffer::New(Isolate, Ptr, Length);
    return v8::Uint8Array::New(ab, 0, Length);
}

static v8::Local<v8::Uint8Array> WrapPointer(v8::Isolate* Isolate, void* Ptr)
{
    return WrapPointer(Isolate, Ptr, 0);
}

static char* ArrayBufferData(v8::Local<v8::Value> Val)
{
    if (!Val->IsArrayBufferView())
        return nullptr;
    auto ui = Val.As<v8::ArrayBufferView>();
    auto ab_c = ui->Buffer()->GetContents();
    return static_cast<char*>(ab_c.Data()) + ui->ByteOffset();
}

static size_t ArrayBufferLength(v8::Local<v8::Value> Val)
{
    if (!Val->IsArrayBufferView())
        return 0;
    auto ui = Val.As<v8::ArrayBufferView>();
    return ui->ByteLength();
}

static bool IsArrayBuffer(v8::Local<v8::Value> Val)
{
    return Val->IsArrayBufferView();
}

inline int64_t GetInt64(v8::Local<v8::Value> Val)
{
    return Val->IsNumber() ? (Val->IsBigInt() ? Val.As<v8::BigInt>()->Int64Value() : (int64_t) Val.As<v8::Number>()->Value()) : 0;
}

static void FFIPrepCif(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    unsigned int Nargs;
    char *Cif, *ArgTypes, *RetType;
    ffi_status Status;
    ffi_abi Abi;

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.Length() != 5 || !IsArrayBuffer(Info[0]) || !IsArrayBuffer(Info[3]) || !IsArrayBuffer(Info[4]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "Bad parameters.");
        return;
    }

    Cif = ArrayBufferData(Info[0]);
    Abi = (ffi_abi) Info[1]->Uint32Value(Context).ToChecked();
    Nargs = Info[2]->Uint32Value(Context).ToChecked();
    RetType = ArrayBufferData(Info[3]);
    ArgTypes = ArrayBufferData(Info[4]);

    Status = ffi_prep_cif(
        reinterpret_cast<ffi_cif*>(Cif), Abi, Nargs, reinterpret_cast<ffi_type*>(RetType), reinterpret_cast<ffi_type**>(ArgTypes));

    Info.GetReturnValue().Set(v8::Integer::New(Isolate, Status));
}

static void FFIPrepCifVar(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    unsigned int FixArgs, TotoalArgs;
    char *Cif, *ArgTypes, *RetType;
    ffi_status Status;
    ffi_abi Abi;

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.Length() != 6 || !IsArrayBuffer(Info[0]) || !IsArrayBuffer(Info[4]) || !IsArrayBuffer(Info[5]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "Bad parameters.");
        return;
    }

    Cif = ArrayBufferData(Info[0]);
    Abi = (ffi_abi) Info[1]->Uint32Value(Context).ToChecked();
    FixArgs = Info[2]->Uint32Value(Context).ToChecked();
    TotoalArgs = Info[3]->Uint32Value(Context).ToChecked();
    RetType = ArrayBufferData(Info[4]);
    ArgTypes = ArrayBufferData(Info[5]);

    Status = ffi_prep_cif_var(reinterpret_cast<ffi_cif*>(Cif), Abi, FixArgs, TotoalArgs, reinterpret_cast<ffi_type*>(RetType),
        reinterpret_cast<ffi_type**>(ArgTypes));

    Info.GetReturnValue().Set(v8::Integer::New(Isolate, Status));
}

class ClosureInfo
{
public:
    ClosureInfo(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction, void* InCodeLoc,
        ffi_closure* InClosure, size_t InRetSize)
        : CodeLoc(InCodeLoc)
        , Isolate(InIsolate)
        , Context(InIsolate, InContext)
        , Function(InIsolate, InFunction)
        , Closure(InClosure)
        , RetSize(InRetSize)
    {
    }

    void* CodeLoc;

    v8::Isolate* Isolate;

    v8::Global<v8::Context> Context;

    v8::Global<v8::Function> Function;

    ffi_closure* Closure;

    size_t RetSize;

    v8::Global<v8::ArrayBuffer> Buffer;
};

static void ClosureWrap(ffi_cif* Cif, void* Ret, void** Args, void* UserData)
{
    ClosureInfo* CI = reinterpret_cast<ClosureInfo*>(UserData);

    v8::Isolate* Isolate = CI->Isolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = CI->Context.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::Value> Argv[2] = {WrapPointer(Isolate, Ret, CI->RetSize), WrapPointer(Isolate, Args, 0)};
    CI->Function.Get(CI->Isolate)->Call(Context, Context->Global(), 2, Argv);
}

static void FFIAllocClosure(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_alloc_closure: Uint32Array expected as #1 argument");
        return;
    }

    if (!Info[1]->IsFunction())
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_alloc_closure: function expected as #2 argument");
        return;
    }

    if (!Info[2]->IsNumber())
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_alloc_closure: number expected as #3 argument");
        return;
    }

    ffi_cif* Cif = reinterpret_cast<ffi_cif*>(ArrayBufferData(Info[0]));
    v8::Local<v8::Function> Callback = v8::Local<v8::Function>::Cast(Info[1]);
    size_t RetSize = Info[2]->Uint32Value(Context).ToChecked();

    void* CodeLoc;

    ffi_closure* Closure = reinterpret_cast<ffi_closure*>(ffi_closure_alloc(sizeof(ffi_closure), &CodeLoc));
    if (!Closure)
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_alloc_closure: alloc closure fail!");
        return;
    }

    v8::Local<v8::ArrayBuffer> AB = v8::ArrayBuffer::New(Isolate, sizeof(ClosureInfo));

    ClosureInfo* CI = new (AB->GetContents().Data()) ClosureInfo(Isolate, Context, Callback, CodeLoc, Closure, RetSize);

    ffi_status status = ffi_prep_closure_loc(Closure, Cif, ClosureWrap, CI, CodeLoc);

    if (status != FFI_OK)
    {
        ffi_closure_free(Closure);
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_alloc_closure: ffi_prep_closure_loc fail!");
        return;
    }

    Info.GetReturnValue().Set(v8::Uint8Array::New(AB, 0, sizeof(ClosureInfo)));
}

static void FFIFreeClosure(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_free_closure: invalid type for #1 argument");
        return;
    }

    if (ArrayBufferLength(Info[0]) != sizeof(ClosureInfo))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_free_closure: #1 argument length not match");
        return;
    }

    ClosureInfo* CI = reinterpret_cast<ClosureInfo*>(ArrayBufferData(Info[0]));
    ffi_closure_free(CI->Closure);
    CI->~ClosureInfo();
}

static void FFICall(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.Length() != 4)
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_call(): requires 4 arguments!");
        return;
    }

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_call(): Uint32Array expected as #1 argument");
        return;
    }

    if (Info[1]->IsNumber())
    {
        if (Info[1]->Uint32Value(Context).ToChecked() >= GFuncArrayLength)
        {
            PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_call(): function index out of range!");
            return;
        }
    }

    char* Cif = ArrayBufferData(Info[0]);
    char* FuncPtr = Info[1]->IsNumber() ? reinterpret_cast<char*>(GFuncArray[Info[1]->Uint32Value(Context).ToChecked()])
                                        : ArrayBufferData(Info[1]);
    char* ReturnPtr = ArrayBufferData(Info[2]);
    char* ArgsPtr = ArrayBufferData(Info[3]);

#if __OBJC__ || __OBJC2__
//    @try {
#endif
    ffi_call(
        reinterpret_cast<ffi_cif*>(Cif), FFI_FN(FuncPtr), reinterpret_cast<void*>(ReturnPtr), reinterpret_cast<void**>(ArgsPtr));
#if __OBJC__ || __OBJC2__
//    } @catch (id ex) {
//        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ffi_call() throw exeption!");
//        return;
//    }
#endif

    Info.GetReturnValue().SetUndefined();
}

static void WritePointer(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "writePointer: Uint32Array expected as #1 argument");
        return;
    }
    auto Value = Info[1];
    if (!(Value->IsNull() || IsArrayBuffer(Value)))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "writePointer: Uint32Array expected as #3 argument");
        return;
    }

    int64_t Offset = GetInt64(Info[2]);
    char* Ptr = ArrayBufferData(Info[0]) + Offset;

    if (Value->IsNull())
    {
        *reinterpret_cast<char**>(Ptr) = NULL;
    }
    else
    {
        char* ValuePtr = ArrayBufferData(Value);
        if (Info.Length() >= 4 && Info[3]->IsNumber())
        {
            ValuePtr += GetInt64(Info[3]);
        }
        *reinterpret_cast<char**>(Ptr) = ValuePtr;
    }

    Info.GetReturnValue().SetUndefined();
}

static void ReadPointer(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "readPointer: Uint32Array expected as #1 argument");
        return;
    }

    int64_t Offset = GetInt64(Info[1]);
    char* Ptr = ArrayBufferData(Info[0]) + Offset;

    char* Val = *reinterpret_cast<char**>(Ptr);

    size_t Size = !Info[2]->IsNull() ? Info[2]->Uint32Value(Context).ToChecked() : 0;

    Info.GetReturnValue().Set(WrapPointer(Isolate, Val, Size));
}

static void WriteUTF8String(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "WriteString: Uint32Array expected as #1 argument");
        return;
    }

    if (!Info[1]->IsString())
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "WriteString: string expected as #2 argument");
        return;
    }

    v8::String::Utf8Value utf8Str(Isolate, Info[1]);

    int64_t Offset = GetInt64(Info[2]);
    if (utf8Str.length() >= ArrayBufferLength(Info[0]) - Offset)
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "WriteString: no enough space");
        return;
    }

    char* Ptr = ArrayBufferData(Info[0]) + Offset;
    memcpy(Ptr, *utf8Str, utf8Str.length() + 1);
}

static void ReadUTF8String(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!IsArrayBuffer(Info[0]))
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "ReadCString: Uint32Array expected as #1 argument");
        return;
    }

    int64_t Offset = GetInt64(Info[1]);
    char* Ptr = ArrayBufferData(Info[0]) + Offset;

    Info.GetReturnValue().Set(PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, Ptr));
}

static void UTF8Length(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!Info[0]->IsString())
    {
        PUERTS_NAMESPACE::FV8Utils::ThrowException(Isolate, "WriteString: string expected as #2 argument");
        return;
    }

    v8::String::Utf8Value utf8Str(Isolate, Info[0]);

    Info.GetReturnValue().Set(utf8Str.length());
}

static void Init(v8::Local<v8::Context> Context, v8::Local<v8::Object> Exports)
{
    v8::Isolate* Isolate = Context->GetIsolate();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "ffi_prep_cif"),
            v8::FunctionTemplate::New(Isolate, FFIPrepCif)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "ffi_prep_cif_var"),
            v8::FunctionTemplate::New(Isolate, FFIPrepCifVar)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "ffi_call"),
            v8::FunctionTemplate::New(Isolate, FFICall)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "writePointer"),
            v8::FunctionTemplate::New(Isolate, WritePointer)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "readPointer"),
            v8::FunctionTemplate::New(Isolate, ReadPointer)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "writeUTF8String"),
            v8::FunctionTemplate::New(Isolate, WriteUTF8String)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "readUTF8String"),
            v8::FunctionTemplate::New(Isolate, ReadUTF8String)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "UTF8Length"),
            v8::FunctionTemplate::New(Isolate, UTF8Length)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "ffi_alloc_closure"),
            v8::FunctionTemplate::New(Isolate, FFIAllocClosure)->GetFunction(Context).ToLocalChecked())
        .Check();

    Exports
        ->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "ffi_free_closure"),
            v8::FunctionTemplate::New(Isolate, FFIFreeClosure)->GetFunction(Context).ToLocalChecked())
        .Check();

#define SET_FFI_ENUM(value)                                                                      \
    Exports->DefineOwnProperty(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, #value), \
        v8::Integer::New(Isolate, (uint32_t) (value)), static_cast<v8::PropertyAttribute>(v8::ReadOnly | v8::DontDelete))

    SET_FFI_ENUM(FFI_OK);
    SET_FFI_ENUM(FFI_BAD_TYPEDEF);
    SET_FFI_ENUM(FFI_BAD_ABI);

    SET_FFI_ENUM(FFI_DEFAULT_ABI);
    SET_FFI_ENUM(FFI_FIRST_ABI);
    SET_FFI_ENUM(FFI_LAST_ABI);
    SET_FFI_ENUM(FFI_TYPE_STRUCT);
#undef SET_FFI_ENUM

    auto Types = v8::Object::New(Isolate);

#define SET_FFI_TYPE(key, value)                                                            \
    Types->DefineOwnProperty(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, key), \
        WrapPointer(Isolate, reinterpret_cast<char*>(&value)), static_cast<v8::PropertyAttribute>(v8::ReadOnly | v8::DontDelete))

    SET_FFI_TYPE("void", ffi_type_void);
    SET_FFI_TYPE("uint8", ffi_type_uint8);
    SET_FFI_TYPE("int8", ffi_type_sint8);
    SET_FFI_TYPE("uint16", ffi_type_uint16);
    SET_FFI_TYPE("int16", ffi_type_sint16);
    SET_FFI_TYPE("uint32", ffi_type_uint32);
    SET_FFI_TYPE("int32", ffi_type_sint32);
    SET_FFI_TYPE("uint64", ffi_type_uint64);
    SET_FFI_TYPE("int64", ffi_type_sint64);
    SET_FFI_TYPE("float", ffi_type_float);
    SET_FFI_TYPE("double", ffi_type_double);
    SET_FFI_TYPE("pointer", ffi_type_pointer);
#undef SET_FFI_TYPE

    Exports->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "FFI_TYPES"), Types).Check();

    auto SizeOf = v8::Object::New(Isolate);
#define SET_SIZEOF(key, type)                                                                \
    SizeOf->DefineOwnProperty(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, key), \
        v8::Integer::New(Isolate, static_cast<uint32_t>(sizeof(type))),                      \
        static_cast<v8::PropertyAttribute>(v8::ReadOnly | v8::DontDelete))

    SET_SIZEOF("uint8", uint8_t);
    SET_SIZEOF("int8", int8_t);
    SET_SIZEOF("uint16", uint16_t);
    SET_SIZEOF("int16", int16_t);
    SET_SIZEOF("uint32", uint32_t);
    SET_SIZEOF("int32", int32_t);
    SET_SIZEOF("uint64", uint64_t);
    SET_SIZEOF("int64", int64_t);
    SET_SIZEOF("float", float);
    SET_SIZEOF("double", double);
    SET_SIZEOF("pointer", char*);
#undef SET_SIZEOF
    Exports->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "sizeof"), SizeOf).Check();

    auto AlignOf = v8::Object::New(Isolate);
#if _MSC_VER
#define SET_ALIGNOF(name, type)                                                                 \
    struct s_##name                                                                             \
    {                                                                                           \
        type a;                                                                                 \
    };                                                                                          \
    AlignOf->DefineOwnProperty(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, #name), \
        v8::Integer::New(Isolate, static_cast<uint32_t>(alignof(struct s_##name))),             \
        static_cast<v8::PropertyAttribute>(v8::ReadOnly | v8::DontDelete))
#else
#define SET_ALIGNOF(name, type)                                                                 \
    struct s_##name                                                                             \
    {                                                                                           \
        type a;                                                                                 \
    };                                                                                          \
    AlignOf->DefineOwnProperty(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, #name), \
        v8::Integer::New(Isolate, static_cast<uint32_t>(__alignof__(struct s_##name))),         \
        static_cast<v8::PropertyAttribute>(v8::ReadOnly | v8::DontDelete))
#endif

    SET_ALIGNOF(uint8, uint8_t);
    SET_ALIGNOF(int8, int8_t);
    SET_ALIGNOF(uint16, uint16_t);
    SET_ALIGNOF(int16, int16_t);
    SET_ALIGNOF(uint32, uint32_t);
    SET_ALIGNOF(int32, int32_t);
    SET_ALIGNOF(uint64, uint64_t);
    SET_ALIGNOF(int64, int64_t);
    SET_ALIGNOF(float, float);
    SET_ALIGNOF(double, double);
    SET_ALIGNOF(pointer, char*);
#undef SET_ALIGNOF
    Exports->Set(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, "alignof"), AlignOf).Check();

#define SET_Property(key, value)                                                              \
    Exports->DefineOwnProperty(Context, PUERTS_NAMESPACE::FV8Utils::ToV8String(Isolate, key), \
        v8::Integer::New(Isolate, (uint32_t) (value)), static_cast<v8::PropertyAttribute>(v8::ReadOnly | v8::DontDelete))

    SET_Property("FFI_ARG_SIZE", sizeof(ffi_arg));
    SET_Property("FFI_SARG_SIZE", sizeof(ffi_sarg));
    SET_Property("FFI_TYPE_SIZE", sizeof(ffi_type));
    SET_Property("FFI_CIF_SIZE", sizeof(ffi_cif));
    SET_Property("POINTER_SIZE", sizeof(char*));
#undef SET_Property
}

PUERTS_MODULE(ffi_bindings, Init);

#else

void SetFunctionArray(FuncPtr* FuncArray, uint32_t FuncArrayLength)
{
}

#endif
