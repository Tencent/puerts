/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#ifndef WITH_QUICKJS

#include "pesapi.h"
#include "JSClassRegister.h"
#include "TypeInfo.hpp"
#include "PString.h"
#include "PesapiImpl.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include <cstring>
#include <cstdlib>
#include <cstddef>

namespace pesapi
{
namespace regimpl
{
#define PESAPI_REG_CONTAINER_OF(ptr, type, member) ((type*) ((char*) (ptr) -offsetof(type, member)))

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))

// trampolines: v8 native callback -> pesapi callback (inject pesapi_ffi)
static void PesapiRegMethodWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto FunctionInfo =
        PESAPI_REG_CONTAINER_OF(v8::Local<v8::External>::Cast(Info.Data())->Value(), PUERTS_NAMESPACE::JSFunctionInfo, Data);
    FunctionInfo->PesapiCallback(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info));
}

static void PesapiRegGetterWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto PropertyInfo =
        PESAPI_REG_CONTAINER_OF(v8::Local<v8::External>::Cast(Info.Data())->Value(), PUERTS_NAMESPACE::JSPropertyInfo, GetterData);
    PropertyInfo->PesapiGetter(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info));
}

static void PesapiRegSetterWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto PropertyInfo =
        PESAPI_REG_CONTAINER_OF(v8::Local<v8::External>::Cast(Info.Data())->Value(), PUERTS_NAMESPACE::JSPropertyInfo, SetterData);
    PropertyInfo->PesapiSetter(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info));
}

static void* PesapiRegInitializeWrap(pesapi_callback_info PInfo)
{
    auto Info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(PInfo);
    auto ClassDefinition =
        PESAPI_REG_CONTAINER_OF(v8::Local<v8::External>::Cast(Info->Data())->Value(), PUERTS_NAMESPACE::JSClassDefinition, Data);
    if (!ClassDefinition->PesapiInitialize)
    {
        return nullptr;
    }
    return ClassDefinition->PesapiInitialize(&v8impl::g_pesapi_ffi, PInfo);
}

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

pesapi_registry GetDefaultRegistry()
{
    return reinterpret_cast<pesapi_registry>(PUERTS_NAMESPACE::GetDefaultClassRegistry());
}

// a pesapi_registry is a ScriptClassRegistry*, nullptr means the default registry
static PUERTS_NAMESPACE::ScriptClassRegistry* ToRegistry(pesapi_registry registry)
{
    return registry ? reinterpret_cast<PUERTS_NAMESPACE::ScriptClassRegistry*>(registry)
                    : PUERTS_NAMESPACE::GetDefaultClassRegistry();
}

static pesapi_registry pesapi_create_registry()
{
    return reinterpret_cast<pesapi_registry>(PUERTS_NAMESPACE::CreateRegistry());
}

static pesapi_type_info pesapi_alloc_type_infos(size_t count)
{
    auto ret = static_cast<pesapi_type_info__*>(malloc(sizeof(pesapi_type_info__) * count));
    memset(ret, 0, sizeof(pesapi_type_info__) * count);
    return reinterpret_cast<pesapi_type_info>(ret);
}

static void pesapi_set_type_info(
    pesapi_type_info type_infos, size_t index, const char* name, int is_pointer, int is_const, int is_ref, int is_primitive)
{
    reinterpret_cast<pesapi_type_info__*>(type_infos)[index] = {name, is_pointer, is_const, is_ref, is_primitive};
}

static pesapi_signature_info pesapi_create_signature_info(
    pesapi_type_info return_type, size_t parameter_count, pesapi_type_info parameter_types)
{
    auto info = static_cast<pesapi_signature_info__*>(malloc(sizeof(pesapi_signature_info__)));
    memset(info, 0, sizeof(pesapi_signature_info__));
    info->return_type = return_type;
    info->parameter_count = parameter_count;
    info->parameter_types = parameter_types;
    return reinterpret_cast<pesapi_signature_info>(info);
}

static const char* pesapi_reg_str_dup(const char* str)
{
    if (str == nullptr)
    {
        return nullptr;
    }
    auto len = strlen(str);
    auto ret = (char*) malloc(len + 1);
    memcpy(ret, str, len + 1);
    return ret;
}

const char* GPesapiModuleName = nullptr;

static void pesapi_define_class(pesapi_registry registry, const void* type_id, const void* super_type_id, const char* module_name,
    const char* type_name, pesapi_constructor constructor, pesapi_finalize finalize, void* data, int copy_str)
{
    PUERTS_NAMESPACE::JSClassDefinition classDef = JSClassEmptyDefinition;
    classDef.TypeId = type_id;
    classDef.SuperTypeId = super_type_id;

    const char* prefix = GPesapiModuleName ? GPesapiModuleName : module_name;
    // ScriptName will point to the key stored in class registry after RegisterScriptClass, so a temporary string is safe here
    PUERTS_NAMESPACE::PString ScriptNameWithModuleName;
    if (prefix && prefix[0] != '\0')
    {
        ScriptNameWithModuleName = prefix;
        ScriptNameWithModuleName += ".";
        ScriptNameWithModuleName += type_name;
        classDef.ScriptName = ScriptNameWithModuleName.c_str();
    }
    else
    {
        classDef.ScriptName = copy_str ? pesapi_reg_str_dup(type_name) : type_name;
    }
    classDef.Data = data;

    classDef.Initialize = constructor ? &PesapiRegInitializeWrap : nullptr;
    classDef.Finalize = nullptr;
    classDef.PesapiInitialize = constructor;
    classDef.PesapiFinalize = finalize;
    classDef.PesapiApis = &v8impl::g_pesapi_ffi;

    PUERTS_NAMESPACE::RegisterScriptClass(ToRegistry(registry), classDef);
}

template <typename T>
static T* PesapiRegAllocInfos(int count)
{
    // terminated by an element with Name == nullptr, must be allocated by new[] (released by delete[] in ScriptClassRegistry)
    return new T[count + 1];
}

static void pesapi_set_property_info_size(
    pesapi_registry registry, const void* type_id, int method_count, int function_count, int property_count, int variable_count)
{
    auto classDef =
        const_cast<PUERTS_NAMESPACE::JSClassDefinition*>(PUERTS_NAMESPACE::FindClassByID(ToRegistry(registry), type_id));
    if (classDef)
    {
        delete[] classDef->Methods;
        delete[] classDef->Functions;
        delete[] classDef->Properties;
        delete[] classDef->Variables;
        classDef->Methods = PesapiRegAllocInfos<PUERTS_NAMESPACE::JSFunctionInfo>(method_count);
        classDef->Functions = PesapiRegAllocInfos<PUERTS_NAMESPACE::JSFunctionInfo>(function_count);
        classDef->Properties = PesapiRegAllocInfos<PUERTS_NAMESPACE::JSPropertyInfo>(property_count);
        classDef->Variables = PesapiRegAllocInfos<PUERTS_NAMESPACE::JSPropertyInfo>(variable_count);
    }
}

static void pesapi_set_method_info(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static,
    pesapi_callback method, void* data, int copy_str)
{
    auto classDef = PUERTS_NAMESPACE::FindClassByID(ToRegistry(registry), type_id);
    if (classDef)
    {
        PUERTS_NAMESPACE::JSFunctionInfo* infos = is_static ? classDef->Functions : classDef->Methods;
        if (!infos)
        {
            return;
        }
        PUERTS_NAMESPACE::JSFunctionInfo& info = infos[index];
        info.Name = copy_str ? pesapi_reg_str_dup(name) : name;
        info.Callback = reinterpret_cast<PUERTS_NAMESPACE::JSFunctionCallback>(&PesapiRegMethodWrap);
        info.Data = data;
        info.ReflectionInfo = nullptr;
        info.PesapiCallback = method;
    }
}

static void pesapi_set_property_info(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static,
    pesapi_callback getter, pesapi_callback setter, void* getter_data, void* setter_data, int copy_str)
{
    auto classDef = PUERTS_NAMESPACE::FindClassByID(ToRegistry(registry), type_id);
    if (classDef)
    {
        PUERTS_NAMESPACE::JSPropertyInfo* infos = is_static ? classDef->Variables : classDef->Properties;
        if (!infos)
        {
            return;
        }
        PUERTS_NAMESPACE::JSPropertyInfo& info = infos[index];
        info.Name = copy_str ? pesapi_reg_str_dup(name) : name;
        info.Getter = getter ? reinterpret_cast<PUERTS_NAMESPACE::JSFunctionCallback>(&PesapiRegGetterWrap) : nullptr;
        info.Setter = setter ? reinterpret_cast<PUERTS_NAMESPACE::JSFunctionCallback>(&PesapiRegSetterWrap) : nullptr;
        info.GetterData = getter_data;
        info.SetterData = setter_data;
        info.PesapiGetter = getter;
        info.PesapiSetter = setter;
    }
}

static void* pesapi_get_class_data(pesapi_registry registry, const void* type_id, int force_load)
{
    auto clsDef = force_load ? PUERTS_NAMESPACE::LoadClassByID(ToRegistry(registry), type_id)
                             : PUERTS_NAMESPACE::FindClassByID(ToRegistry(registry), type_id);
    return clsDef ? clsDef->Data : nullptr;
}

static void pesapi_on_class_not_found(pesapi_registry registry, pesapi_class_not_found_callback callback)
{
    PUERTS_NAMESPACE::OnClassNotFound(ToRegistry(registry), callback);
}

static void pesapi_class_type_info(pesapi_registry registry, const char* proto_magic_id, const void* type_id,
    const void* constructor_info, const void* methods_info, const void* functions_info, const void* properties_info,
    const void* variables_info)
{
    if (!proto_magic_id || strcmp(proto_magic_id, PUERTS_BINDING_PROTO_ID()) != 0)
    {
        return;
    }

    PUERTS_NAMESPACE::SetClassTypeInfo(ToRegistry(registry), type_id,
        static_cast<const PUERTS_NAMESPACE::NamedFunctionInfo*>(constructor_info),
        static_cast<const PUERTS_NAMESPACE::NamedFunctionInfo*>(methods_info),
        static_cast<const PUERTS_NAMESPACE::NamedFunctionInfo*>(functions_info),
        static_cast<const PUERTS_NAMESPACE::NamedPropertyInfo*>(properties_info),
        static_cast<const PUERTS_NAMESPACE::NamedPropertyInfo*>(variables_info));
}

static const void* pesapi_find_type_id(pesapi_registry registry, const char* module_name, const char* type_name)
{
    PUERTS_NAMESPACE::PString fullname;
    if (module_name && module_name[0] != '\0')
    {
        fullname = module_name;
        fullname += ".";
    }
    if (type_name)
    {
        fullname += type_name;
    }
    const auto class_def = PUERTS_NAMESPACE::FindCppTypeClassByName(ToRegistry(registry), fullname);
    return class_def ? class_def->TypeId : nullptr;
}

static int pesapi_trace_native_object_lifecycle(
    pesapi_registry registry, const void* type_id, pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit)
{
    return PUERTS_NAMESPACE::TraceObjectLifecycle(ToRegistry(registry), type_id, on_enter, on_exit) ? 1 : 0;
}

MSVC_PRAGMA(warning(pop))

pesapi_registry_api g_reg_apis = {
    &pesapi_create_registry,
    &pesapi_alloc_type_infos,
    &pesapi_set_type_info,
    &pesapi_create_signature_info,
    &pesapi_define_class,
    &pesapi_set_property_info_size,
    &pesapi_set_method_info,
    &pesapi_set_property_info,
    &pesapi_get_class_data,
    &pesapi_on_class_not_found,
    &pesapi_class_type_info,
    &pesapi_find_type_id,
    &pesapi_trace_native_object_lifecycle,
};

#undef PESAPI_REG_CONTAINER_OF

}    // namespace regimpl
}    // namespace pesapi

#endif    // WITH_QUICKJS
