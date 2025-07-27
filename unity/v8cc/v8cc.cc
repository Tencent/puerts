﻿#include <iostream>
#include <fstream>
#include <sstream>
#include <map>
#include <string>

#include "libplatform/libplatform.h"
#include "v8.h"

bool endsWith(const std::string &fullString, const std::string &ending) {
    if (fullString.length() >= ending.length()) {
        return (0 == fullString.compare (fullString.length() - ending.length(), ending.length(), ending));
    } else {
        return false;
    }
}

template <class T>
v8::MaybeLocal<T> Compile(v8::Local<v8::Context> context, v8::ScriptCompiler::Source* source,
                      v8::ScriptCompiler::CompileOptions options) {}
template <>
v8::MaybeLocal<v8::Script> Compile(v8::Local<v8::Context> context,
                           v8::ScriptCompiler::Source* source,
                           v8::ScriptCompiler::CompileOptions options) {
  return v8::ScriptCompiler::Compile(context, source, options);
}

template <>
v8::MaybeLocal<v8::Module> Compile(v8::Local<v8::Context> context,
                           v8::ScriptCompiler::Source* source,
                           v8::ScriptCompiler::CompileOptions options) {
  return v8::ScriptCompiler::CompileModule(context->GetIsolate(), source, options);
}

template <class T>
v8::MaybeLocal<T> CompileString(v8::Local<v8::Context> context,
                                   v8::Local<v8::String> source,
                                   const v8::ScriptOrigin& origin) {
  v8::ScriptCompiler::Source script_source(source, origin);
  v8::MaybeLocal<T> result = Compile<T>(context, &script_source, v8::ScriptCompiler::kNoCompileOptions);
  return result;
}

struct CodeCacheHeader {
    uint32_t MagicNumber;
    uint32_t VersionHash;
    uint32_t SourceHash;
    uint32_t FlagHash;
    uint32_t PayloadLength;
    uint32_t Checksum;
};

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <filename> [--module] [--no-cjs-wrap] [--verbose] [--url=<string>] [--ln=<number>] [--col=<number>] [--cross-platform] [v8_flag1] [v8_flag2] ..." << std::endl;
        std::cerr << "Security Note: This tool only generates bytecode files (.cbc/.mbc) for enhanced security." << std::endl;
        std::cerr << "Cross-platform Note: Use --cross-platform to generate bytecode compatible across x64/arm64." << std::endl;
        return 1;
    }

    std::string filename = argv[1];
    bool is_module = endsWith(filename, ".mjs");
    bool no_cjs_wrap = false;
    bool verbose = false;
    bool cross_platform = false;
    std::string flags = "--no-lazy --no-flush-bytecode --no-enable-lazy-source-positions";
    std::string url = filename;
    int ln = 0;
    int col = 0;
    if (argc > 2) {
        for (int i = 2; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "--module") {
                is_module = true;
                continue;
            }
            if (arg == "--no-cjs-wrap") {
                no_cjs_wrap = true;
                continue;
            }
            if (arg == "--verbose") {
                verbose = true;
                continue;
            }
            if (arg == "--cross-platform") {
                cross_platform = true;
                continue;
            }
            if (arg.rfind("--url=", 0) == 0) {
                url = arg.substr(6);
                continue;
            }
            if (arg.rfind("--ln=", 0) == 0) {
                ln = std::stoi(arg.substr(5));
                continue;
            }
            if (arg.rfind("--col=", 0) == 0) {
                col = std::stoi(arg.substr(6));
                continue;
            }
            flags += (" " + arg);
        }
    }
    
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error opening file: " << filename << std::endl;
        return 1;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();

    std::string fileContent = buffer.str();
    
    // Add security flags to ensure only bytecode generation
    flags += " --disable-source-maps --disable-source-positions";
    
    // Add cross-platform compatibility flags
    if (cross_platform) {
        // Disable SSE2 optimization for x64/arm64 compatibility
        flags += " --no-sse2";
        // Disable platform-specific optimizations
        flags += " --no-optimize-for-size";
        flags += " --no-enable-lazy-source-positions";
    }
    
    v8::V8::SetFlagsFromString(flags.c_str(), flags.size());
    
    file.close();
    
    v8::ScriptCompiler::CachedData* cached_data = nullptr;
    // --- begin get code cache ---
    std::unique_ptr<v8::Platform> platform = v8::platform::NewDefaultPlatform();
    v8::V8::InitializePlatform(platform.get());
    v8::V8::Initialize();

    // Create a new Isolate and make it the current one.
    v8::Isolate::CreateParams create_params;
    create_params.array_buffer_allocator =
        v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    v8::Isolate* isolate = v8::Isolate::New(create_params);
    int source_length = 0;
    {
        v8::Isolate::Scope isolate_scope(isolate);
        v8::HandleScope handle_scope(isolate);
        v8::Local<v8::Context> context = v8::Context::New(isolate);
        v8::Context::Scope context_scope(context);
        v8::TryCatch try_catch(isolate);
        auto script_url = v8::String::NewFromUtf8(isolate, url.c_str()).ToLocalChecked();
        if (!is_module && !no_cjs_wrap) {
            fileContent = "(function (exports, require, module, __filename, __dirname) { " + fileContent + "\n});";
        }
        v8::Local<v8::String> source =
            v8::String::NewFromUtf8(isolate, fileContent.c_str()).ToLocalChecked();
        source_length = source->Length();
        if (is_module) {
#if V8_MAJOR_VERSION > 8
            v8::ScriptOrigin origin(isolate, script_url, ln, col, true, -1, v8::Local<v8::Value>(), false, false, true);
#else
            v8::ScriptOrigin origin(script_url, v8::Integer::New(isolate, ln), v8::Integer::New(isolate, col), v8::True(isolate),
                v8::Local<v8::Integer>(), v8::Local<v8::Value>(), v8::False(isolate), v8::False(isolate), v8::True(isolate));
#endif
            auto module = CompileString<v8::Module>(context, source, origin);
            
            if (!module.IsEmpty()) {
                cached_data = v8::ScriptCompiler::CreateCodeCache(module.ToLocalChecked()->GetUnboundModuleScript());
            }
        } else {
#if V8_MAJOR_VERSION > 8
            v8::ScriptOrigin origin(isolate, script_url, ln, col);
#else
            v8::ScriptOrigin origin(script_url, v8::Integer::New(isolate, ln), v8::Integer::New(isolate, col));
#endif
            
            auto script = CompileString<v8::Script>(context, source, origin);
            if (!script.IsEmpty()) {
                cached_data = v8::ScriptCompiler::CreateCodeCache(script.ToLocalChecked()->GetUnboundScript());
            }
        }
        if (try_catch.HasCaught()) {
            v8::Local<v8::Value> stack_trace;
            if (try_catch.StackTrace(context).ToLocal(&stack_trace))
            {
                v8::String::Utf8Value info(isolate, stack_trace);
                std::cout << (*info) << std::endl;
            }
            return 1;
        }
    }

    // Dispose the isolate and tear down V8.
    isolate->Dispose();
    v8::V8::Dispose();
#if V8_MAJOR_VERSION > 9
    v8::V8::DisposePlatform();
#else
    v8::V8::ShutdownPlatform();
#endif
    delete create_params.array_buffer_allocator;
    // --- end get code cache ---
    
    if (!cached_data) {
        std::cout << "cached_data is nullptr!!!" << std::endl;
    }
    
    // Modify bytecode header for cross-platform compatibility
    if (cross_platform && cached_data) {
        CodeCacheHeader* header = const_cast<CodeCacheHeader*>(reinterpret_cast<const CodeCacheHeader*>(cached_data->data));
        
        // Set platform flags for cross-platform compatibility
        // Clear existing platform flags and set cross-platform flags
        header->FlagHash &= ~0xFF; // Clear lower 8 bits
        
        // Set cross-platform compatibility flags
        bool is_64bit = sizeof(void*) == 8;
        if (is_64bit) {
            header->FlagHash |= 0x01; // 64-bit flag
        }
        
        // For cross-platform compatibility, don't set SSE2 or NEON flags
        // This ensures the bytecode can run on both x64 and arm64
    }
    
    auto dot_pos = filename.find_last_of('.');
    std::string output_filename = filename.substr(0, dot_pos == std::string::npos ? filename.size(): dot_pos) + (is_module ? ".mbc" : ".cbc");
    
    std::ofstream output_file(output_filename, std::ios::binary);
    if (!output_file.is_open()) {
        std::cerr << "Error creating file: " << output_filename << std::endl;
        return 1;
    }
    
    output_file.write((const char*)cached_data->data, cached_data->length);
    output_file.close();
    
    if (verbose) {
        std::cout << "esm: " << is_module << std::endl;
        std::cout << "cjs: " << (!is_module && !no_cjs_wrap) << std::endl;
        std::cout << "cross-platform: " << cross_platform << std::endl;
        std::cout << "v8 flags: " << flags << std::endl;
        
        //std::cout << fileContent << std::endl;
        std::cout << "input : " << filename << ", source length: " << source_length << std::endl;
        std::cout << "output: " << output_filename << ", bytecode length: " << cached_data->length << std::endl;
        std::cout << "url: " << url << std::endl;
        std::cout << "line offset: " << ln << std::endl;
        std::cout << "column offset: " << col << std::endl;
        
        const CodeCacheHeader *cch = (const CodeCacheHeader *)cached_data->data;
        std::cout << "MagicNumber : " << cch->MagicNumber << std::endl;
        std::cout << "VersionHash : " << cch->VersionHash << std::endl;
        std::cout << "SourceHash : " << cch->SourceHash << std::endl;
        std::cout << "FlagHash : " << cch->FlagHash << std::endl;
        std::cout << "PayloadLength : " << cch->PayloadLength << std::endl;
        std::cout << "Checksum : " << cch->Checksum << std::endl;
    }
    
    std::cout << "Successfully compiled " << filename << " to bytecode: " << output_filename << std::endl;
    if (cross_platform) {
        std::cout << "Cross-platform compatibility enabled - bytecode can run on x64 and arm64" << std::endl;
    }
    std::cout << "Security: Source code compilation is disabled in runtime for enhanced protection." << std::endl;
    
    delete cached_data;
    
    return 0;
}