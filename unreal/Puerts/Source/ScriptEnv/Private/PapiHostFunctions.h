/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "NamespaceDef.h"
#include "ArrayBuffer.h"
#include "pesapi.h"

#include <string>

// the host functions bound to the script (methods of the global scriptEnv) that do not depend on the state of an env
namespace PUERTS_NAMESPACE
{
namespace PapiHostFunctions
{
// scriptEnv.fnameToArrayBuffer(name) (UE.FNameLiteral): the FName of name as an ArrayBuffer
FArrayBufferValue FNameToArrayBuffer(const FString& Name);

// scriptEnv.toCString(str) (puerts.toCString): the null terminated utf8 string as an ArrayBuffer
FArrayBufferValue ToCString(const std::string& Str);

// scriptEnv.toCPtrArray(...buffers) (puerts.toCPtrArray): the array of the pointers of the buffers as an ArrayBuffer
void ToCPtrArray(struct pesapi_ffi* Apis, pesapi_callback_info Info);

// scriptEnv.getFNameString(name) (puerts.getFNameString): the string of the FName of name
FString GetFNameString(const FString& Name);

// the name with the case of the comparison entry (the first registered case), ToString keeps the case of the display entry
void FixFNameCase(struct pesapi_ffi* Apis, pesapi_callback_info Info);
}    // namespace PapiHostFunctions
}    // namespace PUERTS_NAMESPACE
