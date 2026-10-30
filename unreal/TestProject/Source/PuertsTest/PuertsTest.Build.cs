using UnrealBuildTool;

public class PuertsTest : ModuleRules
{
    public PuertsTest(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        bEnableExceptions = true;

        PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "JsEnv", "ScriptEnv", "PapiV8", "PapiQuickjs", "PapiLua", "PapiPython" });
        PrivateDependencyModuleNames.AddRange(new string[] { "Json" });

        if (Target.bBuildEditor)
        {
            // PuertsTestBlueprintUtils: creates, changes and compiles blueprints and user defined structs
            PrivateDependencyModuleNames.AddRange(new string[] { "UnrealEd", "BlueprintGraph", "KismetCompiler", "Kismet" });
        }
    }
}
