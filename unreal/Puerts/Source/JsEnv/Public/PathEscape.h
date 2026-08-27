/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PuertsNamespaceDef.h"

namespace PUERTS_NAMESPACE
{
// ECMAScript reserved words. None of these may be used as a bare binding identifier, so a generated
// `namespace enum { ... }`, `enum class { ... }`, `class default { ... }` etc. is a TypeScript syntax error.
// `skipLibCheck` does NOT suppress such grammar errors in .d.ts files, so a single occurrence aborts the
// whole PuertsEditor compilation. Contextual keywords (any, as, type, namespace, module, ...) are legal as
// identifiers and are intentionally excluded so we never rename a name that did not need it.
FORCEINLINE bool IsTypeScriptReservedWord(const FString& Identifier)
{
    static const TArray<FString> ReservedWords = {TEXT("await"), TEXT("break"), TEXT("case"), TEXT("catch"), TEXT("class"),
        TEXT("const"), TEXT("continue"), TEXT("debugger"), TEXT("default"), TEXT("delete"), TEXT("do"), TEXT("else"), TEXT("enum"),
        TEXT("export"), TEXT("extends"), TEXT("false"), TEXT("finally"), TEXT("for"), TEXT("function"), TEXT("if"), TEXT("import"),
        TEXT("in"), TEXT("instanceof"), TEXT("new"), TEXT("null"), TEXT("return"), TEXT("super"), TEXT("switch"), TEXT("this"),
        TEXT("throw"), TEXT("true"), TEXT("try"), TEXT("typeof"), TEXT("var"), TEXT("void"), TEXT("while"), TEXT("with"),
        // future reserved words in strict mode (a .d.ts is parsed in strict mode)
        TEXT("implements"), TEXT("interface"), TEXT("let"), TEXT("package"), TEXT("private"), TEXT("protected"), TEXT("public"),
        TEXT("static"), TEXT("yield")};

    // Case-sensitive match: TypeScript reserved words are lowercase, while UE type names are PascalCase
    // (Class, Enum, Function, Interface, Package, ...). FString's operator== / TArray::Contains are
    // case-INsensitive, which would wrongly treat those valid identifiers as reserved and escape/flag them.
    return ReservedWords.ContainsByPredicate(
        [&Identifier](const FString& Word) { return Identifier.Equals(Word, ESearchCase::CaseSensitive); });
}

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
    // A reserved word can not be emitted as a bare identifier. Escape its first character with the same
    // reversible `$<charcode>$` scheme used above; the result (e.g. "enum" -> "$101$num") is a valid,
    // non-reserved identifier that TypeScriptVariableNameToFilename() restores to the original name, so
    // runtime class/enum/struct loading (FStructWrapper::Load with UnEscape=true) keeps working.
    if (IsTypeScriptReservedWord(TypeScriptVariable))
    {
        TypeScriptVariable = FString::Printf(TEXT("$%d$"), (int) TypeScriptVariable[0]) + TypeScriptVariable.RightChop(1);
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

}    // namespace PUERTS_NAMESPACE
