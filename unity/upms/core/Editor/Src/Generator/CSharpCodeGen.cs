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

namespace Puerts.Editor.Generator
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
                return $"auto self = {InvokePapi("get_native_holder_ptr")}(info);";
            }
            else if (thisSignature == "T")
            {
                return $@"auto self = {InvokePapi("get_native_holder_ptr")}(info);
    auto ptrType = (Il2CppClass*) {InvokePapi("get_native_holder_typeid")}(info);
    if (il2cpp::vm::Class::IsValuetype(ptrType))
    {{
        self = DataTransfer::GetValueTypeForCSharp(ptrType, self);
    }}
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
                    return $"converter::Converter<std::reference_wrapper<{cppType}>>::toCpp(apis, env, {jsName})";
                else
                    return $"converter::Converter<{cppType}>::toCpp(apis, env, {jsName})";
            }
            else if ((signature == "Pv" || signature == "p") && !isRef)
            {
                return $"DataTransfer::GetPointer<void>(apis, env, {jsName})";
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
            var parts = new List<string>();
            int i = 0;
            bool returnHasTypeInfo = !string.IsNullOrEmpty(returnSignature) &&
                                     !IsPrimitive(GetSignatureWithoutRefAndPrefix(returnSignature));
            if (returnHasTypeInfo)
            {
                parts.Add($"auto TIret = wrapData->TypeInfos[{i}];");
                i++;
            }
            for (int idx = 0; idx < parameterSignatures.Count; idx++)
            {
                if (!IsPrimitive(GetSignatureWithoutRefAndPrefix(parameterSignatures[idx])))
                {
                    parts.Add($"auto TIp{idx} = wrapData->TypeInfos[{i}];");
                    i++;
                }
            }
            return string.Join("\n    ", parts);
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
            string typeInfoVar = $"TIp{index}";

            if (signature[0] == 'D')
            {
                ret += $"if (js_args_len > {index} && ";
                signature = signature.Substring(1);
            }
            else if (signature[0] == 'V')
            {
                string elmSignature = signature.Substring(1);
                string elmClassDecl = "";
                if (elmSignature == "o" || elmSignature == "O" || elmSignature == "a" ||
                    IsStructOrNullableStruct(elmSignature))
                {
                    elmClassDecl = $"auto {typeInfoVar}_V = il2cpp::vm::Class::GetElementClass({typeInfoVar});";
                }
                ret += $"{elmClassDecl}if (js_args_len > {index} && ";
                signature = elmSignature;
                typeInfoVar += "_V";
            }
            else
            {
                ret += "if (";
            }

            if (IsPrimitive(signature))
            {
                ret += $"!converter::Converter<{PrimitiveSignatureCppTypeMap[signature]}>::accept(apis, env, _sv{index})) return false;";
            }
            else if (signature == "p" || signature == "Pv" || signature == "a")
            {
                ret += $"!{InvokePapi("is_binary")}(env, _sv{index}) && !{InvokePapi("is_null")}(env, _sv{index}) && !{InvokePapi("is_undefined")}(env, _sv{index})) return false;";
            }
            else if (signature.Length > 0 && signature[0] == 'P')
            {
                ret += $"!{InvokePapi("is_boxed_value")}(env, _sv{index})) return false;";
            }
            else if (signature == "s")
            {
                ret += $"!converter::Converter<Il2CppString*>::accept(apis, env, _sv{index})) return false;";
            }
            else if (signature == "o" || signature == "a")
            {
                ret += $"!DataTransfer::IsAssignable(apis, env, _sv{index}, {typeInfoVar}, false)) return false;";
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
                    ret += $"!{InvokePapi("is_null")}(env, _sv{index}) && !converter::Converter<{PrimitiveSignatureCppTypeMap[si]}>::accept(apis, env, _sv{index})) return false;";
                }
                else
                {
                    ret += $"!{InvokePapi("is_null")}(env, _sv{index}) && !DataTransfer::IsAssignable(apis, env, _sv{index}, il2cpp::vm::Class::GetNullableArgument({typeInfoVar}), true)) return false;";
                }
            }
            else if (IsStruct(signature))
            {
                ret += $"!DataTransfer::IsAssignable(apis, env, _sv{index}, {typeInfoVar}, true)) return false;";
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
                return $@"    // JSValToCSVal s
    Il2CppString* {csName} = converter::Converter<Il2CppString*>::toCpp(apis, env, {jsName});";
            }
            else if (signature == "Ps")
            {
                return $@"    // JSValToCSVal Ps
    Il2CppString* u{csName} = converter::Converter<std::reference_wrapper<Il2CppString*>>::toCpp(apis, env, {jsName}); // string ref
    Il2CppString** {csName} = &u{csName};
        ";
            }
            else if (signature == "o" || signature == "O" || signature == "a")
            {
                return $@"    // JSValToCSVal o/O
    Il2CppObject* {csName} = JsValueToCSRef(apis, TI{csName}, env, {jsName});";
            }
            else if (signature == "Po" || signature == "PO" || signature == "Pa")
            {
                return $@"    // JSValToCSVal Po/PO
    Il2CppObject* u{csName} = DataTransfer::GetPointer<Il2CppObject>(apis, env, {InvokePapi("unboxing")}(env, {jsName})); // object ref
    Il2CppObject** {csName} = &u{csName};
        ";
            }
            else if (IsStruct(signature))
            {
                return $@"    // JSValToCSVal struct
    {signature}* p{csName} = DataTransfer::GetPointer<{signature}>(apis, env, {jsName});
    {signature} {csName} = p{csName} ? *p{csName} : {signature} {{}};";
            }
            else if ((signature.StartsWith("P" + StructPrefix) || signature.StartsWith("P" + NullableStructPrefix)) && signature.EndsWith("_"))
            {
                string S = signature.Substring(1);
                return $@"    // JSValToCSVal Pstruct
    {S}* {csName} = DataTransfer::GetPointer<{S}>(apis, env, {InvokePapi("unboxing")}(env, {jsName})); // valuetype ref
    {S} u{csName};
    if (!{csName}) {{
        memset(&u{csName}, 0, sizeof({S}));
        {csName} = &u{csName};
    }}
        ";
            }
            else if (signature[0] == 'P' && signature != "Pv")
            {
                string S = signature.Substring(1);
                if (IsPrimitive(S))
                {
                    return $@"    // JSValToCSVal P primitive
    {SToCPPType(S)} u{csName} = {GetArgValue(S, jsName, true)};
    {SToCPPType(S)}* {csName} = &u{csName};";
                }
                else
                {
                    return $@"    // JSValToCSVal P not primitive
    {SToCPPType(signature)} {csName} = {GetArgValue(S, jsName, true)};";
                }
            }
            else if (signature[0] == 'V')
            {
                string si = signature.Substring(1);
                // Extract the index from jsName like _sv0 -> 0
                int start = int.Parse(System.Text.RegularExpressions.Regex.Match(jsName, @"_sv(\d+)").Groups[1].Value);
                if (IsPrimitive(si))
                {
                    return $@"    // JSValToCSVal primitive params
    Il2CppArray* {csName} = Params<{PrimitiveSignatureCppTypeMap[si]}>::PackPrimitive(apis, env, info, TI{csName}, js_args_len, {start});
                ";
                }
                else if (si == "s")
                {
                    return $@"    // JSValToCSVal string params
    Il2CppArray* {csName} = Params<void*>::PackString(apis, env, info, TI{csName}, js_args_len, {start});
                ";
                }
                else if (si == "o" || si == "O" || si == "a")
                {
                    return $@"    // JSValToCSVal ref params
    Il2CppArray* {csName} = Params<void*>::PackRef(apis, env, info, TI{csName}, js_args_len, {start});
                ";
                }
                else if (IsStructOrNullableStruct(si))
                {
                    return $@"    // JSValToCSVal valuetype params
    Il2CppArray* {csName} = Params<{si}>::PackValueType(apis, env, info, TI{csName}, js_args_len, {start});
                ";
                }
                else
                {
                    return $@"    // JSValToCSVal unknow params type
    Il2CppArray* {csName} = nullptr;
                ";
                }
            }
            else if (signature.StartsWith(NullableStructPrefix) || signature.StartsWith("DN_"))
            {
                string si = signature[0] == 'D' ? signature.Substring(1) : signature;
                return $@"    // JSValToCSVal Nullable 
    {si} {csName};
    NullableConverter<{si}>::toCpp(apis, env, {jsName}, TI{csName}, &{csName});";
            }
            else if (signature[0] == 'D')
            {
                string si = signature.Substring(1);
                int start = int.Parse(System.Text.RegularExpressions.Regex.Match(jsName, @"_sv(\d+)").Groups[1].Value);
                if (IsPrimitive(si))
                {
                    return $@"    // JSValToCSVal primitive with default
    {PrimitiveSignatureCppTypeMap[si]} {csName} = OptionalParameter<{PrimitiveSignatureCppTypeMap[si]}>::GetPrimitive(apis, env, info, method, wrapData, js_args_len, {start});
                ";
                }
                else if (si == "s")
                {
                    return $@"    // JSValToCSVal string  with default
    Il2CppString* {csName} = OptionalParameter<Il2CppString*>::GetString(apis, env, info, method, wrapData, js_args_len, {start});
                ";
                }
                else if (si == "o" || si == "O" || si == "a")
                {
                    return $@"    // JSValToCSVal ref  with default
    Il2CppObject* {csName} = OptionalParameter<Il2CppObject*>::GetRefType(apis, env, info, method, wrapData, js_args_len, {start}, TI{csName});
                ";
                }
                else if (IsStruct(si))
                {
                    return $@"    // JSValToCSVal valuetype  with default
    {si} {csName} = OptionalParameter<{si}>::GetValueType(apis, env, info, method, wrapData, js_args_len, {start});
                ";
                }
                else
                {
                    return $@"    // JSValToCSVal unknow type with default
    void* {csName} = nullptr;
                ";
                }
            }
            else
            {
                return $"    // JSValToCSVal P any\n    {SToCPPType(signature)} {csName} = {GetArgValue(signature, jsName, false)};";
            }
        }

        private static string CSValToJSVal(string signature, string csName)
        {
            string tiName = "TI" + (csName.Length > 0 && csName[0] == '*' ? csName.Substring(1) : csName);

            if (IsPrimitive(signature))
            {
                return $"converter::Converter<{PrimitiveSignatureCppTypeMap[signature]}>::toScript(apis, env, {csName})";
            }
            else if (signature == "O" || signature == "o" || signature == "a")
            {
                return $"CSRefToJsValue(apis, env, {tiName}, {csName})";
            }
            else if (IsNullableStruct(signature))
            {
                return $"NullableConverter<{signature}>::toScript(apis, env, {tiName}, &{csName})";
            }
            else if (signature == "s")
            {
                return $"converter::Converter<Il2CppString*>::toScript(apis, env, {csName})";
            }
            else if (signature == "p" || signature == "Pv")
            {
                return $"{InvokePapi("create_binary")}(env, {csName}, 0)";
            }
            else if (IsStruct(signature))
            {
                return $"DataTransfer::CopyValueType(apis, env, {csName}, {tiName})";
            }
            else if (signature == "Ps")
            {
                return $"converter::Converter<std::reference_wrapper<Il2CppString*>>::toScript(apis, env, *{csName})";
            }
            else if (signature.Length > 0 && signature[0] == 'P' && signature != "Pv")
            {
                string elemSignature = signature.Substring(1);
                if (IsPrimitive(elemSignature))
                {
                    return $"converter::Converter<std::reference_wrapper<{PrimitiveSignatureCppTypeMap[elemSignature]}>>::toScript(apis, env, *{csName})";
                }
                else if (IsStruct(elemSignature) || signature == "Po" || signature == "PO" || signature == "Pa")
                {
                    return $"{InvokePapi("boxing")}(env, {InvokePapi("native_object_to_value")}(env, {tiName}, {csName}, false))";
                }
            }
            return $"// unknow ret signature: {signature}";
        }

        private static string ReturnToJS(string signature)
        {
            return $"{InvokePapi("add_return")}(info, {CSValToJSVal(signature, "ret")});";
        }

        private static string ReturnToCS(string signature)
        {
            return $"\n{JSValToCSVal(signature, "jsret", "ret")}\n    return ret;\n        ";
        }

        private static string RefSetback(string signature, int index)
        {
            if (signature[0] == 'P' && signature != "Pv")
            {
                string elementSignature = signature.Substring(1);
                string val = CSValToJSVal(elementSignature, $"*p{index}");
                if (val != null && !val.StartsWith("//"))
                {
                    if (IsStruct(elementSignature))
                    {
                        return $@"if (p{index} == &up{index})
    {{
        {InvokePapi("update_boxed_value")}(env, _sv{index}, {val});
    }}
            ";
                    }
                    else if (IsNullableStruct(elementSignature))
                    {
                        return $@"if (p{index} == &up{index})
    {{
        if (!p{index}->hasValue) {InvokePapi("update_boxed_value")}(env, _sv{index}, {InvokePapi("create_null")}(env));
        if (p{index} == &up{index}) {InvokePapi("update_boxed_value")}(env, _sv{index}, {val});
    }}
            ";
                    }
                    else
                    {
                        return $"{InvokePapi("update_boxed_value")}(env, _sv{index}, {val});";
                    }
                }
            }
            return "";
        }

        #endregion

        #region File Generation: WrapperDef

        // Common C++ includes shared across generated files
        private static readonly string CommonIncludes = string.Join("\n", new[] {
            "#include \"il2cpp-api.h\"",
            "#include \"il2cpp-class-internals.h\"",
            "#include \"il2cpp-object-internals.h\"",
            "#include \"vm/InternalCalls.h\"",
            "#include \"vm/Object.h\"",
            "#include \"vm/Array.h\"",
            "#include \"vm/Runtime.h\"",
            "#include \"vm/Reflection.h\"",
            "#include \"vm/MetadataCache.h\"",
            "#include \"vm/Field.h\"",
            "#include \"vm/GenericClass.h\"",
            "#include \"vm/Thread.h\"",
            "#include \"vm/Method.h\"",
            "#include \"vm/Parameter.h\"",
            "#include \"vm/Image.h\"",
            "#include \"utils/StringUtils.h\"",
            "#include \"gc/WriteBarrier.h\"",
            "#include \"pesapi.h\"",
            "#include \"TDataTrans.h\"",
            "#include \"PuertsValueType.h\""
        });

        public static string GenWrapperDefFile(List<SignatureInfo> wrapperInfos)
        {
            var wrapperFuncs = string.Join("\n", wrapperInfos.Select(info => GenSingleWrapperFunc(info)));

            var emscriptenBlock = "#if defined(__EMSCRIPTEN__)\n#include \"pesapi_webgl.h\"\nusing namespace pesapi::webglimpl;\n#endif";

            return $@"// Auto Gen

{CommonIncludes}
{emscriptenBlock}

namespace puerts
{{
{wrapperFuncs}

}}
";
        }

        private static string GenSingleWrapperFunc(SignatureInfo wrapperInfo)
        {
            var ps = wrapperInfo.ParameterSignatures ?? new List<string>();
            string sig = wrapperInfo.Signature;
            string retSig = wrapperInfo.ReturnSignature;
            string retType = SToCPPType(retSig);

            // Type info declarations
            var typeInfoDecls = DeclareTypeInfo(retSig, ps);
            string typeInfoBlock = !string.IsNullOrEmpty(typeInfoDecls) ? $"    {typeInfoDecls}\n" : "";

            // Get args
            string getArgs = string.Join("\n", ps.Select((_, i) =>
                $"    pesapi_value _sv{i} = {InvokePapi("get_arg")}(info, {i});"));

            // CheckJSArgument block
            bool hasOptionalArgs = ps.Any(s => s[0] == 'D');
            string checkCondition = hasOptionalArgs ? "true" : "checkJSArgument";
            var checkLines = new List<string>();
            checkLines.Add($"    if ({checkCondition}) {{");
            checkLines.Add($"        if ({GenArgsLenCheck(ps)}) return false;");
            foreach (var (x, i) in ps.Select((x, i) => (x, i)))
            {
                string check = CheckJSArg(x, i);
                if (!string.IsNullOrEmpty(check))
                    checkLines.Add($"        {check}");
            }
            checkLines.Add("    }");
            string checkBlock = string.Join("\n", checkLines);

            // JSValToCSVal for each parameter
            string paramConversions = string.Join("\n", ps.Select((p, i) => JSValToCSVal(p, $"_sv{i}", $"p{i}")));

            // Build the typedef
            var funcParamTypes = new List<string>();
            if (NeedThis(wrapperInfo.ThisSignature)) funcParamTypes.Add("void*");
            for (int i = 0; i < ps.Count; i++)
                funcParamTypes.Add($"{SToCPPType(ps[i])} p{i}");
            funcParamTypes.Add("const void* method");
            string typedefLine = $"    typedef {retType} (*FuncToCall)({string.Join(", ", funcParamTypes)});";

            // Call the function
            string selfArg = NeedThis(wrapperInfo.ThisSignature) ? "self, " : " ";
            string paramArgs = string.Join("", ps.Select((_, i) => $"p{i}, "));
            string callExpr = $"((FuncToCall)methodPointer)({selfArg}{paramArgs} method)";
            string callLine = retSig != "v"
                ? $"    {retType} ret = {callExpr};"
                : $"    {callExpr};";

            // RefSetback
            var setbackLines = new List<string>();
            for (int i = 0; i < ps.Count; i++)
            {
                string setback = RefSetback(ps[i], i);
                if (!string.IsNullOrEmpty(setback))
                    setbackLines.Add($"    {setback}");
            }
            string setbackBlock = setbackLines.Count > 0 ? string.Join("\n", setbackLines) + "\n" : "";

            // Return
            string returnLine = retSig != "v" ? $"    {ReturnToJS(retSig)}\n" : "";

            return $@"// {wrapperInfo.CsName}
bool w_{sig}(struct pesapi_ffi* apis, MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, pesapi_env env, void* self, bool checkJSArgument, WrapData* wrapData) {{
    // PLog(""Running w_{sig}"");
    
{typeInfoBlock}
    int js_args_len = {InvokePapi("get_args_len")}(info);
    
{getArgs}

{checkBlock}
    
{paramConversions}

{typedefLine}
{callLine}

{setbackBlock}    
{returnLine}    return true;
}}
";
        }

        #endregion

        #region File Generation: Wrapper (declarations + lookup table)

        public static string GenWrapperFile(List<SignatureInfo> allWrapperInfos)
        {
            string forwardDecls = string.Join("\n", allWrapperInfos.Select(info =>
                $"bool w_{info.Signature}(struct pesapi_ffi* apis, MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, pesapi_env env, void* self, bool checkJSArgument, WrapData* wrapData);"));

            string tableEntries = string.Join("\n", allWrapperInfos.Select(info =>
                $"    {{\"{info.Signature}\", w_{info.Signature}}},"));

            var wrapperIncludes = string.Join("\n", new[] {
                "#include <memory>",
                "#include \"il2cpp-api.h\"",
                "#include \"il2cpp-class-internals.h\"",
                "#include \"il2cpp-object-internals.h\"",
                "#include \"vm/Object.h\"",
                "#include \"pesapi.h\"",
                "#include \"TDataTrans.h\""
            });

            return $@"// Auto Gen

{wrapperIncludes}

namespace puerts
{{

{forwardDecls}

static WrapFuncInfo g_wrapFuncInfos[] = {{
{tableEntries}
    {{nullptr, nullptr}}
}};

WrapFuncPtr FindWrapFunc(const char* signature)
{{
    auto begin = &g_wrapFuncInfos[0];
    auto end = &g_wrapFuncInfos[sizeof(g_wrapFuncInfos) / sizeof(WrapFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const WrapFuncInfo& x, const char* signature) {{return strcmp(x.Signature, signature) < 0;}});
    if (first != end && strcmp(first->Signature, signature) == 0) {{
        return first->Method;
    }}
    return nullptr;
}}

}}
";
        }

        #endregion

        #region File Generation: Bridge

        public static string GenBridgeFile(List<SignatureInfo> bridgeInfos)
        {
            var bridgeFuncs = string.Join("\n", bridgeInfos.Select(info => GenSingleBridge(info)));

            string tableEntries = string.Join("\n", bridgeInfos.Select(info =>
                $"    {{\"{info.Signature}\", (Il2CppMethodPointer)b_{info.Signature}, b_{info.Signature}_Invoker}},"));

            return $@"// Auto Gen

{CommonIncludes}

namespace puerts
{{
{bridgeFuncs}

static BridgeFuncInfo g_bridgeFuncInfos[] = {{
{tableEntries}
    {{nullptr, nullptr, nullptr}}
}};

BridgeFuncInfo* FindBridgeFunc(const char* signature)
{{
    auto begin = &g_bridgeFuncInfos[0];
    auto end = &g_bridgeFuncInfos[sizeof(g_bridgeFuncInfos) / sizeof(BridgeFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const BridgeFuncInfo& x, const char* signature) {{return strcmp(x.Signature, signature) < 0;}});
    if (first != end && strcmp(first->Signature, signature) == 0) {{
        return first;
    }}
    return nullptr;
}}

}}
";
        }

        private static string GenSingleBridge(SignatureInfo bridgeInfo)
        {
            var ps = bridgeInfo.ParameterSignatures ?? new List<string>();
            string sig = bridgeInfo.Signature;
            string retSig = bridgeInfo.ReturnSignature;
            bool hasVarArgs = ps.Count > 0 && ps[ps.Count - 1][0] == 'V';

            // Build function signature params
            var funcParams = new List<string> { "void* target" };
            for (int i = 0; i < ps.Count; i++)
                funcParams.Add($"{SToCPPType(ps[i])} p{i}");
            funcParams.Add("MethodInfo* method");
            string funcParamsStr = string.Join(", ", funcParams);

            // TypeInfo declarations
            string retTypeInfo = !string.IsNullOrEmpty(retSig) && !IsPrimitive(GetSignatureWithoutRefAndPrefix(retSig))
                ? "    auto TIret = GetReturnType(method);\n" : "";
            var paramTypeInfoLines = new List<string>();
            for (int i = 0; i < ps.Count; i++)
            {
                if (!IsPrimitive(GetSignatureWithoutRefAndPrefix(ps[i])))
                    paramTypeInfoLines.Add($"    auto TIp{i} = GetParameterType(method, {i});");
            }
            string paramTypeInfo = paramTypeInfoLines.Count > 0 ? string.Join("\n", paramTypeInfoLines) + "\n" : "";

            // Return handling in error/null env blocks
            string returnEmptyOnError = retSig != "v" ? "\n        return {};" : "";
            string catchBlock = retSig == "v"
                ? "    }"
                : $@"        return {{}};
    }}
    {ReturnToCS(retSig)}";

            // Invoker return assignment
            string invokerRetAssign = retSig != "v"
                ? $"    *(({SToCPPType(retSig)} *)il2ppRetVal) =\n    "
                : "    ";

            // Invoker args
            string invokerArgs = string.Join("", ps.Select((s, i) => $"{FromAny(s)}args[{i}], "));

            // Bridge args count expression
            string argsCount = ps.Count + (hasVarArgs ? " + arrayLength - 1" : "").ToString();

            return $@"
// {bridgeInfo.CsName}
static {SToCPPType(retSig)} b_{sig}({funcParamsStr}) {{
    // PLog(""Running b_{sig}"");

{retTypeInfo}{paramTypeInfo}
    PObjectRefInfo* delegateInfo = GetPObjectRefInfo(target);
    struct pesapi_ffi* apis = delegateInfo->Apis;
    
    pesapi_env_ref envRef = {InvokePapi("get_ref_associated_env")}(delegateInfo->ValueRef);
    AutoValueScope valueScope(apis, envRef);
    auto env = {InvokePapi("get_env_from_ref")}(envRef);
    if (!env)
    {{
        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException(""JsEnv had been destroy""));{returnEmptyOnError}
    }}
    auto func = {InvokePapi("get_value_from_ref")}(env, delegateInfo->ValueRef);
    
    {GenBridgeArgs(ps)}
    auto jsret = {InvokePapi("call_function")}(env, func, nullptr, {argsCount}, argv);
    
    if ({InvokePapi("has_caught")}(valueScope.scope()))
    {{
        auto msg = {InvokePapi("get_exception_as_string")}(valueScope.scope(), true);
        il2cpp::vm::Exception::Raise(il2cpp::vm::Exception::GetInvalidOperationException(msg));
{catchBlock}
}}

static void b_{sig}_Invoker(Il2CppMethodPointer func, const MethodInfo* method, void* thisPtr, void** args, void* il2ppRetVal)
{{
{invokerRetAssign}b_{sig}(thisPtr, {invokerArgs}(MethodInfo*)method);
}}
";
        }

        private static string GenBridgeArgs(List<string> parameterSignatures)
        {
            if (parameterSignatures.Count == 0)
                return "pesapi_value *argv = nullptr;";

            if (parameterSignatures[parameterSignatures.Count - 1][0] != 'V')
            {
                // Fixed number of args
                var argValues = new List<string>();
                for (int i = 0; i < parameterSignatures.Count; i++)
                {
                    string sig = parameterSignatures[i];
                    if (sig[0] == 'D') sig = sig.Substring(1);
                    string val = CSValToJSVal(sig, $"p{i}");
                    if (val.StartsWith("//"))
                        val = $"{InvokePapi("create_undefined")}(env)";
                    argValues.Add(val);
                }
                string argList = string.Join(",\n        ", argValues);
                return $@"pesapi_value argv[{parameterSignatures.Count}]{{
        {argList}
    }};";
            }
            else
            {
                // Variable args (params)
                string lastSig = parameterSignatures[parameterSignatures.Count - 1];
                string si = lastSig.Substring(1);
                string unpackMethod;
                if (IsPrimitive(si))
                    unpackMethod = $"Params<{PrimitiveSignatureCppTypeMap[si]}>::UnPackPrimitive";
                else if (IsStructOrNullableStruct(si))
                    unpackMethod = $"Params<{si}>::UnPackValueType";
                else
                    unpackMethod = "Params<Il2CppObject*>::UnPackRefOrBoxedValueType";

                int fixedCount = parameterSignatures.Count - 1;
                int lastIdx = parameterSignatures.Count - 1;

                var fixedArgLines = new List<string>();
                for (int i = 0; i < fixedCount; i++)
                {
                    string val = CSValToJSVal(parameterSignatures[i], $"p{i}");
                    if (val.StartsWith("//"))
                        val = $"{InvokePapi("create_undefined")}(env)";
                    fixedArgLines.Add($"    argv[{i}] = {val};");
                }
                string fixedArgBlock = fixedArgLines.Count > 0 ? string.Join("\n", fixedArgLines) + "\n" : "";

                return $@"auto arrayLength = il2cpp::vm::Array::GetLength(p{lastIdx});
    pesapi_value *argv = (pesapi_value *)alloca(sizeof(pesapi_value) * ({fixedCount} + arrayLength));
    memset(argv, 0, sizeof(pesapi_value) * ({fixedCount} + arrayLength));
{fixedArgBlock}    {unpackMethod}(apis, env, p{lastIdx}, arrayLength, TIp{lastIdx}, argv + {fixedCount});";
            }
        }

        #endregion

        #region File Generation: FieldWrapper

        public static string GenFieldWrapperFile(List<SignatureInfo> fieldWrapperInfos)
        {
            var fieldWrapperFuncs = string.Join("\n", fieldWrapperInfos.Select(info => GenSingleFieldWrapper(info)));

            string tableEntries = string.Join("\n", fieldWrapperInfos.Select(info =>
                $"    {{\"{info.Signature}\", ifg_{info.Signature}, ifs_{info.Signature}}},"));

            return $@"// Auto Gen

{CommonIncludes}


namespace puerts
{{
{fieldWrapperFuncs}

static FieldWrapFuncInfo g_fieldWrapFuncInfos[] = {{
{tableEntries}
    {{nullptr, nullptr, nullptr}}    
}};

FieldWrapFuncInfo * FindFieldWrapFuncInfo(const char* signature)
{{
    auto begin = &g_fieldWrapFuncInfos[0];
    auto end = &g_fieldWrapFuncInfos[sizeof(g_fieldWrapFuncInfos) / sizeof(FieldWrapFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const FieldWrapFuncInfo& x, const char* signature) {{return strcmp(x.Signature, signature) < 0;}});
    if (first != end && strcmp(first->Signature, signature) == 0) {{
        return first;
    }}
    return nullptr;
}}

}}
";
        }

        private static string GenSingleFieldWrapper(SignatureInfo fieldWrapperInfo)
        {
            bool needThis = NeedThis(fieldWrapperInfo.ThisSignature);
            string sig = fieldWrapperInfo.ReturnSignature;
            string fullSig = fieldWrapperInfo.Signature;

            string thisBlock = needThis ? $@"

    {GetThis(fieldWrapperInfo.ThisSignature)}

" : "";

            bool passByValue = (fullSig == "o" || fullSig == "s" || fullSig == "p" || fullSig == "a");

            return $@"
static void ifg_{fullSig}(struct pesapi_ffi* apis, pesapi_callback_info info, FieldInfo* fieldInfo, size_t offset, Il2CppClass* TIret) {{
    // PLog(""Running ifg_{fullSig}"");

    pesapi_env env = {InvokePapi("get_env")}(info);
{thisBlock}
    {GenGetField(fieldWrapperInfo)}
}}

static void ifs_{fullSig}(struct pesapi_ffi* apis, pesapi_callback_info info, FieldInfo* fieldInfo, size_t offset, Il2CppClass* TIp) {{
    // PLog(""Running ifs_{fullSig}"");
    
    pesapi_env env = {InvokePapi("get_env")}(info);
{thisBlock}
    // {sig}
{JSValToCSVal(sig, InvokePapi("get_arg") + "(info, 0)", "p")}
    SetFieldValue({(needThis ? "self, " : "nullptr, ")}fieldInfo, offset, {(passByValue ? "p" : "&p")});
}}
";
        }

        private static string GenGetField(SignatureInfo fieldWrapperInfo)
        {
            string sig = fieldWrapperInfo.ReturnSignature;
            bool needThis = NeedThis(fieldWrapperInfo.ThisSignature);

            if (IsStructOrNullableStruct(sig))
            {
                string src = needThis
                    ? $"auto _src = ({sig}*)((char*)self + offset);"
                    : $"auto _src = ({sig}*)GetValueTypeFieldPtr(nullptr, fieldInfo, offset);";

                if (IsNullableStruct(sig))
                {
                    return $@"{src}

	{InvokePapi("add_return")}(info, NullableConverter<{sig}>::toScript(apis, env, TIret, _src));";
                }
                else
                {
                    return $@"{src}

	{InvokePapi("add_return")}(info, DataTransfer::CopyValueType<{sig}>(apis, env, *_src, TIret));";
                }
            }
            else
            {
                string selfArg = needThis ? "self, " : "nullptr, ";
                return $@"{SToCPPType(sig)} ret;

    GetFieldValue({selfArg}fieldInfo, offset, &ret);
    
    {ReturnToJS(sig)}";
            }
        }

        #endregion

        #region File Generation: ValueType Header

        public static string GenValueTypeFile(List<ValueTypeInfo> valueTypeInfos)
        {
            var structDefs = new List<string>();
            foreach (var vt in valueTypeInfos)
            {
                if (string.IsNullOrEmpty(vt.Signature)) continue;

                string fields;
                if (vt.FieldSignatures == null || vt.FieldSignatures.Count == 0)
                {
                    fields = @"    union
    {
        struct
        {
        };
        uint8_t __padding[1];
    };";
                }
                else
                {
                    var fieldLines = new List<string>();
                    for (int i = 0; i < vt.FieldSignatures.Count; i++)
                    {
                        string fieldType = SToCPPType(vt.FieldSignatures[i]);
                        if (IsNullableStruct(vt.Signature) && i == vt.NullableHasValuePosition)
                            fieldLines.Add($"    {fieldType} hasValue;");
                        else
                            fieldLines.Add($"    {fieldType} p{i};");
                    }
                    fields = string.Join("\n", fieldLines);
                }

                structDefs.Add($@"// {vt.CsName}
struct {vt.Signature}
{{
{fields}
}};
    ");
            }

            string allStructs = string.Join("\n", structDefs);

            var valueTypeHeader = string.Join("\n", new[] {
                "#if !__SNC__",
                "#ifndef __has_feature ",
                "#define __has_feature(x) 0 ",
                "#endif",
                "#endif",
                "",
                "#if _MSC_VER",
                "typedef wchar_t Il2CppChar;",
                "#elif __has_feature(cxx_unicode_literals)",
                "typedef char16_t Il2CppChar;",
                "#else",
                "typedef uint16_t Il2CppChar;",
                "#endif"
            });

            return $@"// Auto Gen

{valueTypeHeader}

namespace puerts
{{

{allStructs}
}}
";
        }

        #endregion

        #region File Generation: Macro Header

        public static string GenMacroHeader(List<string> defines)
        {
            return string.Join("\n", defines.Select(d =>
                $"#ifndef {d}\n    #define {d}\n#endif")) + "\n";
        }

        #endregion

        #region File Generation: Extension Methods

        public static string GenExtensionMethodInfos(List<KeyValuePair<Type, List<Type>>> extendedType2extensionType)
        {
            var caseClauses = new List<string>();
            foreach (var pair in extendedType2extensionType)
            {
                string extendedTypeName = Puerts.TypeExtensions.GetFriendlyName(pair.Key);
                var extensionTypeNames = pair.Value.Select(t => $"typeof({Puerts.TypeExtensions.GetFriendlyName(t)})").ToList();
                caseClauses.Add($@"        else if (typeof({extendedTypeName}).AssemblyQualifiedName == assemblyQualifiedName)
        {{
            return ExtensionMethodInfo.GetExtensionMethods(typeof({extendedTypeName}), {string.Join(", ", extensionTypeNames)});
        }}");
            }
            string cases = string.Join("\n", caseClauses);

            return $@"
using System;
using System.Collections.Generic;
using System.Reflection;
namespace Puerts
{{
public static class ExtensionMethodInfos_Gen
{{
    [UnityEngine.Scripting.Preserve]
    public static MethodInfo[] TryLoadExtensionMethod(string assemblyQualifiedName)
    {{
        if (false) {{}}
{cases}
        return null;
    }}
}}
}}";
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

            var assemblies = assemblyMap.Select(kvp =>
            {
                string types = string.Join("\n", kvp.Value.Select(t =>
                    $"        <type fullname=\"{t}\" preserve=\"all\"/>"));
                return $@"    <assembly fullname=""{kvp.Key}"">
{types}
    </assembly>";
            });

            return $"<linker>\n{string.Join("\n", assemblies)}\n</linker>";
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
