#include "WeakObjectPtrWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "PesapiClassThunks.h"
#include "PapiUtils.h"

namespace PUERTS_NAMESPACE
{
v8::Local<v8::FunctionTemplate> FWeakObjectPtrWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    // the entries are referenced by the function templates, so they must have static storage
    static const JSFunctionInfo Methods[] = {{"Get", &Get}, {"IsValid", &IsValid}};
    auto Result = v8::FunctionTemplate::New(Isolate);
    Result->InstanceTemplate()->SetInternalFieldCount(4);
    for (const auto& Method : Methods)
    {
        Result->PrototypeTemplate()->Set(FV8Utils::ToV8String(Isolate, Method.Name),
            ClassThunks::MethodTemplate(Isolate, &Method, v8::ConstructorBehavior::kAllow));
    }
    return Result;
}

void FWeakObjectPtrWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    TWeakObjectPtr<UObject>* Ptr = static_cast<TWeakObjectPtr<UObject>*>(Apis->get_native_holder_ptr(Info));
    if (!Ptr)
    {
        Apis->throw_by_string(Info, "invalid weak object ptr wrapper");
        return;
    }

    UObject* Obj = Ptr->Get();
    if (Obj && Obj->IsValidLowLevelFast() && !UEObjectIsPendingKill(Obj))
    {
        Apis->add_return(Info, PapiUtils::FindOrAddUObject(Env, Obj->GetClass(), Obj));
    }
    else
    {
        Apis->add_return(Info, Apis->create_undefined(Env));
    }
}

void FWeakObjectPtrWrapper::IsValid(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    TWeakObjectPtr<UObject>* Ptr = static_cast<TWeakObjectPtr<UObject>*>(Apis->get_native_holder_ptr(Info));
    if (!Ptr)
    {
        Apis->add_return(Info, Apis->create_boolean(Env, false));
        return;
    }

    UObject* Obj = Ptr->Get();
    bool bValid = Obj && Obj->IsValidLowLevelFast() && !UEObjectIsPendingKill(Obj);
    Apis->add_return(Info, Apis->create_boolean(Env, bValid));
}
}    // namespace PUERTS_NAMESPACE
