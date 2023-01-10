#include <algorithm>
#include "Log.h"
#include "V8InspectorImpl.h"

namespace puerts
{
    class PromiseHandler
    {
    public: 
        PromiseHandler()
        {
            Inspector = nullptr;
        } 
        v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;
        
        V8Inspector* Inspector;

        V8_INLINE static PromiseHandler* Get(v8::Isolate* Isolate)
        {
            return (PromiseHandler*)Isolate->GetData(2);
        }
        
        void CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port)
        {
    #ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
    #endif
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            if (Inspector == nullptr)
            {
                Inspector = CreateV8Inspector(Port, &Context);
            }
        }

        void DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal)
        {
    #ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
    #endif
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            if (Inspector != nullptr)
            {
                delete Inspector;
                Inspector = nullptr;
            }
        }

        bool InspectorTick()
        {
            if (Inspector != nullptr)
            {
                return Inspector->Tick();
            }
            return true;
        }
    };
}