#pragma once

#include<stdint.h>

namespace puerts
{
class V8Inspector
{
public:
    virtual void Close() = 0;

    virtual void Tick() = 0;

    virtual ~V8Inspector() {}
};

// 接受端口和v8::Local<v8::Context>指针，返回一个新的V8Inspector指针
V8Inspector* CreateV8Inspector(int32_t Port, void* InContextPtr);
};