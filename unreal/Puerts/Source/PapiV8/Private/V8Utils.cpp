#include <V8Utils.h>
#include <map>

v8::Local<v8::String> puerts::FV8Utils::ToV8String(v8::Isolate* Isolate, const TCHAR* String)
{
    return v8::String::NewFromTwoByte(Isolate, TCHAR_TO_UTF16(String), v8::NewStringType::kNormal).ToLocalChecked();
}

FString puerts::FV8Utils::ToFString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
{
    // Implementation is referenced from v8::String::Value(), directly copy v8::String's content to FString
    if (!Value.IsEmpty())
    {
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::TryCatch TryCatch(Isolate);
        v8::Local<v8::String> Str;
        if (Value->ToString(Context).ToLocal(&Str))
        {
            const int Length = Str->Length();
            if (Length > 0)
            {
                FString Ret;
                TArray<TCHAR>& CharArray = Ret.GetCharArray();
                CharArray.AddUninitialized(Length + 1);
                uint16_t* RetBuffer = reinterpret_cast<uint16_t*>(CharArray.GetData());
                Str->Write(Isolate, RetBuffer);
                // v8::String::Write() doesn't write a null terminator to RetBuffer, so we have to do it ourselves
                *(RetBuffer + Length) = TEXT('\0');
                return Ret;
            }
        }
    }
    return TEXT("");
}
namespace PUERTS_NAMESPACE
{
// v8 addons (PUERTS_MODULE) are registered by static initializers of each module, they are not bound to a class registry
static std::map<PString, AddonRegisterFunc>& GetAddonRegisterInfos()
{
    static std::map<PString, AddonRegisterFunc> S_AddonRegisterInfos;
    return S_AddonRegisterInfos;
}

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc)
{
    GetAddonRegisterInfos()[Name] = RegisterFunc;
}

AddonRegisterFunc FindAddonRegisterFunc(const PString& Name)
{
    auto& AddonRegisterInfos = GetAddonRegisterInfos();
    auto Iter = AddonRegisterInfos.find(Name);
    return Iter == AddonRegisterInfos.end() ? nullptr : Iter->second;
}
}    // namespace PUERTS_NAMESPACE
