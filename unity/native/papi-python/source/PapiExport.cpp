/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CppObjectMapperPython.h"
#include "pesapi.h"

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

    PESAPI_MODULE_EXPORT pesapi_env_ref CreatePythonPapiEnvRef()
    {
        if (!Py_IsInitialized()) {
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
        PyUnstable_AtExit(PyInterpreterState_Get(), [](void* data) {
            if (auto mapper = static_cast<pesapi::pythonimpl::CppObjectMapper*>(data))
            {
                mapper->Cleanup();
                free(mapper);
            }
        }, mapper);
        return pesapi::pythonimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(mapper));
    }

    PESAPI_MODULE_EXPORT void DestroyPythonPapiEnvRef(pesapi_env_ref env_ref)
    {
        auto mapper = reinterpret_cast<pesapi::pythonimpl::CppObjectMapper*>(pesapi::pythonimpl::g_pesapi_ffi.get_env_from_ref(env_ref));
        get_papi_ffi()->release_env_ref(env_ref);
        if (mapper)
        {
            Py_EndInterpreter(mapper->threadState);
        }
    }

    PESAPI_MODULE_EXPORT void RunGC(pesapi_env_ref env_ref)
    {
        PyGC_Collect();
    }

#ifdef __cplusplus
}
#endif