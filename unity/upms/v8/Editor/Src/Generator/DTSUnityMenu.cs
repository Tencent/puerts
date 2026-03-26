/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file
* 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !PUERTS_GENERAL
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEngine;
using Puerts.Editor.Generator;
using GenUtils = Puerts.Editor.Generator.Utils;

namespace Puerts.V8.Editor.Generator
{
    public class DTSUnityMenu
    {
        [MenuItem(UnityMenu.PUERTS_MENU_PREFIX + "/Generate index.d.ts", false, 1)]
        public static void GenerateDTS()
        {
            var start = DateTime.Now;
            var saveTo = Configure.GetCodeOutputDirectory();
            Directory.CreateDirectory(saveTo);
            Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
            ExportDTS(saveTo);
            Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
            AssetDatabase.Refresh();

            GenUtils.SetFilters(null);
        }

        public static void GenerateDTSOldStyle()
        {
            var start = DateTime.Now;
            var saveTo = Configure.GetCodeOutputDirectory();
            Directory.CreateDirectory(saveTo);
            Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
            ExportDTS(saveTo, null, true);
            Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
            AssetDatabase.Refresh();

            GenUtils.SetFilters(null);
        }

        /// <summary>
        /// Create a JS environment backed by V8, used for DTS generation.
        /// </summary>
        public static Puerts.ScriptEnv CreateJsEnv(Puerts.ILoader loader = null)
        {
            if (loader == null)
            {
                loader = new Puerts.DefaultLoader();
            }
            var backend = Activator.CreateInstance(
                Puerts.TypeUtils.GetType("Puerts.BackendV8"), loader) as Puerts.Backend;

            if (backend == null)
            {
                throw new InvalidProgramException("Can not load Puerts.BackendV8");
            }
            return new Puerts.ScriptEnv(backend);
        }

        /// <summary>
        /// Export DTS (index.d.ts) using V8-based JS template rendering.
        /// Moved from core's FileExporter to v8 module to avoid core→v8 reverse dependency.
        /// </summary>
        public static void ExportDTS(string saveTo, Puerts.ILoader loader = null, bool csharpModuleWillGen = false)
        {
            if (!GenUtils.HasFilter)
            {
                GenUtils.SetFilters(Configure.GetFilters());
            }

            var configure = Configure.GetConfigureByTags(new List<string>() {
                "Puerts.BindingAttribute",
                "Puerts.BlittableCopyAttribute",
                "Puerts.TypingAttribute",
            });

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
                .Concat(new Type[] { typeof(System.Type) })
                .Distinct();

            using (var jsEnv = CreateJsEnv(loader))
            {
                var typingRender = jsEnv.ExecuteModule("puerts/templates/dts.tpl.mjs")
                    .Get<Func<Puerts.Editor.Generator.DTS.TypingGenInfo, bool, string>>("default");
                using (StreamWriter textWriter = new StreamWriter(
                    saveTo + "Typing/csharp/index.d.ts", false, Encoding.UTF8))
                {
                    string fileContext = typingRender(
                        Puerts.Editor.Generator.DTS.TypingGenInfo.FromTypes(tsTypes), csharpModuleWillGen);
                    textWriter.Write(fileContext);
                    textWriter.Flush();
                }
            }

            GenUtils.SetFilters(null);
        }
    }
}
#endif
