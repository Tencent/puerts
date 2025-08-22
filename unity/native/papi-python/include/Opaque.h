/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <Python.h>

namespace pesapi
{
namespace pythonimpl
{

static bool PyDict_SetItemOpaqueString(PyObject* dp, const char* key, void* opaque)
{
    if (opaque != nullptr)
    {
        return PyDict_SetItemString(dp, key, PyCapsule_New(opaque, nullptr, nullptr));
    }
    return false;
}
static void* PyDict_GetItemOpaqueString(PyObject* dp, const char* key)
{
    PyObject* capsule = PyDict_GetItemString(dp, key);
    if (PyCapsule_CheckExact(capsule))
    {
        void* data = PyCapsule_GetPointer(capsule, nullptr);
        Py_DECREF(capsule);
        return data;
    }
    return nullptr;
}

}    // namespace pythonimpl
}    // namespace pesapi