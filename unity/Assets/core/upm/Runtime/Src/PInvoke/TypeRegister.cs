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

        private readonly pesapi_reg_api reg_api;
        private readonly IntPtr registry;

        private TypeRegister()
        {
            reg_api = Marshal.PtrToStructure<pesapi_reg_api>(NativeAPI.GetRegsterApi());
            registry = reg_api.create_registry();
            reg_api.on_class_not_found(registry, OnTypeNotFound);
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

        public int Register(Type type)
        {
            int typeId = FindOrAddTypeId(type);

            BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            MethodInfo[] methods = type.GetMethods(flag);
            Dictionary<MethodInfo, pesapi_callback> pesapi_Callbacks = new Dictionary<MethodInfo, pesapi_callback>();
            foreach(var method in methods)
            {
                if (method.IsGenericMethodDefinition) continue;
                try
                {
                    pesapi_Callbacks.Add(method, ExpressionsWrap.MethodWrap(method, true));
                    UnityEngine.Debug.Log("wrap " + method + " ok");
                }
                catch (Exception e)
                {
                    //UnityEngine.Debug.Log("wrap " + method + " fail! message: " + e.Message + ", stack:" + e.StackTrace );
                }
            }

            IntPtr properties = reg_api.alloc_property_descriptors(new UIntPtr((uint)pesapi_Callbacks.Count));
            uint idx = 0;
            foreach(var kv in pesapi_Callbacks)
            {
                try
                {
                    IntPtr ptr = StringToIntPtr(kv.Key.Name);
                    reg_api.set_method_info(properties, new UIntPtr(idx++), ptr, kv.Key.IsStatic, kv.Value, IntPtr.Zero, IntPtr.Zero);
                }
                catch { }
            }
            int baseTypeId = type.BaseType == null ? 0 : Register(type.BaseType);
            // TODO: 有C# 类型变更要重新加载的限制
            reg_api.define_class(registry, new IntPtr(typeId), new IntPtr(baseTypeId), type.Namespace, type.Name, null, null, new UIntPtr(idx), properties, IntPtr.Zero, true); 
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