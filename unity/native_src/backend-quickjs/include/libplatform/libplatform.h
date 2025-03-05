#ifndef V8_LIBPLATFORM_LIBPLATFORM_H_
#define V8_LIBPLATFORM_LIBPLATFORM_H_

#include <memory>

#include "v8config.h"
#include "libplatform/libplatform-export.h"
#include "v8-platform.h" 

namespace CUSTOMV8NAMESPACE {
namespace platform {

V8_PLATFORM_EXPORT std::unique_ptr<CUSTOMV8NAMESPACE::Platform> NewDefaultPlatform();

}  // namespace platform
}  // namespace CUSTOMV8NAMESPACE

#endif  // V8_LIBPLATFORM_LIBPLATFORM_H_
