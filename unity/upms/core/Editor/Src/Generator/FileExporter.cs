/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace Puerts.Editor
{
    namespace Generator
    {
        public class FileExporter
        {
            public static void ExportWrapper(string saveTo, ILoader loader = null)
            {

            }

            public static void GenRegisterInfo(string outDir, ILoader loader = null)
            {
                using (StreamWriter textWriter = new StreamWriter(Path.Combine(outDir, "RegisterInfo_Gen.cs"), false, Encoding.UTF8))
                {
                    textWriter.Write(@"namespace PuertsStaticWrap
{
#if !PUERTS_GENERAL
    [UnityEngine.Scripting.Preserve]
#endif
    public static class PuerRegisterInfo_Gen
    {
        public static void AddRegisterInfoGetterIntoJsEnv(Puerts.JsEnv jsEnv)
        {
        }
    }
}
");
                    textWriter.Flush();
                }

                PuertsIl2cpp.Editor.Generator.FileExporter.GenExtensionMethodInfos(outDir, loader);
            }

            public static Dictionary<string, List<KeyValuePair<object, int>>> configure;

            static Dictionary<string, List<KeyValuePair<object, int>>> getConfigure()
            {
                if (!Utils.HasFilter)
                {
                    Utils.SetFilters(Configure.GetFilters());
                }

                if (configure == null)
                {
                    configure = Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                        "Puerts.BlittableCopyAttribute",
                        "Puerts.TypingAttribute",
                    });
                }

                return configure;
            }


            public static void ExportDTS(string saveTo, ILoader loader = null, bool csharpModuleWillGen = false)
            {
                var configure = getConfigure();

                var genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                        .Where(o => o is Type)
                        .Cast<Type>()
                        .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                        .Distinct()
                        .ToList();

                var tsTypes = configure["Puerts.TypingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition)
                    .Concat(genTypes)
                    .Concat(new Type[] { typeof(System.Type) }) // System.Type will be use in puerts.d.ts, so always generate it 
                    .Distinct();

                if (loader == null)
                {
                    loader = new DefaultLoader();
                }
                using (var jsEnv = new JsEnv(loader))
                {
                    jsEnv.UsingFunc<DTS.TypingGenInfo, bool, string>();
                    var typingRender = jsEnv.ExecuteModule<Func<DTS.TypingGenInfo, bool, string>>("puerts/templates/dts.tpl.mjs", "default");
                    using (StreamWriter textWriter = new StreamWriter(saveTo + "Typing/csharp/index.d.ts", false, Encoding.UTF8))
                    {
                        string fileContext = typingRender(DTS.TypingGenInfo.FromTypes(tsTypes), csharpModuleWillGen);
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }

                Utils.SetFilters(null);
            }
        }
    }

}