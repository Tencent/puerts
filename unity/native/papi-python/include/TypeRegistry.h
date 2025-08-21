#pragma once
#include "pesapi.h"
#include <map>
#include <mutex>
#include <vector>
#include <string>

// 补充pesapi.h中不透明结构体的具体定义
struct pesapi_type_info__
{
    std::string name;     // 类型名称
    bool is_pointer;      // 是否为指针类型
    bool is_const;        // 是否为const类型
    bool is_ref;          // 是否为引用类型
    bool is_primitive;    // 是否为基本类型
};

struct pesapi_signature_info__
{
    pesapi_type_info return_type;     // 返回值类型
    size_t param_count;               // 参数数量
    pesapi_type_info* param_types;    // 参数类型数组
};

// 扩展TypeInfo结构体，存储更多类元数据
struct TypeInfo
{
    const void* type_id;               // 类型唯一标识
    const void* super_type_id;         // 父类型ID
    pesapi_constructor constructor;    // 构造函数
    pesapi_finalize finalizer;         // 析构函数
    void* class_data;                  // 类关联数据
    std::string module_name;           // 模块名
    std::string type_name;             // 类型名

    // 新增：类成员信息
    int method_count = 0;      // 方法数量
    int function_count = 0;    // 函数数量
    int property_count = 0;    // 属性数量
    int variable_count = 0;    // 变量数量

    // 方法表：存储方法信息
    std::vector<struct MethodInfo> methods;
    // 属性表：存储属性信息
    std::vector<struct PropertyInfo> properties;

    // 生命周期跟踪回调
    pesapi_on_native_object_enter on_enter = nullptr;
    pesapi_on_native_object_exit on_exit = nullptr;

    // 类未找到回调
    pesapi_class_not_found_callback class_not_found_cb = nullptr;
};

// 方法信息结构体
struct MethodInfo
{
    std::string name;
    bool is_static;
    pesapi_callback method;
    void* data;
};

// 属性信息结构体
struct PropertyInfo
{
    std::string name;
    bool is_static;
    pesapi_callback getter;
    pesapi_callback setter;
    void* getter_data;
    void* setter_data;
};

// 全局类型注册表（线程安全）
class TypeRegistry
{
private:
    std::map<const void*, TypeInfo> type_map_;                                 // type_id -> 类型信息
    std::map<std::pair<std::string, std::string>, const void*> name_to_id_;    // (模块名, 类型名) -> type_id
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

    // 通过type_id获取类型信息
    TypeInfo* GetTypeInfo(const void* type_id)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        return (it != type_map_.end()) ? &it->second : nullptr;
    }

    // 通过模块名和类型名查找type_id（对应pesapi_registry_api::find_type_id）
    const void* FindTypeId(const std::string& module_name, const std::string& type_name)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = name_to_id_.find({module_name, type_name});
        return (it != name_to_id_.end()) ? it->second : nullptr;
    }

    // 检查类型是否为目标类型或其子类型（支持继承链检查）
    bool IsInstanceOf(const void* target_type_id, const void* actual_type_id)
    {
        if (target_type_id == actual_type_id)
            return true;
        TypeInfo* info = GetTypeInfo(actual_type_id);
        while (info && info->super_type_id)
        {    // 遍历父类型链
            if (info->super_type_id == target_type_id)
                return true;
            info = GetTypeInfo(info->super_type_id);
        }
        return false;
    }

    // 设置类的成员数量（方法/函数/属性/变量）
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
            // 预分配空间
            it->second.methods.reserve(method_count);
            it->second.properties.reserve(property_count);
        }
    }

    // 添加方法信息
    void AddMethodInfo(const void* type_id, const MethodInfo& method)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        if (it != type_map_.end() && it->second.methods.size() < it->second.method_count)
        {
            it->second.methods.push_back(method);
        }
    }

    // 添加属性信息
    void AddPropertyInfo(const void* type_id, const PropertyInfo& prop)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = type_map_.find(type_id);
        if (it != type_map_.end() && it->second.properties.size() < it->second.property_count)
        {
            it->second.properties.push_back(prop);
        }
    }

    // 设置类未找到回调
    void SetClassNotFoundCallback(pesapi_registry registry, pesapi_class_not_found_callback cb)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& entry : type_map_)
        {
            entry.second.class_not_found_cb = cb;
        }
    }

    // 跟踪对象生命周期
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



// 全局注册表实例
static TypeRegistry g_type_registry;