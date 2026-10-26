#include "WeakObjectPtrWrapper.h"
#include "ObjectMapper.h"
#include "PapiUtils.h"

namespace PUERTS_NAMESPACE
{
// the type id of the weak object ptr class
static const char WeakObjectPtrTypeTag = 0;

const void* FWeakObjectPtrWrapper::TypeId()
{
    return &WeakObjectPtrTypeTag;
}

const JSClassDefinition* FWeakObjectPtrWrapper::GetClassDefinition()
{
    // the entries are referenced by the class definition, so they must have static storage
    static JSFunctionInfo Methods[] = {{"Get", &Get}, {"IsValid", &IsValid}, JSFunctionInfo()};
    static const JSClassDefinition Definition = []()
    {
        JSClassDefinition Result = JSClassEmptyDefinition;
        Result.TypeId = &WeakObjectPtrTypeTag;
        Result.ScriptName = "TWeakObjectPtr";
        Result.Finalize = &Finalize;
        Result.Methods = Methods;
        return Result;
    }();
    return &Definition;
}

void FWeakObjectPtrWrapper::Finalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate)
{
    delete static_cast<TWeakObjectPtr<UObject>*>(Ptr);
}

void FWeakObjectPtrWrapper::Make(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    UObject* Object = nullptr;
    if (Apis->get_args_len(Info) > 0)
    {
        pesapi_value Arg = Apis->get_arg(Info, 0);
        if (Apis->is_object(Env, Arg))
        {
            Object = PapiDataTransfer::GetUObjectOfNativePtr(Apis->get_native_object_ptr(Env, Arg), true);
        }
    }
    if (Object == RELEASED_UOBJECT)
    {
        Object = nullptr;
    }

    Apis->add_return(Info, Apis->native_object_to_value(Env, &WeakObjectPtrTypeTag, new TWeakObjectPtr<UObject>(Object), true));
}

static FORCEINLINE TWeakObjectPtr<UObject>* WeakObjectPtrOf(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    return Apis->get_native_holder_typeid(Info) == &WeakObjectPtrTypeTag
               ? static_cast<TWeakObjectPtr<UObject>*>(Apis->get_native_holder_ptr(Info))
               : nullptr;
}

void FWeakObjectPtrWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    TWeakObjectPtr<UObject>* Ptr = WeakObjectPtrOf(Apis, Info);
    if (!Ptr)
    {
        Apis->throw_by_string(Info, "invalid weak object ptr wrapper");
        return;
    }

    UObject* Obj = Ptr->Get();
    if (Obj && Obj->IsValidLowLevelFast() && !UEObjectIsPendingKill(Obj))
    {
        Apis->add_return(Info, PapiUtils::FindOrAddUObject(Apis, Env, Obj->GetClass(), Obj));
    }
    else
    {
        Apis->add_return(Info, Apis->create_undefined(Env));
    }
}

void FWeakObjectPtrWrapper::IsValid(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    TWeakObjectPtr<UObject>* Ptr = WeakObjectPtrOf(Apis, Info);
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
