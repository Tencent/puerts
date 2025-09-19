/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

namespace Puerts;

public class BackendPython : Backend
{
    private IntPtr envRef;
    private PythonLoader pythonLoader;
    public BackendPython(PythonLoader loader)
    {
        pythonLoader = loader;
    }
    public BackendPython()
    {
        pythonLoader = new PythonDefaultLoader();
    }
    public override int GetApiVersion()
    {
        return PapiPythonNative.GetPythonPapiVersion();
    }

    public override IntPtr CreateEnvRef()
    {
        envRef = PapiPythonNative.CreatePythonPapiEnvRef();
        return envRef;
    }

    public override IntPtr GetApi()
    {
        return PapiPythonNative.GetPythonFFIApi();
    }

    public override void DestroyEnvRef(IntPtr penvRef)
    {
        PapiPythonNative.DestroyPythonPapiEnvRef(envRef);
    }

    public override IntPtr GetModuleExecutor(IntPtr env)
    {
        var papis = GetApi();
        return PuertsNative.pesapi_create_null(papis, env);
    }

    public override object GetLoader()
    {
        return pythonLoader;
    }

    public override void LowMemoryNotification()
    {

    }

    public override void OnEnter(ScriptEnv scriptEnv)
    {
        scriptEnv.Eval(
@"exec(
'''
class CSharp:
    def __init__(self):
        self.__csTypeCache__ = {}

    def load_type(self, type_name: str, *generic_cs_name_args: str):
        if generic_cs_name_args and len(generic_cs_name_args) > 0:
            key = (type_name, tuple(generic_cs_name_args))
        else:
            key = type_name

        if key in self.__csTypeCache__:
            return self.__csTypeCache__[key]

        if generic_cs_name_args and len(generic_cs_name_args) > 0:
            cs_type = scriptEnv.GetTypeByString(type_name+""`""+str(len(generic_cs_name_args)))
            generic_args = [self.typeof(self.load_type(t)) for t in generic_cs_name_args]
            cs_type = cs_type.MakeGenericType(*generic_args)
            cs_class = loadType(cs_type)
            if not cs_class:
                print(""can not find type:"", type_name)
                return None
            cs_class.__p_innerType = cs_type
            if (self.typeof(self.load_type(""System.Collections.IEnumerable""))).IsAssignableFrom(self.typeof(cs_class)):
                cs_class.__iter__ = self.gen_iterator

        else:
            cs_type = scriptEnv.GetTypeByString(type_name)
            cs_class = loadType(cs_type)
            if not cs_class:
                print(""can not find type:"", type_name)
                return None
            cs_class.__p_innerType = cs_type

        self.__csTypeCache__[key] = cs_class
        return cs_class

    def __getattr__(self, name):
        if name in self.__dict__:
            return self.__dict__[name]
        else:
            return self.load_type(name)

    @staticmethod
    def gen_iterator(obj):
        it = obj.GetEnumerator()
        class Iterator:
            def __iter__(self):
                return self
            def __next__(self):
                if it.MoveNext():
                    return it.Current
                it.Dispose()
                raise StopIteration
        return Iterator()

    @staticmethod
    def typeof(cls):
        return cls.__p_innerType

    @staticmethod
    def ref(obj):
        return [obj]

    @staticmethod
    def unref(ref_obj):
        return ref_obj[0]

    @staticmethod
    def set_ref(ref_obj, value):
        ref_obj[0] = value
''')");
    }
}