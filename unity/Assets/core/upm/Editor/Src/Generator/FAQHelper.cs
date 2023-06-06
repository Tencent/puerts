/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_EDITOR && UNITY_2019_1_OR_NEWER
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.Compilation;
using UnityEngine;
using System.Linq;
using System.IO;

namespace Puerts.Editor
{
    [InitializeOnLoad]
    class FAQHelper : IPreprocessBuildWithReport, IPostprocessBuildWithReport
    {
        public int callbackOrder => 0;

        public void OnPreprocessBuild(BuildReport report)
        {
            Application.logMessageReceived += OnLog;
        }

        public void OnPostprocessBuild(BuildReport report)
        {
            Application.logMessageReceived -= OnLog;
        }

        private static void OnLog(string condition, string stacktrace, LogType type)
        {
            string genPath = Puerts.Configure.GetCodeOutputDirectory();
            genPath = genPath.Substring(genPath.IndexOf("Assets"));

            if (type == LogType.Error)
            {
                if (condition.Contains(genPath))
                {
                    if (condition.Contains("Wrap.cs"))
                    {
                        print010StaticWrapperError = true;
                    }
                    if (condition.Contains("RegisterInfo_Gen.cs"))
                    {
                        print011RegisterInfoError = true;
                    }
                }

                if (condition.Contains("'unityenv_for_puerts.h' file not found")) 
                {
                    print012MacroHeader = true;
                    Application.logMessageReceived -= OnLog;
                }
            }
        }

        static FAQHelper()
        {
            EditorApplication.update += EditorUpdate;
            CompilationPipeline.assemblyCompilationFinished += ProcessBatchModeCompileFinish;
        }

        private static void ProcessBatchModeCompileFinish(string s, CompilerMessage[] compilerMessages)
        {
            foreach (var message in compilerMessages)
            {
                if (message.type == CompilerMessageType.Error)
                {
                    OnLog(message.file, message.message, LogType.Error);
                }
            };
        }

        private static bool enabled = false;
        public static void Enable()
        {
            if (enabled) return;
            enabled = true;
            Application.logMessageReceived += OnLog;
        }
        public static void Disable()
        {
            if (!enabled) return;
            enabled = false;
            Application.logMessageReceived -= OnLog;
        }

        private static bool print010StaticWrapperError = false;
        private static bool print011RegisterInfoError = false;
        private static bool print012MacroHeader = false;

        private static void EditorUpdate()
        {
            if (print010StaticWrapperError)
            {
                UnityEngine.Debug.Log("[Puer010] StaticWrapper error detected, maybe you should use filter to exclude some member.");
                print010StaticWrapperError = false;
            }
            if (print011RegisterInfoError)
            {
                UnityEngine.Debug.Log("[Puer011] RegisterInfo error detected. maybe you should clean the generated code and regenerate.");
                print011RegisterInfoError = false;
            }
            if (print012MacroHeader)
            {
                UnityEngine.Debug.Log("[Puer012] Build error detected, please use 'PuerTS->Generate->il2cpp macro.h'.");
                print012MacroHeader = false;
            }
        }
    }
}
#endif