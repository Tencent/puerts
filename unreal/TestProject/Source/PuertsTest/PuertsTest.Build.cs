using UnrealBuildTool;

public class PuertsTest : ModuleRules
{
    public PuertsTest(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        bEnableExceptions = true;

        PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "JsEnv" });
        PrivateDependencyModuleNames.AddRange(new string[] { "Json" });
    }
}
