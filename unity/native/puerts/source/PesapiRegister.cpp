/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
 
#include "pesapi.h"
#include "TypeInfo.hpp"
#include "PString.h"
#include "ScriptClassRegistry.h"
#include <string.h>
#include <EASTL/vector.h>
#include <EASTL/allocator_malloc.h>

namespace pesapi
{
namespace regimpl
{

struct pesapi_type_info__
{
    const char* name;
    int is_pointer;
    int is_const;
    int is_ref;
    int is_primitive;
};

struct pesapi_signature_info__
{
    pesapi_type_info return_type;
    size_t parameter_count;
    pesapi_type_info parameter_types;
};

struct pesapi_property_descriptor__
{
    const char* name;
    int is_static;
    pesapi_callback method;
    pesapi_callback getter;
    pesapi_callback setter;
    void* data0;
    void* data1;

    union
    {
        pesapi_type_info__* type_info;
        pesapi_signature_info__* signature_info;
    } info;
};

pesapi_registry pesapi_create_registry()
{
    return reinterpret_cast<pesapi_registry>(puerts::CreateRegistry());
}

pesapi_type_info pesapi_alloc_type_infos(size_t count)
{
    auto ret = static_cast<pesapi_type_info__*>(malloc(sizeof(pesapi_type_info__) * count));
    memset(ret, 0, sizeof(pesapi_type_info__) * count);
    return reinterpret_cast<pesapi_type_info>(ret);
}

void pesapi_set_type_info(
    pesapi_type_info type_infos, size_t index, const char* name, int is_pointer, int is_const, int is_ref, int is_primitive)
{
    reinterpret_cast<pesapi_type_info__*>(type_infos)[index] = {name, is_pointer, is_const, is_ref, is_primitive};
}

pesapi_signature_info pesapi_create_signature_info(
    pesapi_type_info return_type, size_t parameter_count, pesapi_type_info parameter_types)
{
    auto info = static_cast<pesapi_signature_info__*>(malloc(sizeof(pesapi_signature_info__)));
    memset(info, 0, sizeof(pesapi_signature_info__));
    info->return_type = return_type;
    info->parameter_count = parameter_count;
    info->parameter_types = parameter_types;
    return reinterpret_cast<pesapi_signature_info>(info);
}

const char * str_dup(const char* str)
{
    if (str == nullptr)
    {
        return nullptr;
    }
    auto len = strlen(str);
    auto ret = (char*)malloc(len + 1);
    memcpy(ret, str, len + 1);
    return ret;
}

// set module name here during loading, set nullptr after module loaded
const char* GPesapiModuleName = nullptr;

void pesapi_define_class(pesapi_registry registry, const void* type_id, const void* super_type_id, const char* module_name, const char* type_name, pesapi_constructor constructor,
    pesapi_finalize finalize, void* data, int copy_str, int trace_lifecycle)
{
    puerts::ScriptClassDefinition classDef = ScriptClassEmptyDefinition;
    classDef.TypeId = type_id;
    classDef.SuperTypeId = super_type_id;
    puerts::PString ScriptNameWithModuleName = GPesapiModuleName == nullptr ? puerts::PString() : GPesapiModuleName;
    if (GPesapiModuleName)
    {
        ScriptNameWithModuleName += ".";
        ScriptNameWithModuleName += type_name;
        classDef.ScriptName = ScriptNameWithModuleName.c_str();
    }
    else
    {
        classDef.ScriptName = copy_str ? str_dup(type_name) : type_name;
    }
    classDef.Data = data;

    classDef.Initialize = constructor;
    classDef.Finalize = finalize;
    classDef.TraceLifecycle = trace_lifecycle;

    puerts::RegisterScriptClass(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), classDef);
}

void pesapi_set_property_info_size(pesapi_registry registry, const void* type_id, int method_count, int function_count, int property_count, int variable_count)
{
    puerts::ScriptClassDefinition* classDef = const_cast<puerts::ScriptClassDefinition*>(puerts::FindClassByID(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), type_id));
    if (classDef)
    {
        classDef->Methods = (puerts::ScriptFunctionInfo*)malloc((method_count + 1) * sizeof(puerts::ScriptFunctionInfo));
        memset(classDef->Methods, 0, (method_count + 1) * sizeof(puerts::ScriptFunctionInfo));
        classDef->Functions = (puerts::ScriptFunctionInfo*)malloc((function_count + 1) * sizeof(puerts::ScriptFunctionInfo));
        memset(classDef->Functions, 0, (function_count + 1) * sizeof(puerts::ScriptFunctionInfo));
        classDef->Properties = (puerts::ScriptPropertyInfo*)malloc((property_count + 1) * sizeof(puerts::ScriptPropertyInfo));
        memset(classDef->Properties, 0, (property_count + 1) * sizeof(puerts::ScriptPropertyInfo));
        classDef->Variables = (puerts::ScriptPropertyInfo*)malloc((variable_count + 1) * sizeof(puerts::ScriptPropertyInfo));
        memset(classDef->Variables, 0, (variable_count + 1) * sizeof(puerts::ScriptPropertyInfo));
    }
}

void pesapi_set_method_info(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static,
    pesapi_callback method, void* data, int copy_str)
{
    const puerts::ScriptClassDefinition* classDef = puerts::FindClassByID(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), type_id);
    if (classDef)
    {
        if (is_static)
        {
            classDef->Functions[index] = {copy_str ? str_dup(name) : name, method, data};
        }
        else
        {
            classDef->Methods[index] = {copy_str ? str_dup(name) : name, method, data};
        }
    }
}

void pesapi_set_property_info(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static,
    pesapi_callback getter, pesapi_callback setter, void* getter_data, void* setter_data, int copy_str)
{
    const puerts::ScriptClassDefinition* classDef = puerts::FindClassByID(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), type_id);
    if (classDef)
    {
        if (is_static)
        {
            classDef->Variables[index] = {copy_str ? str_dup(name) : name, getter, setter, getter_data, setter_data};
        }
        else
        {
            classDef->Properties[index] = {copy_str ? str_dup(name) : name, getter, setter, getter_data, setter_data};
        }
    }
}

void* pesapi_get_class_data(pesapi_registry _registry, const void* type_id, int force_load)
{
    auto registry = reinterpret_cast<puerts::ScriptClassRegistry*>(_registry);
    auto clsDef = force_load ? puerts::LoadClassByID(registry, type_id) : puerts::FindClassByID(registry, type_id);
    return clsDef ? clsDef->Data : nullptr;
}

void pesapi_on_class_not_found(pesapi_registry registry, pesapi_class_not_found_callback callback)
{
    puerts::OnClassNotFound(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), callback);
}

void pesapi_class_type_info(pesapi_registry registry, const char* proto_magic_id, const void* type_id, const void* constructor_info, const void* methods_info,
    const void* functions_info, const void* properties_info, const void* variables_info)
{
    if (strcmp(proto_magic_id, PUERTS_BINDING_PROTO_ID()) != 0)
    {
        return;
    }

    puerts::SetClassTypeInfo(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), type_id, static_cast<const puerts::NamedFunctionInfo*>(constructor_info),
        static_cast<const puerts::NamedFunctionInfo*>(methods_info), static_cast<const puerts::NamedFunctionInfo*>(functions_info),
        static_cast<const puerts::NamedPropertyInfo*>(properties_info),
        static_cast<const puerts::NamedPropertyInfo*>(variables_info));
}

const void* pesapi_find_type_id(pesapi_registry registry, const char* module_name, const char* type_name)
{
    puerts::PString fullname = module_name;
    fullname += ".";
    fullname += type_name;
    const auto class_def = puerts::FindCppTypeClassByName(reinterpret_cast<puerts::ScriptClassRegistry*>(registry), fullname);
    return class_def ? class_def->TypeId : nullptr;
}

pesapi_registry_api g_reg_apis = {
    pesapi_create_registry,
    pesapi_alloc_type_infos,
    pesapi_set_type_info,
    pesapi_create_signature_info,
    pesapi_define_class,
    pesapi_set_property_info_size,
    pesapi_set_method_info,
    pesapi_set_property_info,
    pesapi_get_class_data,
    pesapi_on_class_not_found,
    pesapi_class_type_info,
    pesapi_find_type_id
};

}    // namespace regimpl
}    // namespace pesapi
