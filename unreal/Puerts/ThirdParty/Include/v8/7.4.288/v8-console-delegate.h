#ifndef INCLUDE_V8_CONSOLE_DELEGATE_H_
#define INCLUDE_V8_CONSOLE_DELEGATE_H_

#include "v8.h"

// internal api, copy from src\debug\interface-types.h & src\debug\debug-interface.h

namespace v8 {

namespace internal {
class BuiltinArguments;
}  // internal

namespace debug {
	class ConsoleCallArguments : private v8::FunctionCallbackInfo<v8::Value> {
 public:
  int Length() const { return v8::FunctionCallbackInfo<v8::Value>::Length(); }
  V8_INLINE Local<Value> operator[](int i) const {
    return v8::FunctionCallbackInfo<v8::Value>::operator[](i);
  }

  explicit ConsoleCallArguments(const v8::FunctionCallbackInfo<v8::Value>&);
  explicit ConsoleCallArguments(internal::BuiltinArguments&);
};

class ConsoleContext {
 public:
  ConsoleContext(int id, v8::Local<v8::String> name) : id_(id), name_(name) {}
  ConsoleContext() : id_(0) {}

  int id() const { return id_; }
  v8::Local<v8::String> name() const { return name_; }

 private:
  int id_;
  v8::Local<v8::String> name_;
};

class ConsoleDelegate {
 public:
  virtual void Debug(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void Error(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void Info(const ConsoleCallArguments& args,
                    const ConsoleContext& context) {}
  virtual void Log(const ConsoleCallArguments& args,
                   const ConsoleContext& context) {}
  virtual void Warn(const ConsoleCallArguments& args,
                    const ConsoleContext& context) {}
  virtual void Dir(const ConsoleCallArguments& args,
                   const ConsoleContext& context) {}
  virtual void DirXml(const ConsoleCallArguments& args,
                      const ConsoleContext& context) {}
  virtual void Table(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void Trace(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void Group(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void GroupCollapsed(const ConsoleCallArguments& args,
                              const ConsoleContext& context) {}
  virtual void GroupEnd(const ConsoleCallArguments& args,
                        const ConsoleContext& context) {}
  virtual void Clear(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void Count(const ConsoleCallArguments& args,
                     const ConsoleContext& context) {}
  virtual void CountReset(const ConsoleCallArguments& args,
                          const ConsoleContext& context) {}
  virtual void Assert(const ConsoleCallArguments& args,
                      const ConsoleContext& context) {}
  virtual void Profile(const ConsoleCallArguments& args,
                       const ConsoleContext& context) {}
  virtual void ProfileEnd(const ConsoleCallArguments& args,
                          const ConsoleContext& context) {}
  virtual void Time(const ConsoleCallArguments& args,
                    const ConsoleContext& context) {}
  virtual void TimeLog(const ConsoleCallArguments& args,
                       const ConsoleContext& context) {}
  virtual void TimeEnd(const ConsoleCallArguments& args,
                       const ConsoleContext& context) {}
  virtual void TimeStamp(const ConsoleCallArguments& args,
                         const ConsoleContext& context) {}
  virtual ~ConsoleDelegate() = default;
};


void SetConsoleDelegate(Isolate* isolate,
                                          ConsoleDelegate* delegate);
}  // namespace debug
}  // namespace v8

#endif  // INCLUDE_V8_CONSOLE_DELEGATE_H_