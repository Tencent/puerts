#include "TypeScriptCompilerContext.h"
#include "TypeScriptGeneratedClass.h"

#include "Kismet2/KismetReinstanceUtilities.h"
#include "KismetCompilerMisc.h"

#include "Runtime/Launch/Resources/Version.h"

FTypeScriptCompilerContext::FTypeScriptCompilerContext(
	UBlueprint* SourceSketch,
	FCompilerResultsLog& MessageLog,
	const FKismetCompilerOptions& CompilerOptions)
#if (ENGINE_MAJOR_VERSION <= 4) & (ENGINE_MINOR_VERSION <= 21)
	: Super(SourceSketch, MessageLog, CompilerOptions, nullptr)
#else
	: Super(SourceSketch, MessageLog, CompilerOptions)
#endif
{
}

void FTypeScriptCompilerContext::SpawnNewClass(const FString& NewClassName)
{
    if (NewClassName.StartsWith(TEXT("SKEL_")))
    {
        FKismetCompilerContext::SpawnNewClass(NewClassName);
        return;
    }

    NewClass = FindObject<UTypeScriptGeneratedClass>(Blueprint->GetOutermost(), *NewClassName);
    
	if (NewClass == NULL)
	{
		// If the class hasn't been found, then spawn a new one
		NewClass = NewObject<UTypeScriptGeneratedClass>(Blueprint->GetOutermost(), FName(*NewClassName), RF_Public | RF_Transactional);
	}
	else
	{
		// Already existed, but wasn't linked in the Blueprint yet due to load ordering issues
		NewClass->ClassGeneratedBy = Blueprint;
		FBlueprintCompileReinstancer::Create(NewClass);
	}
}

