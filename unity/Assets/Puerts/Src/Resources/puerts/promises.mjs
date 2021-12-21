/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

var global = global || globalThis || (function () { return this; }());

const kPromiseRejectWithNoHandler = 0;
const kPromiseHandlerAddedAfterReject = 1;
const kPromiseRejectAfterResolved = 2;
const kPromiseResolveAfterResolved = 3;

global.__tgjsSetPromiseRejectCallback(promiseRejectHandler)
delete global.__tgjsSetPromiseRejectCallback;

const maybeUnhandledRejection = new WeakMap();

function promiseRejectHandler(type, promise, reason) {
    switch (type) {
        case kPromiseRejectWithNoHandler:
            maybeUnhandledRejection.set(promise, {
                reason,
            }); //maybe unhandledRejection
            Promise.resolve().then(_ => unhandledRejection(promise, reason));
            break;
        case kPromiseHandlerAddedAfterReject:
            handlerAddedAfterReject(promise);
            break;
        case kPromiseResolveAfterResolved:
            console.error('kPromiseResolveAfterResolved', promise, reason);
            break;
        case kPromiseRejectAfterResolved:
            console.error('kPromiseRejectAfterResolved', promise, reason);
            break;
    }
}

function unhandledRejection(promise, reason) {
    const promiseInfo = maybeUnhandledRejection.get(promise);
    if (promiseInfo === undefined) {
        return;
    }
    if (!puerts.emit('unhandledRejection', promiseInfo.reason, promise)) {
        unhandledRejectionWarning(reason);
    }
}

function unhandledRejectionWarning(reason) {
    try {
        if (reason instanceof Error) {
            console.warn('unhandledRejection', reason, reason.stack);
        } else {
            console.warn('unhandledRejection', reason);
        }
    } catch {}
}

function handlerAddedAfterReject(promise) {
    const promiseInfo = maybeUnhandledRejection.get(promise);
    if (promiseInfo !== undefined) { // cancel
        maybeUnhandledRejection.delete(promise);
    }
}