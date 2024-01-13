#include <cstdint>
#include <stdio.h>>

struct MockV8Value
{
    int JSValueType;
    int FinalValuePointer[2];
    int extra;
    int FunctionCallbackInfo;
};

const int IntSizeOfV8Value = 5;

void *GetPointerFromValue(void *isolate, MockV8Value *value, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    return (void *)value->FinalValuePointer[0];
}

void *GetBufferFromValue(void *isolate, MockV8Value *value, int &length, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    length = value->extra;
    return (void *)value->FinalValuePointer[0];
}

double GetDoubleFromValue(void *isolate, MockV8Value *value, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    double *ptr = reinterpret_cast<double *>(value->FinalValuePointer);
    return *ptr;
}

int64_t GetLongFromValue(void *isolate, MockV8Value *value, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    int64_t *ptr = reinterpret_cast<int64_t *>(value->FinalValuePointer);
    return *ptr;
}

extern "C"
{
    void *GetArgumentValue(void *infoptr, int index)
    {
        int step = sizeof(int);
        return (void *)((long)infoptr + (index * IntSizeOfV8Value + 1) * step);
    }

    int GetArgumentType(void *isolate, void *infoptr, int index, bool byref)
    {
        int step = sizeof(int);
        MockV8Value *value = (MockV8Value *)((long)infoptr + (index * IntSizeOfV8Value + 1) * step);
        if (byref)
            value = (MockV8Value *)value->extra;
        return value->JSValueType;
    }

    int GetJsValueType(void *isolate, MockV8Value *value, bool byref)
    {
        if (byref)
            value = (MockV8Value *)value->extra;
        return value->JSValueType;
    }

    double GetNumberFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        return GetDoubleFromValue(isolate, value, byref);
    }

    double GetDateFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        return GetDoubleFromValue(isolate, value, byref);
    }

    void *GetStringFromValue(void *isolate, MockV8Value *value, int &length, bool byref)
    {
        return GetBufferFromValue(isolate, value, length, byref);
    }

    bool GetBooleanFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        if (byref)
            value = (MockV8Value *)value->extra;
        return (bool)value->FinalValuePointer[0];
    }

    bool ValueIsBigInt(void *isolate, MockV8Value *value, bool byref)
    {
        if (byref)
            value = (MockV8Value *)value->extra;
        return value->extra == 8; // long == 8byte
    }

    int64_t GetBigIntFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        return GetLongFromValue(isolate, value, byref);
    }

    void *GetObjectFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        return GetPointerFromValue(isolate, value, byref);
    }

    void *GetFunctionFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        return GetPointerFromValue(isolate, value, byref);
    }

    void *GetJSObjectFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        return GetPointerFromValue(isolate, value, byref);
    }

    void *GetArrayBufferFromValue(void *isolate, MockV8Value *value, int &length, bool byref)
    {
        return GetBufferFromValue(isolate, value, length, byref);
    }
}