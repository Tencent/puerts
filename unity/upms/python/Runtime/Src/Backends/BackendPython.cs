/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

#if PUERTS_GENERAL
using System.Runtime.InteropServices;
#endif

namespace Puerts
{
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
#if PUERTS_GENERAL
            var pythonPrefix = System.IO.Path.Combine(AppContext.BaseDirectory, "runtimes", GetRuntimeIdentifier(), "native");
            PapiPythonNative.InitPythonByHome(pythonPrefix);
#endif
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
import importlib.abc
import sys
import types
from importlib import machinery

_csTypeCache_ = dict()
_p_loader = scriptEnv.GetLoader()

_p_BindingFlags = loadType(scriptEnv.GetTypeByString('System.Reflection.BindingFlags'))
_csTypeCache_['System.Reflection.BindingFlags'] = _p_BindingFlags
_p_GET_MEMBER_FLAGS = _p_BindingFlags.get_Public() | _p_BindingFlags.get_NonPublic() | _p_BindingFlags.get_Instance() | _p_BindingFlags.get_Static()
class PesapiLoader(importlib.abc.Loader):

    def exec_module(self, mod):
        pass

    def create_module(self, spec: machinery.ModuleSpec):
        type_name = spec.name
        if _p_loader.get_NamespaceManager().IsValidNamespace(type_name):
            return NameSpaceProxy(type_name)
        else:
            result = puerts.load_type(type_name)
            if result is not None:
                return result
            else:
                raise ModuleNotFoundError(f'No namespace or type named {type_name}')


class PesapiFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, paths=None, target=None):
        return importlib.machinery.ModuleSpec(fullname, PesapiLoader(), is_package=True)


class NameSpaceProxy(types.ModuleType):

    def __init__(self, namespace_name: str):
        super().__init__(namespace_name)
        self.__path__ = [namespace_name]
        self.__p_namespace_name = namespace_name

    def __getattr__(self, attr: str):
        full_name = self.__p_namespace_name + '.' + attr
        result = puerts.load_type(full_name)
        if result is not None:
            return result
        else:
            if _p_loader.get_NamespaceManager().IsValidNamespace(full_name):
                return NameSpaceProxy(full_name)
            else:
                raise ModuleNotFoundError(f'No namespace or type named {full_name}')


class puerts:
    @staticmethod
    def load_type(type_name: str):
        """"""
        Load a C# class or generic type definition, or return None if the type is not found.
        :param type_name: The full name of the C# type to load. If the type is generic, use the format 'TypeName__Tn' where n is the number of generic parameters.
        :return: The loaded C# class or generic type definition, or None if the type is not found.
        """"""
        generic_tick_index = type_name.find('__T')
        if generic_tick_index != -1:
            suffix = type_name[generic_tick_index + 3:]
            if suffix and suffix.isdigit():
                type_name = type_name[:generic_tick_index] + '`' + suffix
        if type_name in _csTypeCache_:
            return _csTypeCache_[type_name]
        cs_type = scriptEnv.GetTypeByString(type_name)
        if cs_type is None:
            print('Type not found: ' + type_name)
            return None
        if cs_type.IsGenericTypeDefinition:
            # cache generic type definitions directly
            _csTypeCache_[type_name] = cs_type
            # skip loadType for generic type definitions
            return cs_type
        cs_class = loadType(cs_type)
        if cs_class is None:
            print('Failed to load type: ' + type_name)
            return None
        cs_class._p_innerType = cs_type
        nestedTypes = puerts.get_nested_types(cs_type)
        if nestedTypes:
            for i in range(nestedTypes.Length):
                ntype = nestedTypes.get_Item(i)
                if ntype.IsGenericTypeDefinition:
                    # convert name (T`1) to (T__T1) for sytax compatibility
                    nName = ntype.Name
                    tick_index = nName.find('`')
                    nName = nName[:tick_index] + '__T' + nName[tick_index + 1:]
                    setattr(cs_class, nName, puerts.load_type(ntype.FullName))
                    pass # skip generic type definitions, use puerts.generic to instantiate them
                else:
                    try:
                        setattr(cs_class, ntype.Name, puerts.load_type(ntype.FullName))
                    except Exception as e:
                        print(f'load nestedtype [{ntype.Name or ntype}] of {cs_type.Name or cs_type} fail: {e}')
        _csTypeCache_[type_name] = cs_class
        return cs_class

    @staticmethod
    def get_nested_types(cs_type):
        return cs_type.GetNestedTypes(_p_GET_MEMBER_FLAGS)

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
        if hasattr(cls, '_p_innerType'):
            return cls._p_innerType
        return None

    @staticmethod
    def ref(obj):
        return [obj]

    @staticmethod
    def unref(ref_obj):
        return ref_obj[0]

    @staticmethod
    def set_ref(ref_obj, value):
        ref_obj[0] = value

    @staticmethod
    def generic(cs_type, *args):
        if puerts.typeof(cs_type) is not None or len(args) == 0 or not cs_type.IsGenericTypeDefinition:
            return None

        generic_args = []
        for ga in args:
            generic_args.append(puerts.typeof(ga))
        cs_type = cs_type.MakeGenericType(*generic_args)
        cs_class = loadType(cs_type)
        cs_class._p_innerType = cs_type

        if puerts.typeof(puerts.load_type('System.Collections.IEnumerable')).IsAssignableFrom(cs_type):
            cs_class.__iter__ = puerts.gen_iterator

        nestedTypes = puerts.get_nested_types(cs_type)
        if nestedTypes:
            for i in range(nestedTypes.Length):
                ntype = nestedTypes.get_Item(i)
                if ntype.IsGenericTypeDefinition:
                    # convert name (T`1) to (T__T1) for sytax compatibility
                    nName = ntype.Name
                    tick_index = nName.find('`')
                    nName = nName[:tick_index] + '__T' + nName[tick_index + 1:]
                    setattr(cs_class, nName, puerts.load_type(ntype.FullName))
                    pass # skip generic type definitions, use puerts.generic to instantiate them
                else:
                    try:
                        setattr(cs_class, ntype.Name, puerts.load_type(ntype.FullName))
                    except Exception as e:
                        print(f'load nestedtype [{ntype.Name or ntype}] of {cs_type.Name or cs_type} fail: {e}')
        _csTypeCache_[cs_type.FullName] = cs_class
        return cs_class

sys.meta_path.append(PesapiFinder())
''')");
        }
#if PUERTS_GENERAL
        private static string GetRuntimeIdentifier()
        {
            
            string os; 
#if NET5_0_OR_GREATER
            os = OperatingSystem.IsWindows() ? "win" :
                 OperatingSystem.IsLinux() ? "linux" :
                 OperatingSystem.IsMacOS() ? "osx" :
                 throw new PlatformNotSupportedException("Unsupported OS platform");
#else 
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                os = "win";
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                os = "linux";
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                os = "osx";
            }
            else
            {
                throw new PlatformNotSupportedException("Unsupported OS platform");
            }
#endif
            
            var arch = RuntimeInformation.OSArchitecture switch
            {
                Architecture.X64 => "x64",
                Architecture.X86 => "x86",
                Architecture.Arm => throw new PlatformNotSupportedException("Unsupported architecture"),
                Architecture.Arm64 => "arm64",
#if NET5_0_OR_GREATER
                Architecture.Wasm => throw new PlatformNotSupportedException("Unsupported architecture"),      
#endif
#if NET6_0_OR_GREATER
                Architecture.S390x => throw new PlatformNotSupportedException("Unsupported architecture"),
#endif
#if NET7_0_OR_GREATER
                Architecture.LoongArch64 => throw new PlatformNotSupportedException("Unsupported architecture"),
                Architecture.Armv6 =>throw new PlatformNotSupportedException("Unsupported architecture"),
                Architecture.Ppc64le => throw new PlatformNotSupportedException("Unsupported architecture"),
#endif
                _ => throw new PlatformNotSupportedException("Unsupported architecture")
            };
            
            return  $"{os}-{arch}";
        }
#endif
    }
}