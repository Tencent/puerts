/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

(function () {
    "use strict";

    let events = Object.create(null);
    let eventsCount = 0;
    
    function checkListener(listener) {
        if (typeof listener !== 'function') {
            throw new Error('listener expect a function');
        }
    }
    
    function on(type, listener, prepend) {
        checkListener(listener);
        
        let existing = events[type];
        if (existing === undefined) {
            events[type] = listener;
            ++eventsCount;
        } else {
            if (typeof existing === 'function') {
                events[type] = prepend ? [listener, existing] : [existing, listener];
            } else if (prepend) {
                existing.unshift(listener);
            } else {
                existing.push(listener);
            }
        }
    }
    
    function off(type, listener) {
        checkListener(listener);
        
        const list = events[type];
        if (list === undefined)
            return;
        if (list === listener) {
            if (--eventsCount === 0)
                events = Object.create(null);
            else {
                events[type] = undefined;
            }
        } else if (typeof list !== 'function') {
            for (var i = list.length - 1; i >= 0; i--) {
                if (list[i] === listener) { //found
                    if (i === 0)
                      list.shift();
                    else {
                      spliceOne(list, i);
                    }
                    
                    if (list.length === 1)
                        events[type] = list[0];
                    break;
                }
            }
        }
    }
    
    function emit(type, ...args) {
        const listener = events[type];

        if (listener === undefined)
            return false;

        if (typeof listener === 'function') {
            Reflect.apply(listener, this, args);
        } else {
            const len = listener.length;
            const listeners = arrayClone(listener, len);
            for (var i = 0; i < len; ++i)
                Reflect.apply(listeners[i], this, args);
        }

        return true;
    }
    
    function arrayClone(arr, n) {
        const copy = new Array(n);
        for (var i = 0; i < n; ++i)
            copy[i] = arr[i];
        return copy;
    }
    
    function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
            list[index] = list[index + 1];
        list.pop();
    }
    
    puerts.on = on;
    puerts.off = off;
    puerts.emit = emit;
}());