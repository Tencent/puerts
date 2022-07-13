#pragma once 

#include "JSEngine.h"
#include "v8.h"

typedef void (*CSharpInspectorSendMessageCallback)(int32_t jsEnvIdx, const char* id, const char* message);

namespace puerts
{
class InspectorSession
{
protected:
    int32_t jsEnvIdx;

    const char* id;
public:
    virtual void DispatchProtocolMessage(const char* Message) = 0;

    InspectorSession(const char* inID, int32_t jsEnvIdx) : id(inID), jsEnvIdx(jsEnvIdx) { }

    virtual ~InspectorSession()
    {
    }
};

class InspectorAgent
{
protected:
    CSharpInspectorSendMessageCallback SendMessageCallback;

    int32_t jsEnvIdx;

    std::map<std::string, InspectorSession*> sessionMap;
public:
    virtual void CreateInspectorChannel(const char* id) = 0;

    virtual void SendMessage(const char* id, const char* message) = 0;

    virtual void Close(const char* id) = 0;

    InspectorAgent(int32_t _jsEnvIdx, CSharpInspectorSendMessageCallback Callback)
        : jsEnvIdx(_jsEnvIdx), SendMessageCallback(Callback)
    {
    }

    virtual ~InspectorAgent()
    {
    }
};

// 接受端口和v8::Local<v8::Context>指针，返回一个新的V8Inspector指针
InspectorAgent* CreatePuertsInspector(int32_t jsEnvIdx, void* InContextPtr, CSharpInspectorSendMessageCallback InCallback);
}