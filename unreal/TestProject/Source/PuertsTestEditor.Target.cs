using UnrealBuildTool;

public class PuertsTestEditorTarget : TargetRules
{
    public PuertsTestEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
#if UE_5_1_OR_LATER
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
#endif
        ExtraModuleNames.Add("PuertsTest");
    }
}
