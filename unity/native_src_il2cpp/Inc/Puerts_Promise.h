#include <algorithm>
#include "Log.h"

namespace puerts
{
    class PromiseHandler
    {
    public: 
        v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;
        
        V8_INLINE static PromiseHandler* Get(v8::Isolate* Isolate)
        {
            return (PromiseHandler*)Isolate->GetData(2);
        }
    };
}