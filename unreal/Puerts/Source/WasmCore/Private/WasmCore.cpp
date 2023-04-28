#include "WasmCore.h"

#define LOCTEXT_NAMESPACE "WasmCoreModule"

void WasmCoreModule::StartupModule()
{
}

void WasmCoreModule::ShutdownModule()
{
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(WasmCoreModule, WasmCore)