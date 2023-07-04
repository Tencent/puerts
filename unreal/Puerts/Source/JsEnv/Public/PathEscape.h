/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

namespace puerts
{
FORCEINLINE FString FilenameToTypeScriptVariableName(const FString& Filename)
{
    FString TypeScriptVariable;
    if (FChar::IsDigit(Filename[0]))
    {
        TypeScriptVariable.AppendChar('_');
    }
    for (TCHAR c : Filename)
    {
        if (FChar::IsAlnum(c) || c == '_' || c == '$' || FChar::IsAlpha(c))
        {
            if (c == '$')
            {
                TypeScriptVariable.AppendChar('$');
            }
            TypeScriptVariable.AppendChar(c);
        }
        else
        {
            TypeScriptVariable.AppendChar('$');
            TypeScriptVariable.Append(FString::Printf(TEXT("%d"), (int) c));
            TypeScriptVariable.AppendChar('$');
        }
    }
    return TypeScriptVariable;
}

FORCEINLINE FString TypeScriptVariableNameToFilename(const FString& TypeScriptVariable)
{
    FString Filename;
    int32 i = 0;
    if (TypeScriptVariable.StartsWith("_") && TypeScriptVariable.Len() > 1 && FChar::IsDigit(TypeScriptVariable[1]))
    {
        i = 1;
    }
    while (i < TypeScriptVariable.Len())
    {
        if (TypeScriptVariable[i] != '$')
        {
            Filename.AppendChar(TypeScriptVariable[i]);
            ++i;
        }
        else
        {
            if (i + 1 < TypeScriptVariable.Len() && TypeScriptVariable[i + 1] == '$')
            {
                Filename.AppendChar('$');
                i += 2;
            }
            else
            {
                FString ascii_str;
                ++i;
                while (i < TypeScriptVariable.Len() && FChar::IsDigit(TypeScriptVariable[i]))
                {
                    ascii_str.AppendChar(TypeScriptVariable[i]);
                    ++i;
                }
                if (i < TypeScriptVariable.Len() && TypeScriptVariable[i] == '$')
                {
                    ++i;
                }
                TCHAR original_char = static_cast<TCHAR>(FCString::Atoi(*ascii_str));
                Filename.AppendChar(original_char);
            }
        }
    }
    return Filename;
}

}    // namespace puerts
