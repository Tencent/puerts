/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiQjsModuleLoader.h"
#include "QjsPapiData.h"
#include "quickjs.h"
#include <cstdio>
#include <cstring>
#include <memory>
#include <mutex>
#include <unordered_map>
#include <vector>

namespace PUERTS_NAMESPACE
{
namespace papi_qjs
{
namespace
{
enum class EKind : char
{
    Esm = 'e',
    Builtin = 'b',
    // a file other than esm imported, required by the require hook
    Synthetic = 's'
};

struct FRecord
{
    EKind Kind;
    PString Key;
    PString Url;
    // the name quickjs finds the module by
    PString Name;
    // esm: the compiled module; others: the C module created when imported by an esm
    JSModuleDef* Module = nullptr;
    // builtin: the value; synthetic: the exports, set when required
    JSValue Value = JS_UNDEFINED;
    bool HasValue = false;
    // the C module: the named exports (own properties of Value when it is created)
    std::vector<PString> ExportNames;
};

PString MakeKey(EKind Kind, const PString& Url)
{
    PString Key;
    Key += static_cast<char>(Kind);
    Key += Url;
    return Key;
}

PString ToPString(uint64_t Value)
{
    char Buf[24];
    snprintf(Buf, sizeof(Buf), "%llu", static_cast<unsigned long long>(Value));
    return PString(Buf);
}

PString DirName(const PString& Url)
{
    auto Pos = Url.find_last_of("/\\");
    return Pos == PString::npos ? PString() : Url.substr(0, Pos);
}

// joins the segments of Path ('/' or '\\' separated), removes the empty and "." segments and resolves ".."
PString Normalize(const PString& Path)
{
    PString Ret;
    size_t Start = 0;
    const size_t Size = Path.size();
    for (size_t i = 0; i <= Size; ++i)
    {
        if (i < Size && Path[i] != '/' && Path[i] != '\\')
        {
            continue;
        }
        PString Segment = Path.substr(Start, i - Start);
        Start = i + 1;
        if (Segment.empty() || Segment == ".")
        {
            continue;
        }
        if (Segment == "..")
        {
            auto Pos = Ret.find_last_of("/");
            PString Last = Pos == PString::npos ? Ret : Ret.substr(Pos + 1);
            if (!Ret.empty() && Last != "..")
            {
                Ret.resize(Pos == PString::npos ? 0 : Pos);
                continue;
            }
        }
        if (!Ret.empty())
        {
            Ret += '/';
        }
        Ret += Segment;
    }
    return Ret;
}

bool StartsWith(const PString& S, const char* Prefix)
{
    size_t Len = strlen(Prefix);
    return S.size() >= Len && memcmp(S.c_str(), Prefix, Len) == 0;
}

bool EndsWith(const PString& S, const char* Suffix)
{
    size_t Len = strlen(Suffix);
    return S.size() >= Len && memcmp(S.c_str() + S.size() - Len, Suffix, Len) == 0;
}

// a name of a builtin module (or an addon): no '.' and '/'
bool IsBareName(const PString& S)
{
    if (S.empty())
    {
        return false;
    }
    for (size_t i = 0; i < S.size(); ++i)
    {
        if (S[i] == '.' || S[i] == '/' || S[i] == '\\')
        {
            return false;
        }
    }
    return true;
}

PString ToStd(JSContext* Ctx, JSValueConst Value)
{
    size_t Len = 0;
    const char* Str = JS_ToCStringLen(Ctx, &Len, Value);
    if (!Str)
    {
        JS_FreeValue(Ctx, JS_GetException(Ctx));
        return PString();
    }
    PString Ret(Str, Len);
    JS_FreeCString(Ctx, Str);
    return Ret;
}

JSValue NewStr(JSContext* Ctx, const PString& Str)
{
    return JS_NewStringLen(Ctx, Str.c_str(), Str.size());
}

void Throw(JSContext* Ctx, const PString& Message)
{
    JS_ThrowPlainError(Ctx, "%s", Message.c_str());
}

JSValue Noop(JSContext* Ctx, JSValueConst ThisVal, int Argc, JSValueConst* Argv)
{
    return JS_UNDEFINED;
}

void RunPendingJobs(JSContext* Ctx)
{
    JSRuntime* Rt = JS_GetRuntime(Ctx);
    for (;;)
    {
        JSContext* JobCtx = nullptr;
        int Ret = JS_ExecutePendingJob(Rt, &JobCtx);
        if (Ret == 0)
        {
            break;
        }
        if (Ret < 0 && JobCtx)
        {
            JS_FreeValue(JobCtx, JS_GetException(JobCtx));
        }
    }
}

// takes the ownership of Value, the result lives in the current scope
pesapi_value ToPesapi(JSContext* Ctx, JSValue Value)
{
    auto Scope = qjsimpl::getCurrentScope(Ctx);
    if (!Scope)
    {
        JS_FreeValue(Ctx, Value);
        return nullptr;
    }
    JSValue* Ret = Scope->allocValue();
    *Ret = Value;
    return reinterpret_cast<pesapi_value>(Ret);
}

inline JSValueConst ToQjs(pesapi_value Value)
{
    return Value ? *reinterpret_cast<JSValue*>(Value) : JS_UNDEFINED;
}

const char* const DestroyedMessage = "[Puer001] the module loader is destroyed";

// JSModuleStatus of quickjs.c (returned by JS_GetModuleStatus)
const int ModuleStatusEvaluating = 3;
const int ModuleStatusEvaluated = 5;
}    // namespace

class FModuleLoader;

static std::mutex GLoadersMutex;
static std::unordered_map<JSContext*, FModuleLoader*> GLoaders;

static FModuleLoader* FindLoader(JSContext* Ctx)
{
    std::lock_guard<std::mutex> Lock(GLoadersMutex);
    auto Iter = GLoaders.find(Ctx);
    return Iter == GLoaders.end() ? nullptr : Iter->second;
}

class FModuleLoader
{
public:
    FModuleLoader(JSContext* InCtx, FLoadFileFunc InLoadFile, FLoadAddonFunc InLoadAddon)
        : Ctx(InCtx), LoadFile(std::move(InLoadFile)), LoadAddon(std::move(InLoadAddon))
    {
    }

    ~FModuleLoader()
    {
        for (auto& Pair : Records)
        {
            JS_FreeValue(Ctx, Pair.second->Value);
        }
        Records.clear();
        JS_FreeValue(Ctx, RequireHook);
        JS_FreeValue(Ctx, ResolveHook);
    }

    JSContext* const Ctx;
    FLoadFileFunc LoadFile;
    FLoadAddonFunc LoadAddon;
    // see SetHooks
    JSValue RequireHook = JS_UNDEFINED;
    JSValue ResolveHook = JS_UNDEFINED;

    // the records added in a load are rolled back when it fails, so a later load of the same module can retry
    struct FLoadScope
    {
        explicit FLoadScope(FModuleLoader* InLoader) : Loader(InLoader), Start(InLoader->AddedKeys.size())
        {
            ++Loader->LoadDepth;
        }

        ~FLoadScope()
        {
            if (!Ok)
            {
                Loader->Rollback(Start);
            }
            if (--Loader->LoadDepth == 0)
            {
                Loader->AddedKeys.clear();
            }
        }

        FModuleLoader* Loader;
        size_t Start;
        bool Ok = false;
    };

    FRecord* FindRecord(const PString& Key)
    {
        auto Iter = Records.find(Key);
        return Iter == Records.end() ? nullptr : Iter->second.get();
    }

    FRecord* FindRecord(EKind Kind, const PString& Url)
    {
        return FindRecord(MakeKey(Kind, Url));
    }

    FRecord* AddRecord(EKind Kind, const PString& Url, const PString& DebugPath)
    {
        auto Record = std::unique_ptr<FRecord>(new FRecord());
        Record->Kind = Kind;
        Record->Key = MakeKey(Kind, Url);
        Record->Url = Url;
        if (Kind == EKind::Esm)
        {
            Record->Name = DebugPath.empty() ? Url : DebugPath;
            ScriptToUrl[Record->Name] = Url;
        }
        else
        {
            Record->Name = "<" + MakeKey(Kind, "#") + ToPString(++Gen) + ">" + Url;
        }
        NameToKey[Record->Name] = Record->Key;
        if (LoadDepth > 0 && Kind == EKind::Esm)
        {
            AddedKeys.push_back(Record->Key);
        }
        auto Ret = Record.get();
        Records[Record->Key] = std::move(Record);
        return Ret;
    }

    void UnbindModule(FRecord* Record)
    {
        if (!Record->Module)
        {
            return;
        }
        auto ModuleIter = ModuleToKey.find(Record->Module);
        if (ModuleIter != ModuleToKey.end() && ModuleIter->second == Record->Key)
        {
            ModuleToKey.erase(ModuleIter);
        }
        Record->Module = nullptr;
    }

    bool EraseRecord(const PString& Key)
    {
        auto Iter = Records.find(Key);
        if (Iter == Records.end())
        {
            return false;
        }
        FRecord* Record = Iter->second.get();
        // a module may be freed by quickjs (JS_ResolveModule frees the modules which are not resolved on failure)
        if (Record->Kind == EKind::Esm && Record->Module && JS_IsLoadedModule(Ctx, Record->Module))
        {
            JS_RenameModule(Ctx, Record->Module, ("<discarded#" + ToPString(++Gen) + ">" + Record->Name).c_str());
        }
        UnbindModule(Record);
        auto NameIter = NameToKey.find(Record->Name);
        if (NameIter != NameToKey.end() && NameIter->second == Key)
        {
            NameToKey.erase(NameIter);
        }
        JS_FreeValue(Ctx, Record->Value);
        Records.erase(Iter);
        return true;
    }

    void Rollback(size_t Start)
    {
        for (size_t I = AddedKeys.size(); I > Start; --I)
        {
            const PString Key = AddedKeys[I - 1];
            FRecord* Record = FindRecord(Key);
            // an esm which is not evaluated, or whose evaluation threw (quickjs keeps it as evaluated with the exception,
            // v8 drops an errored module), is discarded so a retry loads it again
            if (Record && (!Record->Module || !JS_IsLoadedModule(Ctx, Record->Module) ||
                              JS_GetModuleStatus(Record->Module) != ModuleStatusEvaluated || JS_ModuleHasException(Record->Module)))
            {
                EraseRecord(Key);
            }
        }
        AddedKeys.resize(Start);
        // the C modules freed by quickjs (not resolved) are created again when imported next time
        for (auto& Pair : Records)
        {
            FRecord* Record = Pair.second.get();
            if (Record->Kind != EKind::Esm && Record->Module && !JS_IsLoadedModule(Ctx, Record->Module))
            {
                UnbindModule(Record);
            }
        }
    }

    // the builtin module of the name, an addon is loaded on its first use
    FRecord* FindBuiltin(const PString& Name)
    {
        FRecord* Record = FindRecord(EKind::Builtin, Name);
        if (!Record && LoadAddon && IsBareName(Name))
        {
            bool Loaded;
            {
                qjsimpl::pesapi_scope__ Scope(Ctx);
                Loaded = LoadAddon(reinterpret_cast<pesapi_env>(Ctx), Name.c_str());
            }
            if (Loaded)
            {
                Record = FindRecord(EKind::Builtin, Name);
            }
        }
        return Record;
    }

    // the path of the specifier by the resolve hook (called with the directory of the referrer) or the default rules, false
    // with an exception thrown
    bool ResolvePath(const PString& Specifier, const PString& Referrer, PString& OutPath)
    {
        if (JS_IsFunction(Ctx, ResolveHook))
        {
            JSValue Args[] = {NewStr(Ctx, Specifier), NewStr(Ctx, DirName(Referrer))};
            JSValue Path = JS_Call(Ctx, ResolveHook, JS_UNDEFINED, 2, Args);
            JS_FreeValue(Ctx, Args[0]);
            JS_FreeValue(Ctx, Args[1]);
            if (JS_IsException(Path))
            {
                return false;
            }
            const bool IsString = JS_IsString(Path) != 0;
            if (IsString)
            {
                OutPath = ToStd(Ctx, Path);
            }
            JS_FreeValue(Ctx, Path);
            if (IsString)
            {
                return true;
            }
        }
        if (StartsWith(Specifier, "./") || StartsWith(Specifier, "../"))
        {
            PString Dir = DirName(Referrer);
            OutPath = Normalize(Dir.empty() ? Specifier : Dir + "/" + Specifier);
        }
        else
        {
            OutPath = Normalize(Specifier);
        }
        return true;
    }

    // import.meta.resolve: the path of the specifier imported by Referrer (the name of a builtin module), without loading it
    bool ResolveUrl(const PString& Specifier, const PString& Referrer, PString& OutUrl)
    {
        if (FindRecord(EKind::Builtin, Specifier))
        {
            OutUrl = Specifier;
            return true;
        }
        return ResolvePath(Specifier, Referrer, OutUrl);
    }

    // resolves and loads (compiles for esm, without evaluating) the module, returns nullptr with an exception thrown
    FRecord* Resolve(const PString& Specifier, const PString& Referrer)
    {
        if (FRecord* Builtin = FindBuiltin(Specifier))
        {
            return Builtin;
        }

        PString Path;
        if (!ResolvePath(Specifier, Referrer, Path))
        {
            return nullptr;
        }

        if (!EndsWith(Path, ".mjs") && !EndsWith(Path, ".mbc"))
        {
            // required by the require hook when imported (ModuleForImport)
            if (FRecord* Record = FindRecord(EKind::Synthetic, Path))
            {
                return Record;
            }
            return AddRecord(EKind::Synthetic, Path, "");
        }

        if (FRecord* Record = FindRecord(EKind::Esm, Path))
        {
            return Record;
        }
        PString DebugPath;
        JSValue Content = JS_UNDEFINED;
        bool Found = false;
        if (LoadFile)
        {
            qjsimpl::pesapi_scope__ Scope(Ctx);
            pesapi_value Value = LoadFile(reinterpret_cast<pesapi_env>(Ctx), Path.c_str(), DebugPath);
            if (Value)
            {
                Content = JS_DupValue(Ctx, ToQjs(Value));
                Found = true;
            }
        }
        if (!Found)
        {
            if (!JS_HasException(Ctx))
            {
                Throw(Ctx, Referrer.empty() ? "[Puer002] can not find module " + Path
                                            : "[Puer002] can not find module " + Path + " imported by " + Referrer);
            }
            return nullptr;
        }
        if (!JS_IsString(Content))
        {
            const bool IsBytecode = JS_IsArrayBuffer(Content) != 0;
            JS_FreeValue(Ctx, Content);
            Throw(Ctx, IsBytecode ? "[Puer003] load " + Path + " failed: bytecode is not supported"
                                  : "[Puer003] load " + Path + " failed: content must be a string");
            return nullptr;
        }
        PString Source = ToStd(Ctx, Content);
        JS_FreeValue(Ctx, Content);
        return FetchEsm(Path, DebugPath, Source);
    }

    FRecord* FetchEsm(const PString& Url, const PString& DebugPath, const PString& Source)
    {
        // quickjs resolves the imports through the normalize / loader hooks, so the record is added first: the hooks find the
        // referrer url by the module name, and a cycle back to this module finds the record (quickjs finds the module by name)
        FRecord* Record = AddRecord(EKind::Esm, Url, DebugPath);
        const PString Name = Record->Name;
        JSValue Compiled =
            JS_Eval(Ctx, Source.c_str(), Source.size(), Name.c_str(), JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
        if (JS_IsException(Compiled))
        {
            return nullptr;
        }
        auto Module = reinterpret_cast<JSModuleDef*>(JS_VALUE_GET_PTR(Compiled));
        // the module is owned by the context, only the extra reference returned is released
        JS_FreeValue(Ctx, Compiled);

        Record->Module = Module;
        ModuleToKey[Module] = Record->Key;

        JSValue Meta = JS_GetImportMeta(Ctx, Module);
        if (JS_IsException(Meta))
        {
            return nullptr;
        }
        JS_SetPropertyStr(Ctx, Meta, "url", NewStr(Ctx, Url));
        JSValue Data = NewStr(Ctx, Url);
        JS_SetPropertyStr(Ctx, Meta, "resolve", JS_NewCFunctionData(Ctx, &MetaResolveCallback, 1, 0, 1, &Data));
        JS_FreeValue(Ctx, Data);
        JS_FreeValue(Ctx, Meta);

        // loads the requested modules through the normalize / loader hooks
        if (JS_ResolveModule(Ctx, JS_MKPTR(JS_TAG_MODULE, Module)) < 0)
        {
            return nullptr;
        }
        return Record;
    }

    // the namespace of the evaluated esm
    JSValue EvaluateEsm(FRecord* Record)
    {
        JSModuleDef* Module = Record->Module;
        if (JS_GetModuleStatus(Module) == ModuleStatusEvaluating)
        {
            // imported synchronously by a module it imports (a cycle), the bindings not evaluated yet are in TDZ
            return JS_GetModuleNamespace(Ctx, Module);
        }
        PString Url = Record->Url;
        JSValue Ret = JS_EvalFunction(Ctx, JS_DupModule(Ctx, Module));
        if (JS_IsException(Ret))
        {
            return JS_EXCEPTION;
        }
        int State = static_cast<int>(JS_PromiseState(Ctx, Ret));
        if (State == JS_PROMISE_PENDING)
        {
            RunPendingJobs(Ctx);
            State = static_cast<int>(JS_PromiseState(Ctx, Ret));
        }
        if (State == JS_PROMISE_PENDING)
        {
            JS_FreeValue(Ctx, Ret);
            Throw(Ctx, "[Puer004] top-level await of " + Url + " can not be settled synchronously");
            return JS_EXCEPTION;
        }
        if (State == JS_PROMISE_REJECTED)
        {
            // handled, the error is thrown to the caller
            JSValue Catch = JS_GetPropertyStr(Ctx, Ret, "catch");
            JSValue Handler = JS_NewCFunction(Ctx, &Noop, "", 1);
            JSValue Chained = JS_Call(Ctx, Catch, Ret, 1, &Handler);
            if (JS_IsException(Chained))
            {
                JS_FreeValue(Ctx, JS_GetException(Ctx));
            }
            JS_FreeValue(Ctx, Chained);
            JS_FreeValue(Ctx, Handler);
            JS_FreeValue(Ctx, Catch);
            JSValue Reason = JS_PromiseResult(Ctx, Ret);
            JS_FreeValue(Ctx, Ret);
            return JS_Throw(Ctx, Reason);
        }
        JS_FreeValue(Ctx, Ret);
        return JS_GetModuleNamespace(Ctx, Module);
    }

    // the exports of the file required by the require hook, the record is removed on failure
    bool RequireSynthetic(FRecord* Record)
    {
        if (Record->HasValue)
        {
            return true;
        }
        PString Key = Record->Key;
        PString Url = Record->Url;
        if (!JS_IsFunction(Ctx, RequireHook))
        {
            EraseRecord(Key);
            Throw(Ctx, "[Puer001] can not import " + Url + ": the require hook is not set");
            return false;
        }
        JSValue Arg = NewStr(Ctx, Url);
        JSValue Exports = JS_Call(Ctx, RequireHook, JS_UNDEFINED, 1, &Arg);
        JS_FreeValue(Ctx, Arg);
        if (JS_IsException(Exports))
        {
            EraseRecord(Key);
            return false;
        }
        // the record may be released by the module required (a builtin module registered again is the only case)
        auto Iter = Records.find(Key);
        if (Iter == Records.end() || Iter->second.get() != Record)
        {
            JS_FreeValue(Ctx, Exports);
            Throw(Ctx, "[Puer005] module record not found: " + Url);
            return false;
        }
        if (Record->HasValue)
        {
            JS_FreeValue(Ctx, Exports);
        }
        else
        {
            Record->Value = Exports;
            Record->HasValue = true;
        }
        return true;
    }

    // synchronous import: the namespace of an esm, the value of the others
    JSValue ImportSync(const PString& Specifier, const PString& Referrer)
    {
        FLoadScope Scope(this);
        FRecord* Record = Resolve(Specifier, Referrer);
        if (!Record)
        {
            return JS_EXCEPTION;
        }
        JSValue Ret;
        if (Record->Kind == EKind::Esm)
        {
            Ret = EvaluateEsm(Record);
        }
        else if (Record->Kind == EKind::Synthetic && !RequireSynthetic(Record))
        {
            Ret = JS_EXCEPTION;
        }
        else
        {
            Ret = JS_DupValue(Ctx, Record->Value);
        }
        Scope.Ok = !JS_IsException(Ret);
        return Ret;
    }

    JSValue CompileCjs(JSValueConst Content, const PString& DebugPath, const PString& Path)
    {
        if (!JS_IsString(Content))
        {
            Throw(Ctx, "[Puer003] load " + Path + " failed: bytecode is not supported");
            return JS_EXCEPTION;
        }
        // the dynamic imports in the module are relative to its path
        ScriptToUrl[DebugPath] = Path;
        PString Source = "(function (exports, require, module, __filename, __dirname) {" + ToStd(Ctx, Content) + "\n})";
        return JS_Eval(Ctx, Source.c_str(), Source.size(), DebugPath.c_str(), JS_EVAL_TYPE_GLOBAL);
    }

    // the module imported by an esm (a C module for the others: `default` is the value and its own properties are named
    // exports), nullptr with the exception thrown on failure
    JSModuleDef* ModuleForImport(FRecord* Record)
    {
        if (Record->Kind == EKind::Esm || Record->Module)
        {
            return Record->Module;
        }
        PString Key = Record->Key;
        if (Record->Kind == EKind::Synthetic && !RequireSynthetic(Record))
        {
            return nullptr;
        }
        if (Record->Module)
        {
            return Record->Module;
        }

        Record->ExportNames.clear();
        if (JS_IsObject(Record->Value))
        {
            JSPropertyEnum* Props = nullptr;
            uint32_t Len = 0;
            if (JS_GetOwnPropertyNames(Ctx, &Props, &Len, Record->Value, JS_GPN_STRING_MASK | JS_GPN_ENUM_ONLY) < 0)
            {
                return nullptr;
            }
            for (uint32_t I = 0; I < Len; ++I)
            {
                const char* Name = JS_AtomToCString(Ctx, Props[I].atom);
                if (Name)
                {
                    if (std::strcmp(Name, "default") != 0)
                    {
                        Record->ExportNames.emplace_back(Name);
                    }
                    JS_FreeCString(Ctx, Name);
                }
            }
            JS_FreePropertyEnum(Ctx, Props, Len);
        }

        JSModuleDef* Module = JS_NewCModule(Ctx, Record->Name.c_str(), &InitCModule);
        if (!Module)
        {
            return nullptr;
        }
        JS_AddModuleExport(Ctx, Module, "default");
        for (auto& Name : Record->ExportNames)
        {
            JS_AddModuleExport(Ctx, Module, Name.c_str());
        }
        Record->Module = Module;
        ModuleToKey[Module] = Key;
        return Module;
    }

    static int InitCModule(JSContext* Ctx, JSModuleDef* Module)
    {
        FModuleLoader* Loader = FindLoader(Ctx);
        FRecord* Record = nullptr;
        if (Loader)
        {
            auto Iter = Loader->ModuleToKey.find(Module);
            if (Iter != Loader->ModuleToKey.end())
            {
                Record = Loader->FindRecord(Iter->second);
            }
        }
        if (!Record)
        {
            Throw(Ctx, "[Puer005] module record not found");
            return -1;
        }
        if (JS_SetModuleExport(Ctx, Module, "default", JS_DupValue(Ctx, Record->Value)) < 0)
        {
            return -1;
        }
        for (auto& Name : Record->ExportNames)
        {
            JSValue Value = JS_GetPropertyStr(Ctx, Record->Value, Name.c_str());
            if (JS_IsException(Value) || JS_SetModuleExport(Ctx, Module, Name.c_str(), Value) < 0)
            {
                return -1;
            }
        }
        return 0;
    }

    static JSValue MetaResolveCallback(JSContext* Ctx, JSValueConst ThisVal, int Argc, JSValueConst* Argv, int Magic, JSValue* Data)
    {
        FModuleLoader* Loader = FindLoader(Ctx);
        if (!Loader)
        {
            Throw(Ctx, DestroyedMessage);
            return JS_EXCEPTION;
        }
        if (Argc < 1 || !JS_IsString(Argv[0]))
        {
            return JS_ThrowTypeError(Ctx, "the module name must be a string");
        }
        PString Url;
        if (!Loader->ResolveUrl(ToStd(Ctx, Argv[0]), ToStd(Ctx, Data[0]), Url))
        {
            return JS_EXCEPTION;
        }
        return NewStr(Ctx, Url);
    }

    // the path of the script or module named BaseName ("" if unknown: a script not loaded as a module imports relative to
    // the root)
    PString ReferrerOf(const char* BaseName)
    {
        if (!BaseName)
        {
            return PString();
        }
        auto ScriptIter = ScriptToUrl.find(BaseName);
        if (ScriptIter != ScriptToUrl.end())
        {
            return ScriptIter->second;
        }
        auto NameIter = NameToKey.find(BaseName);
        if (NameIter != NameToKey.end())
        {
            if (FRecord* Record = FindRecord(NameIter->second))
            {
                return Record->Url;
            }
        }
        return PString();
    }

    static char* NormalizeHook(JSContext* Ctx, const char* BaseName, const char* Name, void* Opaque)
    {
        auto Loader = static_cast<FModuleLoader*>(Opaque);
        if (!Loader)
        {
            Throw(Ctx, DestroyedMessage);
            return nullptr;
        }
        FLoadScope Scope(Loader);
        FRecord* Record = Loader->Resolve(Name, Loader->ReferrerOf(BaseName));
        if (!Record)
        {
            return nullptr;
        }
        Scope.Ok = true;
        return js_strdup(Ctx, Record->Name.c_str());
    }

    static JSModuleDef* LoadModuleHook(JSContext* Ctx, const char* Name, void* Opaque)
    {
        auto Loader = static_cast<FModuleLoader*>(Opaque);
        if (!Loader)
        {
            Throw(Ctx, DestroyedMessage);
            return nullptr;
        }
        auto Iter = Loader->NameToKey.find(Name);
        FRecord* Record = Iter == Loader->NameToKey.end() ? nullptr : Loader->FindRecord(Iter->second);
        if (!Record)
        {
            Throw(Ctx, PString("[Puer002] import ") + Name + " failed: module not fetched");
            return nullptr;
        }
        FLoadScope Scope(Loader);
        JSModuleDef* Module = Loader->ModuleForImport(Record);
        Scope.Ok = Module != nullptr;
        return Module;
    }

    std::unordered_map<PString, std::unique_ptr<FRecord>> Records;
    // keys of the esm records added by the running loads, the ones not evaluated are removed if the load fails
    std::vector<PString> AddedKeys;
    // module name -> record key
    std::unordered_map<PString, PString> NameToKey;
    // script name (the debug path) of an esm / cjs -> path, the referrer of an import is known by the script name
    std::unordered_map<PString, PString> ScriptToUrl;
    std::unordered_map<JSModuleDef*, PString> ModuleToKey;
    int LoadDepth = 0;
    uint64_t Gen = 0;
};

FModuleLoader* CreateModuleLoader(pesapi_env Env, FLoadFileFunc LoadFile, FLoadAddonFunc LoadAddon)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    if (FindLoader(Ctx))
    {
        return nullptr;
    }
    auto Loader = new FModuleLoader(Ctx, std::move(LoadFile), std::move(LoadAddon));
    {
        std::lock_guard<std::mutex> Lock(GLoadersMutex);
        GLoaders[Ctx] = Loader;
    }
    JS_SetModuleLoaderFunc(JS_GetRuntime(Ctx), &FModuleLoader::NormalizeHook, &FModuleLoader::LoadModuleHook, Loader);
    return Loader;
}

void DestroyModuleLoader(FModuleLoader* Loader)
{
    if (!Loader)
    {
        return;
    }
    // the hooks stay installed (an import throws "the module loader is destroyed")
    JS_SetModuleLoaderFunc(JS_GetRuntime(Loader->Ctx), &FModuleLoader::NormalizeHook, &FModuleLoader::LoadModuleHook, nullptr);
    {
        std::lock_guard<std::mutex> Lock(GLoadersMutex);
        GLoaders.erase(Loader->Ctx);
    }
    delete Loader;
}

pesapi_value ImportModule(pesapi_env Env, const char* Specifier, const char* Referrer)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    if (!Loader)
    {
        Throw(Ctx, DestroyedMessage);
        return nullptr;
    }
    JSValue Ret = Loader->ImportSync(Specifier ? Specifier : "", Referrer ? Referrer : "");
    if (JS_IsException(Ret))
    {
        return nullptr;
    }
    return ToPesapi(Ctx, Ret);
}

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    if (!Loader || !Name)
    {
        return;
    }
    Loader->EraseRecord(MakeKey(EKind::Builtin, Name));
    FRecord* Record = Loader->AddRecord(EKind::Builtin, Name, "");
    Record->Value = JS_DupValue(Ctx, ToQjs(Value));
    Record->HasValue = true;
}

pesapi_value GetBuiltinModule(pesapi_env Env, const char* Name)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    FRecord* Record = Loader && Name ? Loader->FindRecord(EKind::Builtin, Name) : nullptr;
    return Record ? ToPesapi(Ctx, JS_DupValue(Ctx, Record->Value)) : nullptr;
}

void SetHooks(pesapi_env Env, pesapi_value Require, pesapi_value Resolve)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    if (!Loader)
    {
        return;
    }
    JS_FreeValue(Ctx, Loader->RequireHook);
    JS_FreeValue(Ctx, Loader->ResolveHook);
    JSValueConst RequireValue = ToQjs(Require);
    JSValueConst ResolveValue = ToQjs(Resolve);
    Loader->RequireHook = JS_IsFunction(Ctx, RequireValue) ? JS_DupValue(Ctx, RequireValue) : JS_UNDEFINED;
    Loader->ResolveHook = JS_IsFunction(Ctx, ResolveValue) ? JS_DupValue(Ctx, ResolveValue) : JS_UNDEFINED;
}

pesapi_value CompileCjs(pesapi_env Env, pesapi_value Content, const char* DebugPath, const char* Path)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    if (!Loader)
    {
        Throw(Ctx, DestroyedMessage);
        return nullptr;
    }
    JSValue Func = Loader->CompileCjs(ToQjs(Content), DebugPath ? DebugPath : "", Path ? Path : "");
    if (JS_IsException(Func))
    {
        return nullptr;
    }
    return ToPesapi(Ctx, Func);
}
}    // namespace papi_qjs
}    // namespace PUERTS_NAMESPACE
