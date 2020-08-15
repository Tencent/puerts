#pragma once

#include "CoreMinimal.h"

#pragma warning(push, 0) 
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
class JSENV_API DataTransfer
{
public:
    FORCEINLINE static void* MakeAddressWithHighPartOfTwo(void* Address1, void *Address2)
    {
        UPTRINT High = reinterpret_cast<UPTRINT>(Address1) & (((UPTRINT)-1) << (sizeof(UPTRINT) / 2)); //清除低位
        UPTRINT Low = (reinterpret_cast<UPTRINT>(Address2) >> (sizeof(UPTRINT) / 2)) & ~(((UPTRINT)-1) << (sizeof(UPTRINT) / 2)); //右移，然后清除高位
        return reinterpret_cast<void*>(High | Low);
    }

    FORCEINLINE static void SplitAddressToHighPartOfTwo(void* Address, UPTRINT &High, UPTRINT &Low)
    {
        High = reinterpret_cast<UPTRINT>(Address) & (((UPTRINT)-1) << (sizeof(UPTRINT) / 2)); //清除低位
        Low = reinterpret_cast<UPTRINT>(Address) << (sizeof(UPTRINT) / 2);
    }

    template<typename T>
    FORCEINLINE static T * GetPoninterFast(v8::Local<v8::Object> Object, int Index = 0)
    {
        if (Object->InternalFieldCount() > (Index * 2 + 1))
        {
            return reinterpret_cast<T*>(MakeAddressWithHighPartOfTwo(Object->GetAlignedPointerFromInternalField(Index * 2), Object->GetAlignedPointerFromInternalField(Index * 2 + 1)));
        }
        else
        {
            return nullptr;
        }
    }

    static v8::Local<v8::Value> FindOrAddCData(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const char* CDataName, const void *Ptr, bool PassByPointer);

    static bool IsInstanceOf(v8::Isolate* Isolate, UStruct *Struct, v8::Local<v8::Object> JsObject);

    static bool IsInstanceOf(v8::Isolate* Isolate, const char* CDataName, v8::Local<v8::Object> JsObject);

    static FString ToFString(v8::Isolate* Isolate, v8::Local<v8::Value> Value);

    static v8::Local<v8::Value> UnRef(v8::Isolate* Isolate, const v8::Local<v8::Value>& Value);

    static void UpdateRef(v8::Isolate* Isolate, v8::Local<v8::Value> Outer, const v8::Local<v8::Value>& Value);
};
}
