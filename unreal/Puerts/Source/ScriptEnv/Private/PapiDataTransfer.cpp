/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiDataTransfer.h"
#include "ObjectMapper.h"

namespace PUERTS_NAMESPACE
{
// the IObjectMapper of the host is the env private (see PapiUtils::ObjectMapperOf)
static FORCEINLINE IObjectMapper* HostObjectMapper(struct pesapi_ffi* Apis, pesapi_env Env)
{
    return static_cast<IObjectMapper*>(const_cast<void*>(Apis->get_env_private(Env)));
}

pesapi_value PapiDataTransfer::FindOrAddObject(struct pesapi_ffi* Apis, pesapi_env Env, UClass* Class, UObject* UEObject)
{
    return HostObjectMapper(Apis, Env)->FindOrAdd(Env, Class, UEObject);
}

pesapi_value PapiDataTransfer::FindOrAddStruct(
    struct pesapi_ffi* Apis, pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    return HostObjectMapper(Apis, Env)->FindOrAddStruct(Env, ScriptStruct, Ptr, PassByPointer);
}

bool PapiDataTransfer::IsInstanceOf(struct pesapi_ffi* Apis, pesapi_env Env, UStruct* Struct, pesapi_value Value)
{
    return Apis->is_object(Env, Value) && HostObjectMapper(Apis, Env)->IsInstanceOf(Env, Struct, Value);
}
}    // namespace PUERTS_NAMESPACE
