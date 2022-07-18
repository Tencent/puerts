/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include <string>
#include <locale>
#include <codecvt>

#include "JSEngine.h"
#include "Inspector.h"
#include "v8.h"
#include "v8-inspector.h"

#define CTX_GROUP_ID 1

namespace puerts
{
    
class V8InspectorClientImpl 
    : public v8_inspector::V8InspectorClient, public InspectorAgent
{
private: 
    v8::Persistent<v8::Context> Context;

    v8::Isolate* Isolate;

    std::unique_ptr<v8_inspector::V8Inspector> V8Inspector;

    void runIfWaitingForDebugger(int ContextGroupId) override
    {
       // printf("runIfWaitingForDebugger\n");
    }

    void runMessageLoopOnPause(int ContextGroupId) override;

    void quitMessageLoopOnPause() override;

public:
    V8InspectorClientImpl(int32_t jsEnvIdx, v8::Local<v8::Context> InContext, CSharpInspectorSendMessageCallback InCallback, CSharpSetInspectorPausingCallback PauseCallback)
        : InspectorAgent(jsEnvIdx, InCallback, PauseCallback)
    {
        Isolate = InContext->GetIsolate();
        Context.Reset(Isolate, InContext);

        V8Inspector = v8_inspector::V8Inspector::create(Isolate, this);

        const uint8_t CtxNameConst[] = "V8InspectorContext";
        v8_inspector::StringView CtxName(CtxNameConst, sizeof(CtxNameConst) - 1);
        V8Inspector->contextCreated(v8_inspector::V8ContextInfo(InContext, CTX_GROUP_ID, CtxName));
    }

    void CreateInspectorChannel(std::string id) override;
    void V8InspectorClientImpl::SendMessage(std::string id, const char* message) override;
    void V8InspectorClientImpl::Close(std::string id) override;
};


class V8InspectorChannelImpl : public v8_inspector::V8Inspector::Channel, public InspectorSession
{
public:
    V8InspectorChannelImpl(int32_t jsEnvIdx,
        CSharpInspectorSendMessageCallback Callback, 
        const std::unique_ptr<v8_inspector::V8Inspector>& InV8Inspector,
        std::string inID);

    void DispatchProtocolMessage(const char* Message) override;


    void flushProtocolNotifications() override
    {
    }

    void sendResponse(int CallID, std::unique_ptr<v8_inspector::StringBuffer> Message) override
    {
        sendResponseOrNotification(*Message);
    }

    void sendNotification(std::unique_ptr<v8_inspector::StringBuffer> Message) override
    {
        sendResponseOrNotification(*Message);
    }

    void sendResponseOrNotification(v8_inspector::StringBuffer& MessageBuffer);

private:
    CSharpInspectorSendMessageCallback Callback;

    std::unique_ptr<v8_inspector::V8InspectorSession> V8InspectorSession;
};

void V8InspectorClientImpl::CreateInspectorChannel(std::string id)
{
    sessionMap[id] = new V8InspectorChannelImpl(jsEnvIdx, SendMessageCallback, V8Inspector, id);
}

void V8InspectorClientImpl::SendMessage(std::string id, const char* message)
{
    if (sessionMap.find(id) != sessionMap.end())
    {
        sessionMap[id]->DispatchProtocolMessage(message);
    }
};

void V8InspectorClientImpl::Close(std::string id)
{
    sessionMap.erase(std::string(id));
};

void V8InspectorClientImpl::runMessageLoopOnPause(int /* ContextGroupId */)
{
    PauseCallback(jsEnvIdx, true);
}

void V8InspectorClientImpl::quitMessageLoopOnPause()
{
    PauseCallback(jsEnvIdx, false);
}

V8InspectorChannelImpl::V8InspectorChannelImpl(int32_t jsEnvIdx,
        CSharpInspectorSendMessageCallback Callback, 
        const std::unique_ptr<v8_inspector::V8Inspector>& InV8Inspector,
        std::string inID)
        : InspectorSession(inID, jsEnvIdx), Callback(Callback)
{
    v8_inspector::StringView DummyState;
    V8InspectorSession = InV8Inspector->connect(CTX_GROUP_ID, this, DummyState);
}

void V8InspectorChannelImpl::DispatchProtocolMessage(const char* Message)
{
    const auto MessagePtr = reinterpret_cast<const uint8_t*>(Message);
    const auto MessageLen = (size_t) std::string(Message).length();

    v8_inspector::StringView StringView(MessagePtr, MessageLen);
    printf("%s\n", Message);
    V8InspectorSession->dispatchProtocolMessage(StringView);
}

void V8InspectorChannelImpl::sendResponseOrNotification(v8_inspector::StringBuffer& MessageBuffer)
{
    v8_inspector::StringView MessageView = MessageBuffer.string();
    std::string Message;
    if (MessageView.is8Bit())
    {
        Message = reinterpret_cast<const char*>(MessageView.characters8());
    }
    else
    {
#if PLATFORM_WINDOWS
        std::wstring_convert<std::codecvt_utf8_utf16<uint16_t>, uint16_t> Conv;
        const uint16_t* Start = MessageView.characters16();
#else
        std::wstring_convert<std::codecvt_utf8_utf16<char16_t>, char16_t> Conv;
        const char16_t* Start = reinterpret_cast<const char16_t*>(MessageView.characters16());
#endif
        Message = Conv.to_bytes(Start, Start + MessageView.length());
    }
    Callback(jsEnvIdx, id.c_str(), Message.c_str());
}

InspectorAgent* CreatePuertsInspector(int32_t jsEnvIdx, void* InContextPtr, CSharpInspectorSendMessageCallback InCallback, CSharpSetInspectorPausingCallback PauseCallback)
{
    v8::Local<v8::Context>* ContextPtr = static_cast<v8::Local<v8::Context>*>(InContextPtr);
    return new V8InspectorClientImpl(jsEnvIdx, *ContextPtr, InCallback, PauseCallback);
}
}    // namespace puerts