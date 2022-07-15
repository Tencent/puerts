/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once 

#include "JSEngine.h"
#include "v8.h"

typedef void (*CSharpInspectorSendMessageCallback)(int32_t jsEnvIdx, const char* id, const char* message);

typedef void (*CSharpSetInspectorPausingCallback)(int32_t jsEnvIdx, bool isPause);

namespace puerts
{
class InspectorSession
{
protected:
    int32_t jsEnvIdx;

    std::string id;
public:
    virtual void DispatchProtocolMessage(const char* Message) = 0;

    InspectorSession(std::string inID, int32_t jsEnvIdx) : id(inID), jsEnvIdx(jsEnvIdx) {
    }

    virtual ~InspectorSession()
    {
    }
};

class InspectorAgent
{
protected:
    CSharpInspectorSendMessageCallback SendMessageCallback;

    CSharpSetInspectorPausingCallback PauseCallback;

    int32_t jsEnvIdx;

    std::map<std::string, InspectorSession*> sessionMap;
public:
    virtual void CreateInspectorChannel(std::string id) = 0;

    virtual void SendMessage(std::string id, const char* message) = 0;

    virtual void Close(std::string id) = 0;

    InspectorAgent(int32_t _jsEnvIdx, CSharpInspectorSendMessageCallback Callback, CSharpSetInspectorPausingCallback PauseCallback)
        : jsEnvIdx(_jsEnvIdx), SendMessageCallback(Callback), PauseCallback(PauseCallback)
    {
    }

    virtual ~InspectorAgent()
    {
    }
};

// 接受端口和v8::Local<v8::Context>指针，返回一个新的V8Inspector指针
InspectorAgent* CreatePuertsInspector(int32_t jsEnvIdx, void* InContextPtr, CSharpInspectorSendMessageCallback InCallback, CSharpSetInspectorPausingCallback PauseCallback);
}