/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if USE_WASM3
#include <array>
#include <tuple>
#include "WasmRuntime.h"
#include "WasmModule.h"
#include "WasmFunction.h"
#include "WasmStaticLink.h"
#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"
#include "Kismet/KismetMathLibrary.h"

float atan2_ue_bind(float X, float Y)
{
    return UKismetMathLibrary::Atan2(X, Y);
}

WASM_BEGIN_LINK_GLOBAL(TestMath, 0)
WASM_LINK_GLOBAL(atan2_ue_bind)
WASM_END_LINK_GLOBAL(TestMath, 0)

#endif