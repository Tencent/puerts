/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public abstract class Backend
    {
        // load papi provider
        public abstract int GetApiVersion();

        public abstract IntPtr CreateEnvRef();

        public abstract IntPtr GetApi();

        public abstract void DestroyEnvRef(IntPtr envRef);

        // module loader/executor
        public abstract IntPtr GetModuleExecutor(IntPtr env);

        public abstract object GetLoader();

        // life cycle callbacks
        public virtual void OnEnter(ScriptEnv scriptEnv)
        {
        }

        public virtual void OnTick()
        { 
        }

        public virtual void OnExit(ScriptEnv scriptEnv)
        {
        }

        // remote debugger
        public virtual void OpenRemoteDebugger(int port)
        {
        }

        public virtual bool DebuggerTick()
        {
            return true;
        }

        public virtual void CloseRemoteDebugger()
        {
        }

        // gc
        public abstract void LowMemoryNotification();
    }
}