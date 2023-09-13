/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CoreUObject.h"
#include "Features/IModularFeatures.h"
#include "Runtime/Launch/Resources/Version.h"
#if ENGINE_MAJOR_VERSION < 5 || ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION < 2
#include "IScriptGeneratorPluginInterface.h"
#endif
#include "Runtime/Launch/Resources/Version.h"
#include "PropertyMacros.h"

#define LOCTEXT_NAMESPACE "FParamDefaultValueMetasModule"

class FParamDefaultValueMetasModule
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION >= 2
    : public IModuleInterface
#else
    : public IScriptGeneratorPluginInterface
#endif
{
#if ENGINE_MAJOR_VERSION < 5 || ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION < 2
public:
    virtual void StartupModule() override
    {
        IModularFeatures::Get().RegisterModularFeature(TEXT("ScriptGenerator"), this);
    }
    virtual void ShutdownModule() override
    {
        IModularFeatures::Get().UnregisterModularFeature(TEXT("ScriptGenerator"), this);
    }
    virtual FString GetGeneratedCodeModuleName() const override
    {
        return TEXT("JsEnv");
    }
    virtual bool SupportsTarget(const FString& TargetName) const override
    {
        return true;
    }

    virtual bool ShouldExportClassesForModule(
        const FString& ModuleName, EBuildModuleType::Type ModuleType, const FString& ModuleGeneratedIncludeDirectory) const override
    {
        return ModuleType == EBuildModuleType::EngineRuntime ||
               ModuleType == EBuildModuleType::GameRuntime;    // only 'EngineRuntime' and 'GameRuntime' are valid
    }

    virtual void Initialize(const FString& RootLocalPath, const FString& RootBuildPath, const FString& OutputDirectory,
        const FString& IncludeBase) override
    {
        if (Finished)
            return;
        // UE_LOG(LogTemp, Warning, TEXT("FParamDefaultValueMetasModule OutputDirectory: %s, IncludeBase:%s"), *OutputDirectory,
        // *IncludeBase);
        GeneratedFileContent.Empty();
        OutputDir = OutputDirectory;
    }

    virtual void ExportClass(
        UClass* Class, const FString& SourceHeaderFilename, const FString& GeneratedHeaderFilename, bool bHasChanged) override
    {
        if (Finished)
            return;
        if (Class->HasAnyClassFlags(CLASS_Interface))
        {
            return;
        }

        for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper, EFieldIteratorFlags::ExcludeDeprecated);
             FuncIt; ++FuncIt)
        {
            UFunction* Function = *FuncIt;
            FuncDefGened = false;

            TMap<FName, FString>* MetaMap = UMetaData::GetMapForObject(Function);
            if (!MetaMap)
            {
                continue;
            }

            for (TFieldIterator<PropertyMacro> ParamIt(Function); ParamIt; ++ParamIt)
            {
                auto Property = *ParamIt;

                FName KeyName = FName(*FString::Printf(TEXT("CPP_Default_%s"), *Property->GetName()));
                FString* ValuePtr = MetaMap->Find(KeyName);

                if (ValuePtr)
                {
                    FString EscapeValue = (*ValuePtr).Replace(TEXT("\""), TEXT("\\\""));
                    if (Property->IsA<BoolPropertyMacro>())
                    {
                        EscapeValue = EscapeValue.Replace(TEXT("true"), TEXT("True")).Replace(TEXT("false"), TEXT("False"));
                    }
                    MakesureFunctinMeteExisted(Class, Function);
                    GeneratedFileContent +=
                        FString::Printf(TEXT("PF->Add(TEXT(\"%s\"), TEXT(\"%s\"));\r\n"), *Property->GetName(), *EscapeValue);
                }
            }
        }

        if (ClassDefGened)
        {
            ClassDefGened = false;

            GeneratedFileContent += TEXT("\r\n");
        }
    }

    virtual void FinishExport() override
    {
        if (Finished)
            return;
        const FString FilePath = FString::Printf(TEXT("%s%s"), *OutputDir, TEXT("InitParamDefaultMetas.inl"));
        // UE_LOG(LogTemp, Error, TEXT("save to: %s"), *FilePath);
        // UE_LOG(LogTemp, Error, TEXT("context: %s"), *GeneratedFileContent);
        FString FileContent;
        bool bResult = FFileHelper::LoadFileToString(FileContent, *FilePath);
        if (!bResult || FileContent != GeneratedFileContent)
        {
            bResult = FFileHelper::SaveStringToFile(GeneratedFileContent, *FilePath);
            check(bResult);
        }
        Finished = true;
    }

    virtual FString GetGeneratorName() const override
    {
        return TEXT("Puerts Parameter DefaultValue Metas Generator");
    }

private:
    bool ClassDefGened = false;
    bool FuncDefGened = false;

    void MakesureFunctinMeteExisted(UClass* InClass, UFunction* InFunction)
    {
        if (!ClassDefGened)
        {
            GeneratedFileContent += FString::Printf(TEXT("PC = &ParamDefaultMetas.Add(TEXT(\"%s\"));\r\n"), *InClass->GetName());
            ClassDefGened = true;
        }
        if (!FuncDefGened)
        {
            GeneratedFileContent += FString::Printf(TEXT("PF = &PC->Add(TEXT(\"%s\"));\r\n"), *InFunction->GetName());
            FuncDefGened = true;
        }
    }

    FString OutputDir;
    FString GeneratedFileContent;

    bool Finished = false;
#endif
};

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FParamDefaultValueMetasModule, ParamDefaultValueMetas)
