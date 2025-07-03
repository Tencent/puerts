/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

#if !UNITY_EDITOR && UNITY_WEBGL
namespace Puerts
{
    public class BackendWebGL : BackendJs
    {
        private IntPtr envRef;
        public BackendWebGL(ILoader loader) : base(loader)
        {
            PapiWebGLNative.PreservePuertsCPP();
            PapiWebGLNative.InitPuertsWebGL();
        }

        public BackendWebGL() : this(new DefaultLoader())
        {
        }

        public override int GetApiVersion()
        {
            return PapiWebGLNative.GetWebGLPapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            return PapiWebGLNative.CreateWebGLPapiEnvRef();
        }

        public override IntPtr GetApi()
        {
            return PapiWebGLNative.GetWebGLFFIApi();
        }

        public override void DestroyEnvRef(IntPtr envRef)
        {
            throw new Exception("WebGL env can not destroy");
        }

        public override void LowMemoryNotification()
        {
        }
    }
}
#endif