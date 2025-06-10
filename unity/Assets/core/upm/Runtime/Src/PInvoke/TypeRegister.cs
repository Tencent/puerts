using System;
using System.Text;
using System.Linq;
using System.Reflection;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Puerts
{
    public sealed class TypeRegister
    {
        private static volatile TypeRegister instance;
        private static readonly object instanceLock = new object();

        private readonly object writeLock = new object();
        private volatile Type[] typeArray = new Type[] { null }; // id not zero
        private readonly ConcurrentDictionary<Type, int> typeToId = new ConcurrentDictionary<Type, int>();
        private readonly ConcurrentDictionary<int, bool> registerFinished = new ConcurrentDictionary<int, bool>();

        private readonly pesapi_reg_api reg_api;
        private readonly IntPtr registry;
        private readonly pesapi_class_not_found_callback onTypeNotFoundDelegate;
        internal readonly List<Delegate> callbacksCache = new List<Delegate>();

        private TypeRegister()
        {
            reg_api = Marshal.PtrToStructure<pesapi_reg_api>(NativeAPI.GetRegsterApi());
            registry = reg_api.create_registry();
            onTypeNotFoundDelegate = new pesapi_class_not_found_callback(OnTypeNotFound);
            reg_api.on_class_not_found(registry, onTypeNotFoundDelegate);
        }

        public static TypeRegister Instance
        {
            get
            {
                if (instance == null)
                {
                    lock (instanceLock)
                    {
                        if (instance == null)
                        {
                            instance = new TypeRegister();
                        }
                    }
                }
                return instance;
            }
        }

        public IntPtr Registry
        {
            get
            {
                return registry;
            }
        }

        public int FindOrAddTypeId(Type type)
        {
            if (typeToId.TryGetValue(type, out int existingId))
            {
                return existingId;
            }

            lock (writeLock)
            {
                if (typeToId.TryGetValue(type, out existingId))
                {
                    return existingId;
                }

                int newId = typeArray.Length;
                var newArray = new Type[newId + 1];
                Array.Copy(typeArray, newArray, newId);
                newArray[newId] = type;

                typeArray = newArray;
                typeToId[type] = newId;
                return newId;
            }
        }

        public Type FindTypeById(int id)
        {
            var current = typeArray; // 获取当前数组快照
            return (uint)id < (uint)current.Length ? current[id] : null;
        }

        public static IntPtr StringToIntPtr(string str)
        {
            if (str == null)
                return IntPtr.Zero;

            byte[] utf8Bytes = Encoding.UTF8.GetBytes(str);

            IntPtr ptr = Marshal.AllocHGlobal(utf8Bytes.Length + 1);

            try
            {
                Marshal.Copy(utf8Bytes, 0, ptr, utf8Bytes.Length);
                Marshal.WriteByte(ptr, utf8Bytes.Length, 0);

                return ptr;
            }
            catch
            {
                Marshal.FreeHGlobal(ptr);
                throw;
            }
        }

        struct MemberKey
        {
            public MemberKey(string n, bool b)
            {
                Name = n;
                IsStatic = b;
            }
            public string Name;
            public bool IsStatic;
        }

        class AccessorInfo
        {
            public pesapi_callback Getter;
            public pesapi_callback Setter;
        }

        private bool parameterTypeNotAcceptable(Type type)
        {
            return type == typeof(IntPtr) || type == typeof(TypedReference) || type.IsPointer;
        }

        private bool returnTypeNotAcceptable(Type type)
        {
            return type == typeof(IntPtr) || type == typeof(TypedReference) || type.IsPointer || type.IsByRef;
        }

        public int Register(Type type)
        {
            int typeId = FindOrAddTypeId(type);
            if (registerFinished.ContainsKey(typeId)) return typeId;

            BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            var methodInfos = type.GetMethods(flag | BindingFlags.NonPublic).ToList();
            FieldInfo[] fieldInfos = type.GetFields(flag);
            Dictionary<MemberKey, List<MethodInfo>> methodCallbacks = new Dictionary<MemberKey, List<MethodInfo>>();
            Dictionary<MemberKey, AccessorInfo> propertyCallbacks = new Dictionary<MemberKey, AccessorInfo>();
            Action<MemberKey, pesapi_callback, pesapi_callback> addPropertyCallback = (key, getter, setter) =>
            {
                AccessorInfo accessorCallbackPair;
                if (!propertyCallbacks.TryGetValue(key, out accessorCallbackPair))
                {
                    accessorCallbackPair = new AccessorInfo();
                    propertyCallbacks.Add(key, accessorCallbackPair);
                }
                if (getter != null)
                {
                    accessorCallbackPair.Getter = getter;
                    callbacksCache.Add(getter);
                }
                if (setter != null)
                {
                    accessorCallbackPair.Setter = setter;
                    callbacksCache.Add(setter);
                }
            };
            Action<MemberKey, MethodInfo> addOverload = (key, methodInfo) =>
            {
                List<MethodInfo> overloads;
                if (!methodCallbacks.TryGetValue(key, out overloads))
                {
                    overloads = new List<MethodInfo>();
                    methodCallbacks.Add(key, overloads);
                }
                overloads.Add(methodInfo);
            };
            foreach (var fieldInfo in fieldInfos)
            {
                try
                {
                    var getter = ExpressionsWrap.BuildFieldGetter(fieldInfo);
                    callbacksCache.Add(getter);
                    addPropertyCallback(new MemberKey(fieldInfo.Name, fieldInfo.IsStatic), getter, null);
                    if (!fieldInfo.IsInitOnly && !fieldInfo.IsLiteral)
                    {
                        var setter = ExpressionsWrap.BuildFieldSetter(fieldInfo);
                        callbacksCache.Add(setter);
                        addPropertyCallback(new MemberKey(fieldInfo.Name, fieldInfo.IsStatic), null, setter);
                    }
                }
                catch (Exception e)
                {
                    UnityEngine.Debug.LogWarning("wrap " + fieldInfo + " fail! message: " + e.Message + ", stack:" + e.StackTrace);
                }
            }
            var extensionMethods = PuertsIl2cpp.ExtensionMethodInfo.Get(type.AssemblyQualifiedName);
            if(extensionMethods != null && extensionMethods.Length > 0)
            {
                foreach (var extensionMethod in extensionMethods)
                {
                    var method = extensionMethod;
                    if (method.IsGenericMethodDefinition)
                    {
                        var genericArguments = method.GetGenericArguments();
                        var constraintedArgumentTypes = new Type[genericArguments.Length];
                        for (var j = 0; j < genericArguments.Length; j++)
                        {
                            constraintedArgumentTypes[j] = genericArguments[j].BaseType;
                        }
                        method = method.MakeGenericMethod(constraintedArgumentTypes);
                    }
                    methodInfos.Add(method);
                }
            }
            foreach (var methodInfo in methodInfos)
            {
                if (methodInfo.IsGenericMethodDefinition) continue;
                if (methodInfo.GetParameters().Any(pi => parameterTypeNotAcceptable(pi.ParameterType)) || returnTypeNotAcceptable(methodInfo.ReturnType)) continue;

                string methodName = methodInfo.Name;

                if (!methodInfo.IsPublic)
                {
                    int dotPos = methodName.LastIndexOf('.');
                    if (dotPos == -1) continue;
                    methodName = methodName.Substring(dotPos + 1);
                }
                try
                {
                    //AccessorCallbackPair accessorCallbackPair = null;
                    if (methodInfo.IsSpecialName && methodName.StartsWith("get_") && methodInfo.GetParameters().Length == 0) // getter of property
                    {
                        addPropertyCallback(new MemberKey(methodName.Substring(4), methodInfo.IsStatic), ExpressionsWrap.BuildMethodWrap(type, methodInfo, true), null);
                    }
                    else if (methodInfo.IsSpecialName && methodName.StartsWith("set_") && methodInfo.GetParameters().Length == 1) // setter of property
                    {
                        addPropertyCallback(new MemberKey(methodName.Substring(4), methodInfo.IsStatic), null, ExpressionsWrap.BuildMethodWrap(type, methodInfo, true));
                    }
                    else
                    {
                        addOverload(new MemberKey(methodName, methodInfo.IsStatic && PuertsIl2cpp.ExtensionMethodInfo.GetExtendedType(methodInfo) != type), methodInfo);
                    }
                    //UnityEngine.Debug.Log("wrap " + method + " ok");
                }
                catch (Exception e)
                {
                    UnityEngine.Debug.LogWarning("wrap " + methodInfo + " fail! message: " + e.Message + ", stack:" + e.StackTrace );
                }
            }
            IntPtr properties = reg_api.alloc_property_descriptors(new UIntPtr((uint)(methodCallbacks.Count + propertyCallbacks.Count)));
            uint idx = 0;
            foreach(var kv in propertyCallbacks)
            {
                try
                {
                    IntPtr ptr = StringToIntPtr(kv.Key.Name);
                    reg_api.set_property_info(properties, new UIntPtr(idx++), ptr, kv.Key.IsStatic, kv.Value.Getter, kv.Value.Setter, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
                }
                catch { }

            }
            foreach(var kv in methodCallbacks)
            {
                try
                {
                    IntPtr ptr = StringToIntPtr(kv.Key.Name);
                    pesapi_callback callback = ExpressionsWrap.BuildMethodWrap(type, kv.Value.ToArray(), true);
                    callbacksCache.Add(callback);
                    reg_api.set_method_info(properties, new UIntPtr(idx++), ptr, kv.Key.IsStatic, callback, IntPtr.Zero, IntPtr.Zero);
                }
                catch (Exception e)
                {
                    UnityEngine.Debug.LogWarning($"wrap {kv.Key.Name} of {type} fail! message: {e.Message}, stack: {e.StackTrace}");
                }
            }
            int baseTypeId = type.BaseType == null ? 0 : Register(type.BaseType);
            
            pesapi_constructor ctorWrap = null;

            try
            {
                if ((typeof(MulticastDelegate).IsAssignableFrom(type) && type != typeof(MulticastDelegate)))
                {
                    ctorWrap = ExpressionsWrap.BuildConstructorWrap(type, type.GetConstructors(), true);
                }
                else
                {
                    var ctors = type.GetConstructors()
                        .Where(ctorInfo => !ctorInfo.GetParameters().Any(pi => parameterTypeNotAcceptable(pi.ParameterType)))
                        .ToArray();
                    if (ctors.Length > 0)
                    {
                        ctorWrap = ExpressionsWrap.BuildConstructorWrap(type, ctors, true);
                    }
                }
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogWarning("wrap ctor for " + type + " fail! message: " + e.Message + ", stack:" + e.StackTrace);
            }
            if (ctorWrap == null)
            {
                ctorWrap = (apis, info) =>
                {
                    NativeAPI.pesapi_throw_by_string(apis, info, $"no constructor for {type}");
                    return IntPtr.Zero;
                };
            }
            callbacksCache.Add(ctorWrap);
            reg_api.define_class(registry, new IntPtr(typeId), new IntPtr(baseTypeId), type.Namespace, type.Name, ctorWrap, null, new UIntPtr(idx), properties, IntPtr.Zero, true);
            registerFinished[typeId] = true;
            return typeId;
        }

        public bool OnTypeNotFound(IntPtr type_id)
        {
            Type type = FindTypeById(type_id.ToInt32());
            UnityEngine.Debug.Log("Loading type: " + type + ", id: " + type_id.ToInt32());
            Register(type);
            return true;
        }
    }
}