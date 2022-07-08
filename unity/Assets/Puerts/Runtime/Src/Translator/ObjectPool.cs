/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;

namespace Puerts
{
    class ReferenceEqualsComparer : IEqualityComparer<object>
    {
        public new bool Equals(object o1, object o2)
        {
            return object.ReferenceEquals(o1, o2);
        }
        public int GetHashCode(object obj)
        {
            return System.Runtime.CompilerServices.RuntimeHelpers.GetHashCode(obj);
        }
    }

    public class ObjectPool
    {
        //TODO: V8 SetAlignedPointerInInternalField 要求第一位必须是0，先左移一位解决问题，这种潜规则有可能会有变动，后续应该换通过更换接口来解决
        const int SHIFT_BIT = 1;
        const int LIST_END = -1;
        const int ALLOCED = -2;
        struct Slot
        {
            public int next;
            public object obj;

            public Slot(int next, object obj)
            {
                this.next = next;
                this.obj = obj;
            }
        }

        private Slot[] list = new Slot[512];
        private int freelist = LIST_END;
        private int count = 0;
        private Dictionary<object, int> reverseMap = new Dictionary<object, int>(new ReferenceEqualsComparer());

        public ObjectPool()
        {
            AddToFreeList(null); //0号位为null
        }

        public void Clear()
        {
            freelist = LIST_END;
            count = 0;
            list = new Slot[512];
            reverseMap = new Dictionary<object, int>();
            AddToFreeList(null); //0号位为null
        }

        private void ExtendCapacity()
        {
            Slot[] new_list = new Slot[list.Length * 2];
            for (int i = 0; i < list.Length; i++)
            {
                new_list[i] = list[i];
            }
            list = new_list;
        }

        public int FindOrAddObject(object obj)
        {
            if (obj == null) return 0;
            int id;
            if (!reverseMap.TryGetValue(obj, out id))
            {
                id = Add(obj);
            }
            return id << SHIFT_BIT;
        }

        public int AddBoxedValueType(object obj) //不做检查，靠调用者保证
        {
            return AddToFreeList(obj) << SHIFT_BIT;
        }

        private int Add(object obj)
        {
            int id = AddToFreeList(obj);
            reverseMap[obj] = id;
            return id;
        }

        private int AddToFreeList(object obj)
        {
            int index = LIST_END;

            if (freelist != LIST_END)
            {
                index = freelist;
                list[index].obj = obj;
                freelist = list[index].next;
                list[index].next = ALLOCED;
            }
            else
            {
                if (count == list.Length)
                {
                    ExtendCapacity();
                }
                index = count;
                list[index] = new Slot(ALLOCED, obj);
                count = index + 1;
            }

            return index;
        }

        public bool TryGetValue(int index, out object obj)
        {
            index = index >> SHIFT_BIT;
            if (index >= 0 && index < count && list[index].next == ALLOCED)
            {
                obj = list[index].obj;
                return true;
            }

            obj = null;
            return false;
        }

        public object Get(int index)
        {
            index = index >> SHIFT_BIT;
            if (index >= 0 && index < count)
            {
                return list[index].obj;
            }
            return null;
        }

        public object Remove(int index)
        {
            index = index >> SHIFT_BIT;
            if (index >= 0 && index < count && list[index].next == ALLOCED)
            {
                object o = list[index].obj;
                list[index].obj = null;
                list[index].next = freelist;
                freelist = index;

                int reverseId;
                if (reverseMap.TryGetValue(o, out reverseId) && reverseId == index)
                {
                    reverseMap.Remove(o);
                }
                return o;
            }

            return null;
        }

        private object ReplaceFreeList(int index, object o)
        {
            if (index >= 0 && index < count)
            {
                object obj = list[index].obj;
                list[index].obj = o;
                return obj;
            }

            return null;
        }

        public object ReplaceValueType(int index, object o)
        {
            index = index >> SHIFT_BIT;
            return ReplaceFreeList(index, o);
        }

        private void ReleaseObjectRefInner(int index)
        {
            object obj = ReplaceFreeList(index, null);
            if (obj == null) return;
            int objIndex;
            if (reverseMap.TryGetValue(obj, out objIndex) && objIndex == index)
            {
                reverseMap.Remove(obj);
            }
        }

        public int Check(int checkPos, int maxCheck, Func<object, bool> checker, Dictionary<object, int> reverseMap)
        {
            if (count == 0)
            {
                return 0;
            }
            for (int i = 0; i < Math.Min(maxCheck, count); ++i)
            {
                checkPos %= count;
                if (list[checkPos].next == ALLOCED && !Object.ReferenceEquals(list[checkPos].obj, null))
                {
                    if (!checker(list[checkPos].obj))
                    {
                        ReleaseObjectRefInner(checkPos);
                    }
                }
                ++checkPos;
            }

            return checkPos %= count;
        }
    }
}