/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

let base64binary = require("thirdparty/base64-binary.js");

exports.loadBinarySync = function(name) {
    let ret = puerts.sendRequestSync('loadBinary', name);
    return base64binary.decode(ret);
}

