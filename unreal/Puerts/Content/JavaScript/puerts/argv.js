/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

(function () {
    "use strict";
    
    let argList = [];
    let argMap = {};
    
    puerts.argv = {
        getByIndex : function(index) {
            return argList[index]
        },
        
        getByName : function(name) {
            return argMap[name];
        },
        
        add : function(name, value) {
            argList.push(value);
            argMap[name] = value;
        }
    }
}());