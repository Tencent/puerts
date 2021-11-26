#ifndef INCLUDE_V8_H_
#define INCLUDE_V8_H_

#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#include <memory>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>
#include <iostream>
#include <map>
#include <set>
#include <functional>

#include "libplatform/libplatform.h"

#include "v8config.h"     // NOLINT(build/include_directory)
#include "quickjs-msvc.h"

#define JS_TAG_EXTERNAL (JS_TAG_FLOAT64 + 1)

#define V8_MAJOR_VERSION 7
#define V8_MINOR_VERSION 7
#define V8_BUILD_NUMBER 299
#define V8_PATCH_LEVEL 0

namespace v8 {
class Object;
class Isolate;
class Context;
template <class T>
class MaybeLocal;
class Data;
class Template;
class ObjectTemplate;
class FunctionTemplate;
template<typename T>
class FunctionCallbackInfo;
class String;
class TryCatch;
class Module;
class Script;
class Message;
class Value;
class Primitive;

class PrimitiveArray;
class Boolean;
class HandleScope;
class BigInt;
template <class T> class PersistentBase;
class Number;
template <class T> class PropertyCallbackInfo;
class Integer;
class Int32;
class EscapableHandleScope;
class Array;
class Name;

class ScriptCompiler;

class V8_EXPORT StartupData {
public:
    const char* data;
    int raw_size;
};

class V8_EXPORT V8 {
public:
    V8_INLINE static void SetSnapshotDataBlob(StartupData* startup_blob) {
        //Do nothing
    }

    V8_INLINE static void InitializePlatform(Platform* platform) {
        //Do nothing
    }

    V8_INLINE static bool Initialize() {
        //Do nothing
        return true;
    }

    V8_INLINE static void ShutdownPlatform() {
        //Do nothing
    }

    V8_INLINE static bool Dispose() {
        //Do nothing
        return true;
    }

    V8_INLINE static void FromJustIsNothing() {
        //Utils::ApiCheck(false, "v8::FromJust", "Maybe value is Nothing.");
        std::cerr << "v8::FromJust, Maybe value is Nothing." << std::endl;
        abort();
    }
    
    V8_INLINE static void Check(bool b, const char* msg) {
        //Utils::ApiCheck(false, "v8::FromJust", "Maybe value is Nothing.");
        if (!b) {
            std::cerr << msg << std::endl;
            abort();
        }
    }
    
    V8_INLINE static void SetFlagsFromString(const char* str) {
    }
    
    V8_INLINE static void SetFlagsFromString(const char* str, size_t length) {
    }
};

Value* AllocValue_(Isolate * isolate);

void IncRef_(Isolate * isolate, JSValue val);

void DecRef_(Isolate * isolate, JSValue val);

void SetGlobal_(Isolate * isolate, Value * des, Value* src);

void * GetUserData_(Isolate * isolate, JSValue val);

Value *EscapeValue_(Value* val, EscapableHandleScope* scope);

template <class T>
class Local {
public:
    V8_INLINE Local() : val_(nullptr) {}
    template <class S>
    V8_INLINE Local(Local<S> that) {
        static_assert(std::is_base_of<T, S>::value, "type check");
        val_ = reinterpret_cast<T*>(*that);
    }

    V8_INLINE Local(const Local<T> &that) {
        val_ = reinterpret_cast<T*>(*that);
    }

    explicit V8_INLINE Local(T* that) {
        val_ = that;
    }

    Local<T>& operator=(const Local<T>& that) {
        if (&that == this) {
            return *this;
        }
        val_ = that.val_;
        return *this;
    }

    ~Local() {
    }

    V8_INLINE bool IsEmpty() const { return val_ == nullptr; }

    V8_INLINE T* operator->() const { return val_; }

    V8_INLINE T* operator*() const { return val_; }

    template <class S> V8_INLINE static Local<T> Cast(Local<S> that) {
#ifdef V8_ENABLE_CHECKS
        // If we're going to perform the type check then we have to check
        // that the handle isn't empty before doing the checked cast.
        if (that.IsEmpty()) return Local<T>();
#endif
        Local<T> result;
        result.val_ = T::Cast(*that);
        return result;
    }

    template <class S>
    V8_INLINE Local<S> As() const {
        return Local<S>::Cast(*this);
    }
    
    V8_INLINE bool operator==(const Local<T>& that) const {
        return val_ == that.val_;
    }
    
    V8_INLINE bool operator<(const Local<T>& that)  const {
        return val_ < that.val_;
    }
    
    V8_INLINE bool SupportWeak() {
        return !IsEmpty();
    }
    
    V8_INLINE Local<T> Clone(Isolate * isolate) const {
        T* ret = static_cast<T*>(AllocValue_(isolate));
        ret->value_ = val_->value_;
        return Local<T>(ret);
        //return *this;
    }
    
    V8_INLINE void IncRef(Isolate * isolate) {
        IncRef_(isolate, val_->value_);
    }
    
    V8_INLINE void * GetUserData(Isolate * isolate) {
        return GetUserData_(isolate, val_->value_);
    }
    
    V8_INLINE void DecRef(Isolate * isolate) {
        DecRef_(isolate, val_->value_);
    }
    
    V8_INLINE void SetGlobal(Isolate * isolate, Value *val) {
        SetGlobal_(isolate, val, val_);
        val_ = static_cast<T*>(val);
    }
    
    V8_INLINE Local<T> Escape(EscapableHandleScope* scope) {
        T* val = static_cast<T*>(EscapeValue_(val_, scope));
        return Local<T>(val);
    }
    
    V8_INLINE static Local<T> New(Isolate* isolate, const PersistentBase<T>& that) {
        return that.Get(isolate);
    }

    T* val_;
};

template <class T>
class LocalSharedPtrImpl {
public:
    template <class S>
    V8_INLINE LocalSharedPtrImpl(Local<S> that) {
        static_assert(std::is_base_of<T, S>::value, "type check");
        val_ = that.val_;
    }
    
    V8_INLINE LocalSharedPtrImpl(){}
    
    V8_INLINE LocalSharedPtrImpl(const Local<T> &that) {
        val_ = that.val_;
    }

    explicit V8_INLINE LocalSharedPtrImpl(T* that) :val_(that) {
    }

    V8_INLINE LocalSharedPtrImpl<T>& operator=(const Local<T>& that) {
        val_ = that.val_;
        return *this;
    }

    V8_INLINE bool IsEmpty() const { return val_ == nullptr; }

    V8_INLINE T* operator->() const { return val_.get(); }

    V8_INLINE T* operator*() const { return val_.get(); }
    
    template <class S> V8_INLINE static Local<T> Cast(Local<S> that) {
        Local<T> result;
        result.val_ = std::dynamic_pointer_cast<T>(that.val_);
        return result;
    }

    std::shared_ptr<T> val_;
    
    V8_INLINE bool SupportWeak() { return false; }
    
    V8_INLINE void IncRef(Isolate * isolate) { }
    
    V8_INLINE void * GetUserData(Isolate * isolate) { return nullptr; }
    
    V8_INLINE void DecRef(Isolate * isolate) { }
    
    V8_INLINE void SetGlobal(Isolate * isolate, Value *val) { }
    
    V8_INLINE static Local<T> New(Isolate* isolate, const PersistentBase<T>& that) {
        return that.Get(isolate);
    }
};

template <>
class Local<Context> : public LocalSharedPtrImpl<Context> {
public:
    V8_INLINE Local() : LocalSharedPtrImpl(){}
    
    V8_INLINE Local(const Local<Context> &that) : LocalSharedPtrImpl(that) { }
    
    explicit V8_INLINE Local(Context* that) : LocalSharedPtrImpl(that) {}
    
    V8_INLINE Local<Context> Clone(Isolate * isolate) const {
        return *this;
    }
};

template <>
class Local<Script> : public LocalSharedPtrImpl<Script> {
public:
    V8_INLINE Local() : LocalSharedPtrImpl(){}
    
    V8_INLINE Local(const Local<Script> &that) : LocalSharedPtrImpl(that) { }
    
    explicit V8_INLINE Local(Script* that) : LocalSharedPtrImpl(that) {}
};

template <>
class Local<Data> : public LocalSharedPtrImpl<Data> {
public:
    V8_INLINE Local() : LocalSharedPtrImpl(){}
    
    template <class S>
    V8_INLINE Local(Local<S> that) : LocalSharedPtrImpl(that) {}
    
    V8_INLINE Local(const Local<Data> &that) : LocalSharedPtrImpl(that) { }
    
    explicit V8_INLINE Local(Data* that) : LocalSharedPtrImpl(that) {}
};

template <>
class Local<Template> : public LocalSharedPtrImpl<Template> {
public:
    V8_INLINE Local() : LocalSharedPtrImpl(){}
    
    V8_INLINE Local(const Local<Template> &that) : LocalSharedPtrImpl(that) { }
    
    explicit V8_INLINE Local(Template* that) : LocalSharedPtrImpl(that) {}
};

template <>
class Local<ObjectTemplate> : public LocalSharedPtrImpl<ObjectTemplate> {
public:
    V8_INLINE Local(): LocalSharedPtrImpl(){}
    
    V8_INLINE Local(const Local<ObjectTemplate> &that) : LocalSharedPtrImpl(that) { }

    explicit V8_INLINE Local(ObjectTemplate* that) : LocalSharedPtrImpl(that) { }
};

template <>
class Local<FunctionTemplate> : public LocalSharedPtrImpl<FunctionTemplate> {
public:
    V8_INLINE Local() : LocalSharedPtrImpl(){}
    
    V8_INLINE Local(const Local<FunctionTemplate> &that): LocalSharedPtrImpl(that) { }

    explicit V8_INLINE Local(FunctionTemplate* that) : LocalSharedPtrImpl(that) { }
    
    V8_INLINE Local<FunctionTemplate> Clone(Isolate * isolate) const {
        return *this;
    }
    
    V8_INLINE Local<FunctionTemplate> Escape(EscapableHandleScope* scope) {
        return *this;
    }
};

template <>
class Local<Message> : public LocalSharedPtrImpl<Message> {
public:
    V8_INLINE Local(): LocalSharedPtrImpl(){}
    
    V8_INLINE Local(const Local<Message> &that): LocalSharedPtrImpl(that) { }

    explicit V8_INLINE Local(Message* that) : LocalSharedPtrImpl(that) { }
};

template <class T>
class Maybe {
public:
    V8_INLINE bool IsNothing() const { return !has_value_; }
    V8_INLINE bool IsJust() const { return has_value_; }

    /**
     * An alias for |FromJust|. Will crash if the Maybe<> is nothing.
     */
    V8_INLINE T ToChecked() const { return FromJust(); }

    /**
     * Short-hand for ToChecked(), which doesn't return a value. To be used, where
     * the actual value of the Maybe is not needed like Object::Set.
     */
    V8_INLINE void Check() const {
        if (V8_UNLIKELY(!IsJust())) V8::FromJustIsNothing();
    }

    /**
     * Converts this Maybe<> to a value of type T. If this Maybe<> is
     * nothing (empty), |false| is returned and |out| is left untouched.
     */
    V8_WARN_UNUSED_RESULT V8_INLINE bool To(T* out) const {
        if (V8_LIKELY(IsJust())) *out = value_;
        return IsJust();
    }

    /**
     * Converts this Maybe<> to a value of type T. If this Maybe<> is
     * nothing (empty), V8 will crash the process.
     */
    V8_INLINE T FromJust() const {
        if (V8_UNLIKELY(!IsJust())) V8::FromJustIsNothing();
        return value_;
    }

    /**
     * Converts this Maybe<> to a value of type T, using a default value if this
     * Maybe<> is nothing (empty).
     */
    V8_INLINE T FromMaybe(const T& default_value) const {
        return has_value_ ? value_ : default_value;
    }

    V8_INLINE bool operator==(const Maybe& other) const {
        return (IsJust() == other.IsJust()) &&
            (!IsJust() || FromJust() == other.FromJust());
    }

    V8_INLINE bool operator!=(const Maybe& other) const {
        return !operator==(other);
    }

    Maybe() : has_value_(false) {}
    explicit Maybe(const T& t) : has_value_(true), value_(t) {}

private:

    bool has_value_;
    T value_;

    template <class U>
    friend Maybe<U> Nothing();
    template <class U>
    friend Maybe<U> Just(const U& u);
};

template <class T>
class MaybeLocal {
public:
    V8_INLINE MaybeLocal() : val_(nullptr) {}
    template <class S>
    V8_INLINE MaybeLocal(Local<S> that)
        : val_(that) {
        static_assert(std::is_base_of<T, S>::value, "type check");
    }

    V8_INLINE bool IsEmpty() const { return val_.IsEmpty(); }

    /**
     * Converts this MaybeLocal<> to a Local<>. If this MaybeLocal<> is empty,
     * |false| is returned and |out| is left untouched.
     */
    template <class S>
    V8_WARN_UNUSED_RESULT V8_INLINE bool ToLocal(Local<S>* out) const {
        *out = this->val_;
        return !IsEmpty();
    }

    /**
     * Converts this MaybeLocal<> to a Local<>. If this MaybeLocal<> is empty,
     * V8 will crash the process.
     */
    V8_INLINE Local<T> ToLocalChecked() {
        if (IsEmpty()) {
            std::cerr << "ToLocalChecked, Maybe value is Nothing." << std::endl;
            abort();
        }
        return val_;
    }

    /**
        * Converts this MaybeLocal<> to a Local<>, using a default value if this
        * MaybeLocal<> is empty.
        */
    template <class S>
    V8_INLINE Local<S> FromMaybe(Local<S> default_value) const {
        return IsEmpty() ? default_value : Local<S>(val_);
    }

private:
    Local<T> val_;
};

template <class T>
using Handle = Local<T>;

class V8_EXPORT Data {
public:
    virtual ~Data() {}
    // private:
    //  Data();
};

typedef void (*WeakCallback)(void* data);

typedef struct ObjectUserData {
    int32_t len_;
    WeakCallback callback_;
    void* parameter_;
    void* ptrs_[1];
} ObjectUserData;

class V8_EXPORT Value {
public:
    V8_WARN_UNUSED_RESULT Maybe<uint32_t> Uint32Value(Local<Context> context) const ;
    
    V8_WARN_UNUSED_RESULT Maybe<int32_t> Int32Value(Local<Context> context) const;
    
    bool IsUndefined() const;
    
    bool IsNull() const;

    bool IsNullOrUndefined() const;

    bool IsString() const;

    bool IsSymbol() const;

    bool IsFunction() const;
    
    bool IsArrayBuffer() const;
    
    bool IsArrayBufferView() const;
    
    bool IsDate() const;

    bool IsObject() const;

    bool IsBigInt() const;

    bool IsBoolean() const;

    bool IsNumber() const;

    bool IsExternal() const;
    
    bool IsInt32() const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<BigInt> ToBigInt(
        Local<Context> context) const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Number> ToNumber(
        Local<Context> context) const;
    
    Local<Boolean> ToBoolean(Isolate* isolate) const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Int32> ToInt32(Local<Context> context) const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Integer> ToInteger(
         Local<Context> context) const;
    
    bool BooleanValue(Isolate* isolate) const;
    
    bool IsRegExp() const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<String> ToString(
        Local<Context> context) const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Object> ToObject(
        Local<Context> context) const;
    
    V8_WARN_UNUSED_RESULT Maybe<double> NumberValue(Local<Context> context) const;
    
    JSValue value_;
    
    Value() = delete;
};

class V8_EXPORT Object : public Value {
public:
    V8_WARN_UNUSED_RESULT Maybe<bool> Set(Local<Context> context,
        Local<Value> key, Local<Value> value);
    
    V8_WARN_UNUSED_RESULT Maybe<bool> Set(Local<Context> context,
        uint32_t index, Local<Value> value);
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Value> Get(Local<Context> context,
        Local<Value> key);
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Value> Get(Local<Context> context,
        uint32_t index);
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Array> GetOwnPropertyNames(Local<Context> context);
    
    V8_WARN_UNUSED_RESULT Maybe<bool> HasOwnProperty(Local<Context> context,
        Local<Name> key);
    
    Local<Value> GetPrototype();
    
    V8_WARN_UNUSED_RESULT Maybe<bool> SetPrototype(Local<Context> context,
        Local<Value> prototype);
    
    void SetAlignedPointerInInternalField(int index, void* value);
    
    void* GetAlignedPointerFromInternalField(int index);
    
    int InternalFieldCount();
    
    static Local<Object> New(Isolate* isolate);
    
    V8_INLINE static Object* Cast(Value* obj) {
        return static_cast<Object*>(obj);
    }
};

class V8_EXPORT PrimitiveArray {
public:
    V8_INLINE static Local<PrimitiveArray> New(Isolate* isolate, int length) {
        return Local<PrimitiveArray>(new PrimitiveArray);
    };
};

class V8_EXPORT Array : public Object {
public:
    uint32_t Length() const;

    V8_INLINE static Array* Cast(Value* obj) {
        return static_cast<Array*>(obj);
    }
};

class V8_EXPORT Date : public Object {
public:
    static V8_WARN_UNUSED_RESULT MaybeLocal<Value> New(Local<Context> context, double time);
    
    double ValueOf() const;
    
    V8_INLINE static Date* Cast(Value* obj) {
        return static_cast<Date*>(obj);
    }
};

class V8_EXPORT Map : public Object {
public:
    void Clear();
    V8_WARN_UNUSED_RESULT MaybeLocal<Value> Get(Local<Context> context,
        Local<Value> key);
    V8_WARN_UNUSED_RESULT MaybeLocal<Map> Set(Local<Context> context,
        Local<Value> key,
        Local<Value> value);
    static Local<Map> New(Isolate* isolate);

    V8_INLINE static Map* Cast(Value* obj) {
        return static_cast<Map*>(obj);
    }
};

enum class ArrayBufferCreationMode { kInternalized, kExternalized };

class V8_EXPORT ArrayBuffer : public Object {
public:
    class V8_EXPORT Allocator { // NOLINT
    public:
        virtual ~Allocator() = default;

        V8_INLINE static Allocator* NewDefaultAllocator() {
            return nullptr;
        }
    };
    
    class V8_EXPORT Contents { // NOLINT
    public:
        void* Data() const { return data_; }
        
        size_t ByteLength() const { return byte_length_; }
        
        void* data_;
        
        size_t byte_length_;
    };
    
    static Local<ArrayBuffer> New(Isolate* isolate, size_t byte_length);
    
    static Local<ArrayBuffer> New(Isolate* isolate, void* data, size_t byte_length,
                                  ArrayBufferCreationMode mode = ArrayBufferCreationMode::kExternalized);
    
    Contents GetContents();
    
    V8_INLINE static ArrayBuffer* Cast(Value* obj) {
        return static_cast<ArrayBuffer*>(obj);
    }
};

class V8_EXPORT ArrayBufferView : public Object {
public:
    Local<ArrayBuffer> Buffer();
    
    size_t ByteOffset();
    
    size_t ByteLength();
    
    V8_INLINE static ArrayBufferView* Cast(Value* obj) {
        return static_cast<ArrayBufferView*>(obj);
    }
};

class V8_EXPORT Promise : public Object {
public:
    V8_INLINE static Promise* Cast(Value* obj) {
        return static_cast<Promise*>(obj);
    }
    
    Isolate* GetIsolate();
};

enum {
    kUndefinedValueIndex = 0,
    kNullValueIndex = 1,
    kTrueValueIndex = 2,
    kFalseValueIndex = 3,
    kEmptyStringIndex = 4,
};

enum PromiseRejectEvent {
    kPromiseRejectWithNoHandler = 0,
    kPromiseHandlerAddedAfterReject = 1,
    kPromiseRejectAfterResolved = 2,
    kPromiseResolveAfterResolved = 3,
};

class PromiseRejectMessage {
public:
    PromiseRejectMessage(JSValue promise, PromiseRejectEvent event,
                         JSValue value)
        : promise_(promise), event_(event), value_(value) {}

    V8_INLINE Local<Promise> GetPromise() const { return Local<Promise>( reinterpret_cast<Promise*>(const_cast<JSValue*>(&promise_))) ; }
    V8_INLINE PromiseRejectEvent GetEvent() const { return event_; }
    V8_INLINE Local<Value> GetValue() const { return Local<Value>( reinterpret_cast<Value*>(const_cast<JSValue*>(&value_))) ;}

private:
    JSValue promise_;
    PromiseRejectEvent event_;
    JSValue value_;
};

typedef void (*PromiseRejectCallback)(PromiseRejectMessage message);


class V8_EXPORT Module : public Data {
 public:
  Local<Value> GetException() const;

  typedef MaybeLocal<Module> (*ResolveCallback)(Local<Context> context,
                                                Local<String> specifier,
                                                Local<Module> referrer);

  V8_WARN_UNUSED_RESULT Maybe<bool> InstantiateModule(Local<Context> context,
                                                      ResolveCallback callback);

  V8_WARN_UNUSED_RESULT MaybeLocal<Value> Evaluate(Local<Context> context);

 private:
  JSValue* exception_;
  friend class ScriptCompiler;
  friend class Isolate;
  JSModuleDef* module_;

  Local<String> source_string_;
  Local<Value> resource_name_;
};

class V8_EXPORT Isolate {
private: 
    friend class Module;
    Module::ResolveCallback moduleResolver_;

    static JSModuleDef* js_module_loader(JSContext* ctx, const char *name, void *opaque);
    std::map<std::string, JSModuleDef*> ModuleCacheMap_;
public:
    static Isolate* current_;
    
    struct CreateParams {
        CreateParams()
            : array_buffer_allocator(nullptr) {}
        ArrayBuffer::Allocator* array_buffer_allocator;
    };

    class V8_EXPORT Scope {
    public:
        explicit V8_INLINE Scope(Isolate* isolate) {
            prev_isolate_ = current_;
            current_ = isolate;
        }

        V8_INLINE ~Scope() {
            current_ = prev_isolate_;
        }

        // Prevent copying of Scope objects.
        Scope(const Scope&) = delete;
        Scope& operator=(const Scope&) = delete;

    private:
        Isolate* prev_isolate_;
    };

    V8_INLINE static Isolate* New(const CreateParams& params) {
        return new Isolate();
    }
    
    V8_INLINE static Isolate* New(void* external_runtime) {
        return new Isolate(external_runtime);
    }

    V8_INLINE void Dispose() {
        delete this;
    }

    V8_INLINE Local<Context> GetCurrentContext() {
        return current_context_;
    }
    
    void LowMemoryNotification();
    
    Local<Value> ThrowException(Local<Value> exception);
    
    void SetPromiseRejectCallback(PromiseRejectCallback callback);
    
    void handleException();

    JSRuntime *runtime_;
    
    bool is_external_runtime_;
    
    JSClassID class_id_;

    Local<Context> current_context_;

    Isolate();
    
    Isolate(void* external_runtime);

    ~Isolate();
    
    TryCatch *currentTryCatch_ = nullptr;
    
    std::vector<JSValue*> values_;
    
    JSValue literal_values_[kEmptyStringIndex + 1];
    
    int value_alloc_pos_ = 0;
    
    JSValue exception_;
    
    HandleScope *currentHandleScope = nullptr;
    
    void *embedder_data_ = nullptr;
    
    V8_INLINE void* GetData(uint32_t slot) {
        V8::Check(slot == 0, "not supported yet");
        return embedder_data_;
    }
        
    V8_INLINE void SetData(uint32_t slot, void* data) {
        V8::Check(slot == 0, "not supported yet");
        embedder_data_ = data;
    }
    
    template<class F> F* Alloc() {
        return static_cast<F*>(Alloc_());
    }
    
    Value* Alloc_();
    
    V8_INLINE int GetAllocPos() {
        return value_alloc_pos_;
    }
    
    void ForeachAllocValue(int start, int end, std::function<void(JSValue*, int)>);
    
    V8_INLINE void Escape(Value* val) {
        Escape(reinterpret_cast<JSValue*>(val));
    }
    
    void Escape(JSValue* val);
    
    V8_INLINE Value* Undefined() {
        return reinterpret_cast<Value*>(&literal_values_[kUndefinedValueIndex]);
    }
};

class V8_EXPORT Exception {
public:
    static Local<Value> Error(Local<String> message);
};

V8_INLINE Local<Primitive> Undefined(Isolate* isolate) {
    return Local<Primitive>(reinterpret_cast<Primitive*>(&isolate->literal_values_[kUndefinedValueIndex]));
}


V8_INLINE Local<Primitive> Null(Isolate* isolate) {
    return Local<Primitive>(reinterpret_cast<Primitive*>(&isolate->literal_values_[kNullValueIndex]));
}


V8_INLINE Local<Boolean> True(Isolate* isolate) {
    return Local<Boolean>(reinterpret_cast<Boolean*>(&isolate->literal_values_[kTrueValueIndex]));
}


V8_INLINE Local<Boolean> False(Isolate* isolate) {
    return Local<Boolean>(reinterpret_cast<Boolean*>(&isolate->literal_values_[kFalseValueIndex]));
}

class V8_EXPORT Context : Data {
public:
    V8_INLINE static Local<Context> New(Isolate* isolate) {
        return Local<Context>(new Context(isolate));
    }
    
    V8_INLINE static Local<Context> New(Isolate* isolate, void* external_context) {
        return Local<Context>(new Context(isolate, external_context));
    }

    Local<Object> Global();

    V8_INLINE Isolate* GetIsolate() { return isolate_; }

    class Scope {
    public:
        explicit V8_INLINE Scope(Local<Context> context) {
            isolate_ = context->GetIsolate();
            if (*(context) != *(isolate_->current_context_)) {
                prev_context_ = isolate_->current_context_;
                isolate_->current_context_ = context;
                enter_new_ = true;
            } else {
                enter_new_ = false;
            }
        }
        V8_INLINE ~Scope() {
            if (enter_new_) {
                while (JS_IsJobPending(isolate_->runtime_)) {
                    JSContext *ctx = nullptr;
                    JS_ExecutePendingJob(isolate_->runtime_, &ctx);
                }
                isolate_->current_context_ = prev_context_;
            }
        }

    private:
        bool enter_new_;
        Isolate* isolate_;
        Local<Context> prev_context_;
    };

    ~Context();

    Isolate* const isolate_;

    JSContext *context_;
    
    JSValue global_;
    
    bool is_external_context_;

    Context(Isolate* isolate, void* external_context);
    
    Context(Isolate* isolate);
};

V8_INLINE Value* AllocValue_(Isolate * isolate) {
    return isolate->Alloc_();
}

V8_INLINE void IncRef_(Isolate * isolate, JSValue val) {
    JS_DupValueRT(isolate->runtime_, val);
}

V8_INLINE void DecRef_(Isolate * isolate, JSValue val) {
    JS_FreeValueRT(isolate->runtime_, val);
}


V8_INLINE void SetGlobal_(Isolate * isolate, Value * des, Value* src) {
    des->value_ = src ->value_;
}

V8_INLINE void * GetUserData_(Isolate * isolate, JSValue val) {
    return JS_GetOpaque(val, isolate->class_id_);
}

template <typename T>
class WeakCallbackInfo {
public:
    typedef void (*Callback)(const WeakCallbackInfo<T>& data);
    
    V8_INLINE Isolate* GetIsolate() const { return Isolate::current_;}
    
    V8_INLINE T* GetParameter() const { return reinterpret_cast<T*>(object_udata_.parameter_); }
    
    V8_INLINE void* GetInternalField(int index) const {
        V8::Check(index >= 0 && index < object_udata_.len_, "InternalField out of range!");
        return object_udata_.ptrs_[index];
    }
    
    ObjectUserData object_udata_;
};

enum class WeakCallbackType { kParameter, kInternalFields, kFinalizer };

template <class T> class PersistentBase {
public:
    template <typename P>
    V8_INLINE void SetWeak(P* parameter,
                           typename WeakCallbackInfo<P>::Callback callback,
                           WeakCallbackType type) {
        if (!weak_ && val_.SupportWeak()) {
            weak_ = true;
            ObjectUserData* object_udata = reinterpret_cast<ObjectUserData*>(val_.GetUserData(isolate_));
            if (object_udata) {
                object_udata->callback_ = reinterpret_cast<WeakCallback>(callback);
                object_udata->parameter_ = parameter;
            }
            val_.DecRef(isolate_);
        }
    }
    
    V8_INLINE void Reset() {
        if (!weak_ && val_.SupportWeak()) {
            val_.DecRef(isolate_);
        }
        isolate_ = nullptr;
        val_ = Local<T>();
        weak_ = false;
    }
    
    template <class S>
    V8_INLINE void Reset(Isolate* isolate, const Local<S>& other) {
        static_assert(std::is_base_of<T, S>::value, "type check");
        Reset();
        isolate_ = isolate;
        val_ = other;
        val_.SetGlobal(isolate, reinterpret_cast<Value*>(&store_));
        if (!val_.IsEmpty() && val_.SupportWeak()) {
            val_.IncRef(isolate_);
        }
        weak_ = false;
    }
    
    Isolate* isolate_ = nullptr;
    Local<T> val_;
    bool weak_ = false;
    JSValue store_;
    
    V8_INLINE Local<T> Get(Isolate* isolate) const {
        Local<T> ret = val_.Clone(isolate);
        ret.IncRef(isolate);
        return ret;
    }
    
    V8_INLINE bool IsEmpty() const {
        return val_.IsEmpty();
    }
    
    //PersistentBase(const PersistentBase& other) = delete;  // NOLINT
    //void operator=(const PersistentBase&) = delete;
    
};

template <class T>
class Global : public PersistentBase<T> {
public:
    V8_INLINE Global() {}
    
    template <class S>
    V8_INLINE Global(Isolate* isolate, Local<S> that) {
        static_assert(std::is_base_of<T, S>::value, "type check");
        PersistentBase<T>::Reset(isolate, that);
    }
    
    V8_INLINE Global(Global&& other) {
        if (!other.IsEmpty()) {
            this->isolate_ = other.isolate_;
            this->val_ = other.val_;
            this->weak_ = other.weak_;
            this->val_.SetGlobal(this->isolate_, reinterpret_cast<Value*>(&this->store_));
        }
        
        other.weak_ = true;
        other.isolate_ = nullptr;
    }
    
    template <class S>
    V8_INLINE Global& operator=(Global<S>&& rhs) {
        static_assert(std::is_base_of<T, S>::value, "type check");
        if (this != &rhs) {
          this->Reset();
          if (!rhs.val_.IsEmpty()) {
              this->isolate_ = rhs.isolate_;
              this->val_ = rhs.val_;
              this->weak_ = rhs.weak_;
              this->val_.SetGlobal(this->isolate_, reinterpret_cast<Value*>(&(this->store_)));
              
              rhs.weak_ = true;
              rhs.isolate_ = nullptr;
          }
        }
        return *this;
    }
    
    void operator=(const Global&) = delete;
    
    Global(const Global&) = delete;
    
    ~Global() {
        this->Reset();
    }
};

template <class T>
using UniquePersistent = Global<T>;

class V8_EXPORT External : public Value {
public:
    static Local<External> New(Isolate* isolate, void* value);
    V8_INLINE static External* Cast(Value* obj) {
        return static_cast<External*>(obj);
    }
    void* Value() const;
};

class V8_EXPORT Primitive : public Value { };

class V8_EXPORT Number : public Primitive {
public:
    double Value() const ;
    
    static Local<Number> New(Isolate* isolate, double value);
    
    V8_INLINE static Number* Cast(v8::Value* obj) {
        return static_cast<Number*>(obj);
    }
};

class V8_EXPORT Integer : public Number {
public:
    static Local<Integer> New(Isolate* isolate, int32_t value);
    
    static Local<Integer> NewFromUnsigned(Isolate* isolate, uint32_t value);
    
    int64_t Value() const ;
    
    V8_INLINE static Integer* Cast(v8::Value* obj) {
        return static_cast<Integer*>(obj);
    }
};

class V8_EXPORT Int32 : public Integer {
public:
    int32_t Value() const;
    
    V8_INLINE static Int32* Cast(v8::Value* obj) {
        return static_cast<Int32*>(obj);
    }
};

class V8_EXPORT BigInt : public Primitive {
public:
    static Local<BigInt> New(Isolate* isolate, int64_t value);
    static Local<BigInt> NewFromUnsigned(Isolate* isolate, uint64_t value);
    
    uint64_t Uint64Value(bool* lossless = nullptr) const;
    
    int64_t Int64Value(bool* lossless = nullptr) const;
    
    V8_INLINE static BigInt* Cast(v8::Value* obj) {
        return static_cast<BigInt*>(obj);
    }
};

class V8_EXPORT Boolean : public Primitive {
public:
    bool Value() const;
    
    V8_INLINE static Boolean* Cast(v8::Value* obj) {
        return static_cast<Boolean*>(obj);
    }
    static Local<Boolean> New(Isolate* isolate, bool value);
};

class V8_EXPORT Name : public Primitive {
public:

    V8_INLINE static Name* Cast(Value* obj) {
        return static_cast<Name*>(obj);
    }

private:
};

enum class NewStringType {
    /**
     * Create a new string, always allocating new storage memory.
     */
    kNormal,

    /**
     * Acts as a hint that the string should be created in the
     * old generation heap space and be deduplicated if an identical string
     * already exists.
     */
    kInternalized
};

class V8_EXPORT String : public Name {
public:
    int Utf8Length(Isolate* isolate) const;

    int WriteUtf8(Isolate* isolate, char* buffer) const;

    static Local<String> Empty(Isolate* isolate);

    V8_INLINE static String* Cast(v8::Value* obj) {
        return static_cast<String*>(obj);
    }

    static V8_WARN_UNUSED_RESULT MaybeLocal<String> NewFromUtf8(
        Isolate* isolate, const char* data, NewStringType type = NewStringType::kNormal, int length = -1);


    class V8_EXPORT Utf8Value {
    public:
        Utf8Value(Isolate* isolate, Local<v8::Value> obj);
        
        ~Utf8Value();
        
        //char* operator*() { return data_; }
        const char* operator*() const { return data_; }
        int length() const { return len_; }

        // Disallow copying and assigning.
        Utf8Value(const Utf8Value&) = delete;
        void operator=(const Utf8Value&) = delete;

    private:
        const char* data_;
        size_t len_;
        JSContext *context_ = nullptr;
    };

private:
};

class V8_EXPORT Function : public Object {
public:
    V8_WARN_UNUSED_RESULT MaybeLocal<Value> Call(Local<Context> context,
                                                 Local<Value> recv, int argc,
                                                 Local<Value> argv[]);
    
    V8_INLINE static Function* Cast(v8::Value* obj) {
        return static_cast<Function*>(obj);
    }
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Object> NewInstance(Local<Context> context, int argc, Local<Value> argv[]) const;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Object> NewInstance(Local<Context> context) const {
        return NewInstance(context, 0, nullptr);
    }
};

enum PropertyAttribute {
    /** None. **/
    None = 0,
    /** ReadOnly, i.e., not writable. **/
    ReadOnly = 1 << 0,
    /** DontEnum, i.e., not enumerable. **/
    DontEnum = 1 << 1,
    /** DontDelete, i.e., not configurable. **/
    DontDelete = 1 << 2
};

class V8_EXPORT Template : public Data {
public:
    void Set(Isolate* isolate, const char* name, Local<Data> value);
    
    //ignore attributes
    void Set(Local<Name> name, Local<Data> value,
             PropertyAttribute attributes = None);
    
    void SetAccessorProperty(Local<Name> name,
                             Local<FunctionTemplate> getter = Local<FunctionTemplate>(),
                             Local<FunctionTemplate> setter = Local<FunctionTemplate>(),
                             PropertyAttribute attribute = None);
    
    std::map<std::string, Local<Data>> fields_;
    
    class AccessorPropertyInfo {
    public:
        Local<FunctionTemplate> getter_;
        Local<FunctionTemplate> setter_;
        PropertyAttribute attribute_;
    };
    
    std::map<std::string, AccessorPropertyInfo> accessor_property_infos_;
    
    void InitPropertys(Local<Context> context, JSValue obj);
};

enum AccessControl {
  DEFAULT               = 0,
  ALL_CAN_READ          = 1,
  ALL_CAN_WRITE         = 1 << 1,
  PROHIBITS_OVERWRITING = 1 << 2
};

typedef void (*AccessorNameGetterCallback)(Local<Name> property, const PropertyCallbackInfo<Value>& info);


typedef void (*AccessorNameSetterCallback)(Local<Name> property, Local<Value> value,
                                           const PropertyCallbackInfo<void>& info);

class V8_EXPORT ObjectTemplate : public Template {
public:
    void SetInternalFieldCount(int value);
    
    int internal_field_count_ = 0;
    
    void SetAccessor(Local<Name> name, AccessorNameGetterCallback getter,
                     AccessorNameSetterCallback setter = nullptr,
                     Local<Value> data = Local<Value>(), AccessControl settings = DEFAULT,
                     PropertyAttribute attribute = None);
    
    void InitAccessors(Local<Context> context, JSValue obj);
    
    struct AccessorInfo {
        AccessorNameGetterCallback getter_;
        AccessorNameSetterCallback setter_;
        JSValue data_;
        AccessControl settings_;
        PropertyAttribute attribute_;
    };
    
    std::map<std::string, AccessorInfo> accessor_infos_;
};

typedef void (*FunctionCallback)(const FunctionCallbackInfo<Value>& info);

class V8_EXPORT FunctionTemplate : public Template {
public:
    struct CFunctionData {
        JSValue data_;
        FunctionCallback callback_;
        int internal_field_count_;
        bool is_construtor_;
    };
    
    static Local<FunctionTemplate> New(
        Isolate* isolate, FunctionCallback callback = nullptr,
        Local<Value> data = Local<Value>());
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Function> GetFunction(
        Local<Context> context);
    
    bool HasInstance(Local<Value> object);
    
    Local<ObjectTemplate> InstanceTemplate();
    
    void Inherit(Local<FunctionTemplate> parent);
    
    Local<ObjectTemplate> PrototypeTemplate();
    
    V8_INLINE static FunctionTemplate* Cast(v8::Data* obj) {
        return static_cast<FunctionTemplate*>(obj);
    }
    
    CFunctionData cfunction_data_;
    
    Isolate* isolate_;
    
    Local<ObjectTemplate> instance_template_;
    Local<ObjectTemplate> prototype_template_;
    Local<FunctionTemplate> parent_;
    
    std::map<Context*, JSValue> context_to_funtion_;
    
    ~FunctionTemplate();
};

template<typename T>
class ReturnValue {
public:
    //template <class S> V8_INLINE ReturnValue(const ReturnValue<S>& that)
    //  : value_(that.value_) {
    //    static_assert(std::is_base_of<T, S>::value, "type check");
    //}
    // Local setters
    //template <typename S>
    //V8_INLINE void Set(const Global<S>& handle);
    //template <typename S>
    //V8_INLINE void Set(const TracedReferenceBase<S>& handle);
    template <typename S>
    V8_INLINE void Set(const Local<S> handle);
    // Fast primitive setters
    V8_INLINE void Set(bool value);
    V8_INLINE void Set(double i);
    V8_INLINE void Set(int32_t i);
    V8_INLINE void Set(uint32_t i);
    // Fast JS primitive setters
    V8_INLINE void SetNull();
    V8_INLINE void SetUndefined();
    V8_INLINE void SetEmptyString();

    // Pointer setter: Uncompilable to prevent inadvertent misuse.
    template <typename S>
    V8_INLINE void Set(S* whatever);
    
    V8_INLINE ReturnValue(Isolate * isolate, JSContext* context, JSValue* pvalue)
       :isolate_(isolate), context_(context), pvalue_(pvalue) { }
    
    Isolate * isolate_;
    
    JSContext* context_;
    
    JSValue* pvalue_;
};

template<typename T>
class FunctionCallbackInfo {
public:
    V8_INLINE int Length() const {
        return argc_;
    }
    
    V8_INLINE Local<Value> operator[](int i) const;
    
    V8_INLINE Local<Object> This() const {
        Object* obj = reinterpret_cast<Object*>(const_cast<JSValue*>(&this_));
        return Local<Object>(obj);
    }
    
    //quickjs没有类似的机制S
    V8_INLINE Local<Object> Holder() const {
        return This();
    }
    
    V8_INLINE bool IsConstructCall() const {
        return isConstructCall;
    }
    
    V8_INLINE Local<Value> Data() const {
        Value* ret = reinterpret_cast<Value*>(const_cast<JSValue*>(&data_));
        return Local<Value>(ret);
    }
    
    V8_INLINE Isolate* GetIsolate() const {
        return isolate_;
    }
    
    V8_INLINE ReturnValue<T> GetReturnValue() const {
        return ReturnValue<T>(isolate_, context_, const_cast<JSValue*>(&value_));
    }

    int argc_;
    JSValueConst *argv_;
    JSValue value_;
    JSContext* context_;
    JSValueConst this_;
    Isolate * isolate_;
    JSValue data_;
    bool isConstructCall;
};

template<typename T>
class PropertyCallbackInfo {
public:
    V8_INLINE Isolate* GetIsolate() const {
        return isolate_;
    }
    
    V8_INLINE Local<Value> Data() const {
        Value* ret = reinterpret_cast<Value*>(const_cast<JSValue*>(&data_));
        return Local<Value>(ret);
    }
    
    V8_INLINE Local<Object> This() const {
        Object* obj = reinterpret_cast<Object*>(const_cast<JSValue*>(&this_));
        return Local<Object>(obj);
    }
    
    //quickjs没有类似的机制S
    V8_INLINE Local<Object> Holder() const {
        return This();
    }
    
    V8_INLINE ReturnValue<T> GetReturnValue() const {
        return ReturnValue<T>(isolate_, context_, const_cast<JSValue*>(&value_));
    }
    
    Isolate * isolate_;
    JSContext* context_;
    JSValue data_;
    JSValue value_;
    JSValueConst this_;
};

class ScriptOrigin {
public:
    V8_INLINE ScriptOrigin(
        Local<Value> resource_name) : resource_name_(resource_name) {
    }

    V8_INLINE ScriptOrigin(
        Local<Value> resource_name,
        Local<Integer> resource_line_offset,
        Local<Integer> resource_column_offset,
        Local<Boolean> resource_is_shared_cross_origin,
        Local<Integer> script_id,
        Local<Value> source_map_url,
        Local<Boolean> resource_is_opaque,
        Local<Boolean> is_wasm, Local<Boolean> is_module,
        Local<PrimitiveArray> host_defined_options
    ) : resource_name_(resource_name), is_module_(is_module) {}

    V8_INLINE Local<Value> ResourceName() const {
        return resource_name_;
    }

    Local<Value> resource_name_;

    Local<Boolean> is_module_;
};


class V8_EXPORT HandleScope {
public:
    V8_INLINE explicit HandleScope(Isolate* isolate) {
        isolate_ = isolate;
        prev_pos_ = isolate->GetAllocPos();
        
        prev_scope_ = isolate->currentHandleScope;
        isolate->currentHandleScope = this;
        
        scope_value_ = JS_Undefined();
    }

    V8_INLINE ~HandleScope() {
        Exit();
        isolate_->currentHandleScope = prev_scope_;
    }
    
    void Escape_(JSValue* val);
    
    void Exit();

    int prev_pos_;
    Isolate* isolate_;
    HandleScope* prev_scope_;
    
    std::set<JSValue*> escapes_;
    
    JSValue scope_value_;
    
private:
    void* operator new(size_t size);
    void* operator new[](size_t size);
    void operator delete(void*, size_t);
    void operator delete[](void*, size_t);
};

class V8_EXPORT EscapableHandleScope : public HandleScope {
public:
    V8_INLINE explicit EscapableHandleScope(Isolate* isolate) : HandleScope(isolate) {
    }
    
    template <class T>
    V8_INLINE Local<T> Escape(Local<T> value) {
        V8::Check(prev_scope_ != nullptr, "no prev scope to escape");
        return value.Escape(this);
    }
};

V8_INLINE Value *EscapeValue_(Value* val, EscapableHandleScope* scope) {
    scope->Escape_(reinterpret_cast<JSValue*>(val));
    scope->prev_scope_->scope_value_ = val->value_;
    return reinterpret_cast<Value*>(&scope->prev_scope_->scope_value_);
}

class V8_EXPORT ScriptCompiler {
public:
  class Source {
   public:
    // Source takes ownership of CachedData.
    Source(Local<String> source_string, const ScriptOrigin& origin);
    ~Source();

   private:
    friend class ScriptCompiler;

    Local<String> source_string;

    Local<Value> resource_name;

    // CachedData* cached_data;
  };

  enum CompileOptions {
    kNoCompileOptions = 0,
    kConsumeCodeCache,
    kEagerCompile
  };

  enum NoCacheReason {
    kNoCacheNoReason = 0,
    kNoCacheBecauseCachingDisabled,
    kNoCacheBecauseNoResource,
    kNoCacheBecauseInlineScript,
    kNoCacheBecauseModule,
    kNoCacheBecauseStreamingSource,
    kNoCacheBecauseInspector,
    kNoCacheBecauseScriptTooSmall,
    kNoCacheBecauseCacheTooCold,
    kNoCacheBecauseV8Extension,
    kNoCacheBecauseExtensionModule,
    kNoCacheBecausePacScript,
    kNoCacheBecauseInDocumentWrite,
    kNoCacheBecauseResourceWithNoCacheHandler,
    kNoCacheBecauseDeferredProduceCodeCache
  };

  static V8_WARN_UNUSED_RESULT MaybeLocal<Module> CompileModule(
      Isolate* isolate, Source* source,
      CompileOptions options = kNoCompileOptions,
      NoCacheReason no_cache_reason = kNoCacheNoReason);

};

class V8_EXPORT Script : Data {
public:
    static V8_WARN_UNUSED_RESULT MaybeLocal<Script> Compile(
        Local<Context> context, Local<String> source,
        ScriptOrigin* origin = nullptr);

    V8_WARN_UNUSED_RESULT MaybeLocal<Value> Run(Local<Context> context);
    
    ~Script();
private:
    Local<String> source_;
    MaybeLocal<String> resource_name_;
};

class V8_EXPORT Message : Data {
public:
    V8_INLINE Local<Value> GetScriptResourceName() const {
        return String::NewFromUtf8(Isolate::current_, resource_name_.data(), NewStringType::kNormal, resource_name_.length()).ToLocalChecked();
    }
    
    //TODO: quickjs未提供该信息?
    V8_INLINE V8_WARN_UNUSED_RESULT Maybe<int> GetLineNumber(Local<Context> context) const {
        return Maybe<int>(line_number_);
    }
    
    V8_INLINE V8_WARN_UNUSED_RESULT MaybeLocal<String> GetSourceLine(Local<Context> context) const {
        return String::Empty(context->GetIsolate());
    }
    
    V8_INLINE int GetStartColumn() const {
        return 0;
    }
    
    V8_INLINE int GetEndColumn() const {
        return 0;
    }
    
    
    std::string resource_name_;
    
    int line_number_ = 0;
};

class V8_EXPORT TryCatch {
public:
    explicit TryCatch(Isolate* isolate);
    
    ~TryCatch();
    
    bool HasCaught() const;
    
    Local<Value> Exception() const;
    
    Local<v8::Message> Message() const;
    
    void handleException();
    
    JSValue catched_;
    
    Isolate* isolate_;
    
    TryCatch* prev_;
    
    V8_WARN_UNUSED_RESULT MaybeLocal<Value> StackTrace(Local<Context> context) const;
};

template <typename T>
template <typename S>
void ReturnValue<T>::Set(const Local<S> handle) {
    static_assert(std::is_void<T>::value || std::is_base_of<T, S>::value,
                "type check");
    if (V8_UNLIKELY(handle.IsEmpty())) {
        SetUndefined();
    } else {
        //如果向js返回了一个数据，这个数据应该Escape
        isolate_->Escape(*handle);
        *pvalue_ = handle->value_;
    }
}

template<typename T>
void ReturnValue<T>::Set(double i) {
    static_assert(std::is_base_of<T, Number>::value, "type check");
    *pvalue_ = JS_NewFloat64_(context_, i);
    
}

template<typename T>
void ReturnValue<T>::Set(int32_t i) {
    static_assert(std::is_base_of<T, Integer>::value, "type check");
    *pvalue_ = JS_NewInt32_(context_, i);
}

template<typename T>
void ReturnValue<T>::Set(uint32_t i) {
    static_assert(std::is_base_of<T, Integer>::value, "type check");
    *pvalue_ = JS_NewUint32_(context_, i);
}

template<typename T>
void ReturnValue<T>::Set(bool value) {
    static_assert(std::is_base_of<T, Boolean>::value, "type check");
    if (value) {
        *pvalue_ = JS_True();
    } else {
        *pvalue_ = JS_False();
    }
}

template<typename T>
void ReturnValue<T>::SetNull() {
    static_assert(std::is_base_of<T, Primitive>::value, "type check");
    *pvalue_ = JS_Null();
}

template<typename T>
void ReturnValue<T>::SetUndefined() {
    static_assert(std::is_base_of<T, Primitive>::value, "type check");
    *pvalue_ = JS_Undefined();
}

template <typename T>
template <typename S>
void ReturnValue<T>::Set(S* whatever) {
    static_assert(sizeof(S) < 0, "incompilable to prevent inadvertent misuse");
}

template<typename T>
Local<Value> FunctionCallbackInfo<T>::operator[](int i) const {
    Value* val = isolate_->Undefined();
    if (i >=0 && i < argc_) {
        val = reinterpret_cast<Value*>(&argv_[i]);
    }
    return Local<Value>(val);
}

}  // namespace v8

#endif  // INCLUDE_V8_H_
