// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef INCLUDE_CPPGC_CUSTOM_SPACE_H_
#define INCLUDE_CPPGC_CUSTOM_SPACE_H_

#include <stddef.h>

namespace cppgc {

struct CustomSpaceIndex {
  CustomSpaceIndex(size_t value) : value(value) {}  // NOLINT
  size_t value;
};

/**
 * Top-level base class for custom spaces. Users must inherit from CustomSpace
 * below.
 */
class CustomSpaceBase {
 public:
  virtual ~CustomSpaceBase() = default;
  virtual CustomSpaceIndex GetCustomSpaceIndex() const = 0;
};

/**
 * Base class custom spaces should directly inherit from. The class inheriting
 * from CustomSpace must define kSpaceIndex as unique space index. These
 * indices need for form a sequence starting at 0.
 *
 * Example:
 * \code
 * class CustomSpace1 : public CustomSpace<CustomSpace1> {
 *  public:
 *   static constexpr CustomSpaceIndex kSpaceIndex = 0;
 * };
 * class CustomSpace2 : public CustomSpace<CustomSpace2> {
 *  public:
 *   static constexpr CustomSpaceIndex kSpaceIndex = 1;
 * };
 * \endcode
 */
template <typename ConcreteCustomSpace>
class CustomSpace : public CustomSpaceBase {
 public:
  CustomSpaceIndex GetCustomSpaceIndex() const final {
    return ConcreteCustomSpace::kSpaceIndex;
  }
};

/**
 * User-overridable trait that allows pinning types to custom spaces.
 */
template <typename T, typename = void>
struct SpaceTrait {
  using Space = void;
};

}  // namespace cppgc

#endif  // INCLUDE_CPPGC_CUSTOM_SPACE_H_
