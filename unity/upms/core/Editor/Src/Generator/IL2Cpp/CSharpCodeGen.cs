/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file
* 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER && !PUERTS_GENERAL
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace PuertsIl2cpp.Editor.Generator
{
    /// <summary>
    /// Pure C# code generator for IL2CPP C++ files.
    /// Replaces JS template-based generation to eliminate V8 dependency in core module.
    /// </summary>
    public static class CSharpCodeGen
    {
        #region Type Mapping Infrastructure

        // Maps primitive type signatures to C++ type names
        private static readonly Dictionary<string, string> PrimitiveSignatureCppTypeMap = new Dictionary<string, string>
        {
            { "v",  "void" },
            { "b",  "bool" },
            { "u1", "uint8_t" },
            { "i1", "int8_t" },
            { "i2", "int16_t" },
            { "u2", "uint16_t" },
            { "i4", "int32_t" },
            { "u4", "uint32_t" },
            { "i8", "int64_t" },
            { "u8", "uint64_t" },
            { "c",  "Il2CppChar" },
            { "r8", "double" },
            { "r4", "float" }
        };

        private const string StructPrefix = "S_";
        private const string NullableStructPrefix = "N_";

        #endregion

        #region Signature Helper Methods

        private static bool IsPrimitive(string signature)
        {
            return PrimitiveSignatureCppTypeMap.ContainsKey(signature);
        }

        private static bool IsStructOrNullableStruct(string signature)
        {
            return (signature.StartsWith(StructPrefix) || signature.StartsWith(NullableStructPrefix)) && signature.EndsWith("_");
        }

        private static bool IsNullableStruct(string signature)
        {
            return signature.StartsWith(NullableStructPrefix);
        }

        private static bool IsStruct(string signature)
        {
            return signature.StartsWith(StructPrefix) && signature.EndsWith("_");
        }

        private static string GetSignatureWithoutRefAndPrefix(string signature)
        {
            if (signature.Length > 0 && (signature[0] == 'P' || signature[0] == 'D'))
                return signature.Substring(1);
            return signature;
        }

        private static bool NeedThis(string thisSignature)
        {
            return thisSignature == "t" || thisSignature == "T";
        }

        // Converts a type signature to C++ type string
        private static string SToCPPType(string signature)
        {
            if (signature.Length > 0 && signature[0] == 'D')
                signature = signature.Substring(1);
            if (signature == "s") return "Il2CppString*";
            if (signature == "o" || signature == "O" || signature == "a") return "Il2CppObject*";
            if (signature.Length > 0 && signature[0] == 'V') return "Il2CppArray*";

            string t;
            if (PrimitiveSignatureCppTypeMap.TryGetValue(signature, out t))
            {
                // t is already set
            }
            else if (IsStructOrNullableStruct(signature))
            {
                t = "struct " + signature;
            }
            else
            {
                t = "void*";
            }

            if (signature.Length > 0 && signature[0] == 'P')
            {
                t = SToCPPType(signature.Substring(1)) + "*";
            }
            return t;
        }

        // For bridge: cast from void* args to the right type
        private static string FromAny(string signature)
        {
            if (signature.Length > 0 && signature[0] == 'D')
                signature = signature.Substring(1);
            if (IsPrimitive(signature) || IsStructOrNullableStruct(signature))
                return "*(" + SToCPPType(signature) + " *)";
            else
                return "(" + SToCPPType(signature) + ")";
        }

        private static string InvokePapi(string apiName)
        {
            return "apis->" + apiName;
        }

        #endregion

        #region WrapperDef Helpers

        private static string GetThis(string thisSignature)
        {
            if (thisSignature == "t")
            {
                return "auto self = " + InvokePapi("get_native_holder_ptr") + "(info);";
            }
            else if (thisSignature == "T")
            {
                return "auto self = " + InvokePapi("get_native_holder_ptr") + @"(info);
    auto ptrType = (Il2CppClass*) " + InvokePapi("get_native_holder_typeid") + @"(info);
    if (il2cpp::vm::Class::IsValuetype(ptrType))
    {
        self = DataTransfer::GetValueTypeForCSharp(ptrType, self);
    }
";
            }
            return "";
        }

        private static string GetArgValue(string signature, string jsName, bool isRef)
        {
            string cppType;
            if (PrimitiveSignatureCppTypeMap.TryGetValue(signature, out cppType))
            {
                if (isRef)
                    return "converter::Converter<std::reference_wrapper<" + cppType + ">>::toCpp(apis, env, " + jsName + ")";
                else
                    return "converter::Converter<" + cppType + ">::toCpp(apis, env, " + jsName + ")";
            }
            else if ((signature == "Pv" || signature == "p") && !isRef)
            {
                return "DataTransfer::GetPointer<void>(apis, env, " + jsName + ")";
            }
            else
            {
                // default value
                if (IsPrimitive(signature))
                {
                    return signature == "b" ? "false" : "0";
                }
                if (IsStructOrNullableStruct(signature))
                    return "{}";
                return "nullptr";
            }
        }

        private static string DeclareTypeInfo(string returnSignature, List<string> parameterSignatures)
        {
            var sb = new StringBuilder();
            int i = 0;
            bool returnHasTypeInfo = !string.IsNullOrEmpty(returnSignature) &&
                                     !IsPrimitive(GetSignatureWithoutRefAndPrefix(returnSignature));
            if (returnHasTypeInfo)
            {
                sb.Append("auto TIret = wrapData->TypeInfos[" + i + "];");
                i++;
            }
            for (int idx = 0; idx < parameterSignatures.Count; idx++)
            {
                if (!IsPrimitive(GetSignatureWithoutRefAndPrefix(parameterSignatures[idx])))
                {
                    if (sb.Length > 0) sb.Append("\n    ");
                    sb.Append("auto TIp" + idx + " = wrapData->TypeInfos[" + i + "];");
                    i++;
                }
            }
            return sb.ToString();
        }

        private static string GenArgsLenCheck(List<string> parameterSignatures)
        {
            int requireNum = 0;
            for (; requireNum < parameterSignatures.Count &&
                   parameterSignatures[requireNum][0] != 'V' &&
                   parameterSignatures[requireNum][0] != 'D'; ++requireNum) { }

            bool hasParams = parameterSignatures.Count > 0 &&
                             parameterSignatures[parameterSignatures.Count - 1][0] == 'V';

            if (requireNum != parameterSignatures.Count)
            {
                if (hasParams)
                    return "js_args_len < " + requireNum;
                else
                    return "js_args_len < " + requireNum + " || js_args_len > " + parameterSignatures.Count;
            }
            return "js_args_len != " + parameterSignatures.Count;
        }

        private static string CheckJSArg(string signature, int index)
        {
            string ret = "";
            string typeInfoVar = "TIp" + index;
            string origSig = signature;

            if (signature[0] == 'D')
            {
                ret += "if (js_args_len > " + index + " && ";
                signature = signature.Substring(1);
            }
            else if (signature[0] == 'V')
            {
                string elmSignature = signature.Substring(1);
                string elmClassDecl = "";
                if (elmSignature == "o" || elmSignature == "O" || elmSignature == "a" ||
                    IsStructOrNullableStruct(elmSignature))
                {
                    elmClassDecl = "auto " + typeInfoVar + "_V = il2cpp::vm::Class::GetElementClass(" + typeInfoVar + ");";
                }
                ret += elmClassDecl + "if (js_args_len > " + index + " && ";
                signature = elmSignature;
                typeInfoVar += "_V";
            }
            else
            {
                ret += "if (";
            }

            if (IsPrimitive(signature))
            {
                ret += "!converter::Converter<" + PrimitiveSignatureCppTypeMap[signature] + ">::accept(apis, env, _sv" + index + ")) return false;";
            }
            else if (signature == "p" || signature == "Pv" || signature == "a")
            {
                ret += "!" + InvokePapi("is_binary") + "(env, _sv" + index + ") && !" + InvokePapi("is_null") + "(env, _sv" + index + ") && !" + InvokePapi("is_undefined") + "(env, _sv" + index + ")) return false;";
            }
            else if (signature.Length > 0 && signature[0] == 'P')
            {
                ret += "!" + InvokePapi("is_boxed_value") + "(env, _sv" + index + ")) return false;";
            }
            else if (signature == "s")
            {
                ret += "!converter::Converter<Il2CppString*>::accept(apis, env, _sv" + index + ")) return false;";
            }
            else if (signature == "o" || signature == "a")
            {
                ret += "!DataTransfer::IsAssignable(apis, env, _sv" + index + ", " + typeInfoVar + ", false)) return false;";
            }
            else if (signature == "O")
            {
                return "";
            }
            else if (signature.StartsWith(NullableStructPrefix))
            {
                // Nullable element type is ValueType
                string si = signature.Substring(3, signature.Length - 4); // slice(3, -1)
                if (IsPrimitive(si))
                {
                    ret += "!" + InvokePapi("is_null") + "(env, _sv" + index + ") && !converter::Converter<" + PrimitiveSignatureCppTypeMap[si] + ">::accept(apis, env, _sv" + index + ")) return false;";
                }
                else
                {
                    ret += "!" + InvokePapi("is_null") + "(env, _sv" + index + ") && !DataTransfer::IsAssignable(apis, env, _sv" + index + ", il2cpp::vm::Class::GetNullableArgument(" + typeInfoVar + "), true)) return false;";
                }
            }
            else if (IsStruct(signature))
            {
                ret += "!DataTransfer::IsAssignable(apis, env, _sv" + index + ", " + typeInfoVar + ", true)) return false;";
            }
            else
            {
                ret += "!!true) return false;";
            }
            return ret;
        }

        private static string JSValToCSVal(string signature, string jsName, string csName)
        {
            if (signature == "s")
            {
                return "    // JSValToCSVal s\n    Il2CppString* " + csName + " = converter::Converter<Il2CppString*>::toCpp(apis, env, " + jsName + ");";
            }
            else if (signature == "Ps")
            {
                return "    // JSValToCSVal Ps\n    Il2CppString* u" + csName + " = converter::Converter<std::reference_wrapper<Il2CppString*>>::toCpp(apis, env, " + jsName + "); // string ref\n    Il2CppString** " + csName + " = &u" + csName + ";\n        ";
            }
            else if (signature == "o" || signature == "O" || signature == "a")
            {
                return "    // JSValToCSVal o/O\n    Il2CppObject* " + csName + " = JsValueToCSRef(apis, TI" + csName + ", env, " + jsName + ");";
            }
            else if (signature == "Po" || signature == "PO" || signature == "Pa")
            {
                return "    // JSValToCSVal Po/PO\n    Il2CppObject* u" + csName + " = DataTransfer::GetPointer<Il2CppObject>(apis, env, " + InvokePapi("unboxing") + "(env, " + jsName + ")); // object ref\n    Il2CppObject** " + csName + " = &u" + csName + ";\n        ";
            }
            else if (IsStruct(signature))
            {
                return "    // JSValToCSVal struct\n    " + signature + "* p" + csName + " = DataTransfer::GetPointer<" + signature + ">(apis, env, " + jsName + ");\n    " + signature + " " + csName + " = p" + csName + " ? *p" + csName + " : " + signature + " {};";
            }
            else if ((signature.StartsWith("P" + StructPrefix) || signature.StartsWith("P" + NullableStructPrefix)) && signature.EndsWith("_"))
            {
                string S = signature.Substring(1);
                return "    // JSValToCSVal Pstruct\n    " + S + "* " + csName + " = DataTransfer::GetPointer<" + S + ">(apis, env, " + InvokePapi("unboxing") + "(env, " + jsName + ")); // valuetype ref\n    " + S + " u" + csName + ";\n    if (!" + csName + ") {\n        memset(&u" + csName + ", 0, sizeof(" + S + "));\n        " + csName + " = &u" + csName + ";\n    }\n        ";
            }
            else if (signature[0] == 'P' && signature != "Pv")
            {
                string S = signature.Substring(1);
                if (IsPrimitive(S))
                {
                    return "    // JSValToCSVal P primitive\n    " + SToCPPType(S) + " u" + csName + " = " + GetArgValue(S, jsName, true) + ";\n    " + SToCPPType(S) + "* " + csName + " = &u" + csName + ";";
                }
                else
                {
                    return "    // JSValToCSVal P not primitive\n    " + SToCPPType(signature) + " " + csName + " = " + GetArgValue(S, jsName, true) + ";";
                }
            }
            else if (signature[0] == 'V')
            {
                string si = signature.Substring(1);
                // Extract the index from jsName like _sv0 -> 0
                int start = int.Parse(System.Text.RegularExpressions.Regex.Match(jsName, @"_sv(\d+)").Groups[1].Value);
                if (IsPrimitive(si))
                {
                    return "    // JSValToCSVal primitive params\n    Il2CppArray* " + csName + " = Params<" + PrimitiveSignatureCppTypeMap[si] + ">::PackPrimitive(apis, env, info, TI" + csName + ", js_args_len, " + start + ");\n                ";
                }
                else if (si == "s")
                {
                    return "    // JSValToCSVal string params\n    Il2CppArray* " + csName + " = Params<void*>::PackString(apis, env, info, TI" + csName + ", js_args_len, " + start + ");\n                ";
                }
                else if (si == "o" || si == "O" || si == "a")
                {
                    return "    // JSValToCSVal ref params\n    Il2CppArray* " + csName + " = Params<void*>::PackRef(apis, env, info, TI" + csName + ", js_args_len, " + start + ");\n                ";
                }
                else if (IsStructOrNullableStruct(si))
                {
                    return "    // JSValToCSVal valuetype params\n    Il2CppArray* " + csName + " = Params<" + si + ">::PackValueType(apis, env, info, TI" + csName + ", js_args_len, " + start + ");\n                ";
                }
                else
                {
                    return "    // JSValToCSVal unknow params type\n    Il2CppArray* " + csName + " = nullptr;\n                ";
                }
            }
            else if (signature.StartsWith(NullableStructPrefix) || signature.StartsWith("DN_"))
            {
                string si = signature[0] == 'D' ? signature.Substring(1) : signature;
                return "    // JSValToCSVal Nullable \n    " + si + " " + csName + ";\n    NullableConverter<" + si + ">::toCpp(apis, env, " + jsName + ", TI" + csName + ", &" + csName + ");";
            }
            else if (signature[0] == 'D')
            {
                string si = signature.Substring(1);
                int start = int.Parse(System.Text.RegularExpressions.Regex.Match(jsName, @"_sv(\d+)").Groups[1].Value);
                if (IsPrimitive(si))
                {
                    return "    // JSValToCSVal primitive with default\n    " + PrimitiveSignatureCppTypeMap[si] + " " + csName + " = OptionalParameter<" + PrimitiveSignatureCppTypeMap[si] + ">::GetPrimitive(apis, env, info, method, wrapData, js_args_len, " + start + ");\n                ";
                }
                else if (si == "s")
                {
                    return "    // JSValToCSVal string  with default\n    Il2CppString* " + csName + " = OptionalParameter<Il2CppString*>::GetString(apis, env, info, method, wrapData, js_args_len, " + start + ");\n                ";
                }
                else if (si == "o" || si == "O" || si == "a")
                {
                    return "    // JSValToCSVal ref  with default\n    Il2CppObject* " + csName + " = OptionalParameter<Il2CppObject*>::GetRefType(apis, env, info, method, wrapData, js_args_len, " + start + ", TI" + csName + ");\n                ";
                }
                else if (IsStruct(si))
                {
                    return "    // JSValToCSVal valuetype  with default\n    " + si + " " + csName + " = OptionalParameter<" + si + ">::GetValueType(apis, env, info, method, wrapData, js_args_len, " + start + ");\n                ";
                }
                else
                {
                    return "    // JSValToCSVal unknow type with default\n    void* " + csName + " = nullptr;\n                ";
                }
            }
            else
            {
                return "    // JSValToCSVal P any\n    " + SToCPPType(signature) + " " + csName + " = " + GetArgValue(signature, jsName, false) + ";";
            }
        }

        private static string CSValToJSVal(string signature, string csName)
        {
            string tiName = "TI" + (csName.Length > 0 && csName[0] == '*' ? csName.Substring(1) : csName);

            if (IsPrimitive(signature))
            {
                return "converter::Converter<" + PrimitiveSignatureCppTypeMap[signature] + ">::toScript(apis, env, " + csName + ")";
            }
            else if (signature == "O")
            {
                return "CSRefToJsValue(apis, env, " + tiName + ", " + csName + ")";
            }
            else if (signature == "o")
            {
                return "CSRefToJsValue(apis, env, " + tiName + ", " + csName + ")";
            }
            else if (signature == "a")
            {
                return "CSRefToJsValue(apis, env, " + tiName + ", " + csName + ")";
            }
            else if (IsNullableStruct(signature))
            {
                return "NullableConverter<" + signature + ">::toScript(apis, env, " + tiName + ", &" + csName + ")";
            }
            else if (signature == "s")
            {
                return "converter::Converter<Il2CppString*>::toScript(apis, env, " + csName + ")";
            }
            else if (signature == "p" || signature == "Pv")
            {
                return InvokePapi("create_binary") + "(env, " + csName + ", 0)";
            }
            else if (IsStruct(signature))
            {
                return "DataTransfer::CopyValueType(apis, env, " + csName + ", " + tiName + ")";
            }
            else if (signature == "Ps")
            {
                return "converter::Converter<std::reference_wrapper<Il2CppString*>>::toScript(apis, env, *" + csName + ")";
            }
            else if (signature.Length > 0 && signature[0] == 'P' && signature != "Pv")
            {
                string elemSignature = signature.Substring(1);
                if (IsPrimitive(elemSignature))
                {
                    return "converter::Converter<std::reference_wrapper<" + PrimitiveSignatureCppTypeMap[elemSignature] + ">>::toScript(apis, env, *" + csName + ")";
                }
                else if (IsStruct(elemSignature) || signature == "Po" || signature == "PO" || signature == "Pa")
                {
                    return InvokePapi("boxing") + "(env, " + InvokePapi("native_object_to_value") + "(env, " + tiName + ", " + csName + ", false))";
                }
            }
            return "// unknow ret signature: " + signature;
        }

        private static string ReturnToJS(string signature)
        {
            return InvokePapi("add_return") + "(info, " + CSValToJSVal(signature, "ret") + ");";
        }

        private static string ReturnToCS(string signature)
        {
            return "\n" + JSValToCSVal(signature, "jsret", "ret") + "\n    return ret;\n        ";
        }

        private static string RefSetback(string signature, int index)
        {
            if (signature[0] == 'P' && signature != "Pv")
            {
                string elementSignature = signature.Substring(1);
                string val = CSValToJSVal(elementSignature, "*p" + index);
                if (val != null && !val.StartsWith("//"))
                {
                    if (IsStruct(elementSignature))
                    {
                        return "if (p" + index + " == &up" + index + ")\n    {\n        " + InvokePapi("update_boxed_value") + "(env, _sv" + index + ", " + val + ");\n    }\n            ";
                    }
                    else if (IsNullableStruct(elementSignature))
                    {
                        return "if (p" + index + " == &up" + index + ")\n    {\n        if (!p" + index + "->hasValue) " + InvokePapi("update_boxed_value") + "(env, _sv" + index + ", " + InvokePapi("create_null") + "(env));\n        if (p" + index + " == &up" + index + ") " + InvokePapi("update_boxed_value") + "(env, _sv" + index + ", " + val + ");\n    }\n            ";
                    }
                    else
                    {
                        return InvokePapi("update_boxed_value") + "(env, _sv" + index + ", " + val + ");";
                    }
                }
            }
            return "";
        }

        #endregion

        #region File Generation: WrapperDef

        public static string GenWrapperDefFile(List<SignatureInfo> wrapperInfos)
        {
            var sb = new StringBuilder();
            sb.AppendLine("// Auto Gen");
            sb.AppendLine();
            sb.AppendLine("#include \"il2cpp-api.h\"");
            sb.AppendLine("#include \"il2cpp-class-internals.h\"");
            sb.AppendLine("#include \"il2cpp-object-internals.h\"");
            sb.AppendLine("#include \"vm/InternalCalls.h\"");
            sb.AppendLine("#include \"vm/Object.h\"");
            sb.AppendLine("#include \"vm/Array.h\"");
            sb.AppendLine("#include \"vm/Runtime.h\"");
            sb.AppendLine("#include \"vm/Reflection.h\"");
            sb.AppendLine("#include \"vm/MetadataCache.h\"");
            sb.AppendLine("#include \"vm/Field.h\"");
            sb.AppendLine("#include \"vm/GenericClass.h\"");
            sb.AppendLine("#include \"vm/Thread.h\"");
            sb.AppendLine("#include \"vm/Method.h\"");
            sb.AppendLine("#include \"vm/Parameter.h\"");
            sb.AppendLine("#include \"vm/Image.h\"");
            sb.AppendLine("#include \"utils/StringUtils.h\"");
            sb.AppendLine("#include \"gc/WriteBarrier.h\"");
            sb.AppendLine("#include \"pesapi.h\"");
            sb.AppendLine("#include \"TDataTrans.h\"");
            sb.AppendLine("#include \"PuertsValueType.h\"");
            sb.AppendLine("#if defined(__EMSCRIPTEN__)");
            sb.AppendLine("#include \"pesapi_webgl.h\"");
            sb.AppendLine("using namespace pesapi::webglimpl;");
            sb.AppendLine("#endif");
            sb.AppendLine();
            sb.AppendLine("namespace puerts");
            sb.AppendLine("{");

            foreach (var info in wrapperInfos)
            {
                sb.AppendLine(GenSingleWrapperFunc(info));
            }

            sb.AppendLine();
            sb.AppendLine("}");
            sb.AppendLine();
            return sb.ToString();
        }

        private static string GenSingleWrapperFunc(SignatureInfo wrapperInfo)
        {
            var ps = wrapperInfo.ParameterSignatures ?? new List<string>();
            var sb = new StringBuilder();

            //sb.AppendLine();
            sb.AppendLine("// " + wrapperInfo.CsName);
            sb.AppendLine("bool w_" + wrapperInfo.Signature + "(struct pesapi_ffi* apis, MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, pesapi_env env, void* self, bool checkJSArgument, WrapData* wrapData) {");
            sb.AppendLine("    // PLog(\"Running w_" + wrapperInfo.Signature + "\");");
            sb.AppendLine("    ");
            var typeInfoDecls = DeclareTypeInfo(wrapperInfo.ReturnSignature, ps);
            if (!string.IsNullOrEmpty(typeInfoDecls)) sb.AppendLine("    " + typeInfoDecls);
            sb.AppendLine();
            sb.AppendLine("    int js_args_len = " + InvokePapi("get_args_len") + "(info);");
            sb.AppendLine("    ");

            // Get args
            for (int i = 0; i < ps.Count; i++)
            {
                sb.AppendLine("    pesapi_value _sv" + i + " = " + InvokePapi("get_arg") + "(info, " + i + ");");
            }
            sb.AppendLine();

            // CheckJSArgument block
            bool hasOptionalArgs = ps.Any(s => s[0] == 'D');
            sb.AppendLine("    if (" + (hasOptionalArgs ? "true" : "checkJSArgument") + ") {");
            sb.AppendLine("        if (" + GenArgsLenCheck(ps) + ") return false;");
            foreach (var (x, i) in ps.Select((x, i) => (x, i)))
            {
                string check = CheckJSArg(x, i);
                if (!string.IsNullOrEmpty(check))
                {
                    sb.AppendLine("        " + check);
                }
            }
            sb.AppendLine("    }");
            sb.AppendLine("    ");

            // JSValToCSVal for each parameter
            for (int i = 0; i < ps.Count; i++)
            {
                sb.AppendLine(JSValToCSVal(ps[i], "_sv" + i, "p" + i));
            }
            sb.AppendLine();

            // Build the typedef and call
            string retType = SToCPPType(wrapperInfo.ReturnSignature);
            var funcParams = new List<string>();
            if (NeedThis(wrapperInfo.ThisSignature)) funcParams.Add("void*");
            for (int i = 0; i < ps.Count; i++)
            {
                funcParams.Add(SToCPPType(ps[i]) + " p" + i);
            }
            funcParams.Add("const void* method");
            sb.AppendLine("    typedef " + retType + " (*FuncToCall)(" + string.Join(", ", funcParams) + ");");

            // Call the function
            string callArgs = (NeedThis(wrapperInfo.ThisSignature) ? "self, " : " ") +
                              string.Join("", ps.Select((_, i) => "p" + i + ", ")) + " method";
            if (wrapperInfo.ReturnSignature != "v")
                sb.AppendLine("    " + retType + " ret = ((FuncToCall)methodPointer)(" + callArgs + ");");
            else
                sb.AppendLine("    ((FuncToCall)methodPointer)(" + callArgs + ");");

            sb.AppendLine();

            // RefSetback
            for (int i = 0; i < ps.Count; i++)
            {
                string setback = RefSetback(ps[i], i);
                if (!string.IsNullOrEmpty(setback))
                {
                    sb.AppendLine("    " + setback);
                }
            }
            sb.AppendLine("    ");

            // Return
            if (wrapperInfo.ReturnSignature != "v")
            {
                sb.AppendLine("    " + ReturnToJS(wrapperInfo.ReturnSignature));
            }
            sb.AppendLine("    return true;");
            sb.AppendLine("}");
            return sb.ToString();
        }

        #endregion

        #region File Generation: Wrapper (declarations + lookup table)

        public static string GenWrapperFile(List<SignatureInfo> allWrapperInfos)
        {
            var sb = new StringBuilder();
            sb.AppendLine("// Auto Gen");
            sb.AppendLine();
            sb.AppendLine("#include <memory>");
            sb.AppendLine("#include \"il2cpp-api.h\"");
            sb.AppendLine("#include \"il2cpp-class-internals.h\"");
            sb.AppendLine("#include \"il2cpp-object-internals.h\"");
            sb.AppendLine("#include \"vm/Object.h\"");
            sb.AppendLine("#include \"pesapi.h\"");
            sb.AppendLine("#include \"TDataTrans.h\"");
            sb.AppendLine();
            sb.AppendLine("namespace puerts");
            sb.AppendLine("{");
            sb.AppendLine();

            // Forward declarations
            foreach (var info in allWrapperInfos)
            {
                sb.AppendLine("bool w_" + info.Signature + "(struct pesapi_ffi* apis, MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, pesapi_env env, void* self, bool checkJSArgument, WrapData* wrapData);");
            }
            sb.AppendLine();

            // Lookup table
            sb.AppendLine("static WrapFuncInfo g_wrapFuncInfos[] = {");
            foreach (var info in allWrapperInfos)
            {
                sb.AppendLine("    {\"" + info.Signature + "\", w_" + info.Signature + "},");
            }
            sb.AppendLine("    {nullptr, nullptr}");
            sb.AppendLine("};");
            sb.AppendLine();

            // FindWrapFunc
            sb.AppendLine("WrapFuncPtr FindWrapFunc(const char* signature)");
            sb.AppendLine("{");
            sb.AppendLine("    auto begin = &g_wrapFuncInfos[0];");
            sb.AppendLine("    auto end = &g_wrapFuncInfos[sizeof(g_wrapFuncInfos) / sizeof(WrapFuncInfo) - 1];");
            sb.AppendLine("    auto first = std::lower_bound(begin, end, signature, [](const WrapFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});");
            sb.AppendLine("    if (first != end && strcmp(first->Signature, signature) == 0) {");
            sb.AppendLine("        return first->Method;");
            sb.AppendLine("    }");
            sb.AppendLine("    return nullptr;");
            sb.AppendLine("}");
            sb.AppendLine();
            sb.AppendLine("}");
            sb.AppendLine();
            return sb.ToString();
        }

        #endregion

        #region File Generation: Bridge

        public static string GenBridgeFile(List<SignatureInfo> bridgeInfos)
        {
            var sb = new StringBuilder();
            sb.AppendLine("// Auto Gen");
            sb.AppendLine();
            sb.AppendLine("#include \"il2cpp-api.h\"");
            sb.AppendLine("#include \"il2cpp-class-internals.h\"");
            sb.AppendLine("#include \"il2cpp-object-internals.h\"");
            sb.AppendLine("#include \"vm/InternalCalls.h\"");
            sb.AppendLine("#include \"vm/Object.h\"");
            sb.AppendLine("#include \"vm/Array.h\"");
            sb.AppendLine("#include \"vm/Runtime.h\"");
            sb.AppendLine("#include \"vm/Reflection.h\"");
            sb.AppendLine("#include \"vm/MetadataCache.h\"");
            sb.AppendLine("#include \"vm/Field.h\"");
            sb.AppendLine("#include \"vm/GenericClass.h\"");
            sb.AppendLine("#include \"vm/Thread.h\"");
            sb.AppendLine("#include \"vm/Method.h\"");
            sb.AppendLine("#include \"vm/Parameter.h\"");
            sb.AppendLine("#include \"vm/Image.h\"");
            sb.AppendLine("#include \"utils/StringUtils.h\"");
            sb.AppendLine("#include \"gc/WriteBarrier.h\"");
            sb.AppendLine("#include \"pesapi.h\"");
            sb.AppendLine("#include \"TDataTrans.h\"");
            sb.AppendLine("#include \"PuertsValueType.h\"");
            sb.AppendLine();
            sb.AppendLine("namespace puerts");
            sb.AppendLine("{");

            foreach (var info in bridgeInfos)
            {
                sb.AppendLine(GenSingleBridge(info));
            }

            sb.AppendLine();
            // Lookup table
            sb.AppendLine("static BridgeFuncInfo g_bridgeFuncInfos[] = {");
            foreach (var info in bridgeInfos)
            {
                sb.AppendLine("    {\"" + info.Signature + "\", (Il2CppMethodPointer)b_" + info.Signature + ", b_" + info.Signature + "_Invoker},");
            }
            sb.AppendLine("    {nullptr, nullptr, nullptr}");
            sb.AppendLine("};");
            sb.AppendLine();

            sb.AppendLine();
            sb.AppendLine("BridgeFuncInfo* FindBridgeFunc(const char* signature)");
            sb.AppendLine("{");
            sb.AppendLine("    auto begin = &g_bridgeFuncInfos[0];");
            sb.AppendLine("    auto end = &g_bridgeFuncInfos[sizeof(g_bridgeFuncInfos) / sizeof(BridgeFuncInfo) - 1];");
            sb.AppendLine("    auto first = std::lower_bound(begin, end, signature, [](const BridgeFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});");
            sb.AppendLine("    if (first != end && strcmp(first->Signature, signature) == 0) {");
            sb.AppendLine("        return first;");
            sb.AppendLine("    }");
            sb.AppendLine("    return nullptr;");
            sb.AppendLine("}");
            sb.AppendLine();
            sb.AppendLine("}");
            sb.AppendLine();
            return sb.ToString();
        }

        private static string GenSingleBridge(SignatureInfo bridgeInfo)
        {
            var ps = bridgeInfo.ParameterSignatures ?? new List<string>();
            var sb = new StringBuilder();

            bool hasVarArgs = ps.Count > 0 && ps[ps.Count - 1][0] == 'V';

            sb.AppendLine();
            sb.AppendLine("// " + bridgeInfo.CsName);

            // Build function signature
            var funcParams = new List<string>();
            funcParams.Add("void* target");
            for (int i = 0; i < ps.Count; i++)
            {
                funcParams.Add(SToCPPType(ps[i]) + " p" + i);
            }
            funcParams.Add("MethodInfo* method");

            sb.AppendLine("static " + SToCPPType(bridgeInfo.ReturnSignature) + " b_" + bridgeInfo.Signature + "(" + string.Join(", ", funcParams) + ") {");
            sb.AppendLine("    // PLog(\"Running b_" + bridgeInfo.Signature + "\");");
            sb.AppendLine();

            // TypeInfo declarations for return
            if (!string.IsNullOrEmpty(bridgeInfo.ReturnSignature) && !IsPrimitive(GetSignatureWithoutRefAndPrefix(bridgeInfo.ReturnSignature)))
            {
                sb.AppendLine("    auto TIret = GetReturnType(method);");
            }
            // TypeInfo declarations for parameters
            for (int i = 0; i < ps.Count; i++)
            {
                if (!IsPrimitive(GetSignatureWithoutRefAndPrefix(ps[i])))
                {
                    sb.AppendLine("    auto TIp" + i + " = GetParameterType(method, " + i + ");");
                }
            }
            sb.AppendLine();

            sb.AppendLine("    PObjectRefInfo* delegateInfo = GetPObjectRefInfo(target);");
            sb.AppendLine("    struct pesapi_ffi* apis = delegateInfo->Apis;");
            sb.AppendLine("    ");
            sb.AppendLine("    pesapi_env_ref envRef = " + InvokePapi("get_ref_associated_env") + "(delegateInfo->ValueRef);");
            sb.AppendLine("    AutoValueScope valueScope(apis, envRef);");
            sb.AppendLine("    auto env = " + InvokePapi("get_env_from_ref") + "(envRef);");
            sb.AppendLine("    if (!env)");
            sb.AppendLine("    {");
            sb.AppendLine("        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException(\"JsEnv had been destroy\"));");
            if (bridgeInfo.ReturnSignature != "v")
            {
                sb.AppendLine("        return {};");
            }
            sb.AppendLine("    }");
            sb.AppendLine("    auto func = " + InvokePapi("get_value_from_ref") + "(env, delegateInfo->ValueRef);");
            sb.AppendLine("    ");

            // Generate bridge args
            sb.AppendLine("    " + GenBridgeArgs(ps));
            sb.AppendLine("    auto jsret = " + InvokePapi("call_function") + "(env, func, nullptr, " + ps.Count + (hasVarArgs ? " + arrayLength - 1" : "") + ", argv);");
            sb.AppendLine("    ");
            sb.AppendLine("    if (" + InvokePapi("has_caught") + "(valueScope.scope()))");
            sb.AppendLine("    {");
            sb.AppendLine("        auto msg = " + InvokePapi("get_exception_as_string") + "(valueScope.scope(), true);");
            sb.AppendLine("        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException(msg));");
            if (bridgeInfo.ReturnSignature == "v")
            {
                sb.AppendLine("    }");
            }
            else
            {
                sb.AppendLine("        return {};");
                sb.AppendLine("    }");
                sb.AppendLine("    " + ReturnToCS(bridgeInfo.ReturnSignature));
            }
            sb.AppendLine("}");
            sb.AppendLine();

            // Invoker function
            sb.AppendLine("static void b_" + bridgeInfo.Signature + "_Invoker(Il2CppMethodPointer func, const MethodInfo* method, void* thisPtr, void** args, void* il2ppRetVal)");
            sb.AppendLine("{");
            if (bridgeInfo.ReturnSignature != "v")
            {
                sb.Append("    *((" + SToCPPType(bridgeInfo.ReturnSignature) + " *)il2ppRetVal) =\n    ");
            }
            else
            {
                sb.Append("    ");
            }
            sb.Append("b_" + bridgeInfo.Signature + "(thisPtr, ");
            for (int i = 0; i < ps.Count; i++)
            {
                sb.Append(FromAny(ps[i]) + "args[" + i + "], ");
            }
            sb.AppendLine("(MethodInfo*)method);");
            sb.AppendLine("}");

            return sb.ToString();
        }

        private static string GenBridgeArgs(List<string> parameterSignatures)
        {
            if (parameterSignatures.Count == 0)
                return "pesapi_value *argv = nullptr;";

            if (parameterSignatures[parameterSignatures.Count - 1][0] != 'V')
            {
                // Fixed number of args
                var sb = new StringBuilder();
                sb.Append("pesapi_value argv[" + parameterSignatures.Count + "]{\n        ");
                for (int i = 0; i < parameterSignatures.Count; i++)
                {
                    string sig = parameterSignatures[i];
                    if (sig[0] == 'D') sig = sig.Substring(1);
                    string val = CSValToJSVal(sig, "p" + i);
                    if (val.StartsWith("//"))
                        val = InvokePapi("create_undefined") + "(env)";
                    if (i > 0) sb.Append(",\n        ");
                    sb.Append(val);
                }
                sb.Append("\n    };");
                return sb.ToString();
            }
            else
            {
                // Variable args (params)
                string lastSig = parameterSignatures[parameterSignatures.Count - 1];
                string si = lastSig.Substring(1);
                string unpackMethod;
                if (IsPrimitive(si))
                    unpackMethod = "Params<" + PrimitiveSignatureCppTypeMap[si] + ">::UnPackPrimitive";
                else if (IsStructOrNullableStruct(si))
                    unpackMethod = "Params<" + si + ">::UnPackValueType";
                else
                    unpackMethod = "Params<Il2CppObject*>::UnPackRefOrBoxedValueType";

                int fixedCount = parameterSignatures.Count - 1;
                var sb = new StringBuilder();
                sb.AppendLine("auto arrayLength = il2cpp::vm::Array::GetLength(p" + (parameterSignatures.Count - 1) + ");");
                sb.AppendLine("    pesapi_value *argv = (pesapi_value *)alloca(sizeof(pesapi_value) * (" + fixedCount + " + arrayLength));");
                sb.AppendLine("    memset(argv, 0, sizeof(pesapi_value) * (" + fixedCount + " + arrayLength));");
                for (int i = 0; i < fixedCount; i++)
                {
                    string val = CSValToJSVal(parameterSignatures[i], "p" + i);
                    if (val.StartsWith("//"))
                        val = InvokePapi("create_undefined") + "(env)";
                    sb.AppendLine("    argv[" + i + "] = " + val + ";");
                }
                sb.Append("    " + unpackMethod + "(apis, env, p" + (parameterSignatures.Count - 1) + ", arrayLength, TIp" + (parameterSignatures.Count - 1) + ", argv + " + fixedCount + ");");
                return sb.ToString();
            }
        }

        #endregion

        #region File Generation: FieldWrapper

        public static string GenFieldWrapperFile(List<SignatureInfo> fieldWrapperInfos)
        {
            var sb = new StringBuilder();
            sb.AppendLine("// Auto Gen");
            sb.AppendLine();
            sb.AppendLine("#include \"il2cpp-api.h\"");
            sb.AppendLine("#include \"il2cpp-class-internals.h\"");
            sb.AppendLine("#include \"il2cpp-object-internals.h\"");
            sb.AppendLine("#include \"vm/InternalCalls.h\"");
            sb.AppendLine("#include \"vm/Object.h\"");
            sb.AppendLine("#include \"vm/Array.h\"");
            sb.AppendLine("#include \"vm/Runtime.h\"");
            sb.AppendLine("#include \"vm/Reflection.h\"");
            sb.AppendLine("#include \"vm/MetadataCache.h\"");
            sb.AppendLine("#include \"vm/Field.h\"");
            sb.AppendLine("#include \"vm/GenericClass.h\"");
            sb.AppendLine("#include \"vm/Thread.h\"");
            sb.AppendLine("#include \"vm/Method.h\"");
            sb.AppendLine("#include \"vm/Parameter.h\"");
            sb.AppendLine("#include \"vm/Image.h\"");
            sb.AppendLine("#include \"utils/StringUtils.h\"");
            sb.AppendLine("#include \"gc/WriteBarrier.h\"");
            sb.AppendLine("#include \"pesapi.h\"");
            sb.AppendLine("#include \"TDataTrans.h\"");
            sb.AppendLine("#include \"PuertsValueType.h\"");
            sb.AppendLine();
            sb.AppendLine();
            sb.AppendLine("namespace puerts");
            sb.AppendLine("{");

            foreach (var info in fieldWrapperInfos)
            {
                sb.AppendLine(GenSingleFieldWrapper(info));
            }
            sb.AppendLine();

            // Lookup table
            sb.AppendLine("static FieldWrapFuncInfo g_fieldWrapFuncInfos[] = {");
            foreach (var info in fieldWrapperInfos)
            {
                sb.AppendLine("    {\"" + info.Signature + "\", ifg_" + info.Signature + ", ifs_" + info.Signature + "},");
            }
            sb.AppendLine("    {nullptr, nullptr, nullptr}    ");
            sb.AppendLine("};");
            sb.AppendLine();

            sb.AppendLine("FieldWrapFuncInfo * FindFieldWrapFuncInfo(const char* signature)");
            sb.AppendLine("{");
            sb.AppendLine("    auto begin = &g_fieldWrapFuncInfos[0];");
            sb.AppendLine("    auto end = &g_fieldWrapFuncInfos[sizeof(g_fieldWrapFuncInfos) / sizeof(FieldWrapFuncInfo) - 1];");
            sb.AppendLine("    auto first = std::lower_bound(begin, end, signature, [](const FieldWrapFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});");
            sb.AppendLine("    if (first != end && strcmp(first->Signature, signature) == 0) {");
            sb.AppendLine("        return first;");
            sb.AppendLine("    }");
            sb.AppendLine("    return nullptr;");
            sb.AppendLine("}");
            sb.AppendLine();
            sb.AppendLine("}");
            sb.AppendLine();
            return sb.ToString();
        }

        private static string GenSingleFieldWrapper(SignatureInfo fieldWrapperInfo)
        {
            var sb = new StringBuilder();
            bool needThis = NeedThis(fieldWrapperInfo.ThisSignature);
            string sig = fieldWrapperInfo.ReturnSignature;

            // Getter
            //sb.AppendLine();
            sb.AppendLine("static void ifg_" + fieldWrapperInfo.Signature + "(struct pesapi_ffi* apis, pesapi_callback_info info, FieldInfo* fieldInfo, size_t offset, Il2CppClass* TIret) {");
            sb.AppendLine("    // PLog(\"Running ifg_" + fieldWrapperInfo.Signature + "\");");
            sb.AppendLine();
            sb.AppendLine("    pesapi_env env = " + InvokePapi("get_env") + "(info);");
            if (needThis)
            {
                sb.AppendLine();
                sb.AppendLine("    " + GetThis(fieldWrapperInfo.ThisSignature));
                sb.AppendLine();
            }
            sb.AppendLine("    " + GenGetField(fieldWrapperInfo));
            sb.AppendLine("}");
            sb.AppendLine();

            // Setter
            sb.AppendLine("static void ifs_" + fieldWrapperInfo.Signature + "(struct pesapi_ffi* apis, pesapi_callback_info info, FieldInfo* fieldInfo, size_t offset, Il2CppClass* TIp) {");
            sb.AppendLine("    // PLog(\"Running ifs_" + fieldWrapperInfo.Signature + "\");");
            sb.AppendLine("    ");
            sb.AppendLine("    pesapi_env env = " + InvokePapi("get_env") + "(info);");
            if (needThis)
            {
                sb.AppendLine();
                sb.AppendLine("    " + GetThis(fieldWrapperInfo.ThisSignature));
                sb.AppendLine();
            }
            sb.AppendLine("    // " + sig);
            sb.AppendLine(JSValToCSVal(sig, InvokePapi("get_arg") + "(info, 0)", "p"));

            // Determine whether to pass &p or p
            // Note: must use the full Signature (e.g. "to", "ts"), not ReturnSignature (e.g. "o", "s"),
            // to match the JS template logic: ['o', 's', 'p', 'a'].indexOf(fieldWrapperInfo.Signature) != -1
            string fullSig = fieldWrapperInfo.Signature;
            bool passByValue = (fullSig == "o" || fullSig == "s" || fullSig == "p" || fullSig == "a");
            sb.AppendLine("    SetFieldValue(" + (needThis ? "self, " : "nullptr, ") + "fieldInfo, offset, " + (passByValue ? "p" : "&p") + ");");
            sb.AppendLine("}");

            return sb.ToString();
        }

        private static string GenGetField(SignatureInfo fieldWrapperInfo)
        {
            string sig = fieldWrapperInfo.ReturnSignature;
            bool needThis = NeedThis(fieldWrapperInfo.ThisSignature);

            if (IsStructOrNullableStruct(sig))
            {
                string src = needThis
                    ? "auto _src = (" + sig + "*)((char*)self + offset);"
                    : "auto _src = (" + sig + "*)GetValueTypeFieldPtr(nullptr, fieldInfo, offset);";

                if (IsNullableStruct(sig))
                {
                    return src + "\n\n\t" + InvokePapi("add_return") + "(info, NullableConverter<" + sig + ">::toScript(apis, env, TIret, _src));";
                }
                else
                {
                    return src + "\n\n\t" + InvokePapi("add_return") + "(info, DataTransfer::CopyValueType<" + sig + ">(apis, env, *_src, TIret));";
                }
            }
            else
            {
                return SToCPPType(sig) + " ret;\n\n    GetFieldValue(" + (needThis ? "self, " : "nullptr, ") + "fieldInfo, offset, &ret);\n    \n    " + ReturnToJS(sig);
            }
        }

        #endregion

        #region File Generation: ValueType Header

        public static string GenValueTypeFile(List<ValueTypeInfo> valueTypeInfos)
        {
            var sb = new StringBuilder();
            sb.AppendLine("// Auto Gen");
            sb.AppendLine();
            sb.AppendLine("#if !__SNC__");
            sb.AppendLine("#ifndef __has_feature ");
            sb.AppendLine("#define __has_feature(x) 0 ");
            sb.AppendLine("#endif");
            sb.AppendLine("#endif");
            sb.AppendLine();
            sb.AppendLine("#if _MSC_VER");
            sb.AppendLine("typedef wchar_t Il2CppChar;");
            sb.AppendLine("#elif __has_feature(cxx_unicode_literals)");
            sb.AppendLine("typedef char16_t Il2CppChar;");
            sb.AppendLine("#else");
            sb.AppendLine("typedef uint16_t Il2CppChar;");
            sb.AppendLine("#endif");
            sb.AppendLine();
            sb.AppendLine("namespace puerts");
            sb.AppendLine("{");
            sb.AppendLine();

            foreach (var vt in valueTypeInfos)
            {
                if (string.IsNullOrEmpty(vt.Signature)) continue;

                sb.AppendLine("// " + vt.CsName);
                sb.AppendLine("struct " + vt.Signature);
                sb.AppendLine("{");

                if (vt.FieldSignatures == null || vt.FieldSignatures.Count == 0)
                {
                    sb.AppendLine("    union");
                    sb.AppendLine("    {");
                    sb.AppendLine("        struct");
                    sb.AppendLine("        {");
                    sb.AppendLine("        };");
                    sb.AppendLine("        uint8_t __padding[1];");
                    sb.AppendLine("    };");
                }
                else
                {
                    for (int i = 0; i < vt.FieldSignatures.Count; i++)
                    {
                        string fieldType = SToCPPType(vt.FieldSignatures[i]);
                        if (IsNullableStruct(vt.Signature) && i == vt.NullableHasValuePosition)
                        {
                            sb.AppendLine("    " + fieldType + " hasValue;");
                        }
                        else
                        {
                            sb.AppendLine("    " + fieldType + " p" + i + ";");
                        }
                    }
                }

                sb.AppendLine("};");
                sb.AppendLine("    ");
            }

            sb.AppendLine("}");
            sb.AppendLine();
            return sb.ToString();
        }

        #endregion

        #region File Generation: Macro Header

        public static string GenMacroHeader(List<string> defines)
        {
            var sb = new StringBuilder();
            foreach (var d in defines)
            {
                sb.AppendLine("#ifndef " + d);
                sb.AppendLine("    #define " + d);
                sb.AppendLine("#endif");
            }
            return sb.ToString();
        }

        #endregion

        #region File Generation: Extension Methods

        public static string GenExtensionMethodInfos(List<KeyValuePair<Type, List<Type>>> extendedType2extensionType)
        {
            var sb = new StringBuilder();
            sb.AppendLine();
            sb.AppendLine("using System;");
            sb.AppendLine("using System.Collections.Generic;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine("namespace PuertsIl2cpp");
            sb.AppendLine("{");
            sb.AppendLine("public static class ExtensionMethodInfos_Gen");
            sb.AppendLine("{");
            sb.AppendLine("    [UnityEngine.Scripting.Preserve]");
            sb.AppendLine("    public static MethodInfo[] TryLoadExtensionMethod(string assemblyQualifiedName)");
            sb.AppendLine("    {");
            sb.AppendLine("        if (false) {}");

            foreach (var pair in extendedType2extensionType)
            {
                string extendedTypeName = Puerts.TypeExtensions.GetFriendlyName(pair.Key);
                sb.Append("        else if (typeof(" + extendedTypeName + ").AssemblyQualifiedName == assemblyQualifiedName)");
                sb.AppendLine();
                sb.AppendLine("        {");
                var extensionTypeNames = pair.Value.Select(t => "typeof(" + Puerts.TypeExtensions.GetFriendlyName(t) + ")").ToList();
                sb.AppendLine("            return ExtensionMethodInfo.GetExtensionMethods(typeof(" + extendedTypeName + "), " + string.Join(", ", extensionTypeNames) + ");");
                sb.AppendLine("        }");
            }

            sb.AppendLine("        return null;");
            sb.AppendLine("    }");
            sb.AppendLine("}");
            sb.AppendLine("}");
            return sb.ToString().Trim();
        }

        #endregion

        #region File Generation: link.xml

        public static string GenLinkXml(List<Type> genTypes)
        {
            // Group types by assembly
            var assemblyMap = new Dictionary<string, List<string>>();
            foreach (var type in genTypes)
            {
                string assemblyName = type.Assembly.GetName(false).Name;
                if (!assemblyMap.ContainsKey(assemblyName))
                    assemblyMap[assemblyName] = new List<string>();

                string typeName;
                if (type.IsGenericType)
                    typeName = type.FullName.Split('[')[0];
                else if (type.IsNested)
                    typeName = type.FullName.Replace('+', '/');
                else
                    typeName = type.FullName;

                assemblyMap[assemblyName].Add(typeName);
            }

            var sb = new StringBuilder();
            sb.AppendLine("<linker>");
            foreach (var kvp in assemblyMap)
            {
                sb.AppendLine("    <assembly fullname=\"" + kvp.Key + "\">");
                foreach (var typeName in kvp.Value)
                {
                    sb.AppendLine("        <type fullname=\"" + typeName + "\" preserve=\"all\"/>");
                }
                sb.AppendLine("    </assembly>");
            }
            sb.Append("</linker>");
            return sb.ToString();
        }

        #endregion

        #region Data Model (shared with FileExporter)

        // These classes mirror the data structures in FileExporter
        // but are public so they can be used independently
        public class ValueTypeInfo
        {
            public string Signature;
            public string CsName;
            public List<string> FieldSignatures;
            public int NullableHasValuePosition;
        }

        public class SignatureInfo
        {
            public string Signature;
            public string CsName;
            public string ReturnSignature;
            public string ThisSignature;
            public List<string> ParameterSignatures;
        }

        #endregion
    }
}
#endif
