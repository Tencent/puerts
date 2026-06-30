#include "WeakObjectPtrWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"

namespace PUERTS_NAMESPACE
{
v8::Local<v8::FunctionTemplate> FWeakObjectPtrWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
	auto Result = v8::FunctionTemplate::New(Isolate);
	Result->InstanceTemplate()->SetInternalFieldCount(4);
	Result->PrototypeTemplate()->Set(FV8Utils::ToV8String(Isolate, "Get"), v8::FunctionTemplate::New(Isolate, &Get));
	Result->PrototypeTemplate()->Set(FV8Utils::ToV8String(Isolate, "IsValid"), v8::FunctionTemplate::New(Isolate, &IsValid));
	return Result;
}

void FWeakObjectPtrWrapper::Get(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
	auto Isolate = Info.GetIsolate();
	auto Context = Isolate->GetCurrentContext();

	TWeakObjectPtr<UObject>* Ptr = FV8Utils::GetPointerFast<TWeakObjectPtr<UObject>>(Info.Holder());
	if (!Ptr)
	{
		FV8Utils::ThrowException(Isolate, "invalid weak object ptr wrapper");
		return;
	}

	UObject* Obj = Ptr->Get();
	if (Obj && Obj->IsValidLowLevelFast() && !UEObjectIsPendingKill(Obj))
	{
		Info.GetReturnValue().Set(
			FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Obj->GetClass(), Obj));
	}
	else
	{
		Info.GetReturnValue().Set(v8::Undefined(Isolate));
	}
}

void FWeakObjectPtrWrapper::IsValid(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
	auto Isolate = Info.GetIsolate();

	TWeakObjectPtr<UObject>* Ptr = FV8Utils::GetPointerFast<TWeakObjectPtr<UObject>>(Info.Holder());
	if (!Ptr)
	{
		Info.GetReturnValue().Set(v8::Boolean::New(Isolate, false));
		return;
	}

	UObject* Obj = Ptr->Get();
	bool bValid = Obj && Obj->IsValidLowLevelFast() && !UEObjectIsPendingKill(Obj);
	Info.GetReturnValue().Set(v8::Boolean::New(Isolate, bValid));
}
}    // namespace PUERTS_NAMESPACE
