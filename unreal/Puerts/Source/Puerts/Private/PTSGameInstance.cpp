// Fill out your copyright notice in the Description page of Project Settings.


#include "PTSGameInstance.h"

UPTSGameInstance::UPTSGameInstance():Super()
{
}

void UPTSGameInstance::Init()
{
	Super::Init();
	JsEnv = MakeShared<puerts::FJsEnv>();
	TArray<TPair<FString, UObject*>> Arguments;
	Arguments.Add(TPair<FString, UObject*>(TEXT("PTSGameInstance"), this));
	JsEnv->Start("PTSGameInstanceInitTS", Arguments);
}

void UPTSGameInstance::Shutdown()
{
	Super::Shutdown();
	JsEnv.Reset();
}