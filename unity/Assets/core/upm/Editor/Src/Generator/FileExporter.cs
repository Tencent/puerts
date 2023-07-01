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
using System.Text;

namespace Puerts.Editor
{
    namespace Generator
    {
        public class FileExporter
        {

            public static Dictionary<string, List<KeyValuePair<object, int>>> configure;
            public static List<Type> genTypes;

            public static void ExportDTS(string saveTo, ILoader loader = null, bool csharpModuleWillGen = false)
            {
                if (!Utils.HasFilter)
                {
                    Utils.SetFilters(Configure.GetFilters());
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


            public static void ExportWrapper(string saveTo, ILoader loader = null)
            {
                if (!Utils.HasFilter)
                {
                    Utils.SetFilters(Configure.GetFilters());

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
                    var wrapRender = jsEnv.ExecuteModule<Func<Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");


                    Dictionary<string, bool> makeFileUniqueMap = new Dictionary<string, bool>();
                    Dictionary<Type, Wrapper.StaticWrapperInfo> wrapperInfoMap = new Dictionary<Type, Wrapper.StaticWrapperInfo>();
                    foreach (var type in genTypes)
                    {
                        if (type.IsEnum || type.IsArray || (Generator.Utils.IsDelegate(type) && type != typeof(Delegate))) continue;
                        Wrapper.StaticWrapperInfo staticWrapperInfo = Wrapper.StaticWrapperInfo.FromType(type, genTypes);
                        staticWrapperInfo.BlittableCopy = blittableCopyTypes.Contains(type);

                        wrapperInfoMap[type] = staticWrapperInfo;
                    }

                    foreach (var item in wrapperInfoMap)
                    {
                        var staticWrapperInfo = item.Value;
                        var wrapClassName = staticWrapperInfo.WrapClassName;

                        string filePath = saveTo + staticWrapperInfo.WrapClassName + ".cs";

                        int uniqueId = 1;
                        if (makeFileUniqueMap.ContainsKey(filePath.ToLower()) && staticWrapperInfo.IsGenericWrapper)
                        {
                            continue;
                        }
                        while (makeFileUniqueMap.ContainsKey(filePath.ToLower()))
                        {
                            filePath = saveTo + staticWrapperInfo.WrapClassName + "_" + uniqueId + ".cs";
                            uniqueId++;
                        }
                        makeFileUniqueMap.Add(filePath.ToLower(), true);

                        string fileContent = wrapRender(staticWrapperInfo);
                        using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                        {
                            textWriter.Write(fileContent);
                            textWriter.Flush();
                        }
                    }

                    // var autoRegisterRender = jsEnv.ExecuteModule<Func<Type[], Wrapper.StaticWrapperInfo[], string>>("puerts/templates/wrapper-reg.tpl.mjs", "default");
                    // using (StreamWriter textWriter = new StreamWriter(saveTo + "AutoStaticCodeRegister.cs", false, Encoding.UTF8))
                    // {
                    //     string fileContent = autoRegisterRender(wrapperInfoMap.Keys.ToArray(), wrapperInfoMap.Values.ToArray());
                    //     textWriter.Write(fileContent);
                    //     textWriter.Flush();
                    // }
                }

                Utils.SetFilters(null);
            }
            
            public static void GenRegisterInfo(string outDir, ILoader loader = null)
            {
                var configure = Puerts.Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                        "Puerts.BlittableCopyAttribute",
                    });
                var genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                    .Distinct()
                    .ToList();

                var blittableCopyTypes = new HashSet<Type>(configure["Puerts.BlittableCopyAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsPrimitive && Utils.isBlittableType(t))
                    .Distinct());

                if (!Utils.HasFilter)
                {
                    Utils.SetFilters(Configure.GetFilters());
                }
                
                var RegisterInfos = RegisterInfoGenerator.GetRegisterInfos(genTypes, blittableCopyTypes);

                if (loader == null)
                {
                    loader = new DefaultLoader();
                }
                using (var jsEnv = new JsEnv(loader))
                {
                    var registerInfoRender = jsEnv.ExecuteModule<Func<List<RegisterInfoForGenerate>, string>>("puerts/templates/registerinfo.tpl.mjs", "default");
                    string registerInfoContent = registerInfoRender(RegisterInfos);
                    var registerInfoPath = outDir + "RegisterInfo_Gen.cs";
                    using (StreamWriter textWriter = new StreamWriter(registerInfoPath, false, Encoding.UTF8))
                    {
                        textWriter.Write(registerInfoContent);
                        textWriter.Flush();
                    }
                }
            }
        }
    }

}