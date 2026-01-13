/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER && !PUERTS_GENERAL
using System.IO;
using UnityEngine;

namespace PuertsIl2cpp.Editor.Generator
{
    /// <summary>
    /// Centralized path management for IL2CPP plugin output
    /// </summary>
    public static class PathHelper
    {
        /// <summary>
        /// Get the IL2CPP plugin output path based on compilation symbols
        /// </summary>
        public static string GetIl2cppPluginPath()
        {
#if CPP_OUTPUT_TO_NATIVE_SRC
            return Path.Combine(Application.dataPath, "core/upm/Plugins/puerts_il2cpp/");
#elif PUERTS_CPP_OUTPUT_TO_UPM
            return Path.Combine(Path.GetFullPath("Packages/com.tencent.puerts.core/"), "Plugins/puerts_il2cpp/");
#else
            return Path.Combine(Puerts.Configure.GetCodeOutputDirectory(), "Plugins/puerts_il2cpp/");
#endif
        }
    }
}
#endif
