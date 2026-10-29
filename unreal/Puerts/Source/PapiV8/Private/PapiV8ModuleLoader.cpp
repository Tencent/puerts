/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#ifndef WITH_QUICKJS

#include "PapiV8ModuleLoader.h"
#include "DataTransfer.h"
#include "PesapiImpl.h"

#include <cstring>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#define PUERTS_MODULE_LOADER_DATA_POS_IN_ISOLATE (PESAPI_PRIVATE_DATA_POS_IN_ISOLATE + 1)

namespace PUERTS_NAMESPACE
{
namespace papi_v8
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
    // esm: the module; others: the synthetic module created when imported by an esm
    v8::Global<v8::Module> Module;
    // cjs: the source or bytecode, released once executed
    v8::Global<v8::Value> Content;
    // cjs: the `module` object
    v8::Global<v8::Object> CjsModule;
    // json / builtin: the value; cjs: module.exports when the synthetic module is created
    v8::Global<v8::Value> Value;
    // esm: specifier -> module, filled while fetching the module tree
    std::unordered_map<std::string, v8::Global<v8::Module>> Requests;
    // the synthetic module: the named exports (own properties of Value when it is created)
    std::vector<v8::Global<v8::String>> ExportNames;
    bool Executed = false;
};

#if defined(WITH_V8_BYTECODE)
struct FCodeCacheHeader
{
    uint32_t MagicNumber;
    uint32_t VersionHash;
    uint32_t SourceHash;
    uint32_t FlagHash;
#if V8_MAJOR_VERSION >= 11
    uint32_t ReadOnlySnapshotChecksum;
#endif
    uint32_t PayloadLength;
    uint32_t Checksum;
};
#endif

inline v8::Local<v8::Context> ToV8(pesapi_env Env)
{
    v8::Local<v8::Context> Local;
    *reinterpret_cast<pesapi_env*>(&Local) = Env;
    return Local;
}

inline v8::Local<v8::Value> ToV8(pesapi_value Value)
{
    v8::Local<v8::Value> Local;
    *reinterpret_cast<pesapi_value*>(&Local) = Value;
    return Local;
}

inline pesapi_value ToPapi(v8::Local<v8::Value> Local)
{
    return reinterpret_cast<pesapi_value>(*Local);
}

inline pesapi_env ToPapi(v8::Local<v8::Context> Local)
{
    return reinterpret_cast<pesapi_env>(*Local);
}

inline v8::Local<v8::String> Str(v8::Isolate* Isolate, const std::string& S)
{
    return v8::String::NewFromUtf8(Isolate, S.c_str(), v8::NewStringType::kNormal, static_cast<int>(S.size())).ToLocalChecked();
}

inline std::string ToStd(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
{
    v8::String::Utf8Value Utf8(Isolate, Value);
    return *Utf8 ? std::string(*Utf8, Utf8.length()) : std::string();
}

inline void Throw(v8::Isolate* Isolate, const std::string& Message)
{
    Isolate->ThrowException(v8::Exception::Error(Str(Isolate, Message)));
}

inline v8::ScriptOrigin MakeOrigin(v8::Isolate* Isolate, const std::string& Name, bool IsModule)
{
#if V8_MAJOR_VERSION > 8
    return v8::ScriptOrigin(Isolate, Str(Isolate, Name), 0, 0, false, -1, v8::Local<v8::Value>(), false, false, IsModule);
#else
    return v8::ScriptOrigin(Str(Isolate, Name), v8::Local<v8::Integer>(), v8::Local<v8::Integer>(), v8::Local<v8::Boolean>(),
        v8::Local<v8::Integer>(), v8::Local<v8::Value>(), v8::Local<v8::Boolean>(), v8::Local<v8::Boolean>(),
        v8::Boolean::New(Isolate, IsModule));
#endif
}

std::string MakeKey(EKind Kind, const std::string& Url)
{
    std::string Key(1, static_cast<char>(Kind));
    Key += Url;
    return Key;
}

std::string DirName(const std::string& Url)
{
    auto Pos = Url.find_last_of("/\\");
    return Pos == std::string::npos ? std::string() : Url.substr(0, Pos);
}
}    // namespace

class FModuleLoader
{
public:
    explicit FModuleLoader(v8::Isolate* InIsolate) : Isolate(InIsolate)
    {
    }

    ~FModuleLoader()
    {
        Records.clear();
        ModuleToRecord.clear();
        HostResolve.Reset();
        HostLoad.Reset();
        FallbackRequire.Reset();
    }

    v8::Isolate* const Isolate;
    v8::Global<v8::Function> HostResolve;
    v8::Global<v8::Function> HostLoad;
    // tried before the host for a bare specifier required (not imported), e.g. the require of node (its builtin modules and
    // node_modules), see SetFallbackRequire
    v8::Global<v8::Function> FallbackRequire;
    std::unordered_map<std::string, std::unique_ptr<FRecord>> Records;
    std::unordered_multimap<int, FRecord*> ModuleToRecord;
    // "<by><referrer>\0<specifier>" -> key of the record
    std::unordered_map<std::string, std::string> ResolveCache;
    // "<by><url>" -> key of the record
    std::unordered_map<std::string, std::string> LoadCache;
    // the resource name (debug path) of the scripts -> url, the referrer of a dynamic import is known by the resource name
    std::unordered_map<std::string, std::string> DebugPathToUrl;
    // keys of the esm records added by the running loads, the ones not evaluated are removed if the load fails
    std::vector<std::string> PendingEsm;
    int LoadDepth = 0;
    uint32_t ExpectFlagHash = 0;
    uint32_t ExpectReadOnlySnapshotChecksum = 0;
    bool HasCodeCacheExpect = false;

    static FModuleLoader* Get(v8::Isolate* Isolate)
    {
        return static_cast<FModuleLoader*>(Isolate->GetData(PUERTS_MODULE_LOADER_DATA_POS_IN_ISOLATE));
    }

    // the records added in a load are rolled back when it fails, so a later load of the same module can retry
    struct FLoadScope
    {
        FModuleLoader* Loader;
        size_t Start;
        bool Succeeded = false;

        explicit FLoadScope(FModuleLoader* InLoader) : Loader(InLoader), Start(InLoader->PendingEsm.size())
        {
            ++Loader->LoadDepth;
        }

        ~FLoadScope()
        {
            if (!Succeeded)
            {
                Loader->Rollback(Start);
            }
            if (--Loader->LoadDepth == 0)
            {
                Loader->PendingEsm.clear();
            }
        }
    };

    void Rollback(size_t Start)
    {
        for (size_t i = Start; i < PendingEsm.size(); ++i)
        {
            auto It = Records.find(PendingEsm[i]);
            if (It != Records.end() && It->second->Module.Get(Isolate)->GetStatus() != v8::Module::kEvaluated)
            {
                EraseRecord(It->first);
            }
        }
        PendingEsm.resize(Start);
    }

    FRecord* AddRecord(EKind Kind, const std::string& Url, const std::string& DebugPath)
    {
        auto Key = MakeKey(Kind, Url);
        auto Record = std::make_unique<FRecord>();
        Record->Kind = Kind;
        Record->Key = Key;
        Record->Url = Url;
        Record->DebugPath = DebugPath;
        auto Ptr = Record.get();
        Records[Key] = std::move(Record);
        if (Kind == EKind::Esm)
        {
            PendingEsm.push_back(Key);
        }
        if (Kind == EKind::Esm || Kind == EKind::Cjs)
        {
            DebugPathToUrl[DebugPath] = Url;
        }
        return Ptr;
    }

    void EraseRecord(const std::string& Key)
    {
        auto It = Records.find(Key);
        if (It == Records.end())
        {
            return;
        }
        auto Record = It->second.get();
        if (!Record->Module.IsEmpty())
        {
            auto Range = ModuleToRecord.equal_range(Record->Module.Get(Isolate)->GetIdentityHash());
            for (auto MIt = Range.first; MIt != Range.second; ++MIt)
            {
                if (MIt->second == Record)
                {
                    ModuleToRecord.erase(MIt);
                    break;
                }
            }
        }
        Records.erase(It);
    }

    void BindModule(FRecord* Record, v8::Local<v8::Module> Module)
    {
        Record->Module.Reset(Isolate, Module);
        ModuleToRecord.emplace(Module->GetIdentityHash(), Record);
    }

    FRecord* FindRecord(v8::Local<v8::Module> Module)
    {
        auto Range = ModuleToRecord.equal_range(Module->GetIdentityHash());
        for (auto It = Range.first; It != Range.second; ++It)
        {
            if (It->second->Module == Module)
            {
                return It->second;
            }
        }
        return nullptr;
    }

    bool EnsureHost(v8::Local<v8::Context> Context)
    {
        if (!HostResolve.IsEmpty())
        {
            return true;
        }
        auto Global = Context->Global();
        auto ResolveName = Str(Isolate, "__puer_host_resolve__");
        auto LoadName = Str(Isolate, "__puer_host_load__");
        v8::Local<v8::Value> Resolve;
        v8::Local<v8::Value> Load;
        if (!Global->Get(Context, ResolveName).ToLocal(&Resolve) || !Global->Get(Context, LoadName).ToLocal(&Load))
        {
            return false;
        }
        if (!Resolve->IsFunction() || !Load->IsFunction())
        {
            Throw(Isolate, "[Puer001] __puer_host_resolve__ or __puer_host_load__ is not registered");
            return false;
        }
        HostResolve.Reset(Isolate, Resolve.As<v8::Function>());
        HostLoad.Reset(Isolate, Load.As<v8::Function>());
        (void) Global->Delete(Context, ResolveName);
        (void) Global->Delete(Context, LoadName);
        return true;
    }

    // the url (a string) returned by the host, EnsureHost is called before
    v8::MaybeLocal<v8::Value> CallHostResolve(
        v8::Local<v8::Context> Context, const std::string& Specifier, const std::string& Referrer, v8::Local<v8::String> By)
    {
        v8::Local<v8::Value> ResolveArgs[] = {Str(Isolate, Specifier), Str(Isolate, Referrer), By};
        v8::Local<v8::Value> UrlValue;
        if (!HostResolve.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 3, ResolveArgs).ToLocal(&UrlValue))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        if (!UrlValue->IsString())
        {
            Throw(Isolate, "[Puer002] import " + Specifier + " failed: module not found");
            return v8::MaybeLocal<v8::Value>();
        }
        return UrlValue;
    }

    // import.meta.resolve: the url of the specifier imported by Referrer, without loading it
    v8::MaybeLocal<v8::Value> ResolveUrl(v8::Local<v8::Context> Context, const std::string& Specifier, const std::string& Referrer)
    {
        if (Records.find(MakeKey(EKind::Builtin, Specifier)) != Records.end())
        {
            return Str(Isolate, Specifier).As<v8::Value>();
        }
        std::string CacheKey(1, 'i');
        CacheKey += Referrer;
        CacheKey.push_back('\0');
        CacheKey += Specifier;
        auto CacheIt = ResolveCache.find(CacheKey);
        if (CacheIt != ResolveCache.end() && Records.find(CacheIt->second) != Records.end())
        {
            return Str(Isolate, CacheIt->second.substr(1)).As<v8::Value>();
        }
        if (!EnsureHost(Context))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        return CallHostResolve(Context, Specifier, Referrer, Str(Isolate, "import"));
    }

    // resolves and loads (compiles for esm, without evaluating) the module, returns nullptr with an exception thrown
    FRecord* Resolve(v8::Local<v8::Context> Context, const std::string& Specifier, const std::string& Referrer, bool ByImport)
    {
        auto BuiltinIt = Records.find(MakeKey(EKind::Builtin, Specifier));
        if (BuiltinIt != Records.end())
        {
            return BuiltinIt->second.get();
        }

        std::string CacheKey(1, ByImport ? 'i' : 'r');
        CacheKey += Referrer;
        CacheKey.push_back('\0');
        CacheKey += Specifier;
        auto CacheIt = ResolveCache.find(CacheKey);
        if (CacheIt != ResolveCache.end())
        {
            auto It = Records.find(CacheIt->second);
            if (It != Records.end())
            {
                return It->second.get();
            }
        }

        if (!EnsureHost(Context))
        {
            return nullptr;
        }

        if (!ByImport && !FallbackRequire.IsEmpty() && !Specifier.empty() && Specifier[0] != '.' && Specifier[0] != '/')
        {
            // found by the fallback: kept as a builtin module of the name, so it is matched first next time
            v8::TryCatch TryCatch(Isolate);
            v8::Local<v8::Value> Arg = Str(Isolate, Specifier);
            v8::Local<v8::Value> Exports;
            if (FallbackRequire.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, &Arg).ToLocal(&Exports))
            {
                auto Record = AddRecord(EKind::Builtin, Specifier, Specifier);
                Record->Value.Reset(Isolate, Exports);
                return Record;
            }
        }

        auto By = Str(Isolate, ByImport ? "import" : "require");
        v8::Local<v8::Value> UrlValue;
        if (!CallHostResolve(Context, Specifier, Referrer, By).ToLocal(&UrlValue))
        {
            return nullptr;
        }
        std::string Url = ToStd(Isolate, UrlValue);

        // registered by the host lazily
        BuiltinIt = Records.find(MakeKey(EKind::Builtin, Url));
        if (BuiltinIt != Records.end())
        {
            ResolveCache[CacheKey] = BuiltinIt->first;
            return BuiltinIt->second.get();
        }

        // the kind is decided by the host loading it, the same (by, url) is loaded once
        std::string LoadKey(1, ByImport ? 'i' : 'r');
        LoadKey += Url;
        auto LoadIt = LoadCache.find(LoadKey);
        if (LoadIt != LoadCache.end())
        {
            auto It = Records.find(LoadIt->second);
            if (It != Records.end())
            {
                ResolveCache[CacheKey] = It->first;
                return It->second.get();
            }
        }

        v8::Local<v8::Value> LoadArgs[] = {UrlValue, By};
        v8::Local<v8::Value> Loaded;
        if (!HostLoad.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 2, LoadArgs).ToLocal(&Loaded))
        {
            return nullptr;
        }
        if (!Loaded->IsObject())
        {
            Throw(Isolate, "[Puer003] load " + Url + " failed");
            return nullptr;
        }
        auto LoadedObj = Loaded.As<v8::Object>();
        v8::Local<v8::Value> KindValue;
        v8::Local<v8::Value> Content;
        v8::Local<v8::Value> DebugPathValue;
        if (!LoadedObj->Get(Context, Str(Isolate, "kind")).ToLocal(&KindValue) ||
            !LoadedObj->Get(Context, Str(Isolate, "content")).ToLocal(&Content) ||
            !LoadedObj->Get(Context, Str(Isolate, "debugPath")).ToLocal(&DebugPathValue))
        {
            return nullptr;
        }
        std::string KindName = ToStd(Isolate, KindValue);
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
            Throw(Isolate, "[Puer003] load " + Url + " failed: invalid kind '" + KindName + "'");
            return nullptr;
        }
        if (!Content->IsString() && !Content->IsArrayBuffer())
        {
            Throw(Isolate, "[Puer003] load " + Url + " failed: content must be a string or an ArrayBuffer");
            return nullptr;
        }
        std::string DebugPath = DebugPathValue->IsString() ? ToStd(Isolate, DebugPathValue) : Url;

        auto Key = MakeKey(Kind, Url);
        auto ExistingIt = Records.find(Key);
        if (ExistingIt != Records.end())
        {
            ResolveCache[CacheKey] = Key;
            LoadCache[LoadKey] = Key;
            return ExistingIt->second.get();
        }

        FRecord* Record = nullptr;
        switch (Kind)
        {
            case EKind::Esm:
                Record = FetchEsm(Context, Url, DebugPath, Content);
                break;
            case EKind::Cjs:
                Record = AddRecord(Kind, Url, DebugPath);
                Record->Content.Reset(Isolate, Content);
                break;
            default:
            {
                if (!Content->IsString())
                {
                    Throw(Isolate, "[Puer003] load " + Url + " failed: content of json must be a string");
                    return nullptr;
                }
                v8::Local<v8::Value> Value;
                if (!v8::JSON::Parse(Context, Content.As<v8::String>()).ToLocal(&Value))
                {
                    return nullptr;
                }
                Record = AddRecord(Kind, Url, DebugPath);
                Record->Value.Reset(Isolate, Value);
                break;
            }
        }
        if (Record)
        {
            ResolveCache[CacheKey] = Key;
            LoadCache[LoadKey] = Key;
        }
        return Record;
    }

#if defined(WITH_V8_BYTECODE)
    // the source passed with bytecode, only its length is checked by v8
    v8::Local<v8::String> Placeholder(v8::Local<v8::ArrayBuffer> Bytecode, bool IsModule)
    {
        auto Header = static_cast<FCodeCacheHeader*>(DataTransfer::GetArrayBufferData(Bytecode));
        static constexpr uint32_t kModuleFlagMask = (1u << 31);
        uint32_t Length = IsModule ? (Header->SourceHash & ~kModuleFlagMask) : Header->SourceHash;
        std::string Spaces(Length, ' ');
        return v8::String::NewFromOneByte(
            Isolate, reinterpret_cast<const uint8_t*>(Spaces.data()), v8::NewStringType::kNormal, static_cast<int>(Spaces.size()))
            .ToLocalChecked();
    }

    // copies the bytecode (owned by the returned CachedData) and patches the header fields depending on the running v8
    v8::ScriptCompiler::CachedData* NewCachedData(v8::Local<v8::ArrayBuffer> Bytecode)
    {
        size_t Length = Bytecode->ByteLength();
        uint8_t* Data = new uint8_t[Length];
        memcpy(Data, DataTransfer::GetArrayBufferData(Bytecode), Length);
        if (HasCodeCacheExpect && Length >= sizeof(FCodeCacheHeader))
        {
            auto Header = reinterpret_cast<FCodeCacheHeader*>(Data);
            Header->FlagHash = ExpectFlagHash;
#if V8_MAJOR_VERSION >= 11
            Header->ReadOnlySnapshotChecksum = ExpectReadOnlySnapshotChecksum;
#endif
        }
        return new v8::ScriptCompiler::CachedData(Data, static_cast<int>(Length), v8::ScriptCompiler::CachedData::BufferOwned);
    }
#endif

    bool IsBytecodeSupported(const std::string& Url)
    {
#if defined(WITH_V8_BYTECODE)
        return true;
#else
        Throw(Isolate, "[Puer003] load " + Url + " failed: bytecode is not supported");
        return false;
#endif
    }

    FRecord* FetchEsm(
        v8::Local<v8::Context> Context, const std::string& Url, const std::string& DebugPath, v8::Local<v8::Value> Content)
    {
        auto Origin = MakeOrigin(Isolate, DebugPath, true);
        v8::Local<v8::Module> Module;
        if (Content->IsArrayBuffer())
        {
            if (!IsBytecodeSupported(Url))
            {
                return nullptr;
            }
#if defined(WITH_V8_BYTECODE)
            auto Bytecode = Content.As<v8::ArrayBuffer>();
            v8::ScriptCompiler::Source Source(Placeholder(Bytecode, true), Origin, NewCachedData(Bytecode));
            if (!v8::ScriptCompiler::CompileModule(Isolate, &Source, v8::ScriptCompiler::kConsumeCodeCache).ToLocal(&Module))
            {
                return nullptr;
            }
            if (Source.GetCachedData()->rejected)
            {
                Throw(Isolate, "invalid bytecode: " + Url);
                return nullptr;
            }
#endif
        }
        else
        {
            v8::ScriptCompiler::Source Source(Content.As<v8::String>(), Origin);
            if (!v8::ScriptCompiler::CompileModule(Isolate, &Source).ToLocal(&Module))
            {
                return nullptr;
            }
        }

        auto Record = AddRecord(EKind::Esm, Url, DebugPath);
        BindModule(Record, Module);

#if V8_MAJOR_VERSION >= 9
        v8::Local<v8::FixedArray> ModuleRequests = Module->GetModuleRequests();
        for (int i = 0, Length = ModuleRequests->Length(); i < Length; ++i)
        {
            auto Specifier =
                ToStd(Isolate, ModuleRequests->Get(Context, i).As<v8::ModuleRequest>()->GetSpecifier().As<v8::Value>());
#else
        for (int i = 0, Length = Module->GetModuleRequestsLength(); i < Length; ++i)
        {
            auto Specifier = ToStd(Isolate, Module->GetModuleRequest(i));
#endif
            if (Record->Requests.find(Specifier) != Record->Requests.end())
            {
                continue;
            }
            auto Dep = Resolve(Context, Specifier, Url, true);
            if (!Dep)
            {
                return nullptr;
            }
            v8::Local<v8::Module> DepModule;
            if (!ModuleForImport(Context, Dep).ToLocal(&DepModule))
            {
                return nullptr;
            }
            Record->Requests[Specifier].Reset(Isolate, DepModule);
        }
        return Record;
    }

    static v8::MaybeLocal<v8::Value> SyntheticEvaluationSteps(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module)
    {
        auto Isolate = Context->GetIsolate();
        auto Loader = Get(Isolate);
        auto Record = Loader->FindRecord(Module);
        if (!Record)
        {
            Throw(Isolate, "[Puer005] module record not found");
            return v8::MaybeLocal<v8::Value>();
        }
        auto Value = Record->Value.Get(Isolate);
        (void) Module->SetSyntheticModuleExport(Isolate, Str(Isolate, "default"), Value);
        if (Value->IsObject())
        {
            auto Obj = Value.As<v8::Object>();
            for (auto& Name : Record->ExportNames)
            {
                auto Key = Name.Get(Isolate);
                v8::Local<v8::Value> Prop;
                if (!Obj->Get(Context, Key).ToLocal(&Prop) ||
                    !Module->SetSyntheticModuleExport(Isolate, Key, Prop).FromMaybe(false))
                {
                    return v8::MaybeLocal<v8::Value>();
                }
            }
        }
        return v8::MaybeLocal<v8::Value>(v8::True(Isolate));
    }

    // esm import of other kinds: a synthetic module, `default` is the value and its own properties are named exports
    v8::MaybeLocal<v8::Module> ModuleForImport(v8::Local<v8::Context> Context, FRecord* Record)
    {
        if (Record->Kind == EKind::Esm || !Record->Module.IsEmpty())
        {
            return Record->Module.Get(Isolate);
        }
#if V8_MAJOR_VERSION < 8
        Throw(Isolate, "V8_MAJOR_VERSION < 8 not support import [" + Record->Url + "] from ESM");
        return v8::MaybeLocal<v8::Module>();
#else
        if (Record->Kind == EKind::Cjs)
        {
            auto Key = Record->Key;
            v8::Local<v8::Value> Exports;
            if (!Require(Context, Record).ToLocal(&Exports))
            {
                return v8::MaybeLocal<v8::Module>();
            }
            auto It = Records.find(Key);
            if (It == Records.end())
            {
                Throw(Isolate, "[Puer005] module record not found: " + Key.substr(1));
                return v8::MaybeLocal<v8::Module>();
            }
            Record = It->second.get();
            if (!Record->Module.IsEmpty())
            {
                return Record->Module.Get(Isolate);
            }
            Record->Value.Reset(Isolate, Exports);
        }

        auto Value = Record->Value.Get(Isolate);
        std::vector<v8::Local<v8::String>> ExportNames = {Str(Isolate, "default")};
        Record->ExportNames.clear();
        if (Value->IsObject())
        {
            v8::Local<v8::Array> Keys;
            if (Value.As<v8::Object>()->GetOwnPropertyNames(Context).ToLocal(&Keys))
            {
                for (uint32_t i = 0; i < Keys->Length(); ++i)
                {
                    v8::Local<v8::Value> Key;
                    if (Keys->Get(Context, i).ToLocal(&Key) && Key->IsString())
                    {
                        auto Name = Key.As<v8::String>();
                        if (!Name->StringEquals(ExportNames[0]))
                        {
                            ExportNames.push_back(Name);
                            Record->ExportNames.emplace_back(Isolate, Name);
                        }
                    }
                }
            }
        }
        auto Module =
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
            v8::Module_CreateSyntheticModule_Without_Stl(
                Isolate, Str(Isolate, Record->Url), ExportNames.data(), ExportNames.size(), &SyntheticEvaluationSteps);
#else
            v8::Module::CreateSyntheticModule(Isolate, Str(Isolate, Record->Url), ExportNames, &SyntheticEvaluationSteps);
#endif
        BindModule(Record, Module);
        return Module;
#endif
    }

    static v8::MaybeLocal<v8::Module> ResolveModuleCallback(v8::Local<v8::Context> Context, v8::Local<v8::String> Specifier,
#if V8_MAJOR_VERSION >= 9
        v8::Local<v8::FixedArray> ImportAttributes,
#endif
        v8::Local<v8::Module> Referrer)
    {
        auto Isolate = Context->GetIsolate();
        auto Loader = Get(Isolate);
        auto Record = Loader->FindRecord(Referrer);
        auto Name = ToStd(Isolate, Specifier);
        if (Record)
        {
            auto It = Record->Requests.find(Name);
            if (It != Record->Requests.end())
            {
                return It->second.Get(Isolate);
            }
        }
        Throw(Isolate, "[Puer002] import " + Name + " failed: module not fetched");
        return v8::MaybeLocal<v8::Module>();
    }

    v8::MaybeLocal<v8::Value> EvaluateEsm(v8::Local<v8::Context> Context, FRecord* Record)
    {
        auto Module = Record->Module.Get(Isolate);
        if (Module->GetStatus() == v8::Module::kUninstantiated)
        {
            if (!Module->InstantiateModule(Context, &ResolveModuleCallback).FromMaybe(false))
            {
                return v8::MaybeLocal<v8::Value>();
            }
        }
        if (Module->GetStatus() == v8::Module::kEvaluating)
        {
            // required by a module it imports (a cycle), the bindings not evaluated yet are in TDZ
            return Module->GetModuleNamespace();
        }
        v8::Local<v8::Value> Result;
        if (!Module->Evaluate(Context).ToLocal(&Result))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        if (Result->IsPromise())
        {
            auto Promise = Result.As<v8::Promise>();
            if (Promise->State() == v8::Promise::kPending)
            {
                // runs all queued microtasks, if still pending the module waits for something else (a timer, io ...)
                Isolate->PerformMicrotaskCheckpoint();
            }
            if (Promise->State() == v8::Promise::kPending)
            {
                Throw(Isolate, "[Puer004] top-level await of " + Record->Url + " can not be settled synchronously");
                return v8::MaybeLocal<v8::Value>();
            }
            if (Promise->State() == v8::Promise::kRejected)
            {
                // a handler added (not only MarkAsHandled) so the host is notified the rejection is handled (thrown here)
                v8::Local<v8::Function> Noop;
                if (v8::Function::New(Context, [](const v8::FunctionCallbackInfo<v8::Value>&) {}).ToLocal(&Noop))
                {
                    (void) Promise->Catch(Context, Noop);
                }
                Promise->MarkAsHandled();
                Isolate->ThrowException(Promise->Result());
                return v8::MaybeLocal<v8::Value>();
            }
        }
        return Module->GetModuleNamespace();
    }

    v8::MaybeLocal<v8::Function> CompileCjs(v8::Local<v8::Context> Context, FRecord* Record)
    {
        auto Content = Record->Content.Get(Isolate);
        auto Origin = MakeOrigin(Isolate, Record->DebugPath, false);
        if (Content->IsArrayBuffer())
        {
            if (!IsBytecodeSupported(Record->Url))
            {
                return v8::MaybeLocal<v8::Function>();
            }
#if defined(WITH_V8_BYTECODE)
            // bytecode of the classic script "(function (exports, require, module, __filename, __dirname) { ... \n});"
            auto Bytecode = Content.As<v8::ArrayBuffer>();
            v8::ScriptCompiler::Source Source(Placeholder(Bytecode, false), Origin, NewCachedData(Bytecode));
            v8::Local<v8::Script> Script;
            if (!v8::ScriptCompiler::Compile(Context, &Source, v8::ScriptCompiler::kConsumeCodeCache).ToLocal(&Script))
            {
                return v8::MaybeLocal<v8::Function>();
            }
            if (Source.GetCachedData()->rejected)
            {
                Throw(Isolate, "invalid bytecode: " + Record->Url);
                return v8::MaybeLocal<v8::Function>();
            }
            v8::Local<v8::Value> Func;
            if (!Script->Run(Context).ToLocal(&Func))
            {
                return v8::MaybeLocal<v8::Function>();
            }
            if (!Func->IsFunction())
            {
                Throw(Isolate, "invalid bytecode: " + Record->Url + " is not a commonjs module");
                return v8::MaybeLocal<v8::Function>();
            }
            return Func.As<v8::Function>();
#endif
        }
        v8::ScriptCompiler::Source Source(Content.As<v8::String>(), Origin);
        v8::Local<v8::String> Params[] = {Str(Isolate, "exports"), Str(Isolate, "require"), Str(Isolate, "module"),
            Str(Isolate, "__filename"), Str(Isolate, "__dirname")};
#if V8_MAJOR_VERSION >= 11
        return v8::ScriptCompiler::CompileFunction(Context, &Source, 5, Params, 0, nullptr);
#else
        return v8::ScriptCompiler::CompileFunctionInContext(Context, &Source, 5, Params, 0, nullptr);
#endif
    }

    static void RequireCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
    {
        const auto& V8Info = *reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(Info);
        auto Isolate = V8Info.GetIsolate();
        auto Context = Isolate->GetCurrentContext();
        if (V8Info.Length() < 1 || !V8Info[0]->IsString())
        {
            Isolate->ThrowException(v8::Exception::TypeError(Str(Isolate, "the module name must be a string")));
            return;
        }
        auto Referrer = static_cast<std::string*>(Apis->get_userdata(Info));
        auto Loader = Get(Isolate);
        FLoadScope Scope(Loader);
        auto Record = Loader->Resolve(Context, ToStd(Isolate, V8Info[0]), *Referrer, false);
        v8::Local<v8::Value> Result;
        if (Record && Loader->Require(Context, Record).ToLocal(&Result))
        {
            Scope.Succeeded = true;
            V8Info.GetReturnValue().Set(Result);
        }
    }

    static void RequireFinalize(struct pesapi_ffi* Apis, void* Data, void* EnvPrivate)
    {
        delete static_cast<std::string*>(Data);
    }

    v8::MaybeLocal<v8::Function> NewRequire(v8::Local<v8::Context> Context, const std::string& Referrer)
    {
        auto Data = new std::string(Referrer);
        auto Func = v8impl::g_pesapi_ffi.create_function(ToPapi(Context), &RequireCallback, Data, &RequireFinalize);
        if (!Func)
        {
            delete Data;
            return v8::MaybeLocal<v8::Function>();
        }
        return ToV8(Func).As<v8::Function>();
    }

    // require semantics: the value of the module, executes a cjs module on its first require
    v8::MaybeLocal<v8::Value> Require(v8::Local<v8::Context> Context, FRecord* Record)
    {
        switch (Record->Kind)
        {
            case EKind::Esm:
                return EvaluateEsm(Context, Record);
            case EKind::Cjs:
                break;
            default:
                return Record->Value.Get(Isolate);
        }

        auto ExportsName = Str(Isolate, "exports");
        if (Record->Executed)
        {
            // loaded, or a cycle (the exports may be incomplete)
            return Record->CjsModule.Get(Isolate)->Get(Context, ExportsName);
        }
        Record->Executed = true;

        auto Key = Record->Key;
        auto Module = v8::Object::New(Isolate);
        auto Exports = v8::Object::New(Isolate);
        v8::Local<v8::Function> Func;
        v8::Local<v8::Function> RequireFunc;
        v8::Local<v8::Value> Result;
        if (Module->Set(Context, ExportsName, Exports).FromMaybe(false) && CompileCjs(Context, Record).ToLocal(&Func) &&
            NewRequire(Context, Record->Url).ToLocal(&RequireFunc))
        {
            Record->Content.Reset();
            Record->CjsModule.Reset(Isolate, Module);
            auto Url = Record->Url;
            v8::Local<v8::Value> Args[] = {Exports, RequireFunc, Module, Str(Isolate, Url), Str(Isolate, DirName(Url))};
            if (Func->Call(Context, Exports, 5, Args).ToLocal(&Result) && Module->Get(Context, ExportsName).ToLocal(&Result))
            {
                return Result;
            }
        }
        // removed so a later require loads it again
        EraseRecord(Key);
        return v8::MaybeLocal<v8::Value>();
    }

    static void ReturnData(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        Info.GetReturnValue().Set(Info.Data());
    }

    // import semantics (dynamic import): the namespace, or a promise of it when the module has a top-level await
    v8::MaybeLocal<v8::Value> Import(v8::Local<v8::Context> Context, const std::string& Specifier, const std::string& Referrer)
    {
        FLoadScope Scope(this);
        auto Record = Resolve(Context, Specifier, Referrer, true);
        v8::Local<v8::Module> Module;
        if (!Record || !ModuleForImport(Context, Record).ToLocal(&Module))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        if (Module->GetStatus() == v8::Module::kUninstantiated &&
            !Module->InstantiateModule(Context, &ResolveModuleCallback).FromMaybe(false))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        v8::Local<v8::Value> Result;
        if (!Module->Evaluate(Context).ToLocal(&Result))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        Scope.Succeeded = true;
        auto Namespace = Module->GetModuleNamespace();
        if (Result->IsPromise())
        {
            v8::Local<v8::Function> OnFulfilled;
            v8::Local<v8::Promise> Chained;
            if (!v8::Function::New(Context, &ReturnData, Namespace).ToLocal(&OnFulfilled) ||
                !Result.As<v8::Promise>()->Then(Context, OnFulfilled).ToLocal(&Chained))
            {
                return v8::MaybeLocal<v8::Value>();
            }
            return Chained;
        }
        return Namespace;
    }

    struct FDynamicImport
    {
        v8::Isolate* Isolate;
        v8::Global<v8::Context> Context;
        v8::Global<v8::Promise::Resolver> Resolver;
        std::string Specifier;
        std::string Referrer;
    };

    // runs in a microtask as d8 / node, the host is not called inside the callback of v8
    static void DoImportDynamically(void* Data)
    {
        std::unique_ptr<FDynamicImport> Import(static_cast<FDynamicImport*>(Data));
        auto Isolate = Import->Isolate;
        auto Loader = Get(Isolate);
        if (!Loader)
        {
            return;
        }
        v8::HandleScope HandleScope(Isolate);
        auto Context = Import->Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Resolver = Import->Resolver.Get(Isolate);
        v8::TryCatch TryCatch(Isolate);
        v8::Local<v8::Value> Result;
        if (Loader->Import(Context, Import->Specifier, Import->Referrer).ToLocal(&Result))
        {
            (void) Resolver->Resolve(Context, Result);
            return;
        }
        if (TryCatch.HasTerminated())
        {
            return;
        }
        v8::Local<v8::Value> Exception = TryCatch.HasCaught()
                                             ? TryCatch.Exception()
                                             : v8::Exception::Error(Str(Isolate, "import " + Import->Specifier + " failed"));
        TryCatch.Reset();
        (void) Resolver->Reject(Context, Exception);
    }

    static v8::MaybeLocal<v8::Promise> ImportDynamically(
        v8::Local<v8::Context> Context, v8::Local<v8::Value> ResourceName, v8::Local<v8::String> Specifier)
    {
        auto Isolate = Context->GetIsolate();
        auto Loader = Get(Isolate);
        v8::Local<v8::Promise::Resolver> Resolver;
        if (!v8::Promise::Resolver::New(Context).ToLocal(&Resolver))
        {
            return v8::MaybeLocal<v8::Promise>();
        }
        if (!Loader)
        {
            (void) Resolver->Reject(Context, v8::Exception::Error(Str(Isolate, "[Puer001] the module loader is destroyed")));
            return Resolver->GetPromise();
        }
        auto Import = new FDynamicImport();
        Import->Isolate = Isolate;
        Import->Context.Reset(Isolate, Context);
        Import->Resolver.Reset(Isolate, Resolver);
        Import->Specifier = ToStd(Isolate, Specifier);
        // a script not loaded as a module (the bootstrap scripts, eval) imports relative to the root
        if (!ResourceName.IsEmpty() && ResourceName->IsString())
        {
            auto It = Loader->DebugPathToUrl.find(ToStd(Isolate, ResourceName));
            if (It != Loader->DebugPathToUrl.end())
            {
                Import->Referrer = It->second;
            }
        }
        Isolate->EnqueueMicrotask(&DoImportDynamically, Import);
        return Resolver->GetPromise();
    }

#if V8_MAJOR_VERSION >= 10
    static v8::MaybeLocal<v8::Promise> HostImportModuleDynamically(v8::Local<v8::Context> Context,
        v8::Local<v8::Data> HostDefinedOptions, v8::Local<v8::Value> ResourceName, v8::Local<v8::String> Specifier,
        v8::Local<v8::FixedArray> ImportAttributes)
    {
        return ImportDynamically(Context, ResourceName, Specifier);
    }
#elif V8_MAJOR_VERSION >= 9
    static v8::MaybeLocal<v8::Promise> HostImportModuleDynamically(v8::Local<v8::Context> Context,
        v8::Local<v8::ScriptOrModule> Referrer, v8::Local<v8::String> Specifier, v8::Local<v8::FixedArray> ImportAssertions)
    {
        return ImportDynamically(Context, Referrer->GetResourceName(), Specifier);
    }
#else
static v8::MaybeLocal<v8::Promise> HostImportModuleDynamically(
    v8::Local<v8::Context> Context, v8::Local<v8::ScriptOrModule> Referrer, v8::Local<v8::String> Specifier)
{
    return ImportDynamically(Context, Referrer->GetResourceName(), Specifier);
}
#endif

    static void MetaResolveCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
    {
        const auto& V8Info = *reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(Info);
        auto Isolate = V8Info.GetIsolate();
        auto Context = Isolate->GetCurrentContext();
        if (V8Info.Length() < 1 || !V8Info[0]->IsString())
        {
            Isolate->ThrowException(v8::Exception::TypeError(Str(Isolate, "the module name must be a string")));
            return;
        }
        auto Referrer = static_cast<std::string*>(Apis->get_userdata(Info));
        auto Loader = Get(Isolate);
        v8::Local<v8::Value> Url;
        if (Loader && Loader->ResolveUrl(Context, ToStd(Isolate, V8Info[0]), *Referrer).ToLocal(&Url))
        {
            V8Info.GetReturnValue().Set(Url);
        }
    }

    // import.meta: url (the url given by the host) and resolve(specifier)
    static void HostInitializeImportMeta(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> Meta)
    {
        auto Isolate = Context->GetIsolate();
        auto Loader = Get(Isolate);
        auto Record = Loader ? Loader->FindRecord(Module) : nullptr;
        if (!Record)
        {
            return;
        }
        (void) Meta->CreateDataProperty(Context, Str(Isolate, "url"), Str(Isolate, Record->Url));
        auto Data = new std::string(Record->Url);
        auto Func = v8impl::g_pesapi_ffi.create_function(ToPapi(Context), &MetaResolveCallback, Data, &RequireFinalize);
        if (!Func)
        {
            delete Data;
            return;
        }
        (void) Meta->CreateDataProperty(Context, Str(Isolate, "resolve"), ToV8(Func));
    }
};

FModuleLoader* CreateModuleLoader(pesapi_env Env)
{
    auto Isolate = ToV8(Env)->GetIsolate();
    auto Loader = new FModuleLoader(Isolate);
    Isolate->SetData(PUERTS_MODULE_LOADER_DATA_POS_IN_ISOLATE, Loader);
    Isolate->SetHostImportModuleDynamicallyCallback(&FModuleLoader::HostImportModuleDynamically);
    Isolate->SetHostInitializeImportMetaObjectCallback(&FModuleLoader::HostInitializeImportMeta);
    return Loader;
}

void DestroyModuleLoader(FModuleLoader* Loader)
{
    if (Loader)
    {
        Loader->Isolate->SetData(PUERTS_MODULE_LOADER_DATA_POS_IN_ISOLATE, nullptr);
        delete Loader;
    }
}

pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    FModuleLoader::FLoadScope Scope(Loader);
    auto Record = Loader->Resolve(Context, Specifier, Referrer ? Referrer : "", ByImport);
    v8::Local<v8::Value> Result;
    if (!Record || !Loader->Require(Context, Record).ToLocal(&Result))
    {
        return nullptr;
    }
    Scope.Succeeded = true;
    return ToPapi(Result);
}

pesapi_value CreateRequire(pesapi_env Env, const char* Referrer)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    v8::Local<v8::Function> Func;
    if (!Loader->NewRequire(Context, Referrer ? Referrer : "").ToLocal(&Func))
    {
        return nullptr;
    }
    return ToPapi(Func.As<v8::Value>());
}

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    auto Key = MakeKey(EKind::Builtin, Name);
    Loader->EraseRecord(Key);
    auto Record = Loader->AddRecord(EKind::Builtin, Name, Name);
    Record->Value.Reset(Loader->Isolate, ToV8(Value));
}

void SetFallbackRequire(pesapi_env Env, pesapi_value Require)
{
    auto Loader = FModuleLoader::Get(ToV8(Env)->GetIsolate());
    auto Value = ToV8(Require);
    if (Value.IsEmpty() || !Value->IsFunction())
    {
        Loader->FallbackRequire.Reset();
        return;
    }
    Loader->FallbackRequire.Reset(Loader->Isolate, Value.As<v8::Function>());
}

void SetCodeCacheExpect(pesapi_env Env, uint32_t FlagHash, uint32_t ReadOnlySnapshotChecksum)
{
    auto Loader = FModuleLoader::Get(ToV8(Env)->GetIsolate());
    Loader->ExpectFlagHash = FlagHash;
    Loader->ExpectReadOnlySnapshotChecksum = ReadOnlySnapshotChecksum;
    Loader->HasCodeCacheExpect = true;
}
}    // namespace papi_v8
}    // namespace PUERTS_NAMESPACE

#endif
