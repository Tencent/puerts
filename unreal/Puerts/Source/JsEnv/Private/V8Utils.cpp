#include <V8Utils.h>

v8::Local<v8::String> puerts::FV8Utils::ToV8String(v8::Isolate* Isolate, const TCHAR* String)
{
#ifdef WITH_QUICKJS
    return v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(String), v8::NewStringType::kNormal).ToLocalChecked();
#else
    return v8::String::NewFromTwoByte(Isolate, TCHAR_TO_UTF16(String), v8::NewStringType::kNormal).ToLocalChecked();
#endif
}

FString puerts::FV8Utils::ToFString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
{
#ifdef WITH_QUICKJS
    return UTF8_TO_TCHAR(*(v8::String::Utf8Value(Isolate, Value)));
#else
    return UTF16_TO_TCHAR(*(v8::String::Value(Isolate, Value)));
#endif
}