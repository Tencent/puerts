using System.IO;
using System.Reflection;
using System.Collections.Generic;
using Puerts;
using Puerts.ThirdParty;

public class TxtLoader : IResolvableLoader,  ILoader, IModuleChecker
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
    private string root = PathToBinDir("../../../../../Assets/core/upm/Runtime/Resources");
    private string commonjsRoot = PathToBinDir("../../../../../Assets/commonjs/upm/Runtime/Resources");
    private string editorRoot = PathToBinDir("../../../../../Assets/core/upm/Editor/Resources");
    private string unittestRoot = PathToBinDir("../../../../Src/Resources");
    
    public bool IsESM(string filepath)
    {
        return !filepath.EndsWith(".cjs");
    }

    public bool FileExists(string specifier)
    {
        return !System.String.IsNullOrEmpty(Resolve(specifier, "."));
    }

    public string Resolve(string specifier, string referrer)
    {
        if (PathHelper.IsRelative(specifier))
        {
            specifier = PathHelper.normalize(PathHelper.Dirname(referrer) + "/" + specifier);
        }

        string path = Path.Combine(root, specifier);
        if (System.IO.File.Exists(path)) 
        {
            return path;
        }
        path = Path.Combine(commonjsRoot, specifier);
        if (System.IO.File.Exists(path)) 
        {
            return path;
        }
        path = Path.Combine(editorRoot, specifier);
        if (System.IO.File.Exists(path)) 
        {
            return path;
        }

        path = Path.Combine(unittestRoot, specifier);
        if (System.IO.File.Exists(path)) 
        {
            return path;
        }
        else if (mockFileContent.ContainsKey(specifier)) 
        {
            return specifier;
        } 
        else if (mockFileContent.ContainsKey(specifier + "/index.js")) 
        {
            return specifier + "/index.js";
        }
        return null;
    }

    public string ReadFile(string filepath, out string debugpath)
    {
        debugpath = Path.Combine(root, filepath);
        if (File.Exists(Path.Combine(editorRoot, filepath)))
        {
            debugpath = Path.Combine(editorRoot, filepath);
        }
        if (File.Exists(Path.Combine(unittestRoot, filepath)))
        {
            debugpath = Path.Combine(unittestRoot, filepath);
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

namespace UnityEngine.Scripting
{
    class PreserveAttribute : System.Attribute
    {

    }
}

namespace Puerts.UnitTest 
{
    public class UnitTestEnv
    {
        private static JsEnv env;
        private static TxtLoader loader;

        UnitTestEnv() { }

        private static void Init() 
        {
            if (env == null) 
            {
                loader = new TxtLoader();
                env = new JsEnv(loader);
                CommonJS.InjectSupportForCJS(env);
#if PUERTS_GENERAL && !TESTING_REFLECTION
                PuertsStaticWrap.PuerRegisterInfo_Gen.AddRegisterInfoGetterIntoJsEnv(env);
#endif
            }
        }

        public static JsEnv GetEnv() 
        {
            if (env == null) Init();
            return env;
        }

        public static TxtLoader GetLoader() 
        {
            if (env == null) Init();
            return loader;
        }
    }
}