/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
#if !PUERTS_GENERAL
using UnityEditor;
using UnityEngine;
#endif

namespace Puerts.Editor
{
    namespace Generator {

        public class Menu {
#if !PUERTS_GENERAL
            [MenuItem("Puerts/Generate Code", false, 1)]
            public static void GenerateCode()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                GenerateWrapper(saveTo);
                GenerateDTS(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem("Puerts/Generate index.d.ts", false, 1)]
            public static void GenerateDTS()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                GenerateDTS(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem("Puerts/Generate index.d.ts ESM compatible (unstable)", false, 1)]
            public static void GenerateDTSESM()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                GenerateDTS(saveTo, true);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem("Puerts/Clear Generated Code", false, 2)]
            public static void ClearAll()
            {
                var saveTo = Configure.GetCodeOutputDirectory();
                if (Directory.Exists(saveTo))
                {
                    Directory.Delete(saveTo, true);
                    AssetDatabase.DeleteAsset(saveTo.Substring(saveTo.IndexOf("Assets") + "Assets".Length));
                    AssetDatabase.Refresh();
                }
            }

#endif
            public static Dictionary<string, List<KeyValuePair<object, int>>> configure;
            public static List<Type> genTypes;

            public static void GenerateDTS(string saveTo, bool esmMode = false, ILoader loader = null)
            {
                if (Utils.filters == null)
                {
                    Utils.filters = Configure.GetFilters();
                    configure = Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                        "Puerts.BlittableCopyAttribute",
                        "Puerts.TypingAttribute",
                    });

                    genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                        .Where(o => o is Type)
                        .Cast<Type>()
                        .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                        .Distinct()
                        .ToList();
                }

                var tsTypes = configure["Puerts.TypingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition)
                    .Concat(genTypes)
                    .Distinct();

                if (loader == null)
                {
                    loader = new DefaultLoader();
                }
                using (var jsEnv = new JsEnv(loader))
                {
                    jsEnv.UsingFunc<DTS.TypingGenInfo, bool, string>();
                    var typingRender = jsEnv.Eval<Func<DTS.TypingGenInfo, bool, string>>("require('puerts/templates/dts.tpl.cjs')");
                    using (StreamWriter textWriter = new StreamWriter(saveTo + "Typing/csharp/index.d.ts", false, Encoding.UTF8))
                    {
                        string fileContext = typingRender(DTS.TypingGenInfo.FromTypes(tsTypes), esmMode);
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }
            }


            public static void GenerateWrapper(string saveTo, ILoader loader = null)
            {
                if (Utils.filters == null)
                {
                    Utils.filters = Configure.GetFilters();

                    configure = Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                        "Puerts.BlittableCopyAttribute",
                        "Puerts.TypingAttribute",
                    });

                    genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                        .Where(o => o is Type)
                        .Cast<Type>()
                        .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                        .Distinct()
                        .ToList();
                }

                var blittableCopyTypes = new HashSet<Type>(configure["Puerts.BlittableCopyAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsPrimitive && Utils.isBlittableType(t))
                    .Distinct());

                if (loader == null)
                {
                    loader = new DefaultLoader();
                }
                using (var jsEnv = new JsEnv(loader))
                {
                    var wrapRender = jsEnv.Eval<Func<Wrapper.TypeGenInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");

                    var typeGenInfos = new List<Wrapper.TypeGenInfo>();

                    Dictionary<string, bool> makeFileUniqueMap = new Dictionary<string, bool>();
                    foreach (var type in genTypes)
                    {
                        if (type.IsEnum || type.IsArray || (Generator.Utils.IsDelegate(type) && type != typeof(Delegate))) continue;
                        Wrapper.TypeGenInfo typeGenInfo = Wrapper.TypeGenInfo.FromType(type, genTypes);
                        typeGenInfo.BlittableCopy = blittableCopyTypes.Contains(type);
                        typeGenInfos.Add(typeGenInfo);
                        string filePath = saveTo + typeGenInfo.WrapClassName + ".cs";

                        int uniqueId = 1;
                        while (makeFileUniqueMap.ContainsKey(filePath.ToLower()))
                        {
                            filePath = saveTo + typeGenInfo.WrapClassName + "_" + uniqueId + ".cs";
                            uniqueId++;
                        }
                        makeFileUniqueMap.Add(filePath.ToLower(), true);

                        string fileContext = wrapRender(typeGenInfo);
                        using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                        {
                            textWriter.Write(fileContext);
                            textWriter.Flush();
                        }
                    }

                    var autoRegisterRender = jsEnv.Eval<Func<Wrapper.TypeGenInfo[], string>>("require('puerts/templates/wrapper-reg.tpl.cjs')");
                    using (StreamWriter textWriter = new StreamWriter(saveTo + "AutoStaticCodeRegister.cs", false, Encoding.UTF8))
                    {
                        string fileContext = autoRegisterRender(typeGenInfos.ToArray());
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }
            }
        }
    }
}
