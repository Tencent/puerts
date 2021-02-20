// Fill out your copyright notice in the Description page of Project Settings.


#include "TypeScriptBlueprint.h"
#include "TypeScriptGeneratedClass.h"

#if WITH_EDITOR
UClass* UTypeScriptBlueprint::GetBlueprintClass() const
{
    return UTypeScriptGeneratedClass::StaticClass();
}
#endif
