/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiBackendPython.h"
#include "PesapiPythonImpl.h"
#include "PythonInclude.h"
// GetDefaultClassRegistry / ScriptClassRegistry are used by the stub (PUERTS_PAPI_PYTHON is 0) as well
#include "JSClassRegister.h"

#if PUERTS_PAPI_PYTHON

#include "PythonObjectMapper.h"
#include "PythonPapiData.h"
#include "Misc/Paths.h"
#include <cstring>
#include <string>

namespace PUERTS_NAMESPACE
{
// initializes the python of the engine once (never finalized: the sub interpreters may be created again), the GIL is released
static bool EnsurePythonInitialized()
{
    if (Py_IsInitialized())
    {
        return true;
    }
    FString Home = UTF8_TO_TCHAR(UE_PYTHON_DIR);
    Home.ReplaceInline(TEXT("{ENGINE_DIR}"), *FPaths::EngineDir(), ESearchCase::CaseSensitive);
    Home = FPaths::ConvertRelativePathToFull(Home);
    FPaths::NormalizeDirectoryName(Home);
    FPaths::RemoveDuplicateSlashes(Home);
    FPaths::MakePlatformFilename(Home);

    PyConfig Config;
    PyConfig_InitIsolatedConfig(&Config);
#if PLATFORM_WINDOWS
    PyStatus Status = PyConfig_SetString(&Config, &Config.home, *Home);
#else
    PyStatus Status = PyConfig_SetBytesString(&Config, &Config.home, TCHAR_TO_UTF8(*Home));
#endif
    if (!PyStatus_Exception(Status))
    {
        Status = Py_InitializeFromConfig(&Config);
    }
    PyConfig_Clear(&Config);
    if (PyStatus_Exception(Status))
    {
        UE_LOG(LogTemp, Error, TEXT("PapiPython: can not initialize python (home: %s): %s"), *Home,
            UTF8_TO_TCHAR(Status.err_msg ? Status.err_msg : "unknown error"));
        return false;
    }
    // the main thread state is kept, the GIL is taken by the users
    PyEval_SaveThread();
    return true;
}

// makes a thread state of the main interpreter current if none is (taking the GIL), restores the previous state
struct FPyThreadScope
{
    FPyThreadScope()
    {
        Prev = _PyThreadState_UncheckedGet();
        if (!Prev)
        {
            GILState = PyGILState_Ensure();
            UseGILState = true;
            Prev = PyThreadState_Get();
        }
    }

    ~FPyThreadScope()
    {
        PyThreadState_Swap(Prev);
        if (UseGILState)
        {
            PyGILState_Release(GILState);
        }
    }

    PyThreadState* Prev = nullptr;
    PyGILState_STATE GILState = PyGILState_UNLOCKED;
    bool UseGILState = false;
};

FPapiBackendPython::FPapiBackendPython(const FPapiBackendParams& InParams)
    : Params(InParams), CppObjectMapper(std::make_unique<pyimpl::FCppObjectMapper>())
{
    CppObjectMapper->OnClassInvalidated = Params.OnClassInvalidated;
    CppObjectMapper->OnClassCreated = Params.OnClassCreated;
}

FPapiBackendPython::~FPapiBackendPython()
{
    check(!SubTState);
}

std::unique_ptr<IPapiBackend> FPapiBackendPython::Create(const FPapiBackendParams& InParams)
{
    if (!EnsurePythonInitialized())
    {
        return nullptr;
    }
    return std::make_unique<FPapiBackendPython>(InParams);
}

bool FPapiBackendPython::IsAvailable()
{
    return EnsurePythonInitialized();
}

int FPapiBackendPython::GetApiVersion()
{
    return PESAPI_VERSION;
}

struct pesapi_ffi* FPapiBackendPython::GetApi()
{
    return &pyimpl::g_pesapi_ffi;
}

pesapi_env_ref FPapiBackendPython::CreateEnvRef()
{
    check(!SubTState);
    FPyThreadScope ThreadScope;
    PyThreadState* Sub = Py_NewInterpreter();
    if (!Sub)
    {
        UE_LOG(LogTemp, Error, TEXT("PapiPython: can not create the sub interpreter"));
        return nullptr;
    }
    // the object mapping used by the python implementation of pesapi, inside the sub interpreter
    if (!CppObjectMapper->Initialize(Sub))
    {
        UE_LOG(LogTemp, Error, TEXT("PapiPython: can not initialize the object mapping"));
        CppObjectMapper->UnInitialize();
        Py_EndInterpreter(Sub);
        return nullptr;
    }
    SubTState = Sub;
    // after the mapper is initialized: the ref tracks the life cycle of the env, which starts there
    MainEnvRef = pyimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(CppObjectMapper.get()));
    return MainEnvRef;
}

void FPapiBackendPython::DestroyEnvRef(pesapi_env_ref EnvRef)
{
    if (!SubTState)
    {
        return;
    }
    PyThreadState* Sub = SubTState;
    FPyThreadScope ThreadScope;
    check(ThreadScope.Prev != Sub);
    PyThreadState_Swap(Sub);
    if (EnvRef)
    {
        pyimpl::g_pesapi_ffi.release_env_ref(EnvRef);
    }
    MainEnvRef = nullptr;
    // finalizes the native objects and invalidates the refs of the env
    CppObjectMapper->UnInitialize();
    if (Params.OnEnvReleased)
    {
        Params.OnEnvReleased();
    }
    // the objects of the interpreter are released here (the mapper lives on, not alive)
    Py_EndInterpreter(Sub);
    SubTState = nullptr;
}

void FPapiBackendPython::OnEnter(IPapiScriptHost* Host)
{
    // print/console, the module finder of the host, UE/CPP and the helpers used by the host (puerts.__xxx, puerts.argv)
    Host->ExecuteModule(TEXT("puerts/init.py"));
}

void FPapiBackendPython::OnExit(IPapiScriptHost* Host)
{
}

pesapi_value FPapiBackendPython::ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    // the import of python: the modules are global (no referrer), import is the same as require. A missing require fails in
    // call_function (not callable) and is caught by the scope of the host
    struct pesapi_ffi* Apis = GetApi();
    pesapi_value Require = Apis->get_property(Env, Apis->global(Env), "require");
    pesapi_value Args[] = {Apis->create_string_utf8(Env, Specifier, strlen(Specifier))};
    return Apis->call_function(Env, Require, nullptr, 1, Args);
}

void FPapiBackendPython::RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports)
{
    if (!SubTState)
    {
        return;
    }
    pyimpl::FPyEnvGuard Guard(SubTState);
    PyObject* Modules = PyImport_GetModuleDict();
    PyObject* Value = Exports ? reinterpret_cast<PyObject*>(Exports) : Py_None;
    if (!Modules || PyDict_SetItemString(Modules, Name, Value) < 0)
    {
        PyErr_Clear();
    }
}

static void Collect(PyThreadState* TState)
{
    if (!TState)
    {
        return;
    }
    pyimpl::FPyEnvGuard Guard(TState);
    PyObject* Type;
    PyObject* Value;
    PyObject* Traceback;
    PyErr_Fetch(&Type, &Value, &Traceback);
    PyGC_Collect();
    PyErr_Restore(Type, Value, Traceback);
}

void FPapiBackendPython::LowMemoryNotification()
{
    Collect(SubTState);
}

bool FPapiBackendPython::IdleNotificationDeadline(double DeadlineInSeconds)
{
    // the objects are released by reference counting, the cycles by the automatic collection
    return true;
}

void FPapiBackendPython::RequestMinorGarbageCollectionForTesting()
{
    Collect(SubTState);
}

void FPapiBackendPython::RequestFullGarbageCollectionForTesting()
{
    Collect(SubTState);
}

// calls Module.Func() which returns a list of str (or an int), the result joined, an empty string on failure
static std::string CallModuleFunction(const char* Module, const char* Func, long long* OutInt)
{
    std::string Ret;
    PyObject* Type;
    PyObject* Value;
    PyObject* Traceback;
    PyErr_Fetch(&Type, &Value, &Traceback);
    PyObject* Mod = PyImport_ImportModule(Module);
    PyObject* R = Mod ? PyObject_CallMethod(Mod, Func, nullptr) : nullptr;
    Py_XDECREF(Mod);
    if (R && OutInt && PyLong_Check(R))
    {
        *OutInt = PyLong_AsLongLong(R);
    }
    else if (R && PyList_Check(R))
    {
        PyObject* Sep = PyUnicode_FromString("");
        PyObject* Joined = Sep ? PyUnicode_Join(Sep, R) : nullptr;
        Py_XDECREF(Sep);
        Py_ssize_t Len = 0;
        const char* Str = Joined ? PyUnicode_AsUTF8AndSize(Joined, &Len) : nullptr;
        if (Str)
        {
            Ret.assign(Str, static_cast<size_t>(Len));
        }
        Py_XDECREF(Joined);
    }
    Py_XDECREF(R);
    PyErr_Clear();
    PyErr_Restore(Type, Value, Traceback);
    return Ret;
}

FString FPapiBackendPython::GetStatisticsLog()
{
    if (!SubTState)
    {
        return FString();
    }
    long long Blocks = -1;
    {
        pyimpl::FPyEnvGuard Guard(SubTState);
        CallModuleFunction("sys", "getallocatedblocks", &Blocks);
    }
    return FString::Printf(TEXT("------------------------\n"
                                "Dump Statistics of Python:\n"
                                "allocated_blocks: %lld\n"
                                "------------------------\n"),
        Blocks);
}

FString FPapiBackendPython::CurrentStackTrace()
{
    if (!SubTState)
    {
        return FString();
    }
    std::string Stack;
    {
        pyimpl::FPyEnvGuard Guard(SubTState);
        Stack = CallModuleFunction("traceback", "format_stack", nullptr);
    }
    return UTF8_TO_TCHAR(Stack.c_str());
}

ScriptClassRegistry* FPapiBackendPython::GetRegistry()
{
    return CppObjectMapper->GetRegistry();
}
}    // namespace PUERTS_NAMESPACE

#else    // PUERTS_PAPI_PYTHON

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
class FCppObjectMapper
{
};
}    // namespace pyimpl

FPapiBackendPython::FPapiBackendPython(const FPapiBackendParams& InParams) : Params(InParams)
{
}

FPapiBackendPython::~FPapiBackendPython()
{
}

std::unique_ptr<IPapiBackend> FPapiBackendPython::Create(const FPapiBackendParams& InParams)
{
    return nullptr;
}

bool FPapiBackendPython::IsAvailable()
{
    return false;
}

int FPapiBackendPython::GetApiVersion()
{
    return PESAPI_VERSION;
}

struct pesapi_ffi* FPapiBackendPython::GetApi()
{
    return &pyimpl::g_pesapi_ffi;
}

pesapi_env_ref FPapiBackendPython::CreateEnvRef()
{
    return nullptr;
}

void FPapiBackendPython::DestroyEnvRef(pesapi_env_ref EnvRef)
{
}

void FPapiBackendPython::OnEnter(IPapiScriptHost* Host)
{
}

void FPapiBackendPython::OnExit(IPapiScriptHost* Host)
{
}

pesapi_value FPapiBackendPython::ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    return nullptr;
}

void FPapiBackendPython::RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports)
{
}

void FPapiBackendPython::LowMemoryNotification()
{
}

bool FPapiBackendPython::IdleNotificationDeadline(double DeadlineInSeconds)
{
    return true;
}

void FPapiBackendPython::RequestMinorGarbageCollectionForTesting()
{
}

void FPapiBackendPython::RequestFullGarbageCollectionForTesting()
{
}

FString FPapiBackendPython::GetStatisticsLog()
{
    return FString();
}

FString FPapiBackendPython::CurrentStackTrace()
{
    return FString();
}

ScriptClassRegistry* FPapiBackendPython::GetRegistry()
{
    return GetDefaultClassRegistry();
}
}    // namespace PUERTS_NAMESPACE

#endif    // PUERTS_PAPI_PYTHON
