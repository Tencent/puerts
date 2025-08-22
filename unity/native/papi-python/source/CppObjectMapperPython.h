#pragma once

#include <Python.h>
#include <unordered_map>
#include <memory>
#include "ScriptClassRegistry.h"

namespace pesapi {
namespace pythonimpl {

// Simple C++ object carrier for Python side
typedef struct {
    void* Ptr;
    const void* TypeId;
    bool NeedDelete;
} CppObject;

// Callback info passed to pesapi callbacks on Python invoke
struct pesapi_callback_info__ {
    PyObject* self;      // holder object (can be nullptr)
    PyObject* args;      // PyTuple of args
    int RetNum;          // unused, for compatibility
    void* Data;          // user data
    PyObject* ret;       // return value set via pesapi_add_return
};

// Forward decl
struct PythonEnv;

class CppObjectMapper {
public:
    CppObjectMapper() = default;

    // Ensure mapper is attached to a module object and return it
    static CppObjectMapper* Get(PyObject* mainModule);

    // Registry wiring and env-private
    inline void SetRegistry(puerts::ScriptClassRegistry* r) { registry = r; }
    inline const void* GetEnvPrivate() const { return envPrivate; }
    inline void SetEnvPrivate(const void* p) { envPrivate = p; }

    // Lifecycle tracker for env_ref
    inline std::weak_ptr<int> GetEnvLifeCycleTracker() { return std::weak_ptr<int>(ref); }

    // Native object mapping
    PyObject* FindOrAddCppObject(PyObject* mainModule, const void* typeId, void* ptr, bool passByPointer);
    bool IsCppObject(PyObject* obj);
    CppObject* GetCppObject(PyObject* obj);

    // Function creation wrapping pesapi_callback
    PyObject* CreateFunction(PyObject* mainModule, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize);

    // Class loading by type id (minimal stub: returns a dict-like type placeholder)
    PyObject* LoadTypeById(PyObject* mainModule, const void* typeId);

    // Binary helpers
    PyObject* CreateBufferByPointer(PyObject* mainModule, unsigned char* ptr, size_t size);
    PyObject* CreateBufferCopy(PyObject* mainModule, const unsigned char* data, size_t size);
    bool IsBuffer(PyObject* obj);
    void* GetBufferData(PyObject* obj, size_t* out_size);

    // Private data attach
    void* GetPrivateData(PyObject* obj) const;
    void SetPrivateData(PyObject* obj, void* ptr);

private:
    // Attach mapper to main module under a hidden attr
    static constexpr const char* kMapperAttr = "__pesapi_mapper__";

    // cache: native ptr -> PyObject* (strong ref)
    std::unordered_map<void*, PyObject*> m_DataCache;

    // private data side map
    std::unordered_map<PyObject*, void*> m_PrivateData;

    // function wrapper Python type
    struct PyPesapiFunctionObject {
        PyObject_HEAD
        pesapi_callback Callback;
        void* Data;
        pesapi_function_finalize Finalize;
        CppObjectMapper* Mapper;
    };

    static PyTypeObject* GetFunctionType();

    puerts::ScriptClassRegistry* registry = nullptr;
    const void* envPrivate = nullptr;
    std::shared_ptr<int> ref = std::make_shared<int>(0);
};

} // namespace pythonimpl
} // namespace pesapi
