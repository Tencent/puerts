# papi_test

pesapi (papi) + static binding test for the unreal plugin, runs without unreal engine.

- `addon/`: the `hello` module, classes are registered by `puerts::DefineClass<T>()...Register()` and the module is declared by `PUERTS_PESAPI_MODULE(hello, Init)`. The sources have no build specific code, the same files are built in three ways:
  - ctest `papi_test`: a pesapi addon (`BUILDING_PES_EXTENSION`, `PesapiBackend.hpp`) loaded by `papi_test_host`.
  - ctest `papi_test_static`: linked into `papi_test_host_static` with the default `pesapi_impl` binding (`PesapiBackend.hpp`).
  - ctest `papi_test_v8`: linked into `papi_test_host_v8` with `PUERTS_BINDING_IMPL=v8_impl` (`V8Backend.hpp`).
  When linked in, `PUERTS_PESAPI_MODULE` registers the classes during static initialization. The script names are `hello.<class>` in all three builds.
- `host/`: a minimal v8 host built from `Puerts/Source/ScriptEnv` and `Puerts/Source/PapiV8` sources (`PesapiV8Impl.cpp`, `PesapiRegister.cpp`, `CppObjectMapper.cpp`, `JSClassRegister.cpp`, `DataTransfer.cpp`), it loads the addon the same way as `PesapiAddonLoad.cpp` and runs `test.js`.
- `test.js`: test cases with assertions, ported from `puerts_node/test`, the same script for all three builds.

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
