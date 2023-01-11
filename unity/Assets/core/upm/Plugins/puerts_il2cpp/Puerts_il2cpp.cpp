#include "il2cpp-config.h"
#include "codegen/il2cpp-codegen.h"

#include "il2cpp-api.h"
#include "il2cpp-class-internals.h"
#include "il2cpp-object-internals.h"
#include "vm/InternalCalls.h"
#include "vm/Object.h"
#include "vm/Array.h"
#include "vm/Runtime.h"
#include "vm/Reflection.h"
#include "vm/MetadataCache.h"
#include "vm/Field.h"
#include "vm/GenericClass.h"
#include "vm/Thread.h"
#include "vm/Method.h"
#include "vm/Parameter.h"
#include "vm/Image.h"
#include "utils/StringUtils.h"
#include "vm-utils/NativeDelegateMethodCache.h"
#include "pesapi.h"
#include "UnityExports4Puerts.h"

#include <vector>

static_assert(IL2CPP_GC_BOEHM, "Only BOEHM GC supported!");

using namespace il2cpp::vm;


namespace puerts
{

intptr_t GetMethodPointer(Il2CppReflectionMethod* method)
{
    auto methodInfo = method->method;
    auto ret = MetadataCache::GetMethodPointer(methodInfo->klass->image, methodInfo->token);
    if (!ret)
    {
        ret = methodInfo->methodPointer;
    }
    return (intptr_t)ret;
}

intptr_t GetMethodInfoPointer(Il2CppReflectionMethod* method)
{
    return (intptr_t)method->method;
}

int32_t GetFieldOffset(Il2CppReflectionField* field, bool isInValueType)
{
    return (int32_t)Field::GetOffset(field->field) - (Field::GetParent(field->field)->valuetype ? sizeof(RuntimeObject) : 0);
}

intptr_t GetFieldInfoPointer(Il2CppReflectionField* field)
{
    return (intptr_t)field->field;
}

intptr_t GetObjectPointer(RuntimeObject *obj)
{
    return (intptr_t)obj;
}

intptr_t GetTypeId(Il2CppReflectionType *type)
{
    return (intptr_t)il2cpp_codegen_class_from_type(type->type);
}

const void* CSharpTypeToTypeId(Il2CppObject *type)
{
    return (type && Class::IsAssignableFrom(il2cpp_defaults.systemtype_class, type->klass)) ? il2cpp_codegen_class_from_type(((Il2CppReflectionType *)type)->type) : nullptr;
}

const Il2CppReflectionType* TypeIdToType(Il2CppClass *klass)
{
    if (!klass) return nullptr;
    return Reflection::GetTypeObject(Class::GetType(klass));
}

static void* ObjectAllocate(Il2CppClass *klass)
{
    if (klass->valuetype)
    {
        return (void*)(new uint8_t[klass->native_size > 0 ? klass->native_size : (klass->instance_size - sizeof(Il2CppObject))]);
    } else {
        auto obj = il2cpp::vm::Object::New(klass);
        return obj;
    }
}


static void ValueTypeFree(void* ptr)
{
    delete [] (uint8_t*)ptr;
}

static Il2CppClass *g_typeofPersistentObjectInfo;
static Il2CppClass *g_typeofArrayBuffer;
static Il2CppClass *g_typeofTypedValue;

const Il2CppClass* GetReturnType(const MethodInfo* method) {
    if (kInvalidIl2CppMethodSlot != method->slot) {
        Class::Init(method->klass);
    }
    return Class::FromIl2CppType(Method::GetReturnType(method), false);
}

const Il2CppClass* GetParameterType(const MethodInfo* method, int index) {
    if (kInvalidIl2CppMethodSlot != method->slot) {
        Class::Init(method->klass);
    }
    const Il2CppType* type = Method::GetParam(method, index);
    if (type) {
        return Class::FromIl2CppType(type, false);
    } else {
        return nullptr;
    }
}

Il2CppDelegate* FunctionPointerToDelegate(Il2CppMethodPointer functionPtr, Il2CppClass* delegateType)
{
    Il2CppObject* delegate = il2cpp::vm::Object::New(delegateType);
    const MethodInfo* invoke = il2cpp::vm::Runtime::GetDelegateInvoke(delegateType);

    // TODO: Using Custom Delegate Method Cache
    const MethodInfo* method = il2cpp::utils::NativeDelegateMethodCache::GetNativeDelegate((Il2CppMethodPointer)invoke);
    if (method == NULL)
    {
        MethodInfo* newMethod = (MethodInfo*)IL2CPP_CALLOC(1, sizeof(MethodInfo));
        newMethod->methodPointer = functionPtr;
        newMethod->invoker_method = NULL;
        newMethod->return_type = invoke->return_type;
        newMethod->parameters_count = invoke->parameters_count;
        newMethod->parameters = invoke->parameters;
        newMethod->slot = kInvalidIl2CppMethodSlot;
        newMethod->is_marshaled_from_native = true;
        il2cpp::utils::NativeDelegateMethodCache::AddNativeDelegate((Il2CppMethodPointer)invoke, newMethod);
        method = newMethod;
    }

    Type::ConstructDelegate((Il2CppDelegate*)delegate, delegate, functionPtr, method);

    return (Il2CppDelegate*)delegate;
}

static void* DelegateAllocate(Il2CppClass *klass, Il2CppMethodPointer functionPtr, void** outTargetData)
{
    Il2CppClass *delegateInfoClass = g_typeofPersistentObjectInfo;
    if (!delegateInfoClass) return nullptr;

    Il2CppDelegate* delegate = FunctionPointerToDelegate(functionPtr, klass);

    if (MethodIsStatic(delegate->method)) return nullptr;

    auto target = il2cpp::vm::Object::New(delegateInfoClass);

    const MethodInfo* ctor = il2cpp_class_get_method_from_name(delegateInfoClass, ".ctor", 0);
    typedef void (*NativeCtorPtr)(Il2CppObject* ___this, const MethodInfo* method);
    ((NativeCtorPtr)ctor->methodPointer)(target, ctor);

    IL2CPP_OBJECT_SETREF(delegate, target, target);

    *outTargetData = target + 1;

    delegate->method_ptr = functionPtr;

    return delegate;
}

void SetGlobalType_ArrayBuffer(Il2CppReflectionType *type)
{
    if (!type)
    {
        Exception::Raise(Exception::GetInvalidOperationException("type of ArrayBuffer is null"));
    }
    g_typeofArrayBuffer =  il2cpp_codegen_class_from_type(type->type);
}

void SetGlobalType_JSObject(Il2CppReflectionType *type)
{
    if (!type)
    {
        Exception::Raise(Exception::GetInvalidOperationException("type of JSObject is null"));
    }
    g_typeofPersistentObjectInfo =  il2cpp_codegen_class_from_type(type->type);
}

void SetGlobalType_TypedValue(Il2CppReflectionType *type)
{
    if (!type)
    {
        Exception::Raise(Exception::GetInvalidOperationException("type of TypedValue is null"));
    }
    g_typeofTypedValue = il2cpp_codegen_class_from_type(type->type);
}

static void MethodCallback(pesapi_callback_info info) {
    try 
    {
        WrapData** wrapDatas = (WrapData**)pesapi_get_userdata(info);
        bool checkArgument = *wrapDatas && *(wrapDatas + 1);
        while(*wrapDatas)
        {
            if ((*wrapDatas)->Wrap((*wrapDatas)->Method, (*wrapDatas)->MethodPointer, info, checkArgument, *wrapDatas))
            {
                return;
            }
            ++wrapDatas;
        }
        pesapi_throw_by_string(info, "invalid arguments"); 
    } 
    catch (Il2CppExceptionWrapper& exception)
    {
        Il2CppClass* klass = il2cpp::vm::Object::GetClass(exception.ex);
        const MethodInfo* toStringMethod = il2cpp::vm::Class::GetMethodFromName(klass, "ToString", 0);

        Il2CppException* outException = NULL;
        Il2CppString* result = (Il2CppString*)il2cpp::vm::Runtime::Invoke(toStringMethod, exception.ex, NULL, &outException);
        if (outException != NULL)
        {
            pesapi_throw_by_string(info, "unknow c# execption!");
        }
        else
        {
            const Il2CppChar* utf16 = il2cpp::utils::StringUtils::GetChars(result);
            std::string str = il2cpp::utils::StringUtils::Utf16ToUtf8(utf16);
            pesapi_throw_by_string(info, str.c_str());
        }
    }
}

void GetFieldValue(void *ptr, FieldInfo *field, size_t offset, void *value)
{
    void *src;

    if (!(field->type->attrs & FIELD_ATTRIBUTE_STATIC))
    {
        IL2CPP_ASSERT(ptr);
        src = (char*)ptr + offset;
        Field::SetValueRaw(field->type, value, src, true);
    }
    else
    {
        Field::StaticGetValue(field, value);
    }
}

void* GetValueTypeFieldPtr(void *obj, FieldInfo *field, size_t offset)
{
    if (!(field->type->attrs & FIELD_ATTRIBUTE_STATIC))
    {
        IL2CPP_ASSERT(obj);
        return (char*)obj + offset;
    }
    else
    {
        Class::SetupFields(field->parent);

        void* threadStaticData = NULL;
        if (field->offset == THREAD_STATIC_FIELD_OFFSET)
            threadStaticData = Thread::GetThreadStaticDataForThread(field->parent->thread_static_fields_offset, il2cpp::vm::Thread::Current());
        
        if (field->offset == THREAD_STATIC_FIELD_OFFSET)
        {
            IL2CPP_ASSERT(NULL != threadStaticData);
            int threadStaticFieldOffset = MetadataCache::GetThreadLocalStaticOffsetForField(field);
            return ((char*)threadStaticData) + threadStaticFieldOffset;
        }
        else
        {
            return ((char*)field->parent->static_fields) + field->offset;
        }
    }
}

void SetFieldValue(void *ptr, FieldInfo *field, size_t offset, void *value)
{
    void *dest;

    if(!(field->type->attrs & FIELD_ATTRIBUTE_STATIC))
    {
        IL2CPP_ASSERT(ptr);
        dest = (char*)ptr + offset;
        Field::SetValueRaw(field->type, dest, value, true);
    }
    else
    {
        Field::StaticSetValue(field, value);
    }
}

void* GetDefaultValuePtr(const MethodInfo* method, uint32_t index)
{
    bool isExplicitySetNullDefaultValue = false;
    Il2CppObject* defaultValue = Parameter::GetDefaultParameterValueObject(method, &method->parameters[index], &isExplicitySetNullDefaultValue);
    return (defaultValue && (Class::FromIl2CppType(method->parameters[index].parameter_type, false)->valuetype)) ? Object::Unbox(defaultValue) : defaultValue;
}

static void* CtorCallback(pesapi_callback_info info);

static puerts::UnityExports g_unityExports;

static void* CtorCallback(pesapi_callback_info info)
{
    JsClassInfoHeader* classInfo = reinterpret_cast<JsClassInfoHeader*>(pesapi_get_constructor_userdata(info));
    
    void* Ptr = ObjectAllocate(classInfo->Class);
    
    g_unityExports.SetNativePtr(pesapi_get_this(info), Ptr, classInfo->TypeId);
    
    try
    {
        WrapData** wrapDatas = classInfo->CtorWrapDatas;
        bool checkArgument = *wrapDatas && *(wrapDatas + 1);
        while(*wrapDatas)
        {
            if ((*wrapDatas)->Wrap((*wrapDatas)->Method, (*wrapDatas)->MethodPointer, info, checkArgument, *wrapDatas))
            {
                return Ptr;
            }
            ++wrapDatas;
        }
        
        pesapi_throw_by_string(info, "invalid arguments");
        
    } 
    catch (Il2CppExceptionWrapper& exception)
    {
        Il2CppClass* klass = il2cpp::vm::Object::GetClass(exception.ex);
        const MethodInfo* toStringMethod = il2cpp::vm::Class::GetMethodFromName(klass, "ToString", 0);

        Il2CppException* outException = NULL;
        Il2CppString* result = (Il2CppString*)il2cpp::vm::Runtime::Invoke(toStringMethod, exception.ex, NULL, &outException);
        if (outException != NULL)
        {
            pesapi_throw_by_string(info, "unknow c# execption!");
        }
        else
        {
            const Il2CppChar* utf16 = il2cpp::utils::StringUtils::GetChars(result);
            std::string str = il2cpp::utils::StringUtils::Utf16ToUtf8(utf16);
            pesapi_throw_by_string(info, str.c_str());
        }
    }
    
    if(classInfo->Class->valuetype)
    {
        ValueTypeFree(Ptr);
    }
    
    return nullptr;
}

void ReleaseScriptObject(RuntimeObject* obj)
{
    int32_t _offset = 1;
    g_unityExports.UnrefJsObject(obj + _offset);
}

bool IsValueType(Il2CppClass *klass)
{
    return klass->valuetype;
}

bool IsDelegate(Il2CppClass *klass)
{
    return Class::IsAssignableFrom(il2cpp_defaults.delegate_class, klass) && klass != il2cpp_defaults.delegate_class && klass != il2cpp_defaults.multicastdelegate_class;
}

int GetTID(Il2CppObject* obj)
{
    if (obj)
    {
        const Il2CppType *type = Class::GetType(Object::GetClass(obj));
        return type->type;
    }
    return -1;
}

static FieldInfo* ArrayBufferCountField = nullptr;
static FieldInfo* ArrayBufferBytesField = nullptr;
pesapi_value TryTranslateBuiltin(pesapi_env env, Il2CppObject* obj)
{
    if (obj)
    {
        if (obj->klass == g_typeofPersistentObjectInfo)
        {
            PersistentObjectInfo* objectInfo = reinterpret_cast<PersistentObjectInfo*>(obj + 1);
            return g_unityExports.GetPersistentObject(env, objectInfo);
        }
        if (obj->klass == g_typeofArrayBuffer)
        {
            if (ArrayBufferBytesField == nullptr || ArrayBufferCountField == nullptr) {
                ArrayBufferCountField = il2cpp_class_get_field_from_name(g_typeofArrayBuffer, "Count");
                ArrayBufferBytesField = il2cpp_class_get_field_from_name(g_typeofArrayBuffer, "Bytes");
            }

            int32_t length = 0;
            il2cpp_field_get_value(obj, ArrayBufferCountField, &length);

            Il2CppArray* buffer;
            il2cpp_field_get_value(obj, ArrayBufferBytesField, &buffer);

            return pesapi_create_binary(env, Array::GetFirstElementAddress(buffer), (size_t) length);
        }
    }
    return nullptr;
}

static pesapi_value TryTranslatePrimitiveWithClass(pesapi_env env, Il2CppObject* obj, Il2CppClass *klass = nullptr)
{
    if (obj)
    {
        const Il2CppType *type = Class::GetType(klass ? klass : obj->klass);
        int t = type->type;
        if (t == IL2CPP_TYPE_STRING)
        {
            const Il2CppChar* utf16 = il2cpp::utils::StringUtils::GetChars((Il2CppString*)obj);
            std::string str = il2cpp::utils::StringUtils::Utf16ToUtf8(utf16);
            return pesapi_create_string_utf8(env, str.c_str(), str.size());
        }
        void* ptr = Object::Unbox(obj);
        switch (t)
        {
            case IL2CPP_TYPE_I1:
            {
                return pesapi_create_int32(env, (int32_t)(*((int8_t*)ptr)));
            }
            case IL2CPP_TYPE_BOOLEAN:
            {
                return pesapi_create_boolean(env, (bool)(*((uint8_t*)ptr)));
            }
            case IL2CPP_TYPE_U1:
            {
                return pesapi_create_uint32(env, (uint32_t)(*((uint8_t*)ptr)));
            }
            case IL2CPP_TYPE_I2:
            {
                return pesapi_create_int32(env, (int32_t)(*((int16_t*)ptr)));
            }
            case IL2CPP_TYPE_U2:
            {
                return pesapi_create_uint32(env, (uint32_t)(*((uint16_t*)ptr)));
            }
            case IL2CPP_TYPE_CHAR:
            {
                return pesapi_create_int32(env, (int32_t)(*((Il2CppChar*)ptr)));
            }
    #if IL2CPP_SIZEOF_VOID_P == 4
            case IL2CPP_TYPE_I:
    #endif
            case IL2CPP_TYPE_I4:
            {
                return pesapi_create_int32(env, (int32_t)(*((int32_t*)ptr)));
            }
    #if IL2CPP_SIZEOF_VOID_P == 4
            case IL2CPP_TYPE_U:
    #endif
            case IL2CPP_TYPE_U4:
            {
                return pesapi_create_uint32(env, (uint32_t)(*((uint32_t*)ptr)));
            }
    #if IL2CPP_SIZEOF_VOID_P == 8
            case IL2CPP_TYPE_I:
    #endif
            case IL2CPP_TYPE_I8:
            {
                return pesapi_create_int64(env, *((int64_t*)ptr));
            }
    #if IL2CPP_SIZEOF_VOID_P == 8
            case IL2CPP_TYPE_U:
    #endif
            case IL2CPP_TYPE_U8:
            {
                return pesapi_create_uint64(env, *((uint64_t*)ptr));
            }
            case IL2CPP_TYPE_R4:
            {
                return pesapi_create_double(env, (double)(*((float*)ptr)));
            }
            case IL2CPP_TYPE_R8:
            {
                return pesapi_create_double(env, *((double*)ptr));
            }
            
            default:
                return nullptr;
        }
    }
    
    return nullptr;
}

pesapi_value TryTranslatePrimitive(pesapi_env env, Il2CppObject* obj)
{
    return TryTranslatePrimitiveWithClass(env, obj);
}

union PrimitiveValueType
{
    int8_t i1;
    uint8_t u1;
    int16_t i2;
    uint16_t u2;
    int32_t i4;
    uint32_t u4;
    int64_t i8;
    uint64_t u8;
    Il2CppChar c;
    float r4;
    double r8;
};

Il2CppObject* JsValueToCSRef(Il2CppClass *klass, pesapi_env env, pesapi_value jsval)
{
    if (klass == il2cpp_defaults.void_class) return nullptr;
    
    if (!klass)
    {
        klass = il2cpp_defaults.object_class;
    }        
    
    const Il2CppType *type = Class::GetType(klass);
    int t = type->type;
    
    PrimitiveValueType data;
    
    void* toBox = &data;
    
    Il2CppObject* ret = nullptr;
    
handle_underlying:
    switch (t)
    {
        case IL2CPP_TYPE_I1:
        {
            data.i1 = (int8_t)pesapi_get_value_int32(env, jsval);
            break;
        }
        case IL2CPP_TYPE_BOOLEAN:
        {
            data.u1 = (uint8_t)pesapi_get_value_bool(env, jsval);
        }
        case IL2CPP_TYPE_U1:
        {
            data.u1 = (uint8_t)pesapi_get_value_uint32(env, jsval);
            break;
        }
        case IL2CPP_TYPE_I2:
        {
            data.i2 = (int16_t)pesapi_get_value_int32(env, jsval);
            break;
        }
        case IL2CPP_TYPE_U2:
        {
            data.u2 = (uint16_t)pesapi_get_value_uint32(env, jsval);
            break;
        }
        case IL2CPP_TYPE_CHAR:
        {
            data.c = (Il2CppChar)pesapi_get_value_uint32(env, jsval);
            break;
        }
#if IL2CPP_SIZEOF_VOID_P == 4
        case IL2CPP_TYPE_I:
#endif
        case IL2CPP_TYPE_I4:
        {
            data.i4 = (int32_t)pesapi_get_value_int32(env, jsval);
            break;
        }
#if IL2CPP_SIZEOF_VOID_P == 4
        case IL2CPP_TYPE_U:
#endif
        case IL2CPP_TYPE_U4:
        {
            data.u4 = (uint32_t)pesapi_get_value_uint32(env, jsval);
            break;
        }
#if IL2CPP_SIZEOF_VOID_P == 8
        case IL2CPP_TYPE_I:
#endif
        case IL2CPP_TYPE_I8:
        {
            data.i8 = pesapi_get_value_int64(env, jsval);
            break;
        }
#if IL2CPP_SIZEOF_VOID_P == 8
        case IL2CPP_TYPE_U:
#endif
        case IL2CPP_TYPE_U8:
        {
            data.u8 = pesapi_get_value_uint64(env, jsval);
            break;
        }
        case IL2CPP_TYPE_R4:
        {
            data.r4 = (float)pesapi_get_value_double(env, jsval);
            break;
        }
        case IL2CPP_TYPE_R8:
        {
            data.r8 = pesapi_get_value_double(env, jsval);
            break;
        }
        case IL2CPP_TYPE_STRING:
        {
            size_t bufsize = 0;
            auto str = pesapi_get_value_string_utf8(env, jsval, nullptr, &bufsize);
            if (str)
            {
                return (Il2CppObject*)il2cpp::vm::String::NewWrapper(str);
            }
            std::vector<char> buff;
            buff.resize(bufsize + 1);
            str = pesapi_get_value_string_utf8(env, jsval, buff.data(), &bufsize);
            if (str)
            {
                buff[bufsize] = '\0';
                return (Il2CppObject*)il2cpp::vm::String::NewWrapper(str);
            }
            return nullptr;
        }
        case IL2CPP_TYPE_SZARRAY:
        case IL2CPP_TYPE_CLASS:
        case IL2CPP_TYPE_OBJECT:
        case IL2CPP_TYPE_ARRAY:
        case IL2CPP_TYPE_FNPTR:
        case IL2CPP_TYPE_PTR:
        {
            if (pesapi_is_function(env, jsval))
            {
                if (IsDelegate(klass))
                {
                    return (Il2CppObject*)g_unityExports.FunctionToDelegate(env, jsval, klass, true);
                }
                return nullptr;
            }
            auto ptr = pesapi_get_native_object_ptr(env, jsval);
            if (!ptr)
            {
                if ((klass == g_typeofArrayBuffer || klass == il2cpp_defaults.object_class) && pesapi_is_binary(env, jsval)) 
                {
                    RuntimeObject* ret = il2cpp::vm::Object::New(g_typeofArrayBuffer);

                    const MethodInfo* ctor = il2cpp_class_get_method_from_name(g_typeofArrayBuffer, ".ctor", 2);
                    typedef void (*NativeCtorPtr)(Il2CppObject* ___this, void*, int, const MethodInfo* method);
                    
                    void* data;
                    size_t length;
                    data = pesapi_get_value_binary(env, jsval, &length);
                    ((NativeCtorPtr)ctor->methodPointer)(ret, data, length, ctor);   
                    return ret;
                }
                if ((klass == g_typeofPersistentObjectInfo || klass == il2cpp_defaults.object_class) && pesapi_is_object(env, jsval))
                {
                    Il2CppClass* persistentObjectInfoClass = g_typeofPersistentObjectInfo;
                    
                    RuntimeObject* ret = (RuntimeObject*)g_unityExports.GetRuntimeObjectFromPersistentObject(env, jsval);
                    if (ret == nullptr) 
                    {
                        ret = il2cpp::vm::Object::New(persistentObjectInfoClass);

                        const MethodInfo* ctor = il2cpp_class_get_method_from_name(persistentObjectInfoClass, ".ctor", 0);
                        typedef void (*NativeCtorPtr)(Il2CppObject* ___this, const MethodInfo* method);
                        ((NativeCtorPtr)ctor->methodPointer)(ret, ctor);
                        
                        PersistentObjectInfo* objectInfo = reinterpret_cast<PersistentObjectInfo*>(ret + 1);
                        g_unityExports.SetPersistentObject(env, jsval, objectInfo);
                        g_unityExports.SetRuntimeObjectToPersistentObject(env, jsval, ret);
                    }
                    return ret;
                }
                if (klass == il2cpp_defaults.object_class)
                {
                    if (pesapi_is_string(env, jsval))
                    {
                        t = IL2CPP_TYPE_STRING;
                        klass = il2cpp_defaults.string_class;
                    }
                    else if (pesapi_is_double(env, jsval))
                    {
                        t = IL2CPP_TYPE_R8;
                        klass = il2cpp_defaults.double_class;
                    }
                    else if (pesapi_is_int32(env, jsval))
                    {
                        t = IL2CPP_TYPE_I4;
                        klass = il2cpp_defaults.int32_class;
                    }
                    else if (pesapi_is_uint32(env, jsval))
                    {
                        t = IL2CPP_TYPE_U4;
                        klass = il2cpp_defaults.uint32_class;
                    }
                    else if (pesapi_is_int64(env, jsval))
                    {
                        t = IL2CPP_TYPE_I8;
                        klass = il2cpp_defaults.int64_class;
                    }
                    else if (pesapi_is_uint64(env, jsval))
                    {
                        t = IL2CPP_TYPE_U8;
                        klass = il2cpp_defaults.uint64_class;
                    }
                    else if (pesapi_is_boolean(env, jsval))
                    {
                        t = IL2CPP_TYPE_BOOLEAN;
                        klass = il2cpp_defaults.boolean_class;
                    }
                    else
                    {
                        goto return_nothing;
                    }
                    goto handle_underlying;
                }
            return_nothing:
                return nullptr;
            }
            auto objClass = (Il2CppClass *)pesapi_get_native_object_typeid(env, jsval);
            if (klass == il2cpp_defaults.object_class && g_typeofTypedValue && Class::IsAssignableFrom(g_typeofTypedValue, objClass))
            {
                const MethodInfo* get_Target = il2cpp_class_get_method_from_name(objClass, "get_Target", 0);
                if (get_Target)
                {
                    typedef Il2CppObject* (*NativeFuncPtr)(void* ___this, const MethodInfo* method);
                    return ((NativeFuncPtr)get_Target->methodPointer)(ptr, get_Target);
                }
            }
            if (Class::IsAssignableFrom(klass, objClass))
            {
                return objClass->valuetype ? Object::Box(objClass, ptr) : (Il2CppObject*)ptr;
            }
            return nullptr;
        }
        case IL2CPP_TYPE_VALUETYPE:
            /* note that 't' and 'type->type' can be different */
            if (type->type == IL2CPP_TYPE_VALUETYPE && Type::IsEnum(type))
            {
                t = Class::GetEnumBaseType(Type::GetClass(type))->type;
                goto handle_underlying;
            }
            else
            {
                auto objClass = (Il2CppClass *)pesapi_get_native_object_typeid(env, jsval);
                if (!Class::IsAssignableFrom(klass, objClass))
                {
                    return nullptr;
                }
                toBox = pesapi_get_native_object_ptr(env, jsval);
                if (!toBox)
                {
                    std::string message = "expect ValueType: ";
                    message += klass->name;
                    message += ", by got null";
                    Exception::Raise(Exception::GetInvalidOperationException(message.c_str()));
                    return nullptr;
                }
            }
            break;
        case IL2CPP_TYPE_GENERICINST:
            t = GenericClass::GetTypeDefinition(type->data.generic_class)->byval_arg.type;
            goto handle_underlying;
        default:
            IL2CPP_ASSERT(0);
    }
    return Object::Box(klass, toBox);
}

pesapi_value CSRefToJsValue(pesapi_env env, Il2CppClass *klass, Il2CppObject* obj)
{
    if (klass == il2cpp_defaults.void_class || !obj) return pesapi_create_undefined(env);
    
    if (!klass)
    {
        klass = il2cpp_defaults.object_class;
    }        
    
    pesapi_value jsVal = TryTranslatePrimitiveWithClass(env, obj, klass != il2cpp_defaults.object_class ? klass : nullptr);
    
    if (jsVal) 
    {
        return jsVal;
    }
    
    jsVal = TryTranslateBuiltin(env, obj);
    
    if (jsVal) 
    {
        return jsVal;
    }
    
    if (klass->valuetype)
    {
        auto len = klass->native_size;
        if (len < 0)
        {
            len = klass->instance_size - sizeof(Il2CppObject);
        }
        
        auto buff = new uint8_t[len];
        memcpy(buff, Object::Unbox(obj), len);
        return pesapi_create_native_object(env, klass, buff, true);
    }
    auto objClass = obj && obj->klass ? obj->klass : klass;
    return pesapi_create_native_object(env, objClass, obj, false);
}

static bool GetValueTypeFromJs(pesapi_env env, pesapi_value jsValue, Il2CppClass* klass, void* storage)
{
    bool hasValue = false;
    uint32_t valueSize = klass->instance_size - sizeof(Il2CppObject);
    if (!jsValue) return false;
    if (pesapi_is_object(env, jsValue))
    {
        auto ptr = pesapi_get_native_object_ptr(env, jsValue);
        if (ptr)
        {
            auto objClass = (Il2CppClass *)pesapi_get_native_object_typeid(env, jsValue);
            if (Class::IsAssignableFrom(klass, objClass))
            {
                hasValue = true;
                memcpy(storage, ptr, valueSize);
            }
        }
    } else {
        const Il2CppType *type = Class::GetType(klass);
        PrimitiveValueType data;
        data.i8 = 0;
        int t = type->type;
handle_underlying:
        switch (t)
        {
            case IL2CPP_TYPE_I1:
            {
                if (pesapi_is_int32(env, jsValue))
                {
                    data.i1 = (int8_t)pesapi_get_value_int32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_BOOLEAN:
            {
                if (pesapi_is_boolean(env, jsValue))
                {
                    data.u1 = (uint8_t)pesapi_get_value_bool(env, jsValue);
                    hasValue = true;
                }
            }
            case IL2CPP_TYPE_U1:
            {
                if (pesapi_is_uint32(env, jsValue))
                {
                    data.u1 = (uint8_t)pesapi_get_value_uint32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_I2:
            {
                if (pesapi_is_int32(env, jsValue))
                {
                    data.i2 = (int16_t)pesapi_get_value_int32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_U2:
            {
                if (pesapi_is_uint32(env, jsValue))
                {
                    data.u2 = (uint16_t)pesapi_get_value_uint32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_CHAR:
            {
                if (pesapi_is_uint32(env, jsValue))
                {
                    data.c = (Il2CppChar)pesapi_get_value_uint32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
    #if IL2CPP_SIZEOF_VOID_P == 4
            case IL2CPP_TYPE_I:
    #endif
            case IL2CPP_TYPE_I4:
            {
                if (pesapi_is_int32(env, jsValue))
                {
                    data.i4 = (int32_t)pesapi_get_value_int32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
    #if IL2CPP_SIZEOF_VOID_P == 4
            case IL2CPP_TYPE_U:
    #endif
            case IL2CPP_TYPE_U4:
            {
                if (pesapi_is_uint32(env, jsValue))
                {
                    data.u4 = (uint32_t)pesapi_get_value_uint32(env, jsValue);
                    hasValue = true;
                }
                break;
            }
    #if IL2CPP_SIZEOF_VOID_P == 8
            case IL2CPP_TYPE_I:
    #endif
            case IL2CPP_TYPE_I8:
            {
                if (pesapi_is_int32(env, jsValue))
                {
                    data.i8 = (uint32_t) pesapi_get_value_uint32(env, jsValue);
                    hasValue = true;
                }
                if (pesapi_is_int64(env, jsValue) || pesapi_is_string(env, jsValue))
                {
                    data.i8 = pesapi_get_value_int64(env, jsValue);
                    hasValue = true;
                }
                break;
            }   
    #if IL2CPP_SIZEOF_VOID_P == 8
            case IL2CPP_TYPE_U:
    #endif
            case IL2CPP_TYPE_U8:
            {
                if (pesapi_is_uint32(env, jsValue))
                {
                    data.u8 = (uint64_t) pesapi_get_value_uint32(env, jsValue);
                    hasValue = true;
                }
                if (pesapi_is_uint64(env, jsValue) || pesapi_is_string(env, jsValue))
                {
                    data.u8 = pesapi_get_value_uint64(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_R4:
            {
                if (pesapi_is_double(env, jsValue))
                {
                    data.r4 = (float)pesapi_get_value_double(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_R8:
            {
                if (pesapi_is_double(env, jsValue))
                {
                    data.r8 = pesapi_get_value_double(env, jsValue);
                    hasValue = true;
                }
                break;
            }
            case IL2CPP_TYPE_VALUETYPE:
            /* note that 't' and 'type->type' can be different */
            if (type->type == IL2CPP_TYPE_VALUETYPE && Type::IsEnum(type))
            {
                t = Class::GetEnumBaseType(Type::GetClass(type))->type;
                goto handle_underlying;
            }
        }
    
        if(hasValue)
        {
            memcpy(storage, &data, valueSize);
        }
    }
    return hasValue;
}

static pesapi_value JsObjectUnRef(pesapi_env env, pesapi_value jsValue)
{
    return (pesapi_is_object(env, jsValue)) ?  pesapi_get_property_uint32(env, jsValue, 0) : nullptr;
}

static void JsObjectSetRef(pesapi_env env, pesapi_value outer, pesapi_value val)
{
    if (outer && val && pesapi_is_object(env, outer))
    {
        pesapi_set_property_uint32(env, outer, 0, val);
    }
}

static bool ReflectionWrapper(MethodInfo* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, bool checkJSArgument, WrapData* wrapData)
{
    pesapi_env env = pesapi_get_env(info);
    int js_args_len = pesapi_get_args_len(info);
    bool hasParamArray = wrapData->HasParamArray;
    bool isExtensionMethod = wrapData->IsExtensionMethod;
    auto csArgStart = isExtensionMethod ? 1 : 0;
    
    if (checkJSArgument)
    {
        if (!hasParamArray && wrapData->OptionalNum == 0)
        {
            if (js_args_len != method->parameters_count - csArgStart)
            {
                return false;
            }
        }
        else
        {
            auto requireNum = method->parameters_count - csArgStart - wrapData->OptionalNum - (hasParamArray ? 1 : 0);
            if (js_args_len < requireNum)
            {
                return false;
            }
        }
        for (int i = csArgStart; i < method->parameters_count; ++i)
        {
            bool passedByReference = method->parameters[i].parameter_type->byref;
            bool hasDefault = method->parameters[i].parameter_type->attrs & PARAM_ATTRIBUTE_HAS_DEFAULT;
            bool isLastArgument = i == (method->parameters_count - 1);
            Il2CppClass* parameterType = Class::FromIl2CppType(method->parameters[i].parameter_type);
            Class::Init(parameterType);
            pesapi_value jsValue = pesapi_get_arg(info, i - csArgStart);
            
            if ((hasDefault && pesapi_is_undefined(env, jsValue)) || (isLastArgument && hasParamArray))
            {
                continue;
            }
            
            if (passedByReference)
            {
                if (pesapi_is_object(env, jsValue))
                {
                    continue;
                }
                else
                {
                    return false;
                }
            }
            int t = method->parameters[i].parameter_type->type;
handle_underlying:
            switch (t)
            {
                case IL2CPP_TYPE_I1:
                case IL2CPP_TYPE_I2:
#if IL2CPP_SIZEOF_VOID_P == 4
                case IL2CPP_TYPE_I:
#endif
                case IL2CPP_TYPE_I4:
                {
                    if (!pesapi_is_int32(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
                case IL2CPP_TYPE_BOOLEAN:
                {
                    if (!pesapi_is_boolean(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
                case IL2CPP_TYPE_U1:
                case IL2CPP_TYPE_U2:
                case IL2CPP_TYPE_CHAR:
#if IL2CPP_SIZEOF_VOID_P == 4
                case IL2CPP_TYPE_U:
#endif
                case IL2CPP_TYPE_U4:
                {
                    if (!pesapi_is_uint32(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
        #if IL2CPP_SIZEOF_VOID_P == 8
                case IL2CPP_TYPE_I:
        #endif
                case IL2CPP_TYPE_I8:
                {
                    if (!pesapi_is_int64(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
        #if IL2CPP_SIZEOF_VOID_P == 8
                case IL2CPP_TYPE_U:
        #endif
                case IL2CPP_TYPE_U8:
                {
                    if (!pesapi_is_uint64(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
                case IL2CPP_TYPE_R4:
                case IL2CPP_TYPE_R8:
                {
                    if (!pesapi_is_double(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
                case IL2CPP_TYPE_STRING:
                {
                    if (!pesapi_is_string(env, jsValue))
                    {
                        return false;
                    }
                    break;
                }
                case IL2CPP_TYPE_SZARRAY:
                case IL2CPP_TYPE_CLASS:
                case IL2CPP_TYPE_OBJECT:
                case IL2CPP_TYPE_ARRAY:
                case IL2CPP_TYPE_FNPTR:
                case IL2CPP_TYPE_PTR:
                {
                    if (pesapi_is_function(env, jsValue) && !(Class::IsAssignableFrom(il2cpp_defaults.multicastdelegate_class, parameterType) && parameterType != il2cpp_defaults.multicastdelegate_class))
                    {
                        return false;
                    }
                    if (parameterType == il2cpp_defaults.object_class)
                    {
                        continue;
                    }
                    auto ptr = pesapi_get_native_object_ptr(env, jsValue);
                    if (ptr)
                    {
                        auto objClass = (Il2CppClass *)pesapi_get_native_object_typeid(env, jsValue);
                        if (!Class::IsAssignableFrom(parameterType, objClass))
                        {
                            return false;
                        }
                    }
                    //nullptr will match ref type
                    break;
                }
                case IL2CPP_TYPE_VALUETYPE:
                    /* note that 't' and 'type->type' can be different */
                    if (method->parameters[i].parameter_type->type == IL2CPP_TYPE_VALUETYPE && Type::IsEnum(method->parameters[i].parameter_type))
                    {
                        t = Class::GetEnumBaseType(Type::GetClass(method->parameters[i].parameter_type))->type;
                        goto handle_underlying;
                    }
                    else
                    {
                        auto objClass = (Il2CppClass *)pesapi_get_native_object_typeid(env, jsValue);
                        if (!objClass || !Class::IsAssignableFrom(parameterType, objClass))
                        {
                            return false;
                        }
                    }
                    break;
                case IL2CPP_TYPE_GENERICINST:
                    t = GenericClass::GetTypeDefinition(method->parameters[i].parameter_type->data.generic_class)->byval_arg.type;
                    goto handle_underlying;
                default:
                    IL2CPP_ASSERT(0);
            }
        }
    }
    void** args = method->parameters_count > 0 ? (void**)alloca(sizeof(void*) * method->parameters_count) : nullptr;
    pesapi_value jsThis = pesapi_get_holder(info);
    void* csThis = nullptr;
    if (Method::IsInstance(method))
    {
        csThis = pesapi_get_native_object_ptr(env, jsThis);
        Il2CppClass* thisType = method->klass;
        if (thisType->valuetype)
        {
            csThis = ((uint8_t*)csThis) - sizeof(Il2CppObject);
        }
    }
    if (isExtensionMethod)
    {
        args[0] = pesapi_get_native_object_ptr(env, jsThis);
    }
    
    for (int i = csArgStart; i < method->parameters_count; ++i) 
    {
        bool passedByReference = method->parameters[i].parameter_type->byref;
        bool hasDefault = method->parameters[i].parameter_type->attrs & PARAM_ATTRIBUTE_HAS_DEFAULT;
        bool isLastArgument = i == (method->parameters_count - 1);
        Il2CppClass* parameterType = Class::FromIl2CppType(method->parameters[i].parameter_type);
        Class::Init(parameterType);
        
        if (isLastArgument && hasParamArray)
        {
            int jsParamStart = i - csArgStart;
            auto elementType = Class::FromIl2CppType(&parameterType->element_class->byval_arg);
            auto arrayLen = js_args_len - jsParamStart > 0 ? js_args_len - jsParamStart : 0;
            auto array = Array::NewSpecific(parameterType, arrayLen);
            if (elementType->valuetype)
            {
                auto valueSize = elementType->instance_size - sizeof(Il2CppObject);
                char* addr = Array::GetFirstElementAddress(array);
                for(int j = jsParamStart; j < js_args_len; ++j)
                {
                    GetValueTypeFromJs(env, pesapi_get_arg(info, j), elementType, addr + valueSize * (j - i + csArgStart));
                }
            }
            else
            {
                for(int j = jsParamStart; j < js_args_len; ++j)
                {
                    il2cpp_array_setref(array, j - i + csArgStart, JsValueToCSRef(elementType, env, pesapi_get_arg(info, j)));
                }
            }
            args[i] = array;
            continue;
        }
        
        pesapi_value jsValue = pesapi_get_arg(info, i - csArgStart);
        
        if (parameterType->valuetype)
        {
            if (Class::IsNullable(parameterType))
            {
                void* storage = alloca(parameterType->instance_size - sizeof(Il2CppObject));
                auto underlyClass = Class::GetNullableArgument(parameterType);
                uint32_t valueSize = underlyClass->instance_size - sizeof(Il2CppObject);
                bool hasValue = GetValueTypeFromJs(env, jsValue, underlyClass, storage);
                *(static_cast<uint8_t*>(storage) + valueSize) = hasValue;
                args[i] = storage;
            }
            else if (passedByReference)
            {
                auto underlyClass = Class::FromIl2CppType(&parameterType->byval_arg);
                void* storage = alloca(underlyClass->instance_size - sizeof(Il2CppObject));
                jsValue = JsObjectUnRef(env, jsValue);
                GetValueTypeFromJs(env, jsValue, underlyClass, storage);
                args[i] = storage;
            }
            else if (hasDefault && pesapi_is_undefined(env, jsValue))
            {
                void* storage = GetDefaultValuePtr(method, i);
                if (!storage)
                {
                    auto valueSize = parameterType->instance_size - sizeof(Il2CppObject);
                    storage = alloca(valueSize);
                    memset(storage, 0, valueSize);
                }
                args[i] = storage;
            }
            else
            {
                void* storage = alloca(parameterType->instance_size - sizeof(Il2CppObject));
                bool hasValue = GetValueTypeFromJs(env, jsValue, parameterType, storage);
                if (!hasValue) return false;
                args[i] = storage;
            }
        }
        else if (passedByReference)
        {
            //convertedParameters[i] = &parameters[i]; // Reference type passed by reference
            void** arg = (void**)alloca(sizeof(void*));
            *arg = nullptr;
            auto underlyClass = Class::FromIl2CppType(&parameterType->byval_arg);
            jsValue = JsObjectUnRef(env, jsValue);
            if (jsValue)
            {
                auto ptr = pesapi_get_native_object_ptr(env, jsValue);
                if (ptr)
                {
                    auto objClass = (Il2CppClass *)pesapi_get_native_object_typeid(env, jsValue);
                    if (Class::IsAssignableFrom(underlyClass, objClass))
                    {
                        *arg = ptr;
                    }
                }
                else if (underlyClass == il2cpp_defaults.object_class) // any type
                {
                    *arg = JsValueToCSRef(underlyClass, env, jsValue);
                }
            }
            args[i] = arg;
        }
        else if (parameterType->byval_arg.type == IL2CPP_TYPE_PTR)
        {
            auto underlyClass = Class::FromIl2CppType(&parameterType->element_class->byval_arg);
            void* storage = alloca(underlyClass->instance_size - sizeof(Il2CppObject));
            jsValue = JsObjectUnRef(env, jsValue);
            args[i] = GetValueTypeFromJs(env, jsValue, underlyClass, storage) ? storage : nullptr;
        }
        else
        {
            args[i] = (hasDefault && pesapi_is_undefined(env, jsValue)) ? GetDefaultValuePtr(method, i): JsValueToCSRef(parameterType, env, jsValue);
        }
    }
    
    Il2CppObject* ret = Runtime::InvokeWithThrow(method, csThis, args); //返回ValueType有boxing
    
    for (int i = csArgStart; i < method->parameters_count; ++i)
    {
        bool passedByReference = method->parameters[i].parameter_type->byref;
        Il2CppClass* parameterType = Class::FromIl2CppType(method->parameters[i].parameter_type);
        
        pesapi_value jsValue = pesapi_get_arg(info, i - csArgStart);
        
        if (parameterType->valuetype && passedByReference && !Class::IsNullable(parameterType))
        {
            auto underlyClass = Class::FromIl2CppType(&parameterType->byval_arg);
            JsObjectSetRef(env, jsValue, CSRefToJsValue(env, underlyClass, (Il2CppObject*)(((uint8_t*)args[i]) - sizeof(Il2CppObject))));
        }
        else if (passedByReference)
        {
            Il2CppObject** arg = (Il2CppObject**)args[i];
            auto underlyClass = Class::FromIl2CppType(&parameterType->byval_arg);
            JsObjectSetRef(env, jsValue, CSRefToJsValue(env, underlyClass, *arg));
        }
        else if (parameterType->byval_arg.type == IL2CPP_TYPE_PTR)
        {
            auto underlyClass = Class::FromIl2CppType(&parameterType->element_class->byval_arg);
            JsObjectSetRef(env, jsValue, CSRefToJsValue(env, underlyClass, (Il2CppObject*)(((uint8_t*)args[i]) - sizeof(Il2CppObject))));
        }
    }
    
    pesapi_add_return(info, CSRefToJsValue(env, Class::FromIl2CppType(method->return_type), ret));
    
    return true;
}

static void ThrowInvalidOperationException(const char* msg)
{
    Exception::Raise(Exception::GetInvalidOperationException(msg));
}

Il2CppArray* NewArray(Il2CppClass *typeId, uint32_t length)
{
    return Array::NewSpecific(typeId, length);
}

void ArraySetRef(Il2CppArray *array, uint32_t index, void* value)
{
    il2cpp_array_setref(array, index, value);
}

puerts::UnityExports* GetUnityExports()
{
    g_unityExports.ObjectAllocate = &ObjectAllocate;
    g_unityExports.DelegateAllocate = &DelegateAllocate; 
    g_unityExports.ValueTypeDeallocate = &ValueTypeFree;
    g_unityExports.MethodCallback = &MethodCallback;
    g_unityExports.ConstructorCallback = &CtorCallback;
    g_unityExports.FieldGet = &GetFieldValue;
    g_unityExports.FieldSet = &SetFieldValue;
    g_unityExports.GetValueTypeFieldPtr = &GetValueTypeFieldPtr;
    g_unityExports.IsInst = &Object::IsInst;
    g_unityExports.IsInstClass = &IsInstClass;
    g_unityExports.IsInstSealed = &IsInstSealed;
    g_unityExports.IsValueType = &IsValueType;
    g_unityExports.IsDelegate = &IsDelegate;
    g_unityExports.IsAssignableFrom = &Class::IsAssignableFrom;
    g_unityExports.JsValueToCSRef = &JsValueToCSRef;
    g_unityExports.CSharpTypeToTypeId = &CSharpTypeToTypeId;
    g_unityExports.CStringToCSharpString = &String::NewWrapper;
    g_unityExports.TryTranslatePrimitive = &TryTranslatePrimitive;
    g_unityExports.TryTranslateBuiltin = &TryTranslateBuiltin;
    g_unityExports.GetTID = &GetTID;
    g_unityExports.ThrowInvalidOperationException = &ThrowInvalidOperationException;
    g_unityExports.GetReturnType = &GetReturnType;
    g_unityExports.GetParameterType = &GetParameterType;
    g_unityExports.NewArray = NewArray;
    g_unityExports.GetArrayFirstElementAddress = Array::GetFirstElementAddress;
    g_unityExports.ArraySetRef = ArraySetRef;
    g_unityExports.GetArrayElementTypeId = Class::GetElementClass;
    g_unityExports.GetArrayLength = Array::GetLength;
    g_unityExports.GetDefaultValuePtr = GetDefaultValuePtr;
    g_unityExports.ReflectionWrapper = ReflectionWrapper;
    g_unityExports.SizeOfRuntimeObject = sizeof(RuntimeObject);
    return &g_unityExports;
}

namespace internal
{
class AutoValueScope
{
public:
    AutoValueScope(pesapi_env_holder env_holder)
    {
        scope = pesapi_open_scope(env_holder);
    }

    ~AutoValueScope()
    {
        pesapi_close_scope(scope);
    }

    pesapi_scope scope;
};
}    // namespace internal

Il2CppObject* EvalInternal(intptr_t ptr, Il2CppArray * __code, Il2CppString* __path, Il2CppReflectionType *__type)
{
    pesapi_env_holder env_holder = reinterpret_cast<pesapi_env_holder>(ptr);
    
    internal::AutoValueScope ValueScope(env_holder);
    auto env = pesapi_get_env_from_holder(env_holder);
    
    const Il2CppChar* utf16 = il2cpp::utils::StringUtils::GetChars(__path);
    std::string path = il2cpp::utils::StringUtils::Utf16ToUtf8(utf16);
    
    auto codeSize = il2cpp_array_length(__code);
    uint8_t* code = (uint8_t*)il2cpp_array_addr_with_size(__code, il2cpp_array_element_size(__code->klass), 0);
    
    auto ret = pesapi_eval(env, code, codeSize, path.c_str());
    
    if (pesapi_has_caught(ValueScope.scope))
    {
        Exception::Raise(Exception::GetInvalidOperationException(pesapi_get_exception_as_string(ValueScope.scope, true)));
        return nullptr;
    }
    if (__type)
    {
        auto csRet = JsValueToCSRef(il2cpp_codegen_class_from_type(__type->type), env, ret);
        if (pesapi_has_caught(ValueScope.scope))
        {
            Exception::Raise(Exception::GetInvalidOperationException(pesapi_get_exception_as_string(ValueScope.scope, true)));
            return nullptr;
        }
        return csRet;
    }
    return nullptr;
}

}

#ifdef __cplusplus
extern "C" {
#endif

void pesapi_init(pesapi_func_ptr* func_array);

void InitialPuerts(pesapi_func_ptr* func_array)
{
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetMethodPointer(System.Reflection.MethodBase)", (Il2CppMethodPointer)puerts::GetMethodPointer);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetMethodInfoPointer(System.Reflection.MethodBase)", (Il2CppMethodPointer)puerts::GetMethodInfoPointer);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetObjectPointer(System.Object)", (Il2CppMethodPointer)puerts::GetObjectPointer);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetTypeId(System.Type)", (Il2CppMethodPointer)puerts::GetTypeId);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetFieldOffset(System.Reflection.FieldInfo,System.Boolean)", (Il2CppMethodPointer)puerts::GetFieldOffset);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetFieldInfoPointer(System.Reflection.FieldInfo)", (Il2CppMethodPointer)puerts::GetFieldInfoPointer);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::SetGlobalType_TypedValue(System.Type)", (Il2CppMethodPointer)puerts::SetGlobalType_TypedValue);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::SetGlobalType_JSObject(System.Type)", (Il2CppMethodPointer)puerts::SetGlobalType_JSObject);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::SetGlobalType_ArrayBuffer(System.Type)", (Il2CppMethodPointer)puerts::SetGlobalType_ArrayBuffer);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::GetUnityExports()", (Il2CppMethodPointer)puerts::GetUnityExports);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::EvalInternal(System.IntPtr,System.Byte[],System.String,System.Type)", (Il2CppMethodPointer)puerts::EvalInternal);
    InternalCalls::Add("PuertsIl2cpp.NativeAPI::TypeIdToType(System.IntPtr)", (Il2CppMethodPointer)puerts::TypeIdToType);
    InternalCalls::Add("Puerts.JSObject::releaseScriptObject()", (Il2CppMethodPointer)puerts::ReleaseScriptObject);
    pesapi_init(func_array);
}

#ifdef __cplusplus
}
#endif


