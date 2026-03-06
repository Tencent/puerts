/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_EDITOR || UNITY_STANDALONE || UNITY_ANDROID || PUERTS_GENERAL || PUERTS_NUGET

using System;

#if PUERTS_NUGET
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
#if PUERTS_NUGET
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
_p_GET_MEMBER_FLAGS = _p_BindingFlags.Public | _p_BindingFlags.NonPublic | _p_BindingFlags.Instance | _p_BindingFlags.Static
class PesapiLoader(importlib.abc.Loader):

    def exec_module(self, mod):
        pass

    def create_module(self, spec: machinery.ModuleSpec):
        type_name = spec.name
        if _p_loader.NamespaceManager.IsValidNamespace(type_name):
            return NameSpaceProxy(type_name)
        else:
            try:
                return puerts.load_type(type_name)
            except Exception as e:
                raise ModuleNotFoundError(f'No namespace or type named {type_name} or error loading type {type_name} in puerts.load_type: {e}')


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
        try:
            result = puerts.load_type(full_name)
            return result
        except Exception as e:
            if str(e) != f'No type named {full_name}':
                raise e
            if _p_loader.NamespaceManager.IsValidNamespace(full_name):
                return NameSpaceProxy(full_name)
            else:
                raise ModuleNotFoundError(f'No namespace or type named {full_name}')


class puerts:
    @staticmethod
    def load_type(type_name: str):
        """"""
        Load a C# class or generic type definition, raise ModuleNotFoundError if the type cannot be found or loaded.
        :param type_name: The full name of the C# type to load. If the type is generic, use the format 'TypeName_n' where n is the number of generic parameters.
        :return: The loaded C# class or generic type definition
        """"""
        generic_tick_index = type_name.find('_')
        if generic_tick_index != -1:
            suffix = type_name[generic_tick_index + 1:]
            if suffix and suffix.isdigit():
                type_name = type_name[:generic_tick_index] + '`' + suffix
        if type_name in _csTypeCache_:
            return _csTypeCache_[type_name]
        cs_type = scriptEnv.GetTypeByString(type_name)
        if cs_type is None:
            raise ModuleNotFoundError(f'No type named {type_name}')
        if cs_type.IsGenericTypeDefinition:
            builder = puerts.GenericTypeDefWrapper(cs_type)
            _csTypeCache_[type_name] = builder  ## cache generic type definitions directly
            return builder  ## skip loadType for generic type definitions
        cs_class = loadType(cs_type)
        if cs_class is None:
            raise ModuleNotFoundError(f'Failed to load type {type_name} in loadType')
        cs_class._p_cs_type = cs_type
        nestedTypes = puerts.get_nested_types(cs_type)
        if nestedTypes:
            for i in range(nestedTypes.Length):
                ntype = nestedTypes.get_Item(i)
                if ntype.IsGenericTypeDefinition:
                    nName = ntype.Name  ## convert name (T`1) to (T_1) for syntax compatibility
                    tick_index = nName.find('`')
                    nName = nName[:tick_index] + '_' + nName[tick_index + 1:]
                    setattr(cs_class, nName, puerts.load_type(ntype.FullName))
                    pass  ## skip generic type definitions, use puerts.generic to instantiate them
                else:
                    try:
                        setattr(cs_class, ntype.Name, puerts.load_type(ntype.FullName))
                    except Exception as e:
                        raise ModuleNotFoundError(f'Failed to load nested type {ntype.FullName} of {cs_type.FullName}: {e}')
        _csTypeCache_[type_name] = cs_class
        return cs_class

    @staticmethod
    def get_nested_types(cs_type):
        return cs_type.GetNestedTypes(_p_GET_MEMBER_FLAGS)

    @staticmethod
    def gen_iterator(obj):
        return puerts.IteratorWrapper(obj.GetEnumerator())

    @staticmethod
    def typeof(cls):
        if hasattr(cls, '_p_cs_type'):
            return cls._p_cs_type
        if hasattr(cls, '_p_cs_generic_type'):
            return cls._p_cs_generic_type
        raise TypeError(f'object {cls} is not a type loaded by puerts')

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
    def generic(cs_generic_type, *args):
        """"""
        Make a generic type from a generic type definition and generic arguments, and return the loaded C# class for the made generic type.
        :param cs_generic_type: The C# generic type definition to make generic type from. It must be a *generic type definition* loaded by puerts (import or puerts.load_type).
        :param args: The generic arguments to make generic type with. They must be types loaded by puerts (import or puerts.load_type or puerts.generic).
        :return: The loaded C# class for the made generic type.
        """"""
        is_valid_cs_generic_type = hasattr(cs_generic_type, 'IsGenericTypeDefinition') and cs_generic_type.IsGenericTypeDefinition

        if not is_valid_cs_generic_type or len(args) == 0 or len(args) != cs_generic_type.GetGenericArguments().Length:
            raise TypeError('invalid generic type or arguments for type ' + str(cs_generic_type))

        generic_args = []
        for ga in args:
            generic_args.append(puerts.typeof(ga))
        cs_generic_type_made = cs_generic_type.MakeGenericType(*generic_args)
        cs_class = loadType(cs_generic_type_made)
        cs_class._p_cs_type = cs_generic_type_made

        if puerts.typeof(puerts.load_type('System.Collections.IEnumerable')).IsAssignableFrom(cs_generic_type_made):
            pass

        nestedTypes = puerts.get_nested_types(cs_generic_type_made)
        if nestedTypes:
            for i in range(nestedTypes.Length):
                ntype = nestedTypes.get_Item(i)
                if ntype.IsGenericTypeDefinition:
                    setattr(cs_class, ntype.Name, puerts.generic(ntype, *args))
                else:
                    try:
                        setattr(cs_class, ntype.Name, puerts.load_type(ntype.FullName))
                    except Exception as e:
                        raise ModuleNotFoundError(f'Failed to load nested type {ntype.FullName} of {cs_generic_type_made.FullName}: {e}')
        _csTypeCache_[cs_generic_type_made.FullName] = cs_class
        return cs_class

    @staticmethod
    def generic_method(cls, method_name: str, *args):
        """"""
        Make a generic method from a generic method definition and generic arguments, and return a Python function that can call the made generic method.
        :param cls: The class that the generic method belongs to. It must be a class loaded by puerts (import or puerts.load_type or puerts.generic).
        :param method_name: The name of the generic method to make generic method from.
        :param args: The generic arguments to make generic method with. They must be types loaded by puerts (import or puerts.load_type or puerts.generic).
        :return: A Python function that can call the made generic method.
        """"""
        cs_type = None
        try: 
            cs_type = puerts.typeof(cls)
        except Exception as e:
            raise TypeError(f'object {cls} is not a type loaded by puerts: {e}')

        if not hasattr(cs_type, 'GetMember'):
            raise TypeError('the class must be a constructor')

        Utils = puerts.load_type('Puerts.Utils')

        members = Utils.GetMethodAndOverrideMethodByName(cs_type, method_name);
        overload_functions = []
        for i in range(members.Length):
            method = members.GetValue(i)
            if method.IsGenericMethodDefinition and method.GetGenericArguments().Length == len(args):
                generic_args = []
                for ga in args:
                    ret = None
                    try:
                        ret = puerts.typeof(ga)
                    except Exception as e:
                        raise TypeError(f'invalid Type for generic arguments {ga}: {e}')
                    generic_args.append(puerts.typeof(ga))
                method_impl = method.MakeGenericMethod(*generic_args)
                overload_functions.append(method_impl)
        
        overload_count = len(overload_functions)
        if overload_count == 0:
            raise TypeError(f'No generic method named {method_name} with following generic arguments: {"", "".join([str(puerts.typeof(arg).Name) for arg in args])} found in {cs_type.Name}')
        return createFunction(*overload_functions)

    class IteratorWrapper:
        def __init__(self, iterator):
            self.__p_iterator = iterator
            pass
        def __iter__(self):
            return self
    
        def __next__(self):
            if self.__p_iterator.MoveNext():
                return self.__p_iterator.Current
            self.__p_iterator.Dispose()
            raise StopIteration


    class GenericTypeDefWrapper:
        def __init__(self, cs_generic_type):
            self._p_cs_generic_type = cs_generic_type

        def __getitem__(self, args):
            if not isinstance(args, tuple):
                args = (args,)
            if len(args) != self._p_cs_generic_type.GetGenericArguments().Length:
                raise TypeError(f'Expected {self._p_cs_generic_type.GetGenericArguments().Length} generic arguments, got {len(args)}')
            return puerts.generic(self._p_cs_generic_type, *args)

        def __getattr__(self, attr):
            if attr == '_p_cs_generic_type':
                return super().__getattribute__(attr)
            return getattr(self._p_cs_generic_type, attr)

        def __setattr__(self, key, value):
            if key == '_p_cs_generic_type':
                super().__setattr__(key, value)
            else:
                setattr(self._p_cs_generic_type, key, value)

        def __delattr__(self, item):
            raise AttributeError('Cannot delete attributes of GenericTypeDefWrapper')

        def __call__(self, *args, **kwargs):
            return self._p_cs_type(*args, **kwargs)


sys.meta_path.append(PesapiFinder())
''')");
        }
#if PUERTS_NUGET
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

#endif
