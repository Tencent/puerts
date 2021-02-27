#ifndef V8_LIBPLATFORM_LIBPLATFORM_H_
#define V8_LIBPLATFORM_LIBPLATFORM_H_

#include <memory>

#include "v8config.h"
#include "libplatform/libplatform-export.h"
#include "v8-platform.h" 

namespace v8 {
namespace platform {

V8_PLATFORM_EXPORT std::unique_ptr<v8::Platform> NewDefaultPlatform();

}  // namespace platform
}  // namespace v8

#endif  // V8_LIBPLATFORM_LIBPLATFORM_H_
