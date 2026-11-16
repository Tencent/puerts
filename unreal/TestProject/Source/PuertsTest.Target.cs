using UnrealBuildTool;

public class PuertsTestTarget : TargetRules
{
    public PuertsTestTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
#if UE_5_1_OR_LATER
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
#endif
        ExtraModuleNames.Add("PuertsTest");
    }
}
