
public interface LuaLoader
{
    // string or ArrrayBuffer
    object ReadFile(string filepath, out string debugpath);
}

public class LuaDefaultLoader : LuaLoader
{
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public virtual object ReadFile(string filepath, out string debugpath)
    {
        filepath = filepath.Replace('.', '/');
        debugpath = filepath;
        if (!debugpath.EndsWith(".lua"))
        {
            debugpath += ".lua";
        }
        try
        {
#if PUERTS_GENERAL
            return File.ReadAllText(debugpath);
#else
            UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(filepath);
            return (file == null) ? null : file.text;
#endif
        }
        catch
        {
            return null;
        }
    }
}
