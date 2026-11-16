#include "PuertsTestBlueprintUtils.h"

#include "Runtime/Launch/Resources/Version.h"

#if WITH_EDITOR
#include "EdGraphSchema_K2.h"
#include "Engine/Blueprint.h"
#include "Engine/BlueprintGeneratedClass.h"
#include "Kismet2/BlueprintEditorUtils.h"
#include "Kismet2/KismetEditorUtilities.h"
#include "Kismet2/StructureEditorUtils.h"
#include "UObject/Package.h"
#include "UserDefinedStructure/UserDefinedStructEditorData.h"
#if (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 5) || ENGINE_MAJOR_VERSION > 5
#include "StructUtils/UserDefinedStruct.h"
#else
#include "Engine/UserDefinedStruct.h"
#endif

namespace
{
bool MakePinType(const FString& Type, FEdGraphPinType& Out)
{
    Out = FEdGraphPinType();
    if (Type == TEXT("int"))
    {
        Out.PinCategory = UEdGraphSchema_K2::PC_Int;
    }
    else if (Type == TEXT("string"))
    {
        Out.PinCategory = UEdGraphSchema_K2::PC_String;
    }
    else if (Type == TEXT("bool"))
    {
        Out.PinCategory = UEdGraphSchema_K2::PC_Boolean;
    }
    else if (Type == TEXT("float"))
    {
#if ENGINE_MAJOR_VERSION >= 5
        Out.PinCategory = UEdGraphSchema_K2::PC_Real;
        Out.PinSubCategory = UEdGraphSchema_K2::PC_Float;
#else
        Out.PinCategory = UEdGraphSchema_K2::PC_Float;
#endif
    }
    else if (Type == TEXT("object"))
    {
        Out.PinCategory = UEdGraphSchema_K2::PC_Object;
        Out.PinSubCategoryObject = UObject::StaticClass();
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("PuertsTestBlueprintUtils: unknown type %s"), *Type);
        return false;
    }
    return true;
}

// a package /Temp/<Prefix>_<N> that does not exist yet, transient (never saved)
UPackage* NewTempPackage(const TCHAR* Prefix, FString& OutName)
{
    static int32 Counter = 0;
    FString PackageName;
    do
    {
        OutName = FString::Printf(TEXT("%s_%d"), Prefix, ++Counter);
        PackageName = FString::Printf(TEXT("/Temp/%s"), *OutName);
    } while (FindPackage(nullptr, *PackageName));
    UPackage* Package = CreatePackage(*PackageName);
    Package->SetFlags(RF_Transient);
    return Package;
}

UBlueprint* BlueprintOf(UClass* Class)
{
    return Class ? UBlueprint::GetBlueprintFromClass(Class) : nullptr;
}

// the gc runs between the steps of a test, not in the middle of a script call
UClass* Compile(UBlueprint* Blueprint)
{
    if (!Blueprint)
    {
        return nullptr;
    }
    FKismetEditorUtilities::CompileBlueprint(Blueprint, EBlueprintCompileOptions::SkipGarbageCollection);
    if (Blueprint->Status == BS_Error)
    {
        UE_LOG(LogTemp, Error, TEXT("PuertsTestBlueprintUtils: failed to compile %s"), *Blueprint->GetName());
        return nullptr;
    }
    return Blueprint->GeneratedClass;
}

FStructVariableDescription* FindVar(UUserDefinedStruct* Struct, const FString& Name)
{
    if (!Struct)
    {
        return nullptr;
    }
    for (FStructVariableDescription& Desc : FStructureEditorUtils::GetVarDesc(Struct))
    {
        if (Desc.FriendlyName == Name)
        {
            return &Desc;
        }
    }
    return nullptr;
}

FProperty* FindOwnProperty(UStruct* Struct, const FString& Name)
{
    if (!Struct)
    {
        return nullptr;
    }
    for (TFieldIterator<FProperty> It(Struct, EFieldIteratorFlags::ExcludeSuper); It; ++It)
    {
        if (Struct->GetAuthoredNameForField(*It) == Name)
        {
            return *It;
        }
    }
    return nullptr;
}
}    // namespace

UClass* UPuertsTestBlueprintUtils::CreateBlueprintClass(UClass* Parent)
{
    if (!Parent || !FKismetEditorUtilities::CanCreateBlueprintOfClass(Parent))
    {
        return nullptr;
    }
    FString Name;
    UPackage* Package = NewTempPackage(TEXT("PuertsTestBP"), Name);
    UBlueprint* Blueprint = FKismetEditorUtilities::CreateBlueprint(
        Parent, Package, FName(*Name), BPTYPE_Normal, UBlueprint::StaticClass(), UBlueprintGeneratedClass::StaticClass());
    return Compile(Blueprint);
}

UClass* UPuertsTestBlueprintUtils::AddClassVariable(UClass* Class, const FString& Name, const FString& Type)
{
    UBlueprint* Blueprint = BlueprintOf(Class);
    FEdGraphPinType PinType;
    if (!Blueprint || !MakePinType(Type, PinType) || !FBlueprintEditorUtils::AddMemberVariable(Blueprint, FName(*Name), PinType))
    {
        return nullptr;
    }
    return Compile(Blueprint);
}

UClass* UPuertsTestBlueprintUtils::RemoveClassVariable(UClass* Class, const FString& Name)
{
    UBlueprint* Blueprint = BlueprintOf(Class);
    if (!Blueprint || FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, FName(*Name)) == INDEX_NONE)
    {
        return nullptr;
    }
    FBlueprintEditorUtils::RemoveMemberVariable(Blueprint, FName(*Name));
    return Compile(Blueprint);
}

UClass* UPuertsTestBlueprintUtils::ChangeClassVariableType(UClass* Class, const FString& Name, const FString& Type)
{
    UBlueprint* Blueprint = BlueprintOf(Class);
    FEdGraphPinType PinType;
    if (!Blueprint || !MakePinType(Type, PinType) ||
        FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, FName(*Name)) == INDEX_NONE)
    {
        return nullptr;
    }
    FBlueprintEditorUtils::ChangeMemberVariableType(Blueprint, FName(*Name), PinType);
    return Compile(Blueprint);
}

UClass* UPuertsTestBlueprintUtils::RecompileClass(UClass* Class)
{
    return Compile(BlueprintOf(Class));
}

UScriptStruct* UPuertsTestBlueprintUtils::CreateUserStruct(const FString& Name, const FString& Type)
{
    FString StructName;
    UPackage* Package = NewTempPackage(TEXT("PuertsTestUDS"), StructName);
    UUserDefinedStruct* Struct =
        FStructureEditorUtils::CreateUserDefinedStruct(Package, FName(*StructName), RF_Public | RF_Standalone | RF_Transactional);
    if (!Struct)
    {
        return nullptr;
    }
    // a new struct has one default member, it becomes Name of Type
    TArray<FStructVariableDescription>& Vars = FStructureEditorUtils::GetVarDesc(Struct);
    if (Vars.Num() != 1)
    {
        return nullptr;
    }
    const FGuid Guid = Vars[0].VarGuid;
    FEdGraphPinType PinType;
    if (!MakePinType(Type, PinType) || !FStructureEditorUtils::RenameVariable(Struct, Guid, Name))
    {
        return nullptr;
    }
    if (FStructureEditorUtils::GetVarDesc(Struct)[0].ToPinType() != PinType &&
        !FStructureEditorUtils::ChangeVariableType(Struct, Guid, PinType))
    {
        return nullptr;
    }
    return Struct;
}

bool UPuertsTestBlueprintUtils::AddUserStructVariable(UScriptStruct* Struct, const FString& Name, const FString& Type)
{
    UUserDefinedStruct* UserStruct = Cast<UUserDefinedStruct>(Struct);
    FEdGraphPinType PinType;
    if (!UserStruct || FindVar(UserStruct, Name) || !MakePinType(Type, PinType) ||
        !FStructureEditorUtils::AddVariable(UserStruct, PinType))
    {
        return false;
    }
    const FGuid Guid = FStructureEditorUtils::GetVarDesc(UserStruct).Last().VarGuid;
    return FStructureEditorUtils::RenameVariable(UserStruct, Guid, Name);
}

bool UPuertsTestBlueprintUtils::RemoveUserStructVariable(UScriptStruct* Struct, const FString& Name)
{
    UUserDefinedStruct* UserStruct = Cast<UUserDefinedStruct>(Struct);
    FStructVariableDescription* Var = FindVar(UserStruct, Name);
    return Var && FStructureEditorUtils::RemoveVariable(UserStruct, Var->VarGuid);
}

bool UPuertsTestBlueprintUtils::RenameUserStructVariable(UScriptStruct* Struct, const FString& Name, const FString& NewName)
{
    UUserDefinedStruct* UserStruct = Cast<UUserDefinedStruct>(Struct);
    FStructVariableDescription* Var = FindVar(UserStruct, Name);
    return Var && FStructureEditorUtils::RenameVariable(UserStruct, Var->VarGuid, NewName);
}

bool UPuertsTestBlueprintUtils::ChangeUserStructVariableType(UScriptStruct* Struct, const FString& Name, const FString& Type)
{
    UUserDefinedStruct* UserStruct = Cast<UUserDefinedStruct>(Struct);
    FStructVariableDescription* Var = FindVar(UserStruct, Name);
    FEdGraphPinType PinType;
    return Var && MakePinType(Type, PinType) && FStructureEditorUtils::ChangeVariableType(UserStruct, Var->VarGuid, PinType);
}

bool UPuertsTestBlueprintUtils::HasOwnProperty(UStruct* Struct, const FString& Name)
{
    return FindOwnProperty(Struct, Name) != nullptr;
}

FString UPuertsTestBlueprintUtils::PropertyTypeOf(UStruct* Struct, const FString& Name)
{
    FProperty* Property = FindOwnProperty(Struct, Name);
    return Property ? Property->GetClass()->GetName() : FString();
}

#else

UClass* UPuertsTestBlueprintUtils::CreateBlueprintClass(UClass* Parent)
{
    return nullptr;
}

UClass* UPuertsTestBlueprintUtils::AddClassVariable(UClass* Class, const FString& Name, const FString& Type)
{
    return nullptr;
}

UClass* UPuertsTestBlueprintUtils::RemoveClassVariable(UClass* Class, const FString& Name)
{
    return nullptr;
}

UClass* UPuertsTestBlueprintUtils::ChangeClassVariableType(UClass* Class, const FString& Name, const FString& Type)
{
    return nullptr;
}

UClass* UPuertsTestBlueprintUtils::RecompileClass(UClass* Class)
{
    return nullptr;
}

UScriptStruct* UPuertsTestBlueprintUtils::CreateUserStruct(const FString& Name, const FString& Type)
{
    return nullptr;
}

bool UPuertsTestBlueprintUtils::AddUserStructVariable(UScriptStruct* Struct, const FString& Name, const FString& Type)
{
    return false;
}

bool UPuertsTestBlueprintUtils::RemoveUserStructVariable(UScriptStruct* Struct, const FString& Name)
{
    return false;
}

bool UPuertsTestBlueprintUtils::RenameUserStructVariable(UScriptStruct* Struct, const FString& Name, const FString& NewName)
{
    return false;
}

bool UPuertsTestBlueprintUtils::ChangeUserStructVariableType(UScriptStruct* Struct, const FString& Name, const FString& Type)
{
    return false;
}

bool UPuertsTestBlueprintUtils::HasOwnProperty(UStruct* Struct, const FString& Name)
{
    return false;
}

FString UPuertsTestBlueprintUtils::PropertyTypeOf(UStruct* Struct, const FString& Name)
{
    return FString();
}

#endif
