/*
 * Minimal host used to test unreal pesapi implementation (PesapiV8Impl.cpp + PesapiRegister.cpp) outside of unreal engine.
 * It creates a v8 isolate, installs a FCppObjectMapper, loads a pesapi addon and runs a js test script.
 *
 * usage: papi_test_host <addon path> <script path>
 */

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <memory>
#include <sstream>
#include <string>

#if defined(_WIN32)
#include <windows.h>
#else
#include <dlfcn.h>
#endif

#include "pesapi.h"
#include "CppObjectMapper.h"
#include "DataTransfer.h"
#include "PesapiImpl.h"
#include "PesapiRegistryImpl.h"
#include "JSClassRegister.h"

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

typedef void (*PesapiAddonRegisterFunc)(struct pesapi_registry_api* registry_api, pesapi_registry registry);

static puerts::FCppObjectMapper* GMapper = nullptr;

#ifndef PAPI_TEST_NAME
#define PAPI_TEST_NAME "pesapi addon"
#endif

static void ThrowError(v8::Isolate* Isolate, const std::string& Msg)
{
    Isolate->ThrowException(
        v8::Exception::Error(v8::String::NewFromUtf8(Isolate, Msg.c_str(), v8::NewStringType::kNormal).ToLocalChecked()));
}

static std::string ToStdString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
{
    v8::String::Utf8Value Str(Isolate, Value);
    return *Str ? std::string(*Str, Str.length()) : std::string("<null>");
}

static void* OpenLibrary(const char* Path)
{
#if defined(_WIN32)
    return (void*) LoadLibraryA(Path);
#else
    return dlopen(Path, RTLD_NOW | RTLD_LOCAL);
#endif
}

static void* FindSymbol(void* Handle, const char* Name)
{
#if defined(_WIN32)
    return (void*) GetProcAddress((HMODULE) Handle, Name);
#else
    return dlsym(Handle, Name);
#endif
}

// same flow as PesapiAddonLoad.cpp in unreal: find pesapi_register_<module>_v<ver>, call it with registry api
static void LoadAddon(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    if (Info.Length() < 2 || !Info[0]->IsString() || !Info[1]->IsString())
    {
        ThrowError(Isolate, "loadAddon(path, moduleName) expect two strings");
        return;
    }
    std::string Path = ToStdString(Isolate, Info[0]);
    std::string ModuleName = ToStdString(Isolate, Info[1]);
#if defined(PAPI_TEST_LINKED_MODULE)
    // the module is linked into this host, PUERTS_PESAPI_MODULE registered its classes during static initialization
    return;
#endif
    void* Handle = OpenLibrary(Path.c_str());
    if (!Handle)
    {
        ThrowError(Isolate, "can not load addon: " + Path);
        return;
    }
    std::string EntryName = "pesapi_register_" + ModuleName + "_v" + std::to_string(PESAPI_VERSION);
    auto Init = (PesapiAddonRegisterFunc) (uintptr_t) FindSymbol(Handle, EntryName.c_str());
    if (!Init)
    {
        ThrowError(Isolate, "can not find entry " + EntryName + " in " + Path);
        return;
    }
    pesapi::regimpl::GPesapiModuleName = ModuleName.c_str();
    Init(&pesapi::regimpl::g_reg_apis, pesapi::regimpl::GetDefaultRegistry());
    pesapi::regimpl::GPesapiModuleName = nullptr;
}

static void LoadCppType(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    GMapper->LoadCppType(Info);
}

static pesapi_registry GEmptyRegistry = nullptr;

// puerts.useEmptyRegistry(bool): bind the env to a newly created (empty) registry or back to the default one through
// pesapi create_registry/set_registry, returns whether hello.TestClass can be found in the registry now in use
static void UseEmptyRegistry(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (!GEmptyRegistry)
    {
        GEmptyRegistry = pesapi::regimpl::g_reg_apis.create_registry();
    }
    bool UseEmpty = Info.Length() > 0 && Info[0]->BooleanValue(Isolate);
    pesapi_registry Registry = UseEmpty ? GEmptyRegistry : pesapi::regimpl::GetDefaultRegistry();
    v8impl::g_pesapi_ffi.set_registry(reinterpret_cast<pesapi_env>(*Context), Registry);
    bool Found = pesapi::regimpl::g_reg_apis.find_type_id(Registry, "hello", "TestClass") != nullptr;
    Info.GetReturnValue().Set(Found);
}

// puerts.invalidateClass(name): pesapi invalidate_class on hello.<name> of the default registry
static void InvalidateClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    std::string Name = ToStdString(Isolate, Info[0]);
    const void* TypeId = pesapi::regimpl::g_reg_apis.find_type_id(pesapi::regimpl::GetDefaultRegistry(), "hello", Name.c_str());
    if (!TypeId)
    {
        ThrowError(Isolate, "can not find hello." + Name);
        return;
    }
    v8impl::g_pesapi_ffi.invalidate_class(reinterpret_cast<pesapi_env>(*Context), TypeId);
}

static void Print(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    std::string Line;
    for (int i = 0; i < Info.Length(); i++)
    {
        if (i > 0)
            Line += " ";
        Line += ToStdString(Isolate, Info[i]);
    }
    printf("%s\n", Line.c_str());
    fflush(stdout);
}

static void Gc(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    Info.GetIsolate()->LowMemoryNotification();
}

static void SetFunction(v8::Local<v8::Context> Context, v8::Local<v8::Object> Obj, const char* Name, v8::FunctionCallback Callback)
{
    v8::Isolate* Isolate = Context->GetIsolate();
    (void) Obj->Set(Context, v8::String::NewFromUtf8(Isolate, Name, v8::NewStringType::kNormal).ToLocalChecked(),
        v8::FunctionTemplate::New(Isolate, Callback)->GetFunction(Context).ToLocalChecked());
}

static bool ReadFile(const char* Path, std::string& Out)
{
    std::ifstream In(Path, std::ios::in | std::ios::binary);
    if (!In)
        return false;
    std::ostringstream SS;
    SS << In.rdbuf();
    Out = SS.str();
    return true;
}

static void ReportException(v8::Isolate* Isolate, v8::TryCatch& TryCatch)
{
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    std::string Msg = ToStdString(Isolate, TryCatch.Exception());
    v8::Local<v8::Value> Stack;
    if (TryCatch.StackTrace(Context).ToLocal(&Stack) && Stack->IsString())
    {
        Msg = ToStdString(Isolate, Stack);
    }
    fprintf(stderr, "Uncaught exception: %s\n", Msg.c_str());
}

int main(int argc, char* argv[])
{
    if (argc < 3)
    {
        fprintf(stderr, "usage: %s <addon path> <script path>\n", argv[0]);
        return 2;
    }

    std::string Source;
    if (!ReadFile(argv[2], Source))
    {
        fprintf(stderr, "can not read script: %s\n", argv[2]);
        return 2;
    }

    std::unique_ptr<v8::Platform> Platform = v8::platform::NewDefaultPlatform();
    v8::V8::InitializePlatform(Platform.get());
    v8::V8::Initialize();
    puerts::SetPesapiFFI(&v8impl::g_pesapi_ffi);

    v8::Isolate::CreateParams CreateParams;
    CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    v8::Isolate* Isolate = v8::Isolate::New(CreateParams);

    int ExitCode = 0;
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = v8::Context::New(Isolate);
        v8::Context::Scope ContextScope(Context);

        puerts::FCppObjectMapper Mapper;
        GMapper = &Mapper;
        Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<puerts::ICppObjectMapper*>(&Mapper));
        Mapper.Initialize(Isolate, Context);

        v8::Local<v8::Object> Global = Context->Global();
        v8::Local<v8::Object> Puerts = v8::Object::New(Isolate);
        (void) Global->Set(Context, v8::String::NewFromUtf8(Isolate, "puerts").ToLocalChecked(), Puerts);
        SetFunction(Context, Puerts, "loadAddon", LoadAddon);
        SetFunction(Context, Puerts, "loadCPPType", LoadCppType);
        SetFunction(Context, Puerts, "useEmptyRegistry", UseEmptyRegistry);
        SetFunction(Context, Puerts, "invalidateClass", InvalidateClass);
        SetFunction(Context, Global, "print", Print);
        SetFunction(Context, Global, "gc", Gc);
        (void) Global->Set(Context, v8::String::NewFromUtf8(Isolate, "ADDON_PATH").ToLocalChecked(),
            v8::String::NewFromUtf8(Isolate, argv[1]).ToLocalChecked());

        {
            v8::TryCatch TryCatch(Isolate);
            v8::ScriptOrigin Origin(Isolate, v8::String::NewFromUtf8(Isolate, argv[2]).ToLocalChecked());
            v8::Local<v8::Script> Script;
            v8::Local<v8::Value> Result;
            if (!v8::Script::Compile(Context, v8::String::NewFromUtf8(Isolate, Source.c_str()).ToLocalChecked(), &Origin)
                     .ToLocal(&Script) ||
                !Script->Run(Context).ToLocal(&Result))
            {
                ReportException(Isolate, TryCatch);
                ExitCode = 1;
            }
        }

        Mapper.UnInitialize(Isolate);
        GMapper = nullptr;
        puerts::DestroyRegistry(reinterpret_cast<puerts::ScriptClassRegistry*>(GEmptyRegistry));
        GEmptyRegistry = nullptr;
    }

    Isolate->Dispose();
    v8::V8::Dispose();
    v8::V8::ShutdownPlatform();
    delete CreateParams.array_buffer_allocator;

    printf(ExitCode == 0 ? "papi test passed (%s)\n" : "papi test failed (%s)\n", PAPI_TEST_NAME);
    return ExitCode;
}
