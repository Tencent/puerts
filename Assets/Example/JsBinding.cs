namespace Js
{
#if UNITY_EDITOR
    using System.Linq;
    using System.Reflection;
    using UnityEditor;
#endif
    using System;
    using System.Collections.Generic;
    using UnityEngine;
    using Object = UnityEngine.Object;

    /// <summary>
    /// 绑定参数
    /// </summary>
    public class JsBinding : MonoBehaviour
    {
        public JsArg[] args;
    }
    [Serializable]
    public struct JsArg
    {
        public string name;
        public Object value;
    }

#if UNITY_EDITOR
    [CustomEditor(typeof(JsBinding))]
    [CanEditMultipleObjects]
    public class JsBindingEditor : Editor
    {
        private JsBinding ins;
        private SerializedProperty argsProp;
        //当前选中行
        private int select;

        //组件缓存
        private Dictionary<SerializedProperty, State> components;

        void OnEnable()
        {
            ins = target as JsBinding;
            argsProp = serializedObject.FindProperty("args");

            //Debug.Log("OnEnable");
            select = -1;
            if(components != null) components.Clear();
            components = new Dictionary<SerializedProperty, State>();
        }
        void OnDisable()
        {
            //Debug.Log("OnDisable");
            if (components != null) components.Clear();
            components = null;
        }
        List<Object> GetCompoents(Object obj)
        {
            if (obj != null)
            {
                var lst = new List<Object>() { };
                var type = obj.GetType();
                //使用反射, 获取GameObject和Transform组件
                var gameObjectProperty = type.GetProperty("gameObject");
                var transformProperty = type.GetProperty("transform");
                var gobj = (gameObjectProperty == null ? null : gameObjectProperty.GetValue(obj, null)) as GameObject;
                var trf = (transformProperty == null ? null : transformProperty.GetValue(obj, null)) as Transform;
                //使用反射调用GetComponents方法, 获取所有组件, 如果有gameObject则从Gameobject对象中获取所有组件(排除obj自身对排序的干扰)
                if (gobj != null) type = gobj.GetType();
                MethodInfo get_components = (
                    from method in type.GetMethods()
                    where method.Name == "GetComponents"
                       && method.ReturnType == typeof(Component[])
                       && method.GetParameters().Length == 1
                       && method.GetParameters()[0].ParameterType == typeof(Type)
                    select method).FirstOrDefault();
                if (get_components != null)
                {
                    var components = get_components.Invoke(gobj ?? obj, new object[] { typeof(Component) }) as Component[];
                    foreach (var o in components)
                    {
                        if (!lst.Contains(o)) lst.Add(o);
                    }
                }
                //obj自身
                if (!lst.Contains(obj)) lst.Add(obj);
                //通过Type名进行排序
                lst = (from o in lst orderby o.GetType().Name select o).ToList();
                //GameObject / Transform
                if (trf != null) { lst.Remove(trf); lst.Insert(0, trf); }
                if (gobj != null) { lst.Remove(gobj); lst.Insert(0, gobj); }

                return lst;
            }
            return new List<Object>() { };
        }
        State GetState(SerializedProperty prop)
        {
            State v;
            if (!components.TryGetValue(prop, out v) || v.refObject != prop.objectReferenceValue)
            {
                var _components = GetCompoents(prop.objectReferenceValue);
                var _names = (from c in _components
                              where c != null
                              select c.GetType().Name)
                            .ToArray();
                var _index = _components.IndexOf(prop.objectReferenceValue);
                //重命名同类型组件
                var _name_dict = new Dictionary<string, int>();
                foreach (var _name in _names)
                {
                    if (_name_dict.ContainsKey(_name))
                    {
                        var _count = _name_dict[_name];
                        _name_dict[_name] = _count == 0 ? 2 : _count++;
                    }
                    else _name_dict.Add(_name, 0);
                }
                for (int i = _names.Length - 1; i >= 0; i--)
                {
                    var _count = _name_dict[_names[i]];
                    if (_count > 0)
                    {
                        _name_dict[_names[i]] = _count - 1;
                        _names[i] += "(" + _count + ")";
                    }
                }

                v = new State(_index, _names, _components);
                v.refObject = prop.objectReferenceValue;

                this.components.Remove(prop);
                this.components.Add(prop, v);
            }
            return v;
        }
        void SetState(SerializedProperty prop, State state)
        {
            if (state.index >= 0 && state.index < state.components.Count)
                prop.objectReferenceValue = state.components[state.index];

            this.components.Remove(prop);
            this.components.Add(prop, state);
        }

        public override void OnInspectorGUI()
        {
            if (ins == null || argsProp == null)
            {
                base.OnInspectorGUI();
                return;
            }
            serializedObject.Update();

            //Args Menu
            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField("Size", GUILayout.Width(50f));
            argsProp.arraySize = EditorGUILayout.IntField(argsProp.arraySize, GUILayout.Width(50f));
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("○"))
            {
                //Refresh
                if (components != null) components.Clear();
            }
            GUILayout.Space(5f);
            if (GUILayout.Button("+"))
            {
                //Add Row
                argsProp.arraySize++;
                select = argsProp.arraySize - 1;
                //Name
                argsProp.GetArrayElementAtIndex(select).FindPropertyRelative("name").stringValue = "arg" + select;
            }
            if (GUILayout.Button("-"))
            {
                //Remove Row
                if (select >= 0)
                {
                    argsProp.DeleteArrayElementAtIndex(select);
                    if (select >= argsProp.arraySize)
                        select = argsProp.arraySize - 1;
                }
                else if (argsProp.arraySize > 0)
                    argsProp.arraySize--;
            }
            GUILayout.Space(5f);
            if (GUILayout.Button("↑") && select > 0)
            {
                //Move Up Row
                argsProp.MoveArrayElement(select, --select);
            }
            if (GUILayout.Button("↓") && select >= 0 && select < argsProp.arraySize - 1)
            {
                //Move Down Row
                argsProp.MoveArrayElement(select, ++select);
            }
            EditorGUILayout.EndHorizontal();
            //Args Title
            EditorGUILayout.BeginHorizontal();
            argsProp.isExpanded = EditorGUILayout.Foldout(argsProp.isExpanded, "Name");
            GUILayout.FlexibleSpace();
            EditorGUILayout.LabelField("Object", GUILayout.Width(80f));
            EditorGUILayout.LabelField("Components", GUILayout.Width(80f));
            EditorGUILayout.EndHorizontal();
            //Element Array
            if (argsProp.isExpanded)
            {
                for (int i = 0; i < argsProp.arraySize; i++)
                {
                    var element = argsProp.GetArrayElementAtIndex(i);
                    var el_name = element.FindPropertyRelative("name");
                    var el_value = element.FindPropertyRelative("value");

                    var state = GetState(el_value);
                    var index = state.index;
                    var tog = select == i;
                    //GUI
                    EditorGUILayout.BeginHorizontal();
                    GUILayout.Space(10f);
                    var g_name = GUILayout.TextField(el_name.stringValue) ?? "";
                    var g_obj = EditorGUILayout.ObjectField(el_value.objectReferenceValue, typeof(Object), true, GUILayout.Width(80f));
                    var g_index = EditorGUILayout.Popup(index, state.names, GUILayout.Width(80f));
                    var g_tog = EditorGUILayout.Toggle(tog, GUILayout.Width(15f));
                    EditorGUILayout.EndHorizontal();
                    //GUI Update
                    el_name.stringValue = g_name;
                    if (el_value.objectReferenceValue != g_obj)
                    {
                        var before_type = state.Now();
                        //New Object
                        el_value.objectReferenceValue = g_obj;
                        state = GetState(el_value);

                        index = int.MinValue;
                        g_index = state.IndexOf(before_type);
                    }
                    if (g_index != index)
                    {
                        state.index = g_index;
                        SetState(el_value, state);
                    }
                    if (g_tog) select = i;
                    else if (tog) select = -1;
                }
            }

            //保存更改
            serializedObject.ApplyModifiedProperties();
        }

        private class State
        {
            public Object refObject { get; set; }
            public int index { get; set; }
            public string[] names { get; private set; }
            public List<Object> components { get; private set; }

            public State(int index, string[] names, List<Object> components)
            {
                this.index = index;
                this.names = names;
                this.components = components;
            }

            public string Now()
            {
                if (index >= 0 && index < names.Length)
                    return names[index];
                return "";
            }
            public int IndexOf(string type)
            {
                //Type是重命名的类型
                var repeat_i = type.IndexOf("(");
                if (repeat_i >= 0)
                    type = type.Substring(0, repeat_i);
                //在names中查找Type, Name中可能包含重命名
                for (int i = 0; i < names.Length; i++)
                {
                    if (type == names[i] || names[i].Contains(type + "("))
                        return i;
                }
                return index;
            }
        }
    }
#endif
}