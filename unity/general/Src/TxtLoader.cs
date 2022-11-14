using System.IO;
using System.Reflection;
using System.Collections.Generic;
using Puerts;

public class TxtLoader : ILoader
{
    public static string PathToBinDir(string appendix)
    {
        return Path.Combine(
            System.Text.RegularExpressions.Regex.Replace(
                Path.GetDirectoryName(Assembly.GetExecutingAssembly().GetName().CodeBase), "^file:(\\\\)?", ""
            ),
            appendix
        );
    }
#if PUER_CONSOLE_TEST
    private string root = PathToBinDir("../../../../package/upm/Runtime/Resources");
    private string editorRoot = PathToBinDir("../../../../package/upm/Editor/Resources");
#else
    private string root = PathToBinDir("../../../package/upm/Runtime/Resources");
    private string editorRoot = PathToBinDir("../../../package/upm/Editor/Resources");
#endif
    public bool FileExists(string filepath)
    {
        return mockFileContent.ContainsKey(filepath) ||
            File.Exists(Path.Combine(root, filepath)) ||
            File.Exists(Path.Combine(editorRoot, filepath));
    }

    public string ReadFile(string filepath, out string debugpath)
    {
        debugpath = Path.Combine(root, filepath);
        if (File.Exists(Path.Combine(editorRoot, filepath)))
        {
            debugpath = Path.Combine(editorRoot, filepath);
        }

        string mockContent;
        if (mockFileContent.TryGetValue(filepath, out mockContent))
        {
            return mockContent;
        }

        using (StreamReader reader = new StreamReader(debugpath))
        {
            return reader.ReadToEnd();
        }
    }

    private Dictionary<string, string> mockFileContent = new Dictionary<string, string>();
    public void AddMockFileContent(string fileName, string content)
    {
        mockFileContent.Add(fileName, content);
    }
}