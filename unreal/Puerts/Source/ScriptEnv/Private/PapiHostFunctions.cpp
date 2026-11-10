/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiHostFunctions.h"
#include "CoreMinimal.h"
#include "PapiDataTransfer.h"

namespace PUERTS_NAMESPACE
{
namespace PapiHostFunctions
{
FArrayBufferValue FNameToArrayBuffer(const FString& Name)
{
    FName Value(*Name);
    FArrayBufferValue Ret;
    Ret.Data.Append(reinterpret_cast<const uint8*>(&Value), sizeof(FName));
    return Ret;
}

FArrayBufferValue ToCString(const std::string& Str)
{
    FArrayBufferValue Ret;
    // with the null terminator
    Ret.Data.Append(reinterpret_cast<const uint8*>(Str.c_str()), Str.size() + 1);
    return Ret;
}

void ToCPtrArray(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int Num = Apis->get_args_len(Info);

    TArray<void*> Buff;
    Buff.SetNumZeroed(Num);
    for (int i = 0; i < Num; i++)
    {
        pesapi_value Val = Apis->get_arg(Info, i);
        // an ArrayBuffer or an ArrayBufferView
        if (Apis->is_binary(Env, Val))
        {
            size_t Unused = 0;
            Buff[i] = Apis->get_value_binary(Env, Val, &Unused);
        }
    }
    Apis->add_return(Info, Apis->create_binary_by_value(Env, Buff.GetData(), sizeof(void*) * Num));
}

FString GetFNameString(const FString& Name)
{
    return FName(*Name).ToString();
}

void FixFNameCase(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    FName RequiredFName(*PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0)));
    const FNameEntry* Entry = RequiredFName.GetComparisonNameEntry();
    FString Out;
    Entry->AppendNameToString(Out);
    if (RequiredFName.GetNumber() != NAME_NO_NUMBER_INTERNAL)
    {
        Out += TEXT('_');
        Out.AppendInt(NAME_INTERNAL_TO_EXTERNAL(RequiredFName.GetNumber()));
    }
    Apis->add_return(Info, PapiDataTransfer::FromFString(Apis, Env, Out));
}
}    // namespace PapiHostFunctions
}    // namespace PUERTS_NAMESPACE
