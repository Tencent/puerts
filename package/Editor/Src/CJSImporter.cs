#if UNITY_2018_1_OR_NEWER
using System.IO;
#if UNITY_2020_2_OR_NEWER
using UnityEditor.AssetImporters;
#else
using UnityEditor.Experimental.AssetImporters;
#endif
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

[ScriptedImporter(1, "mjs")]
public class MJSImporter : ScriptedImporter
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
