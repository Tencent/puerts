/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Collections;
using System;
using Puerts.TypeMapping;

/************************************************************************************************
    *  配置
    *  1、Binding、BlittableCopy、Filter须放到一个打了Configure标签的类里；
    *  2、Binding、BlittableCopy、Filter均用打了相应标签的属性来表示；
    *  3、Binding、BlittableCopy、Filter配置须放到Editor目录下；
*************************************************************************************************/

namespace Puerts
{
    //放置配置的类
    [AttributeUsage(AttributeTargets.Class)]
    public class ConfigureAttribute : Attribute
    {

    }

    //代码生成目录
    [AttributeUsage(AttributeTargets.Property)]
    public class CodeOutputDirectoryAttribute : Attribute
    {
    }

    //要在ts/js里头调用，必须放在标记了Configure的类里
    [AttributeUsage(AttributeTargets.Property)]
    public class BindingAttribute : Attribute
    {
    }

    //相比Binding，这标签仅生成ts声明
    [AttributeUsage(AttributeTargets.Property)]
    public class TypingAttribute : Attribute
    {
    }

    //对blittable值类型通过内存拷贝传递，需要开启unsafe编译选项
    [AttributeUsage(AttributeTargets.Property)]
    public class BlittableCopyAttribute : Attribute
    {

    }

    [AttributeUsage(AttributeTargets.Method)]
    public class FilterAttribute : Attribute
    {
    }

    public enum FilterAction
    {
        BindingMode = 1,
        MethodInInstructions = 2,
        DisallowedType = 3
    }

    public static class Configure
    {
        public static Dictionary<string, List<KeyValuePair<object, int>>> GetConfigureByTags(List<string> tags)
        {
            var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                        where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                        from type in assembly.GetTypes()
                        where type.IsDefined(typeof(ConfigureAttribute), false)
                        select type;
            var tagsMap = tags.ToDictionary(t => t, t => new List<KeyValuePair<object, int>>());

            foreach(var type in types)
            {
                foreach (var prop in type.GetProperties(BindingFlags.Static | BindingFlags.Public
                    | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
                {
                    if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                    {
                        foreach (var ca in prop.GetCustomAttributes(false))
                        {
                            int flag = 0;
                            var fp = ca.GetType().GetProperty("Flag");
                            if (fp != null)
                            {
                                flag = (int)fp.GetValue(ca, null);
                            }
                            List<KeyValuePair<object, int>> infos;
                            if (tagsMap.TryGetValue(ca.GetType().ToString(), out infos))
                            {
                                foreach (var applyTo in prop.GetValue(null, null) as IEnumerable)
                                {
                                    infos.Add(new KeyValuePair<object, int>(applyTo, flag));
                                }
                            }
                        }
                    }
                }
            }
            return tagsMap;
        }

        public static List<MethodInfo> GetFilters()
        {
            var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                        where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                        from type in assembly.GetTypes()
                        where type.IsDefined(typeof(ConfigureAttribute), false)
                        select type;

            List<MethodInfo> filters = new List<MethodInfo>();
            foreach (var type in types)
            {
                foreach (var method in type.GetMethods(BindingFlags.Static | BindingFlags.Public
                    | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
                {
                    if(method.IsDefined(typeof(FilterAttribute), false))
                    {
                        filters.Add(method);
                    }
                }
            }
            return filters;
        }
#if !PUERTS_GENERAL
        public static string GetCodeOutputDirectory()
        {
            var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                        where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                        from type in assembly.GetTypes()
                        where type.IsDefined(typeof(ConfigureAttribute), false)
                        select type;
            foreach(var type in types)
            {

                PropertyInfo[] props = type.GetProperties(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly);
                foreach (PropertyInfo prop in props)
                {
                    object[] attrs = prop.GetCustomAttributes(true);
                    foreach (object attr in attrs)
                    {
                        CodeOutputDirectoryAttribute outAttr = attr as CodeOutputDirectoryAttribute;
                        if (outAttr != null)
                        {
                            return prop.GetValue(null, null) as string;
                        }
                    }
                }
            }
            return UnityEngine.Application.dataPath + "/Gen/";
        }
#endif
    }
}
