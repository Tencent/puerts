/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PythonInclude.h"

#if PUERTS_PAPI_PYTHON

#include "NamespaceDef.h"
#include "pesapi.h"
#include "JSClassRegister.h"
#include "PythonObjectCacheNode.h"
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
struct pesapi_scope__;
class FCppObjectMapper;

// the instance of a native object (the classes are created by type() with the base type of the mapper, which adds __dict__
// and __weakref__ to the instances)
struct FPyCppObject
{
    PyObject_HEAD void* Ptr;
    const JSClassDefinition* ClassDefinition;
    // the same as ClassDefinition->TypeId except for a pointer of an unknown class
    const void* TypeId;
    FCppObjectMapper* Mapper;
    // the owned object of set_owner
    PyObject* Owner;
    bool CallFinalize;
};

// the data of a native function (owned by the capsule which is the self of the PyCFunction)
struct FFuncData
{
    pesapi_callback Callback;
    void* Data;
    pesapi_function_finalize Finalize;
    FCppObjectMapper* Mapper;
    // a method takes this as the first argument
    bool IsMethod;
    // false once the env is released (the finalize is called by UnInitialize)
    bool Valid;
    std::string Name;
    PyMethodDef Def;
};

// a property of the objects of a class (a data descriptor in the dict of the class)
struct FPropDescr
{
    PyObject_HEAD pesapi_callback Getter;
    void* GetterData;
    pesapi_callback Setter;
    void* SetterData;
    FCppObjectMapper* Mapper;
    PyObject* Name;
};

// a static variable of a class (looked up by the getattro of the meta type)
struct FStaticVar
{
    pesapi_callback Getter;
    void* GetterData;
    pesapi_callback Setter;
    void* SetterData;
};

struct PointerHash
{
    std::size_t operator()(const void* ptr) const
    {
        const auto Value = reinterpret_cast<std::uintptr_t>(ptr);
        return static_cast<std::size_t>((Value >> 4) ^ (Value >> 16));
    }
};

struct FClassEntry
{
    // the class (a strong reference)
    PyObject* Type;
    // the definition the class is built from (its callbacks refer to it), objects created with the class are bound with it
    const JSClassDefinition* ClassDefinition;
    std::unordered_map<std::string, FStaticVar> StaticVars;
    FCppObjectMapper* Mapper;
};

// the object mapping of the python backend (CppObjectMapperPython of unity), the same behavior as the lua one. A mapper is
// bound to the sub interpreter of an env, all the calls are made with its thread state current (see FPyEnvGuard)
class FCppObjectMapper
{
public:
    FCppObjectMapper() = default;
    ~FCppObjectMapper() = default;
    FCppObjectMapper(const FCppObjectMapper&) = delete;
    FCppObjectMapper& operator=(const FCppObjectMapper&) = delete;

    // called with the thread state of the sub interpreter current
    bool Initialize(PyThreadState* InTState);

    // finalizes the native objects and functions of the env, invalidates its refs, while the interpreter is alive (inside it)
    void UnInitialize();

    void SetRegistry(ScriptClassRegistry* InRegistry)
    {
        Registry = InRegistry ? InRegistry : GetDefaultClassRegistry();
    }

    ScriptClassRegistry* GetRegistry()
    {
        return Registry;
    }

    // called when the script class of a definition is created
    std::function<bool(const JSClassDefinition* ClassDefinition)> OnClassCreated;

    inline std::weak_ptr<int> GetEnvLifeCycleTracker()
    {
        return std::weak_ptr<int>(Ref);
    }

    inline const void* GetEnvPrivate() const
    {
        return EnvPrivate;
    }

    inline void SetEnvPrivate(const void* InEnvPrivate)
    {
        EnvPrivate = InEnvPrivate;
    }

    inline bool IsAlive() const
    {
        return Alive;
    }

    // the native object, nullptr if it is not one of the env
    FPyCppObject* GetCppObject(PyObject* Obj) const;

    // a new reference
    PyObject* NewFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize, const char* Name, bool IsMethod);

    // a borrowed reference, nullptr if not found (or the error is caught by the current scope)
    PyObject* GetClassByID(const void* TypeId);

    // a new reference: the cached object of (Ptr, TypeId) if passed by pointer, else a new object, None for a null pointer
    PyObject* PushCppObject(const void* TypeId, void* Ptr, bool PassByPointer);

    bool IsInstanceOf(const void* TypeId, PyObject* Obj);

    void BindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr, PyObject* Self, bool PassByPointer);

    void UnBindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr);

    // pesapi unbind_native_object: detach (Ptr, TypeId) from its cached python object, false if it is not bound
    bool UnbindNativeObject(const void* TypeId, void* Ptr);

    // the dealloc of a native object
    void OnObjectDealloc(FPyCppObject* Obj);

    void RemoveFuncData(FFuncData* Data)
    {
        FuncDatas.erase(Data);
    }

    // takes the python error (it must be set) into the current scope
    void CatchError();

    // keeps a new reference until the current scope is closed (or the env is released if there is no scope)
    pesapi_value Track(PyObject* NewRef);

    // calls a native callback with the arguments in a scope, returns a new reference or nullptr with the python error set
    PyObject* Invoke(pesapi_callback Callback, void* Data, PyObject* This, PyObject* const* Args, Py_ssize_t Argc);

    // the class entry of a type (or of its nearest base created by a mapper)
    static FClassEntry* FindEntryOfType(PyTypeObject* Type);

    PyThreadState* TState = nullptr;

    pesapi_scope__* CurrentScope = nullptr;

    // the dict of builtins (the global of pesapi), the dict of __main__ (the globals of eval)
    PyObject* Builtins = nullptr;
    PyObject* MainDict = nullptr;
    // types.SimpleNamespace (create_object)
    PyObject* NamespaceType = nullptr;
    PyObject* FormatException = nullptr;
    PyObject* FormatExceptionOnly = nullptr;

    // the base of the classes, the meta type of the classes, the type of the property descriptors
    PyTypeObject* BaseType = nullptr;
    PyTypeObject* MetaType = nullptr;
    PyTypeObject* PropDescrType = nullptr;

private:
    FClassEntry* FindOrCreateClass(const JSClassDefinition* ClassDefinition);

    FClassEntry* FindOrCreateClassByID(const void* TypeId);

    // a new reference of an object of the class
    FPyCppObject* NewObject(FClassEntry* Entry);

    PyObject* NewPropDescr(const JSPropertyInfo* PropertyInfo);

    std::unordered_map<void*, FObjectCacheNode, PointerHash> CDataCache;

    std::unordered_map<const void*, FClassEntry, PointerHash> TypeIdToClassMap;

    // the classes being created (a cyclic super chain ends there)
    std::unordered_set<const void*, PointerHash> Creating;

    // the data of the functions which are not released yet
    std::unordered_set<FFuncData*, PointerHash> FuncDatas;

    // the values created outside of any scope
    std::vector<PyObject*> GlobalValues;

    const void* EnvPrivate = nullptr;

    std::shared_ptr<int> Ref = std::make_shared<int>(0);

    JSClassDefinition PtrClassDef = JSClassEmptyDefinition;

    bool Alive = false;

    ScriptClassRegistry* Registry = GetDefaultClassRegistry();
};

}    // namespace pyimpl
}    // namespace PUERTS_NAMESPACE

#endif    // PUERTS_PAPI_PYTHON
