// Fill out your copyright notice in the Description page of Project Settings.

#include "TemplateBindingGenerator.h"
#include "JSClassRegister.h"
#include "Interfaces/IPluginManager.h"
#include "CoreUObject.h"
#ifdef PUERTS_WITH_SOURCE_CONTROL
#include "FileSystemOperation.h"
#endif

struct FGenImp
{
    FStringBuffer Output{"", ""};

    FString GetNamePrefix(const PUERTS_NAMESPACE::CTypeInfo* TypeInfo)
    {
        return TypeInfo->IsUEType() && !HadNamespace(TypeInfo->Name()) ? "UE." : "";
    }

    FString GetName(const PUERTS_NAMESPACE::CTypeInfo* TypeInfo)
    {
        return UTF8_TO_TCHAR(TypeInfo->Name());
    }

    void Begin()
    {
        Output << "declare module \"cpp\" {\n";
        Output << "    import * as UE from \"ue\"\n";
        Output << "    import * as cpp from \"cpp\"\n";
        Output << "    import {$Ref, $Nullable, cstring} from \"puerts\"\n\n";
    }

    void GenArguments(const PUERTS_NAMESPACE::CFunctionInfo* Type, FStringBuffer& Buff)
    {
        for (unsigned int i = 0; i < Type->ArgumentCount(); i++)
        {
            if (i != 0)
                Buff << ", ";
            auto argInfo = Type->Argument(i);

            Buff << FString::Printf(TEXT("p%d"), i);

            if (i >= Type->ArgumentCount() - Type->DefaultCount())
            {
                Buff << "?";
            }

            Buff << ": ";

            if (strcmp(argInfo->Name(), "cstring") != 0 && !argInfo->IsUEType() && !argInfo->IsObjectType() && argInfo->IsPointer())
            {
                Buff << "ArrayBuffer";
            }
            else
            {
                bool IsReference = argInfo->IsRef();
                bool IsNullable = !IsReference && argInfo->IsPointer();
                if (IsNullable)
                {
                    Buff << "$Nullable<";
                }
                if (IsReference)
                {
                    Buff << "$Ref<";
                }

                const PUERTS_NAMESPACE::CTypeInfo* TypeInfo = Type->Argument(i);
                Buff << GetNamePrefix(TypeInfo) << GetName(TypeInfo);

                if (IsNullable)
                {
                    Buff << ">";
                }
                if (IsReference)
                {
                    Buff << ">";
                }
            }
        }
    }

    void GenClass(const PUERTS_NAMESPACE::JSClassDefinition* ClassDefinition)
    {
        if (HasUENamespace(ClassDefinition->ScriptName))
            return;

        Output << "    ";

        PUERTS_NAMESPACE::NamedFunctionInfo* ConstructorInfo = ClassDefinition->ConstructorInfos;
        const bool IsNoConstructorInfos = !ConstructorInfo || !(ConstructorInfo->Name && ConstructorInfo->Type);
        if (IsNoConstructorInfos)
        {
            Output << "abstract ";
        }

        Output << "class " << ClassDefinition->ScriptName;
        if (ClassDefinition->SuperTypeId)
        {
            Output << " extends " << PUERTS_NAMESPACE::FindClassByID(ClassDefinition->SuperTypeId)->ScriptName;
        }
        Output << " {\n";

        TSet<FString> AddedFunctions;

        while (ConstructorInfo && ConstructorInfo->Name && ConstructorInfo->Type)
        {
            FStringBuffer Tmp;
            Tmp << "        constructor(";
            GenArguments(ConstructorInfo->Type, Tmp);
            Tmp << ");\n";
            if (!AddedFunctions.Contains(Tmp.Buffer))
            {
                AddedFunctions.Add(Tmp.Buffer);
                Output << Tmp;
            }
            ++ConstructorInfo;
        }

        PUERTS_NAMESPACE::NamedPropertyInfo* PropertyInfo = ClassDefinition->PropertyInfos;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Type)
        {
            Output << "        " << PropertyInfo->Name << ": " << GetNamePrefix(PropertyInfo->Type) << PropertyInfo->Type->Name()
                   << ";\n";
            ++PropertyInfo;
        }

        PUERTS_NAMESPACE::NamedPropertyInfo* VariableInfo = ClassDefinition->VariableInfos;
        while (VariableInfo && VariableInfo->Name && VariableInfo->Type)
        {
            int Pos = VariableInfo - ClassDefinition->VariableInfos;
            Output << "        static " << (ClassDefinition->Variables[Pos].Setter ? "" : "readonly ") << VariableInfo->Name << ": "
                   << GetNamePrefix(VariableInfo->Type) << VariableInfo->Type->Name() << ";\n";
            ++VariableInfo;
        }

        PUERTS_NAMESPACE::NamedFunctionInfo* FunctionInfo = ClassDefinition->FunctionInfos;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Type)
        {
            FStringBuffer Tmp;
            Tmp << "        static " << FunctionInfo->Name;
            if (FunctionInfo->Type->Return())
            {
                Tmp << "(";
                GenArguments(FunctionInfo->Type, Tmp);
                const PUERTS_NAMESPACE::CTypeInfo* ReturnType = FunctionInfo->Type->Return();
                Tmp << ") :" << GetNamePrefix(ReturnType) << GetName(ReturnType) << ";\n";
            }
            else
            {
                Tmp << FunctionInfo->Type->CustomSignature() << ";\n";
            }
            if (!AddedFunctions.Contains(Tmp.Buffer))
            {
                AddedFunctions.Add(Tmp.Buffer);
                Output << Tmp;
            }
            ++FunctionInfo;
        }

        PUERTS_NAMESPACE::NamedFunctionInfo* MethodInfo = ClassDefinition->MethodInfos;
        while (MethodInfo && MethodInfo->Name && MethodInfo->Type)
        {
            FStringBuffer Tmp;
            Tmp << "        " << MethodInfo->Name;
            if (MethodInfo->Type->Return())
            {
                Tmp << "(";
                GenArguments(MethodInfo->Type, Tmp);
                const PUERTS_NAMESPACE::CTypeInfo* ReturnType = MethodInfo->Type->Return();
                Tmp << ") :" << GetNamePrefix(ReturnType) << GetName(ReturnType) << ";\n";
            }
            else
            {
                Tmp << MethodInfo->Type->CustomSignature() << ";\n";
            }
            if (!AddedFunctions.Contains(Tmp.Buffer))
            {
                AddedFunctions.Add(Tmp.Buffer);
                Output << Tmp;
            }
            ++MethodInfo;
        }

        Output << "    }\n\n";
    }

    void End()
    {
        Output << "}\n";
    }
};

void UTemplateBindingGenerator::Gen_Implementation() const
{
    FGenImp Gen;

    Gen.Begin();

    PUERTS_NAMESPACE::ForeachRegisterClass(
        [&](const PUERTS_NAMESPACE::JSClassDefinition* ClassDefinition)
        {
            if (ClassDefinition->TypeId && ClassDefinition->ScriptName)
            {
                Gen.GenClass(ClassDefinition);
            }
        });

    Gen.End();

    const FString FilePath = FPaths::ProjectDir() / TEXT("Typing/cpp/index.d.ts");

#ifdef PUERTS_WITH_SOURCE_CONTROL
    PuertsSourceControlUtils::MakeSourceControlFileWritable(FilePath);
#endif

    FFileHelper::SaveStringToFile(Gen.Output.Buffer, *FilePath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
}
