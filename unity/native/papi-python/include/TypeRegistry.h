#pragma once
#include "pesapi.h"
#include <map>
#include <mutex>
#include <vector>
#include <string>

// ����pesapi.h�в�͸���ṹ��ľ��嶨��
struct pesapi_type_info__
{
    std::string name;     // ��������
    bool is_pointer;      // �Ƿ�Ϊָ������
    bool is_const;        // �Ƿ�Ϊconst����
    bool is_ref;          // �Ƿ�Ϊ��������
    bool is_primitive;    // �Ƿ�Ϊ��������
};

struct pesapi_signature_info__
{
    pesapi_type_info return_type;     // ����ֵ����
    size_t param_count;               // ��������
    pesapi_type_info* param_types;    // ������������
};

// ��չTypeInfo�ṹ�壬�洢������Ԫ����
struct TypeInfo
{
    const void* type_id;               // ����Ψһ��ʶ
    const void* super_type_id;         // ������ID
    pesapi_constructor constructor;    // ���캯��
    pesapi_finalize finalizer;         // ��������
    void* class_data;                  // ���������
    std::string module_name;           // ģ����
    std::string type_name;             // ������

    // ���������Ա��Ϣ
    int method_count = 0;      // ��������
    int function_count = 0;    // ��������
    int property_count = 0;    // ��������
    int variable_count = 0;    // ��������

    // �������洢������Ϣ
    std::vector<struct MethodInfo> methods;
    // ���Ա��洢������Ϣ
    std::vector<struct PropertyInfo> properties;

    // �������ڸ��ٻص�
    pesapi_on_native_object_enter on_enter = nullptr;
    pesapi_on_native_object_exit on_exit = nullptr;

    // ��δ�ҵ��ص�
    pesapi_class_not_found_callback class_not_found_cb = nullptr;
};

// ������Ϣ�ṹ��
struct MethodInfo
{
    std::string name;
    bool is_static;
    pesapi_callback method;
    void* data;
};

// ������Ϣ�ṹ��
struct PropertyInfo
{
    std::string name;
    bool is_static;
    pesapi_callback getter;
    pesapi_callback setter;
    void* getter_data;
    void* setter_data;
};

// ȫ������ע����̰߳�ȫ��
class TypeRegistry
{
private:
    std::map<const void*, TypeInfo> type_map_;                                 // type_id -> ������Ϣ
    std::map<std::pair<std::string, std::string>, const void*> name_to_id_;    // (ģ����, ������) -> type_id
    std::mutex mutex_;

public:
    void DefineClass(const void* type_id, const void* super_type_id, const char* module_name, const char* type_name,
        pesapi_finalize finalizer, void* class_data)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        TypeInfo info;
        info.type_id = type_id;
        info.super_type_id = super_type_id;
        info.finalizer = finalizer;
        info.class_data = class_data;
        info.module_name = module_name;
        info.type_name = type_name;
        type_map_[type_id] = info;
        name_to_id_[{module_name, type_name}] = type_id;
    }

    // ͨ��type_id��ȡ������Ϣ
    TypeInfo* GetTypeInfo(const void* type_id)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        return (it != type_map_.end()) ? &it->second : nullptr;
    }

    // ͨ��ģ����������������type_id����Ӧpesapi_registry_api::find_type_id��
    const void* FindTypeId(const std::string& module_name, const std::string& type_name)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = name_to_id_.find({module_name, type_name});
        return (it != name_to_id_.end()) ? it->second : nullptr;
    }

    // ��������Ƿ�ΪĿ�����ͻ��������ͣ�֧�ּ̳�����飩
    bool IsInstanceOf(const void* target_type_id, const void* actual_type_id)
    {
        if (target_type_id == actual_type_id)
            return true;
        TypeInfo* info = GetTypeInfo(actual_type_id);
        while (info && info->super_type_id)
        {    // ������������
            if (info->super_type_id == target_type_id)
                return true;
            info = GetTypeInfo(info->super_type_id);
        }
        return false;
    }

    // ������ĳ�Ա����������/����/����/������
    void SetPropertyInfoSize(const void* type_id, int method_count, int function_count, int property_count, int variable_count)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        if (it != type_map_.end())
        {
            it->second.method_count = method_count;
            it->second.function_count = function_count;
            it->second.property_count = property_count;
            it->second.variable_count = variable_count;
            // Ԥ����ռ�
            it->second.methods.reserve(method_count);
            it->second.properties.reserve(property_count);
        }
    }

    // ��ӷ�����Ϣ
    void AddMethodInfo(const void* type_id, const MethodInfo& method)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        if (it != type_map_.end() && it->second.methods.size() < it->second.method_count)
        {
            it->second.methods.push_back(method);
        }
    }

    // ���������Ϣ
    void AddPropertyInfo(const void* type_id, const PropertyInfo& prop)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        if (it != type_map_.end() && it->second.properties.size() < it->second.property_count)
        {
            it->second.properties.push_back(prop);
        }
    }

    // ������δ�ҵ��ص�
    void SetClassNotFoundCallback(pesapi_registry registry, pesapi_class_not_found_callback cb)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& entry : type_map_)
        {
            entry.second.class_not_found_cb = cb;
        }
    }

    // ���ٶ�����������
    int TraceNativeObjectLifecycle(
        const void* type_id, pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        if (it == type_map_.end())
            return 0;
        it->second.on_enter = on_enter;
        it->second.on_exit = on_exit;
        return 1;
    }
};



// ȫ��ע���ʵ��
static TypeRegistry g_type_registry;