/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <cstring>
#include <functional>

namespace PUERTS_NAMESPACE
{
class String
{
public:
    // Constructors
    String() : data_(nullptr), size_(0)
    {
        data_ = new char[1];
        data_[0] = '\0';
    }

    String(const char* str)
    {
        if (str)
        {
            size_ = std::strlen(str);
            data_ = new char[size_ + 1];
#ifdef _MSC_VER
            strncpy_s(data_, size_ + 1, str, size_);
#else
            strncpy(data_, str, size_);
#endif
            data_[size_] = '\0';
        }
        else
        {
            size_ = 0;
            data_ = new char[1];
            data_[0] = '\0';
        }
    }

    String(const char* str, size_t length)
    {
        if (str)
        {
            size_ = length;
            data_ = new char[size_ + 1];
#ifdef _MSC_VER
            strncpy_s(data_, size_ + 1, str, length);
#else
            strncpy(data_, str, length);
#endif
            data_[size_] = '\0';
        }
        else
        {
            size_ = 0;
            data_ = new char[1];
            data_[0] = '\0';
        }
    }

    String(const String& other)
    {
        size_ = other.size_;
        data_ = new char[size_ + 1];
#ifdef _MSC_VER
        strncpy_s(data_, size_ + 1, other.data_, size_);
#else
        strncpy(data_, other.data_, size_);
#endif
        data_[size_] = '\0';
    }

    String& operator=(const String& other)
    {
        if (this != &other)
        {
            delete[] data_;
            size_ = other.size_;
            data_ = new char[size_ + 1];
#ifdef _MSC_VER
            strncpy_s(data_, size_ + 1, other.data_, size_);
#else
            strncpy(data_, other.data_, size_);
#endif
            data_[size_] = '\0';
        }
        return *this;
    }

    ~String()
    {
        delete[] data_;
    }

    String operator+(const String& other) const
    {
        String result;
        result.size_ = size_ + other.size_;
        result.data_ = new char[result.size_ + 1];
#ifdef _MSC_VER
        strncpy_s(result.data_, result.size_ + 1, data_, size_);
        strncpy_s(result.data_ + size_, result.size_ - size_ + 1, other.data_, other.size_);
#else
        strncpy(result.data_, data_, size_);
        strncpy(result.data_ + size_, other.data_, other.size_);
#endif
        result.data_[result.size_] = '\0';
        return result;
    }

    friend String operator+(const char* lhs, const String& rhs)
    {
        String result;
        size_t lhs_size = std::strlen(lhs);
        result.size_ = lhs_size + rhs.size_;
        result.data_ = new char[result.size_ + 1];
#ifdef _MSC_VER
        strncpy_s(result.data_, result.size_ + 1, lhs, lhs_size);
        strncpy_s(result.data_ + lhs_size, result.size_ - lhs_size + 1, rhs.data_, rhs.size_);
#else
        strncpy(result.data_, lhs, lhs_size);
        strncpy(result.data_ + lhs_size, rhs.data_, rhs.size_);
#endif
        result.data_[result.size_] = '\0';
        return result;
    }

    String& operator+=(const String& other)
    {
        size_t new_size = size_ + other.size_;
        char* new_data = new char[new_size + 1];
#ifdef _MSC_VER
        strncpy_s(new_data, new_size + 1, data_, size_);
        strncpy_s(new_data + size_, new_size - size_ + 1, other.data_, other.size_);
#else
        strncpy(new_data, data_, size_);
        strncpy(new_data + size_, other.data_, other.size_);
#endif
        new_data[new_size] = '\0';

        delete[] data_;
        data_ = new_data;
        size_ = new_size;

        return *this;
    }

    String& operator+=(const char* str)
    {
        if (str)
        {
            size_t str_size = std::strlen(str);
            size_t new_size = size_ + str_size;
            char* new_data = new char[new_size + 1];
#ifdef _MSC_VER
            strncpy_s(new_data, new_size + 1, data_, size_);
            strncpy_s(new_data + size_, new_size - size_ + 1, str, str_size);
#else
            strncpy(new_data, data_, size_);
            strncpy(new_data + size_, str, str_size);
#endif
            new_data[new_size] = '\0';

            delete[] data_;
            data_ = new_data;
            size_ = new_size;
        }
        return *this;
    }

    const char* c_str() const
    {
        return data_;
    }

    size_t size() const
    {
        return size_;
    }

    bool empty() const
    {
        return size_ == 0;
    }

    bool operator<(const String& other) const
    {
        return std::strcmp(data_, other.data_) < 0;
    }

    bool operator==(const String& other) const
    {
        return std::strcmp(data_, other.data_) == 0;
    }

private:
    char* data_;
    size_t size_;
};
}    // namespace PUERTS_NAMESPACE

namespace std
{
template <>
struct hash<puerts::String>
{
    size_t operator()(const puerts::String& str) const
    {
        size_t hash = 5381;    // DJB2 哈希算法的初始值
        for (size_t i = 0; i < str.size(); ++i)
        {
            hash = ((hash << 5) + hash) + str.c_str()[i];    // hash * 33 + c
        }
        return hash;
    }
};
}    // namespace std
