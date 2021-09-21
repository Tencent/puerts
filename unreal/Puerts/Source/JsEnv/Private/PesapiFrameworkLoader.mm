/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PLATFORM_IOS

#import <Foundation/Foundation.h>
#include <pesapi.h>
#include <string>

@interface PesapiFrameworkLoader : NSObject

@end

@implementation PesapiFrameworkLoader

+ (int)load:(NSString*) frameworkName entryClassName:(NSString*)entryClassName funcPtrArray:(pesapi_func_ptr*)funcPtrArray {
    NSLog(@"load addon name:%@  entry class:%@", frameworkName, entryClassName);

    //for + function
    Class entryClass = NSClassFromString(entryClassName);
    if (entryClass) {
        SEL selector = NSSelectorFromString(@"initlib:");

        //for + function
        IMP impl = [entryClass methodForSelector:selector];
        if (impl) {
             //@try {
                 void* (*entryFunc)(Class, SEL, pesapi_func_ptr*) = (void*(*)(Class,SEL,pesapi_func_ptr*))impl;
                 entryFunc(entryClass, selector, funcPtrArray);
                 return 0;
             //}
             //@catch (NSException * e) {
             //   NSLog(@"PesapiFrameworkLoader loadFramework exception: %@", e);
             //}
             //@finally {
             //   NSLog(@"PesapiFrameworkLoader loadFramework finally");
             //}
        } else {
            NSLog(@"load addon %@ fail: can not found selector initlib:", frameworkName);
        }
    } else {
        NSLog(@"load addon %@ fail: can not found class:%@", frameworkName, entryClassName);
    }
    return -1;
}

@end

int PesapiLoadFramework(std::string frameworkName, std::string entryClassName, pesapi_func_ptr* funcPtrArray)
{
    NSString* p1 = [NSString stringWithUTF8String:frameworkName.c_str()];
    NSString* p2 = [NSString stringWithUTF8String:entryClassName.c_str()];
    return [PesapiFrameworkLoader load:p1 entryClassName:p2 funcPtrArray:funcPtrArray];
}

#endif
