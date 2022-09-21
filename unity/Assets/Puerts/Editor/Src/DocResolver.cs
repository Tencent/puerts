/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.IO;
using System.Text;
using System.Reflection;
using System.Collections.Generic;
using System.Xml;

namespace Puerts
{
    public class DocResolver
    {
        public class DocBody
        {
            public string name;
            public string[] summary;
            public Dictionary<string, string> parameters = new Dictionary<string, string>();
            public string returns;

            public string ToJsDoc()
            {
                var sb = new StringBuilder();
                if (this.summary != null && this.summary.Length > 1)
                {
                    sb.AppendLine("/**");
                    foreach (var line in this.summary)
                    {
                        //sb.AppendLine($" * {line.Replace('\r', ' ')}");
                        sb.AppendLine(string.Format(" * {0}", line.Replace('\r', ' ')));
                    }
                }
                else
                {
                    if (this.summary == null || this.summary.Length == 0 || string.IsNullOrEmpty(this.summary[0]))
                    {
                        if (this.parameters.Count == 0 && string.IsNullOrEmpty(this.returns))
                        {
                            return sb.ToString();
                        }

                        if ((this.parameters != null || this.parameters.Count == 0) && string.IsNullOrEmpty(this.returns))
                        {
                            sb.Append("/**");
                        }
                        else
                        {
                            sb.AppendLine("/**");
                        }
                    }
                    else
                    {
                        if ((this.parameters != null || this.parameters.Count == 0) && string.IsNullOrEmpty(this.returns))
                        {
                            //sb.Append($"/** {this.summary[0]}");
                            sb.AppendLine(string.Format("/** {0}", this.summary[0]));
                        }
                        else
                        {
                            //sb.AppendLine($"/** {this.summary[0]}");
                            sb.AppendLine(string.Format("/** {0}", this.summary[0]));
                        }
                    }
                }

                if (this.parameters != null)
                {
                    foreach (var kv in this.parameters)
                    {
                        var pname = kv.Key;
                        var ptext = kv.Value;
                        //sb.AppendLine($" * @param {pname} {ptext}");
                        sb.AppendLine(string.Format(" * @param {0} {1}", pname, ptext));
                    }
                }

                if (!string.IsNullOrEmpty(this.returns))
                {
                    //sb.AppendLine($" * @returns {this.returns}");
                    sb.AppendLine(string.Format(" * @returns {0}", this.returns));
                }

                return sb.ToString().Replace("*/", "* /") + " */";
            }
        }

        private static Dictionary<Assembly, DocResolver> _resolvers = new Dictionary<Assembly, DocResolver>();

        private StringBuilder _sb = new StringBuilder();
        private Dictionary<string, DocBody> _tdocs = new Dictionary<string, DocBody>();
        private Dictionary<string, DocBody> _pdocs = new Dictionary<string, DocBody>();
        private Dictionary<string, DocBody> _fdocs = new Dictionary<string, DocBody>();
        private Dictionary<string, DocBody> _mdocs = new Dictionary<string, DocBody>();

        public static DocResolver GetResolver(Assembly assembly)
        {
            DocResolver resolver;
            if (!_resolvers.TryGetValue(assembly, out resolver))
            {
                resolver = _resolvers[assembly] = new DocResolver();
                if (!LoadXmlDocFrom(resolver, assembly.Location))
                {
                    // var fi = new FileInfo(assembly.Location);
                    // LoadXmlDocFrom(resolver, Path.Combine(bindingManager.prefs.xmlDocDir, fi.Name));
                }
            }
            return resolver;
        }

        public static bool LoadXmlDocFrom(DocResolver resolver, string location)
        {
            try
            {
                var ext = Path.GetExtension(location);
                var xmlFilePath = location.Substring(0, location.Length - ext.Length) + ".xml";
                //增加文档查找路径 
                if (!File.Exists(xmlFilePath))
                {
                    xmlFilePath = xmlFilePath.Replace("Library\\ScriptAssemblies\\", "Library\\CommonetDocs\\");
                }
                return resolver.ParseXml(xmlFilePath);
            }
            catch (Exception)
            {
                return false;
            }
        }

        public static string GetTsDocument(MethodBase methodBase)
        {
            //return GetResolver(methodBase.DeclaringType.Assembly).GetDocBody(methodBase)?.ToJsDoc() ?? "";

            var docBody = GetResolver(methodBase.DeclaringType.Assembly).GetDocBody(methodBase);

            if (docBody != null && docBody.ToJsDoc() != null)
            {
                return docBody.ToJsDoc();
            }
            return "";
        }

        public static string GetTsDocument(FieldInfo fieldInfo)
        {
            //return GetResolver(fieldInfo.DeclaringType.Assembly).GetDocBody(fieldInfo)?.ToJsDoc() ?? "";

            var docBody = GetResolver(fieldInfo.DeclaringType.Assembly).GetDocBody(fieldInfo);

            if (docBody != null && docBody.ToJsDoc() != null)
            {
                return docBody.ToJsDoc();
            }
            return "";
        }

        public static string GetTsDocument(PropertyInfo propertyInfo)
        {
            //return GetResolver(propertyInfo.DeclaringType.Assembly).GetDocBody(propertyInfo)?.ToJsDoc() ?? "";

            var docBody = GetResolver(propertyInfo.DeclaringType.Assembly).GetDocBody(propertyInfo);

            if (docBody != null && docBody.ToJsDoc() != null)
            {
                return docBody.ToJsDoc();
            }
            return "";
        }

        public static string GetTsDocument(Type type)
        {
            //return GetResolver(type.Assembly).GetDocBody(type)?.ToJsDoc() ?? "";
            var docBody = GetResolver(type.Assembly).GetDocBody(type);

            if (docBody != null && docBody.ToJsDoc() != null)
            {
                return docBody.ToJsDoc();
            }
            return "";
        }

        public DocBody GetFieldDocBody(string path)
        {
            DocBody body;
            _fdocs.TryGetValue(path, out body);
            return body;
        }

        public DocBody GetDocBody(Type type)
        {
            if (type.IsGenericType || type.IsGenericTypeDefinition || !type.IsPublic)
            {
                return null;
            }
            var xName = type.FullName;
            DocBody body;
            _tdocs.TryGetValue(xName, out body);
            return body;
        }

        public DocBody GetDocBody<T>(T methodBase)
        where T : MethodBase
        {
            if (methodBase.IsGenericMethod || !methodBase.IsPublic || methodBase.ContainsGenericParameters)
            {
                return null;
            }
            var declType = methodBase.DeclaringType;
            //_sb.Clear();
            _sb.Remove(0, _sb.Length);
            _sb.Append(declType.FullName);
            _sb.Append('.');
            _sb.Append(methodBase.Name);
            _sb.Append('(');
            if (!ExtractMethodParamters(methodBase, _sb))
            {
                return null;
            }
            _sb.Append(')');
            var xName = _sb.ToString();
            DocBody body;
            _mdocs.TryGetValue(xName, out body);
            return body;
        }

        public DocBody GetDocBody(FieldInfo fieldInfo)
        {
            if (!fieldInfo.IsPublic)
            {
                return null;
            }
            var declType = fieldInfo.DeclaringType;
            var xName = declType.FullName + "." + fieldInfo.Name;
            DocBody body;
            _fdocs.TryGetValue(xName, out body);
            return body;
        }

        public DocBody GetDocBody(PropertyInfo propertyInfo)
        {
            if (propertyInfo.GetGetMethod() == null || !propertyInfo.GetGetMethod().IsPublic)
            {
                return null;
            }
            var declType = propertyInfo.DeclaringType;
            var xName = declType.FullName + "." + propertyInfo.Name;
            DocBody body;
            _pdocs.TryGetValue(xName, out body);
            return body;
        }

        private bool ExtractMethodParamters<T>(T methodBase, StringBuilder sb)
        where T : MethodBase
        {
            var parameters = methodBase.GetParameters();
            for (int i = 0, size = parameters.Length; i < size; i++)
            {
                var type = parameters[i].ParameterType;
                if (type.IsGenericType)
                {
                    return false;
                }
                sb.Append(type.FullName);
                if (i != size - 1)
                {
                    sb.Append(',');
                }
            }
            return true;
        }

        private void ParseXmlMember(XmlReader reader, DocBody body, string elementName)
        {
            while (reader.Read())
            {
                var type = reader.NodeType;

                if (type == XmlNodeType.EndElement && reader.Name == elementName)
                {
                    break;
                }

                if (type == XmlNodeType.Element && reader.Name == "summary")
                {
                    body.summary = ReadTextBlock(reader, body, "summary");
                }

                if (type == XmlNodeType.Element && reader.Name == "param")
                {
                    var pname = reader.GetAttribute("name");
                    var ptext = ReadSingleTextBlock(reader, body, "param");

                    if (!string.IsNullOrEmpty(ptext))
                    {
                        body.parameters[pname] = ptext;
                    }
                }

                if (type == XmlNodeType.Element && reader.Name == "returns")
                {
                    body.returns = ReadSingleTextBlock(reader, body, "returns");
                }
            }
        }

        private string[] ReadTextBlock(XmlReader reader, DocBody body, string elementName)
        {
            var lines = new List<string>();

            if (!reader.IsEmptyElement)
            {
                while (reader.Read())
                {
                    var type = reader.NodeType;
                    if (type == XmlNodeType.EndElement && reader.Name == elementName)
                    {
                        break;
                    }

                    if (type == XmlNodeType.Element && reader.Name == "para")
                    {
                        lines.Add(ReadElementContentAsString(reader, body, "para"));
                    }
                    else if (type == XmlNodeType.Text || type == XmlNodeType.CDATA)
                    {
                        foreach (var line in reader.Value.Split('\n'))
                        {
                            var trim = line.Trim();
                            if (trim.Length > 0)
                            {
                                lines.Add(trim);
                            }
                        }
                    }
                }
            }

            return lines.ToArray();
        }

        private string ReadElementContentAsString(XmlReader reader, DocBody body, string elementName)
        {
            var text = string.Empty;
            while (reader.Read())
            {
                var type = reader.NodeType;
                if (type == XmlNodeType.EndElement && reader.Name == elementName)
                {
                    break;
                }
                if (type == XmlNodeType.Text)
                {
                    text = reader.Value;
                }
            }
            return text;
        }

        private string ReadSingleTextBlock(XmlReader reader, DocBody body, string elementName)
        {
            //_sb.Clear();
            _sb.Remove(0, _sb.Length);
            if (!reader.IsEmptyElement)
            {
                while (reader.Read())
                {
                    var type = reader.NodeType;
                    if (type == XmlNodeType.EndElement && reader.Name == elementName)
                    {
                        break;
                    }
                    if (type == XmlNodeType.Element && reader.Name == "para")
                    {
                        _sb.Append(ReadElementContentAsString(reader, body, "para"));
                        _sb.Append(' ');
                    }
                    if (type == XmlNodeType.Text)
                    {
                        _sb.Append(reader.Value);
                    }
                }
            }
            return _sb.ToString();
        }

        public bool ParseXml(string filename)
        {
            if (!File.Exists(filename))
            {
                return false;
            }

            // Debug.LogFormat("read doc: {0}", filename);
            using (var fs = File.OpenRead(filename))
            {
                using (var reader = XmlReader.Create(fs))
                {
                    while (reader.Read())
                    {
                        var type = reader.NodeType;
                        if (type == XmlNodeType.Element && reader.Name == "member")
                        {
                            var body = new DocBody();
                            var name = reader.GetAttribute("name");
                            if (name.Length > 2)
                            {
                                var subname = name.Substring(2);
                                body.name = subname;
                                switch (name[0])
                                {
                                    case 'F': _fdocs[subname] = body; break;
                                    case 'P': _pdocs[subname] = body; break;
                                    case 'M': _mdocs[subname] = body; break;
                                    case 'T': _tdocs[subname] = body; break;
                                }
                            }
                            ParseXmlMember(reader, body, "member");
                        }
                    }
                }
            }

            return true;
        }
    }
}
