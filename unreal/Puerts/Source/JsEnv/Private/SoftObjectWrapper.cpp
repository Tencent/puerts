#include "SoftObjectWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"

namespace puerts
{
v8::Local<v8::FunctionTemplate> FSoftObjectWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    auto Result = v8::FunctionTemplate::New(Isolate);
    Result->InstanceTemplate()->SetInternalFieldCount(6);
    Result->PrototypeTemplate()->Set(
        FV8Utils::ToV8String(Isolate, "LoadSynchronous"), v8::FunctionTemplate::New(Isolate, &LoadSynchronous));
    Result->PrototypeTemplate()->Set(FV8Utils::ToV8String(Isolate, "Get"), v8::FunctionTemplate::New(Isolate, &Get));
    return Result;
}

typedef UObject* (*FSoftObjectPtrObjectGetter)(FSoftObjectPtr* Ptr);

static void GenericObjectGet(const v8::FunctionCallbackInfo<v8::Value>& Info, FSoftObjectPtrObjectGetter Getter)
{
    auto Isolate = Info.GetIsolate();
    auto Context = Isolate->GetCurrentContext();

    FSoftObjectPtr* Ptr = FV8Utils::GetPointerFast<FSoftObjectPtr>(Info.Holder());
    if (!Ptr)
    {
        FV8Utils::ThrowException(Isolate, "passing a invalid object for FSoftObjectPtr");
        return;
    }
    auto Obj = Getter(Ptr);

    if (Obj)
    {
        auto PropertyClass = Cast<UClass>(FV8Utils::GetUObject(Info.Holder(), 1));

        auto MetaClass = Cast<UClass>(FV8Utils::GetUObject(Info.Holder(), 2));

        if (PropertyClass && !Obj->GetClass()->IsChildOf(PropertyClass))
        {
            // FV8Utils::ThrowException(Isolate, "invalid type");
            return;
        }
        if (MetaClass)
        {
            auto Class = Cast<UClass>(Obj);
            if (!Class)
            {
                // FV8Utils::ThrowException(Isolate, "not a class");
                return;
            }
            if (!Class->IsChildOf(MetaClass))
            {
                // FV8Utils::ThrowException(Isolate, "not a expect class");
                return;
            }
        }

        Info.GetReturnValue().Set(FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Obj->GetClass(), Obj));
    }
}

void FSoftObjectWrapper::LoadSynchronous(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    GenericObjectGet(Info, [](FSoftObjectPtr* Ptr) { return Ptr->LoadSynchronous(); });
}

void FSoftObjectWrapper::Get(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    GenericObjectGet(Info, [](FSoftObjectPtr* Ptr) { return Ptr->Get(); });
}
}    // namespace puerts
