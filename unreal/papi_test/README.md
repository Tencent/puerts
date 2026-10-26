# papi_test

pesapi (papi) + static binding test for the unreal plugin, runs without unreal engine.

- `addon/`: a pesapi addon (`hello`), built with `BUILDING_PES_EXTENSION`, classes are registered by `puerts::DefineClass<T>()...Register()` (`PesapiBackend.hpp`) and exported by `PUERTS_PESAPI_MODULE(hello, Init)`.
- `host/`: a minimal v8 host built from `Puerts/Source/JsEnv` sources (`PesapiV8Impl.cpp`, `PesapiRegister.cpp`, `CppObjectMapper.cpp`, `JSClassRegister.cpp`, `DataTransfer.cpp`), it loads the addon the same way as `PesapiAddonLoad.cpp` and runs `test.js`.
- `papi_test_host_v8`: the same host with the `addon/` sources linked in and built with `PUERTS_BINDING_IMPL=v8_impl`, so the same classes are bound by `V8Backend.hpp`. `test.js` runs against both bindings (ctest `papi_test` and `papi_test_v8`), class names are prefixed by `MODULE_PREFIX` (`hello.` for the addon, empty for the v8 binding).
- `test.js`: test cases with assertions, ported from `puerts_node/test`.

## build & run

Download [v8_bin_9.4.146.24.tgz](https://github.com/puerts/backend-v8/releases/download/V8_9.4.146.24__241009/v8_bin_9.4.146.24.tgz) and extract it to `unreal/Puerts/ThirdParty` (or pass `-DV8_ROOT=...`), then:

```bash
cmake -S unreal/papi_test -B unreal/papi_test/build
cmake --build unreal/papi_test/build --config Release
ctest --test-dir unreal/papi_test/build -C Release --output-on-failure
```

On linux, clang with libc++ is required (the libwee8.a is built against libc++):

```bash
CC=clang CXX=clang++ cmake -S unreal/papi_test -B unreal/papi_test/build -DCMAKE_BUILD_TYPE=Release
```

CI: `.github/workflows/unreal_papi_test.yml`
