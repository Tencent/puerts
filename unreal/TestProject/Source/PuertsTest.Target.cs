using UnrealBuildTool;

public class PuertsTestTarget : TargetRules
{
    public PuertsTestTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("PuertsTest");
    }
}
