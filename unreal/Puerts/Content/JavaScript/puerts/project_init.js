/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/


var global = global || (function () { return this; }());
(function (global) {
    "use strict";

    function pakAbsolutePathToRelativePath(path) {
        if(path.startsWith("Pak:")){
            // 在 Pak 中，需要处理路径
            path = path.replace(/\\/g, "/");
            return path.replace(/.*.pak/, "../../..");
        }
        return path;
    }
    
    // source map 支持参考： 
    // https://github.com/Tencent/puerts/blob/master/doc/unity/faq.md#source-map-support%E6%94%AF%E6%8C%81
    puerts.registerBuildinModule("path", {
        dirname(path) {
            return dirnameEx(path);
        },
        resolve(dir, url) {
            url = url.replace(/\\/g, "/");
            while (url.startsWith("../")) {
                dir = dirnameEx(dir);
                url = url.substr(3);
            }

            let combinedPath = combineEx(dir, url);
            return pakAbsolutePathToRelativePath(combinedPath);
        },
    });

    puerts.registerBuildinModule("fs", {
        existsSync(path) {
            path = pakAbsolutePathToRelativePath(path);
            return fileExistsEx(path);
        },

        readFileSync(path) {
            path = pakAbsolutePathToRelativePath(path);
            return readFileEx(path);
        },
    });

    (function () {
        let global = this ? this : globalThis;
        // global["Buffer"] = global["Buffer"] ?? {};
        //使用inline-source-map模式, 需要额外安装buffer模块
        global["Buffer"] = global["Buffer"] ? global["Buffer"] : puerts.__require("buffer").Buffer;
    })();

    puerts.__require('source-map-support').install();

}(global));
