/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PLATFORM_IOS

#import <Foundation/Foundation.h>
#include <pesapi.h>
#include <dlfcn.h>

// addons are statically linked on iOS, the entry is a C function named pesapi_register_<module_name>_v<PESAPI_VERSION>
int PesapiLoadFramework(const char* frameworkName, const char* entryName, struct pesapi_registry_api* registryApi, pesapi_registry registry)
{
    NSLog(@"load addon name:%s  entry:%s", frameworkName, entryName);
    typedef void (*EntryFuncType)(struct pesapi_registry_api*, pesapi_registry);
    EntryFuncType entryFunc = (EntryFuncType) dlsym(RTLD_DEFAULT, entryName);
    if (entryFunc)
    {
        entryFunc(registryApi, registry);
        return 0;
    }
    NSLog(@"load addon %s fail: can not found entry:%s", frameworkName, entryName);
    return -1;
}

#endif
