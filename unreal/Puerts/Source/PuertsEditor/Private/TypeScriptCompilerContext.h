#pragma once

#include "CoreMinimal.h"

#include "KismetCompiler.h"


class FTypeScriptCompilerContext final
	: public FKismetCompilerContext
{
	using Super = FKismetCompilerContext;

public:
	FTypeScriptCompilerContext(
		UBlueprint* SourceSketch,
		FCompilerResultsLog& MessageLog,
		const FKismetCompilerOptions& CompilerOptions);

private:
	void SpawnNewClass(const FString& NewClassName) override;
};
