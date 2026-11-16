/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiV8ModuleLoader.h"
#include "DataTransfer.h"
#include "PesapiImpl.h"

#include <cstring>
#include <memory>
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
    Builtin = 'b',
    // a file other than esm imported, required by the require hook
    Synthetic = 's'
};

struct FRecord
{
    EKind Kind;
    PString Key;
    PString Url;
    // esm: the module; others: the synthetic module created when imported by an esm
    v8::Global<v8::Module> Module;
    // builtin: the value; synthetic: the exports, set when the synthetic module is created
    v8::Global<v8::Value> Value;
    // esm: specifier -> module, filled while fetching the module tree
    std::unordered_map<PString, v8::Global<v8::Module>> Requests;
    // the synthetic module: the named exports (own properties of Value when it is created)
    std::vector<v8::Global<v8::String>> ExportNames;
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

inline v8::Local<v8::String> Str(v8::Isolate* Isolate, const PString& S)
{
    return v8::String::NewFromUtf8(Isolate, S.c_str(), v8::NewStringType::kNormal, static_cast<int>(S.size())).ToLocalChecked();
}

inline PString ToPString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
{
    v8::String::Utf8Value Utf8(Isolate, Value);
    return *Utf8 ? PString(*Utf8, Utf8.length()) : PString();
}

inline void Throw(v8::Isolate* Isolate, const PString& Message)
{
    Isolate->ThrowException(v8::Exception::Error(Str(Isolate, Message)));
}

inline v8::ScriptOrigin MakeOrigin(v8::Isolate* Isolate, const PString& Name, bool IsModule)
{
#if V8_MAJOR_VERSION > 8
    return v8::ScriptOrigin(Isolate, Str(Isolate, Name), 0, 0, false, -1, v8::Local<v8::Value>(), false, false, IsModule);
#else
    return v8::ScriptOrigin(Str(Isolate, Name), v8::Local<v8::Integer>(), v8::Local<v8::Integer>(), v8::Local<v8::Boolean>(),
        v8::Local<v8::Integer>(), v8::Local<v8::Value>(), v8::Local<v8::Boolean>(), v8::Local<v8::Boolean>(),
        v8::Boolean::New(Isolate, IsModule));
#endif
}

PString MakeKey(EKind Kind, const PString& Url)
{
    PString Key;
    Key += static_cast<char>(Kind);
    Key += Url;
    return Key;
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

void FinalizePString(struct pesapi_ffi* Apis, void* Data, void* EnvPrivate)
{
    delete static_cast<PString*>(Data);
}
}    // namespace

class FModuleLoader
{
public:
    FModuleLoader(v8::Isolate* InIsolate, FLoadFileFunc InLoadFile, FLoadAddonFunc InLoadAddon)
        : Isolate(InIsolate), LoadFile(std::move(InLoadFile)), LoadAddon(std::move(InLoadAddon))
    {
    }

    ~FModuleLoader()
    {
        Records.clear();
        ModuleToRecord.clear();
        RequireHook.Reset();
        ResolveHook.Reset();
    }

    v8::Isolate* const Isolate;
    FLoadFileFunc LoadFile;
    FLoadAddonFunc LoadAddon;
    // see SetHooks
    v8::Global<v8::Function> RequireHook;
    v8::Global<v8::Function> ResolveHook;
    std::unordered_map<PString, std::unique_ptr<FRecord>> Records;
    std::unordered_multimap<int, FRecord*> ModuleToRecord;
    // the resource name (debug path) of the scripts -> url, the referrer of a dynamic import is known by the resource name
    std::unordered_map<PString, PString> DebugPathToUrl;
    // keys of the esm records added by the running loads, the ones not evaluated are removed if the load fails
    std::vector<PString> PendingEsm;
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

    FRecord* AddRecord(EKind Kind, const PString& Url)
    {
        auto Key = MakeKey(Kind, Url);
        auto Record = std::make_unique<FRecord>();
        Record->Kind = Kind;
        Record->Key = Key;
        Record->Url = Url;
        auto Ptr = Record.get();
        Records[Key] = std::move(Record);
        if (Kind == EKind::Esm)
        {
            PendingEsm.push_back(Key);
        }
        return Ptr;
    }

    FRecord* FindRecord(EKind Kind, const PString& Url)
    {
        auto It = Records.find(MakeKey(Kind, Url));
        return It == Records.end() ? nullptr : It->second.get();
    }

    void EraseRecord(const PString& Key)
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

    // the builtin module of the name, an addon is loaded on its first use
    FRecord* FindBuiltin(v8::Local<v8::Context> Context, const PString& Name)
    {
        auto Record = FindRecord(EKind::Builtin, Name);
        if (!Record && LoadAddon && IsBareName(Name) && LoadAddon(ToPapi(Context), Name.c_str()))
        {
            Record = FindRecord(EKind::Builtin, Name);
        }
        return Record;
    }

    // the path of the specifier by the resolve hook (called with the directory of the referrer) or the default rules, false
    // with an exception thrown
    bool ResolvePath(v8::Local<v8::Context> Context, const PString& Specifier, const PString& Referrer, PString& OutPath)
    {
        if (!ResolveHook.IsEmpty())
        {
            v8::Local<v8::Value> Args[] = {Str(Isolate, Specifier), Str(Isolate, DirName(Referrer))};
            v8::Local<v8::Value> Path;
            if (!ResolveHook.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 2, Args).ToLocal(&Path))
            {
                return false;
            }
            if (Path->IsString())
            {
                OutPath = ToPString(Isolate, Path);
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
    v8::MaybeLocal<v8::Value> ResolveUrl(v8::Local<v8::Context> Context, const PString& Specifier, const PString& Referrer)
    {
        if (FindRecord(EKind::Builtin, Specifier))
        {
            return Str(Isolate, Specifier).As<v8::Value>();
        }
        PString Path;
        if (!ResolvePath(Context, Specifier, Referrer, Path))
        {
            return v8::MaybeLocal<v8::Value>();
        }
        return Str(Isolate, Path).As<v8::Value>();
    }

    // resolves and loads (compiles for esm, without evaluating) the module, returns nullptr with an exception thrown
    FRecord* Resolve(v8::Local<v8::Context> Context, const PString& Specifier, const PString& Referrer)
    {
        if (auto Builtin = FindBuiltin(Context, Specifier))
        {
            return Builtin;
        }

        PString Path;
        if (!ResolvePath(Context, Specifier, Referrer, Path))
        {
            return nullptr;
        }

        if (!EndsWith(Path, ".mjs") && !EndsWith(Path, ".mbc"))
        {
            // required by the require hook when imported (ModuleForImport)
            if (auto Record = FindRecord(EKind::Synthetic, Path))
            {
                return Record;
            }
            return AddRecord(EKind::Synthetic, Path);
        }

        if (auto Record = FindRecord(EKind::Esm, Path))
        {
            return Record;
        }
        PString DebugPath;
        pesapi_value ContentValue = LoadFile ? LoadFile(ToPapi(Context), Path.c_str(), DebugPath) : nullptr;
        if (!ContentValue)
        {
            if (!Isolate->IsExecutionTerminating())
            {
                Throw(Isolate, Referrer.empty() ? "[Puer002] can not find module " + Path
                                                : "[Puer002] can not find module " + Path + " imported by " + Referrer);
            }
            return nullptr;
        }
        auto Content = ToV8(ContentValue);
        if (!Content->IsString() && !Content->IsArrayBuffer())
        {
            Throw(Isolate, "[Puer003] load " + Path + " failed: content must be a string or an ArrayBuffer");
            return nullptr;
        }
        return FetchEsm(Context, Path, DebugPath.empty() ? Path : DebugPath, Content);
    }

#if defined(WITH_V8_BYTECODE)
    // the source passed with bytecode, only its length is checked by v8
    v8::Local<v8::String> Placeholder(v8::Local<v8::ArrayBuffer> Bytecode, bool IsModule)
    {
        auto Header = static_cast<FCodeCacheHeader*>(DataTransfer::GetArrayBufferData(Bytecode));
        static constexpr uint32_t kModuleFlagMask = (1u << 31);
        uint32_t Length = IsModule ? (Header->SourceHash & ~kModuleFlagMask) : Header->SourceHash;
        std::vector<uint8_t> Spaces(Length, ' ');
        return v8::String::NewFromOneByte(Isolate, Spaces.data(), v8::NewStringType::kNormal, static_cast<int>(Spaces.size()))
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

    bool IsBytecodeSupported(const PString& Url)
    {
#if defined(WITH_V8_BYTECODE)
        return true;
#else
        Throw(Isolate, "[Puer003] load " + Url + " failed: bytecode is not supported");
        return false;
#endif
    }

    FRecord* FetchEsm(v8::Local<v8::Context> Context, const PString& Url, const PString& DebugPath, v8::Local<v8::Value> Content)
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

        auto Record = AddRecord(EKind::Esm, Url);
        DebugPathToUrl[DebugPath] = Url;
        BindModule(Record, Module);

#if V8_MAJOR_VERSION >= 9
        v8::Local<v8::FixedArray> ModuleRequests = Module->GetModuleRequests();
        for (int i = 0, Length = ModuleRequests->Length(); i < Length; ++i)
        {
            auto Specifier =
                ToPString(Isolate, ModuleRequests->Get(Context, i).As<v8::ModuleRequest>()->GetSpecifier().As<v8::Value>());
#else
        for (int i = 0, Length = Module->GetModuleRequestsLength(); i < Length; ++i)
        {
            auto Specifier = ToPString(Isolate, Module->GetModuleRequest(i));
#endif
            if (Record->Requests.find(Specifier) != Record->Requests.end())
            {
                continue;
            }
            auto Dep = Resolve(Context, Specifier, Url);
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
        auto Record = Loader ? Loader->FindRecord(Module) : nullptr;
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

    // the exports of the file required by the require hook, the record is removed on failure
    bool RequireSynthetic(v8::Local<v8::Context> Context, FRecord* Record)
    {
        if (!Record->Value.IsEmpty())
        {
            return true;
        }
        auto Key = Record->Key;
        auto Url = Record->Url;
        if (RequireHook.IsEmpty())
        {
            EraseRecord(Key);
            Throw(Isolate, "[Puer001] can not import " + Url + ": the require hook is not set");
            return false;
        }
        v8::Local<v8::Value> Arg = Str(Isolate, Url);
        v8::Local<v8::Value> Exports;
        if (!RequireHook.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, &Arg).ToLocal(&Exports))
        {
            EraseRecord(Key);
            return false;
        }
        // the record may be released by the module required (a builtin module registered again is the only case)
        auto It = Records.find(Key);
        if (It == Records.end() || It->second.get() != Record)
        {
            Throw(Isolate, "[Puer005] module record not found: " + Url);
            return false;
        }
        if (Record->Value.IsEmpty())
        {
            Record->Value.Reset(Isolate, Exports);
        }
        return true;
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
        if (Record->Kind == EKind::Synthetic && !RequireSynthetic(Context, Record))
        {
            return v8::MaybeLocal<v8::Module>();
        }
        if (!Record->Module.IsEmpty())
        {
            return Record->Module.Get(Isolate);
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
        auto Record = Loader ? Loader->FindRecord(Referrer) : nullptr;
        auto Name = ToPString(Isolate, Specifier);
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
            // imported synchronously by a module it imports (a cycle), the bindings not evaluated yet are in TDZ
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

    // synchronous import: the namespace of an esm, the value of the others
    v8::MaybeLocal<v8::Value> ImportSync(v8::Local<v8::Context> Context, const PString& Specifier, const PString& Referrer)
    {
        FLoadScope Scope(this);
        auto Record = Resolve(Context, Specifier, Referrer);
        if (!Record)
        {
            return v8::MaybeLocal<v8::Value>();
        }
        v8::Local<v8::Value> Result;
        if (Record->Kind == EKind::Esm)
        {
            if (!EvaluateEsm(Context, Record).ToLocal(&Result))
            {
                return v8::MaybeLocal<v8::Value>();
            }
        }
        else
        {
            if (Record->Kind == EKind::Synthetic && !RequireSynthetic(Context, Record))
            {
                return v8::MaybeLocal<v8::Value>();
            }
            Result = Record->Value.Get(Isolate);
        }
        Scope.Succeeded = true;
        return Result;
    }

    v8::MaybeLocal<v8::Function> CompileCjs(
        v8::Local<v8::Context> Context, v8::Local<v8::Value> Content, const PString& DebugPath, const PString& Path)
    {
        auto Origin = MakeOrigin(Isolate, DebugPath, false);
        // the dynamic imports in the module are relative to its path
        DebugPathToUrl[DebugPath] = Path;
        if (Content->IsArrayBuffer())
        {
            if (!IsBytecodeSupported(Path))
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
                Throw(Isolate, "invalid bytecode: " + Path);
                return v8::MaybeLocal<v8::Function>();
            }
            v8::Local<v8::Value> Func;
            if (!Script->Run(Context).ToLocal(&Func))
            {
                return v8::MaybeLocal<v8::Function>();
            }
            if (!Func->IsFunction())
            {
                Throw(Isolate, "invalid bytecode: " + Path + " is not a commonjs module");
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

    static void ReturnData(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        Info.GetReturnValue().Set(Info.Data());
    }

    // import semantics (dynamic import): the namespace, or a promise of it when the module has a top-level await
    v8::MaybeLocal<v8::Value> Import(v8::Local<v8::Context> Context, const PString& Specifier, const PString& Referrer)
    {
        FLoadScope Scope(this);
        auto Record = Resolve(Context, Specifier, Referrer);
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
        PString Specifier;
        PString Referrer;
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
        Import->Specifier = ToPString(Isolate, Specifier);
        // a script not loaded as a module (the bootstrap scripts, eval) imports relative to the root
        if (!ResourceName.IsEmpty() && ResourceName->IsString())
        {
            auto It = Loader->DebugPathToUrl.find(ToPString(Isolate, ResourceName));
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
        auto Referrer = static_cast<PString*>(Apis->get_userdata(Info));
        auto Loader = Get(Isolate);
        v8::Local<v8::Value> Url;
        if (Loader && Loader->ResolveUrl(Context, ToPString(Isolate, V8Info[0]), *Referrer).ToLocal(&Url))
        {
            V8Info.GetReturnValue().Set(Url);
        }
    }

    // import.meta: url (the path of the module) and resolve(specifier)
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
        auto Data = new PString(Record->Url);
        auto Func = v8impl::g_pesapi_ffi.create_function(ToPapi(Context), &MetaResolveCallback, Data, &FinalizePString);
        if (!Func)
        {
            delete Data;
            return;
        }
        (void) Meta->CreateDataProperty(Context, Str(Isolate, "resolve"), ToV8(Func));
    }
};

FModuleLoader* CreateModuleLoader(pesapi_env Env, FLoadFileFunc LoadFile, FLoadAddonFunc LoadAddon)
{
    auto Isolate = ToV8(Env)->GetIsolate();
    auto Loader = new FModuleLoader(Isolate, std::move(LoadFile), std::move(LoadAddon));
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

pesapi_value ImportModule(pesapi_env Env, const char* Specifier, const char* Referrer)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    if (!Loader)
    {
        Throw(Context->GetIsolate(), "[Puer001] the module loader is destroyed");
        return nullptr;
    }
    v8::Local<v8::Value> Result;
    if (!Loader->ImportSync(Context, Specifier, Referrer ? Referrer : "").ToLocal(&Result))
    {
        return nullptr;
    }
    return ToPapi(Result);
}

void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Value)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    Loader->EraseRecord(MakeKey(EKind::Builtin, Name));
    auto Record = Loader->AddRecord(EKind::Builtin, Name);
    Record->Value.Reset(Loader->Isolate, ToV8(Value));
}

pesapi_value GetBuiltinModule(pesapi_env Env, const char* Name)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    auto Record = Loader ? Loader->FindRecord(EKind::Builtin, Name) : nullptr;
    return Record ? ToPapi(Record->Value.Get(Loader->Isolate)) : nullptr;
}

void SetHooks(pesapi_env Env, pesapi_value Require, pesapi_value Resolve)
{
    auto Loader = FModuleLoader::Get(ToV8(Env)->GetIsolate());
    auto RequireValue = Require ? ToV8(Require) : v8::Local<v8::Value>();
    auto ResolveValue = Resolve ? ToV8(Resolve) : v8::Local<v8::Value>();
    if (!RequireValue.IsEmpty() && RequireValue->IsFunction())
    {
        Loader->RequireHook.Reset(Loader->Isolate, RequireValue.As<v8::Function>());
    }
    else
    {
        Loader->RequireHook.Reset();
    }
    if (!ResolveValue.IsEmpty() && ResolveValue->IsFunction())
    {
        Loader->ResolveHook.Reset(Loader->Isolate, ResolveValue.As<v8::Function>());
    }
    else
    {
        Loader->ResolveHook.Reset();
    }
}

pesapi_value CompileCjs(pesapi_env Env, pesapi_value Content, const char* DebugPath, const char* Path)
{
    auto Context = ToV8(Env);
    auto Loader = FModuleLoader::Get(Context->GetIsolate());
    v8::Local<v8::Function> Func;
    if (!Loader->CompileCjs(Context, ToV8(Content), DebugPath, Path).ToLocal(&Func))
    {
        return nullptr;
    }
    return ToPapi(Func.As<v8::Value>());
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
