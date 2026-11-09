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
void FNameToArrayBuffer(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    FName Name(*PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0)));
    Apis->add_return(Info, Apis->create_binary_by_value(Env, &Name, sizeof(FName)));
}

void ToCString(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    pesapi_value Str = Apis->get_arg(Info, 0);
    if (!Apis->is_string(Env, Str))
    {
        Apis->throw_by_string(Info, "expect a string");
        return;
    }

    size_t Length = 0;
    Apis->get_value_string_utf8(Env, Str, nullptr, &Length);
    TArray<char> Buff;
    Buff.SetNumUninitialized(Length + 1);
    Apis->get_value_string_utf8(Env, Str, Buff.GetData(), &Length);
    Buff[Length] = '\0';
    Apis->add_return(Info, Apis->create_binary_by_value(Env, Buff.GetData(), Length + 1));
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

void GetFNameString(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    FName RequiredFName(*PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0)));
    Apis->add_return(Info, PapiDataTransfer::FromFString(Apis, Env, RequiredFName.ToString()));
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
