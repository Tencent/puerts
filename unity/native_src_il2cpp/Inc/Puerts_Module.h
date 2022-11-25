
namespace puerts_module 
{
    void HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta)
    {
        // v8::Isolate* Isolate = Context->GetIsolate();
        // auto* JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);

        // auto iter = JsEngine->ScriptIdToPathMap.find(Module->ScriptId());
        // if (iter != JsEngine->ScriptIdToPathMap.end()) 
        // {
        //     meta->CreateDataProperty(
        //         Context, 
        //         v8::String::NewFromUtf8(Isolate, "url").ToLocalChecked(),
        //         v8::String::NewFromUtf8(Isolate, ("puer:" + iter->second).c_str()).ToLocalChecked()
        //     ).ToChecked();
        // }
    }

    v8::MaybeLocal<v8::Module> _ResolveModule(
        v8::Local<v8::Context> Context,
        v8::Local<v8::String> Specifier,
        v8::Local<v8::Module> Referrer,
        bool& isFromCache
    )
    {
        v8::Isolate* Isolate = Context->GetIsolate();
        // auto* JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);

        v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
        std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());

        // const auto referIter = JsEngine->ScriptIdToPathMap.find(Referrer->ScriptId()); 
        // if (referIter != JsEngine->ScriptIdToPathMap.end())
        // {
        //     std::string referPath_std = referIter->second;
        //     Specifier_std = NormalizePath(Specifier_std, referPath_std);
        // }

        // const auto cacheIter = JsEngine->PathToModuleMap.find(Specifier_std);
        // if (cacheIter != JsEngine->PathToModuleMap.end())//create and link
        // {
        //     isFromCache = true;
        //     return v8::Local<v8::Module>::New(Isolate, cacheIter->second);
        // }
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

        v8::ScriptOrigin Origin(v8::String::NewFromUtf8(Isolate, (const char*)pathForDebug).ToLocalChecked(),
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
            // JsEngine->SetLastException(TryCatch.Exception());
            return v8::MaybeLocal<v8::Module> {};
        }
        // JsEngine->ScriptIdToPathMap[Module->ScriptId()] = Specifier_std;
        // JsEngine->PathToModuleMap[Specifier_std] = v8::UniquePersistent<v8::Module>(Isolate, Module);
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
}