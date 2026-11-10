/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <cstddef>
#include <cstring>
#include <functional>
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
// the string used instead of std::string (which crashes on some platforms of UE), binary safe (may contain '\0'), the
// buffer is allocated by new[] (the allocator of UE in a UE module), nullptr for an empty string
class PString
{
public:
    static constexpr size_t npos = static_cast<size_t>(-1);

    PString() : data_(nullptr), size_(0)
    {
    }

    PString(const char* str)
    {
        init(str, str ? std::strlen(str) : 0);
    }

    PString(const char* str, size_t length)
    {
        init(str, str ? length : 0);
    }

    PString(const PString& other)
    {
        init(other.data_, other.size_);
    }

    PString(PString&& other) noexcept : data_(other.data_), size_(other.size_)
    {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    PString& operator=(const PString& other)
    {
        if (this != &other)
        {
            assign(other.data_, other.size_);
        }
        return *this;
    }

    PString& operator=(PString&& other) noexcept
    {
        if (this != &other)
        {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    PString& operator=(const char* str)
    {
        // str may point into this string
        PString tmp(str);
        return *this = static_cast<PString&&>(tmp);
    }

    ~PString()
    {
        delete[] data_;
    }

    void assign(const char* str, size_t length)
    {
        // str may point into this string
        PString tmp(str, length);
        *this = static_cast<PString&&>(tmp);
    }

    PString& append(const char* str, size_t length)
    {
        if (!str || length == 0)
        {
            return *this;
        }
        size_t new_size = size_ + length;
        char* new_data = new char[new_size + 1];
        if (size_)
        {
            std::memcpy(new_data, data_, size_);
        }
        std::memcpy(new_data + size_, str, length);
        new_data[new_size] = '\0';
        delete[] data_;
        data_ = new_data;
        size_ = new_size;
        return *this;
    }

    PString operator+(const PString& other) const
    {
        PString result(*this);
        result.append(other.data_, other.size_);
        return result;
    }

    friend PString operator+(const char* lhs, const PString& rhs)
    {
        PString result(lhs);
        result.append(rhs.data_, rhs.size_);
        return result;
    }

    PString& operator+=(const PString& other)
    {
        // a copy if other is this string
        return this == &other ? append(PString(other).data_, other.size_) : append(other.data_, other.size_);
    }

    PString& operator+=(const char* str)
    {
        return str ? append(str, std::strlen(str)) : *this;
    }

    PString& operator+=(char c)
    {
        return append(&c, 1);
    }

    const char* c_str() const
    {
        return data_ ? data_ : "";
    }

    const char* data() const
    {
        return c_str();
    }

    // writable, size() chars (nullptr if empty)
    char* data()
    {
        return data_;
    }

    size_t size() const
    {
        return size_;
    }

    size_t length() const
    {
        return size_;
    }

    bool empty() const
    {
        return size_ == 0;
    }

    void clear()
    {
        delete[] data_;
        data_ = nullptr;
        size_ = 0;
    }

    // truncates, or appends '\0'
    void resize(size_t new_size)
    {
        if (new_size == size_)
        {
            return;
        }
        if (new_size == 0)
        {
            clear();
            return;
        }
        char* new_data = new char[new_size + 1];
        size_t keep = size_ < new_size ? size_ : new_size;
        if (keep)
        {
            std::memcpy(new_data, data_, keep);
        }
        std::memset(new_data + keep, 0, new_size + 1 - keep);
        delete[] data_;
        data_ = new_data;
        size_ = new_size;
    }

    char operator[](size_t pos) const
    {
        return data_[pos];
    }

    char back() const
    {
        return data_[size_ - 1];
    }

    void pop_back()
    {
        resize(size_ - 1);
    }

    PString substr(size_t pos, size_t count = npos) const
    {
        if (pos >= size_)
        {
            return PString();
        }
        size_t rest = size_ - pos;
        return PString(data_ + pos, count < rest ? count : rest);
    }

    // the position of the last char which is one of chars, npos if not found
    size_t find_last_of(const char* chars) const
    {
        for (size_t i = size_; i > 0; --i)
        {
            if (std::strchr(chars, data_[i - 1]) && data_[i - 1] != '\0')
            {
                return i - 1;
            }
        }
        return npos;
    }

    bool operator<(const PString& other) const
    {
        size_t n = size_ < other.size_ ? size_ : other.size_;
        int ret = n ? std::memcmp(data_, other.data_, n) : 0;
        return ret < 0 || (ret == 0 && size_ < other.size_);
    }

    bool operator==(const PString& other) const
    {
        return size_ == other.size_ && (size_ == 0 || std::memcmp(data_, other.data_, size_) == 0);
    }

    bool operator!=(const PString& other) const
    {
        return !(*this == other);
    }

    bool operator==(const char* str) const
    {
        size_t len = str ? std::strlen(str) : 0;
        return size_ == len && (len == 0 || std::memcmp(data_, str, len) == 0);
    }

    bool operator!=(const char* str) const
    {
        return !(*this == str);
    }

private:
    void init(const char* str, size_t length)
    {
        size_ = length;
        if (length == 0)
        {
            data_ = nullptr;
            return;
        }
        data_ = new char[length + 1];
        std::memcpy(data_, str, length);
        data_[length] = '\0';
    }

    char* data_;
    size_t size_;
};
}    // namespace PUERTS_NAMESPACE

namespace std
{
template <>
struct hash<PUERTS_NAMESPACE::PString>
{
    size_t operator()(const PUERTS_NAMESPACE::PString& str) const
    {
        size_t hash = 5381;    // DJB2
        const char* data = str.c_str();
        for (size_t i = 0; i < str.size(); ++i)
        {
            hash = ((hash << 5) + hash) + data[i];    // hash * 33 + c
        }
        return hash;
    }
};
}    // namespace std
