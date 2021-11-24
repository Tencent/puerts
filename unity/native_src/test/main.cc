#include "JSEngine.h"
#include "stdio.h"

using namespace std;

const char* ResolveModule(const char* identifer, int32_t jsEnvIdx)
{
    printf("ResolveModule:%s\n", identifer);
    if (strcmp(identifer, "main") == 0) 
    {
        return "export delete;";
    }
    else if (strcmp(identifer, "lib") == 0) {
        return "const a = 'Hello World'; export { a }; ";
    }
}

void LogCallback(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, void* Self, int ParamLen, int64_t UserData)
{
    // printf("LogCallbacked\n");
    if (Info[0]->IsString()) {
        v8::String::Utf8Value value(Isolate, Info[0]);
        std::string valueString(*value, value.length());

        printf("%s\n", valueString.c_str());
    }
}

int main(int argc, char** argv)
{
    puerts::JSEngine engine(nullptr, nullptr);
    engine.ModuleResolver = ResolveModule;
    engine.SetGlobalFunction("log", LogCallback, 0);
    printf("start execute\n");
    engine.ExecuteModule("main");
    // engine.Eval("log1('Hello World')", "");
    printf("LastExceptionInfo:%s\n", engine.LastExceptionInfo.c_str());
    engine.CreateInspector(9222);

    while (true)
    {
        engine.LogicTick();
        engine.InspectorTick();
    }
}