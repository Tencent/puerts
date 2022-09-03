//
// ip/unicast.hpp
// ~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2021 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef ASIO_IP_UNICAST_HPP
#define ASIO_IP_UNICAST_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include "asio/detail/config.hpp"
#include <cstddef>
#include "asio/ip/detail/socket_option.hpp"

#include "asio/detail/push_options.hpp"

namespace puerts_asio {
namespace ip {
namespace unicast {

/// Socket option for time-to-live associated with outgoing unicast packets.
/**
 * Implements the IPPROTO_IP/IP_UNICAST_TTL socket option.
 *
 * @par Examples
 * Setting the option:
 * @code
 * puerts_asio::ip::udp::socket socket(my_context);
 * ...
 * puerts_asio::ip::unicast::hops option(4);
 * socket.set_option(option);
 * @endcode
 *
 * @par
 * Getting the current option value:
 * @code
 * puerts_asio::ip::udp::socket socket(my_context);
 * ...
 * puerts_asio::ip::unicast::hops option;
 * socket.get_option(option);
 * int ttl = option.value();
 * @endcode
 *
 * @par Concepts:
 * GettableSocketOption, SettableSocketOption.
 */
#if defined(GENERATING_DOCUMENTATION)
typedef implementation_defined hops;
#else
typedef puerts_asio::ip::detail::socket_option::unicast_hops<
  ASIO_OS_DEF(IPPROTO_IP),
  ASIO_OS_DEF(IP_TTL),
  ASIO_OS_DEF(IPPROTO_IPV6),
  ASIO_OS_DEF(IPV6_UNICAST_HOPS)> hops;
#endif

} // namespace unicast
} // namespace ip
} // namespace puerts_asio

#include "asio/detail/pop_options.hpp"

#endif // ASIO_IP_UNICAST_HPP
