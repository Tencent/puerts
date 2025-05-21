using System;
using System.Collections.Concurrent;

public sealed class TypeRegister
{
    private static volatile TypeRegister instance;
    private static readonly object instanceLock = new object();

    private readonly object writeLock = new object();
    private volatile Type[] typeArray = new Type[] { null }; // id not zero
    private readonly ConcurrentDictionary<Type, int> typeToId = new ConcurrentDictionary<Type, int>();

    private TypeRegister() { }

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

    public bool OnTypeNotFound(IntPtr type_id)
    {
        Type type = FindTypeById(type_id.ToInt32());
        UnityEngine.Debug.Log("Loading type: " + type + ", id: "+ type_id.ToInt32());
        return true;
    }
}