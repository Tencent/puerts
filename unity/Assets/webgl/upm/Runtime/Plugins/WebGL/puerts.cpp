#if defined(__EMSCRIPTEN__)

#include <cstdint>
#include <emscripten.h>

struct MockV8Value
{
    int JSValueType;
    int FinalValuePointer;
    int extra;
    int FunctionCallbackInfo;
};
struct MockV8ValueNumberOrDate
{
    int JSValueType;
    double value;
    int FunctionCallbackInfo;
};
struct MockV8ValueLong
{
    int JSValueType;
    int64_t value;
    int FunctionCallbackInfo;
};

const int IntSizeOfV8Value = 4;

inline void *GetPointerFromValue(void *isolate, MockV8Value *value, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    return (void *)value->FinalValuePointer;
}

inline void *GetBufferFromValue(void *isolate, MockV8Value *value, int &length, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    length = value->extra;
    return (void *)value->FinalValuePointer;
}

inline double GetDoubleFromValue(void *isolate, MockV8Value *value, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    double *ptr = reinterpret_cast<double *>(&value->FinalValuePointer);
    return *ptr;
}

inline int64_t GetLongFromValue(void *isolate, MockV8Value *value, bool byref)
{
    if (byref)
        value = (MockV8Value *)value->extra;
    int64_t *ptr = reinterpret_cast<int64_t *>(&value->FinalValuePointer);
    return *ptr;
}

extern "C"
{
    void *GetArgumentValue(void* Isolate, void *infoptr, int index)
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
        return (bool)value->FinalValuePointer;
    }

    bool ValueIsBigInt(void *isolate, MockV8Value *value, bool byref)
    {
        if (byref)
            value = (MockV8Value *)value->extra;
        return value->JSValueType == 2 || value->JSValueType == 4;
    }

    int64_t GetBigIntFromValue(void *isolate, MockV8Value *value, bool byref)
    {
        if (value->JSValueType == 2) 
        {
            return GetLongFromValue(isolate, value, byref);
        } 
        else 
        {
            return (int64_t)GetDoubleFromValue(isolate, value, byref);
        }
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
    
    typedef void(*V8FunctionCallback)(void* Isolate, void* Info, void* Self, int ParamLen, int64_t UserData);
    typedef void* (*V8ConstructorCallback)(void* Isolate, void* Info, int ParamLen, int64_t UserData);
    typedef void(*V8DestructorCallback)(void* Self, int64_t UserData);

    void EMSCRIPTEN_KEEPALIVE CallCSharpFunctionCallback(V8FunctionCallback functionPtr, void* infoIntPtr, void *selfPtr, int paramLen, int callbackIdx)
    {
        functionPtr(nullptr, infoIntPtr, selfPtr, paramLen, (int64_t)callbackIdx << 32);
    }

    void* EMSCRIPTEN_KEEPALIVE CallCSharpConstructorCallback(V8ConstructorCallback functionPtr, void* infoIntPtr, int paramLen, int callbackIdx)
    {
        return functionPtr(nullptr, infoIntPtr, paramLen, (int64_t)callbackIdx << 32);
    }

    void EMSCRIPTEN_KEEPALIVE CallCSharpDestructorCallback(V8DestructorCallback functionPtr, void *selfPtr, int callbackIdx)
    {
        functionPtr(selfPtr, (int64_t)callbackIdx << 32);
    }
    
    //为了避免没有引用而被剪裁
    void PreservePuertsCPP()
    {
    }
    
    struct pesapi_ffi* InitPapiNative();
    
    struct pesapi_ffi* EMSCRIPTEN_KEEPALIVE InjectPapiGLNativeImpl()
    {
        return InitPapiNative();
    }
}

#endif
