// Fill out your copyright notice in the Description page of Project Settings.


#include "TemplateBindingGenerator.h"
#include "JSClassRegister.h"
#include "Interfaces/IPluginManager.h"

struct FGenImp
{
	FStringBuffer Output {"", ""};

	void Begin()
	{
		Output << "declare module \"cpp\" {\n";
		Output << "    import {$Ref, $Nullable} from \"puerts\"\n\n";
	}

	void GenArguments(const puerts::CFunctionInfo* Type, FStringBuffer & Buff)
	{
		for(unsigned int i = 0; i < Type->ArgumentCount(); i++)
		{
		    if (i != 0) Buff << ", ";
			auto argInfo = Type->Argument(i);
			
			Buff << FString::Printf(TEXT("p%d"), i) << ": ";
			
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
			
			Buff << Type->Argument(i)->Name();
			
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

	void GenClass(const puerts::JSClassDefinition *ClassDefinition)
	{
		Output << "    class " << ClassDefinition->CPPTypeName;
		if (ClassDefinition->CPPSuperTypeName)
		{
			Output << " extends " << ClassDefinition->CPPSuperTypeName;
		}
		Output << " {\n";

		TSet<FString> AddedFunctions;
		
		puerts::NamedFunctionInfo* ConstructorInfo = ClassDefinition->ConstructorInfos;
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

		puerts::NamedPropertyInfo* PropertyInfo = ClassDefinition->PropertyInfos;
		while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Type)
		{
			Output << "        " << PropertyInfo->Name << ": " << PropertyInfo->Type << ";\n";
			++PropertyInfo;
		}

		puerts::NamedFunctionInfo* FunctionInfo = ClassDefinition->FunctionInfos;
		while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Type)
		{
			FStringBuffer Tmp;
			Tmp << "        static " << FunctionInfo->Name << "(";
			GenArguments(FunctionInfo->Type, Tmp);
			Tmp << ") :" << FunctionInfo->Type->Return()->Name() <<";\n";
			if (!AddedFunctions.Contains(Tmp.Buffer))
			{
				AddedFunctions.Add(Tmp.Buffer);
				Output << Tmp;
			}
			++FunctionInfo;
		}

		puerts::NamedFunctionInfo* MethodInfo = ClassDefinition->MethodInfos;
		while (MethodInfo && MethodInfo->Name && MethodInfo->Type)
		{
			FStringBuffer Tmp;
			Tmp << "        " << MethodInfo->Name << "(";
			GenArguments(MethodInfo->Type, Tmp);
			Tmp << ") :" << MethodInfo->Type->Return()->Name() <<";\n";
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
	
	puerts::ForeachRegisterClass([&](const puerts::JSClassDefinition *ClassDefinition)
	{
		if (ClassDefinition->CPPTypeName)
		{
			Gen.GenClass(ClassDefinition);
		}
	});

	Gen.End();

	FFileHelper::SaveStringToFile(Gen.Output.Buffer, *(IPluginManager::Get().FindPlugin("Puerts")->GetBaseDir() / TEXT("Typing/cpp/index.d.ts")), FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
}
