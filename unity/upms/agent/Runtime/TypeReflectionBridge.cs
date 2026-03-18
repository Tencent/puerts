using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using UnityEngine;

namespace LLMAgent
{
    /// <summary>
    /// Reflection bridge for TypeScript.
    /// Provides progressive disclosure of C# type information:
    ///   1. GetAllNamespaces       – all distinct namespaces
    ///   2. GetTypesInNamespaces   – types under given namespaces (no member details)
    ///   3. GetTypeDetails         – full property & method signatures for given types
    ///
    /// Results are cached after the first call to avoid repeated reflection overhead.
    /// </summary>
    public static class TypeReflectionBridge
    {
        // ────── Caches ──────
        private static bool _cacheBuilt = false;

        /// <summary>Sorted list of all distinct non-empty namespaces.</summary>
        private static List<string> _namespaces;

        /// <summary>namespace → list of type summaries (name + kind).</summary>
        private static Dictionary<string, List<TypeSummary>> _nsToTypes;

        /// <summary>fullName → detailed type info.</summary>
        private static Dictionary<string, TypeDetail> _typeDetails;

        // ────── Data Models ──────
        private struct TypeSummary
        {
            public string fullName;
            public string name;
            public string kind; // "class", "struct", "enum", "interface", "delegate"
        }

        private struct TypeDetail
        {
            public string fullName;
            public string name;
            public string ns;
            public string kind;
            public string baseType;
            public List<string> interfaces;
            public List<string> properties;
            public List<string> methods;
            public List<string> fields;
            public List<string> enumValues; // only for enums
        }

        // ────── Public API ──────

        /// <summary>
        /// Return JSON array of all namespaces found across all loaded assemblies.
        /// Cached after first invocation.
        /// </summary>
        public static string GetAllNamespaces()
        {
            EnsureCache();

            var sb = new StringBuilder();
            sb.Append("{\"success\":true,\"count\":").Append(_namespaces.Count).Append(",\"namespaces\":[");
            for (int i = 0; i < _namespaces.Count; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append('"').Append(EscapeJson(_namespaces[i])).Append('"');
            }
            sb.Append("]}");
            return sb.ToString();
        }

        /// <summary>
        /// Given comma-separated namespace names, return the public types in those namespaces.
        /// No member details are returned – only type name and kind.
        /// </summary>
        public static string GetTypesInNamespaces(string namespacesComma)
        {
            EnsureCache();

            if (string.IsNullOrWhiteSpace(namespacesComma))
                return "{\"success\":false,\"error\":\"namespacesComma is empty\"}";

            var requested = namespacesComma.Split(',')
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .ToList();

            var sb = new StringBuilder();
            sb.Append("{\"success\":true,\"results\":{");

            bool first = true;
            foreach (var ns in requested)
            {
                if (!first) sb.Append(',');
                first = false;

                sb.Append('"').Append(EscapeJson(ns)).Append("\":");

                if (_nsToTypes.TryGetValue(ns, out var types))
                {
                    sb.Append('[');
                    for (int i = 0; i < types.Count; i++)
                    {
                        if (i > 0) sb.Append(',');
                        sb.Append("{\"fullName\":\"").Append(EscapeJson(types[i].fullName)).Append("\",");
                        sb.Append("\"name\":\"").Append(EscapeJson(types[i].name)).Append("\",");
                        sb.Append("\"kind\":\"").Append(types[i].kind).Append("\"}");
                    }
                    sb.Append(']');
                }
                else
                {
                    sb.Append("[]");
                }
            }

            sb.Append("}}");
            return sb.ToString();
        }

        /// <summary>
        /// Given comma-separated fully-qualified type names, return detailed info
        /// including properties, methods, and fields.
        /// </summary>
        public static string GetTypeDetails(string typeNamesComma)
        {
            EnsureCache();

            if (string.IsNullOrWhiteSpace(typeNamesComma))
                return "{\"success\":false,\"error\":\"typeNamesComma is empty\"}";

            var requested = typeNamesComma.Split(',')
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .ToList();

            var sb = new StringBuilder();
            sb.Append("{\"success\":true,\"results\":{");

            bool first = true;
            foreach (var tn in requested)
            {
                if (!first) sb.Append(',');
                first = false;

                sb.Append('"').Append(EscapeJson(tn)).Append("\":");

                if (_typeDetails.TryGetValue(tn, out var detail))
                {
                    sb.Append('{');
                    sb.Append("\"fullName\":\"").Append(EscapeJson(detail.fullName)).Append("\",");
                    sb.Append("\"name\":\"").Append(EscapeJson(detail.name)).Append("\",");
                    sb.Append("\"namespace\":\"").Append(EscapeJson(detail.ns)).Append("\",");
                    sb.Append("\"kind\":\"").Append(detail.kind).Append("\",");
                    sb.Append("\"baseType\":\"").Append(EscapeJson(detail.baseType ?? "")).Append("\",");
                    AppendStringArray(sb, "interfaces", detail.interfaces);
                    sb.Append(',');
                    AppendStringArray(sb, "properties", detail.properties);
                    sb.Append(',');
                    AppendStringArray(sb, "methods", detail.methods);
                    sb.Append(',');
                    AppendStringArray(sb, "fields", detail.fields);
                    if (detail.enumValues != null && detail.enumValues.Count > 0)
                    {
                        sb.Append(',');
                        AppendStringArray(sb, "enumValues", detail.enumValues);
                    }
                    sb.Append('}');
                }
                else
                {
                    sb.Append("null");
                }
            }

            sb.Append("}}");
            return sb.ToString();
        }

        /// <summary>
        /// Force rebuild the cache. Call this if assemblies change at runtime (rare).
        /// </summary>
        public static void InvalidateCache()
        {
            _cacheBuilt = false;
            _namespaces = null;
            _nsToTypes = null;
            _typeDetails = null;
        }

        // ────── Cache Building ──────

        private static void EnsureCache()
        {
            if (_cacheBuilt) return;
            BuildCache();
            _cacheBuilt = true;
        }

        private static void BuildCache()
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();

            _namespaces = new List<string>();
            _nsToTypes = new Dictionary<string, List<TypeSummary>>();
            _typeDetails = new Dictionary<string, TypeDetail>();

            var nsSet = new HashSet<string>();

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                // Skip dynamic assemblies
                if (asm.IsDynamic) continue;

                Type[] types;
                try
                {
                    types = asm.GetTypes();
                }
                catch (ReflectionTypeLoadException ex)
                {
                    types = ex.Types.Where(t => t != null).ToArray();
                }
                catch
                {
                    continue;
                }

                foreach (var type in types)
                {
                    // Only public, non-nested types
                    if (type == null || !type.IsPublic) continue;
                    // Skip compiler-generated types
                    if (type.Name.StartsWith("<") || type.Name.Contains("__")) continue;

                    string ns = type.Namespace ?? "(global)";
                    nsSet.Add(ns);

                    string kind = GetTypeKind(type);
                    string fullName = type.FullName;
                    if (string.IsNullOrEmpty(fullName)) continue;

                    var summary = new TypeSummary
                    {
                        fullName = fullName,
                        name = type.Name,
                        kind = kind,
                    };

                    if (!_nsToTypes.TryGetValue(ns, out var list))
                    {
                        list = new List<TypeSummary>();
                        _nsToTypes[ns] = list;
                    }
                    list.Add(summary);

                    // Build detail
                    var detail = BuildTypeDetail(type, ns, kind);
                    _typeDetails[fullName] = detail;
                }
            }

            _namespaces = nsSet.OrderBy(s => s).ToList();

            // Sort type lists
            foreach (var kv in _nsToTypes)
                kv.Value.Sort((a, b) => string.Compare(a.name, b.name, StringComparison.Ordinal));

            sw.Stop();
            Debug.Log($"[TypeReflectionBridge] Cache built: {_namespaces.Count} namespaces, " +
                      $"{_typeDetails.Count} types in {sw.ElapsedMilliseconds}ms");
        }

        private static TypeDetail BuildTypeDetail(Type type, string ns, string kind)
        {
            var detail = new TypeDetail
            {
                fullName = type.FullName,
                name = type.Name,
                ns = ns,
                kind = kind,
                baseType = type.BaseType?.FullName,
                interfaces = new List<string>(),
                properties = new List<string>(),
                methods = new List<string>(),
                fields = new List<string>(),
                enumValues = null,
            };

            // Interfaces
            try
            {
                foreach (var iface in type.GetInterfaces())
                {
                    detail.interfaces.Add(FormatTypeName(iface));
                }
            }
            catch { /* ignore */ }

            // Enum values
            if (type.IsEnum)
            {
                try
                {
                    detail.enumValues = new List<string>();
                    foreach (var val in Enum.GetNames(type))
                    {
                        var member = type.GetField(val);
                        if (member != null)
                        {
                            var underlying = Convert.ChangeType(Enum.Parse(type, val),
                                Enum.GetUnderlyingType(type));
                            detail.enumValues.Add($"{val} = {underlying}");
                        }
                        else
                        {
                            detail.enumValues.Add(val);
                        }
                    }
                }
                catch { /* ignore */ }
                return detail;
            }

            // Properties (public instance + static)
            try
            {
                var props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly);
                foreach (var prop in props)
                {
                    string accessors = "";
                    if (prop.CanRead) accessors += "get; ";
                    if (prop.CanWrite) accessors += "set; ";
                    string staticMod = prop.GetGetMethod()?.IsStatic == true || prop.GetSetMethod()?.IsStatic == true ? "static " : "";
                    detail.properties.Add($"{staticMod}{FormatTypeName(prop.PropertyType)} {prop.Name} {{ {accessors.TrimEnd()} }}");
                }
            }
            catch { /* ignore */ }

            // Fields (public instance + static, exclude backing fields)
            try
            {
                var fields = type.GetFields(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly);
                foreach (var field in fields)
                {
                    if (field.Name.Contains("__BackingField")) continue;
                    string staticMod = field.IsStatic ? "static " : "";
                    string readOnly = field.IsInitOnly ? "readonly " : "";
                    detail.fields.Add($"{staticMod}{readOnly}{FormatTypeName(field.FieldType)} {field.Name}");
                }
            }
            catch { /* ignore */ }

            // Methods (public instance + static, exclude property accessors and op_ methods)
            try
            {
                var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly);
                foreach (var method in methods)
                {
                    if (method.IsSpecialName) continue; // skip get_/set_/add_/remove_/op_
                    string staticMod = method.IsStatic ? "static " : "";
                    string returnType = FormatTypeName(method.ReturnType);

                    var parms = method.GetParameters();
                    var parmsStr = string.Join(", ", parms.Select(p => $"{FormatTypeName(p.ParameterType)} {p.Name}"));

                    string genericSuffix = "";
                    if (method.IsGenericMethodDefinition)
                    {
                        var gargs = method.GetGenericArguments();
                        genericSuffix = "<" + string.Join(", ", gargs.Select(g => g.Name)) + ">";
                    }

                    detail.methods.Add($"{staticMod}{returnType} {method.Name}{genericSuffix}({parmsStr})");
                }
            }
            catch { /* ignore */ }

            return detail;
        }

        // ────── Helpers ──────

        private static string GetTypeKind(Type type)
        {
            if (type.IsEnum) return "enum";
            if (type.IsInterface) return "interface";
            if (typeof(Delegate).IsAssignableFrom(type)) return "delegate";
            if (type.IsValueType) return "struct";
            return "class";
        }

        /// <summary>
        /// Format a Type into a readable short name, handling generics.
        /// </summary>
        private static string FormatTypeName(Type type)
        {
            if (type == null) return "void";
            if (type == typeof(void)) return "void";
            if (type == typeof(int)) return "int";
            if (type == typeof(uint)) return "uint";
            if (type == typeof(long)) return "long";
            if (type == typeof(ulong)) return "ulong";
            if (type == typeof(short)) return "short";
            if (type == typeof(ushort)) return "ushort";
            if (type == typeof(byte)) return "byte";
            if (type == typeof(sbyte)) return "sbyte";
            if (type == typeof(float)) return "float";
            if (type == typeof(double)) return "double";
            if (type == typeof(decimal)) return "decimal";
            if (type == typeof(bool)) return "bool";
            if (type == typeof(string)) return "string";
            if (type == typeof(object)) return "object";
            if (type == typeof(char)) return "char";

            if (type.IsArray)
            {
                return FormatTypeName(type.GetElementType()) + "[]";
            }

            if (type.IsByRef)
            {
                return "ref " + FormatTypeName(type.GetElementType());
            }

            if (type.IsGenericType)
            {
                string baseName = type.Name;
                int backtick = baseName.IndexOf('`');
                if (backtick > 0) baseName = baseName.Substring(0, backtick);

                var genericArgs = type.GetGenericArguments();
                string argsStr = string.Join(", ", genericArgs.Select(FormatTypeName));
                string nsPrefix = type.Namespace != null ? type.Namespace + "." : "";
                return $"{nsPrefix}{baseName}<{argsStr}>";
            }

            return type.FullName ?? type.Name;
        }

        private static void AppendStringArray(StringBuilder sb, string key, List<string> items)
        {
            sb.Append('"').Append(key).Append("\":[");
            if (items != null)
            {
                for (int i = 0; i < items.Count; i++)
                {
                    if (i > 0) sb.Append(',');
                    sb.Append('"').Append(EscapeJson(items[i])).Append('"');
                }
            }
            sb.Append(']');
        }

        private static string EscapeJson(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";

            var sb = new StringBuilder(str.Length);
            foreach (char c in str)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 0x20)
                            sb.Append($"\\u{(int)c:x4}");
                        else
                            sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }
    }
}
