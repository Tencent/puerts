/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public class BackendNodeJS : BackendJs
    {
        IntPtr isolate;
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
            var envRef = PapiNodejsNative.CreateNodejsPapiEnvRef();
            isolate = PapiNodejsNative.GetNodejsIsolate(envRef);
            return envRef;
        }

        public override IntPtr GetApi()
        {
            return PapiNodejsNative.GetNodejsFFIApi();
        }

        public override void DestroyEnvRef(IntPtr envRef)
        {
            PapiNodejsNative.DestroyNodejsPapiEnvRef(envRef);
        }

        public override void OnTick()
        {
            PapiNodejsNative.NodejsLogicTick(isolate);
        }

        public override void LowMemoryNotification()
        {
            PapiNodejsNative.NodejsLowMemoryNotification(isolate);
        }

        public bool IdleNotificationDeadline(double DeadlineInSeconds)
        {
            return PapiNodejsNative.NodejsIdleNotificationDeadline(isolate, DeadlineInSeconds);
        }

        public void RequestMinorGarbageCollectionForTesting()
        {
            PapiNodejsNative.NodejsRequestMinorGarbageCollectionForTesting(isolate);
        }

        public void RequestFullGarbageCollectionForTesting()
        {
            PapiNodejsNative.NodejsRequestFullGarbageCollectionForTesting(isolate);
        }

        public void TerminateExecution()
        {
            PapiNodejsNative.NodejsTerminateExecution(isolate);
        }

        public override void OpenRemoteDebugger(int debugPort)
        {
            PapiNodejsNative.NodejsCreateInspector(isolate, debugPort);
        }

        public override bool DebuggerTick()
        {
            return PapiNodejsNative.NodejsInspectorTick(isolate);
        }

        public override void CloseRemoteDebugger()
        {
            PapiNodejsNative.NodejsDestroyInspector(isolate);
        }
    }
}