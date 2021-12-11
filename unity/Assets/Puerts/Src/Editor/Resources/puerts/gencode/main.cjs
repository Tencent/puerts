/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

const dot = require("doT");
const puerts = require("puerts");

dot.templateSettings.strip = false;

const root = "puerts/templates/";

let compiledTemplateCache = Object.create(null);

function getCompiledTemplate(name) {
    if (!(name in compiledTemplateCache)) {
        let {context} = puerts.loadFile(root + name);
        compiledTemplateCache[name] = (function() {
            const runDot = dot.template(context);
            return function() {
                return runDot.apply(this, arguments).replace(/\n(\s)*\n/g, '\n')
            }  
        })();
    }
    return compiledTemplateCache[name];
}

module.exports = getCompiledTemplate;