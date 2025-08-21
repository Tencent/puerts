#pragma once
#include "pesapi.h"
#include "TypeRegistry.h"
#include <Python.h>
#include <map>
#include <mutex>
extern pesapi_ffi g_pesapi_ffi;

struct ScopeData
{
    PyObject* exception;    // �洢�������ڵ��쳣
};


struct NativeObject
{
    PyObject_HEAD const void* type_id;    // C++����ID
    void* object_ptr;                     // C++����ָ��
    bool call_finalize;                   // �Ƿ���Ҫ���ͷ�ʱ����C++�����߼�
};

// �Զ������͵������������ͷ�C++����
static void NativeObject_dealloc(NativeObject* self)
{
    if (self->call_finalize && self->object_ptr && self->type_id)
    {
        // ��ȫ��ע����ȡ������Ϣ
        TypeInfo* type_info = g_type_registry.GetTypeInfo(self->type_id);
        if (type_info && type_info->finalizer)
        {
            // ����ע������������ͷ�C++����
            type_info->finalizer(&g_pesapi_ffi, self->object_ptr, type_info->class_data, nullptr);
        }
        self->object_ptr = nullptr;    // �����ظ��ͷ�
    }
    Py_TYPE(self)->tp_free((PyObject*) self);    // �ͷ�Python������
}
struct ValueRef
{
    pesapi_value value;
    void** internal_fields;
    uint32_t internal_field_count;    // ��¼�ڲ��ֶ����������ڸ��ƺ��ͷ�
};
struct pesapi_callback_info__
{
    PyObject* L;            // Python ��ǰģ�������ռ䣨���߳�״̬��
    int ArgStart;           // ������ʼ�������̶�Ϊ 0��
    int RetNum;             // ����ֵ�������̶�Ϊ 1��
    void* Data;             // �û�����
    PyObject* args;         // Python ����Ԫ��
    PyObject* self;         // Python �� this���� self��
    PyObject* result;       // ����ֵ
    PyObject* exception;    // �쳣����
};
// �Զ������͵����Ͷ���
static PyTypeObject NativeObjectType = {
    PyVarObject_HEAD_INIT(nullptr, 0).tp_name = "puerts.NativeObject",
    .tp_basicsize = sizeof(NativeObject),
    .tp_dealloc = (destructor) NativeObject_dealloc,
    .tp_flags = Py_TPFLAGS_DEFAULT,
};

struct CppObjectMapper
{
    static CppObjectMapper* Get(PyObject* module);

    PyObject* CreateFunction(pesapi_callback callback, void* data, pesapi_function_finalize finalize);
    PyObject* FindOrCreateClassByID(const void* type_id);
    PyObject* PushNativeObject(const void* type_id, void* object_ptr, bool call_finalize);

    void BindAndAddToCache(const void* type_info, const void* ptr, PyObject* value, bool call_finalize);
    void RemoveFromCache(const void* type_info, const void* ptr);

private:
    std::map<const void*, PyObject*> type_cache_;
    std::map<std::pair<const void*, const void*>, PyObject*> object_cache_;
};

// ȫ��ӳ�������棺ģ�� -> ӳ����ʵ��
static std::map<PyObject*, CppObjectMapper*> s_mappers;
static std::mutex s_mapper_mutex;

