/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PythonObjectMapper.h"

#if WITH_PYTHON

#include "PythonPapiData.h"
#include "PesapiPythonImpl.h"
#include <cstring>
#include <utility>

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
static const int MaxSuperDepth = 64;

static const char* const FuncCapsuleName = "puerts.func";

// the class entries of the classes created by the mappers (the interpreters share the GIL)
static std::unordered_map<PyObject*, FClassEntry*>& TypeToEntry()
{
    static std::unordered_map<PyObject*, FClassEntry*> Map;
    return Map;
}

FClassEntry* FCppObjectMapper::FindEntryOfType(PyTypeObject* Type)
{
    auto& Map = TypeToEntry();
    if (!Type || Map.empty())
    {
        return nullptr;
    }
    PyObject* Mro = Type->tp_mro;
    if (Mro && PyTuple_Check(Mro))
    {
        const Py_ssize_t N = PyTuple_GET_SIZE(Mro);
        for (Py_ssize_t i = 0; i < N; ++i)
        {
            auto It = Map.find(PyTuple_GET_ITEM(Mro, i));
            if (It != Map.end())
            {
                return It->second;
            }
        }
        return nullptr;
    }
    auto It = Map.find(reinterpret_cast<PyObject*>(Type));
    return It != Map.end() ? It->second : nullptr;
}

// calls a native callback (Call) in a scope, returns a new reference of the return value, or nullptr with the python error set
// (thrown by throw_by_string / throw_error, or caught by the scope)
template <typename F>
static PyObject* CallNative(FCppObjectMapper* Mapper, void* Data, PyObject* This, PyObject* const* Args, Py_ssize_t Argc, F&& Call)
{
    int Kind = 0;
    std::string Msg;
    PyObject* Type = nullptr;
    PyObject* Value = nullptr;
    PyObject* Traceback = nullptr;
    PyObject* Ret = nullptr;
    {
        pesapi_scope__ Scope(Mapper);
        pesapi_callback_info__ Info;
        Info.Mapper = Mapper;
        Info.This = This;
        Info.Args = Args;
        Info.Argc = static_cast<int>(Argc);
        Info.Data = Data;
        Call(reinterpret_cast<pesapi_callback_info>(&Info));
        if (PyErr_Occurred())
        {
            Mapper->CatchError();
        }
        // a reference kept by add_return
        PyObject* Returned = reinterpret_cast<PyObject*>(Info.Ret);
        Info.Ret = nullptr;
        if (Info.HasEx)
        {
            Kind = 1;
            Msg = Info.ExMsg;
            Mapper->HasPendingError = false;
            Mapper->PendingError.clear();
        }
        else if (Mapper->HasPendingError)
        {
            Kind = 1;
            Msg = Mapper->PendingError;
            Mapper->HasPendingError = false;
            Mapper->PendingError.clear();
        }
        else if (Scope.Caught && Scope.Caught->Type)
        {
            Kind = 2;
            Type = Scope.Caught->Type;
            Value = Scope.Caught->Value;
            Traceback = Scope.Caught->Traceback;
            Scope.Caught->Type = nullptr;
            Scope.Caught->Value = nullptr;
            Scope.Caught->Traceback = nullptr;
        }
        if (Kind == 0)
        {
            Ret = Returned;
            if (!Ret)
            {
                Ret = Py_None;
                Py_INCREF(Ret);
            }
        }
        else
        {
            Py_XDECREF(Returned);
        }
    }
    if (Kind == 1)
    {
        PyErr_SetString(PyExc_RuntimeError, Msg.c_str());
        return nullptr;
    }
    if (Kind == 2)
    {
        PyErr_Restore(Type, Value, Traceback);
        return nullptr;
    }
    return Ret;
}

PyObject* FCppObjectMapper::Invoke(pesapi_callback Callback, void* Data, PyObject* This, PyObject* const* Args, Py_ssize_t Argc)
{
    return CallNative(this, Data, This, Args, Argc, [&](pesapi_callback_info Info) { Callback(&g_pesapi_ffi, Info); });
}

static bool CheckAlive(FCppObjectMapper* Mapper, const char* Name)
{
    if (!Mapper || !Mapper->IsAlive())
    {
        PyErr_Format(PyExc_RuntimeError, "the env of %s is released", Name ? Name : "?");
        return false;
    }
    return true;
}

// ---------------------------------------------------------------- the base type of the classes

static PyObject* BaseNew(PyTypeObject* Subtype, PyObject* Args, PyObject* Kwds)
{
    FClassEntry* Entry = FCppObjectMapper::FindEntryOfType(Subtype);
    if (!Entry || !Entry->Mapper || !Entry->Mapper->IsAlive())
    {
        PyErr_Format(PyExc_TypeError, "can not create an instance of %s", Subtype->tp_name);
        return nullptr;
    }
    FCppObjectMapper* Mapper = Entry->Mapper;
    const JSClassDefinition* ClassDefinition = Entry->ClassDefinition;
    FPyCppObject* Self = reinterpret_cast<FPyCppObject*>(Subtype->tp_alloc(Subtype, 0));
    if (!Self)
    {
        return nullptr;
    }
    Self->Ptr = nullptr;
    Self->ClassDefinition = ClassDefinition;
    Self->TypeId = ClassDefinition->TypeId;
    Self->Mapper = Mapper;
    Self->Owner = nullptr;
    Self->CallFinalize = false;
    if (ClassDefinition->Initialize)
    {
        PyObject* const* Argv = nullptr;
        Py_ssize_t Argc = 0;
        if (Args && PyTuple_Check(Args))
        {
            Argv = reinterpret_cast<PyTupleObject*>(Args)->ob_item;
            Argc = PyTuple_GET_SIZE(Args);
        }
        void* Ptr = nullptr;
        PyObject* Ret = CallNative(Mapper, ClassDefinition->Data, reinterpret_cast<PyObject*>(Self), Argv, Argc,
            [&](pesapi_callback_info Info) { Ptr = ClassDefinition->Initialize(&g_pesapi_ffi, Info); });
        if (!Ret)
        {
            Py_DECREF(Self);
            return nullptr;
        }
        Py_DECREF(Ret);
        if (Ptr)
        {
            Mapper->BindCppObject(ClassDefinition, Ptr, reinterpret_cast<PyObject*>(Self), false);
        }
    }
    return reinterpret_cast<PyObject*>(Self);
}

static void BaseDealloc(PyObject* SelfObj)
{
    FPyCppObject* Self = reinterpret_cast<FPyCppObject*>(SelfObj);
    PyObject* Type;
    PyObject* Value;
    PyObject* Traceback;
    PyErr_Fetch(&Type, &Value, &Traceback);
    if (Self->Ptr && Self->Mapper && Self->Mapper->IsAlive())
    {
        Self->Mapper->OnObjectDealloc(Self);
    }
    Py_CLEAR(Self->Owner);
    PyTypeObject* Tp = Py_TYPE(SelfObj);
    Tp->tp_free(SelfObj);
    Py_DECREF(Tp);
    PyErr_Restore(Type, Value, Traceback);
}

static PyObject* BaseRepr(PyObject* SelfObj)
{
    FPyCppObject* Self = reinterpret_cast<FPyCppObject*>(SelfObj);
    const char* Name = (Self->ClassDefinition && Self->ClassDefinition->ScriptName) ? Self->ClassDefinition->ScriptName
                                                                                    : Py_TYPE(SelfObj)->tp_name;
    return PyUnicode_FromFormat("<%s at %p>", Name, Self->Ptr);
}

static PyType_Slot BaseSlots[] = {
    {Py_tp_new, reinterpret_cast<void*>(BaseNew)},
    {Py_tp_dealloc, reinterpret_cast<void*>(BaseDealloc)},
    {Py_tp_repr, reinterpret_cast<void*>(BaseRepr)},
    {0, nullptr},
};

static PyType_Spec BaseSpec = {
    "puerts.CppObject",
    static_cast<int>(sizeof(FPyCppObject)),
    0,
    Py_TPFLAGS_DEFAULT | Py_TPFLAGS_BASETYPE,
    BaseSlots,
};

// ---------------------------------------------------------------- the property descriptors

static PyObject* PropGet(PyObject* SelfObj, PyObject* Obj, PyObject* Type)
{
    FPropDescr* Self = reinterpret_cast<FPropDescr*>(SelfObj);
    if (!Obj)
    {
        Py_INCREF(SelfObj);
        return SelfObj;
    }
    if (!Self->Getter)
    {
        Py_RETURN_NONE;
    }
    if (!CheckAlive(Self->Mapper, "the property"))
    {
        return nullptr;
    }
    return Self->Mapper->Invoke(Self->Getter, Self->GetterData, Obj, nullptr, 0);
}

static int PropSet(PyObject* SelfObj, PyObject* Obj, PyObject* Value)
{
    FPropDescr* Self = reinterpret_cast<FPropDescr*>(SelfObj);
    if (!Value)
    {
        PyErr_Format(PyExc_AttributeError, "can not delete property %S", Self->Name ? Self->Name : Py_None);
        return -1;
    }
    if (!Self->Setter)
    {
        PyErr_Format(PyExc_AttributeError, "property %S is read-only", Self->Name ? Self->Name : Py_None);
        return -1;
    }
    if (!CheckAlive(Self->Mapper, "the property"))
    {
        return -1;
    }
    PyObject* Args[1] = {Value};
    PyObject* Ret = Self->Mapper->Invoke(Self->Setter, Self->SetterData, Obj, Args, 1);
    if (!Ret)
    {
        return -1;
    }
    Py_DECREF(Ret);
    return 0;
}

static void PropDealloc(PyObject* SelfObj)
{
    FPropDescr* Self = reinterpret_cast<FPropDescr*>(SelfObj);
    Py_CLEAR(Self->Name);
    PyTypeObject* Tp = Py_TYPE(SelfObj);
    Tp->tp_free(SelfObj);
    Py_DECREF(Tp);
}

static PyType_Slot PropSlots[] = {
    {Py_tp_descr_get, reinterpret_cast<void*>(PropGet)},
    {Py_tp_descr_set, reinterpret_cast<void*>(PropSet)},
    {Py_tp_dealloc, reinterpret_cast<void*>(PropDealloc)},
    {0, nullptr},
};

#ifdef Py_TPFLAGS_DISALLOW_INSTANTIATION
#define PUERTS_PY_PROP_FLAGS (Py_TPFLAGS_DEFAULT | Py_TPFLAGS_DISALLOW_INSTANTIATION)
#else
#define PUERTS_PY_PROP_FLAGS Py_TPFLAGS_DEFAULT
#endif

static PyType_Spec PropSpec = {
    "puerts.Property",
    static_cast<int>(sizeof(FPropDescr)),
    0,
    PUERTS_PY_PROP_FLAGS,
    PropSlots,
};

// ---------------------------------------------------------------- the meta type of the classes (static variables)

// copies the static variable of the class (or of its bases) named Name, false if not found
static bool FindStaticVar(PyTypeObject* Type, PyObject* Name, FStaticVar& Out, FCppObjectMapper*& OutMapper)
{
    auto& Map = TypeToEntry();
    if (Map.empty() || !PyUnicode_Check(Name) || !Type->tp_mro || !PyTuple_Check(Type->tp_mro))
    {
        return false;
    }
    const char* Str = nullptr;
    PyObject* Mro = Type->tp_mro;
    const Py_ssize_t N = PyTuple_GET_SIZE(Mro);
    for (Py_ssize_t i = 0; i < N; ++i)
    {
        auto It = Map.find(PyTuple_GET_ITEM(Mro, i));
        if (It == Map.end() || It->second->StaticVars.empty())
        {
            continue;
        }
        if (!Str)
        {
            Str = PyUnicode_AsUTF8(Name);
            if (!Str)
            {
                PyErr_Clear();
                return false;
            }
        }
        auto VarIt = It->second->StaticVars.find(Str);
        if (VarIt != It->second->StaticVars.end())
        {
            Out = VarIt->second;
            OutMapper = It->second->Mapper;
            return true;
        }
    }
    return false;
}

static PyObject* MetaGetattro(PyObject* Cls, PyObject* Name)
{
    FStaticVar Var;
    FCppObjectMapper* Mapper = nullptr;
    if (FindStaticVar(reinterpret_cast<PyTypeObject*>(Cls), Name, Var, Mapper))
    {
        if (!Var.Getter)
        {
            Py_RETURN_NONE;
        }
        if (!CheckAlive(Mapper, "the static variable"))
        {
            return nullptr;
        }
        return Mapper->Invoke(Var.Getter, Var.GetterData, nullptr, nullptr, 0);
    }
    return PyType_Type.tp_getattro(Cls, Name);
}

static int MetaSetattro(PyObject* Cls, PyObject* Name, PyObject* Value)
{
    FStaticVar Var;
    FCppObjectMapper* Mapper = nullptr;
    if (Value && FindStaticVar(reinterpret_cast<PyTypeObject*>(Cls), Name, Var, Mapper))
    {
        if (Var.Setter)
        {
            if (!CheckAlive(Mapper, "the static variable"))
            {
                return -1;
            }
            PyObject* Args[1] = {Value};
            PyObject* Ret = Mapper->Invoke(Var.Setter, Var.SetterData, nullptr, Args, 1);
            if (!Ret)
            {
                return -1;
            }
            Py_DECREF(Ret);
            return 0;
        }
        if (Var.Getter)
        {
            PyErr_Format(PyExc_AttributeError, "static variable %S is read-only", Name);
            return -1;
        }
    }
    return PyType_Type.tp_setattro(Cls, Name, Value);
}

// ---------------------------------------------------------------- native functions

static PyObject* FuncTrampoline(PyObject* Self, PyObject* const* Args, Py_ssize_t N)
{
    FFuncData* Data = static_cast<FFuncData*>(PyCapsule_GetPointer(Self, FuncCapsuleName));
    if (!Data)
    {
        return nullptr;
    }
    if (!Data->Valid || !CheckAlive(Data->Mapper, Data->Name.c_str()))
    {
        if (!PyErr_Occurred())
        {
            PyErr_Format(PyExc_RuntimeError, "the env of %s is released", Data->Name.c_str());
        }
        return nullptr;
    }
    PyObject* This = nullptr;
    if (Data->IsMethod)
    {
        if (N < 1)
        {
            PyErr_Format(PyExc_TypeError, "method %s requires an instance", Data->Name.c_str());
            return nullptr;
        }
        This = Args[0];
        ++Args;
        --N;
    }
    return Data->Mapper->Invoke(Data->Callback, Data->Data, This, Args, N);
}

static void FuncCapsuleDestructor(PyObject* Capsule)
{
    FFuncData* Data = static_cast<FFuncData*>(PyCapsule_GetPointer(Capsule, FuncCapsuleName));
    if (!Data)
    {
        PyErr_Clear();
        return;
    }
    if (Data->Valid)
    {
        Data->Valid = false;
        if (Data->Mapper)
        {
            if (Data->Finalize)
            {
                Data->Finalize(&g_pesapi_ffi, Data->Data, const_cast<void*>(Data->Mapper->GetEnvPrivate()));
            }
            Data->Mapper->RemoveFuncData(Data);
        }
    }
    delete Data;
}

PyObject* FCppObjectMapper::NewFunction(
    pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize, const char* Name, bool IsMethod)
{
    FFuncData* FuncData = new FFuncData();
    FuncData->Callback = Callback;
    FuncData->Data = Data;
    FuncData->Finalize = Finalize;
    FuncData->Mapper = this;
    FuncData->IsMethod = IsMethod;
    FuncData->Valid = true;
    FuncData->Name = Name ? Name : "native";
    FuncData->Def.ml_name = FuncData->Name.c_str();
    FuncData->Def.ml_meth = reinterpret_cast<PyCFunction>(reinterpret_cast<void*>(&FuncTrampoline));
    FuncData->Def.ml_flags = METH_FASTCALL;
    FuncData->Def.ml_doc = nullptr;
    PyObject* Capsule = PyCapsule_New(FuncData, FuncCapsuleName, FuncCapsuleDestructor);
    if (!Capsule)
    {
        delete FuncData;
        return nullptr;
    }
    FuncDatas.insert(FuncData);
    // the capsule (and the finalize) is released with the function
    PyObject* Func = PyCFunction_NewEx(&FuncData->Def, Capsule, nullptr);
    Py_DECREF(Capsule);
    return Func;
}

// ---------------------------------------------------------------- mapper

bool FCppObjectMapper::Initialize(PyThreadState* InTState)
{
    TState = InTState;
    if (!Ref)
    {
        Ref = std::make_shared<int>(0);
    }
    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";

    BaseType = reinterpret_cast<PyTypeObject*>(PyType_FromSpec(&BaseSpec));
    if (!BaseType)
    {
        PyErr_Print();
        return false;
    }
    PyObject* Meta = PyObject_CallFunction(
        reinterpret_cast<PyObject*>(&PyType_Type), "s(O){}", "PuertsMeta", reinterpret_cast<PyObject*>(&PyType_Type));
    if (!Meta)
    {
        PyErr_Print();
        return false;
    }
    MetaType = reinterpret_cast<PyTypeObject*>(Meta);
    MetaType->tp_getattro = MetaGetattro;
    MetaType->tp_setattro = MetaSetattro;
    PyType_Modified(MetaType);
    PropDescrType = reinterpret_cast<PyTypeObject*>(PyType_FromSpec(&PropSpec));
    if (!PropDescrType)
    {
        PyErr_Print();
        return false;
    }

    PyObject* BuiltinsModule = PyImport_ImportModule("builtins");
    PyObject* MainModule = PyImport_AddModule("__main__");
    PyObject* TypesModule = PyImport_ImportModule("types");
    PyObject* TracebackModule = PyImport_ImportModule("traceback");
    bool Ok = BuiltinsModule && MainModule && TypesModule && TracebackModule;
    if (Ok)
    {
        Builtins = PyModule_GetDict(BuiltinsModule);
        Py_XINCREF(Builtins);
        MainDict = PyModule_GetDict(MainModule);
        Py_XINCREF(MainDict);
        NamespaceType = PyObject_GetAttrString(TypesModule, "SimpleNamespace");
        FormatException = PyObject_GetAttrString(TracebackModule, "format_exception");
        FormatExceptionOnly = PyObject_GetAttrString(TracebackModule, "format_exception_only");
        Ok = Builtins && MainDict && NamespaceType && FormatException && FormatExceptionOnly;
    }
    Py_XDECREF(BuiltinsModule);
    Py_XDECREF(TypesModule);
    Py_XDECREF(TracebackModule);
    if (!Ok)
    {
        if (PyErr_Occurred())
        {
            PyErr_Print();
        }
        return false;
    }
    Alive = true;
    return true;
}

FPyCppObject* FCppObjectMapper::GetCppObject(PyObject* Obj) const
{
    if (!Obj || !BaseType || !PyObject_TypeCheck(Obj, BaseType))
    {
        return nullptr;
    }
    FPyCppObject* CppObj = reinterpret_cast<FPyCppObject*>(Obj);
    return CppObj->Mapper == this ? CppObj : nullptr;
}

pesapi_value FCppObjectMapper::Track(PyObject* NewRef)
{
    if (!NewRef)
    {
        return nullptr;
    }
    if (CurrentScope)
    {
        CurrentScope->Values.push_back(NewRef);
    }
    else
    {
        GlobalValues.push_back(NewRef);
    }
    return reinterpret_cast<pesapi_value>(NewRef);
}

void FCppObjectMapper::CatchError()
{
    PyObject* Type = nullptr;
    PyObject* Value = nullptr;
    PyObject* Traceback = nullptr;
    PyErr_Fetch(&Type, &Value, &Traceback);
    if (!Type)
    {
        return;
    }
    PyErr_NormalizeException(&Type, &Value, &Traceback);
    if (Traceback && Value)
    {
        PyException_SetTraceback(Value, Traceback);
    }
    if (CurrentScope)
    {
        CurrentScope->SetCaught(Type, Value, Traceback);
    }
    else
    {
        Py_XDECREF(Type);
        Py_XDECREF(Value);
        Py_XDECREF(Traceback);
    }
}

PyObject* FCppObjectMapper::NewPropDescr(const JSPropertyInfo* PropertyInfo)
{
    FPropDescr* Descr = PyObject_New(FPropDescr, PropDescrType);
    if (!Descr)
    {
        return nullptr;
    }
    Descr->Getter = PropertyInfo->Getter;
    Descr->GetterData = PropertyInfo->GetterData;
    Descr->Setter = PropertyInfo->Setter;
    Descr->SetterData = PropertyInfo->SetterData;
    Descr->Mapper = this;
    Descr->Name = PyUnicode_FromString(PropertyInfo->Name);
    if (!Descr->Name)
    {
        PyErr_Clear();
    }
    return reinterpret_cast<PyObject*>(Descr);
}

// sets Dict[Name] = Value if Dict has no Name (steals Value)
static void SetDefaultItem(PyObject* Dict, const char* Name, PyObject* Value)
{
    if (!Value)
    {
        PyErr_Clear();
        return;
    }
    if (!PyDict_GetItemString(Dict, Name))
    {
        PyDict_SetItemString(Dict, Name, Value);
    }
    Py_DECREF(Value);
}

FClassEntry* FCppObjectMapper::FindOrCreateClass(const JSClassDefinition* ClassDefinition)
{
    auto It = TypeIdToClassMap.find(ClassDefinition->TypeId);
    if (It != TypeIdToClassMap.end())
    {
        return &It->second;
    }
    // a cyclic super chain ends here
    if (Creating.count(ClassDefinition->TypeId))
    {
        return nullptr;
    }
    Creating.insert(ClassDefinition->TypeId);

    PyObject* SuperType = nullptr;
    if (ClassDefinition->SuperTypeId)
    {
        if (auto SuperDefinition = LoadClassByID(Registry, ClassDefinition->SuperTypeId))
        {
            if (FClassEntry* SuperEntry = FindOrCreateClass(SuperDefinition))
            {
                SuperType = SuperEntry->Type;
            }
        }
    }

    PyObject* Dict = PyDict_New();
    if (!Dict)
    {
        Creating.erase(ClassDefinition->TypeId);
        CatchError();
        return nullptr;
    }
    PyObject* ModuleName = PyUnicode_FromString("puerts");
    if (ModuleName)
    {
        PyDict_SetItemString(Dict, "__module__", ModuleName);
        Py_DECREF(ModuleName);
    }

    for (JSFunctionInfo* FunctionInfo = ClassDefinition->Methods; FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback;
         ++FunctionInfo)
    {
        PyObject* Func = NewFunction(FunctionInfo->Callback, FunctionInfo->Data, nullptr, FunctionInfo->Name, true);
        if (!Func)
        {
            PyErr_Clear();
            continue;
        }
        PyObject* Method = PyInstanceMethod_New(Func);
        Py_DECREF(Func);
        if (Method)
        {
            PyDict_SetItemString(Dict, FunctionInfo->Name, Method);
            Py_DECREF(Method);
        }
        else
        {
            PyErr_Clear();
        }
    }

    for (JSPropertyInfo* PropertyInfo = ClassDefinition->Properties; PropertyInfo && PropertyInfo->Name; ++PropertyInfo)
    {
        SetDefaultItem(Dict, PropertyInfo->Name, NewPropDescr(PropertyInfo));
    }

    for (JSFunctionInfo* FunctionInfo = ClassDefinition->Functions; FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback;
         ++FunctionInfo)
    {
        SetDefaultItem(
            Dict, FunctionInfo->Name, NewFunction(FunctionInfo->Callback, FunctionInfo->Data, nullptr, FunctionInfo->Name, false));
    }

    std::unordered_map<std::string, FStaticVar> StaticVars;
    for (JSPropertyInfo* PropertyInfo = ClassDefinition->Variables; PropertyInfo && PropertyInfo->Name; ++PropertyInfo)
    {
        FStaticVar Var;
        Var.Getter = PropertyInfo->Getter;
        Var.GetterData = PropertyInfo->GetterData;
        Var.Setter = PropertyInfo->Setter;
        Var.SetterData = PropertyInfo->SetterData;
        StaticVars[PropertyInfo->Name] = Var;
    }

    const char* ScriptName =
        (ClassDefinition->ScriptName && *ClassDefinition->ScriptName) ? ClassDefinition->ScriptName : "Anonymous";
    // the name of the python class is the short name ("/Script/Engine.Actor" -> "Actor"), a dotted name is not an identifier
    const char* ShortName = ScriptName;
    for (const char* P = ScriptName; *P; ++P)
    {
        if ((*P == '.' || *P == '/') && *(P + 1))
        {
            ShortName = P + 1;
        }
    }
    PyObject* Cls = PyObject_CallFunction(reinterpret_cast<PyObject*>(MetaType), "s(O)O", ShortName,
        SuperType ? SuperType : reinterpret_cast<PyObject*>(BaseType), Dict);
    Py_DECREF(Dict);
    Creating.erase(ClassDefinition->TypeId);
    if (!Cls)
    {
        CatchError();
        return nullptr;
    }

    // the elements of an unordered_map are stable
    FClassEntry& Entry = TypeIdToClassMap[ClassDefinition->TypeId];
    Entry.Type = Cls;
    Entry.ClassDefinition = ClassDefinition;
    Entry.StaticVars = std::move(StaticVars);
    Entry.Mapper = this;
    TypeToEntry()[Cls] = &Entry;

    if (OnClassCreated)
    {
        OnClassCreated(ClassDefinition);
    }
    return &Entry;
}

FClassEntry* FCppObjectMapper::FindOrCreateClassByID(const void* TypeId)
{
    auto It = TypeIdToClassMap.find(TypeId);
    if (It != TypeIdToClassMap.end())
    {
        return &It->second;
    }
    auto ClassDefinition = LoadClassByID(Registry, TypeId);
    if (!ClassDefinition)
    {
        return nullptr;
    }
    return FindOrCreateClass(ClassDefinition);
}

PyObject* FCppObjectMapper::GetClassByID(const void* TypeId)
{
    FClassEntry* Entry = FindOrCreateClassByID(TypeId);
    return Entry ? Entry->Type : nullptr;
}

void FCppObjectMapper::InvalidateClass(const void* TypeId)
{
    if (OnClassInvalidated)
    {
        OnClassInvalidated(TypeId);
    }
    auto It = TypeIdToClassMap.find(TypeId);
    if (It != TypeIdToClassMap.end())
    {
        PyObject* Type = It->second.Type;
        TypeToEntry().erase(Type);
        TypeIdToClassMap.erase(It);
        // the class lives on while its objects are alive
        Py_XDECREF(Type);
    }
}

FPyCppObject* FCppObjectMapper::NewObject(FClassEntry* Entry)
{
    PyTypeObject* Type = reinterpret_cast<PyTypeObject*>(Entry->Type);
    FPyCppObject* Obj = reinterpret_cast<FPyCppObject*>(Type->tp_alloc(Type, 0));
    if (!Obj)
    {
        CatchError();
        return nullptr;
    }
    Obj->Ptr = nullptr;
    Obj->ClassDefinition = Entry->ClassDefinition;
    Obj->TypeId = Entry->ClassDefinition->TypeId;
    Obj->Mapper = this;
    Obj->Owner = nullptr;
    Obj->CallFinalize = false;
    return Obj;
}

PyObject* FCppObjectMapper::PushCppObject(const void* TypeId, void* Ptr, bool PassByPointer)
{
    if (!Ptr)
    {
        Py_RETURN_NONE;
    }

    if (PassByPointer)
    {
        auto Iter = CDataCache.find(Ptr);
        if (Iter != CDataCache.end())
        {
            auto CacheNodePtr = Iter->second.Find(TypeId);
            if (CacheNodePtr && CacheNodePtr->Value)
            {
                PyObject* Cached = static_cast<PyObject*>(CacheNodePtr->Value);
                if (Py_REFCNT(Cached) > 0)
                {
                    Py_INCREF(Cached);
                    return Cached;
                }
                // being deallocated (a weakref callback), the pointer is bound to a new object
                auto It = TypeIdToClassMap.find(TypeId);
                const JSClassDefinition* ClassDefinition =
                    It != TypeIdToClassMap.end() ? It->second.ClassDefinition : FindClassByID(Registry, TypeId);
                if (ClassDefinition)
                {
                    UnBindCppObject(ClassDefinition, Ptr);
                }
            }
        }
    }

    FClassEntry* Entry = FindOrCreateClassByID(TypeId);
    if (Entry)
    {
        FPyCppObject* Obj = NewObject(Entry);
        if (!Obj)
        {
            return nullptr;
        }
        BindCppObject(Entry->ClassDefinition, Ptr, reinterpret_cast<PyObject*>(Obj), PassByPointer);
        return reinterpret_cast<PyObject*>(Obj);
    }

    // a pointer of an unknown class: not cached, not finalized
    Entry = FindOrCreateClass(&PtrClassDef);
    if (!Entry)
    {
        return nullptr;
    }
    FPyCppObject* Obj = NewObject(Entry);
    if (!Obj)
    {
        return nullptr;
    }
    Obj->TypeId = TypeId;
    Obj->Ptr = Ptr;
    Obj->CallFinalize = false;
    return reinterpret_cast<PyObject*>(Obj);
}

bool FCppObjectMapper::IsInstanceOf(const void* TypeId, PyObject* PyObj)
{
    FPyCppObject* Obj = GetCppObject(PyObj);
    if (!Obj)
    {
        return false;
    }
    if (Obj->TypeId == TypeId)
    {
        return true;
    }
    const JSClassDefinition* ClassDefinition = Obj->ClassDefinition;
    for (int i = 0; ClassDefinition && i < MaxSuperDepth; ++i)
    {
        if (ClassDefinition->TypeId == TypeId)
        {
            return true;
        }
        if (!ClassDefinition->SuperTypeId)
        {
            break;
        }
        ClassDefinition = LoadClassByID(Registry, ClassDefinition->SuperTypeId);
    }
    return false;
}

void FCppObjectMapper::BindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr, PyObject* Self, bool PassByPointer)
{
    FPyCppObject* Obj = GetCppObject(Self);
    if (!Obj)
    {
        return;
    }
    Obj->Ptr = Ptr;
    Obj->ClassDefinition = ClassDefinition;
    Obj->TypeId = ClassDefinition->TypeId;
    Obj->CallFinalize = !PassByPointer;

    auto Iter = CDataCache.find(Ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        auto Temp = Iter->second.Find(ClassDefinition->TypeId);
        CacheNodePtr = Temp ? Temp : Iter->second.Add(ClassDefinition->TypeId);
    }
    else
    {
        auto Ret = CDataCache.insert({Ptr, FObjectCacheNode(ClassDefinition->TypeId)});
        CacheNodePtr = &Ret.first->second;
    }
    CacheNodePtr->Value = Self;
    CacheNodePtr->MustCallFinalize = !PassByPointer;

    if (ClassDefinition->OnEnter)
    {
        CacheNodePtr->UserData = ClassDefinition->OnEnter(Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()));
    }
}

void FCppObjectMapper::UnBindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        auto Node = Iter->second.Find(ClassDefinition->TypeId);
        if (!Node)
        {
            return;
        }
        if (ClassDefinition->OnExit)
        {
            ClassDefinition->OnExit(Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()), Node->UserData);
        }
        Iter->second.Remove(ClassDefinition->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(Iter);
        }
    }
}

bool FCppObjectMapper::UnbindNativeObject(const void* TypeId, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter == CDataCache.end())
    {
        return false;
    }
    auto Node = Iter->second.Find(TypeId);
    if (!Node)
    {
        return false;
    }
    // the object stays alive (borrowed by the cache, removed before its dealloc), its dealloc does nothing
    if (FPyCppObject* Obj = GetCppObject(static_cast<PyObject*>(Node->Value)))
    {
        Obj->Ptr = nullptr;
        Obj->CallFinalize = false;
    }
    void* UserData = Node->UserData;
    Iter->second.Remove(TypeId, true);
    if (!Iter->second.TypeId)    // last one
    {
        CDataCache.erase(Iter);
    }
    auto ClassIter = TypeIdToClassMap.find(TypeId);
    const JSClassDefinition* ClassDefinition =
        ClassIter != TypeIdToClassMap.end() ? ClassIter->second.ClassDefinition : FindClassByID(Registry, TypeId);
    if (ClassDefinition && ClassDefinition->OnExit)
    {
        ClassDefinition->OnExit(Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()), UserData);
    }
    return true;
}

void FCppObjectMapper::OnObjectDealloc(FPyCppObject* Obj)
{
    const JSClassDefinition* ClassDefinition = Obj->ClassDefinition;
    void* Ptr = Obj->Ptr;
    Obj->Ptr = nullptr;
    if (!ClassDefinition || ClassDefinition == &PtrClassDef)
    {
        return;
    }
    if (Obj->CallFinalize && ClassDefinition->Finalize)
    {
        ClassDefinition->Finalize(&g_pesapi_ffi, Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()));
    }
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        auto Node = Iter->second.Find(ClassDefinition->TypeId);
        // a newer object of the pointer is not unbound
        if (Node && Node->Value == Obj)
        {
            UnBindCppObject(ClassDefinition, Ptr);
        }
    }
}

void FCppObjectMapper::UnInitialize()
{
    if (!Alive)
    {
        return;
    }
    void* PData = const_cast<void*>(GetEnvPrivate());
    // the objects still alive are detached before any callback runs (their dealloc must not finalize again)
    auto Cache = std::move(CDataCache);
    CDataCache.clear();
    for (auto& KV : Cache)
    {
        for (FObjectCacheNode* PNode = &KV.second; PNode; PNode = PNode->Next)
        {
            if (PNode->Value)
            {
                reinterpret_cast<FPyCppObject*>(PNode->Value)->Ptr = nullptr;
            }
        }
    }
    for (auto& KV : Cache)
    {
        for (FObjectCacheNode* PNode = &KV.second; PNode; PNode = PNode->Next)
        {
            const JSClassDefinition* ClassDefinition = FindClassByID(Registry, PNode->TypeId);
            if (ClassDefinition)
            {
                if (PNode->MustCallFinalize && ClassDefinition->Finalize)
                {
                    ClassDefinition->Finalize(&g_pesapi_ffi, KV.first, ClassDefinition->Data, PData);
                }
                if (ClassDefinition->OnExit)
                {
                    ClassDefinition->OnExit(KV.first, ClassDefinition->Data, PData, PNode->UserData);
                }
            }
        }
    }
    Cache.clear();

    // the functions alive are invalidated (their capsules only release the memory then)
    std::vector<std::pair<pesapi_function_finalize, void*>> Finalizes;
    for (FFuncData* Data : FuncDatas)
    {
        Data->Valid = false;
        if (Data->Finalize)
        {
            Finalizes.emplace_back(Data->Finalize, Data->Data);
        }
    }
    FuncDatas.clear();
    for (auto& Finalize : Finalizes)
    {
        Finalize.first(&g_pesapi_ffi, Finalize.second, PData);
    }

    Alive = false;

    auto& Map = TypeToEntry();
    for (auto& KV : TypeIdToClassMap)
    {
        Map.erase(KV.second.Type);
    }
    auto Classes = std::move(TypeIdToClassMap);
    TypeIdToClassMap.clear();
    for (auto& KV : Classes)
    {
        Py_XDECREF(KV.second.Type);
    }
    Classes.clear();

    auto Values = std::move(GlobalValues);
    GlobalValues.clear();
    for (PyObject* Value : Values)
    {
        Py_XDECREF(Value);
    }

    Py_CLEAR(Builtins);
    Py_CLEAR(MainDict);
    Py_CLEAR(NamespaceType);
    Py_CLEAR(FormatException);
    Py_CLEAR(FormatExceptionOnly);
    Py_CLEAR(BaseType);
    Py_CLEAR(MetaType);
    Py_CLEAR(PropDescrType);

    CurrentScope = nullptr;
    HasPendingError = false;
    PendingError.clear();
    TState = nullptr;

    Ref.reset();
}

}    // namespace pyimpl
}    // namespace PUERTS_NAMESPACE

#endif    // WITH_PYTHON
