/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#if !PUERTS_GENERAL
using UnityEngine;
using UnityEditor;
using System;

namespace Puerts.Editor 
{
    public class NodeJS
    {
        protected static readonly string DefaultProjectPath = Application.dataPath + "/../Puer-Project/";

        public static JsEnv RunInPuerProject(string Code, JsEnv env = null, string ProjectPath = null) 
        {
            if (env == null) env = new JsEnv();
            if (ProjectPath == null) ProjectPath = DefaultProjectPath;

            EditorUtility.DisplayProgressBar("PuerNode", "Running in Puer-Project", 0);
            try 
            {
                env.Eval(@"
                    global.CS = puertsRequire('csharp');
                    global.__puerProjectRoot = '" + DefaultProjectPath + @"';
                    global.require = require('module').createRequire('" + ProjectPath + @"');
                    " + Code + @"
                ");
            }
            catch (Exception e)
            {
                throw e;
            }
            finally
            {
                EditorUtility.ClearProgressBar();
            }

            return env;
        }
    }
}
#endif