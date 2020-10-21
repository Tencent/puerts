namespace puerts
{
    template<typename T>
    void PromiseRejectCallback(v8::PromiseRejectMessage Message)
    {
        auto Promise = Message.GetPromise();
        auto Isolate = Promise->GetIsolate();
        auto Event = Message.GetEvent();

        auto JsEngine = T::Get(Isolate);
        auto Callback = JsEngine->JsPromiseRejectCallback.Get(Isolate);
        if (Callback.IsEmpty())
        {
            return;
        }

        v8::Local<v8::Value> Value;

        if (Event == v8::kPromiseRejectWithNoHandler)
        {
            Value = Message.GetValue();
        }
        else if (Event == v8::kPromiseHandlerAddedAfterReject)
        {
            Value = v8::Undefined(Isolate);
        }
        else if (Event == v8::kPromiseResolveAfterResolved)
        {
            Value = Message.GetValue();
        }
        else if (Event == v8::kPromiseRejectAfterResolved)
        {
            Value = Message.GetValue();
        }
        else
        {
            return;
        }

        if (Value.IsEmpty())
        {
            Value = v8::Undefined(Isolate);
        }

        v8::Local<v8::Value> Args[] = { v8::Number::New(Isolate, Event), Promise, Value };
        Callback->Call(Isolate->GetCurrentContext(), v8::Undefined(Isolate), 3, Args);
    }

    template<typename T>
    void SetPromiseRejectCallback(const v8::FunctionCallbackInfo<v8::Value>& Args)
    {
        auto Isolate = Args.GetIsolate();
        auto JsEngine = T::Get(Isolate);
        JsEngine->JsPromiseRejectCallback.Reset(Isolate, Args[0].As<v8::Function>());
    }
}
