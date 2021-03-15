#include <sstream>

namespace puerts
{
template <typename T> inline void __USE(T&&) {}

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
    __USE(Callback->Call(Isolate->GetCurrentContext(), v8::Undefined(Isolate), 3, Args));
}

template<typename T>
void SetPromiseRejectCallback(const v8::FunctionCallbackInfo<v8::Value>& Args)
{
    auto Isolate = Args.GetIsolate();
    auto JsEngine = T::Get(Isolate);
    JsEngine->JsPromiseRejectCallback.Reset(Isolate, Args[0].As<v8::Function>());
}

//TODO: 后续本文件应该换个名字
#ifndef WITH_QUICKJS
std::string StackTraceToString(v8::Isolate* InIsolate, v8::Local<v8::StackTrace> InStack)
{
    std::ostringstream stm;
    for (int i = 0; i < InStack->GetFrameCount() - 1; i++)
    {
        v8::Local<v8::StackFrame> StackFrame = InStack->GetFrame(InIsolate, i);
        v8::String::Utf8Value FuncName(InIsolate, StackFrame->GetFunctionName());
        v8::String::Utf8Value ScriptName(InIsolate, StackFrame->GetScriptName());
        const int LineNumber = StackFrame->GetLineNumber();
        const int Column = StackFrame->GetColumn();

        if (StackFrame->IsEval())
        {
            if (StackFrame->GetScriptId() == v8::Message::kNoScriptIdInfo)
            {
                stm << "    at [eval]:" << LineNumber << ":" << Column << std::endl;
            }
            else {
                stm << "    at [eval] (" << *ScriptName << ":" << LineNumber << ":" << Column << ")" << std::endl;
            }
            break;
        }

        if (FuncName.length() == 0)
        {
            stm << "    at " << *ScriptName << ":" << LineNumber << ":" << Column << std::endl;
        }
        else {
            stm << "    at " << *FuncName << "(" << *ScriptName << ":" << LineNumber << ":" << Column << ")" << std::endl;
        }
    }
    return stm.str();
}
#endif

}
