/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "Runtime/Launch/Resources/Version.h"
#include "IDeclarationGenerator.h"
#include "Features/IModularFeatures.h"
#include "Interfaces/IPluginManager.h"
#include "Misc/Paths.h"
#include "CoreUObject.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Components/PanelSlot.h"
#if WITH_EDITOR
#if (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 1) || ENGINE_MAJOR_VERSION > 5
#include "AssetRegistry/AssetRegistryModule.h"
#else
#include "AssetRegistryModule.h"
#endif
#endif
#include "LevelEditor.h"
#include "GenDTSStyle.h"
#include "GenDTSCommands.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
// #include "Misc/MessageDialog.h"
#include "Framework/MultiBox/MultiBoxBuilder.h"
#include "Engine/UserDefinedStruct.h"
#include "Engine/UserDefinedEnum.h"
#include "Engine/Blueprint.h"
#include "CodeGenerator.h"
#include "JSClassRegister.h"
#include "UECompatible.h"
#include "Engine/CollisionProfile.h"
#if (ENGINE_MAJOR_VERSION >= 5)
#include "ToolMenus.h"
#endif
#include "Internationalization/Regex.h"
#include "PuertsModule.h"
#ifdef PUERTS_WITH_SOURCE_CONTROL
#include "FileSystemOperation.h"
#endif
#include "PathEscape.h"

#define STRINGIZE(x) #x
#define STRINGIZE_VALUE_OF(x) STRINGIZE(x)

#define TYPE_DECL_START "// __TYPE_DECL_START: "
#define TYPE_DECL_END "// __TYPE_DECL_END"
#define TYPE_ASSOCIATION "ASSOCIATION"

bool IsTypeScriptKeyword(const FString& InputString)
{
    static TArray<FString> TypeScriptKeywords = {TEXT("break"), TEXT("as"), TEXT("any"), TEXT("switch"), TEXT("case"), TEXT("if"),
        TEXT("throw"), TEXT("else"), TEXT("var"), TEXT("new"), TEXT("function"), TEXT("return"), TEXT("void"), TEXT("enum"),
        TEXT("while"), TEXT("do"), TEXT("continue"), TEXT("for"), TEXT("interface"), TEXT("implements"), TEXT("let"),
        TEXT("instanceof"), TEXT("typeof"), TEXT("public"), TEXT("private"), TEXT("protected"), TEXT("export"), TEXT("import"),
        TEXT("class"), TEXT("super"), TEXT("this"), TEXT("yield"), TEXT("in"), TEXT("finally"), TEXT("static"), TEXT("try"),
        TEXT("catch")};

    return TypeScriptKeywords.Contains(InputString);
}

static FString SafeName(const FString& Name)
{
    auto Ret = Name.Replace(TEXT(" "), TEXT(""))
                   .Replace(TEXT("-"), TEXT("_"))
                   .Replace(TEXT("+"), TEXT("_"))
                   .Replace(TEXT("/"), TEXT("_"))
                   .Replace(TEXT("("), TEXT("_"))
                   .Replace(TEXT(")"), TEXT("_"))
                   .Replace(TEXT("?"), TEXT("$"))
                   .Replace(TEXT(","), TEXT("_"))
                   .Replace(TEXT("="), TEXT("_"));
    if (Ret.Len() > 0)
    {
        auto FirstChar = Ret[0];
        if ((TCHAR) '0' <= FirstChar && FirstChar <= (TCHAR) '9')
        {
            return TEXT("_") + Ret;
        }
    }
    return Ret;
}

static FString SafeParamName(const FString& Name)
{
    auto Ret = SafeName(Name);
    return IsTypeScriptKeyword(Ret) ? (TEXT("_") + Ret) : Ret;
}

static FString SafeFieldName(const FString& Name, bool WithBracket = true)
{
    bool IsInvalid = false;
    FString Ret = TEXT("");

    for (int i = 0; i < Name.Len(); i++)
    {
        auto Char = Name[i];
        if ((Char >= (TCHAR) '0' && Char <= (TCHAR) '9') || (Char >= (TCHAR) 'a' && Char <= (TCHAR) 'z') ||
            (Char >= (TCHAR) 'A' && Char <= (TCHAR) 'Z') || Char == (TCHAR) '_')
        {
            Ret += Char;
        }
        else
        {
            IsInvalid = true;
            if (Char == (TCHAR) '"')
            {
                Ret += "\\\"";
            }
            else if (Char == (TCHAR) '\\')
            {
                Ret += "\\\\";
            }
            else
            {
                Ret += Char;
            }
        }
    }
    if (Ret.Len() > 0)
    {
        auto FirstChar = Ret[0];
        if ((TCHAR) '0' <= FirstChar && FirstChar <= (TCHAR) '9')
        {
            IsInvalid = true;
        }
    }
    return IsInvalid ? (WithBracket ? ((TEXT("[\"") + Ret + TEXT("\"]"))) : ((TEXT("\"") + Ret + TEXT("\"")))) : Ret;
}

FStringBuffer& FStringBuffer::operator<<(const FString& InText)
{
    this->Buffer += InText;
    return *this;
}

FStringBuffer& FStringBuffer::operator<<(const TCHAR* InText)
{
    this->Buffer += InText;
    return *this;
}

FStringBuffer& FStringBuffer::operator<<(const char* InText)
{
    this->Buffer += ANSI_TO_TCHAR(InText);
    return *this;
}

FStringBuffer& FStringBuffer::operator<<(const FStringBuffer& Other)
{
    FString Line;
    FString Rest = Other.Buffer;
    static const FString NL = TEXT("\n");
    while (Rest.Split(NL, &Line, &Rest, ESearchCase::CaseSensitive, ESearchDir::FromStart))
    {
        *this << Prefix << Line << "\n";
    }
    if (!Rest.IsEmpty())
    {
        *this << Prefix << Rest;
    }
    return *this;
}

void FStringBuffer::Indent(int Num)
{
    if (Num > 0)
    {
        for (int i = 0; i < Num; i++)
            Prefix.AppendChar(' ');
    }
    else if (Num < 0)
    {
        Prefix = Prefix.Mid(0, Prefix.Len() + Num);
    }
}

TArray<UObject*> GetSortedClasses(bool GenStruct = false, bool GenEnum = false)
{
    TArray<UObject*> SortedClasses;
    for (TObjectIterator<UClass> It; It; ++It)
    {
        SortedClasses.Add(*It);
    }

    if (GenStruct)
    {
        for (TObjectIterator<UScriptStruct> It; It; ++It)
        {
            SortedClasses.Add(*It);
        }
    }

    if (GenEnum)
    {
        for (TObjectIterator<UEnum> It; It; ++It)
        {
            SortedClasses.Add(*It);
        }
    }

    SortedClasses.Sort([&](const UObject& ClassA, const UObject& ClassB) -> bool { return ClassA.GetName() < ClassB.GetName(); });

    return SortedClasses;
}

void FTypeScriptDeclarationGenerator::Begin(FString ModuleName)
{
    AllFuncionOutputs.clear();
    InitExtensionMethodsMap();
    Output = {"", ""};
    Output << "/// <reference path=\"puerts.d.ts\" />\n";
    Output << "declare module \"" << ModuleName << "\" {\n";
    Output << "    import {$Ref, $Nullable} from \"puerts\"\n\n";
    Output << "    import * as cpp from \"cpp\"\n\n";
    Output << "    import * as UE from \"ue\"\n\n";
    Output.Indent(4);
}

bool IsChildOf(UClass* Class, const FString& Name)
{
    if (!Class)
        return false;
    if (Class->GetName() == Name)
        return true;
    return IsChildOf(Class->GetSuperClass(), Name);
}

bool HadNamespace(const char* name)
{
    return strncmp(name, "UE.", 3) == 0 || strncmp(name, "cpp.", 4) == 0;
}

bool HasUENamespace(const char* name)
{
    return strncmp(name, "UE.", 3) == 0;
}

FString GetNamePrefix(const PUERTS_NAMESPACE::CTypeInfo* TypeInfo)
{
    return TypeInfo->IsObjectType() && !HadNamespace(TypeInfo->Name()) ? "cpp." : "";
}

FString GetName(const PUERTS_NAMESPACE::CTypeInfo* TypeInfo)
{
    return UTF8_TO_TCHAR(TypeInfo->Name());
}

void GenArgumentsForFunctionInfo(const PUERTS_NAMESPACE::CFunctionInfo* Type, FStringBuffer& Buff)
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

            Buff << GetNamePrefix(argInfo) << GetName(argInfo);

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

void FTypeScriptDeclarationGenerator::InitExtensionMethodsMap()
{
    TArray<UObject*> SortedClasses(GetSortedClasses());
    for (int i = 0; i < SortedClasses.Num(); ++i)
    {
        UClass* Class = Cast<UClass>(SortedClasses[i]);
        if (!Class)
            continue;
        bool IsExtensionMethod = IsChildOf(Class, "ExtensionMethods");
        if (IsExtensionMethod)
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    TFieldIterator<PropertyMacro> ParamIt(Function);
                    if (ParamIt &&
                        ((ParamIt->PropertyFlags & (CPF_Parm | CPF_ReturnParm)) == CPF_Parm))    // has at least one param
                    {
                        UStruct* Struct = nullptr;
                        if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(*ParamIt))
                        {
                            Struct = ObjectPropertyBase->PropertyClass;
                        }
                        else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(*ParamIt))
                        {
                            Struct = StructProperty->Struct;
                        }
                        if (Struct)
                        {
                            if (ExtensionMethodsMap.find(Struct) == ExtensionMethodsMap.end())
                            {
                                ExtensionMethodsMap[Struct] = std::vector<UFunction*>();
                            }
                            ExtensionMethodsMap[Struct].push_back(Function);
                        }
                    }
                }
            }
        }
    }
}

void FTypeScriptDeclarationGenerator::GenTypeScriptDeclaration(bool InGenStruct, bool InGenEnum)
{
    Begin();
    BeginGenAssetData = false;
    TArray<UObject*> SortedClasses(GetSortedClasses(InGenStruct, InGenEnum));
    for (int i = 0; i < SortedClasses.Num(); ++i)
    {
        UObject* Class = SortedClasses[i];
        checkfSlow(Class != nullptr, TEXT("Class name corruption!"));
        const TArray<FString>& IgnoreClassListOnDTS = IPuertsModule::Get().GetIgnoreClassListOnDTS();
        if (IgnoreClassListOnDTS.Contains(Class->GetName()))
        {
            continue;
        }
        if (Class->GetName() == TEXT("PropertyMetaRoot"))
        {
            continue;
        }
        if (Class->GetName().StartsWith("SKEL_") || Class->GetName().StartsWith("REINST_") ||
            Class->GetName().StartsWith("TRASHCLASS_") || Class->GetName().StartsWith("PLACEHOLDER-") ||
            Class->GetName().StartsWith("HOTRELOADED_"))
        {
            continue;
        }
        Gen(Class);
    }
    BeginGenAssetData = true;
    for (FAssetData const& AssetData : AssetList)
    {
        auto BlueprintTypeDeclInfoPtr = BlueprintTypeDeclInfoCache.Find(AssetData.PackageName);
        if (BlueprintTypeDeclInfoPtr && BlueprintTypeDeclInfoPtr->Changed)
        {
            auto Asset = AssetData.GetAsset();
            if (auto Blueprint = Cast<UBlueprint>(Asset))
            {
                if (Blueprint->Status != BS_Error && Blueprint->GeneratedClass)
                {
                    Gen(Blueprint->GeneratedClass);
                }
                else
                {
                    UE_LOG(LogTemp, Warning, TEXT("invalid blueprint: %s"), *AssetData.PackageName.ToString());
                }
            }
            else if (auto UserDefinedEnum = Cast<UUserDefinedEnum>(Asset))
            {
                Gen(UserDefinedEnum);
            }
            if (auto UserDefinedStruct = Cast<UUserDefinedStruct>(Asset))
            {
                Gen(UserDefinedStruct);
            }
        }
    }
    BeginGenAssetData = false;
    End();

    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    PlatformFile.CopyDirectoryTree(*(FPaths::ProjectDir() / TEXT("Typing")),
        *(IPluginManager::Get().FindPlugin("Puerts")->GetBaseDir() / TEXT("Typing")), false);
    PlatformFile.CopyDirectoryTree(*(FPaths::ProjectContentDir() / TEXT("JavaScript")),
        *(IPluginManager::Get().FindPlugin("Puerts")->GetBaseDir() / TEXT("Content") / TEXT("JavaScript")), true);

    const FString UEDeclarationFilePath = FPaths::ProjectDir() / TEXT("Typing/ue/ue.d.ts");

#ifdef PUERTS_WITH_SOURCE_CONTROL
    PuertsSourceControlUtils::MakeSourceControlFileWritable(UEDeclarationFilePath);
#endif

    FFileHelper::SaveStringToFile(ToString(), *UEDeclarationFilePath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);

    Begin();
    for (auto& KV : BlueprintTypeDeclInfoCache)
    {
        if (KV.Value.IsExist)
        {
            for (auto& NameToDecl : KV.Value.NameToDecl)
            {
                Output << TYPE_DECL_START << (KV.Value.IsAssociation ? TYPE_ASSOCIATION : KV.Value.FileVersionString) << "\n";
                Output << NameToDecl.Value;
                Output << TYPE_DECL_END << "\n";
            }
        }
    }
    End();

    const FString BPDeclarationFilePath = FPaths::ProjectDir() / TEXT("Typing/ue/ue_bp.d.ts");

#ifdef PUERTS_WITH_SOURCE_CONTROL
    PuertsSourceControlUtils::MakeSourceControlFileWritable(BPDeclarationFilePath);
#endif

    FFileHelper::SaveStringToFile(ToString(), *BPDeclarationFilePath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
}

static UPackage* GetPackage(UObject* Obj)
{
#if ENGINE_MINOR_VERSION > 25 || ENGINE_MAJOR_VERSION > 4
    return Obj->GetPackage();
#else
    return Obj->GetOutermost();
#endif
}

const FString& FTypeScriptDeclarationGenerator::GetNamespace(UObject* Obj)
{
    auto Iter = NamespaceMap.find(Obj);
    if (Iter == NamespaceMap.end())
    {
        UPackage* Pkg = GetPackage(Obj);
        if (Pkg)
        {
            TArray<FString> PathFrags;
            Pkg->GetName().ParseIntoArray(PathFrags, TEXT("/"));
            for (int i = 0; i < PathFrags.Num(); i++)
            {
                PathFrags[i] = PUERTS_NAMESPACE::FilenameToTypeScriptVariableName(PathFrags[i]);
            }
            NamespaceMap[Obj] = FString::Join(PathFrags, TEXT("."));
        }
        else
        {
            NamespaceMap[Obj] = TEXT("");
        }
        Iter = NamespaceMap.find(Obj);
    }
    return Iter->second;
}

FString FTypeScriptDeclarationGenerator::GetNameWithNamespace(UObject* Obj)
{
#if !defined(WITHOUT_BP_NAMESPACE)
    if (!Obj->IsNative())
    {
        return (RefFromOuter ? TEXT("") : TEXT("UE.")) + GetNamespace(Obj) + TEXT(".") +
               PUERTS_NAMESPACE::FilenameToTypeScriptVariableName(Obj->GetName());
    }
    return (RefFromOuter ? TEXT("") : TEXT("UE.")) + SafeName(Obj->GetName());
#else
    return SafeName(Obj->GetName());
#endif
}

void FTypeScriptDeclarationGenerator::NamespaceBegin(UObject* Obj, FStringBuffer& Buff)
{
#if !defined(WITHOUT_BP_NAMESPACE)
    if (!Obj->IsNative())
    {
        Buff << "    namespace " << GetNamespace(Obj) << " {\n";
        Buff.Indent(4);
    }
#endif
}

void FTypeScriptDeclarationGenerator::NamespaceEnd(UObject* Obj, FStringBuffer& Buff)
{
#if !defined(WITHOUT_BP_NAMESPACE)
    if (!Obj->IsNative())
    {
        Buff.Indent(-4);
        Buff << "    }\n\n";
    }
#endif
}

void FTypeScriptDeclarationGenerator::WriteOutput(UObject* Obj, const FStringBuffer& Buff)
{
    const UPackage* Pkg = GetPackage(Obj);
    bool IsPluginBPClass = Pkg && !Obj->IsNative() && !Pkg->GetName().StartsWith(TEXT("/Game/"));
    if (Pkg && !Obj->IsNative() && !IsPluginBPClass && BlueprintTypeDeclInfoCache.Find(Pkg->GetFName()))
    {
        FStringBuffer Temp;
        Temp.Prefix = Output.Prefix;
        NamespaceBegin(Obj, Temp);
        Temp << Buff;
        NamespaceEnd(Obj, Temp);
        BlueprintTypeDeclInfoCache[Pkg->GetFName()].NameToDecl.Add(Obj->GetFName(), Temp.Buffer);
        BlueprintTypeDeclInfoCache[Pkg->GetFName()].IsExist = true;
    }
    else if (Obj->IsNative() || IsPluginBPClass)
    {
        NamespaceBegin(Obj, Output);
        Output << Buff;
        NamespaceEnd(Obj, Output);
    }
}

void FTypeScriptDeclarationGenerator::RestoreBlueprintTypeDeclInfos(bool InGenFull)
{
    FString FileContent;
    FFileHelper::LoadFileToString(FileContent, *(FPaths::ProjectDir() / TEXT("Typing/ue/ue_bp.d.ts")));
    RestoreBlueprintTypeDeclInfos(FileContent, InGenFull);
}

void FTypeScriptDeclarationGenerator::RestoreBlueprintTypeDeclInfos(const FString& FileContent, bool InGenFull)
{
    FString Rest = FileContent;
    static const FString Start = TEXT(TYPE_DECL_START);
    static const FString End = TEXT(TYPE_DECL_END);
    static const FString NS_Keyword = TEXT("namespace ");
    int Pos = FileContent.Find(*Start, ESearchCase::CaseSensitive);
    while (Pos >= 0)
    {
        int VersionInfoEnd = FileContent.Find(TEXT("\n"), ESearchCase::CaseSensitive, ESearchDir::FromStart, Pos + Start.Len());
        int DeclEnd = FileContent.Find(*End, ESearchCase::CaseSensitive, ESearchDir::FromStart, VersionInfoEnd + 1);
        if (DeclEnd < Pos)
            return;
        FString FileVersionString = FileContent.Mid(Pos + Start.Len(), VersionInfoEnd - Pos - Start.Len());
        const bool bIsAssociation = FileVersionString == TYPE_ASSOCIATION;
        FString TypeDecl = FileContent.Mid(VersionInfoEnd + 1, DeclEnd - VersionInfoEnd - 1);
        int NamespaceStart = TypeDecl.Find(*NS_Keyword);
        if (NamespaceStart > 0)
        {
            int NamespaceEnd;
            if (TypeDecl.FindChar('{', NamespaceEnd))
            {
                if (NamespaceEnd > NamespaceStart)
                {
                    FString Namespace =
                        TypeDecl.Mid(NamespaceStart + NS_Keyword.Len(), NamespaceEnd - NamespaceStart - NS_Keyword.Len())
                            .TrimStartAndEnd();
                    FString PackageName = FString(TEXT("/")) + Namespace.Replace(TEXT("."), TEXT("/"));

                    FRegexPattern Pattern(TEXT("\\{\\s+(?:(?:class)|(?:enum))\\s+([\\u4e00-\\u9fa5a-zA-Z0-9_]+)"));
                    FRegexMatcher Matcher(Pattern, TypeDecl.Mid(NamespaceEnd));

                    if (Matcher.FindNext())
                    {
                        FName TypeName = *Matcher.GetCaptureGroup(1);
                        auto BlueprintTypeDeclInfoPtr = BlueprintTypeDeclInfoCache.Find(*PackageName);

                        if (BlueprintTypeDeclInfoPtr)
                        {
                            BlueprintTypeDeclInfoPtr->NameToDecl.Add(TypeName, TypeDecl);
                        }
                        else
                        {
                            TMap<FName, FString> NameToDecl;
                            NameToDecl.Add(TypeName, TypeDecl);
                            bool bIsExist = InGenFull ? false : bIsAssociation;
                            BlueprintTypeDeclInfoCache.Add(
                                FName(*PackageName), {NameToDecl, FileVersionString, bIsExist, true, bIsAssociation});
                        }
                    }
                }
            }
        }
        Pos = FileContent.Find(*Start, ESearchCase::CaseSensitive, ESearchDir::FromStart, DeclEnd + End.Len());
    }
}

void FTypeScriptDeclarationGenerator::LoadAllWidgetBlueprint(FName InSearchPath, bool InGenFull)
{
    FAssetRegistryModule& AssetRegistryModule = FModuleManager::LoadModuleChecked<FAssetRegistryModule>(FName("AssetRegistry"));
    IAssetRegistry& AssetRegistry = AssetRegistryModule.Get();

    FName PackagePath = (InSearchPath == NAME_None) ? FName(TEXT("/Game")) : InSearchPath;

    FARFilter BPFilter;
    BPFilter.PackagePaths.Add(PackagePath);
    BPFilter.PackagePaths.Add(FName(TEXT("/Engine")));
    BPFilter.bRecursivePaths = true;
    BPFilter.bRecursiveClasses = true;
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 0
    BPFilter.ClassPaths.Add(UBlueprint::StaticClass()->GetClassPathName());
    BPFilter.ClassPaths.Add(UUserDefinedEnum::StaticClass()->GetClassPathName());
    BPFilter.ClassPaths.Add(UUserDefinedStruct::StaticClass()->GetClassPathName());
#else
    BPFilter.ClassNames.Add(FName(TEXT("Blueprint")));
    BPFilter.ClassNames.Add(FName(TEXT("UserDefinedEnum")));
    BPFilter.ClassNames.Add(FName(TEXT("UserDefinedStruct")));
#endif

    AssetRegistry.GetAssets(BPFilter, AssetList);
    for (FAssetData const& AssetData : AssetList)
    {
#if ENGINE_MAJOR_VERSION >= 5
        const FAssetPackageData* PackageData = nullptr;
        auto OptionalPackageData = AssetRegistry.GetAssetPackageDataCopy(AssetData.PackageName);
        if (OptionalPackageData.IsSet())
        {
            PackageData = &OptionalPackageData.GetValue();
        }
#else
        const FAssetPackageData* PackageData = AssetRegistry.GetAssetPackageData(AssetData.PackageName);
#endif
        auto BlueprintTypeDeclInfoPtr = BlueprintTypeDeclInfoCache.Find(AssetData.PackageName);

        if (PackageData && BlueprintTypeDeclInfoPtr)
        {
            auto FileVersion = PackageData->PackageGuid.ToString();
            BlueprintTypeDeclInfoPtr->IsExist = true;
            BlueprintTypeDeclInfoPtr->Changed = InGenFull || (FileVersion != BlueprintTypeDeclInfoPtr->FileVersionString);
            BlueprintTypeDeclInfoPtr->FileVersionString = FileVersion;
        }
        else
        {
            BlueprintTypeDeclInfoCache.Add(AssetData.PackageName,
                {TMap<FName, FString>(), PackageData ? PackageData->PackageGuid.ToString() : FString(TEXT("")), true, true, false});
        }
    }
}

void FTypeScriptDeclarationGenerator::Gen(UObject* ToGen)
{
    if (ToGen->GetName().Equals(TEXT("ArrayBuffer")) || ToGen->GetName().Equals(TEXT("ArrayBufferValue")) ||
        ToGen->GetName().Equals(TEXT("JsObject")))
    {
        return;
    }
#if ENGINE_MAJOR_VERSION >= 5
    if (GetNamespace(ToGen).Equals(TEXT("Engine.Transient")))
    {
        return;
    }
#endif
    if (Processed.Contains(ToGen))
        return;
    if (ToGen->IsNative() && ProcessedByName.Contains(SafeName(ToGen->GetName())))
    {
        UE_LOG(LogTemp, Warning, TEXT("duplicate name found in ue.d.ts generate: %s"), *ToGen->GetName());
        return;
    }
    Processed.Add(ToGen);
    if (ToGen->IsNative())
    {
        ProcessedByName.Add(SafeName(ToGen->GetName()));
    }
    else if (BeginGenAssetData)
    {
        UPackage* Package = GetPackage(ToGen);
        BlueprintTypeDeclInfo* BlueprintTypeDeclInfo = BlueprintTypeDeclInfoCache.Find(Package->GetFName());
        if (!BlueprintTypeDeclInfo)
        {
            BlueprintTypeDeclInfoCache.Add(Package->GetFName(), {TMap<FName, FString>(), FString(TEXT("")), true, false, true});
        }
    }

    if (auto Class = Cast<UClass>(ToGen))
    {
        GenClass(Class);
    }
    else if (auto Struct = Cast<UStruct>(ToGen))
    {
        GenStruct(Struct);
    }
    else if (auto Enum = Cast<UEnum>(ToGen))
    {
        GenEnum(Enum);
    }
}

// #lizard forgives
bool FTypeScriptDeclarationGenerator::GenTypeDecl(FStringBuffer& StringBuffer, PropertyMacro* Property, TArray<UObject*>& AddToGen,
    bool ArrayDimProcessed, bool TreatAsRawFunction)
{
    if (Property != nullptr && !ArrayDimProcessed && Property->ArrayDim > 1)    // fix size array
    {
        StringBuffer << "FixSizeArray<";
        bool Result = GenTypeDecl(StringBuffer, Property, AddToGen, true, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    if (Property == nullptr)
    {
        StringBuffer << "void";
    }
    else if (Property->IsA<BoolPropertyMacro>())
    {
        StringBuffer << "boolean";
    }
    else if (Property->IsA<DoublePropertyMacro>() || Property->IsA<FloatPropertyMacro>() || Property->IsA<IntPropertyMacro>() ||
             Property->IsA<UInt32PropertyMacro>() || Property->IsA<Int16PropertyMacro>() || Property->IsA<UInt16PropertyMacro>() ||
             Property->IsA<Int8PropertyMacro>())
    {
        StringBuffer << "number";
    }
    else if (Property->IsA<Int64PropertyMacro>() || Property->IsA<UInt64PropertyMacro>())
    {
        StringBuffer << "bigint";
    }
    else if (Property->IsA<StrPropertyMacro>() || Property->IsA<NamePropertyMacro>())
    {
        StringBuffer << "string";
    }
    else if (Property->IsA<TextPropertyMacro>())
    {
#ifndef PUERTS_FTEXT_AS_OBJECT
        StringBuffer << "string";
#else
        StringBuffer << "cpp.FText";
#endif
    }
    else if (EnumPropertyMacro* EnumProperty = CastFieldMacro<EnumPropertyMacro>(Property))
    {
        AddToGen.Add(EnumProperty->GetEnum());
        StringBuffer << GetNameWithNamespace(EnumProperty->GetEnum());
    }
    else if (BytePropertyMacro* ByteProperty = CastFieldMacro<BytePropertyMacro>(Property))
    {
        if (ByteProperty->GetIntPropertyEnum())
        {
            AddToGen.Add(ByteProperty->GetIntPropertyEnum());
            StringBuffer << GetNameWithNamespace(ByteProperty->GetIntPropertyEnum());
        }
        else
        {
            StringBuffer << "number";
        }
    }
    else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(Property))
    {
        if (StructProperty->Struct->GetName() != TEXT("ArrayBuffer") &&
            StructProperty->Struct->GetName() != TEXT("ArrayBufferValue") && StructProperty->Struct->GetName() != TEXT("JsObject"))
        {
            const FString& Name = GetNameWithNamespace(StructProperty->Struct);
            const TArray<FString>& IgnoreStructListOnDTS = IPuertsModule::Get().GetIgnoreStructListOnDTS();
            if (IgnoreStructListOnDTS.Contains(Name))
            {
                return false;
            }
            AddToGen.Add(StructProperty->Struct);
        }
        if (StructProperty->Struct->GetName() == TEXT("JsObject"))
        {
            StringBuffer << "object";
        }
        else if (StructProperty->Struct->GetName() == TEXT("ArrayBuffer") ||
                 StructProperty->Struct->GetName() == TEXT("ArrayBufferValue"))
        {
            StringBuffer << "ArrayBuffer";
        }
        else
        {
            StringBuffer << GetNameWithNamespace(StructProperty->Struct);
        }
    }
    else if (auto ArrayProperty = CastFieldMacro<ArrayPropertyMacro>(Property))
    {
        StringBuffer << "TArray<";
        bool Result = GenTypeDecl(StringBuffer, ArrayProperty->Inner, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto SetProperty = CastFieldMacro<SetPropertyMacro>(Property))
    {
        StringBuffer << "TSet<";
        bool Result = GenTypeDecl(StringBuffer, SetProperty->ElementProp, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto MapProperty = CastFieldMacro<MapPropertyMacro>(Property))
    {
        StringBuffer << "TMap<";
        bool Result = GenTypeDecl(StringBuffer, MapProperty->KeyProp, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ", ";
        Result = GenTypeDecl(StringBuffer, MapProperty->ValueProp, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto ObjectProperty = CastFieldMacro<ObjectPropertyMacro>(Property))
    {
        const FString& Name = GetNameWithNamespace(ObjectProperty->PropertyClass);
        const TArray<FString>& IgnoreClassListOnDTS = IPuertsModule::Get().GetIgnoreClassListOnDTS();
        if (IgnoreClassListOnDTS.Contains(Name))
        {
            return false;
        }
        AddToGen.Add(ObjectProperty->PropertyClass);
        StringBuffer << Name;
    }
    else if (auto DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property))
    {
        if (!TreatAsRawFunction)
            StringBuffer << "$Delegate<";
        bool Result = GenFunction(StringBuffer, DelegateProperty->SignatureFunction, false);
        if (!Result)
            return false;
        if (!TreatAsRawFunction)
            StringBuffer << ">";
        return true;
    }
    else if (auto MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property))
    {
        if (!TreatAsRawFunction)
            StringBuffer << "$MulticastDelegate<";
        bool Result = GenFunction(StringBuffer, MulticastDelegateProperty->SignatureFunction, false);
        if (!Result)
            return false;
        if (!TreatAsRawFunction)
            StringBuffer << ">";
        return true;
    }
    else if (auto InterfaceProperty = CastFieldMacro<InterfacePropertyMacro>(Property))
    {
        AddToGen.Add(InterfaceProperty->InterfaceClass);
        StringBuffer << GetNameWithNamespace(InterfaceProperty->InterfaceClass);
    }
    else if (auto WeakObjectProperty = CastFieldMacro<WeakObjectPropertyMacro>(Property))
    {
        AddToGen.Add(WeakObjectProperty->PropertyClass);
        StringBuffer << "TWeakObjectPtr<" << GetNameWithNamespace(WeakObjectProperty->PropertyClass) << ">";
    }
    else if (auto SoftClassProperty = CastFieldMacro<SoftClassPropertyMacro>(Property))
    {
        AddToGen.Add(SoftClassProperty->PropertyClass);
        StringBuffer << "TSoftClassPtr<" << GetNameWithNamespace(SoftClassProperty->MetaClass) << ">";
    }
    else if (auto SoftObjectProperty = CastFieldMacro<SoftObjectPropertyMacro>(Property))
    {
        AddToGen.Add(SoftObjectProperty->PropertyClass);
        StringBuffer << "TSoftObjectPtr<" << GetNameWithNamespace(SoftObjectProperty->PropertyClass) << ">";
    }
    else if (auto LazyObjectProperty = CastFieldMacro<LazyObjectPropertyMacro>(Property))
    {
        AddToGen.Add(LazyObjectProperty->PropertyClass);
        StringBuffer << "TLazyObjectPtr<" << GetNameWithNamespace(LazyObjectProperty->PropertyClass) << ">";
    }
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
    else if (CastField<FFieldPathProperty>(Property))
    {
        StringBuffer << "string";
    }
#endif
    else
    {
        return false;
    }
    return true;
}

// #lizard forgives
bool FTypeScriptDeclarationGenerator::GenFunction(
    FStringBuffer& OwnerBuffer, UFunction* Function, bool WithName, bool ForceOneway, bool IgnoreOut, bool IsExtensionMethod)
{
    // FStringBuffer LocalBuffer;
    if (WithName)
    {
        if (!IsExtensionMethod && (Function->FunctionFlags & FUNC_Static))
        {
            OwnerBuffer << "static ";
        }

        FString FuncName = Function->GetName();
#ifdef PUERTS_WITH_EDITOR_SUFFIX
        if (puerts::IsEditorOnlyUFunction(Function))
        {
            FuncName += EditorOnlyPropertySuffix;
        }
#endif
        OwnerBuffer << SafeFieldName(FuncName);
    }
    OwnerBuffer << "(";
    PropertyMacro* ReturnValue = nullptr;

    TSet<FString> NameDeDupSet{};
    auto const DeDup = [&NameDeDupSet](FString const& Name)
    {
        if (!NameDeDupSet.Contains(Name))
        {
            NameDeDupSet.Add(Name);
            return Name;
        }

        int Cnt = 1;
        FString NewName = FString::Printf(TEXT("%s_%d"), *Name, Cnt);
        while (NameDeDupSet.Contains(NewName))
        {
            Cnt++;
            NewName = FString::Printf(TEXT("%s_%d"), *Name, Cnt);
        }

        return NewName;
    };

    TArray<UObject*> RefTypes;
    TArray<FString> ParamDecls;
    bool First = true;
    for (TFieldIterator<PropertyMacro> ParamIt(Function); ParamIt; ++ParamIt)
    {
        if (IsExtensionMethod && First)
        {
            First = false;
            continue;
        }
        auto Property = *ParamIt;
        if (Property->PropertyFlags & CPF_Parm)
        {
            if (Property->PropertyFlags & CPF_ReturnParm)
            {
                if (ForceOneway)
                    return false;
                ReturnValue = Property;
            }
            else
            {
                FStringBuffer TmpBuf;
                TMap<FName, FString>* MetaMap = UMetaData::GetMapForObject(Function);
                const FName MetadataCppDefaultValueKey(*(FString(TEXT("CPP_Default_")) + Property->GetName()));
                FString* DefaultValuePtr = nullptr;
                if (MetaMap)
                {
                    DefaultValuePtr = MetaMap->Find(MetadataCppDefaultValueKey);
                }

                TmpBuf << DeDup(SafeParamName(Property->GetName()));
                if (DefaultValuePtr)
                {
                    TmpBuf << "?";
                }
                TmpBuf << ": ";

                const bool IsReference =
                    !IgnoreOut && Property->PropertyFlags & CPF_OutParm && (!(Property->PropertyFlags & CPF_ConstParm));
                const bool IsNullable = !(DefaultValuePtr != nullptr || IsReference) &&
                                        (CastFieldMacro<ObjectPropertyMacro>(Property) != nullptr) &&
                                        !(Property->PropertyFlags & CPF_ReferenceParm);

                if (IsNullable)
                {
                    TmpBuf << "$Nullable<";
                }
                if (IsReference)
                {
                    if (ForceOneway)
                        return false;
                    TmpBuf << "$Ref<";
                }
                if (!GenTypeDecl(TmpBuf, Property, RefTypes))
                {
                    return false;
                }
                if (IsReference)
                {
                    TmpBuf << ">";
                }
                if (IsNullable)
                {
                    TmpBuf << ">";
                }

                if (DefaultValuePtr)
                {
                    if (Property->IsA<StrPropertyMacro>() || Property->IsA<NamePropertyMacro>() ||
                        Property->IsA<TextPropertyMacro>())
                    {
                        TmpBuf << " /* = \"" << *DefaultValuePtr << "\" */";
                    }
                    else
                    {
                        TmpBuf << " /* = " << *DefaultValuePtr << " */";
                    }
                }
                ParamDecls.Add(TmpBuf.Buffer);
            }
        }
    }
    OwnerBuffer << FString::Join(ParamDecls, TEXT(", "));
    OwnerBuffer << ")" << (WithName ? " : " : " => ");
    if (!GenTypeDecl(OwnerBuffer, ReturnValue, RefTypes))
    {
        return false;
    }

    for (auto Type : RefTypes)
    {
        Gen(Type);
    }

    // OwnerBuffer << "    " << LocalBuffer.Buffer << ";\n";
    return true;
}

static bool GenTemplateBindingFunction(FStringBuffer& OwnerBuffer, PUERTS_NAMESPACE::NamedFunctionInfo* Func, bool IsStatic)
{
    if (IsStatic)
    {
        OwnerBuffer << "static ";
    }
    OwnerBuffer << Func->Name << "(";
    GenArgumentsForFunctionInfo(Func->Type, OwnerBuffer);
    const auto Return = Func->Type->Return();
    OwnerBuffer << ") : " << GetNamePrefix(Return) << GetName(Return);

    return true;
}

FTypeScriptDeclarationGenerator::FunctionOutputs& FTypeScriptDeclarationGenerator::GetFunctionOutputs(UStruct* Struct)
{
    return AllFuncionOutputs[Struct];
}

FTypeScriptDeclarationGenerator::FunctionOverloads& FTypeScriptDeclarationGenerator::GetFunctionOverloads(
    FunctionOutputs& Outputs, const FString& FunctionName, bool IsStatic)
{
    return Outputs[FunctionKey(FunctionName, IsStatic)];
}

void FTypeScriptDeclarationGenerator::TryToAddOverload(
    FunctionOutputs& Outputs, const FString& FunctionName, bool IsStatic, const FString& Overload)
{
    FunctionOverloads& Overloads = GetFunctionOverloads(Outputs, FunctionName, IsStatic);
    if (!Overloads.Contains(Overload))
    {
        Overloads.Add(Overload);
    }
}

void FTypeScriptDeclarationGenerator::GatherExtensions(UStruct* Struct, FStringBuffer& Buff)
{
    FunctionOutputs& Outputs = GetFunctionOutputs(Struct);
    auto ClassDefinition = PUERTS_NAMESPACE::FindClassByType(Struct);
    if (ClassDefinition)
    {
        PUERTS_NAMESPACE::NamedFunctionInfo* FunctionInfo = ClassDefinition->FunctionInfos;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Type)
        {
            FStringBuffer Tmp;
            GenTemplateBindingFunction(Tmp, FunctionInfo, true);
            TryToAddOverload(Outputs, FunctionInfo->Name, true, Tmp.Buffer);
            ++FunctionInfo;
        }

        PUERTS_NAMESPACE::NamedFunctionInfo* MethodInfo = ClassDefinition->MethodInfos;
        while (MethodInfo && MethodInfo->Name && MethodInfo->Type)
        {
            FStringBuffer Tmp;
            GenTemplateBindingFunction(Tmp, MethodInfo, false);
            TryToAddOverload(Outputs, MethodInfo->Name, false, Tmp.Buffer);
            ++MethodInfo;
        }

        PUERTS_NAMESPACE::NamedPropertyInfo* PropertyInfo = ClassDefinition->PropertyInfos;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Type)
        {
            if (Struct->FindPropertyByName(UTF8_TO_TCHAR(PropertyInfo->Name)))
            {
                ++PropertyInfo;
                continue;
            }
            Buff << "    " << PropertyInfo->Name << ": " << GetNamePrefix(PropertyInfo->Type) << PropertyInfo->Type->Name()
                 << ";\n";
            ++PropertyInfo;
        }

        PUERTS_NAMESPACE::NamedPropertyInfo* VariableInfo = ClassDefinition->VariableInfos;
        while (VariableInfo && VariableInfo->Name && VariableInfo->Type)
        {
            int Pos = VariableInfo - ClassDefinition->VariableInfos;
            Buff << "    static " << (ClassDefinition->Variables[Pos].Setter ? "" : "readonly ") << VariableInfo->Name << ": "
                 << GetNamePrefix(VariableInfo->Type) << VariableInfo->Type->Name() << ";\n";
            ++VariableInfo;
        }
    }

    auto ExtensionMethodsIter = ExtensionMethodsMap.find(Struct);
    if (ExtensionMethodsIter != ExtensionMethodsMap.end())
    {
        for (auto Iter = ExtensionMethodsIter->second.begin(); Iter != ExtensionMethodsIter->second.end(); ++Iter)
        {
            UFunction* Function = *Iter;

            FStringBuffer Tmp;
            if (!GenFunction(Tmp, Function, true, false, false, true))
            {
                continue;
            }
            TryToAddOverload(Outputs, Function->GetName(), false, Tmp.Buffer);
        }
    }
}

void FTypeScriptDeclarationGenerator::GenResolvedFunctions(UStruct* Struct, FStringBuffer& Buff)
{
    FunctionOutputs& Outputs = GetFunctionOutputs(Struct);

    for (FunctionOutputs::iterator Iter = Outputs.begin(); Iter != Outputs.end(); ++Iter)
    {
        const FunctionKey& FunctionKey = Iter->first;
        FunctionOverloads& Overloads = Outputs[FunctionKey];
        for (FunctionOverloads::RangedForIteratorType OverloadIter = Overloads.begin(); OverloadIter != Overloads.end();
             ++OverloadIter)
        {
            if (auto Class = Cast<UClass>(Struct))
            {
                if (auto Function = Class->FindFunctionByName(*FunctionKey.FunctionName))
                {
                    FString DocString = Function->GetMetaData(TEXT("ToolTip"));
                    if (!DocString.IsEmpty())
                    {
                        DocString = DocString.Replace(TEXT("/"), TEXT("_"));
                        Buff << "    /*\n";
                        FStringBuffer tmp;
                        tmp << DocString << "\n";
                        Buff.Indent(4);
                        Buff.Prefix.AppendChar(' ');
                        Buff.Prefix.AppendChar('*');
                        Buff << tmp;
                        Buff.Indent(-6);
                        Buff << "     */\n";
                    }
                }
            }
            Buff << "    " << *OverloadIter << ";\n";
        }

        UStruct* SuperStruct = Struct->GetSuperStruct();
        while (SuperStruct != nullptr)
        {
            FunctionOutputs& SuperOutputs = GetFunctionOutputs(SuperStruct);
            FunctionOutputs::iterator SuperOutputsIter = SuperOutputs.find(FunctionKey);
            if (SuperOutputsIter != SuperOutputs.end())
            {
                FunctionOverloads& SuperOverloads = SuperOutputsIter->second;
                for (FunctionOverloads::RangedForIteratorType SuperOverloadIter = SuperOverloads.begin();
                     SuperOverloadIter != SuperOverloads.end(); ++SuperOverloadIter)
                {
                    if (!Overloads.Contains(*SuperOverloadIter))
                    {
                        Buff << "    /**\n";
                        Buff << "     * @deprecated Unsupported super overloads.\n";
                        Buff << "     */\n";
                        Buff << "    " << *SuperOverloadIter << ";\n";
                    }
                }
            }
            SuperStruct = SuperStruct->GetSuperStruct();
        }
    }
}

static uint32_t GetSameNameSuperCount(UStruct* InStruct)
{
    uint32_t SameNameParentCount = 0;
    UStruct* Super = InStruct->GetSuperStruct();
    while (Super)
    {
        if (Super->GetFName() == InStruct->GetFName())
        {
            ++SameNameParentCount;
        }
        Super = Super->GetSuperStruct();
    }
    return SameNameParentCount;
}

void FTypeScriptDeclarationGenerator::GenClass(UClass* Class)
{
    FStringBuffer StringBuffer{"", ""};
    const FString SafeClassName =
        Class->IsNative() ? SafeName(Class->GetName()) : PUERTS_NAMESPACE::FilenameToTypeScriptVariableName(Class->GetName());
    StringBuffer << "class " << SafeClassName;

    auto Super = Class->GetSuperStruct();

    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << GetNameWithNamespace(Super);
    }

    StringBuffer << " {\n";

    StringBuffer << "    constructor(Outer?: Object, Name?: string, ObjectFlags?: number);\n";

    TSet<FString> AddedProperties;

    for (TFieldIterator<PropertyMacro> PropertyIt(Class, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;

        if (AddedProperties.Contains(Property->GetName()))
        {
            continue;
        }
        AddedProperties.Add(Property->GetName());

        FStringBuffer TmpBuff;
        FString SN = Property->GetName();
#ifdef PUERTS_WITH_EDITOR_SUFFIX
        if (Property->IsEditorOnlyProperty())
        {
            SN += EditorOnlyPropertySuffix;
        }
#endif
        TmpBuff << SafeFieldName(SN) << ": ";
        TArray<UObject*> RefTypesTmp;
        if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
        {
            continue;
        }
        for (auto Type : RefTypesTmp)
        {
            Gen(Type);
        }
        StringBuffer << "    " << TmpBuff << ";\n";
    }

    FunctionOutputs& Outputs = GetFunctionOutputs(Class);
    for (TFieldIterator<UFunction> FunctionIt(Class, EFieldIteratorFlags::ExcludeSuper); FunctionIt; ++FunctionIt)
    {
        FStringBuffer TmpBuff;
        if (!GenFunction(TmpBuff, *FunctionIt))
        {
            continue;
        }
        TryToAddOverload(Outputs, FunctionIt->GetName(), (FunctionIt->FunctionFlags & FUNC_Static) != 0, TmpBuff.Buffer);
    }

    for (int i = 0; i < Class->Interfaces.Num(); i++)
    {
        for (TFieldIterator<UFunction> FunctionIt(Class->Interfaces[i].Class, EFieldIteratorFlags::IncludeSuper); FunctionIt;
             ++FunctionIt)
        {
            FStringBuffer TmpBuff;
            if (!GenFunction(TmpBuff, *FunctionIt))
            {
                continue;
            }
            if (FunctionIt->GetName().Contains("ExecuteUbergraph"))
            {
                continue;
            }
            TryToAddOverload(Outputs, FunctionIt->GetName(), (FunctionIt->FunctionFlags & FUNC_Static) != 0, TmpBuff.Buffer);
        }
    }

    GatherExtensions(Class, StringBuffer);

    GenResolvedFunctions(Class, StringBuffer);

    StringBuffer << "    static StaticClass(): Class;\n";
    StringBuffer << "    static Find(OrigInName: string, Outer?: Object): " << SafeClassName << ";\n";
    StringBuffer << "    static Load(InName: string): " << SafeClassName << ";\n\n";
    StringBuffer << FString::Printf(TEXT("    __tid_%s_%d__: boolean;\n"), *SafeClassName, GetSameNameSuperCount(Class));

    StringBuffer << "}\n\n";

    WriteOutput(Class, StringBuffer);
}

void FTypeScriptDeclarationGenerator::GenEnum(UEnum* Enum)
{
    FStringBuffer StringBuffer{"", ""};

    const FString SafeEnumName =
        Enum->IsNative() ? SafeName(Enum->GetName()) : PUERTS_NAMESPACE::FilenameToTypeScriptVariableName(Enum->GetName());

    TArray<FString> EnumListerrals;
    for (int i = 0; i < Enum->NumEnums(); ++i)
    {
        auto Name = Enum->IsA<UUserDefinedEnum>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                  Enum->GetAuthoredNameStringByIndex(i)
#else
                                                  Enum->GetDisplayNameTextByIndex(i).ToString()
#endif
                                                  : Enum->GetNameStringByIndex(i);
        // auto Value = Enum->GetValueByIndex(i);
        auto FirstChar = Name[0];
        if (FirstChar >= (TCHAR) '0' && FirstChar <= (TCHAR) '9')
        {
            continue;
        }
        EnumListerrals.Add(SafeFieldName(Name, false));
    }
    EnumListerrals.Add(TEXT("__typeKeyDoNoAccess"));

    StringBuffer << "enum " << SafeEnumName << " { " << FString::Join(EnumListerrals, TEXT(", "));

    if (Enum == StaticEnum<EObjectTypeQuery>())
    {
        UCollisionProfile* CollisionProfile = UCollisionProfile::Get();
        int32 ContainerIndex = 0;
        while (true)
        {
            FName ChannelName = CollisionProfile->ReturnChannelNameFromContainerIndex(ContainerIndex);
            if (ChannelName == NAME_None)
            {
                break;
            }
            auto ObjectType = CollisionProfile->ConvertToObjectType((ECollisionChannel) ContainerIndex);
            if (ObjectType != EObjectTypeQuery::ObjectTypeQuery_MAX)
            {
                StringBuffer << FString::Printf(TEXT(", %s = %d"), *SafeName(ChannelName.ToString()), ObjectType);
            }
            ContainerIndex++;
        }
    }
    else if (Enum == StaticEnum<ETraceTypeQuery>())
    {
        UCollisionProfile* CollisionProfile = UCollisionProfile::Get();
        int32 ContainerIndex = 0;
        while (true)
        {
            FName ChannelName = CollisionProfile->ReturnChannelNameFromContainerIndex(ContainerIndex);
            if (ChannelName == NAME_None)
            {
                break;
            }
            auto TraceType = CollisionProfile->ConvertToTraceType((ECollisionChannel) ContainerIndex);
            if (TraceType != ETraceTypeQuery::TraceTypeQuery_MAX)
            {
                StringBuffer << FString::Printf(TEXT(", %s = %d"), *SafeName(ChannelName.ToString()), TraceType);
            }
            ContainerIndex++;
        }
    }

    StringBuffer << "}\n";

    WriteOutput(Enum, StringBuffer);
}

void FTypeScriptDeclarationGenerator::GenStruct(UStruct* Struct)
{
    FStringBuffer StringBuffer{"", ""};
    const FString SafeStructName =
        Struct->IsNative() ? SafeName(Struct->GetName()) : PUERTS_NAMESPACE::FilenameToTypeScriptVariableName(Struct->GetName());
    StringBuffer << "class " << SafeStructName;

    auto Super = Struct->GetSuperStruct();

    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << GetNameWithNamespace(Super);
    }

    StringBuffer << " {\n";

    if (const auto UserDefinedStruct = Cast<UUserDefinedStruct>(Struct))
    {
        if (UserDefinedStruct->Status == UDSS_Error)
        {
            UE_LOG(LogTemp, Error, TEXT("User Defined Struct %s has error:%s"), *UserDefinedStruct->GetName(),
                *UserDefinedStruct->ErrorMessage);
            StringBuffer << "}\n\n";
            WriteOutput(Struct, StringBuffer);
            return;
        }
    }

    auto GenConstrutor = [&]()
    {
        auto ClassDefinition = PUERTS_NAMESPACE::FindClassByType(Struct);
        if (ClassDefinition && ClassDefinition->ConstructorInfos)
        {
            PUERTS_NAMESPACE::NamedFunctionInfo* ConstructorInfo = ClassDefinition->ConstructorInfos;
            while (ConstructorInfo && ConstructorInfo->Name && ConstructorInfo->Type)
            {
                FStringBuffer Tmp;
                Tmp << "constructor(";
                GenArgumentsForFunctionInfo(ConstructorInfo->Type, Tmp);
                Tmp << ")";
                StringBuffer << "    " << Tmp.Buffer << ";\n";
                for (unsigned int i = 0; i < ConstructorInfo->Type->ArgumentCount(); i++)
                {
                    auto argInfo = ConstructorInfo->Type->Argument(i);
                    if (argInfo->IsUEType())
                    {
                        UScriptStruct* UsedStruct = PUERTS_NAMESPACE::FindAnyType<UScriptStruct>(UTF8_TO_TCHAR(argInfo->Name()));
                        if (UsedStruct)
                            Gen(UsedStruct);
                    }
                }
                ++ConstructorInfo;
            }
            return;
        }
        FStringBuffer TmpBuff;
        TmpBuff << "constructor(";
        bool First = true;
        bool HasProperty = false;
        for (TFieldIterator<PropertyMacro> PropertyIt(Struct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
        {
            auto Property = *PropertyIt;
            if (First)
            {
                First = false;
            }
            else
            {
                TmpBuff << ", ";
            }
            TmpBuff << SafeName(Struct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                  Property->GetAuthoredName()
#else
                                                                  Property->GetDisplayNameText().ToString()
#endif
                                                                  : Property->GetName())
                    << ": ";
            TArray<UObject*> RefTypesTmp;
            if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
            {
                return;
            }
            HasProperty = true;
        }
        TmpBuff << ")";
        if (HasProperty)
            StringBuffer << "    constructor();\n";
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    };
    GenConstrutor();

    for (TFieldIterator<PropertyMacro> PropertyIt(Struct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        FStringBuffer TmpBuff;
        FString SN = SafeFieldName(Struct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                     Property->GetAuthoredName()
#else
                                                                     Property->GetDisplayNameText().ToString()
#endif
                                                                     : Property->GetName());
        TmpBuff << SN << ": ";
        TArray<UObject*> RefTypesTmp;
        if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
        {
            continue;
        }
        for (auto Type : RefTypesTmp)
        {
            Gen(Type);
        }
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    }

    GatherExtensions(Struct, StringBuffer);

    GenResolvedFunctions(Struct, StringBuffer);

    StringBuffer << "    /**\n";
    StringBuffer << "     * @deprecated use StaticStruct instead.\n";
    StringBuffer << "     */\n";
    StringBuffer << "    static StaticClass(): ScriptStruct;\n";
    StringBuffer << "    static StaticStruct(): ScriptStruct;\n";
    // https://github.com/Tencent/puerts/commit/1f6be35dbfa73572a0ffb221f788137580871c4e
    // remove private for UClass
    StringBuffer << FString::Printf(TEXT("    __tid_%s_%d__: boolean;\n"), *SafeStructName, GetSameNameSuperCount(Struct));
    StringBuffer << "}\n\n";

    WriteOutput(Struct, StringBuffer);
}

void FTypeScriptDeclarationGenerator::End()
{
    Output.Indent(-4);
    Output << "}\n";
}

FString FTypeScriptDeclarationGenerator::ToString()
{
    return Output.Buffer;
}

class FToolBarBuilder;

#define LOCTEXT_NAMESPACE "FGenDTSModule"

class FDeclarationGenerator : public IDeclarationGenerator
{
private:
    TSharedPtr<class FUICommandList> PluginCommands;
    TUniquePtr<FAutoConsoleCommand> ConsoleCommand;

#if (ENGINE_MAJOR_VERSION >= 5)
    void RegisterMenus()
    {
        // Owner will be used for cleanup in call to UToolMenus::UnregisterOwner
        FToolMenuOwnerScoped OwnerScoped(this);

        {
            UToolMenu* Menu = UToolMenus::Get()->ExtendMenu("LevelEditor.MainMenu.Window");
            {
                FToolMenuSection& Section = Menu->FindOrAddSection("User");
                if (&Section == nullptr)
                {
                    Section = Menu->FindOrAddSection("WindowLayout");
                }
                {
                    Section.AddMenuEntryWithCommandList(FGenDTSCommands::Get().PluginAction, PluginCommands);
                }
            }
        }

        {
            UToolMenu* ToolbarMenu = UToolMenus::Get()->ExtendMenu("LevelEditor.LevelEditorToolBar.User");
            if (ToolbarMenu == nullptr)
            {
                ToolbarMenu = UToolMenus::Get()->ExtendMenu("LevelEditor.LevelEditorToolBar.PlayToolBar");
            }
            {
                FToolMenuSection& Section = ToolbarMenu->FindOrAddSection("PluginTools");
                {
                    FToolMenuEntry& Entry =
                        Section.AddEntry(FToolMenuEntry::InitToolBarButton(FGenDTSCommands::Get().PluginAction));
                    Entry.SetCommandList(PluginCommands);
                }
            }
        }
    }
#else
    void AddToolbarExtension(FToolBarBuilder& Builder)
    {
        Builder.AddToolBarButton(FGenDTSCommands::Get().PluginAction);
    }
#endif

    void GenUeDts(bool InGenFull, FName InSearchPath)
    {
        GenTypeScriptDeclaration(InGenFull, InSearchPath);

        TArray<UObject*> SortedClasses(GetSortedClasses());
        for (int i = 0; i < SortedClasses.Num(); ++i)
        {
            UClass* Class = Cast<UClass>(SortedClasses[i]);
            if (Class && Class->ImplementsInterface(UCodeGenerator::StaticClass()))
            {
                ICodeGenerator::Execute_Gen(Class->GetDefaultObject());
            }
        }

        FName PackagePath = (InSearchPath == NAME_None) ? FName(TEXT("/Game")) : InSearchPath;

        FString DialogMessage = FString::Printf(TEXT("genertate finish, %s store in %s, ([PATH=%s])"), TEXT("ue.d.ts"),
            TEXT("Content/Typing/ue"), *PackagePath.ToString());

        FText DialogText = FText::Format(LOCTEXT("PluginButtonDialogText", "{0}"), FText::FromString(DialogMessage));
        // FMessageDialog::Open(EAppMsgType::Ok, DialogText);
        FNotificationInfo Info(DialogText);
        Info.bFireAndForget = true;
        Info.FadeInDuration = 0.0f;
        Info.FadeOutDuration = 5.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
    }

    void GenUeDtsCallback()
    {
        GenUeDts(false, NAME_None);
    }

public:
    void StartupModule() override
    {
        // IModularFeatures::Get().RegisterModularFeature(TEXT("ScriptGenerator"), this);
        FGenDTSStyle::Initialize();
        FGenDTSStyle::ReloadTextures();

        FGenDTSCommands::Register();

        PluginCommands = MakeShareable(new FUICommandList);

        PluginCommands->MapAction(FGenDTSCommands::Get().PluginAction,
            FExecuteAction::CreateRaw(this, &FDeclarationGenerator::GenUeDtsCallback), FCanExecuteAction());

#if (ENGINE_MAJOR_VERSION >= 5)
        UToolMenus::RegisterStartupCallback(
            FSimpleMulticastDelegate::FDelegate::CreateRaw(this, &FDeclarationGenerator::RegisterMenus));
#else
        FLevelEditorModule& LevelEditorModule = FModuleManager::LoadModuleChecked<FLevelEditorModule>("LevelEditor");

        {
            TSharedPtr<FExtender> ToolbarExtender = MakeShareable(new FExtender);
            ToolbarExtender->AddToolBarExtension("Settings", EExtensionHook::After, PluginCommands,
                FToolBarExtensionDelegate::CreateRaw(this, &FDeclarationGenerator::AddToolbarExtension));

            LevelEditorModule.GetToolBarExtensibilityManager()->AddExtender(ToolbarExtender);
        }
#endif

        ConsoleCommand = MakeUnique<FAutoConsoleCommand>(TEXT("Puerts.Gen"), TEXT("Execute GenDTS action"),
            FConsoleCommandWithArgsDelegate::CreateLambda(
                [this](const TArray<FString>& Args)
                {
                    bool GenFull = false;
                    FName SearchPath = NAME_None;

                    for (auto& Arg : Args)
                    {
                        if (Arg.ToUpper().Equals(TEXT("FULL")))
                        {
                            GenFull = true;
                        }
                        else if (Arg.StartsWith(TEXT("PATH=")))
                        {
                            SearchPath = *Arg.Mid(5);
                        }
                    }
                    this->GenUeDts(GenFull, SearchPath);
                }));
    }

    void ShutdownModule() override
    {
        // IModularFeatures::Get().UnregisterModularFeature(TEXT("ScriptGenerator"), this);
#if (ENGINE_MAJOR_VERSION >= 5)
        UToolMenus::UnRegisterStartupCallback(this);
#endif
        FGenDTSStyle::Shutdown();
        FGenDTSCommands::Unregister();
    }

    void GenTypeScriptDeclaration(bool InGenFull, FName InSearchPath) override
    {
        FTypeScriptDeclarationGenerator TypeScriptDeclarationGenerator;
        TypeScriptDeclarationGenerator.RestoreBlueprintTypeDeclInfos(InGenFull);
        TypeScriptDeclarationGenerator.LoadAllWidgetBlueprint(InSearchPath, InGenFull);
        TypeScriptDeclarationGenerator.GenTypeScriptDeclaration(true, true);
    }

    void GenReactDeclaration() override
    {
    }

    /*
    virtual FString GetGeneratedCodeModuleName() const override
    {
        return TEXT("Engine");
    }

    virtual bool SupportsTarget(const FString& TargetName) const override
    {
        return true;
    }

    virtual bool ShouldExportClassesForModule(const FString& ModuleName, EBuildModuleType::Type ModuleType, const FString&
ModuleGeneratedIncludeDirectory) const override
    {
        return ModuleName != TEXT("JsEnv");
    }

    virtual void Initialize(const FString& RootLocalPath, const FString& RootBuildPath, const FString& OutputDirectory, const
FString& IncludeBase) override
    {
        TypeScriptDeclarationGenerator.Begin();
    }

    virtual void ExportClass(class UClass* Class, const FString& SourceHeaderFilename, const FString& GeneratedHeaderFilename, bool
bHasChanged) override
    {
#if WITH_EDITOR || HACK_HEADER_GENERATOR
        static FName MainObjectTag("TGameJSMainObject");
        if(Class->HasMetaData(MainObjectTag))
#endif
        {
            TypeScriptDeclarationGenerator.Gen(Class);
        }
    }

    virtual void FinishExport() override
    {
        TypeScriptDeclarationGenerator.End();
        FString Path = ANSI_TO_TCHAR(STRINGIZE_VALUE_OF(DECL_OUTPUT_PATH));
        Path += TEXT("/ue.d.ts");
        //printf(">>>>>>>>>>>>save to %s\n\n", TCHAR_TO_ANSI(*Path));
        FFileHelper::SaveStringToFile(TypeScriptDeclarationGenerator.ToString(), *Path);
    }

    virtual FString GetGeneratorName() const override
    {
        return TEXT("(TypeScript | Kotlin)Declaration Generator Plugin");
    }
    */
};

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FDeclarationGenerator, DeclarationGenerator)
