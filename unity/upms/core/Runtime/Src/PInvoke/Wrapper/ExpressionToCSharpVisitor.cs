/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION || !ENABLE_IL2CPP

using System;
using System.Text;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Collections.Generic;

namespace Puerts
{
    /// <summary>
    /// Translates a System.Linq.Expressions.Expression tree into equivalent C# source code.
    /// Used as the backend for static wrapper code generation — the Expression Tree serves as IR.
    /// </summary>
    public class ExpressionToCSharpVisitor : ExpressionVisitor
    {
        private readonly StringBuilder _sb = new StringBuilder();
        private int _indentLevel = 0;
        private const string IndentUnit = "    ";

        // Track whether the current expression is in a statement context (needs semicolons)
        private bool _isStatementContext = false;

        // Track whether conditional branches should emit "return" before their result values
        private bool _needsReturnInBranches = false;

        // Track whether we are inside a loop body — blocks inside loops should not emit "return"
        private bool _isInsideLoop = false;

        // Track loop break/continue labels so we can emit "break"/"continue" instead of "goto"
        private HashSet<LabelTarget> _loopBreakLabels = new HashSet<LabelTarget>();
        private HashSet<LabelTarget> _loopContinueLabels = new HashSet<LabelTarget>();

        // Variable name mapping: ParameterExpression -> generated name
        private readonly Dictionary<ParameterExpression, string> _variableNames = new Dictionary<ParameterExpression, string>();
        private int _varCounter = 0;

        // Label name mapping
        private readonly Dictionary<LabelTarget, string> _labelNames = new Dictionary<LabelTarget, string>();
        private int _labelCounter = 0;

        // Collected static field initializers for runtime objects that cannot be expressed as literals
        private readonly List<StaticFieldInfo> _staticFields = new List<StaticFieldInfo>();
        private int _staticFieldCounter = 0;

        /// <summary>
        /// Represents a static field that needs to be declared in the generated class
        /// for holding runtime objects (e.g. MethodInfo, FieldInfo) that cannot be inlined as literals.
        /// </summary>
        public class StaticFieldInfo
        {
            public string FieldName;
            public Type FieldType;
            public string InitializerCode;
        }

        /// <summary>
        /// Gets the list of static fields that need to be declared in the generated wrapper class.
        /// </summary>
        public IReadOnlyList<StaticFieldInfo> StaticFields => _staticFields;

        /// <summary>
        /// Translates an Expression tree into a C# source code string.
        /// </summary>
        public string Translate(Expression expression)
        {
            _sb.Clear();
            _variableNames.Clear();
            _varCounter = 0;
            _labelNames.Clear();
            _labelCounter = 0;
            _staticFields.Clear();
            _staticFieldCounter = 0;
            _isStatementContext = false;

            Visit(expression);
            return _sb.ToString();
        }

        #region Helpers

        private void Indent()
        {
            for (int i = 0; i < _indentLevel; i++)
                _sb.Append(IndentUnit);
        }

        private void AppendLine(string text = "")
        {
            _sb.AppendLine(text);
        }

        private void Append(string text)
        {
            _sb.Append(text);
        }

        private string GetVariableName(ParameterExpression param)
        {
            if (!_variableNames.TryGetValue(param, out var name))
            {
                // Use the original name if available, otherwise generate one
                if (!string.IsNullOrEmpty(param.Name))
                {
                    name = param.Name;
                    // Ensure uniqueness
                    if (_variableNames.Values.Contains(name))
                    {
                        name = $"{param.Name}_{_varCounter++}";
                    }
                }
                else
                {
                    name = $"var_{_varCounter++}";
                }
                _variableNames[param] = name;
            }
            return name;
        }

        private string GetLabelName(LabelTarget label)
        {
            if (!_labelNames.TryGetValue(label, out var name))
            {
                if (!string.IsNullOrEmpty(label.Name))
                {
                    name = $"label_{label.Name}_{_labelCounter++}";
                }
                else
                {
                    name = $"label_{_labelCounter++}";
                }
                _labelNames[label] = name;
            }
            return name;
        }

        /// <summary>
        /// Converts a System.Type to its fully-qualified C# type name string.
        /// Handles generics, arrays, nested types, by-ref types, and nullable.
        /// </summary>
        public static string GetTypeName(Type type)
        {
            return GetTypeNameInternal(type, null);
        }

        private static string GetTypeNameInternal(Type type, HashSet<Type> visiting)
        {
            if (type == null) return "void";

            // Handle generic parameters (e.g. T, TKey, TValue) — return just the name
            if (type.IsGenericParameter)
            {
                return type.Name;
            }

            // Handle by-ref types (e.g. ref int, out string)
            if (type.IsByRef)
            {
                return GetTypeNameInternal(type.GetElementType(), visiting);
            }

            // Handle pointer types
            if (type.IsPointer)
            {
                return GetTypeNameInternal(type.GetElementType(), visiting) + "*";
            }

            // Handle array types
            if (type.IsArray)
            {
                int rank = type.GetArrayRank();
                string elementType = GetTypeNameInternal(type.GetElementType(), visiting);
                if (rank == 1)
                    return elementType + "[]";
                else
                    return elementType + "[" + new string(',', rank - 1) + "]";
            }

            // Handle well-known primitive type aliases
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
            if (type == typeof(bool)) return "bool";
            if (type == typeof(char)) return "char";
            if (type == typeof(string)) return "string";
            if (type == typeof(object)) return "object";
            if (type == typeof(decimal)) return "decimal";

            // Handle generic types
            if (type.IsGenericType)
            {
                Type genericDef = type.GetGenericTypeDefinition();
                // Handle Nullable<T>
                if (genericDef == typeof(Nullable<>))
                {
                    return GetTypeNameInternal(type.GetGenericArguments()[0], visiting) + "?";
                }

                var allGenericArgs = type.GetGenericArguments();

                string baseName;
                if (type.IsNested && type.DeclaringType != null && type.DeclaringType.IsGenericType)
                {
                    // For types nested in generic types (e.g. List<int>.Enumerator),
                    // the generic arguments include both the declaring type's args and the nested type's own args.
                    // We need to split them: declaring type's args go to the declaring type,
                    // and only the nested type's own args (if any) go to the nested type.
                    var declaringGenericArgs = type.DeclaringType.GetGenericArguments();
                    int declaringArgCount = declaringGenericArgs.Length;

                    // Construct the declaring type with its concrete generic arguments
                    var declaringArgs = allGenericArgs.Take(declaringArgCount).ToArray();
                    Type constructedDeclaringType;
                    try
                    {
                        if (type.DeclaringType.IsGenericTypeDefinition)
                            constructedDeclaringType = type.DeclaringType.MakeGenericType(declaringArgs);
                        else
                            constructedDeclaringType = type.DeclaringType;
                    }
                    catch
                    {
                        constructedDeclaringType = type.DeclaringType;
                    }

                    baseName = GetTypeNameInternal(constructedDeclaringType, visiting) + "." + type.Name;

                    // Remove the `N suffix from the nested type name
                    int backtickIndex = baseName.LastIndexOf('`');
                    if (backtickIndex >= 0)
                        baseName = baseName.Substring(0, backtickIndex);

                    // Only include the nested type's own generic arguments (not the declaring type's)
                    var ownArgs = allGenericArgs.Skip(declaringArgCount).ToArray();
                    if (ownArgs.Length > 0)
                    {
                        string[] typeArgNames = ownArgs.Select(t => GetTypeNameInternal(t, visiting)).ToArray();
                        return baseName + "<" + string.Join(", ", typeArgNames) + ">";
                    }
                    return baseName;
                }
                else if (type.IsNested)
                {
                    baseName = GetTypeNameInternal(type.DeclaringType, visiting) + "." + type.Name;
                }
                else
                {
                    baseName = (string.IsNullOrEmpty(type.Namespace) ? "" : type.Namespace + ".") + type.Name;
                }

                // Remove the `N suffix from generic type names
                int btIdx = baseName.IndexOf('`');
                if (btIdx >= 0)
                    baseName = baseName.Substring(0, btIdx);

                string[] typeArgs = allGenericArgs.Select(t => GetTypeNameInternal(t, visiting)).ToArray();
                return baseName + "<" + string.Join(", ", typeArgs) + ">";
            }

            // Handle nested types
            if (type.IsNested)
            {
                // For types nested in generic types (e.g. List<int>.Enumerator),
                // we need to handle the case where DeclaringType is a generic type definition.
                // In that case, the nested type's generic arguments include the declaring type's
                // generic arguments, which we need to resolve properly.
                var declaringType = type.DeclaringType;
                if (declaringType != null && declaringType.IsGenericTypeDefinition)
                {
                    // The type itself may carry the concrete generic arguments from the declaring type.
                    // For example, for List<int>.Enumerator, type.GetGenericArguments() may return [int].
                    // We need to construct the declaring type with those arguments.
                    var typeGenericArgs = type.GetGenericArguments();
                    var declaringGenericParams = declaringType.GetGenericArguments();
                    if (typeGenericArgs.Length >= declaringGenericParams.Length && declaringGenericParams.Length > 0)
                    {
                        // Take the first N arguments that belong to the declaring type
                        var declaringArgs = typeGenericArgs.Take(declaringGenericParams.Length).ToArray();
                        // Only construct if we have concrete types (not generic parameters)
                        if (declaringArgs.All(a => !a.IsGenericParameter))
                        {
                            try
                            {
                                var constructedDeclaringType = declaringType.MakeGenericType(declaringArgs);
                                return GetTypeNameInternal(constructedDeclaringType, visiting) + "." + type.Name;
                            }
                            catch
                            {
                                // Fall through to default handling
                            }
                        }
                    }
                }
                return GetTypeNameInternal(declaringType, visiting) + "." + type.Name;
            }

            // Default: fully qualified name
            if (string.IsNullOrEmpty(type.Namespace))
                return type.Name;
            return type.Namespace + "." + type.Name;
        }

        /// <summary>
        /// Gets the C# operator string for a given ExpressionType.
        /// </summary>
        private static string GetBinaryOperator(ExpressionType nodeType)
        {
            switch (nodeType)
            {
                case ExpressionType.Add: return "+";
                case ExpressionType.AddChecked: return "+";
                case ExpressionType.Subtract: return "-";
                case ExpressionType.SubtractChecked: return "-";
                case ExpressionType.Multiply: return "*";
                case ExpressionType.MultiplyChecked: return "*";
                case ExpressionType.Divide: return "/";
                case ExpressionType.Modulo: return "%";
                case ExpressionType.And: return "&";
                case ExpressionType.Or: return "|";
                case ExpressionType.ExclusiveOr: return "^";
                case ExpressionType.LeftShift: return "<<";
                case ExpressionType.RightShift: return ">>";
                case ExpressionType.AndAlso: return "&&";
                case ExpressionType.OrElse: return "||";
                case ExpressionType.Equal: return "==";
                case ExpressionType.NotEqual: return "!=";
                case ExpressionType.LessThan: return "<";
                case ExpressionType.LessThanOrEqual: return "<=";
                case ExpressionType.GreaterThan: return ">";
                case ExpressionType.GreaterThanOrEqual: return ">=";
                case ExpressionType.Assign: return "=";
                case ExpressionType.AddAssign: return "+=";
                case ExpressionType.SubtractAssign: return "-=";
                case ExpressionType.MultiplyAssign: return "*=";
                case ExpressionType.DivideAssign: return "/=";
                case ExpressionType.ModuloAssign: return "%=";
                case ExpressionType.AndAssign: return "&=";
                case ExpressionType.OrAssign: return "|=";
                case ExpressionType.ExclusiveOrAssign: return "^=";
                case ExpressionType.LeftShiftAssign: return "<<=";
                case ExpressionType.RightShiftAssign: return ">>=";
                case ExpressionType.Coalesce: return "??";
                default:
                    throw new NotSupportedException($"Binary operator {nodeType} is not supported.");
            }
        }

        private bool IsAssignmentExpression(ExpressionType nodeType)
        {
            switch (nodeType)
            {
                case ExpressionType.Assign:
                case ExpressionType.AddAssign:
                case ExpressionType.SubtractAssign:
                case ExpressionType.MultiplyAssign:
                case ExpressionType.DivideAssign:
                case ExpressionType.ModuloAssign:
                case ExpressionType.AndAssign:
                case ExpressionType.OrAssign:
                case ExpressionType.ExclusiveOrAssign:
                case ExpressionType.LeftShiftAssign:
                case ExpressionType.RightShiftAssign:
                    return true;
                default:
                    return false;
            }
        }

        #endregion

        #region Basic Node Visitors

        protected override Expression VisitConstant(ConstantExpression node)
        {
            if (node.Value == null)
            {
                Append("null");
                return node;
            }

            Type type = node.Value.GetType();

            // Handle Type constants -> typeof(T)
            if (node.Value is Type typeValue)
            {
                Append($"typeof({GetTypeName(typeValue)})");
                return node;
            }

            // Handle IntPtr
            if (type == typeof(IntPtr))
            {
                var ptr = (IntPtr)node.Value;
                if (ptr == IntPtr.Zero)
                {
                    Append("System.IntPtr.Zero");
                }
                else
                {
                    Append($"new System.IntPtr({ptr.ToInt64()})");
                }
                return node;
            }

            // Handle UIntPtr
            if (type == typeof(UIntPtr))
            {
                var ptr = (UIntPtr)node.Value;
                if (ptr == UIntPtr.Zero)
                {
                    Append("System.UIntPtr.Zero");
                }
                else
                {
                    Append($"new System.UIntPtr({ptr.ToUInt64()})");
                }
                return node;
            }

            // Handle primitive types
            if (type == typeof(int))
            {
                Append(node.Value.ToString());
                return node;
            }
            if (type == typeof(uint))
            {
                Append(node.Value.ToString() + "u");
                return node;
            }
            if (type == typeof(long))
            {
                Append(node.Value.ToString() + "L");
                return node;
            }
            if (type == typeof(ulong))
            {
                Append(node.Value.ToString() + "uL");
                return node;
            }
            if (type == typeof(short))
            {
                Append($"(short){node.Value}");
                return node;
            }
            if (type == typeof(ushort))
            {
                Append($"(ushort){node.Value}");
                return node;
            }
            if (type == typeof(byte))
            {
                Append($"(byte){node.Value}");
                return node;
            }
            if (type == typeof(sbyte))
            {
                Append($"(sbyte){node.Value}");
                return node;
            }
            if (type == typeof(float))
            {
                var f = (float)node.Value;
                if (float.IsPositiveInfinity(f)) Append("float.PositiveInfinity");
                else if (float.IsNegativeInfinity(f)) Append("float.NegativeInfinity");
                else if (float.IsNaN(f)) Append("float.NaN");
                else Append(f.ToString("R") + "f");
                return node;
            }
            if (type == typeof(double))
            {
                var d = (double)node.Value;
                if (double.IsPositiveInfinity(d)) Append("double.PositiveInfinity");
                else if (double.IsNegativeInfinity(d)) Append("double.NegativeInfinity");
                else if (double.IsNaN(d)) Append("double.NaN");
                else Append(d.ToString("R") + "d");
                return node;
            }
            if (type == typeof(bool))
            {
                Append((bool)node.Value ? "true" : "false");
                return node;
            }
            if (type == typeof(char))
            {
                char c = (char)node.Value;
                Append($"'{EscapeChar(c)}'");
                return node;
            }
            if (type == typeof(string))
            {
                Append($"\"{EscapeString((string)node.Value)}\"");
                return node;
            }
            if (type == typeof(decimal))
            {
                Append(node.Value.ToString() + "m");
                return node;
            }

            // Handle MethodInfo constants — translate to reflection call or static field
            if (node.Value is MethodInfo methodInfo)
            {
                EmitMethodInfoConstant(methodInfo);
                return node;
            }

            // Handle ConstructorInfo constants
            if (node.Value is ConstructorInfo constructorInfo)
            {
                EmitConstructorInfoConstant(constructorInfo);
                return node;
            }

            // Handle FieldInfo constants
            if (node.Value is FieldInfo fieldInfo)
            {
                EmitFieldInfoConstant(fieldInfo);
                return node;
            }

            // Handle enum values
            if (type.IsEnum)
            {
                Append($"(({GetTypeName(type)}){Convert.ChangeType(node.Value, Enum.GetUnderlyingType(type))})");
                return node;
            }

            // Fallback: register as a static field
            string staticFieldName = RegisterStaticField(type, node.Value);
            Append(staticFieldName);
            return node;
        }

        private void EmitMethodInfoConstant(MethodInfo methodInfo)
        {
            // For simple non-generic methods, emit typeof(T).GetMethod("Name", ...)
            string declaringType = GetTypeName(methodInfo.DeclaringType);
            if (methodInfo.IsGenericMethod)
            {
                // typeof(DeclaringType).GetMethod("Name").MakeGenericMethod(typeof(T1), typeof(T2), ...)
                var genericDef = methodInfo.GetGenericMethodDefinition();
                var typeArgs = methodInfo.GetGenericArguments();
                string typeArgStr = string.Join(", ", typeArgs.Select(t => $"typeof({GetTypeName(t)})"));

                // Use a static field for complex method lookups
                string fieldName = $"_mi_{_staticFieldCounter++}";
                string paramTypes = string.Join(", ", genericDef.GetParameters().Select(p => $"typeof({GetTypeName(p.ParameterType)})"));
                _staticFields.Add(new StaticFieldInfo
                {
                    FieldName = fieldName,
                    FieldType = typeof(MethodInfo),
                    InitializerCode = $"typeof({GetTypeName(genericDef.DeclaringType)}).GetMethod(\"{genericDef.Name}\", new System.Type[] {{ {paramTypes} }}).MakeGenericMethod({typeArgStr})"
                });
                Append(fieldName);
            }
            else
            {
                string paramTypes = string.Join(", ", methodInfo.GetParameters().Select(p => $"typeof({GetTypeName(p.ParameterType)})"));
                string fieldName = $"_mi_{_staticFieldCounter++}";
                _staticFields.Add(new StaticFieldInfo
                {
                    FieldName = fieldName,
                    FieldType = typeof(MethodInfo),
                    InitializerCode = $"typeof({declaringType}).GetMethod(\"{methodInfo.Name}\", new System.Type[] {{ {paramTypes} }})"
                });
                Append(fieldName);
            }
        }

        private void EmitConstructorInfoConstant(ConstructorInfo constructorInfo)
        {
            string declaringType = GetTypeName(constructorInfo.DeclaringType);
            string paramTypes = string.Join(", ", constructorInfo.GetParameters().Select(p => $"typeof({GetTypeName(p.ParameterType)})"));
            string fieldName = $"_ci_{_staticFieldCounter++}";
            _staticFields.Add(new StaticFieldInfo
            {
                FieldName = fieldName,
                FieldType = typeof(ConstructorInfo),
                InitializerCode = $"typeof({declaringType}).GetConstructor(new System.Type[] {{ {paramTypes} }})"
            });
            Append(fieldName);
        }

        private void EmitFieldInfoConstant(FieldInfo fieldInfo)
        {
            string declaringType = GetTypeName(fieldInfo.DeclaringType);
            string fieldName = $"_fi_{_staticFieldCounter++}";
            var bindingFlags = "System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic";
            bindingFlags += fieldInfo.IsStatic ? " | System.Reflection.BindingFlags.Static" : " | System.Reflection.BindingFlags.Instance";
            _staticFields.Add(new StaticFieldInfo
            {
                FieldName = fieldName,
                FieldType = typeof(FieldInfo),
                InitializerCode = $"typeof({declaringType}).GetField(\"{fieldInfo.Name}\", {bindingFlags})"
            });
            Append(fieldName);
        }

        private string RegisterStaticField(Type type, object value)
        {
            string fieldName = $"_const_{_staticFieldCounter++}";
            _staticFields.Add(new StaticFieldInfo
            {
                FieldName = fieldName,
                FieldType = type,
                InitializerCode = $"/* TODO: initialize {type.Name} constant */"
            });
            return fieldName;
        }

        private static string EscapeString(string s)
        {
            var sb = new StringBuilder();
            foreach (char c in s)
            {
                sb.Append(EscapeChar(c));
            }
            return sb.ToString();
        }

        private static string EscapeChar(char c)
        {
            switch (c)
            {
                case '\\': return "\\\\";
                case '\"': return "\\\"";
                case '\'': return "\\'";
                case '\0': return "\\0";
                case '\a': return "\\a";
                case '\b': return "\\b";
                case '\f': return "\\f";
                case '\n': return "\\n";
                case '\r': return "\\r";
                case '\t': return "\\t";
                case '\v': return "\\v";
                default:
                    if (char.IsControl(c))
                        return $"\\u{(int)c:X4}";
                    return c.ToString();
            }
        }

        protected override Expression VisitParameter(ParameterExpression node)
        {
            Append(GetVariableName(node));
            return node;
        }

        protected override Expression VisitBinary(BinaryExpression node)
        {
            if (node.NodeType == ExpressionType.ArrayIndex)
            {
                Visit(node.Left);
                Append("[");
                Visit(node.Right);
                Append("]");
                return node;
            }

            bool isAssignment = IsAssignmentExpression(node.NodeType);
            string op = GetBinaryOperator(node.NodeType);

            // Special case: assignment where the right side is a complex conditional
            // that cannot be expressed as a ternary operator (e.g. branches contain blocks).
            // We need to emit as if/else with assignment in each branch.
            if (isAssignment && node.Right is ConditionalExpression condRight && condRight.Type != typeof(void) && HasComplexBranch(condRight))
            {
                EmitConditionalAssignment(node.Left, condRight);
                return node;
            }

            // Special case: assignment to enum value__ field
            // self.value__ = x  =>  self = (EnumType)x
            if (isAssignment && node.Left is MemberExpression memberLeft
                && memberLeft.Member.Name == "value__"
                && memberLeft.Member.DeclaringType != null
                && memberLeft.Member.DeclaringType.IsEnum)
            {
                if (memberLeft.Expression != null)
                    Visit(memberLeft.Expression);
                else
                    Append(GetTypeName(memberLeft.Member.DeclaringType));
                Append($" {op} ");
                Append($"(({GetTypeName(memberLeft.Member.DeclaringType)})");
                bool oldCtx2 = _isStatementContext;
                _isStatementContext = false;
                Visit(node.Right);
                _isStatementContext = oldCtx2;
                Append(")");
                return node;
            }

            if (!isAssignment)
            {
                Append("(");
            }

            Visit(node.Left);
            Append($" {op} ");

            if (isAssignment)
            {
                // Right side of assignment is an expression context, not a statement context
                bool oldCtx = _isStatementContext;
                _isStatementContext = false;
                Visit(node.Right);
                _isStatementContext = oldCtx;
            }
            else
            {
                Visit(node.Right);
                Append(")");
            }

            return node;
        }

        /// <summary>
        /// Checks if a ConditionalExpression has branches that cannot be expressed as simple expressions
        /// (e.g. BlockExpression, TryExpression, nested complex conditionals).
        /// </summary>
        private static bool HasComplexBranch(ConditionalExpression node)
        {
            return IsComplexExpression(node.IfTrue) || IsComplexExpression(node.IfFalse);
        }

        private static bool IsComplexExpression(Expression expr)
        {
            if (expr is BlockExpression) return true;
            if (expr is TryExpression) return true;
            if (expr is LoopExpression) return true;
            if (expr is ConditionalExpression cond && cond.Type != typeof(void) && HasComplexBranch(cond)) return true;
            return false;
        }

        /// <summary>
        /// Recursively checks if a ConditionalExpression or any nested conditional in its else-if chain
        /// has complex branches that cannot be expressed as ternary operands.
        /// </summary>
        private static bool HasComplexBranchRecursive(ConditionalExpression node)
        {
            if (IsComplexExpression(node.IfTrue)) return true;
            if (node.IfFalse is ConditionalExpression nestedCond)
                return HasComplexBranchRecursive(nestedCond);
            return IsComplexExpression(node.IfFalse);
        }

        /// <summary>
        /// Emits a conditional assignment as if/else with assignment in each branch.
        /// e.g.: if (test) { ... left = ifTrue; } else { ... left = ifFalse; }
        /// </summary>
        private void EmitConditionalAssignment(Expression left, ConditionalExpression cond)
        {
            Append("if (");
            Visit(cond.Test);
            AppendLine(")");

            Indent();
            EmitBranchWithAssignment(left, cond.IfTrue);
            AppendLine();

            if (cond.IfFalse != null && !(cond.IfFalse is DefaultExpression defExpr && defExpr.Type == typeof(void)))
            {
                Indent();
                AppendLine("else");
                Indent();
                EmitBranchWithAssignment(left, cond.IfFalse);
                AppendLine();
            }
        }

        /// <summary>
        /// Emits a branch body, adding an assignment to 'left' for the branch's result value.
        /// If the branch is a Block, the last expression becomes the assignment value.
        /// </summary>
        private void EmitBranchWithAssignment(Expression left, Expression branch)
        {
            if (branch is BlockExpression block)
            {
                AppendLine("{");
                _indentLevel++;

                // Declare local variables
                foreach (var variable in block.Variables)
                {
                    Indent();
                    Append($"{GetTypeName(variable.Type)} {GetVariableName(variable)}");
                    AppendLine(";");
                }

                // Find last effective expression
                int lastEffective = -1;
                for (int j = block.Expressions.Count - 1; j >= 0; j--)
                {
                    if (block.Expressions[j] is DefaultExpression d && d.Type == typeof(void))
                        continue;
                    lastEffective = j;
                    break;
                }

                for (int i = 0; i < block.Expressions.Count; i++)
                {
                    var expr = block.Expressions[i];
                    if (expr is DefaultExpression def && def.Type == typeof(void))
                        continue;

                    bool isLast = (i == lastEffective);

                    Indent();
                    if (isLast && block.Type != typeof(void))
                    {
                        // Last expression: assign to left
                        Visit(left);
                        Append(" = ");
                        bool oldCtx = _isStatementContext;
                        _isStatementContext = false;
                        Visit(expr);
                        _isStatementContext = oldCtx;
                        AppendLine(";");
                    }
                    else
                    {
                        bool oldCtx = _isStatementContext;
                        _isStatementContext = true;
                        Visit(expr);
                        _isStatementContext = false;
                        if (NeedsSemicolon(expr))
                            AppendLine(";");
                        else
                            AppendLine();
                        _isStatementContext = oldCtx;
                    }
                }

                _indentLevel--;
                Indent();
                Append("}");
            }
            else if (branch is ConditionalExpression nestedCond && nestedCond.Type != typeof(void) && HasComplexBranch(nestedCond))
            {
                AppendLine("{");
                _indentLevel++;
                Indent();
                EmitConditionalAssignment(left, nestedCond);
                _indentLevel--;
                Indent();
                Append("}");
            }
            else
            {
                AppendLine("{");
                _indentLevel++;
                Indent();
                Visit(left);
                Append(" = ");
                bool oldCtx2 = _isStatementContext;
                _isStatementContext = false;
                Visit(branch);
                _isStatementContext = oldCtx2;
                AppendLine(";");
                _indentLevel--;
                Indent();
                Append("}");
            }
        }

        protected override Expression VisitUnary(UnaryExpression node)
        {
            switch (node.NodeType)
            {
                case ExpressionType.Convert:
                case ExpressionType.ConvertChecked:
                    // If the operand type is the same as the target type, skip the cast
                    if (node.Operand.Type == node.Type)
                    {
                        Visit(node.Operand);
                    }
                    else
                    {
                        Append($"(({GetTypeName(node.Type)})");
                        Visit(node.Operand);
                        Append(")");
                    }
                    break;

                case ExpressionType.TypeAs:
                    Append("(");
                    Visit(node.Operand);
                    Append($" as {GetTypeName(node.Type)})");
                    break;

                case ExpressionType.Not:
                    if (node.Type == typeof(bool))
                    {
                        Append("!(");
                        Visit(node.Operand);
                        Append(")");
                    }
                    else
                    {
                        Append("~(");
                        Visit(node.Operand);
                        Append(")");
                    }
                    break;

                case ExpressionType.Negate:
                case ExpressionType.NegateChecked:
                    Append("-(");
                    Visit(node.Operand);
                    Append(")");
                    break;

                case ExpressionType.UnaryPlus:
                    Append("+(");
                    Visit(node.Operand);
                    Append(")");
                    break;

                case ExpressionType.PostIncrementAssign:
                    Visit(node.Operand);
                    Append("++");
                    break;

                case ExpressionType.PostDecrementAssign:
                    Visit(node.Operand);
                    Append("--");
                    break;

                case ExpressionType.PreIncrementAssign:
                    Append("++");
                    Visit(node.Operand);
                    break;

                case ExpressionType.PreDecrementAssign:
                    Append("--");
                    Visit(node.Operand);
                    break;

                case ExpressionType.Throw:
                    Append("throw ");
                    if (node.Operand != null)
                    {
                        Visit(node.Operand);
                    }
                    break;

                case ExpressionType.Quote:
                    // Quote wraps a LambdaExpression — just visit the operand
                    Visit(node.Operand);
                    break;

                case ExpressionType.ArrayLength:
                    Visit(node.Operand);
                    Append(".Length");
                    break;

                default:
                    throw new NotSupportedException($"Unary operator {node.NodeType} is not supported.");
            }

            return node;
        }

        protected override Expression VisitDefault(DefaultExpression node)
        {
            if (node.Type == typeof(void))
            {
                // void default — nothing to emit
            }
            else
            {
                Append($"default({GetTypeName(node.Type)})");
            }
            return node;
        }

        protected override Expression VisitNew(NewExpression node)
        {
            Append($"new {GetTypeName(node.Type)}(");
            for (int i = 0; i < node.Arguments.Count; i++)
            {
                if (i > 0) Append(", ");
                Visit(node.Arguments[i]);
            }
            Append(")");
            return node;
        }

        protected override Expression VisitNewArray(NewArrayExpression node)
        {
            if (node.NodeType == ExpressionType.NewArrayInit)
            {
                // new Type[] { elem1, elem2, ... }
                Append($"new {GetTypeName(node.Type.GetElementType())}[] {{ ");
                for (int i = 0; i < node.Expressions.Count; i++)
                {
                    if (i > 0) Append(", ");
                    Visit(node.Expressions[i]);
                }
                Append(" }");
            }
            else if (node.NodeType == ExpressionType.NewArrayBounds)
            {
                // new Type[size1, size2, ...]
                Append($"new {GetTypeName(node.Type.GetElementType())}[");
                for (int i = 0; i < node.Expressions.Count; i++)
                {
                    if (i > 0) Append(", ");
                    Visit(node.Expressions[i]);
                }
                Append("]");
            }
            return node;
        }

        protected override Expression VisitTypeBinary(TypeBinaryExpression node)
        {
            if (node.NodeType == ExpressionType.TypeIs)
            {
                Append("(");
                Visit(node.Expression);
                Append($" is {GetTypeName(node.TypeOperand)})");
            }
            else if (node.NodeType == ExpressionType.TypeEqual)
            {
                Append("(");
                Visit(node.Expression);
                Append($".GetType() == typeof({GetTypeName(node.TypeOperand)}))");
            }
            return node;
        }

        #endregion

        #region Method Call & Member Access (Task 2 placeholder — will be filled in next task)

        protected override Expression VisitMethodCall(MethodCallExpression node)
        {
            var method = node.Method;

            // Handle operator methods (op_Equality, op_Addition, etc.)
            if (method.IsSpecialName && method.Name.StartsWith("op_") && method.IsStatic)
            {
                string opName = method.Name;

                // Handle implicit/explicit conversion operators
                if (opName == "op_Implicit" || opName == "op_Explicit")
                {
                    Append($"(({GetTypeName(method.ReturnType)})");
                    Visit(node.Arguments[0]);
                    Append(")");
                    return node;
                }

                if (TryGetOperatorSymbol(opName, method.GetParameters().Length, out string opSymbol, out bool isUnary))
                {
                    if (isUnary)
                    {
                        Append($"({opSymbol}");
                        Visit(node.Arguments[0]);
                        Append(")");
                    }
                    else
                    {
                        Append("(");
                        Visit(node.Arguments[0]);
                        Append($" {opSymbol} ");
                        Visit(node.Arguments[1]);
                        Append(")");
                    }
                    return node;
                }
            }

            // Handle property getter/setter methods (get_X, set_X)
            if (method.IsSpecialName)
            {
                if (method.Name.StartsWith("get_") && node.Arguments.Count == 0)
                {
                    // Property getter: obj.get_PropertyName() -> obj.PropertyName
                    string propName = method.Name.Substring(4);
                    if (node.Object == null)
                    {
                        Append(GetTypeName(method.DeclaringType));
                        Append(".");
                    }
                    else
                    {
                        Visit(node.Object);
                        Append(".");
                    }
                    Append(propName);
                    return node;
                }
                else if (method.Name.StartsWith("set_") && node.Arguments.Count == 1)
                {
                    // Property setter: obj.set_PropertyName(value) -> obj.PropertyName = value
                    string propName = method.Name.Substring(4);
                    if (node.Object == null)
                    {
                        Append(GetTypeName(method.DeclaringType));
                        Append(".");
                    }
                    else
                    {
                        Visit(node.Object);
                        Append(".");
                    }
                    Append(propName);
                    Append(" = ");
                    Visit(node.Arguments[0]);
                    return node;
                }
                else if (method.Name.StartsWith("get_") && node.Arguments.Count > 0)
                {
                    // Indexer getter: obj.get_Item(index) -> obj[index]
                    if (node.Object != null)
                        Visit(node.Object);
                    else
                        Append(GetTypeName(method.DeclaringType));
                    Append("[");
                    for (int i = 0; i < node.Arguments.Count; i++)
                    {
                        if (i > 0) Append(", ");
                        Visit(node.Arguments[i]);
                    }
                    Append("]");
                    return node;
                }
                else if (method.Name.StartsWith("set_") && node.Arguments.Count > 1)
                {
                    // Indexer setter: obj.set_Item(index, value) -> obj[index] = value
                    if (node.Object != null)
                        Visit(node.Object);
                    else
                        Append(GetTypeName(method.DeclaringType));
                    Append("[");
                    for (int i = 0; i < node.Arguments.Count - 1; i++)
                    {
                        if (i > 0) Append(", ");
                        Visit(node.Arguments[i]);
                    }
                    Append("] = ");
                    Visit(node.Arguments[node.Arguments.Count - 1]);
                    return node;
                }
                else if (method.Name.StartsWith("add_") && node.Arguments.Count == 1)
                {
                    // Event add: obj.add_EventName(handler) -> obj.EventName += handler
                    string eventName = method.Name.Substring(4);
                    if (node.Object == null)
                    {
                        Append(GetTypeName(method.DeclaringType));
                        Append(".");
                    }
                    else
                    {
                        Visit(node.Object);
                        Append(".");
                    }
                    Append(eventName);
                    Append(" += ");
                    Visit(node.Arguments[0]);
                    return node;
                }
                else if (method.Name.StartsWith("remove_") && node.Arguments.Count == 1)
                {
                    // Event remove: obj.remove_EventName(handler) -> obj.EventName -= handler
                    string eventName = method.Name.Substring(7);
                    if (node.Object == null)
                    {
                        Append(GetTypeName(method.DeclaringType));
                        Append(".");
                    }
                    else
                    {
                        Visit(node.Object);
                        Append(".");
                    }
                    Append(eventName);
                    Append(" -= ");
                    Visit(node.Arguments[0]);
                    return node;
                }
            }

            // Handle explicit interface implementation methods
            // e.g. method.Name = "UnityEngine.UI.ICanvasElement.get_transform"
            if (node.Object != null && method.Name.Contains("."))
            {
                // Extract interface type from the method name
                int lastDot = method.Name.LastIndexOf('.');
                string interfacePart = method.Name.Substring(0, lastDot);
                string actualMethodName = method.Name.Substring(lastDot + 1);

                // Try to resolve the actual interface type via reflection to get correct generic arguments.
                // The method.Name may contain unresolved generic parameter names (e.g. IEnumerable<T>),
                // but the declaring type's interface list has the concrete types (e.g. IEnumerable<int>).
                string resolvedInterfaceName = interfacePart;
                try
                {
                    var declaringType = method.DeclaringType;
                    if (declaringType != null)
                    {
                        foreach (var iface in declaringType.GetInterfaces())
                        {
                            // Match by checking if the interface's full name (without assembly info)
                            // corresponds to the interface part in the method name.
                            // For generic interfaces, we need to match the generic type definition's name.
                            string ifaceFullName = iface.IsGenericType
                                ? iface.GetGenericTypeDefinition().FullName
                                : iface.FullName;

                            // The interfacePart uses C# syntax (e.g. IEnumerable<T>) while FullName uses
                            // CLR syntax (e.g. IEnumerable`1). We need to strip generic suffixes for comparison.
                            string interfaceBaseName = interfacePart;
                            int angleBracket = interfaceBaseName.IndexOf('<');
                            if (angleBracket >= 0)
                                interfaceBaseName = interfaceBaseName.Substring(0, angleBracket);

                            string ifaceBaseName = ifaceFullName;
                            int backtick = ifaceBaseName.IndexOf('`');
                            if (backtick >= 0)
                                ifaceBaseName = ifaceBaseName.Substring(0, backtick);
                            // Also normalize nested type separator
                            ifaceBaseName = ifaceBaseName.Replace('+', '.');

                            if (interfaceBaseName == ifaceBaseName)
                            {
                                // Verify this interface actually declares the method
                                var ifaceMap = declaringType.GetInterfaceMap(iface);
                                for (int mi = 0; mi < ifaceMap.TargetMethods.Length; mi++)
                                {
                                    if (ifaceMap.TargetMethods[mi] == method)
                                    {
                                        resolvedInterfaceName = GetTypeName(iface);
                                        goto interfaceResolved;
                                    }
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // Fall back to using the raw interface name from method.Name
                }
                interfaceResolved:

                // Check if it's a property getter/setter on the interface
                if (actualMethodName.StartsWith("get_") && node.Arguments.Count == 0)
                {
                    // Property getter: ((IFoo)obj).PropName
                    string propName = actualMethodName.Substring(4);
                    Append($"(({resolvedInterfaceName})");
                    Visit(node.Object);
                    Append($").{propName}");
                    return node;
                }
                else if (actualMethodName.StartsWith("set_") && node.Arguments.Count == 1)
                {
                    // Property setter: ((IFoo)obj).PropName = value
                    string propName = actualMethodName.Substring(4);
                    Append($"(({resolvedInterfaceName})");
                    Visit(node.Object);
                    Append($").{propName} = ");
                    Visit(node.Arguments[0]);
                    return node;
                }
                else if (actualMethodName.StartsWith("get_") && node.Arguments.Count > 0)
                {
                    // Indexer getter: ((IList)obj)[index]
                    Append($"(({resolvedInterfaceName})");
                    Visit(node.Object);
                    Append(")[");
                    for (int i = 0; i < node.Arguments.Count; i++)
                    {
                        if (i > 0) Append(", ");
                        Visit(node.Arguments[i]);
                    }
                    Append("]");
                    return node;
                }
                else if (actualMethodName.StartsWith("set_") && node.Arguments.Count > 1)
                {
                    // Indexer setter: ((IList)obj)[index] = value
                    Append($"(({resolvedInterfaceName})");
                    Visit(node.Object);
                    Append(")[");
                    for (int i = 0; i < node.Arguments.Count - 1; i++)
                    {
                        if (i > 0) Append(", ");
                        Visit(node.Arguments[i]);
                    }
                    Append("] = ");
                    Visit(node.Arguments[node.Arguments.Count - 1]);
                    return node;
                }

                Append($"(({resolvedInterfaceName})");
                Visit(node.Object);
                Append(").");
                Append(actualMethodName);
            }
            else
            {
                // Static method call
                if (node.Object == null)
                {
                    Append(GetTypeName(method.DeclaringType));
                    Append(".");
                }
                else
                {
                    Visit(node.Object);
                    Append(".");
                }

                // Method name with generic type arguments
                Append(method.Name);
            }

            if (method.IsGenericMethod)
            {
                var typeArgs = method.GetGenericArguments();
                Append("<");
                Append(string.Join(", ", typeArgs.Select(GetTypeName)));
                Append(">");
            }

            // Arguments
            Append("(");
            var parameters = method.GetParameters();
            for (int i = 0; i < node.Arguments.Count; i++)
            {
                if (i > 0) Append(", ");
                // Handle ref/out/in parameters
                if (i < parameters.Length && parameters[i].ParameterType.IsByRef)
                {
                    if (parameters[i].IsOut)
                        Append("out ");
                    else if (parameters[i].IsIn)
                    {
                        Append("in ");
                    }
                    else
                        Append("ref ");
                }
                Visit(node.Arguments[i]);
            }
            Append(")");

            return node;
        }

        /// <summary>
        /// Maps C# operator method names to their operator symbols.
        /// </summary>
        private static bool TryGetOperatorSymbol(string opName, int paramCount, out string symbol, out bool isUnary)
        {
            isUnary = paramCount == 1;
            switch (opName)
            {
                case "op_Equality": symbol = "=="; return true;
                case "op_Inequality": symbol = "!="; return true;
                case "op_GreaterThan": symbol = ">"; return true;
                case "op_LessThan": symbol = "<"; return true;
                case "op_GreaterThanOrEqual": symbol = ">="; return true;
                case "op_LessThanOrEqual": symbol = "<="; return true;
                case "op_Addition": symbol = "+"; return true;
                case "op_Subtraction": symbol = "-"; return true;
                case "op_Multiply": symbol = "*"; return true;
                case "op_Division": symbol = "/"; return true;
                case "op_Modulus": symbol = "%"; return true;
                case "op_BitwiseAnd": symbol = "&"; return true;
                case "op_BitwiseOr": symbol = "|"; return true;
                case "op_ExclusiveOr": symbol = "^"; return true;
                case "op_LeftShift": symbol = "<<"; return true;
                case "op_RightShift": symbol = ">>"; return true;
                case "op_UnaryNegation": symbol = "-"; isUnary = true; return true;
                case "op_UnaryPlus": symbol = "+"; isUnary = true; return true;
                case "op_LogicalNot": symbol = "!"; isUnary = true; return true;
                case "op_OnesComplement": symbol = "~"; isUnary = true; return true;
                default: symbol = null; return false;
            }
        }

        protected override Expression VisitMember(MemberExpression node)
        {
            // Handle enum value__ field access: emit (int)expr instead of expr.value__
            if (node.Member.Name == "value__" && node.Member.DeclaringType != null && node.Member.DeclaringType.IsEnum)
            {
                var underlyingType = Enum.GetUnderlyingType(node.Member.DeclaringType);
                Append($"(({GetTypeName(underlyingType)})");
                if (node.Expression != null)
                    Visit(node.Expression);
                else
                    Append(GetTypeName(node.Member.DeclaringType));
                Append(")");
                return node;
            }

            if (node.Expression == null)
            {
                // Static member access
                Append(GetTypeName(node.Member.DeclaringType));
            }
            else
            {
                Visit(node.Expression);
            }
            Append(".");
            Append(node.Member.Name);
            return node;
        }

        protected override Expression VisitIndex(IndexExpression node)
        {
            Visit(node.Object);
            Append("[");
            for (int i = 0; i < node.Arguments.Count; i++)
            {
                if (i > 0) Append(", ");
                Visit(node.Arguments[i]);
            }
            Append("]");
            return node;
        }

        #endregion

        #region Control Flow & Lambda (Task 3 placeholder — will be filled in next task)

        protected override Expression VisitBlock(BlockExpression node)
        {
            AppendLine("{");
            _indentLevel++;

            // Declare local variables
            foreach (var variable in node.Variables)
            {
                Indent();
                Append($"{GetTypeName(variable.Type)} {GetVariableName(variable)}");
                AppendLine(";");
            }

            // Determine whether this block has a non-void result type.
            // In Expression Tree semantics, the last expression of a Block is its return value.
            // Blocks inside loops should not emit "return" for their last expression,
            // because the block's "return value" is the loop iteration value, not a function return.
            bool blockHasReturnValue = node.Type != typeof(void) && !_isInsideLoop;

            // Find the index of the last non-void-default expression (the effective last expression)
            int lastEffectiveIndex = -1;
            for (int j = node.Expressions.Count - 1; j >= 0; j--)
            {
                var e = node.Expressions[j];
                if (e is DefaultExpression d && d.Type == typeof(void))
                    continue;
                lastEffectiveIndex = j;
                break;
            }

            // Emit statements
            for (int i = 0; i < node.Expressions.Count; i++)
            {
                var expr = node.Expressions[i];

                // Skip void defaults (they are no-ops)
                if (expr is DefaultExpression def && def.Type == typeof(void))
                    continue;

                bool isLastEffective = (i == lastEffectiveIndex);

                // If this block has a return value and this is the last effective expression,
                // we need to emit "return" before it (unless it already handles control flow).
                bool needsReturn = blockHasReturnValue && isLastEffective && !IsControlFlowExpression(expr);

                // For non-void ConditionalExpression that uses if/else form,
                // we need to propagate the return requirement into branches
                bool isComplexConditional = blockHasReturnValue && isLastEffective
                    && expr is ConditionalExpression condExpr
                    && condExpr.Type != typeof(void)
                    && HasComplexBranchRecursive(condExpr);

                Indent();
                if (needsReturn)
                {
                    Append("return ");
                }

                bool oldStatementContext = _isStatementContext;
                bool oldNeedsReturn = _needsReturnInBranches;
                _isStatementContext = true;
                if (isComplexConditional)
                {
                    _needsReturnInBranches = true;
                }
                Visit(expr);
                _isStatementContext = false;
                _needsReturnInBranches = oldNeedsReturn;

                // Add semicolon for expression statements (not for blocks, ifs, try-catch, loops)
                if (needsReturn || NeedsSemicolon(expr))
                {
                    AppendLine(";");
                }
                else
                {
                    AppendLine();
                }

                _isStatementContext = oldStatementContext;
            }

            _indentLevel--;
            Indent();
            Append("}");

            return node;
        }

        /// <summary>
        /// Returns true if the expression already handles control flow (return, goto, throw)
        /// and should NOT have an extra "return" prepended.
        /// </summary>
        private static bool IsControlFlowExpression(Expression expr)
        {
            if (expr is GotoExpression) return true;
            if (expr.NodeType == ExpressionType.Throw) return true;
            // A block or try-catch with non-void type will handle return internally
            if (expr is BlockExpression) return true;
            if (expr is TryExpression) return true;
            // Only if/else form conditionals handle return internally;
            // ternary expressions need "return" prepended like normal expressions
            if (expr is ConditionalExpression cond
                && (cond.Type == typeof(void) || HasComplexBranchRecursive(cond)))
                return true;
            return false;
        }

        private bool NeedsSemicolon(Expression expr)
        {
            switch (expr.NodeType)
            {
                case ExpressionType.Block:
                case ExpressionType.Loop:
                case ExpressionType.Try:
                    return false;
                case ExpressionType.Conditional:
                    // If emitted as if/else statement, no semicolon needed
                    var cond = (ConditionalExpression)expr;
                    if (cond.Type == typeof(void) || HasComplexBranchRecursive(cond))
                        return false;
                    // For ternary expressions used as statements, need semicolon
                    return true;
                case ExpressionType.Extension:
                    return false;
                default:
                    return true;
            }
        }

        protected override Expression VisitConditional(ConditionalExpression node)
        {
            // Determine if we should use if/else statement form or ternary expression form.
            // Use if/else when:
            // 1. The type is void (always if/else)
            // 2. The type is non-void but branches contain complex expressions (blocks, try-catch, etc.)
            //    that cannot be expressed as ternary operands
            bool useIfElse = node.Type == typeof(void) || HasComplexBranchRecursive(node);

            // If we need if/else form but we're in an expression context (e.g. method argument),
            // we must wrap it in an immediately-invoked lambda expression (IIFE).
            if (useIfElse && !_isStatementContext && node.Type != typeof(void))
            {
                // Emit as: ((Func<T>)(() => { if (...) { return ...; } else { return ...; } }))()
                Append($"((System.Func<{GetTypeName(node.Type)}>)(() =>");
                AppendLine();
                Indent();
                AppendLine("{");
                _indentLevel++;

                bool oldNeedsReturn = _needsReturnInBranches;
                bool oldStatementContext = _isStatementContext;
                _needsReturnInBranches = true;
                _isStatementContext = true;

                Indent();
                Visit(node);

                _needsReturnInBranches = oldNeedsReturn;
                _isStatementContext = oldStatementContext;

                AppendLine();
                _indentLevel--;
                Indent();
                Append("}))()");
                return node;
            }

            if (useIfElse)
            {
                bool needsReturn = _needsReturnInBranches && node.Type != typeof(void);

                // Emit as if/else statement
                Append("if (");
                Visit(node.Test);
                AppendLine(")");

                Indent();
                if (node.IfTrue is BlockExpression)
                {
                    Visit(node.IfTrue);
                    AppendLine();
                }
                else
                {
                    AppendLine("{");
                    _indentLevel++;
                    Indent();
                    if (needsReturn && !IsControlFlowExpression(node.IfTrue))
                    {
                        Append("return ");
                    }
                    Visit(node.IfTrue);
                    AppendLine(";");
                    _indentLevel--;
                    Indent();
                    AppendLine("}");
                }

                if (node.IfFalse != null && !(node.IfFalse is DefaultExpression defExpr && defExpr.Type == typeof(void)))
                {
                    Indent();
                    Append("else");

                    // Check if the else branch is another conditional (else if chain)
                    if (node.IfFalse is ConditionalExpression elseIf && (elseIf.Type == typeof(void) || HasComplexBranchRecursive(elseIf)))
                    {
                        Append(" ");
                        Visit(node.IfFalse);
                    }
                    else if (node.IfFalse is BlockExpression)
                    {
                        AppendLine();
                        Indent();
                        Visit(node.IfFalse);
                        AppendLine();
                    }
                    else
                    {
                        AppendLine();
                        Indent();
                        AppendLine("{");
                        _indentLevel++;
                        Indent();
                        if (needsReturn && !IsControlFlowExpression(node.IfFalse))
                        {
                            Append("return ");
                        }
                        Visit(node.IfFalse);
                        AppendLine(";");
                        _indentLevel--;
                        Indent();
                        AppendLine("}");
                    }
                }
            }
            else
            {
                // Emit as ternary expression
                Append("(");
                Visit(node.Test);
                Append(" ? ");
                Visit(node.IfTrue);
                Append(" : ");
                Visit(node.IfFalse);
                Append(")");
            }

            return node;
        }

        protected override Expression VisitTry(TryExpression node)
        {
            AppendLine("try");
            Indent();
            if (node.Body is BlockExpression)
            {
                Visit(node.Body);
            }
            else
            {
                AppendLine("{");
                _indentLevel++;
                Indent();
                Visit(node.Body);
                AppendLine(";");
                _indentLevel--;
                Indent();
                Append("}");
            }
            AppendLine();

            if (node.Handlers != null)
            {
                foreach (var handler in node.Handlers)
                {
                    Indent();
                    if (handler.Variable != null)
                    {
                        Append($"catch ({GetTypeName(handler.Test)} {GetVariableName(handler.Variable)})");
                    }
                    else
                    {
                        Append($"catch ({GetTypeName(handler.Test)})");
                    }
                    AppendLine();

                    Indent();
                    if (handler.Body is BlockExpression)
                    {
                        Visit(handler.Body);
                    }
                    else
                    {
                        AppendLine("{");
                        _indentLevel++;
                        Indent();
                        Visit(handler.Body);
                        AppendLine(";");
                        _indentLevel--;
                        Indent();
                        Append("}");
                    }
                    AppendLine();
                }
            }

            if (node.Finally != null)
            {
                Indent();
                AppendLine("finally");
                Indent();
                if (node.Finally is BlockExpression)
                {
                    Visit(node.Finally);
                }
                else
                {
                    AppendLine("{");
                    _indentLevel++;
                    Indent();
                    Visit(node.Finally);
                    AppendLine(";");
                    _indentLevel--;
                    Indent();
                    Append("}");
                }
                AppendLine();
            }

            return node;
        }

        protected override Expression VisitLoop(LoopExpression node)
        {
            AppendLine("while (true)");
            Indent();
            bool oldInsideLoop = _isInsideLoop;
            _isInsideLoop = true;
            // Record break/continue labels for this loop
            if (node.BreakLabel != null) _loopBreakLabels.Add(node.BreakLabel);
            if (node.ContinueLabel != null) _loopContinueLabels.Add(node.ContinueLabel);
            if (node.Body is BlockExpression)
            {
                Visit(node.Body);
            }
            else
            {
                AppendLine("{");
                _indentLevel++;
                Indent();
                Visit(node.Body);
                AppendLine(";");
                _indentLevel--;
                Indent();
                Append("}");
            }
            // Remove labels when leaving loop scope
            if (node.BreakLabel != null) _loopBreakLabels.Remove(node.BreakLabel);
            if (node.ContinueLabel != null) _loopContinueLabels.Remove(node.ContinueLabel);
            _isInsideLoop = oldInsideLoop;
            return node;
        }

        protected override Expression VisitLabel(LabelExpression node)
        {
            string labelName = GetLabelName(node.Target);

            // Skip labels that are loop break/continue targets (handled by break/continue)
            if (_loopBreakLabels.Contains(node.Target) || _loopContinueLabels.Contains(node.Target))
            {
                // Still need to handle default value if present
                if (node.DefaultValue != null && !(node.DefaultValue is DefaultExpression def2 && def2.Type == typeof(void)))
                {
                    Visit(node.DefaultValue);
                }
                return node;
            }

            // Check if this label is used as a break target for a loop
            // In that case, we just emit the label
            Append($"{labelName}:");
            if (node.DefaultValue != null && !(node.DefaultValue is DefaultExpression def && def.Type == typeof(void)))
            {
                Append(" ");
                Visit(node.DefaultValue);
            }

            return node;
        }

        protected override Expression VisitGoto(GotoExpression node)
        {
            // Check if this goto targets a loop break/continue label
            if (_loopBreakLabels.Contains(node.Target))
            {
                Append("break");
                return node;
            }
            if (_loopContinueLabels.Contains(node.Target))
            {
                Append("continue");
                return node;
            }

            string labelName = GetLabelName(node.Target);

            switch (node.Kind)
            {
                case GotoExpressionKind.Break:
                    Append($"goto {labelName}");
                    break;
                case GotoExpressionKind.Continue:
                    Append($"goto {labelName}");
                    break;
                case GotoExpressionKind.Return:
                    if (node.Value != null)
                    {
                        Append("return ");
                        Visit(node.Value);
                    }
                    else
                    {
                        Append("return");
                    }
                    break;
                case GotoExpressionKind.Goto:
                default:
                    Append($"goto {labelName}");
                    break;
            }

            return node;
        }

        protected override Expression VisitLambda<T>(Expression<T> node)
        {
            // Emit as a C# lambda expression: (params) => { body }
            var returnType = node.ReturnType;

            // Get parameter info from the delegate type's Invoke method for ref/in/out modifiers
            var delegateType = typeof(T);
            var invokeMethod = delegateType.GetMethod("Invoke");
            var invokeParams = invokeMethod?.GetParameters();

            Append("(");
            for (int i = 0; i < node.Parameters.Count; i++)
            {
                if (i > 0) Append(", ");
                var param = node.Parameters[i];
                // Check for in/ref/out modifiers from the delegate's parameter info
                if (invokeParams != null && i < invokeParams.Length && invokeParams[i].ParameterType.IsByRef)
                {
                    if (invokeParams[i].IsOut)
                        Append("out ");
                    else if (invokeParams[i].IsIn)
                        Append("in ");
                    else
                        Append("ref ");
                }
                Append($"{GetTypeName(param.Type)} {GetVariableName(param)}");
            }
            Append(") =>");
            AppendLine();

            Indent();
            if (node.Body is BlockExpression blockBody)
            {
                // For lambdas with out parameters, we need to wrap the body to add default assignments
                // before the original block content, since the Expression Tree may read out params before assigning them.
                var outParams = new List<(ParameterExpression param, int index)>();
                if (invokeParams != null)
                {
                    for (int i = 0; i < node.Parameters.Count; i++)
                    {
                        if (i < invokeParams.Length && invokeParams[i].IsOut)
                        {
                            outParams.Add((node.Parameters[i], i));
                        }
                    }
                }

                if (outParams.Count > 0)
                {
                    // Manually emit the block with out parameter default assignments at the top
                    AppendLine("{");
                    _indentLevel++;

                    // Emit out parameter default assignments first
                    foreach (var (param, _) in outParams)
                    {
                        Indent();
                        Append($"{GetVariableName(param)} = default({GetTypeName(param.Type)})");
                        AppendLine(";");
                    }

                    // Declare local variables
                    foreach (var variable in blockBody.Variables)
                    {
                        Indent();
                        Append($"{GetTypeName(variable.Type)} {GetVariableName(variable)}");
                        AppendLine(";");
                    }

                    bool blockHasReturnValue = blockBody.Type != typeof(void) && !_isInsideLoop;

                    int lastEffectiveIndex = -1;
                    for (int j = blockBody.Expressions.Count - 1; j >= 0; j--)
                    {
                        var e = blockBody.Expressions[j];
                        if (e is DefaultExpression d && d.Type == typeof(void))
                            continue;
                        lastEffectiveIndex = j;
                        break;
                    }

                    for (int i = 0; i < blockBody.Expressions.Count; i++)
                    {
                        var expr = blockBody.Expressions[i];
                        if (expr is DefaultExpression def && def.Type == typeof(void))
                            continue;

                        bool isLastEffective = (i == lastEffectiveIndex);
                        bool needsReturn = blockHasReturnValue && isLastEffective && !IsControlFlowExpression(expr);
                        bool isComplexConditional = blockHasReturnValue && isLastEffective
                            && expr is ConditionalExpression condExpr
                            && condExpr.Type != typeof(void)
                            && HasComplexBranchRecursive(condExpr);

                        Indent();
                        if (needsReturn)
                        {
                            Append("return ");
                        }

                        bool oldStatementContext = _isStatementContext;
                        bool oldNeedsReturn = _needsReturnInBranches;
                        _isStatementContext = true;
                        if (isComplexConditional)
                        {
                            _needsReturnInBranches = true;
                        }
                        Visit(expr);
                        _isStatementContext = false;
                        _needsReturnInBranches = oldNeedsReturn;

                        if (needsReturn || NeedsSemicolon(expr))
                        {
                            AppendLine(";");
                        }
                        else
                        {
                            AppendLine();
                        }

                        _isStatementContext = oldStatementContext;
                    }

                    _indentLevel--;
                    Indent();
                    Append("}");
                }
                else
                {
                    Visit(node.Body);
                }
            }
            else
            {
                AppendLine("{");
                _indentLevel++;
                Indent();
                if (returnType != typeof(void))
                {
                    Append("return ");
                }
                Visit(node.Body);
                AppendLine(";");
                _indentLevel--;
                Indent();
                Append("}");
            }

            return node;
        }

        private static string SanitizeIdentifier(string name)
        {
            if (string.IsNullOrEmpty(name)) return "Generated";
            var sb = new StringBuilder();
            foreach (char c in name)
            {
                if (char.IsLetterOrDigit(c) || c == '_')
                    sb.Append(c);
                else
                    sb.Append('_');
            }
            string result = sb.ToString();
            if (result.Length > 0 && char.IsDigit(result[0]))
                result = "_" + result;
            return result;
        }

        #endregion

        #region Invocation & RuntimeVariables

        protected override Expression VisitInvocation(InvocationExpression node)
        {
            Visit(node.Expression);
            Append("(");
            for (int i = 0; i < node.Arguments.Count; i++)
            {
                if (i > 0) Append(", ");
                Visit(node.Arguments[i]);
            }
            Append(")");
            return node;
        }

        #endregion
    }
}

#endif
