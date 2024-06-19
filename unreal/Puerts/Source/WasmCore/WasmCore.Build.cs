/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;

public class WasmCore : ModuleRules
{

	private bool bUObjectHasFastPointerSupport = false; //uobject是否有额外的域,来保存wasm的指针,提高单wasm情况下的性能
	
	public WasmCore(ReadOnlyTargetRules Target) : base(Target)
	{
		if(bUObjectHasFastPointerSupport)
        {
			PublicDefinitions.Add("UOBJECT_HAVE_FAST_WASM_POINTER=1");
		}
		else
        {
			PublicDefinitions.Add("UOBJECT_HAVE_FAST_WASM_POINTER=0");
		}

		//windows平台上加强对指针合法性的校验,防止野指针,有一定性能损失
		if (Target.Platform == UnrealTargetPlatform.Win64)
        {
			PublicDefinitions.Add("WASM_CHECK_POINTER_IS_VALID=1");

		}
		else
        {
			PublicDefinitions.Add("WASM_CHECK_POINTER_IS_VALID=0");
		}


		PublicIncludePaths.AddRange(
			new string[] {
				ModuleDirectory + "/Public",
				ModuleDirectory + "/ThirdPart/wasm3"
				// ... add public include paths required here ...
			}
			);

		
		PrivateIncludePaths.AddRange(
			new string[] {
				"WasmCore/Private"
				// ... add other private include paths required here ...
			}
			);

		
		PublicDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
				"CoreUObject",
				"InputCore",
				"Json",
				"RHI",
				// ... add other public dependencies that you statically link with here ...
			}
			);

		
		PrivateDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
				"CoreUObject",
				"Engine",
				"RenderCore",
				"Landscape",
				// ... add private dependencies that you statically link with here ...	
			}
			);

		
		DynamicallyLoadedModuleNames.AddRange(
			new string[]
			{
				// ... add any modules that your module loads dynamically here ...
			}
			);

		PrivateIncludePathModuleNames.AddRange(
		new string[] {
				// ...
			}
		);

		PublicIncludePathModuleNames.AddRange(
		new string[] {
				// ...
			}
		);
	}
}
