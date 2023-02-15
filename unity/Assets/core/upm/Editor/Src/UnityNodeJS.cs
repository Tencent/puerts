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
    public class NodeRunner
    {
        protected static readonly string DefaultProjectPath = Application.dataPath + "/../Puer-Project/";

        public JsEnv env = null;

        private string ProjectPath;

        

        public NodeRunner(string ProjectPath = "") 
        {
            UnityEngine.Debug.LogWarning("NodeRunner is still experimental and could be changed later");
            if (ProjectPath == null || ProjectPath == "") 
            {
                this.ProjectPath = DefaultProjectPath;
            }
            else 
            {
                this.ProjectPath = ProjectPath;
            }
            EditorApplication.update += Update;
            env = new JsEnv();
        }

        void Update() 
        {
            if (env != null) {
                env.Tick();
            }
        }

        public T Run<T>(string Code) 
        {
            if (env == null) env = new JsEnv();
            
            EditorUtility.DisplayProgressBar("PuerNode", "Running in Puer-Project", 0);
            T ret = default(T);
            try 
            {
                ret = env.Eval<T>(String.Format(@"
                    global.__puerProjectRoot = '{0}';
                    global.require = require('module').createRequire('{0}');
                    if (!require('fs').existsSync(`{0}/node_modules`)) {{
                        console.log('[Puer] installing node_modules');
                        require('child_process').execSync('cd {0} && npm i')
                    }}
                    (async function() {{
                        {1}
                    }})().catch(console.error);
                ", ProjectPath.Replace("\\", "/"), Code));
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                EditorUtility.ClearProgressBar();
            }

            return ret;
        }

        public void Run(string Code) 
        {
            if (env == null) env = new JsEnv();
            EditorUtility.DisplayProgressBar("PuerNode", "Running in Puer-Project", 0);
            try 
            { 
                env.Eval(String.Format(@"
                    global.__puerProjectRoot = '{0}';
                    global.require = require('module').createRequire('{0}');
                    if (!require('fs').existsSync(`{0}/node_modules`)) {{
                        console.log('[Puer] installing node_modules');
                        require('child_process').execSync('cd {0} && npm i')
                    }}

                    (async function() {{
                        {1}
                    }})().catch(console.error);
                ", ProjectPath.Replace("\\", "/"), Code));
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                EditorUtility.ClearProgressBar();
            }
        }
    }
}
#endif