/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#include "CoreMinimal.h"
#include "wasm3.h"
#include "m3_env.h"
#include "WasmBindingTemplate.hpp"
#include "WasmRuntime.h"
#include "Wasm3ExportDef.h"

class WASMCORE_API WasmFunction final
{
private:
    M3Function* _Function;

public:
    WasmFunction(M3Function* Func) : _Function(Func)
    {
    }
    FORCEINLINE M3Function* GetFunction() const
    {
        return _Function;
    }

private:
    template <typename Ret, typename... Args>
    struct CallHelper
    {
        //不支持返回值是引用
        static_assert(!std::is_reference<Ret>::value, "");

        template <typename X>
        struct Functor;

        template <int... Index>
        struct Functor<std::index_sequence<Index...>>
        {
            static bool InvokeNoReturn(WasmFunction* Outer, Args... args)
            {
                static_assert(wasm_is_all_support_type<Args...>::value, "");

                WasmRuntime* Runtime = Outer->GetRuntime();
                WasmStackAllocCacheInfo Backup = Runtime->GetCurrentStackAllocInfo();

                auto stack_params = std::make_tuple<typename wasm_call_params_translator<Args>::translated_type...>(
                    typename wasm_call_params_translator<Args>::translated_type()...);
                void* args_pointer[sizeof...(args)] = {Outer->InternalTranslatePointer<Args>(
                    &std::get<Index>(stack_params), (typename wasm_remove_const_ref<Args>::type*) &args)...};
                if (Outer->CallWithArgsNoReturn(sizeof...(args), (const void**) args_pointer))
                {
                    const WASM_PTR free_ptr_list[sizeof...(args)] = {
                        Outer->InternalCopyback<Args>(args_pointer[Index], (typename wasm_remove_const_ref<Args>::type*) &args)...};
                    Runtime->RestoreCurrentStackAllocInfo(Backup);
                    return true;
                }
                else
                {
                    Runtime->RestoreCurrentStackAllocInfo(Backup);
                    return false;
                }
            }

            //没有返回值
            template <typename T>
            static typename std::enable_if<std::is_same<T, void>::value, void>::type InnerInvoke(WasmFunction* Outer, Args... args)
            {
                InvokeNoReturn(Outer, std::forward<Args>(args)...);
            }

            // 返回值是复杂类型
            template <typename T>
            static typename std::enable_if<wasm_is_complex_type<T>::value, T>::type InnerInvoke(WasmFunction* Outer, Args... args)
            {
                static_assert(wasm_is_all_support_type<Args...>::value, "");
                WasmRuntime* Runtime = Outer->GetRuntime();
                WasmStackAllocCacheInfo Backup = Runtime->GetCurrentStackAllocInfo();

                //复杂类型,栈的第一个是类型地址
                WASM_PTR inner_ptr = Runtime->AllocStackParam(sizeof(T)).PtrInWasm;
                auto stack_params = std::make_tuple<typename wasm_call_params_translator<Args>::translated_type...>(
                    typename wasm_call_params_translator<Args>::translated_type()...);
                void* args_pointer[1 + sizeof...(args)] = {
                    (void*) &inner_ptr, Outer->InternalTranslatePointer<Args>(&std::get<Index>(stack_params),
                                            (typename wasm_remove_const_ref<Args>::type*) &args)...};

                if (Outer->CallWithArgsNoReturn(1 + sizeof...(args), (const void**) args_pointer))
                {
                    const WASM_PTR free_ptr_list[1 + sizeof...(args)] = {inner_ptr,
                        Outer->InternalCopyback<Args>(args_pointer[Index], (typename wasm_remove_const_ref<Args>::type*) &args)...};
                    Ret* ret_ptr = (Ret*) Runtime->GetPlatformAddress(inner_ptr);
                    Ret r = *ret_ptr;
                    Runtime->RestoreCurrentStackAllocInfo(Backup);
                    return r;
                }
                else
                {
                    Runtime->RestoreCurrentStackAllocInfo(Backup);
                    return T();
                }
            }
            //返回值是简单类型
            template <typename T>
            static typename std::enable_if<wasm_is_simple_type<T>::value, T>::type InnerInvoke(WasmFunction* Outer, Args... args)
            {
                static_assert(wasm_is_all_support_type<Args...>::value, "");

                WasmRuntime* Runtime = Outer->GetRuntime();
                WasmStackAllocCacheInfo Backup = Runtime->GetCurrentStackAllocInfo();

                auto stack_params = std::make_tuple<typename wasm_call_params_translator<Args>::translated_type...>(
                    typename wasm_call_params_translator<Args>::translated_type()...);
                void* args_pointer[sizeof...(args)] = {Outer->InternalTranslatePointer<Args>(
                    &std::get<Index>(stack_params), (typename wasm_remove_const_ref<Args>::type*) &args)...};
                if (Outer->CallWithArgsNoReturn(sizeof...(args), (const void**) args_pointer))
                {
                    const WASM_PTR free_ptr_list[sizeof...(args)] = {
                        Outer->InternalCopyback<Args>(args_pointer[Index], (typename wasm_remove_const_ref<Args>::type*) &args)...};
                    T r = Outer->GetReturnValue<T>();
                    Runtime->RestoreCurrentStackAllocInfo(Backup);
                    return r;
                }
                else
                {
                    Runtime->RestoreCurrentStackAllocInfo(Backup);
                    return T();
                }
            }
            // 返回值是指针,等价于先返回一个wasm_ptr,再解析这个wasm_ptr
            template <typename T>
            static typename std::enable_if<wasm_is_support_pointer_type<T>::value, T>::type InnerInvoke(
                WasmFunction* Outer, Args... args)
            {
                using ptr_type_in_wasm = typename wasm_pointer_support_ptr_in_wasm<T>::type;
                WASM_PTR ptr = InnerInvoke<WASM_PTR>(Outer, std::forward<Args>(args)...);
                ptr_type_in_wasm* realPtr = (ptr_type_in_wasm*) Outer->GetRuntime()->GetPlatformAddress(ptr);
                return static_cast<T>(*realPtr);
            }

            static Ret Invoke(WasmFunction* Outer, Args... args)
            {
                return InnerInvoke<Ret>(Outer, std::forward<Args>(args)...);
            }
        };
    };

public:
    //内部接口,谨慎调用
    bool CallWithArgsNoReturn(int arg_count, const void** args) const
    {
        check(_Function);
        if (!Export_m3_Call(_Function, arg_count, args))
        {
            UE_LOG(LogTemp, Error, TEXT("Error In Call Simple Function %s"), ANSI_TO_TCHAR(_Function->export_name));
            return false;
        }
        return true;
    }
    //简单类型返回值
    template <typename Ret>
    typename std::enable_if<wasm_is_simple_type<Ret>::value, Ret>::type GetReturnValue() const
    {
        //不支持返回值是引用
        static_assert(!std::is_reference<Ret>::value, "");
        Ret r;
        void* ret_ptrs[] = {&r};
        if (!Export_m3_GetResults(_Function, 1, (const void**) ret_ptrs))
        {
            UE_LOG(LogTemp, Error, TEXT("Error In GetReturnValue %s"), ANSI_TO_TCHAR(_Function->export_name));
        }
        return r;
    }
    //并不支持复杂类型返回值使用这个接口,直接使用Call,因为复杂类型的返回值传参不太一样,这里只考虑指针和简单类型
    template <typename Ret>
    typename std::enable_if<wasm_is_support_pointer_type<Ret>::value, Ret>::type GetReturnValue() const
    {
        //不支持返回值是引用
        static_assert(!std::is_reference<Ret>::value, "");
        using ptr_type_in_wasm = typename wasm_pointer_support_ptr_in_wasm<Ret>::type;
        WASM_PTR r;
        void* ret_ptrs[] = {&r};
        if (!Export_m3_GetResults(_Function, 1, (const void**) ret_ptrs))
        {
            UE_LOG(LogTemp, Error, TEXT("Error In GetReturnValue %s"), ANSI_TO_TCHAR(_Function->export_name));
        }
        ptr_type_in_wasm* ptr = (ptr_type_in_wasm*) GetRuntime()->GetPlatformAddress(r);
        return static_cast<Ret>(*ptr);
    }

    template <typename... Args>
    bool CallNoReturn(Args... args)
    {
        // todo 看看是否需要把栈补一下,要不然可能会不平衡?
        return CallHelper<void, Args...>::template Functor<std::make_index_sequence<sizeof...(Args)>>::InvokeNoReturn(
            this, std::forward<Args>(args)...);
    }

    bool CallNoReturn()
    {
        return CallWithArgsNoReturn(0, nullptr);
    }

    template <typename Ret, typename... Args>
    Ret Call(Args... args)
    {
        return CallHelper<Ret, Args...>::template Functor<std::make_index_sequence<sizeof...(Args)>>::Invoke(
            this, std::forward<Args>(args)...);
    }

    //简单类型或者指针类型
    template <typename Ret>
    typename std::enable_if<wasm_is_simple_type<Ret>::value || wasm_is_support_pointer_type<Ret>::value, Ret>::type Call()
    {
        //不支持返回值是引用
        static_assert(!std::is_reference<Ret>::value, "");
        if (CallWithArgsNoReturn(0, nullptr))
        {
            return GetReturnValue<Ret>();
        }
        return Ret();
    }
    //复杂类型
    template <typename Ret>
    typename std::enable_if<wasm_is_complex_type<Ret>::value, Ret>::type Call()
    {
        //不支持返回值是引用
        static_assert(!std::is_reference<Ret>::value, "");
        WasmRuntime* Runtime = GetRuntime();
        WasmStackAllocCacheInfo Backup = Runtime->GetCurrentStackAllocInfo();

        WASM_PTR inner_ptr = Runtime->AllocStackParam(sizeof(Ret)).PtrInWasm;
        void* args_pointer[] = {
            &inner_ptr,
        };
        if (CallWithArgsNoReturn(1, (const void**) args_pointer))
        {
            Ret* ptr = (Ret*) Runtime->GetPlatformAddress(inner_ptr);
            Ret r = *ptr;
            Runtime->RestoreCurrentStackAllocInfo(Backup);
            return r;
        }
        else
        {
            Runtime->RestoreCurrentStackAllocInfo(Backup);
        }
        return Ret();
    }

private:
    // 简单类型,非引用
    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_simple_type<T>::value && !std::is_reference<T>::value, void*>::type InternalTranslatePointer(
        T_Translatedtype* stack_pointer, RT* src_pointer)
    {
        //非引用的,直接使用原来的地址就好了,因为本来就是传值的语义
        return (void*) src_pointer;
    }
    // 简单类型的引用
    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_simple_type<T>::value && std::is_reference<T>::value, void*>::type InternalTranslatePointer(
        T_Translatedtype* stack_pointer, RT* src_pointer)
    {
        //引用被wasm当作指针来传递
        WasmRuntime* Runtime = GetRuntime();
        WasmStackAllocCacheInfo NewMalloc = Runtime->AllocStackParam(sizeof(T));
        FMemory::Memcpy(NewMalloc.RealPtr, src_pointer, sizeof(T));
        *((WASM_PTR*) stack_pointer) = NewMalloc.PtrInWasm;
        return stack_pointer;
    }
    // 复杂类型
    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_complex_type<T>::value, void*>::type InternalTranslatePointer(
        void* stack_pointer, RT* src_pointer)
    {
        static_assert(std::is_same<T_Translatedtype, WASM_PTR>::value, "");
        WasmRuntime* Runtime = GetRuntime();
        WasmStackAllocCacheInfo NewMalloc = Runtime->AllocStackParam(sizeof(T));
        FMemory::Memcpy(NewMalloc.RealPtr, src_pointer, sizeof(T));
        *((WASM_PTR*) stack_pointer) = NewMalloc.PtrInWasm;
        return stack_pointer;
    }
    //指针
    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_support_pointer_type<T>::value, void*>::type InternalTranslatePointer(
        void* stack_pointer, RT* src_pointer)
    {
        WasmRuntime* Runtime = GetRuntime();
        WasmStackAllocCacheInfo NewMalloc = Runtime->AllocStackParam(sizeof(void*));
        T_Translatedtype value = static_cast<T_Translatedtype>(*src_pointer);
        *((T_Translatedtype*) (NewMalloc.RealPtr)) = value;
        *((WASM_PTR*) stack_pointer) = NewMalloc.PtrInWasm;
        return stack_pointer;
    }

    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_support_pointer_type<T>::value, WASM_PTR>::type InternalCopyback(
        void* stack_pointer, RT* src_pointer)
    {
        // 指针也啥都不用干
        return 0;
    }

    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_simple_type<T>::value && !std::is_reference<T>::value, WASM_PTR>::type InternalCopyback(
        void* stack_pointer, RT* src_pointer)
    {
        // 非引用的简单类型,啥都不用干
        return 0;
    }

    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_simple_type<T>::value && std::is_reference<T>::value, WASM_PTR>::type InternalCopyback(
        void* stack_pointer, RT* src_pointer)
    {
        // 引用的简单类型,还要把值拷贝回去
        WASM_PTR ptr = *((WASM_PTR*) stack_pointer);
        WasmRuntime* Runtime = GetRuntime();
        if (std::is_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value)
        {
            void* real_ptr = Runtime->GetPlatformAddress(ptr);
            FMemory::Memcpy((void*) src_pointer, real_ptr, sizeof(T));
        }
        return ptr;
    }

    template <typename T, typename T_Translatedtype = typename wasm_call_params_translator<T>::translated_type,
        typename RT = typename wasm_remove_const_ref<T>::type>
    typename std::enable_if<wasm_is_complex_type<T>::value, WASM_PTR>::type InternalCopyback(void* stack_pointer, RT* src_pointer)
    {
        static_assert(std::is_same<T_Translatedtype, WASM_PTR>::value, "");
        WASM_PTR ptr = *((WASM_PTR*) stack_pointer);
        WasmRuntime* Runtime = GetRuntime();
        if (std::is_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value)
        {
            void* real_ptr = Runtime->GetPlatformAddress(ptr);
            FMemory::Memcpy((void*) src_pointer, real_ptr, sizeof(T));
        }
        return ptr;
    }

    FORCEINLINE WasmRuntime* GetRuntime() const
    {
        return (WasmRuntime*) _Function->module->runtime->userdata;
    }
};