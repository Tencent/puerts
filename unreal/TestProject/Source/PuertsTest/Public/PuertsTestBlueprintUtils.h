#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "PuertsTestBlueprintUtils.generated.h"

// Editor helpers for tests/blueprint*: create blueprint classes and user defined structs in the transient /Temp package and
// edit them (add / remove / retype members) the way the blueprint and struct editors do, each edit recompiles the type in
// place (the UClass / UScriptStruct and its full name are kept). Type names: "int", "string", "bool", "float", "object".
// Every function fails (returns nullptr / false / "") without the editor.
UCLASS()
class PUERTSTEST_API UPuertsTestBlueprintUtils : public UObject
{
    GENERATED_BODY()

public:
    // a new blueprint class (with a unique name) derived from Parent, compiled
    UFUNCTION()
    static UClass* CreateBlueprintClass(UClass* Parent);

    // the following edit the blueprint of Class (a class created by CreateBlueprintClass), recompile it and return the
    // generated class after the recompile (nullptr on failure)
    UFUNCTION()
    static UClass* AddClassVariable(UClass* Class, const FString& Name, const FString& Type);

    UFUNCTION()
    static UClass* RemoveClassVariable(UClass* Class, const FString& Name);

    UFUNCTION()
    static UClass* ChangeClassVariableType(UClass* Class, const FString& Name, const FString& Type);

    UFUNCTION()
    static UClass* RecompileClass(UClass* Class);

    // a new user defined struct (with a unique name) with one member Name of Type
    UFUNCTION()
    static UScriptStruct* CreateUserStruct(const FString& Name, const FString& Type);

    // the following edit a struct created by CreateUserStruct (members are found by their display name), the struct is
    // recompiled in place
    UFUNCTION()
    static bool AddUserStructVariable(UScriptStruct* Struct, const FString& Name, const FString& Type);

    UFUNCTION()
    static bool RemoveUserStructVariable(UScriptStruct* Struct, const FString& Name);

    UFUNCTION()
    static bool RenameUserStructVariable(UScriptStruct* Struct, const FString& Name, const FString& NewName);

    UFUNCTION()
    static bool ChangeUserStructVariableType(UScriptStruct* Struct, const FString& Name, const FString& Type);

    // whether Struct (not its super) has a property named Name (for user defined structs: the display name), the C++ side
    // of what the js class exposes
    UFUNCTION()
    static bool HasOwnProperty(UStruct* Struct, const FString& Name);

    // the reflection name of the property type ("IntProperty", ...) of the property Name, "" if there is none
    UFUNCTION()
    static FString PropertyTypeOf(UStruct* Struct, const FString& Name);
};
