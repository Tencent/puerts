// Fill out your copyright notice in the Description page of Project Settings.


#include "TypeScriptBlueprint.h"
#include "TypeScriptGeneratedClass.h"

UClass* UTypeScriptBlueprint::GetBlueprintClass() const
{
    return UTypeScriptGeneratedClass::StaticClass();
}

