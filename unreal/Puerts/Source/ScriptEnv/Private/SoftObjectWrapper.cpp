#include "SoftObjectWrapper.h"
#include "ObjectMapper.h"
#include "PapiUtils.h"

namespace PUERTS_NAMESPACE
{
// the type id of the soft object ptr class (soft object and soft class wrappers share it), a value id (PESAPI_VALUE_TYPE_ID) of
// the (aligned) tag
static int SoftObjectPtrTypeTag = 0;

const void* FSoftObjectWrapper::TypeId()
{
    return PESAPI_VALUE_TYPE_ID(&SoftObjectPtrTypeTag);
}

const JSClassDefinition* FSoftObjectWrapper::GetClassDefinition()
{
    // the entries are referenced by the class definition, so they must have static storage
    static JSFunctionInfo Methods[] = {{"LoadSynchronous", &LoadSynchronous}, {"Get", &Get}, JSFunctionInfo()};
    static const JSClassDefinition Definition = []()
    {
        JSClassDefinition Result = JSClassEmptyDefinition;
        Result.TypeId = TypeId();
        Result.ScriptName = "TSoftObjectPtr";
        Result.Finalize = &Finalize;
        Result.Methods = Methods;
        return Result;
    }();
    return &Definition;
}

void FSoftObjectWrapper::Finalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate)
{
    delete static_cast<FSoftObjectHolder*>(Ptr);
}

pesapi_value FSoftObjectWrapper::Wrap(
    struct pesapi_ffi* Apis, pesapi_env Env, const FSoftObjectPtr& SoftObjectPtr, UClass* Class, bool IsSoftClass)
{
    auto Holder = new FSoftObjectHolder{SoftObjectPtr, Class, IsSoftClass};
    return Apis->native_object_to_value(Env, TypeId(), Holder, true);
}

FSoftObjectPtr* FSoftObjectWrapper::SoftObjectPtrOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    if (Apis->get_native_object_typeid(Env, Value) != TypeId())
    {
        return nullptr;
    }
    auto Holder = static_cast<FSoftObjectHolder*>(Apis->get_native_object_ptr(Env, Value));
    return Holder ? &Holder->Ptr : nullptr;
}

typedef UObject* (*FSoftObjectPtrObjectGetter)(FSoftObjectPtr* Ptr);

static void GenericObjectGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, FSoftObjectPtrObjectGetter Getter)
{
    FSoftObjectHolder* Holder = Apis->get_native_holder_typeid(Info) == FSoftObjectWrapper::TypeId()
                                    ? static_cast<FSoftObjectHolder*>(Apis->get_native_holder_ptr(Info))
                                    : nullptr;
    if (!Holder)
    {
        Apis->throw_by_string(Info, "passing a invalid object for FSoftObjectPtr");
        return;
    }
    auto Obj = Getter(&Holder->Ptr);

    if (Obj)
    {
        if (Holder->Class.IsStale())
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        UClass* Class = Holder->Class.Get();

        if (Class && Holder->IsSoftClass)
        {
            auto ObjClass = Cast<UClass>(Obj);
            if (!ObjClass || !ObjClass->IsChildOf(Class))
            {
                return;
            }
        }
        else if (Class && !Obj->GetClass()->IsChildOf(Class))
        {
            return;
        }

        Apis->add_return(Info, PapiUtils::FindOrAddUObject(Apis, Apis->get_env(Info), Obj->GetClass(), Obj));
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
