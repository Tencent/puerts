/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CppObjectMapperPython.h"
#include "pesapi.h"

#if defined(__linux__) && !defined(__APPLE__) && !defined(__ANDROID__)
#include <dlfcn.h>
#include <stdio.h>

// Ensure libpython is loaded with RTLD_GLOBAL so that Python extension modules
// (e.g. math, random) can resolve symbols like PyFloat_Type when embedded.
static void EnsureLibPythonGlobal()
{
    static int s_inited = 0;
    if (s_inited)
    {
        return;
    }
    s_inited = 1;

    char soname[64];
    snprintf(soname, sizeof(soname), "libpython%d.%d.so", PY_MAJOR_VERSION, PY_MINOR_VERSION);

    void* handle = dlopen(soname, RTLD_NOW | RTLD_GLOBAL);
    if (!handle)
    {
        // Fallback: try a more generic name; if this also fails, Python
        // initialization will likely fail later and report an error.
        handle = dlopen("libpython3.so", RTLD_NOW | RTLD_GLOBAL);
    }
}
#else
static void EnsureLibPythonGlobal() {}
#endif

#ifdef __cplusplus
extern "C" {
#endif

    PESAPI_MODULE_EXPORT int GetPythonPapiVersion()
    {
        return PESAPI_VERSION;
    }

    PESAPI_MODULE_EXPORT pesapi_ffi* GetPythonFFIApi()
    {
        return &pesapi::pythonimpl::g_pesapi_ffi;
    }

    PESAPI_MODULE_EXPORT int InitPythonByHome(const char* home)
    {
        if (Py_IsInitialized()) {
            return 0;
        }
        EnsureLibPythonGlobal();
        PyConfig config;
        PyStatus status;
        PyConfig_InitIsolatedConfig(&config);
        status = PyConfig_SetBytesString(&config, &config.home, home);
        if (PyStatus_Exception(status))
        {
            return -1;
        }
        status = Py_InitializeFromConfig(&config);
        if(PyStatus_Exception(status))
        {
            return -2;
        }
        return 0;
    }

    PESAPI_MODULE_EXPORT pesapi_env_ref CreatePythonPapiEnvRef()
    {
        if (!Py_IsInitialized()) {
            EnsureLibPythonGlobal();
            Py_Initialize();
        }

        auto* mapper = reinterpret_cast<pesapi::pythonimpl::CppObjectMapper*>(malloc(sizeof(pesapi::pythonimpl::CppObjectMapper)));
        if (!mapper)
        {
            return nullptr;
        }

        memset(mapper, 0, sizeof(pesapi::pythonimpl::CppObjectMapper));
        PyThreadState *threadState = Py_NewInterpreter();
        if (!threadState) {
            free(mapper);
            return nullptr;
        }

        new (mapper) pesapi::pythonimpl::CppObjectMapper();
        mapper->Initialize(threadState);

        return pesapi::pythonimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(mapper));
    }

    PESAPI_MODULE_EXPORT void DestroyPythonPapiEnvRef(pesapi_env_ref env_ref)
    {
        auto mapper = reinterpret_cast<pesapi::pythonimpl::CppObjectMapper*>(pesapi::pythonimpl::g_pesapi_ffi.get_env_from_ref(env_ref));
        get_papi_ffi()->release_env_ref(env_ref);
        if (mapper)
        {
            PyThreadState *threadState = mapper->threadState;
            if (threadState)
            {
                PyThreadState* prevThreadState = PyThreadState_Swap(threadState);
                
                mapper->Cleanup();
                
                Py_EndInterpreter(threadState);
                
                if (prevThreadState && prevThreadState != threadState) {
                    PyThreadState_Swap(prevThreadState);
                }
            }
            else
            {
                mapper->Cleanup();
            }
            mapper->~CppObjectMapper();
            free(mapper);
        }
    }

    PESAPI_MODULE_EXPORT void RunGC(pesapi_env_ref env_ref)
    {
        PyGC_Collect();
    }

#ifdef __cplusplus
}
#endif