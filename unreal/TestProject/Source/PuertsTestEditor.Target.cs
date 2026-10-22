using UnrealBuildTool;

public class PuertsTestEditorTarget : TargetRules
{
    public PuertsTestEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("PuertsTest");
    }
}
