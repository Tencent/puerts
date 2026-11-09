/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JSGeneratedFunction.h"
#include "Runtime/Launch/Resources/Version.h"

void UJSGeneratedFunction::SkipFunction(FFrame& Stack, RESULT_DECL, UFunction* Function)
{
    uint8* Frame = (uint8*) FMemory_Alloca(Function->PropertiesSize);
    FMemory::Memzero(Frame, Function->PropertiesSize);
    for (PropertyMacro* Property = (PropertyMacro*) (
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
             Function->ChildProperties
#else
             Function->Children
#endif
         );
         Property && (*Stack.Code != EX_EndFunctionParms); Property = (PropertyMacro*) (Property->Next))
    {
        Stack.MostRecentPropertyAddress = NULL;
        Stack.Step(Stack.Object, (Property->PropertyFlags & CPF_OutParm) ? NULL : Property->ContainerPtrToValuePtr<uint8>(Frame));
    }

    Stack.Code++;

    for (PropertyMacro* Destruct = Function->DestructorLink; Destruct; Destruct = Destruct->DestructorLinkNext)
    {
        if (!Destruct->HasAnyPropertyFlags(CPF_OutParm))
        {
            Destruct->DestroyValue_InContainer(Frame);
        }
    }

    PropertyMacro* ReturnProp = Function->GetReturnProperty();
    if (ReturnProp != NULL)
    {
        ReturnProp->DestroyValue(RESULT_PARAM);
#if ENGINE_MINOR_VERSION >= 5 && ENGINE_MAJOR_VERSION >= 5
        FMemory::Memzero(RESULT_PARAM, ReturnProp->ArrayDim * ReturnProp->GetElementSize());
#else
        FMemory::Memzero(RESULT_PARAM, ReturnProp->ArrayDim * ReturnProp->ElementSize);
#endif
    }
}

DEFINE_FUNCTION(UJSGeneratedFunction::execCallMixin)
{
#if !defined(ENGINE_INDEPENDENT_JSENV)
    UFunction* Func = Stack.CurrentNativeFunction ? Stack.CurrentNativeFunction : Stack.Node;
    UJSGeneratedFunction* JsFunc = Cast<UJSGeneratedFunction>(Func);
    if (!JsFunc)
    {
        JsFunc = GetJSGeneratedFunctionFromScript(Func);
    }
    check(JsFunc);
    // UE_LOG(LogTemp, Warning, TEXT("overrided function called, %s(%p)"), *Func->GetName(), Func);

    if (JsFunc)
    {
        auto PinedDynamicInvoker = JsFunc->DynamicInvoker.Pin();
        if (PinedDynamicInvoker)
        {
            PinedDynamicInvoker->InvokeMixinMethod(Context, JsFunc, Stack, RESULT_PARAM);
        }
    }
#endif
}
