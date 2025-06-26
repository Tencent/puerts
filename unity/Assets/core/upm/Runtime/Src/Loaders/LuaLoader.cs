
public interface LuaLoader
{
    // string or ArrrayBuffer
    object ReadFile(string filepath, out string debugpath);
}

public class LuaDefaultLoader : LuaLoader
{
    public virtual object ReadFile(string filepath, out string debugpath)
    {
        filepath = filepath.Replace('.', '/');
        if (!filepath.EndsWith(".lua"))
        {
            filepath += ".lua";
            UnityEngine.Debug.Log($"filepath= {filepath}");
        }
        debugpath = filepath;
        UnityEngine.Debug.Log($"debugpath= {debugpath}");
        try
        {
            UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(filepath);
            return (file == null) ? null : file.text;
        }
        catch
        {
            return null;
        }
    }
}
