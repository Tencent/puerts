#ifdef USING_IN_UNREAL_ENGINE
PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#endif
#include "v8.h"
#ifdef USING_IN_UNREAL_ENGINE
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#endif
#include<cstring>
#include <algorithm>

#ifndef PUERTS_IS_ARRAYBUFFER
    #define PUERTS_IS_ARRAYBUFFER JS_IsArrayBuffer
#endif
#ifndef PUERTS_GET_CONTEXT_OPAQUE
    #define PUERTS_GET_CONTEXT_OPAQUE JS_GetContextOpaque
#endif
#ifndef PUERTS_SET_CONTEXT_OPAQUE
    #define PUERTS_SET_CONTEXT_OPAQUE JS_SetContextOpaque
#endif

#if !defined(CONFIG_CHECK_JSVALUE) && defined(JS_NAN_BOXING)
#define JS_INITVAL(s, t, val) s = JS_MKVAL(t, val)
#define JS_INITPTR(s, t, p) s = JS_MKPTR(t, p)
#else
#define JS_INITVAL(s, t, val) s.tag = t, s.u.int32=val
#define JS_INITPTR(s, t, p) s.tag = t, s.u.ptr = p
#endif

namespace CUSTOMV8NAMESPACE {
namespace platform {

std::unique_ptr<CUSTOMV8NAMESPACE::Platform> NewDefaultPlatform() {
    return std::unique_ptr<CUSTOMV8NAMESPACE::Platform>{};
}

}  // namespace platform
}  // namespace CUSTOMV8NAMESPACE

namespace CUSTOMV8NAMESPACE {

Maybe<uint32_t> Value::Uint32Value(Local<Context> context) const {
    double d;
    if (JS_ToFloat64(Isolate::current_->current_context_->context_, &d, value_)) {
        return Maybe<uint32_t>();
    }
    else {
        return Maybe<uint32_t>((uint32_t)d);
    }
}
    
Maybe<int32_t> Value::Int32Value(Local<Context> context) const {
    double d;
    if (JS_ToFloat64(Isolate::current_->current_context_->context_, &d, value_)) {
        return Maybe<int32_t>();
    }
    else {
        return Maybe<int32_t>((int32_t)d);
    }
}
    
bool Value::IsUndefined() const {
    return (bool)JS_IsUndefined(value_);
}

bool Value::IsNull() const {
    return (bool)JS_IsNull(value_);
}

bool Value::IsNullOrUndefined() const {
    return JS_IsUndefined(value_) || JS_IsNull(value_);
}

bool Value::IsString() const {
    return (bool)JS_IsString(value_);
}

bool Value::IsSymbol() const {
    return (bool)JS_IsSymbol(value_);
}

Isolate* Promise::GetIsolate() {
    return Isolate::current_;
}

void V8FinalizerWrap(JSRuntime *rt, JSValue val) {
    Isolate* isolate = (Isolate*)JS_GetRuntimeOpaque(rt);
    if (!isolate) {
        return;
    }
    Isolate::Scope Isolatescope(isolate);
    ObjectUserData* objectUdata = reinterpret_cast<ObjectUserData*>(JS_GetOpaque(val, isolate->class_id_));
    if (objectUdata) {
        if (objectUdata->callback_) {
            objectUdata->callback_(objectUdata);
        }
        js_free_rt(rt, objectUdata);
        JS_SetOpaque(val, nullptr);
    }
}

Isolate::Isolate() : Isolate(nullptr) {
}

Isolate::Isolate(void* external_runtime) : current_context_(nullptr) {
    is_external_runtime_ = external_runtime != nullptr;
    runtime_ = is_external_runtime_ ? ((JSRuntime *)external_runtime) : JS_NewRuntime();
    JS_SetRuntimeOpaque(runtime_, this);
    literal_values_[kUndefinedValueIndex] = JS_Undefined();
    literal_values_[kNullValueIndex] = JS_Null();
    literal_values_[kTrueValueIndex] = JS_True();
    literal_values_[kFalseValueIndex] = JS_False();
    literal_values_[kEmptyStringIndex] = JS_Undefined();
    
    pendingException_ = JS_Undefined();
    hasPendingException_ = false;
    
    JSClassDef cls_def;
    cls_def.class_name = "__v8_simulate_obj";
    cls_def.finalizer = V8FinalizerWrap;
    cls_def.exotic = NULL;
    cls_def.gc_mark = NULL;
    cls_def.call = NULL;

    //大坑，JSClassID是uint32_t，但Object里的class_id类型为uint16_t，JS_NewClass会把class定义放到以uint32_t索引的数组成员//////////
    //后续如果用这个class_id新建对象，如果class_id大于uint16_t将会被截值，后续释放对象时，会找错class，可能会导致严重后果（不释放，或者调用错误的free）//////////
    class_id_ = 0;
    JS_NewClassID(runtime_, &class_id_);
    JS_NewClass(runtime_, class_id_, &cls_def);
};

Isolate::~Isolate() {
    for (size_t i = 0; i < values_.size(); i++) {
        delete values_[i];
    }
    values_.clear();
    JS_FreeValueRT(runtime_, literal_values_[kEmptyStringIndex]);
    if (!is_external_runtime_) {
        JS_FreeRuntime(runtime_);
    }
    else {
        JS_SetRuntimeOpaque(runtime_, nullptr);
    }
};

Isolate* Isolate::GetCurrent() {
    return current_;
}

void Isolate::SetCurrent(Isolate* i) {
    current_ = i;
}

Value* Isolate::Alloc_() {
    if (value_alloc_pos_ == (int)values_.size()) {
        JSValue* node = new JSValue;
        *node = JS_Undefined();
        values_.push_back(node);
    }
    auto ret = reinterpret_cast<Value*>(values_[value_alloc_pos_++]);
    return ret;
}

void Isolate::ForeachAllocValue(int start, int end, std::function<void(JSValue*, int)> callback) {
    for (int i = std::min(end, value_alloc_pos_) ; i > std::max(0, start); i--) {
        int idx = i - 1;
        JSValue * to_free = values_[idx];
        callback(to_free, idx);
    }
}

void Isolate::Escape(JSValue* val) {
    V8::Check(currentHandleScope != nullptr, "try to escape a scope, but no scope register!");
    currentHandleScope->Escape_(val);
}

Isolate* Isolate::current_ = nullptr;

void Isolate::handleException() {
    JSValue ex = JS_GetException(current_context_->context_);
    
    if (!JS_IsUndefined(ex)) {
        if (JS_IsNull(ex)) {
            std::cerr << "Uncaught exception(null)" << std::endl;
            return;
        }

        auto msg = JS_ToCString(current_context_->context_, ex);
        std::cerr << "Uncaught " << msg << std::endl;
        
        JS_FreeCString(current_context_->context_, msg);
        
        JS_FreeValue(current_context_->context_, ex);
    }
}

void Isolate::LowMemoryNotification() {
    Scope isolate_scope(this);
    JS_RunGC(runtime_);
}

Local<Value> Isolate::ThrowException(Local<Value> exception) {
    pendingException_ = exception->value_;
    hasPendingException_ = true;
    this->Escape(*exception);
    return Local<Value>(exception);
}

void Isolate::SetPromiseRejectCallback(PromiseRejectCallback cb) {
    JS_SetHostPromiseRejectionTracker(runtime_, [](JSContext *ctx, JSValueConst promise,
                                                   JSValueConst reason,
                                                   JS_BOOL is_handled, void *opaque) {
        PromiseRejectCallback callback = (PromiseRejectCallback)opaque;
        auto sptr = (*reinterpret_cast<std::weak_ptr<Context>*>(PUERTS_GET_CONTEXT_OPAQUE(ctx))).lock();
        Isolate* isolate = sptr->GetIsolate();

        Isolate::Scope isolateScope(isolate);
        HandleScope handleScope(isolate);
        Local<Context> context;
        context.val_ = sptr;
        Context::Scope contextScope(context);
        contextScope.micro_jobs_flush = false;
        
        callback(PromiseRejectMessage(promise, is_handled ? kPromiseHandlerAddedAfterReject : kPromiseRejectWithNoHandler, reason));
    }, (void*)cb);
}

Local<Value> Exception::Error(Local<String> message) {
    Isolate *isolate = Isolate::current_;
    Value* val = isolate->Alloc<Value>();
    JSContext* ctx = isolate->current_context_->context_;
    val->value_ = JS_NewError(ctx);
    JSAtom messageAtom = JS_NewAtom(ctx, "message");
    JS_DefinePropertyValue(ctx, val->value_, messageAtom, JS_NewString(ctx, *String::Utf8Value(isolate, message)),
                           JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
    JS_FreeAtom(ctx, messageAtom);
    return Local<Value>(val);
}

Local<Message> Exception::CreateMessage(Isolate* isolate_, Local<Value> exception) {
    JSValueConst catched_ = exception->value_;
    if (!JS_IsObject(catched_)) {
        return Local<Message>();
    }

    Local<Message> message(new Message());

    message->resource_name_ = "<unknow>";
    message->line_number_ = - 1;
    
    return message;
}

void HandleScope::Escape_(JSValue* val) {
    if (JS_VALUE_HAS_REF_COUNT(*val)) {
        JS_DupValueRT(isolate_->runtime_, *val);
    }
}

void HandleScope::Exit() {
    if(prev_pos_ < isolate_->value_alloc_pos_) {
        //std::cout << "---------------- start HandleScope::Exit -------------------" << std::endl;
        //std::cout << prev_pos_ << "," << isolate_->value_alloc_pos_ << std::endl;
        isolate_->ForeachAllocValue(prev_pos_, isolate_->value_alloc_pos_, [this](JSValue* val, int idx){
            if (JS_VALUE_HAS_REF_COUNT(*val)) {
                JS_FreeValueRT(isolate_->runtime_, *val);
            }
        });
        isolate_->value_alloc_pos_ = prev_pos_;
        //std::cout << "---------------- end HandleScope::Exit -------------------" << std::endl;
    }
    
    if (JS_VALUE_HAS_REF_COUNT(scope_value_)) {
        JS_FreeValueRT(isolate_->runtime_, scope_value_);
    }
}

bool Value::IsFunction() const {
    return (bool)JS_IsFunction(Isolate::current_->GetCurrentContext()->context_, value_);
}

bool Value::IsDate() const {
    return (bool)JS_IsDate(value_);
}

bool Value::IsArrayBuffer() const {
    return (bool)PUERTS_IS_ARRAYBUFFER(value_);
}

bool Value::IsArrayBufferView() const {
    return (bool)JS_IsArrayBufferView(value_);
}

bool Value::IsObject() const {
    return (bool)JS_IsObject(value_);
}

bool Value::IsArray() const {
    return (bool)JS_IsArray(Isolate::current_->GetCurrentContext()->context_, value_);
}

bool Value::IsBigInt() const {
    return JS_VALUE_GET_TAG(value_) == JS_TAG_BIG_INT;
}

bool Value::IsBoolean() const {
    return (bool)JS_IsBool(value_);
}

bool Value::IsNumber() const {
    return (bool)JS_IsNumber(value_);
}

bool Value::IsExternal() const {
    return JS_VALUE_GET_TAG(value_) == JS_TAG_EXTERNAL;
}

bool Value::IsInt32() const {
    return (bool)JS_IsNumber(value_);
}

bool Value::IsUint32() const{
    return (bool)JS_IsNumber(value_);
}

MaybeLocal<BigInt> Value::ToBigInt(Local<Context> context) const {
    if (IsBigInt()) {
        return MaybeLocal<BigInt>(Local<BigInt>(static_cast<BigInt*>(const_cast<Value*>(this))));
    } else {
        return MaybeLocal<BigInt>();
    }
}

MaybeLocal<Number> Value::ToNumber(Local<Context> context) const {
    if (IsNumber()) {
        return MaybeLocal<Number>(Local<Number>(static_cast<Number*>(const_cast<Value*>(this))));
    }
    else {
        double d;
        if (JS_ToFloat64(context->context_, &d, value_)) {
            return MaybeLocal<Number>();
        }
        else {
            return Number::New(context->GetIsolate(), d);
        }
    }
}

Local<Boolean> Value::ToBoolean(Isolate* isolate) const {
    return Local<Boolean>(static_cast<Boolean*>(const_cast<Value*>(this)));
}

MaybeLocal<Int32> Value::ToInt32(Local<Context> context) const {
    return MaybeLocal<Int32>(Local<Int32>(static_cast<Int32*>(const_cast<Value*>(this))));
}

MaybeLocal<Integer> Value::ToInteger(Local<Context> context) const {
    return MaybeLocal<Integer>(Local<Integer>(static_cast<Integer*>(const_cast<Value*>(this))));
}

bool Value::BooleanValue(Isolate* isolate) const {
    return (bool)JS_ToBool(isolate->current_context_->context_, value_);
}

bool Value::IsRegExp() const {
    return (bool)JS_IsRegExp(value_);
}


MaybeLocal<String> Value::ToString(Local<Context> context) const {
    if (JS_IsString(value_)) {
        return MaybeLocal<String>(Local<String>(static_cast<String*>(const_cast<Value*>(this))));
    } else {
        //由HandleScope跟踪回收//////////
        String * str = context->GetIsolate()->Alloc<String>();
        str->value_ = JS_ToString(context->context_, value_);
        return MaybeLocal<String>(Local<String>(str));
    }
    
}

V8_WARN_UNUSED_RESULT MaybeLocal<Object> Value::ToObject(Local<Context> context) const {
    if (IsObject()) {
        return MaybeLocal<Object>(Local<Object>(Object::Cast(const_cast<Value*>(this))));
    } else {
        return MaybeLocal<Object>();
    }
}

V8_WARN_UNUSED_RESULT Maybe<double> Value::NumberValue(Local<Context> context) const {
    return Maybe<double>(Number::Cast(const_cast<Value*>(this))->Value());
}

MaybeLocal<String> String::NewFromUtf8(
    Isolate* isolate, const char* data,
    NewStringType type, int length) {
    String *str = isolate->Alloc<String>();
    //printf("NewFromUtf8:%p\n", str);
    size_t len = length > 0 ? length : strlen(data);
    str->value_ = JS_NewStringLen(isolate->current_context_->context_, data, len);
    return Local<String>(str);
}

Local<String> String::Empty(Isolate* isolate) {
    if (JS_IsUndefined(isolate->literal_values_[kEmptyStringIndex])) {
        isolate->literal_values_[kEmptyStringIndex] = JS_NewStringLen(isolate->current_context_->context_, "", 0);
    }
    return Local<String>(reinterpret_cast<String*>(&isolate->literal_values_[kEmptyStringIndex]));
}

int String::Utf8Length(Isolate* isolate) const {
    size_t len;
    const char* p = JS_ToCStringLen(isolate->current_context_->context_, &len, value_);
    JS_FreeCString(isolate->current_context_->context_, p);
    return (int)len;
}

int String::WriteUtf8(Isolate* isolate, char* buffer) const {
    size_t len;
    const char* p = JS_ToCStringLen(isolate->current_context_->context_, &len, value_);
    
    memcpy(buffer, p, len);
    buffer[len] = '\0';
    
    JS_FreeCString(isolate->current_context_->context_, p);
    return (int)len;
}

//！！如果一个Local<String>用到这个接口了，就不能再传入JS
MaybeLocal<Script> Script::Compile(
    Local<Context> context, Local<String> source,
    ScriptOrigin* origin) {
    Script* script = new Script();
    script->source_ = source;
    if (origin) {
        script->resource_name_ = MaybeLocal<String>(Local<String>::Cast(origin->resource_name_));
    }
    return MaybeLocal<Script>(Local<Script>(script));
}

static V8_INLINE MaybeLocal<Value> ProcessResult(Isolate *isolate, JSValue ret) {
    Value* val = nullptr;
    if (JS_IsException(ret)) {
        isolate->pendingException_ = JS_GetException(isolate->current_context_->context_);
        isolate->hasPendingException_ = true;
        if (!isolate->currentTryCatch_) {
            isolate->handleException();
        }

        return MaybeLocal<Value>();
    } else {
        //脚本执行的返回值由HandleScope接管，这可能有需要GC的对象//////////
        val = isolate->Alloc<Value>();
        val->value_ = ret;
        return MaybeLocal<Value>(Local<Value>(val));
    }
}

MaybeLocal<Value> Script::Run(Local<Context> context) {
    auto isolate = context->GetIsolate();

    String::Utf8Value source(isolate, source_);
    const char *filename = resource_name_.IsEmpty() ? "eval" : *String::Utf8Value(isolate, resource_name_.ToLocalChecked());
    JS_UpdateStackTop(isolate->runtime_);
    auto ret = JS_Eval(context->context_, *source, source.length(), filename, JS_EVAL_TYPE_GLOBAL);

    return ProcessResult(isolate, ret);
}

Script::~Script() {
    //JS_FreeValue(context_->context_, source_->value_);
    //if (!resource_name_.IsEmpty()) {
    //    JS_FreeValue(context_->context_, resource_name_.ToLocalChecked()->value_);
    //}
}

Local<External> External::New(Isolate* isolate, void* value) {
    External* external = isolate->Alloc<External>();
    JS_INITPTR(external->value_, JS_TAG_EXTERNAL, value);
    return Local<External>(external);
}

void* External::Value() const {
    return JS_VALUE_GET_PTR(value_);
}

double Number::Value() const {
    double ret;
    JS_ToFloat64(Isolate::current_->current_context_->context_, &ret, value_);
    return ret;
}

Local<Number> Number::New(Isolate* isolate, double value) {
    Number* ret = isolate->Alloc<Number>();
    ret->value_ = JS_NewFloat64_(isolate->GetCurrentContext()->context_, value);
    return Local<Number>(ret);
}

Local<Integer> Integer::New(Isolate* isolate, int32_t value) {
    Integer* ret = isolate->Alloc<Integer>();
    JS_INITVAL(ret->value_, JS_TAG_INT, value);
    return Local<Integer>(ret);
}

Local<Integer> Integer::NewFromUnsigned(Isolate* isolate, uint32_t value) {
    Integer* ret = isolate->Alloc<Integer>();
    ret->value_ = JS_NewUint32_(isolate->GetCurrentContext()->context_, value);;
    return Local<Integer>(ret);
}

Local<BigInt> BigInt::New(Isolate* isolate, int64_t value) {
    BigInt* ret = isolate->Alloc<BigInt>();
    ret->value_ = JS_NewBigInt64(isolate->current_context_->context_, value);
    return Local<BigInt>(ret);
}

Local<BigInt> BigInt::NewFromUnsigned(Isolate* isolate, uint64_t value) {
    BigInt* ret = isolate->Alloc<BigInt>();
    ret->value_ = JS_NewBigUint64(isolate->current_context_->context_, value);
    return Local<BigInt>(ret);
}

uint64_t BigInt::Uint64Value(bool* lossless) const {
    return static_cast<uint64_t>(Int64Value(lossless));
}

int64_t BigInt::Int64Value(bool* lossless) const {
    int64_t ret;
    JS_ToBigInt64(Isolate::current_->current_context_->context_, &ret, value_);
    return ret;
}

bool Boolean::Value() const {
    return (bool)JS_VALUE_GET_BOOL(value_);
}

Local<Boolean> Boolean::New(Isolate* isolate, bool value) {
    Boolean* ret = isolate->Alloc<Boolean>();
    JS_INITVAL(ret->value_, JS_TAG_BOOL, (value != 0));
    return Local<Boolean>(ret);
}

int64_t Integer::Value() const {
    if (JS_VALUE_GET_TAG(value_) == JS_TAG_INT) {
        return JS_VALUE_GET_INT(value_);
    } else if (JS_VALUE_GET_TAG(value_) == JS_TAG_FLOAT64) {
        return (int64_t)JS_VALUE_GET_FLOAT64(value_);
    } else {
        int64_t i;
        JS_ToInt64(Isolate::current_->GetCurrentContext()->context_, &i, value_);
        return i;
    }
}

int32_t Int32::Value() const {
    if (JS_VALUE_GET_TAG(value_) == JS_TAG_INT) {
        return JS_VALUE_GET_INT(value_);
    } else if (JS_VALUE_GET_TAG(value_) == JS_TAG_FLOAT64) {
        return (int32_t)JS_VALUE_GET_FLOAT64(value_);
    } else {
        int32_t i;
        JS_ToInt32(Isolate::current_->GetCurrentContext()->context_, &i, value_);
        return i;
    }
}

String::Utf8Value::Utf8Value(Isolate* isolate, Local<Value> obj) {
    auto context = isolate->GetCurrentContext();
    data_ = JS_ToCStringLen(context->context_, &len_, obj->value_);
    context_ = context->context_;
}

String::Utf8Value::~Utf8Value() {
    if (context_) {
        JS_FreeCString(context_, data_);
    }
}

MaybeLocal<Value> Date::New(Local<Context> context, double time) {
    Date *date = context->GetIsolate()->Alloc<Date>();
    date->value_ = JS_NewDate(context->context_, time);
    return MaybeLocal<Value>(Local<Date>(date));
}
    
double Date::ValueOf() const {
    return JS_GetDate(Isolate::current_->current_context_->context_, value_);
}

void Map::Clear() {
    JS_MapClear(Isolate::current_->GetCurrentContext()->context_, value_);
}

MaybeLocal<Value> Map::Get(Local<Context> context,
                           Local<Value> key) {
    JSValue v = JS_MapGet(context->context_, value_, key->value_);
    if (JS_IsException(v)) {
        return MaybeLocal<Value>();
    }
    Value *val = context->GetIsolate()->Alloc<Value>();
    val->value_ = v;
    return MaybeLocal<Value>(Local<Value>(val));
}

MaybeLocal<Map> Map::Set(Local<Context> context,
                         Local<Value> key,
                         Local<Value> value) {
    JSValue m = JS_MapSet(context->context_, value_, key->value_, value->value_);
    if (JS_IsException(m)) {
        return MaybeLocal<Map>();
    }
    Map *map = context->GetIsolate()->Alloc<Map>();
    map->value_ = m;
    return MaybeLocal<Map>(Local<Map>(map));
}

MaybeLocal<Value> Map::Delete(Local<Context> context,
                           Local<Value> key) {
    JSValue v = JS_MapDelete(context->context_, value_, key->value_);
    if (JS_IsException(v)) {
        return MaybeLocal<Value>();
    }
    Value *val = context->GetIsolate()->Alloc<Value>();
    val->value_ = v;
    return MaybeLocal<Value>(Local<Value>(val));
}

Local<Map> Map::New(Isolate* isolate) {
    Map *map = isolate->Alloc<Map>();
    map->value_ = JS_NewMap(isolate->GetCurrentContext()->context_);
    return Local<Map>(map);
}


void Set::Clear() {
    JS_MapClear(Isolate::current_->GetCurrentContext()->context_, value_);
}

Maybe<bool> Set::Has(Local<Context> context,
                           Local<Value> key) {
    JSValue v = JS_SetHas(context->context_, value_, key->value_);
    if (JS_IsException(v)) {
        return Maybe<bool>(false);
    }
    return Maybe<bool>(JS_ToBool(context->context_, v) == 1);
}

MaybeLocal<Set> Set::Add(Local<Context> context,
                         Local<Value> key) {
    JSValue m = JS_SetAdd(context->context_, value_, key->value_);
    if (JS_IsException(m)) {
        return MaybeLocal<Set>();
    }
    Set *set = context->GetIsolate()->Alloc<Set>();
    set->value_ = m;
    return MaybeLocal<Set>(Local<Set>(set));
}

Maybe<bool> Set::Delete(Local<Context> context,
                           Local<Value> key) {
    JSValue v = JS_SetDelete(context->context_, value_, key->value_);
    if (JS_IsException(v)) {
        return Maybe<bool>(false);
    }
    return Maybe<bool>(JS_ToBool(context->context_, v) == 1);
}

Local<Set> Set::New(Isolate* isolate) {
    Set *set = isolate->Alloc<Set>();
    set->value_ = JS_NewSet(isolate->GetCurrentContext()->context_);
    return Local<Set>(set);
}

Local<ArrayBuffer> ArrayBuffer::New(Isolate* isolate, size_t byte_length) {
    ArrayBuffer *ab = isolate->Alloc<ArrayBuffer>();
    ab->value_ = JS_NewArrayBufferCopy(isolate->current_context_->context_, nullptr, byte_length);
    return Local<ArrayBuffer>(ab);
}

Local<ArrayBuffer> ArrayBuffer::New(Isolate* isolate, void* data, size_t byte_length,
                                           ArrayBufferCreationMode mode) {
    V8::Check(mode == ArrayBufferCreationMode::kExternalized, "only ArrayBufferCreationMode::kExternalized support!");
    ArrayBuffer *ab = isolate->Alloc<ArrayBuffer>();
    ab->value_ = JS_NewArrayBuffer(isolate->current_context_->context_, (uint8_t*)data, byte_length, nullptr, nullptr, false);
    return Local<ArrayBuffer>(ab);
}

Local<ArrayBuffer> ArrayBuffer::New(Isolate* isolate, std::shared_ptr<BackingStore> backing_store) {
    ArrayBuffer *ab = isolate->Alloc<ArrayBuffer>();
    ab->value_ = JS_NewArrayBuffer(isolate->current_context_->context_, (uint8_t*)backing_store->Data(), backing_store->ByteLength(),
    nullptr, nullptr, false);
    return Local<ArrayBuffer>(ab);
}

ArrayBuffer::Contents ArrayBuffer::GetContents() {
    ArrayBuffer::Contents ret;
    ret.data_ = JS_GetArrayBuffer(Isolate::current_->current_context_->context_, &ret.byte_length_, value_);
    return ret;
}

std::unique_ptr<BackingStore> ArrayBuffer::NewBackingStore(
    void* data, size_t byte_length, BackingStore::DeleterCallback deleter,
    void* deleter_data
) {
    V8::Check(deleter == BackingStore::EmptyDeleter, "only BackingStore::EmptyDeleter support!");

    BackingStore *ret = new BackingStore;
    ret->data_ = data;
    ret->byte_length_ = byte_length;
    std::unique_ptr<BackingStore> ptr(ret);
    return ptr;
}

std::shared_ptr<BackingStore> ArrayBuffer::GetBackingStore() {
    BackingStore *ret = new BackingStore;
    ret->data_ = JS_GetArrayBuffer(Isolate::current_->current_context_->context_, &ret->byte_length_, value_);
    std::shared_ptr<BackingStore> ptr(ret);
    return ptr;
}

Local<ArrayBuffer> ArrayBufferView::Buffer() {
    Isolate* isolate = Isolate::current_;
    ArrayBuffer* ab = isolate->Alloc<ArrayBuffer>();
    ab->value_ = JS_GetArrayBufferView(isolate->current_context_->context_, value_);
    return Local<ArrayBuffer>(ab);
}
    
size_t ArrayBufferView::ByteOffset() {
    size_t byte_offset;
    size_t byte_length;
    size_t bytes_per_element;
    JS_GetArrayBufferViewInfo(Isolate::current_->current_context_->context_, value_, &byte_offset, &byte_length, &bytes_per_element);
    return byte_offset;
}
    
size_t ArrayBufferView::ByteLength() {
    size_t byte_offset;
    size_t byte_length;
    size_t bytes_per_element;
    JS_GetArrayBufferViewInfo(Isolate::current_->current_context_->context_, value_, &byte_offset, &byte_length, &bytes_per_element);
    return byte_length;
}

Local<Object> Context::Global() {
    Object *g = reinterpret_cast<Object*>(&global_);
    return Local<Object>(g);
}

Context::Context(Isolate* isolate) : Context(isolate, nullptr) {
}

Context::Context(Isolate* isolate, void* external_context) :isolate_(isolate) {
    is_external_context_ = external_context != nullptr;
    context_ = is_external_context_ ? ((JSContext *)external_context) : JS_NewContext(isolate->runtime_);
    // JS_SetContextOpaque(context_, this);
    global_ = JS_GetGlobalObject(context_);
}

Local<Context> Context::New(Isolate* isolate) {
    auto ret = Local<Context>(new Context(isolate));
    ret->SetWeakPtrToOpaque(ret.val_);
    return ret;
}

Local<Context> Context::New(Isolate* isolate, void* external_context) {
    auto ret =  Local<Context>(new Context(isolate, external_context));
    ret->SetWeakPtrToOpaque(ret.val_);
    return ret;
}

Context::~Context() {
    delete reinterpret_cast<std::weak_ptr<Context>*>(PUERTS_GET_CONTEXT_OPAQUE(context_));
    JS_FreeValue(context_, global_);
    if (!is_external_context_) {
        JS_FreeContext(context_);
    }
}

void Context::SetWeakPtrToOpaque(std::shared_ptr<Context> sptr) {
    PUERTS_SET_CONTEXT_OPAQUE(context_, new std::weak_ptr<Context>(sptr));
}

MaybeLocal<Value> Function::Call(Local<Context> context,
                             Local<Value> recv, int argc,
                             Local<Value> argv[]) {
    Isolate *isolate = context->GetIsolate();
    JSValue *js_this = reinterpret_cast<JSValue*>(recv.IsEmpty() ? isolate->Undefined() : (*recv));
    JSValue *js_argv = (JSValue*)alloca(argc * sizeof(JSValue));
    for(int i = 0 ; i < argc; i++) {
        //isolate->Escape(*argv[i]);
        js_argv[i] = argv[i]->value_;
    }
    
    JS_UpdateStackTop(isolate->runtime_);
    JSValue ret = JS_Call(context->context_, value_, *js_this, argc, js_argv);
    
    return ProcessResult(isolate, ret);
}

MaybeLocal<Object> Function::NewInstance(Local<Context> context, int argc, Local<Value> argv[]) const {
    Isolate *isolate = context->GetIsolate();
    JSValue *js_argv = (JSValue*)alloca(argc * sizeof(JSValue));
    for(int i = 0 ; i < argc; i++) {
        //isolate->Escape(*argv[i]);
        js_argv[i] = argv[i]->value_;
    }
    
    JS_UpdateStackTop(isolate->runtime_);
    JSValue ret = JS_CallConstructor(context->context_, value_, argc, js_argv);
    
    auto maybe_value = ProcessResult(isolate, ret);
    if (maybe_value.IsEmpty()) {
        return MaybeLocal<Object>();
    } else {
        return MaybeLocal<Object>(maybe_value.ToLocalChecked().As<Object>());
    }
}

void Template::Set(Isolate* isolate, const char* name, Local<Data> value) {
    fields_[name] = value;
}

void Template::Set(Local<Name> name, Local<Data> value,
                   PropertyAttribute attributes) {
    Isolate* isolate = Isolate::current_;
    Set(isolate, *String::Utf8Value(Isolate::current_, name), value);
}
    
void Template::SetAccessorProperty(Local<Name> name,
                                         Local<FunctionTemplate> getter,
                                         Local<FunctionTemplate> setter,
                                         PropertyAttribute attribute) {
    
    accessor_property_infos_[*String::Utf8Value(Isolate::current_, name)] = {getter, setter, attribute};
}

void Template::InitPropertys(Local<Context> context, JSValue obj) {
    for(auto it : fields_) {
        JSAtom atom = JS_NewAtom(context->context_, it.first.data());
        Local<FunctionTemplate> funcTpl = Local<FunctionTemplate>::Cast(it.second);
        Local<Function> lfunc = funcTpl->GetFunction(context).ToLocalChecked();
        context->GetIsolate()->Escape(*lfunc);
        JS_DefinePropertyValue(context->context_, obj, atom, lfunc->value_, JS_PROP_CONFIGURABLE | JS_PROP_ENUMERABLE | JS_PROP_WRITABLE);
        JS_FreeAtom(context->context_, atom);
    }
    
    for (auto it : accessor_property_infos_) {
        JSValue getter = JS_Undefined();
        JSValue setter = JS_Undefined();
        int flag = 0;
        if (!(it.second.attribute_ & DontDelete)) {
            flag |= JS_PROP_CONFIGURABLE;
        }
        if (!(it.second.attribute_ & DontEnum)) {
            flag |= JS_PROP_ENUMERABLE;
        }
        
        std::string name = it.first;
        if (!it.second.getter_.IsEmpty()) {
            flag |= JS_PROP_HAS_GET;
            Local<Function> gfunc = it.second.getter_->GetFunction(context).ToLocalChecked();
            context->GetIsolate()->Escape(*gfunc);
            getter = gfunc->value_;
        }
        
        if (!(it.second.attribute_ & ReadOnly) && !it.second.setter_.IsEmpty()) {
            flag |= JS_PROP_HAS_SET;
            flag |= JS_PROP_WRITABLE;
            Local<Function> sfunc = it.second.setter_->GetFunction(context).ToLocalChecked();
            context->GetIsolate()->Escape(*sfunc);
            setter = sfunc->value_;
        }
        JSAtom atom = JS_NewAtom(context->context_, name.c_str());
        JS_DefineProperty(context->context_, obj, atom, JS_Undefined(), getter, setter, flag);
        JS_FreeAtom(context->context_, atom);
        JS_FreeValue(context->context_, getter);
        JS_FreeValue(context->context_, setter);
    }
}

void ObjectTemplate::SetAccessor(Local<Name> name, AccessorNameGetterCallback getter,
                                 AccessorNameSetterCallback setter,
                                 Local<Value> data, AccessControl settings,
                                 PropertyAttribute attribute) {
    JSValue js_data = data.IsEmpty() ? JS_Undefined() : data->value_;
    accessor_infos_[*String::Utf8Value(Isolate::current_, name)] = {getter, setter, js_data, settings, attribute};
}

void ObjectTemplate::InitAccessors(Local<Context> context, JSValue obj) {
    for (auto it : accessor_infos_) {
        JSValue getter = JS_Undefined();
        JSValue setter = JS_Undefined();
        int flag = 0;
        if (!(it.second.attribute_ & DontDelete)) {
            flag |= JS_PROP_CONFIGURABLE;
        }
        if (!(it.second.attribute_ & DontEnum)) {
            flag |= JS_PROP_ENUMERABLE;
        }
        
        std::string name = it.first;
        
        auto name_val = String::NewFromUtf8(context->GetIsolate(), name.c_str()).ToLocalChecked();
        
        JSValue func_data[] = {JS_Undefined(), name_val->value_, it.second.data_};
        
        if (it.second.getter_) {
            flag |= JS_PROP_HAS_GET;
            JS_INITPTR(func_data[0], JS_TAG_EXTERNAL, (void*)it.second.getter_);
            getter = JS_NewCFunctionData(context->context_, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data) {
                auto sptr = (*reinterpret_cast<std::weak_ptr<Context>*>(PUERTS_GET_CONTEXT_OPAQUE(ctx))).lock();
                Isolate* isolate = sptr->GetIsolate();
                
                Isolate::Scope isolateScope(isolate);
                HandleScope handleScope(isolate);
                Local<Context> context;
                context.val_ = sptr;
                Context::Scope contextScope(context);

                PropertyCallbackInfo<Value> callbackInfo;
                callbackInfo.isolate_ = isolate;
                callbackInfo.context_ = ctx;
                callbackInfo.this_ = this_val;
                callbackInfo.data_ = func_data[2];
                callbackInfo.value_ = JS_Undefined();
                
                String *key = reinterpret_cast<String*>(&func_data[1]);
                AccessorNameGetterCallback callback = (AccessorNameGetterCallback)(JS_VALUE_GET_PTR(func_data[0]));
                callback(Local<String>(key), callbackInfo);
                
                if (isolate->hasPendingException_) {
                    JSValue ex = isolate->pendingException_;
                    isolate->pendingException_ = JS_Undefined();
                    isolate->hasPendingException_ = false;
                    return JS_Throw(ctx, ex);
                }
                
                return callbackInfo.value_;
            }, 0, 0, 3, &func_data[0]);
        }
        
        if (!(it.second.attribute_ & ReadOnly) && it.second.setter_) {
            flag |= JS_PROP_HAS_SET;
            flag |= JS_PROP_WRITABLE;
            JS_INITPTR(func_data[0], JS_TAG_EXTERNAL, (void*)it.second.setter_);
            setter = JS_NewCFunctionData(context->context_, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data) {
                auto sptr = (*reinterpret_cast<std::weak_ptr<Context>*>(PUERTS_GET_CONTEXT_OPAQUE(ctx))).lock();
                Isolate* isolate = sptr->GetIsolate();
                
                Isolate::Scope isolateScope(isolate);
                HandleScope handleScope(isolate);
                Local<Context> context;
                context.val_ = sptr;
                Context::Scope contextScope(context);

                PropertyCallbackInfo<void> callbackInfo;
                callbackInfo.isolate_ = isolate;
                callbackInfo.context_ = ctx;
                callbackInfo.this_ = this_val;
                callbackInfo.data_ = func_data[2];
                callbackInfo.value_ = JS_Undefined();
                
                String *key = reinterpret_cast<String*>(&func_data[1]);
                Value *val = reinterpret_cast<Value*>(argv);
                AccessorNameSetterCallback callback = (AccessorNameSetterCallback)(JS_VALUE_GET_PTR(func_data[0]));
                callback(Local<String>(key), Local<Value>(val), callbackInfo);
                
                if (isolate->hasPendingException_) {
                    JSValue ex = isolate->pendingException_;
                    isolate->pendingException_ = JS_Undefined();
                    isolate->hasPendingException_ = false;
                    return JS_Throw(ctx, ex);
                }
                
                return callbackInfo.value_;
            }, 0, 0, 3, &func_data[0]);
        }
        JSAtom atom = JS_NewAtom(context->context_, name.c_str());
        JS_DefineProperty(context->context_, obj, atom, JS_Undefined(), getter, setter, flag);
        JS_FreeAtom(context->context_, atom);
        JS_FreeValue(context->context_, getter);
        JS_FreeValue(context->context_, setter);
    }
}

void ObjectTemplate::SetInternalFieldCount(int value) {
    internal_field_count_ = value;
}

MaybeLocal<Object> ObjectTemplate::NewInstance(Local<Context> context)
{
    Object* obj = context->GetIsolate()->Alloc<Object>();
    if (constructor_template_) {
        JSValue func = constructor_template_ ->GetFunction(context).ToLocalChecked()->value_;
        JSAtom prototypeAtom = JS_NewAtom(context->context_, "prototype");
        JSValue proto = JS_GetProperty(context->context_, func, prototypeAtom);
        JS_FreeAtom(context->context_, prototypeAtom);
        obj->value_ = JS_NewObjectProtoClass(context->context_, proto, context->GetIsolate()->class_id_);
        JS_FreeValue(context->context_, proto);
        size_t size = sizeof(ObjectUserData) + sizeof(void*) * (internal_field_count_ - 1);
        ObjectUserData* object_udata = (ObjectUserData*)js_malloc(context->context_, size);
        memset(object_udata, 0, size);
        object_udata->len_ = internal_field_count_;
        JS_SetOpaque(obj->value_, object_udata);
    } else {
        obj->value_ = JS_NewObject(context->context_);
    }
    Local<Object> ret(obj);
    return MaybeLocal<Object>(ret);
}

Local<FunctionTemplate> FunctionTemplate::New(Isolate* isolate, FunctionCallback callback,
                                              Local<Value> data) {
    Local<FunctionTemplate> functionTemplate(new FunctionTemplate());
    if (data.IsEmpty()) {
        functionTemplate->cfunction_data_.data_ = JS_Undefined();
    } else {
        functionTemplate->cfunction_data_.data_ = data->value_;
    }
    functionTemplate->cfunction_data_.callback_ = callback;
    
    //isolate->RegFunctionTemplate(functionTemplate);
    functionTemplate->isolate_ = isolate;
    return functionTemplate;
}

Local<ObjectTemplate> FunctionTemplate::InstanceTemplate() {
    if (instance_template_.IsEmpty()) {
        instance_template_ = Local<ObjectTemplate>(new ObjectTemplate());
        instance_template_->constructor_template_ = this;
    }
    return instance_template_;
}
    
void FunctionTemplate::Inherit(Local<FunctionTemplate> parent) {
    parent_ = parent;
}
    
Local<ObjectTemplate> FunctionTemplate::PrototypeTemplate() {
    if (prototype_template_.IsEmpty()) {
        prototype_template_ = Local<ObjectTemplate>(new ObjectTemplate());
    }
    return prototype_template_;
}

MaybeLocal<Function> FunctionTemplate::GetFunction(Local<Context> context) {
    auto iter = context_to_funtion_.find(*context);
    if (iter != context_to_funtion_.end()) {
        Function* ret = isolate_->Alloc<Function>();
        ret->value_ = iter->second;
        JS_DupValueRT(isolate_->runtime_, ret->value_);
        return MaybeLocal<Function>(Local<Function>(ret));
    }
    cfunction_data_.is_construtor_ = !prototype_template_.IsEmpty() || !instance_template_.IsEmpty() || fields_.size() > 0 || accessor_property_infos_.size() > 0 || !parent_.IsEmpty();
    cfunction_data_.internal_field_count_ = instance_template_.IsEmpty() ? 0 : instance_template_->internal_field_count_;
    
    JSValue func_data[4];
    JS_INITPTR(func_data[0], JS_TAG_EXTERNAL, (void*)cfunction_data_.callback_);
    func_data[1] = JS_NewInt32_(context->context_, cfunction_data_.internal_field_count_);
    func_data[2] = cfunction_data_.data_;
    func_data[3] = cfunction_data_.is_construtor_ ? JS_True() : JS_False();
    
    JSValue func = JS_NewCFunctionData(context->context_, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data) {
        auto sptr = (*reinterpret_cast<std::weak_ptr<Context>*>(PUERTS_GET_CONTEXT_OPAQUE(ctx))).lock();
        Isolate* isolate = sptr->GetIsolate();
        
        Isolate::Scope isolateScope(isolate);
        HandleScope handleScope(isolate);
        Local<Context> context;
        context.val_ = sptr;
        Context::Scope contextScope(context);
        
        FunctionCallback callback = (FunctionCallback)(JS_VALUE_GET_PTR(func_data[0]));
        int32_t internal_field_count;
        JS_ToInt32(ctx, &internal_field_count, func_data[1]);
        FunctionCallbackInfo<Value> callbackInfo;
        callbackInfo.isolate_ = isolate;
        callbackInfo.argc_ = argc;
        callbackInfo.argv_ = argv;
        callbackInfo.context_ = ctx;
        callbackInfo.this_ = this_val;
        callbackInfo.data_ = func_data[2];
        callbackInfo.value_ = JS_Undefined();
        //JS_IsConstructor(ctx, this_val)，静态方法的话，用JS_IsConstructor会返回true，其父节点对象是构造函数，这个就是构造函数？//////////
        callbackInfo.isConstructCall = (bool)JS_ToBool(ctx, func_data[3]);
        
        if (callbackInfo.isConstructCall && internal_field_count > 0) {
            JSAtom prototypeAtom = JS_NewAtom(ctx, "prototype");
            JSValue proto = JS_GetProperty(ctx, this_val, prototypeAtom);
            JS_FreeAtom(ctx, prototypeAtom);
            callbackInfo.this_ = JS_NewObjectProtoClass(ctx, proto, isolate->class_id_);
            JS_FreeValue(ctx, proto);
            size_t size = sizeof(ObjectUserData) + sizeof(void*) * (internal_field_count - 1);
            ObjectUserData* object_udata = (ObjectUserData*)js_malloc(ctx, size);
            memset(object_udata, 0, size);
            object_udata->len_ = internal_field_count;
            JS_SetOpaque(callbackInfo.this_, object_udata);
        }
        
        if (callback) callback(callbackInfo);
        
        if (isolate->hasPendingException_) {
            if (callbackInfo.isConstructCall && internal_field_count > 0) {
                JS_FreeValue(ctx, callbackInfo.this_);
            }
            JSValue ex = isolate->pendingException_;
            isolate->pendingException_ = JS_Undefined();
            isolate->hasPendingException_ = false;
            //isolate->Escape(&ex);
            return JS_Throw(ctx, ex);
        }
        
        return callbackInfo.isConstructCall ? callbackInfo.this_ : callbackInfo.value_;
    }, 0, 0, 4, &func_data[0]);
    
    auto aname = JS_NewAtom(context->context_, name_.c_str());
    JSAtom nameAtom = JS_NewAtom(context->context_, "name");
    JS_DefinePropertyValue( 
        context->context_, 
        func, 
        nameAtom,
        JS_AtomToString(context->context_, aname), 
        JS_PROP_CONFIGURABLE
    );
    JS_FreeAtom(context->context_, nameAtom);
    JS_FreeAtom(context->context_, aname);
    
    if (cfunction_data_.is_construtor_) {
        JS_SetConstructorBit(context->context_, func, 1);
        JSValue proto = JS_NewObject(context->context_);
        if (!prototype_template_.IsEmpty()) {
            prototype_template_->InitPropertys(context, proto);
            prototype_template_->InitAccessors(context, proto);
        }
        InitPropertys(context, func);
        JS_SetConstructor(context->context_, func, proto);
        JS_FreeValue(context->context_, proto);
        
        if (!parent_.IsEmpty()) {
            Local<Function> parent_func = parent_->GetFunction(context).ToLocalChecked();
            JSAtom prototypeAtom = JS_NewAtom(context->context_, "prototype");
            JSValue parent_proto = JS_GetProperty(context->context_, parent_func->value_, prototypeAtom);
            JS_FreeAtom(context->context_, prototypeAtom);
            JS_SetPrototype(context->context_, proto, parent_proto);
            JS_FreeValue(context->context_, parent_proto);
        }
    }
    
    Function* function = context->GetIsolate()->Alloc<Function>();
    function->value_ = func;
    
    Local<Function> ret(function);
    
    context_to_funtion_[*context] = func;
    JS_DupValueRT(isolate_->runtime_, func);
    
    return MaybeLocal<Function>(ret);
}

bool FunctionTemplate::HasInstance(Local<Value> object) {
    auto Context = Isolate::current_->GetCurrentContext();
    auto Func = GetFunction(Context).ToLocalChecked();
    int b = JS_IsInstanceOf(Isolate::current_->GetCurrentContext()->context_, object->value_, Func->value_);
    if (b < 0) return false;
    return (bool)b;
}

FunctionTemplate::~FunctionTemplate() {
    for(auto it : context_to_funtion_) {
        JS_FreeValueRT(isolate_->runtime_, it.second);
    }
}

Maybe<bool> Object::Set(Local<Context> context,
                        Local<Value> key, Local<Value> value) {
    bool ok = false;
    context->GetIsolate()->Escape(*value);
    if (key->IsNumber()) {
        ok = (bool)JS_SetPropertyUint32(context->context_, value_, key->Uint32Value(context).ToChecked(), value->value_);
    } else {
        JSAtom atom = JS_ValueToAtom(context->context_, key->value_);
        ok = (bool)JS_SetProperty(context->context_, value_, atom, value->value_);
        JS_FreeAtom(context->context_, atom);
    }
    
    return Maybe<bool>(ok);
}

Maybe<bool> Object::Set(Local<Context> context,
                uint32_t index, Local<Value> value) {
    bool ok = false;
    context->GetIsolate()->Escape(*value);
    
    ok = (bool)JS_SetPropertyUint32(context->context_, value_, index, value->value_);
    
    return Maybe<bool>(ok);
}

MaybeLocal<Value> Object::Get(Local<Context> context,
                      Local<Value> key) {
    Value* ret = context->GetIsolate()->Alloc<Value>();
    
    if (key->IsNumber()) {
        ret->value_ = JS_GetPropertyUint32(context->context_, value_, key->Uint32Value(context).ToChecked());
    } else {
        JSAtom atom = JS_ValueToAtom(context->context_, key->value_);
        ret->value_ = JS_GetProperty(context->context_, value_, atom);
        JS_FreeAtom(context->context_, atom);
    }
    
    return MaybeLocal<Value>(Local<Value>(ret));
}

MaybeLocal<Value> Object::Get(Local<Context> context,
                              uint32_t index) {
    Value* ret = context->GetIsolate()->Alloc<Value>();
    
    ret->value_ = JS_GetPropertyUint32(context->context_, value_, index);
    
    return MaybeLocal<Value>(Local<Value>(ret));
}

MaybeLocal<Array> Object::GetOwnPropertyNames(Local<Context> context) {
    auto properties = JS_GetOwnPropertyNamesAsArray(context->context_, value_);
    if (JS_IsException(properties)) {
        return MaybeLocal<Array>();
    }
    
    Array* ret = context->GetIsolate()->Alloc<Array>();
    ret->value_ = properties;
    
    return MaybeLocal<Array>(Local<Array>(ret));
}


Maybe<bool> Object::HasOwnProperty(Local<Context> context,
                                   Local<Name> key) {
    JSAtom atom = JS_ValueToAtom(context->context_, key->value_);
    int ret = JS_GetOwnProperty(Isolate::current_->GetCurrentContext()->context_, nullptr, value_, atom);
    JS_FreeAtom(context->context_, atom);
    if (ret < 0) {
        return Maybe<bool>();
    } else {
        return Maybe<bool>((bool)ret);
    }
}

Local<Value> Object::GetPrototype() {
    auto val = JS_GetPrototype(Isolate::current_->GetCurrentContext()->context_, value_);
    Value* ret = Isolate::current_->Alloc<Value>();
    ret->value_ = val;
    return Local<Value>(ret);
}

Maybe<bool> Object::SetPrototype(Local<Context> context,
                                 Local<Value> prototype) {
    if (JS_SetPrototype(Isolate::current_->GetCurrentContext()->context_, value_, prototype->value_) < 0) {
        return Maybe<bool>(false);
    } else {
        return Maybe<bool>(true);
    }
}

void Object::SetAlignedPointerInInternalField(int index, void* value) {
    ObjectUserData* objectUdata = reinterpret_cast<ObjectUserData*>(JS_GetOpaque(value_, Isolate::current_->class_id_));
    //if (index == 0) std::cout << "SetAlignedPointerInInternalField, value:" << value << ", objptr:" << JS_VALUE_GET_PTR(value_) << std::endl;
    if (!objectUdata || index >= objectUdata->len_) {
        std::cerr << "SetAlignedPointerInInternalField";
        if (objectUdata) {
            std::cerr << ", index out of range, index = " << index << ", length=" << objectUdata->len_ << std::endl;
        }
        else {
            std::cerr << "internalFields is nullptr " << std::endl;
        }
            
        abort();
    }
    objectUdata->ptrs_[index] = value;
}
    
void* Object::GetAlignedPointerFromInternalField(int index) {
    ObjectUserData* objectUdata = reinterpret_cast<ObjectUserData*>(JS_GetOpaque(value_, Isolate::current_->class_id_));
    
    bool noObjectUdata = IsFunction() || objectUdata == nullptr;

    if (noObjectUdata || index >= objectUdata->len_) {
        std::cerr << "GetAlignedPointerFromInternalField";
        if (!noObjectUdata) {
            std::cerr << ", index out of range, index = " << index << ", length=" << objectUdata->len_ << std::endl;
        }
        else {
            std::cerr << ", internalFields is nullptr " << std::endl;
        }
            
        abort();
    }
    return objectUdata->ptrs_[index];
}

int Object::InternalFieldCount() {
    ObjectUserData* objectUdata = reinterpret_cast<ObjectUserData*>(JS_GetOpaque(value_, Isolate::current_->class_id_));
    
    bool noObjectUdata = IsFunction() || objectUdata == nullptr;

    if (noObjectUdata) {
        return 0;
    }
    return objectUdata->len_;
}

Local<Object> Object::New(Isolate* isolate) {
    Object *object = isolate->Alloc<Object>();
    object->value_ = JS_NewObject(isolate->GetCurrentContext()->context_);
    return Local<Object>(object);
}

Local<Array> Array::New(Isolate* isolate) {
    Array *object = isolate->Alloc<Array>();
    object->value_ = JS_NewArray(isolate->GetCurrentContext()->context_);
    return Local<Array>(object);
}

uint32_t Array::Length() const {
    auto context = Isolate::current_->GetCurrentContext()->context_;
    JSAtom lengthAtom = JS_NewAtom(context, "length");
    auto len = JS_GetProperty(context, value_, lengthAtom);
    JS_FreeAtom(context, lengthAtom);
    if (JS_IsException(len)) {
        return 0;
    }
    uint32_t ret;
    JS_ToUint32(context, &ret, len);
    JS_FreeValue(context, len);
    return ret;
}

Maybe<bool> Array::Delete(Local<Context> context, uint32_t index) {
    JSAtom prop = JS_NewAtomUInt32(context->context_, index);
    if (JS_DeleteProperty(context->context_, value_, prop, JS_PROP_THROW) < 0) {
        JS_FreeAtom(context->context_, prop);
        return Maybe<bool>(false);
    }
    JS_FreeAtom(context->context_, prop);
    return Maybe<bool>(true);
}

TryCatch::TryCatch(Isolate* isolate) {
    isolate_ = isolate;
    catched_ = JS_Undefined();
    prev_ = isolate_->currentTryCatch_;
    isolate_->currentTryCatch_ = this;
}
    
TryCatch::~TryCatch() {
    isolate_->currentTryCatch_ = prev_;
    JS_FreeValue(isolate_->current_context_->context_, catched_);
    if (isolate_->hasPendingException_) {
        JS_FreeValueRT(isolate_->runtime_, isolate_->pendingException_);
        isolate_->pendingException_ = JS_Undefined();
        isolate_->hasPendingException_ = false;
    }
}
    
bool TryCatch::HasCaught() const {
    return (!JS_IsUndefined(catched_)) || isolate_->hasPendingException_;
}
    
Local<Value> TryCatch::Exception() const {
    return isolate_->hasPendingException_ ? Local<Value>(reinterpret_cast<Value*>(&isolate_->pendingException_))
               : Local<Value>(reinterpret_cast<Value*>(const_cast<JSValue*>(&catched_)));
}

MaybeLocal<Value> TryCatch::StackTrace(Local<Context> context) const {
    auto str = context->GetIsolate()->Alloc<String>();
    JSValue ex = isolate_->hasPendingException_ ?  isolate_->pendingException_ : catched_;
    JSAtom stackAtom = JS_NewAtom(isolate_->current_context_->context_, "stack");
    str->value_ = JS_GetProperty(isolate_->current_context_->context_, ex, stackAtom);
    JS_FreeAtom(isolate_->current_context_->context_, stackAtom);
    return MaybeLocal<Value>(Local<String>(str));
}

MaybeLocal<Value> TryCatch::StackTrace(
        Local<Context> context, Local<Value> exception) {
    auto isolate_ = context->GetIsolate();
    auto str = isolate_->Alloc<String>();
    JSAtom stackAtom = JS_NewAtom(isolate_->current_context_->context_, "stack");
    str->value_ = JS_GetProperty(isolate_->current_context_->context_, exception->value_, stackAtom);
    JS_FreeAtom(isolate_->current_context_->context_, stackAtom);
    return MaybeLocal<Value>(Local<String>(str));
}
    
Local<class Message> TryCatch::Message() const {
    JSValue ex = isolate_->hasPendingException_ ?  isolate_->pendingException_ : catched_;
    if (!JS_IsObject(ex)) {
        return Local<class Message>();
    }
    
    Local<class Message> message(new class Message());

    message->resource_name_ = "<unknow>";
    message->line_number_ = - 1;
    
    return message;
}

}  // namespace CUSTOMV8NAMESPACE
