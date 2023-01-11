#include <algorithm>
#include "Log.h"
#include "V8InspectorImpl.h"

namespace puerts
{
    class BackendEnv 
    {
    public:
        ~BackendEnv() {
            PathToModuleMap.clear();
            ScriptIdToPathMap.clear();
        }
        BackendEnv()
        {
            Inspector = nullptr;
        } 

        // Module
        std::map<std::string, v8::UniquePersistent<v8::Module>> PathToModuleMap;
        std::map<int, std::string> ScriptIdToPathMap;

        // PromiseCallback
        v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;
        
        // Inspector
        V8Inspector* Inspector;

        V8_INLINE static BackendEnv* Get(v8::Isolate* Isolate)
        {
            return (BackendEnv*)Isolate->GetData(1);
        }
        
        void CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port)
        {
    #ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
    #endif
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            if (Inspector == nullptr)
            {
                Inspector = CreateV8Inspector(Port, &Context);
            }
        }

        void DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal)
        {
    #ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
    #endif
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            if (Inspector != nullptr)
            {
                delete Inspector;
                Inspector = nullptr;
            }
        }

        bool InspectorTick()
        {
            if (Inspector != nullptr)
            {
                return Inspector->Tick();
            }
            return true;
        }
    };



    namespace esmodule 
    {
        bool IsAbsolutePath(const std::string& path) {
    #if defined(_WIN32) || defined(_WIN64)
        // This is an incorrect approximation, but should
        // work for all our test-running cases.
            return path.find(':') != std::string::npos;
    #else
            return path[0] == '/';
    #endif
        }
        bool IsRelativePath(const std::string& path) {
            if (path[0] == '.') {
                if (path.length() == 1 || path[1] == '/') return true;
                if (path[1] == '.') {
                    if (path.length() == 2 || path[2] == '/') return true;
                }
            }
            return false;
        }

        // Returns the directory part of path, without the trailing '/'.
        std::string DirName(const std::string& path) { 
            size_t last_slash = path.find_last_of('/');
            if (last_slash == std::string::npos) return ".";
            return path.substr(0, last_slash);
        }

        // Resolves path to an absolute path if necessary, and does some
        // normalization (eliding references to the current directory
        // and replacing backslashes with slashes).
        std::string NormalizePath(const std::string& path,
                                const std::string& from_path) {
            std::string absolute_path;
            if (IsRelativePath(path)) {
                absolute_path = DirName(from_path) + '/' + path;
            } else {
                absolute_path = path;
            }
            std::replace(absolute_path.begin(), absolute_path.end(), '\\', '/');
            std::vector<std::string> segments;
            std::istringstream segment_stream(absolute_path);
            std::string segment;
            while (std::getline(segment_stream, segment, '/')) {
                if (segment == "..") {
                    segments.pop_back();
                } else if (segment != ".") {
                    segments.push_back(segment);
                }
            }
            // Join path segments.
            std::ostringstream os;
            std::copy(segments.begin(), segments.end() - 1,
                    std::ostream_iterator<std::string>(os, "/"));
            os << *segments.rbegin();
            return os.str();
        }
        
        v8::MaybeLocal<v8::Module> _ResolveModule(
            v8::Local<v8::Context> Context,
            v8::Local<v8::String> Specifier,
            v8::Local<v8::Module> Referrer,
            bool& isFromCache
        )
        {
            v8::Isolate* Isolate = Context->GetIsolate();
            BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);

            v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
            std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());

            const auto referIter = mm->ScriptIdToPathMap.find(Referrer->ScriptId()); 
            if (referIter != mm->ScriptIdToPathMap.end())
            {
                std::string referPath_std = referIter->second;
                Specifier_std = NormalizePath(Specifier_std, referPath_std);
            }

            const auto cacheIter = mm->PathToModuleMap.find(Specifier_std);
            if (cacheIter != mm->PathToModuleMap.end())//create and link
            {
                isFromCache = true;
                return v8::Local<v8::Module>::New(Isolate, cacheIter->second);
            }
            Specifier = v8::String::NewFromUtf8(Isolate, Specifier_std.c_str()).ToLocalChecked();
            
            v8::Local<v8::Function> ModuleResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puerts_resolve_module_content__").ToLocalChecked()).ToLocalChecked());
            v8::Local<v8::Module> Module;
            char* pathForDebug;

            std::vector< v8::Local<v8::Value>> V8Args;
            V8Args.push_back(Specifier);
            v8::MaybeLocal<v8::Value> maybeRet = ModuleResolveFunction->Call(Context, Context->Global(), 1, V8Args.data());
            V8Args.clear();

            if (maybeRet.IsEmpty()) 
            {
                // const std::string ErrorMessage = std::string("[Puer] module not found ") + Specifier_std;
                // Isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(Isolate, ErrorMessage.c_str()).ToLocalChecked()));
                return v8::MaybeLocal<v8::Module> {};
            }
            v8::Local<v8::String> Code = v8::Local<v8::String>::Cast(maybeRet.ToLocalChecked());

            v8::ScriptOrigin Origin(Specifier,
                                v8::Integer::New(Isolate, 0),                      // line offset
                                v8::Integer::New(Isolate, 0),                    // column offset
                                v8::True(Isolate),                    // is cross origin
                                v8::Local<v8::Integer>(),                 // script id
                                v8::Local<v8::Value>(),                   // source map URL
                                v8::False(Isolate),                   // is opaque (?)
                                v8::False(Isolate),                   // is WASM
                                v8::True(Isolate),                    // is ES Module
                                v8::PrimitiveArray::New(Isolate, 10));

            v8::ScriptCompiler::CompileOptions options;

            v8::ScriptCompiler::Source Source(Code, Origin);

            if (!v8::ScriptCompiler::CompileModule(Isolate, &Source, v8::ScriptCompiler::kNoCompileOptions)
                    .ToLocal(&Module)) 
            {
                return v8::MaybeLocal<v8::Module> {};
            }
            mm->ScriptIdToPathMap[Module->ScriptId()] = Specifier_std;
            mm->PathToModuleMap[Specifier_std] = v8::UniquePersistent<v8::Module>(Isolate, Module);
            return Module;
        }
        v8::MaybeLocal<v8::Module> ResolveModule(
            v8::Local<v8::Context> Context,
            v8::Local<v8::String> Specifier,
            v8::Local<v8::Module> Referrer
        )
        {
            bool isFromCache = false;
            return _ResolveModule(Context, Specifier, Referrer, isFromCache);
        }

        bool LinkModule(
            v8::Local<v8::Context> Context,
            v8::Local<v8::Module> RefModule
        )
        {
            v8::Isolate* Isolate = Context->GetIsolate();

            for (int i = 0, length = RefModule->GetModuleRequestsLength(); i < length; i++)
            {
                v8::Local<v8::String> Specifier_v8 = RefModule->GetModuleRequest(i);

                bool isFromCache = false;
                v8::MaybeLocal<v8::Module> MaybeModule = _ResolveModule(Context, Specifier_v8, RefModule, isFromCache);
                if (MaybeModule.IsEmpty())
                {
                    return false;
                }
                if (!isFromCache) 
                {
                    if (!LinkModule(Context, MaybeModule.ToLocalChecked())) 
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        void HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta)
        {
            v8::Isolate* Isolate = Context->GetIsolate();
            BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);

            auto iter = mm->ScriptIdToPathMap.find(Module->ScriptId());
            if (iter != mm->ScriptIdToPathMap.end()) 
            {
                meta->CreateDataProperty(
                    Context, 
                    v8::String::NewFromUtf8(Isolate, "url").ToLocalChecked(),
                    v8::String::NewFromUtf8(Isolate, iter->second.c_str()).ToLocalChecked()
                ).ToChecked();
            }
        }
    }
}