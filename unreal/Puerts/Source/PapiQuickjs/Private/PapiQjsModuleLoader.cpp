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
#include <cstring>
#include <memory>
#include <mutex>
#include <string>
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
    Cjs = 'c',
    Json = 'j',
    Builtin = 'b'
};

struct FRecord
{
    EKind Kind;
    std::string Key;
    std::string Url;
    std::string DebugPath;
    // the name quickjs finds the module by
    std::string Name;
    // esm: the compiled module; others: the C module created when imported by an esm
    JSModuleDef* Module = nullptr;
    // cjs: the source, released once executed
    std::string Content;
    JSValue CjsModule = JS_UNDEFINED;
    // json / builtin: the value; cjs: module.exports when the C module is created
    JSValue Value = JS_UNDEFINED;
    // the C module: the named exports (own properties of Value when it is created)
    std::vector<std::string> ExportNames;
    bool Executed = false;
};

std::string MakeKey(EKind Kind, const std::string& Url)
{
    return std::string(1, static_cast<char>(Kind)) + Url;
}

std::string DirName(const std::string& Url)
{
    auto Pos = Url.find_last_of("/\\");
    return Pos == std::string::npos ? std::string() : Url.substr(0, Pos);
}

std::string ToStd(JSContext* Ctx, JSValueConst Value)
{
    size_t Len = 0;
    const char* Str = JS_ToCStringLen(Ctx, &Len, Value);
    if (!Str)
    {
        JS_FreeValue(Ctx, JS_GetException(Ctx));
        return std::string();
    }
    std::string Ret(Str, Len);
    JS_FreeCString(Ctx, Str);
    return Ret;
}

JSValue NewStr(JSContext* Ctx, const std::string& Str)
{
    return JS_NewStringLen(Ctx, Str.c_str(), Str.size());
}

void Throw(JSContext* Ctx, const std::string& Message)
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
    explicit FModuleLoader(JSContext* InCtx) : Ctx(InCtx)
    {
    }

    ~FModuleLoader()
    {
        for (auto& Pair : Records)
        {
            JS_FreeValue(Ctx, Pair.second->CjsModule);
            JS_FreeValue(Ctx, Pair.second->Value);
        }
        Records.clear();
        JS_FreeValue(Ctx, HostResolve);
        JS_FreeValue(Ctx, HostLoad);
    }

    JSContext* const Ctx;

    // the esm records of a failed load are removed (the modules which are not evaluated)
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

    FRecord* FindRecord(const std::string& Key)
    {
        auto Iter = Records.find(Key);
        return Iter == Records.end() ? nullptr : Iter->second.get();
    }

    FRecord* AddRecord(EKind Kind, const std::string& Url, const std::string& DebugPath)
    {
        auto Record = std::unique_ptr<FRecord>(new FRecord());
        Record->Kind = Kind;
        Record->Key = MakeKey(Kind, Url);
        Record->Url = Url;
        Record->DebugPath = DebugPath;
        const std::string& ScriptName = DebugPath.empty() ? Url : DebugPath;
        if (Kind == EKind::Esm)
        {
            Record->Name = ScriptName;
        }
        else
        {
            Record->Name = "<" + std::string(1, static_cast<char>(Kind)) + "#" + std::to_string(++Gen) + ">" + Url;
        }
        if (Kind == EKind::Esm || Kind == EKind::Cjs)
        {
            ScriptToUrl[ScriptName] = Url;
        }
        NameToKey[Record->Name] = Record->Key;
        if (LoadDepth > 0)
        {
            AddedKeys.push_back(Record->Key);
        }
        auto Ret = Record.get();
        Records[Record->Key] = std::move(Record);
        return Ret;
    }

    bool EraseRecord(const std::string& Key)
    {
        auto Iter = Records.find(Key);
        if (Iter == Records.end())
        {
            return false;
        }
        FRecord* Record = Iter->second.get();
        if (Record->Module)
        {
            auto ModuleIter = ModuleToKey.find(Record->Module);
            if (ModuleIter != ModuleToKey.end() && ModuleIter->second == Key)
            {
                ModuleToKey.erase(ModuleIter);
                // a module may be freed by quickjs (JS_ResolveModule frees the modules which are not resolved on failure)
                if (Record->Kind == EKind::Esm && JS_IsLoadedModule(Ctx, Record->Module))
                {
                    JS_RenameModule(Ctx, Record->Module, ("<discarded#" + std::to_string(++Gen) + ">" + Record->Name).c_str());
                }
            }
        }
        auto NameIter = NameToKey.find(Record->Name);
        if (NameIter != NameToKey.end() && NameIter->second == Key)
        {
            NameToKey.erase(NameIter);
        }
        for (auto LoadIter = LoadCache.begin(); LoadIter != LoadCache.end();)
        {
            if (LoadIter->second == Key)
            {
                LoadIter = LoadCache.erase(LoadIter);
            }
            else
            {
                ++LoadIter;
            }
        }
        JS_FreeValue(Ctx, Record->CjsModule);
        JS_FreeValue(Ctx, Record->Value);
        Records.erase(Iter);
        return true;
    }

    void Rollback(size_t Start)
    {
        for (size_t I = AddedKeys.size(); I > Start; --I)
        {
            const std::string& Key = AddedKeys[I - 1];
            FRecord* Record = FindRecord(Key);
            // an esm which is not evaluated, or whose evaluation threw (quickjs keeps it as evaluated with the exception,
            // v8 drops an errored module), is discarded so a retry loads it again
            if (Record && Record->Kind == EKind::Esm &&
                (!Record->Module || !JS_IsLoadedModule(Ctx, Record->Module) ||
                    JS_GetModuleStatus(Record->Module) != ModuleStatusEvaluated || JS_ModuleHasException(Record->Module)))
            {
                EraseRecord(Key);
            }
        }
        AddedKeys.resize(Start);
    }

    bool EnsureHost()
    {
        if (JS_IsFunction(Ctx, HostResolve) && JS_IsFunction(Ctx, HostLoad))
        {
            return true;
        }
        JSValue Global = JS_GetGlobalObject(Ctx);
        JSValue Resolve = JS_GetPropertyStr(Ctx, Global, "__puer_host_resolve__");
        JSValue Load = JS_GetPropertyStr(Ctx, Global, "__puer_host_load__");
        if (JS_IsFunction(Ctx, Resolve) && JS_IsFunction(Ctx, Load))
        {
            HostResolve = Resolve;
            HostLoad = Load;
            for (const char* Name : {"__puer_host_resolve__", "__puer_host_load__"})
            {
                JSAtom Atom = JS_NewAtom(Ctx, Name);
                JS_DeleteProperty(Ctx, Global, Atom, 0);
                JS_FreeAtom(Ctx, Atom);
            }
            JS_FreeValue(Ctx, Global);
            return true;
        }
        JS_FreeValue(Ctx, Resolve);
        JS_FreeValue(Ctx, Load);
        JS_FreeValue(Ctx, Global);
        if (JS_HasException(Ctx))
        {
            JS_FreeValue(Ctx, JS_GetException(Ctx));
        }
        Throw(Ctx, "[Puer001] __puer_host_resolve__ or __puer_host_load__ is not registered");
        return false;
    }

    bool CallHostResolve(const std::string& Specifier, const std::string& Referrer, const char* By, std::string& OutUrl)
    {
        JSValue Args[] = {NewStr(Ctx, Specifier), NewStr(Ctx, Referrer), JS_NewString(Ctx, By)};
        JSValue Ret = JS_Call(Ctx, HostResolve, JS_UNDEFINED, 3, Args);
        for (auto& Arg : Args)
        {
            JS_FreeValue(Ctx, Arg);
        }
        if (JS_IsException(Ret))
        {
            return false;
        }
        if (!JS_IsString(Ret))
        {
            JS_FreeValue(Ctx, Ret);
            Throw(Ctx, "[Puer002] import " + Specifier + " failed: module not found");
            return false;
        }
        OutUrl = ToStd(Ctx, Ret);
        JS_FreeValue(Ctx, Ret);
        return true;
    }

    // the url of the specifier for import.meta.resolve, the module is not loaded
    bool ResolveUrl(const std::string& Specifier, const std::string& Referrer, std::string& OutUrl)
    {
        if (FindRecord(MakeKey(EKind::Builtin, Specifier)))
        {
            OutUrl = Specifier;
            return true;
        }
        std::string CacheKey = "i" + Referrer + '\0' + Specifier;
        auto Iter = ResolveCache.find(CacheKey);
        if (Iter != ResolveCache.end())
        {
            OutUrl = Iter->second;
            return true;
        }
        if (!EnsureHost() || !CallHostResolve(Specifier, Referrer, "import", OutUrl))
        {
            return false;
        }
        ResolveCache[CacheKey] = OutUrl;
        return true;
    }

    FRecord* Resolve(const std::string& Specifier, const std::string& Referrer, bool ByImport)
    {
        if (FRecord* Builtin = FindRecord(MakeKey(EKind::Builtin, Specifier)))
        {
            return Builtin;
        }
        const char ByChar = ByImport ? 'i' : 'r';
        const char* By = ByImport ? "import" : "require";
        std::string CacheKey = std::string(1, ByChar) + Referrer + '\0' + Specifier;
        std::string Url;
        auto ResolveIter = ResolveCache.find(CacheKey);
        if (ResolveIter != ResolveCache.end())
        {
            Url = ResolveIter->second;
        }
        else
        {
            if (!EnsureHost() || !CallHostResolve(Specifier, Referrer, By, Url))
            {
                return nullptr;
            }
            ResolveCache[CacheKey] = Url;
        }
        if (FRecord* Builtin = FindRecord(MakeKey(EKind::Builtin, Url)))
        {
            return Builtin;
        }
        std::string LoadKey = std::string(1, ByChar) + Url;
        auto LoadIter = LoadCache.find(LoadKey);
        if (LoadIter != LoadCache.end())
        {
            if (FRecord* Cached = FindRecord(LoadIter->second))
            {
                return Cached;
            }
        }
        if (!EnsureHost())
        {
            return nullptr;
        }

        JSValue Args[] = {NewStr(Ctx, Url), JS_NewString(Ctx, By)};
        JSValue Loaded = JS_Call(Ctx, HostLoad, JS_UNDEFINED, 2, Args);
        JS_FreeValue(Ctx, Args[0]);
        JS_FreeValue(Ctx, Args[1]);
        if (JS_IsException(Loaded))
        {
            return nullptr;
        }
        if (!JS_IsObject(Loaded))
        {
            JS_FreeValue(Ctx, Loaded);
            Throw(Ctx, "[Puer003] load " + Url + " failed");
            return nullptr;
        }
        JSValue KindValue = JS_GetPropertyStr(Ctx, Loaded, "kind");
        JSValue Content = JS_GetPropertyStr(Ctx, Loaded, "content");
        JSValue DebugPathValue = JS_GetPropertyStr(Ctx, Loaded, "debugPath");
        JS_FreeValue(Ctx, Loaded);
        struct FValues
        {
            JSContext* Ctx;
            JSValue* Values[3];
            ~FValues()
            {
                for (auto Value : Values)
                {
                    JS_FreeValue(Ctx, *Value);
                }
            }
        } Holder{Ctx, {&KindValue, &Content, &DebugPathValue}};
        if (JS_IsException(KindValue) || JS_IsException(Content) || JS_IsException(DebugPathValue))
        {
            return nullptr;
        }

        std::string KindName = ToStd(Ctx, KindValue);
        EKind Kind;
        if (KindName == "esm")
        {
            Kind = EKind::Esm;
        }
        else if (KindName == "cjs")
        {
            Kind = EKind::Cjs;
        }
        else if (KindName == "json")
        {
            Kind = EKind::Json;
        }
        else
        {
            Throw(Ctx, "[Puer003] load " + Url + " failed: invalid kind '" + KindName + "'");
            return nullptr;
        }
        const bool IsString = JS_IsString(Content) != 0;
        if (!IsString && !JS_IsArrayBuffer(Content))
        {
            Throw(Ctx, "[Puer003] load " + Url + " failed: content must be a string or an ArrayBuffer");
            return nullptr;
        }
        std::string DebugPath = JS_IsString(DebugPathValue) ? ToStd(Ctx, DebugPathValue) : std::string();

        std::string Key = MakeKey(Kind, Url);
        if (FRecord* Existing = FindRecord(Key))
        {
            LoadCache[LoadKey] = Key;
            return Existing;
        }

        FRecord* Record = nullptr;
        switch (Kind)
        {
            case EKind::Esm:
                if (!IsString)
                {
                    Throw(Ctx, "[Puer003] load " + Url + " failed: bytecode is not supported");
                    return nullptr;
                }
                Record = FetchEsm(Url, DebugPath, ToStd(Ctx, Content));
                if (!Record)
                {
                    return nullptr;
                }
                break;
            case EKind::Cjs:
                if (!IsString)
                {
                    Throw(Ctx, "[Puer003] load " + Url + " failed: bytecode is not supported");
                    return nullptr;
                }
                Record = AddRecord(EKind::Cjs, Url, DebugPath);
                Record->Content = ToStd(Ctx, Content);
                break;
            default:
            {
                if (!IsString)
                {
                    Throw(Ctx, "[Puer003] load " + Url + " failed: content of json must be a string");
                    return nullptr;
                }
                std::string Text = ToStd(Ctx, Content);
                const std::string& FileName = DebugPath.empty() ? Url : DebugPath;
                JSValue Value = JS_ParseJSON(Ctx, Text.c_str(), Text.size(), FileName.c_str());
                if (JS_IsException(Value))
                {
                    return nullptr;
                }
                Record = AddRecord(EKind::Json, Url, DebugPath);
                Record->Value = Value;
                break;
            }
        }
        LoadCache[LoadKey] = Key;
        return Record;
    }

    FRecord* FetchEsm(const std::string& Url, const std::string& DebugPath, const std::string& Source)
    {
        // quickjs resolves the imports while compiling a module (JS_Eval calls the normalize / loader hooks), so the
        // record is added first: the hooks find the referrer url by the module name, and a cycle back to this module
        // finds the record (quickjs finds the module itself by name)
        FRecord* Record = AddRecord(EKind::Esm, Url, DebugPath);
        const std::string Name = Record->Name;
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
            // a cycle, the bindings may be in TDZ
            return JS_GetModuleNamespace(Ctx, Module);
        }
        std::string Url = Record->Url;
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

    JSValue NewRequire(const std::string& Referrer)
    {
        JSValue Data = NewStr(Ctx, Referrer);
        JSValue Func = JS_NewCFunctionData(Ctx, &RequireCallback, 1, 0, 1, &Data);
        JS_FreeValue(Ctx, Data);
        return Func;
    }

    JSValue CompileCjs(FRecord* Record)
    {
        std::string Source = "(function (exports, require, module, __filename, __dirname) {" + Record->Content + "\n})";
        const std::string& FileName = Record->DebugPath.empty() ? Record->Url : Record->DebugPath;
        return JS_Eval(Ctx, Source.c_str(), Source.size(), FileName.c_str(), JS_EVAL_TYPE_GLOBAL);
    }

    // a new reference of the value of the module, JS_EXCEPTION on failure
    JSValue Require(FRecord* Record)
    {
        switch (Record->Kind)
        {
            case EKind::Esm:
                return EvaluateEsm(Record);
            case EKind::Cjs:
                break;
            default:
                return JS_DupValue(Ctx, Record->Value);
        }

        if (Record->Executed)
        {
            // loaded, or a cycle (the exports may be incomplete)
            return JS_GetPropertyStr(Ctx, Record->CjsModule, "exports");
        }
        Record->Executed = true;

        std::string Key = Record->Key;
        JSValue Module = JS_NewObject(Ctx);
        JSValue Exports = JS_NewObject(Ctx);
        JSValue Result = JS_EXCEPTION;
        if (JS_SetPropertyStr(Ctx, Module, "exports", JS_DupValue(Ctx, Exports)) >= 0)
        {
            JSValue Func = CompileCjs(Record);
            if (!JS_IsException(Func))
            {
                std::string Url = Record->Url;
                Record->Content.clear();
                Record->Content.shrink_to_fit();
                Record->CjsModule = JS_DupValue(Ctx, Module);
                JSValue Args[] = {Exports, NewRequire(Url), Module, NewStr(Ctx, Url), NewStr(Ctx, DirName(Url))};
                JSValue Ret = JS_Call(Ctx, Func, Exports, 5, Args);
                JS_FreeValue(Ctx, Args[1]);
                JS_FreeValue(Ctx, Args[3]);
                JS_FreeValue(Ctx, Args[4]);
                JS_FreeValue(Ctx, Func);
                if (!JS_IsException(Ret))
                {
                    JS_FreeValue(Ctx, Ret);
                    Result = JS_GetPropertyStr(Ctx, Module, "exports");
                }
            }
        }
        JS_FreeValue(Ctx, Module);
        JS_FreeValue(Ctx, Exports);
        if (JS_IsException(Result))
        {
            // removed so a later require loads it again
            EraseRecord(Key);
        }
        return Result;
    }

    // the module imported by an esm, nullptr with the exception thrown on failure
    JSModuleDef* ModuleForImport(FRecord* Record)
    {
        if (Record->Kind == EKind::Esm || Record->Module)
        {
            return Record->Module;
        }
        std::string Key = Record->Key;
        if (Record->Kind == EKind::Cjs)
        {
            JSValue Exports = Require(Record);
            if (JS_IsException(Exports))
            {
                return nullptr;
            }
            Record = FindRecord(Key);
            if (!Record)
            {
                JS_FreeValue(Ctx, Exports);
                Throw(Ctx, "[Puer005] module record not found: " + Key.substr(1));
                return nullptr;
            }
            JS_FreeValue(Ctx, Record->Value);
            Record->Value = Exports;
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

    static JSValue RequireCallback(JSContext* Ctx, JSValueConst ThisVal, int Argc, JSValueConst* Argv, int Magic, JSValue* Data)
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
        std::string Specifier = ToStd(Ctx, Argv[0]);
        std::string Referrer = ToStd(Ctx, Data[0]);
        FLoadScope Scope(Loader);
        FRecord* Record = Loader->Resolve(Specifier, Referrer, false);
        if (!Record)
        {
            return JS_EXCEPTION;
        }
        JSValue Ret = Loader->Require(Record);
        Scope.Ok = !JS_IsException(Ret);
        return Ret;
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
        std::string Url;
        if (!Loader->ResolveUrl(ToStd(Ctx, Argv[0]), ToStd(Ctx, Data[0]), Url))
        {
            return JS_EXCEPTION;
        }
        return NewStr(Ctx, Url);
    }

    // the url of the script or module named BaseName ("" if unknown, an eval script for example)
    std::string ReferrerOf(const char* BaseName)
    {
        if (!BaseName)
        {
            return std::string();
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
        return std::string();
    }

    static char* Normalize(JSContext* Ctx, const char* BaseName, const char* Name, void* Opaque)
    {
        auto Loader = static_cast<FModuleLoader*>(Opaque);
        if (!Loader)
        {
            Throw(Ctx, DestroyedMessage);
            return nullptr;
        }
        FLoadScope Scope(Loader);
        FRecord* Record = Loader->Resolve(Name, Loader->ReferrerOf(BaseName), true);
        if (!Record)
        {
            return nullptr;
        }
        Scope.Ok = true;
        return js_strdup(Ctx, Record->Name.c_str());
    }

    static JSModuleDef* LoadModule(JSContext* Ctx, const char* Name, void* Opaque)
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
            Throw(Ctx, std::string("[Puer002] import ") + Name + " failed: module not fetched");
            return nullptr;
        }
        FLoadScope Scope(Loader);
        JSModuleDef* Module = Loader->ModuleForImport(Record);
        Scope.Ok = Module != nullptr;
        return Module;
    }

    std::unordered_map<std::string, std::unique_ptr<FRecord>> Records;
    // the records added in the current (outermost) load
    std::vector<std::string> AddedKeys;
    // by char + referrer + '\0' + specifier -> url
    std::unordered_map<std::string, std::string> ResolveCache;
    // by char + url -> record key
    std::unordered_map<std::string, std::string> LoadCache;
    // module name -> record key
    std::unordered_map<std::string, std::string> NameToKey;
    // script name (debugPath or url) of an esm / cjs -> url
    std::unordered_map<std::string, std::string> ScriptToUrl;
    std::unordered_map<JSModuleDef*, std::string> ModuleToKey;
    JSValue HostResolve = JS_UNDEFINED;
    JSValue HostLoad = JS_UNDEFINED;
    int LoadDepth = 0;
    uint64_t Gen = 0;
};

FModuleLoader* CreateModuleLoader(pesapi_env Env)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    if (FindLoader(Ctx))
    {
        return nullptr;
    }
    auto Loader = new FModuleLoader(Ctx);
    {
        std::lock_guard<std::mutex> Lock(GLoadersMutex);
        GLoaders[Ctx] = Loader;
    }
    JS_SetModuleLoaderFunc(JS_GetRuntime(Ctx), &FModuleLoader::Normalize, &FModuleLoader::LoadModule, Loader);
    return Loader;
}

void DestroyModuleLoader(FModuleLoader* Loader)
{
    if (!Loader)
    {
        return;
    }
    // the hooks stay installed (an import throws "the module loader is destroyed")
    JS_SetModuleLoaderFunc(JS_GetRuntime(Loader->Ctx), &FModuleLoader::Normalize, &FModuleLoader::LoadModule, nullptr);
    {
        std::lock_guard<std::mutex> Lock(GLoadersMutex);
        GLoaders.erase(Loader->Ctx);
    }
    delete Loader;
}

pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    if (!Loader)
    {
        Throw(Ctx, DestroyedMessage);
        return nullptr;
    }
    FModuleLoader::FLoadScope Scope(Loader);
    FRecord* Record = Loader->Resolve(Specifier ? Specifier : "", Referrer ? Referrer : "", ByImport);
    if (!Record)
    {
        return nullptr;
    }
    JSValue Ret = Loader->Require(Record);
    if (JS_IsException(Ret))
    {
        return nullptr;
    }
    Scope.Ok = true;
    return ToPesapi(Ctx, Ret);
}

pesapi_value CreateRequire(pesapi_env Env, const char* Referrer)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    FModuleLoader* Loader = FindLoader(Ctx);
    if (!Loader)
    {
        return nullptr;
    }
    return ToPesapi(Ctx, Loader->NewRequire(Referrer ? Referrer : ""));
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
    Record->Value = Value ? JS_DupValue(Ctx, *reinterpret_cast<JSValue*>(Value)) : JS_UNDEFINED;
}
}    // namespace papi_qjs
}    // namespace PUERTS_NAMESPACE
