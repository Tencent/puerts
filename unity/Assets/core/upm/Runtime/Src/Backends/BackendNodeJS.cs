/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public class BackendNodeJS : BackendJs
    {
        public BackendNodeJS(ILoader loader) : base(loader) { }

        public BackendNodeJS() : this(new DefaultLoader())
        {
        }

        public override int GetApiVersion()
        {
            return PapiNodejsNative.GetNodejsPapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            return PapiNodejsNative.CreateNodejsPapiEnvRef();
        }

        public override IntPtr GetApi()
        {
            return PapiNodejsNative.GetNodejsFFIApi();
        }

        public override void DestroyEnvRef(IntPtr envRef)
        {
            PapiNodejsNative.DestroyNodejsPapiEnvRef(envRef);
        }

        public override void LowMemoryNotification()
        {
        }
    }
}