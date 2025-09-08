//
// detail/impl/throw_error.ipp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2021 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef ASIO_DETAIL_IMPL_THROW_ERROR_IPP
#define ASIO_DETAIL_IMPL_THROW_ERROR_IPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include "asio/detail/config.hpp"
#include "asio/detail/throw_error.hpp"
#include "asio/detail/throw_exception.hpp"
#include "asio/system_error.hpp"

#include "asio/detail/push_options.hpp"

namespace puerts_asio {
namespace detail {

void do_throw_error(const puerts_asio::error_code& err)
{
  puerts_asio::system_error e(err);
  puerts_asio::detail::throw_exception(e);
}

void do_throw_error(const puerts_asio::error_code& err, const char* location)
{
  // boostify: non-boost code starts here
#if defined(ASIO_MSVC) \
  && defined(ASIO_HAS_STD_SYSTEM_ERROR) \
  && (_MSC_VER < 1928)
  // Microsoft's implementation of std::system_error is non-conformant in that
  // it ignores the error code's message when a "what" string is supplied. We'll
  // work around this by explicitly formatting the "what" string.
  std::string what_msg = location;
  what_msg += ": ";
  what_msg += err.message();
  puerts_asio::system_error e(err, what_msg);
  puerts_asio::detail::throw_exception(e);
#else // defined(ASIO_MSVC)
      //   && defined(ASIO_HAS_STD_SYSTEM_ERROR)
      //   && (_MSC_VER < 1928)
  // boostify: non-boost code ends here
  puerts_asio::system_error e(err, location);
  puerts_asio::detail::throw_exception(e);
  // boostify: non-boost code starts here
#endif // defined(ASIO_MSVC)
       //   && defined(ASIO_HAS_STD_SYSTEM_ERROR)
       //   && (_MSC_VER < 1928)
  // boostify: non-boost code ends here
}

} // namespace detail
} // namespace puerts_asio

#include "asio/detail/pop_options.hpp"

#endif // ASIO_DETAIL_IMPL_THROW_ERROR_IPP
