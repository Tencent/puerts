#include <cstdint>

struct MockV8Value
{
    int JSValueType;
    int FinalValuePointer;
    int extra;
    int FunctionCallbackInfo;
};

struct MockV8NumberOrDate
{
    int JSValueType;
    float value;
    int extra;
    int FunctionCallbackInfo;
};

extern "C" {
    void *GetArgumentValue(void *infoptr, int index)
    {
        int step = sizeof(int);
        return (void*)((long)infoptr + (index * 4 + 1) * step);
    }
    int GetArgumentType(void* isolate, void* infoptr, int index, bool byref)
    {
        int step = sizeof(int);
        MockV8Value *value = (MockV8Value*)((long)infoptr + (index * 4 + 1) * step);
        if (byref)
            value = (MockV8Value*)value->extra;
        return value->JSValueType;
    }
    int GetJsValueType(void* isolate, MockV8Value* value, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        return value->JSValueType;
    }
    double GetNumberFromValue(void* isolate, MockV8NumberOrDate* value, bool byref)
    {
        if (byref)
            value = (MockV8NumberOrDate*)value->extra;
        return static_cast<double>(value->value);
    }
    double GetDateFromValue(void* isolate, MockV8NumberOrDate* value, bool byref)
    {
        if (byref)
            value = (MockV8NumberOrDate*)value->extra;
        return static_cast<double>(value->value);
    }
    void* GetStringFromValue(void* isolate, MockV8Value* value, int &length, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        length = value->extra;
        return (void*)(int)value->FinalValuePointer;
    }
    bool GetBooleanFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        return (bool)(int)value->FinalValuePointer;
    }
    bool ValueIsBigInt(void *isolate, MockV8Value *value, bool byref)
    {
        if (byref)
            value = (MockV8Value *)value->extra;
        return value->extra == 8; // long == 8byte
    }
    int64_t GetBigIntFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        if (byref)
            value = (MockV8Value *)value->extra;
        int64_t *ptr = reinterpret_cast<int64_t *>(value->FinalValuePointer);
        return *ptr;
    }
    void* GetObjectFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        return (void*)(int)value->FinalValuePointer;
    }
    void* GetFunctionFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        return (void*)(int)value->FinalValuePointer;
    }
    void* GetJSObjectFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        return (void*)(int)value->FinalValuePointer;
    }
    void* GetArrayBufferFromValue(void* isolate, MockV8Value* value, int &length, bool byref)
    {
        if (byref)
            value = (MockV8Value*)value->extra;
        length = value->extra;
        return (void*)(int)value->FinalValuePointer;
    }
}