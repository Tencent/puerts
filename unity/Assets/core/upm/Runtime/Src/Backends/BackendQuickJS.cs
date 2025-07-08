/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public class BackendQuickJS : BackendJs
    {
        private IntPtr envRef;
        public BackendQuickJS(ILoader loader) : base(loader) { }

        public BackendQuickJS(): this(new DefaultLoader())
        { 
        }

        public override int GetApiVersion()
        {
            return PapiQjsNative.GetQjsPapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            envRef = PapiQjsNative.CreateQjsPapiEnvRef();
            return envRef;
        }

        public override IntPtr GetApi()
        {
            return PapiQjsNative.GetQjsFFIApi();
        }

        public override void DestroyEnvRef(IntPtr envRef)
        {
            PapiQjsNative.DestroyQjsPapiEnvRef(envRef);
        }

        public override void LowMemoryNotification()
        {
            PapiQjsNative.RunGC(envRef);
        }
    }
}