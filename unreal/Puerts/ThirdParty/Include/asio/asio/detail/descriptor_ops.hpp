//
// detail/descriptor_ops.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2021 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef ASIO_DETAIL_DESCRIPTOR_OPS_HPP
#define ASIO_DETAIL_DESCRIPTOR_OPS_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include "asio/detail/config.hpp"

#if !defined(ASIO_WINDOWS) \
  && !defined(ASIO_WINDOWS_RUNTIME) \
  && !defined(__CYGWIN__)

#include <cstddef>
#include "asio/error.hpp"
#include "asio/error_code.hpp"
#include "asio/detail/socket_types.hpp"

#include "asio/detail/push_options.hpp"

namespace puerts_asio {
namespace detail {
namespace descriptor_ops {

// Descriptor state bits.
enum
{
  // The user wants a non-blocking descriptor.
  user_set_non_blocking = 1,

  // The descriptor has been set non-blocking.
  internal_non_blocking = 2,

  // Helper "state" used to determine whether the descriptor is non-blocking.
  non_blocking = user_set_non_blocking | internal_non_blocking,

  // The descriptor may have been dup()-ed.
  possible_dup = 4
};

typedef unsigned char state_type;

inline void get_last_error(
    puerts_asio::error_code& ec, bool is_error_condition)
{
  if (!is_error_condition)
  {
    ec.assign(0, ec.category());
  }
  else
  {
    ec = puerts_asio::error_code(errno,
        puerts_asio::error::get_system_category());
  }
}

ASIO_DECL int open(const char* path, int flags,
    puerts_asio::error_code& ec);

ASIO_DECL int close(int d, state_type& state,
    puerts_asio::error_code& ec);

ASIO_DECL bool set_user_non_blocking(int d,
    state_type& state, bool value, puerts_asio::error_code& ec);

ASIO_DECL bool set_internal_non_blocking(int d,
    state_type& state, bool value, puerts_asio::error_code& ec);

typedef iovec buf;

ASIO_DECL std::size_t sync_read(int d, state_type state, buf* bufs,
    std::size_t count, bool all_empty, puerts_asio::error_code& ec);

ASIO_DECL std::size_t sync_read1(int d, state_type state, void* data,
    std::size_t size, puerts_asio::error_code& ec);

ASIO_DECL bool non_blocking_read(int d, buf* bufs, std::size_t count,
    puerts_asio::error_code& ec, std::size_t& bytes_transferred);

ASIO_DECL bool non_blocking_read1(int d, void* data, std::size_t size,
    puerts_asio::error_code& ec, std::size_t& bytes_transferred);

ASIO_DECL std::size_t sync_write(int d, state_type state,
    const buf* bufs, std::size_t count, bool all_empty,
    puerts_asio::error_code& ec);

ASIO_DECL std::size_t sync_write1(int d, state_type state,
    const void* data, std::size_t size, puerts_asio::error_code& ec);

ASIO_DECL bool non_blocking_write(int d,
    const buf* bufs, std::size_t count,
    puerts_asio::error_code& ec, std::size_t& bytes_transferred);

ASIO_DECL bool non_blocking_write1(int d,
    const void* data, std::size_t size,
    puerts_asio::error_code& ec, std::size_t& bytes_transferred);

ASIO_DECL int ioctl(int d, state_type& state, long cmd,
    ioctl_arg_type* arg, puerts_asio::error_code& ec);

ASIO_DECL int fcntl(int d, int cmd, puerts_asio::error_code& ec);

ASIO_DECL int fcntl(int d, int cmd,
    long arg, puerts_asio::error_code& ec);

ASIO_DECL int poll_read(int d,
    state_type state, puerts_asio::error_code& ec);

ASIO_DECL int poll_write(int d,
    state_type state, puerts_asio::error_code& ec);

ASIO_DECL int poll_error(int d,
    state_type state, puerts_asio::error_code& ec);

} // namespace descriptor_ops
} // namespace detail
} // namespace puerts_asio

#include "asio/detail/pop_options.hpp"

#if defined(ASIO_HEADER_ONLY)
# include "asio/detail/impl/descriptor_ops.ipp"
#endif // defined(ASIO_HEADER_ONLY)

#endif // !defined(ASIO_WINDOWS)
       //   && !defined(ASIO_WINDOWS_RUNTIME)
       //   && !defined(__CYGWIN__)

#endif // ASIO_DETAIL_DESCRIPTOR_OPS_HPP
