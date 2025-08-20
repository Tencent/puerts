#include "CppObjectMapperPython.h"
#include "pesapi.h"

namespace pesapi {
namespace pythonimpl {

static PyObject* CreateCapsule(const void* ptr, const char* name) {
    return PyCapsule_New(const_cast<void*>(ptr), name, nullptr);
}

// Python function object type
static PyObject* PyPesapiFunction_call(PyObject* self, PyObject* args, PyObject* kwargs) {
    auto* fn = reinterpret_cast<CppObjectMapper::PyPesapiFunctionObject*>(self);
    if (!fn->Callback) {
        Py_RETURN_NONE;
    }
    pesapi_callback_info__ info{};
    info.self = nullptr;
    info.args = args;
    info.RetNum = 0;
    info.Data = fn->Data;
    info.ret = nullptr;

    fn->Callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&info));
    if (info.ret) {
        PyObject* r = info.ret;
        info.ret = nullptr;
        return r; // transfer ownership
    }
    Py_RETURN_NONE;
}

static void PyPesapiFunction_dealloc(PyObject* self) {
    auto* fn = reinterpret_cast<CppObjectMapper::PyPesapiFunctionObject*>(self);
    if (fn->Finalize) {
        fn->Finalize(&g_pesapi_ffi, fn->Data, const_cast<void*>(fn->Mapper->GetEnvPrivate()));
    }
    Py_TYPE(self)->tp_free(self);
}

PyTypeObject* CppObjectMapper::GetFunctionType() {
    static PyTypeObject type = {
        PyVarObject_HEAD_INIT(nullptr, 0)
    };
    static bool inited = false;
    if (!inited) {
        type.tp_name = "pesapi.Function";
        type.tp_basicsize = sizeof(CppObjectMapper::PyPesapiFunctionObject);
        type.tp_flags = Py_TPFLAGS_DEFAULT;
        type.tp_call = PyPesapiFunction_call;
        type.tp_dealloc = PyPesapiFunction_dealloc;
        type.tp_new = PyType_GenericNew;
        if (PyType_Ready(&type) < 0) return nullptr;
        inited = true;
    }
    return &type;
}

CppObjectMapper* CppObjectMapper::Get(PyObject* mainModule) {
    if (!mainModule) return nullptr;
    PyObject* attr = PyObject_GetAttrString(mainModule, kMapperAttr);
    if (attr && PyCapsule_CheckExact(attr)) {
        auto* mapper = reinterpret_cast<CppObjectMapper*>(PyCapsule_GetPointer(attr, nullptr));
        Py_DECREF(attr);
        if (mapper) return mapper;
    }
    Py_XDECREF(attr);
    // create and attach
    auto* mapper = new CppObjectMapper();
    PyObject* cap = CreateCapsule(mapper, "pesapi.mapper");
    PyObject_SetAttrString(mainModule, kMapperAttr, cap);
    Py_DECREF(cap);
    return mapper;
}

PyObject* CppObjectMapper::FindOrAddCppObject(PyObject* mainModule, const void* typeId, void* ptr, bool passByPointer) {
    if (!ptr) { Py_RETURN_NONE; }
    if (passByPointer) {
        auto it = m_DataCache.find(ptr);
        if (it != m_DataCache.end()) {
            Py_INCREF(it->second);
            return it->second;
        }
    }
    // Create a simple PyCapsule or custom PyObject to hold C++ object
    PyObject* holder = PyCapsule_New(ptr, "pesapi.native", nullptr);
    // Attach dict to hold meta: typeid, deletable flag
    PyObject* meta = PyDict_New();
    PyDict_SetItemString(meta, "type_id", PyLong_FromUnsignedLongLong((unsigned long long)(uintptr_t)typeId));
    PyDict_SetItemString(meta, "need_delete", passByPointer ? Py_False : Py_True);
    // Store meta on capsule via attribute dict by setting __dict__ is not supported; instead keep cache map
    m_DataCache[ptr] = holder;
    Py_INCREF(holder);
    Py_DECREF(meta);
    return holder;
}

bool CppObjectMapper::IsCppObject(PyObject* obj) {
    return obj && PyCapsule_CheckExact(obj) && strcmp(PyCapsule_GetName(obj), "pesapi.native") == 0;
}

CppObject* CppObjectMapper::GetCppObject(PyObject* obj) {
    if (!IsCppObject(obj)) return nullptr;
    static thread_local CppObject tmp; // ephemeral
    tmp.Ptr = PyCapsule_GetPointer(obj, "pesapi.native");
    tmp.TypeId = nullptr; // unknown here
    tmp.NeedDelete = false;
    return &tmp;
}

PyObject* CppObjectMapper::CreateFunction(PyObject* mainModule, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize) {
    PyTypeObject* tp = GetFunctionType();
    if (!tp) { Py_RETURN_NONE; }
    auto* obj = reinterpret_cast<PyPesapiFunctionObject*>(tp->tp_alloc(tp, 0));
    obj->Callback = Callback;
    obj->Data = Data;
    obj->Finalize = Finalize;
    obj->Mapper = this;
    return reinterpret_cast<PyObject*>(obj);
}

PyObject* CppObjectMapper::LoadTypeById(PyObject* mainModule, const void* typeId) {
    // Minimal: return a new empty dict representing the class placeholder
    return PyDict_New();
}

PyObject* CppObjectMapper::CreateBufferByPointer(PyObject* mainModule, unsigned char* ptr, size_t size) {
    // Use Python memoryview from a PyCapsule with a Python-side read-write bytearray fallback
    PyObject* capsule = PyCapsule_New(ptr, "pesapi.buffer", nullptr);
    PyObject* mv = PyMemoryView_FromMemory(reinterpret_cast<char*>(ptr), (Py_ssize_t)size, PyBUF_WRITE);
    // keep capsule alive by setting on memoryview's obj attr? Not possible; instead, return capsule
    return capsule; // caller will treat as binary via IsBuffer/GetBufferData
}

PyObject* CppObjectMapper::CreateBufferCopy(PyObject* mainModule, const unsigned char* data, size_t size) {
    PyObject* bytes = PyBytes_FromStringAndSize(reinterpret_cast<const char*>(data), (Py_ssize_t)size);
    return bytes;
}

bool CppObjectMapper::IsBuffer(PyObject* obj) {
    if (!obj) return false;
    return PyBytes_Check(obj) || (PyCapsule_CheckExact(obj) && strcmp(PyCapsule_GetName(obj), "pesapi.buffer") == 0);
}

void* CppObjectMapper::GetBufferData(PyObject* obj, size_t* out_size) {
    if (PyBytes_Check(obj)) {
        char* buf; Py_ssize_t sz;
        if (PyBytes_AsStringAndSize(obj, &buf, &sz) == 0) {
            if (out_size) *out_size = (size_t)sz;
            return buf;
        }
    }
    if (PyCapsule_CheckExact(obj) && strcmp(PyCapsule_GetName(obj), "pesapi.buffer") == 0) {
        void* p = PyCapsule_GetPointer(obj, "pesapi.buffer");
        if (out_size) { /* unknown */ }
        return p;
    }
    return nullptr;
}

void* CppObjectMapper::GetPrivateData(PyObject* obj) const {
    auto it = m_PrivateData.find(obj);
    if (it == m_PrivateData.end()) return nullptr;
    return it->second;
}

void CppObjectMapper::SetPrivateData(PyObject* obj, void* ptr) {
    m_PrivateData[obj] = ptr;
}

} // namespace pythonimpl
} // namespace pesapi
