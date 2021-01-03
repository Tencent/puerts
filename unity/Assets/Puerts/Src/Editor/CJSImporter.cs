#if UNITY_2018_1_OR_NEWER
using System.IO;
using UnityEditor.Experimental.AssetImporters;
using UnityEngine;
 
[ScriptedImporter(1, "cjs")]
public class CJSImporter : ScriptedImporter
{
    public override void OnImportAsset(AssetImportContext ctx)
    {
        TextAsset subAsset = new TextAsset(File.ReadAllText(ctx.assetPath));
        ctx.AddObjectToAsset("text", subAsset);
        ctx.SetMainObject(subAsset);

#if ENABLE_CJS_AUTO_RELOAD
        Puerts.JsEnv.ClearAllModuleCaches();
#endif
    }
}

#endif
