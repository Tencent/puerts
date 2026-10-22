#include "SoftObjectWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "PesapiClassThunks.h"
#include "PapiUtils.h"

namespace PUERTS_NAMESPACE
{
v8::Local<v8::FunctionTemplate> FSoftObjectWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    // the entries are referenced by the function templates, so they must have static storage
    static const JSFunctionInfo Methods[] = {{"LoadSynchronous", &LoadSynchronous}, {"Get", &Get}};
    auto Result = v8::FunctionTemplate::New(Isolate);
    Result->InstanceTemplate()->SetInternalFieldCount(6);
    for (const auto& Method : Methods)
    {
        Result->PrototypeTemplate()->Set(FV8Utils::ToV8String(Isolate, Method.Name),
            ClassThunks::MethodTemplate(Isolate, &Method, v8::ConstructorBehavior::kAllow));
    }
    return Result;
}

typedef UObject* (*FSoftObjectPtrObjectGetter)(FSoftObjectPtr* Ptr);

// internal field 1 (the type id slot of papi) is the class of the property, field 2 is the meta class, both are raw pointers
static void GenericObjectGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, FSoftObjectPtrObjectGetter Getter)
{
    FSoftObjectPtr* Ptr = static_cast<FSoftObjectPtr*>(Apis->get_native_holder_ptr(Info));
    if (!Ptr)
    {
        Apis->throw_by_string(Info, "passing a invalid object for FSoftObjectPtr");
        return;
    }
    auto Obj = Getter(Ptr);

    if (Obj)
    {
        UClass* PropertyClass = nullptr;
        if (UObject* Object = static_cast<UObject*>(const_cast<void*>(Apis->get_native_holder_typeid(Info))))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
            PropertyClass = Cast<UClass>(Object);
        }

        UClass* MetaClass = nullptr;
        // papi exposes only two internal fields, field 2 is still read through the bridge
        if (UObject* Object = FV8Utils::GetUObject(papi_bridge::HolderOf(Info), 2))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
            MetaClass = Cast<UClass>(Object);
        }

        if (PropertyClass && !Obj->GetClass()->IsChildOf(PropertyClass))
        {
            return;
        }
        if (MetaClass)
        {
            auto Class = Cast<UClass>(Obj);
            if (!Class)
            {
                return;
            }
            if (!Class->IsChildOf(MetaClass))
            {
                return;
            }
        }

        Apis->add_return(Info, PapiUtils::FindOrAddUObject(Apis->get_env(Info), Obj->GetClass(), Obj));
    }
}

void FSoftObjectWrapper::LoadSynchronous(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    GenericObjectGet(Apis, Info, [](FSoftObjectPtr* Ptr) { return Ptr->LoadSynchronous(); });
}

void FSoftObjectWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    GenericObjectGet(Apis, Info, [](FSoftObjectPtr* Ptr) { return Ptr->Get(); });
}
}    // namespace PUERTS_NAMESPACE
