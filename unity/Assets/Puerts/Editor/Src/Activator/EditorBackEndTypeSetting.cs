using System.IO;
using UnityEngine;
public enum PuertsBackEndType
{
    Nodejs,
    Quickjs,

    V8_Debug,
    V8_Release,
    None
}
public class EditorBackEndTypeSetting : ScriptableObject
{

    [SerializeField]
    [HideInInspector]
    private PuertsBackEndType _backEndType = PuertsBackEndType.Nodejs;
    public PuertsBackEndType backEndType { get { return this._backEndType; } }
    private static EditorBackEndTypeSetting _ins;
    const string puertsEditorEngineBackEndTypeSettingDirPath = "Packages\\com.tencent.puerts.core\\Editor\\UserSettings\\";
    public static EditorBackEndTypeSetting getAsset()
    {
        if (!EditorBackEndTypeSetting._ins)
        {

            var assetFilePath = puertsEditorEngineBackEndTypeSettingDirPath + "EditorBackEndTypeSetting.asset";
            var asset = UnityEditor.AssetDatabase.LoadAssetAtPath<EditorBackEndTypeSetting>(assetFilePath);
            if (!asset)
            {
                asset = EditorBackEndTypeSetting.CreateInstance<EditorBackEndTypeSetting>();
                string directory = Path.GetDirectoryName(assetFilePath);
                if (Directory.Exists(directory) == false)
                    Directory.CreateDirectory(directory);
                UnityEditor.AssetDatabase.CreateAsset(asset, assetFilePath);
                UnityEditor.AssetDatabase.SaveAssets();
                UnityEditor.AssetDatabase.Refresh();
            }
            EditorBackEndTypeSetting._ins = asset;
        }
        return EditorBackEndTypeSetting._ins;

    }
    public static void setCurEditorEngineType(PuertsBackEndType type)
    {

        var asset = _ins;
        if (asset._backEndType == type) return;
        asset._backEndType = type;
        UnityEditor.EditorUtility.SetDirty(asset);
        UnityEditor.AssetDatabase.SaveAssetIfDirty(asset);
        // UnityEditor.AssetDatabase.Refresh();
    }
}