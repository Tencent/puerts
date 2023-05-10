struct MockV8Value
{
    int FunctionCallbackInfo;
    int JSValueType;
    int FinalValuePointer;
    int length;
};

extern "C" {
    void* GetArgumentValue(void* infoptr, int index) 
    {
        int step = sizeof(int);
        return (void*)((long)infoptr + (index * 4 + 1) * step);
    }
    int GetArgumentType(void* isolate, void* infoptr, int index, bool isByRef)
    {
        int step = sizeof(int);
        MockV8Value *value = (MockV8Value*)((long)infoptr + (index * 4 + 1) * step);
        return value->JSValueType;
    }
    int GetJsValueType(void* isolate, MockV8Value* value, bool byref)
    {
        return value->JSValueType;
    }
    double GetNumberFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return static_cast<double>(value->FinalValuePointer);
    }
    double GetDateFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return static_cast<double>(value->FinalValuePointer);
    }
    void* GetStringFromValue(void* isolate, MockV8Value* value, int &length, bool byref)
    {
        length = value->length;
        return (void*)value->FinalValuePointer;
    }
    bool GetBooleanFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return (bool)value->FinalValuePointer;
    }
    int GetBigIntFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return (int)value->FinalValuePointer;
    }
    void* GetObjectFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return (void*)value->FinalValuePointer;
    }
    void* GetFunctionFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return (void*)value->FinalValuePointer;
    }
    void* GetJSObjectFromValue(void* isolate, MockV8Value* value, bool byref)
    {
        return (void*)value->FinalValuePointer;
    }
    void* GetArrayBufferFromValue(void* isolate, MockV8Value* value, int &length, bool byref)
    {
        length = value->length;
        return (void*)value->FinalValuePointer;
    }
}