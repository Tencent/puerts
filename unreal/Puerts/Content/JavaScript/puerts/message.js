/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    let puerts = global.puerts = global.puerts || {};
    let sendMessage = global.prompt;
    puerts.sendRawMessage = function(msg) {
        return sendMessage(msg);
    }

    //TODO:支持多参数，多参数自动用#连接
    puerts.sendRequestSync = function(cmd, ...args) {
        var req = cmd + "#" + args.join('#');
        let ret = sendMessage(req); //oneway ret === "", normal reply === "#msg", error === "info"
        if (ret) {
            var err;
            var rpy;
            if (!ret.startsWith('#')) {
                err = new Error(ret);
            } else {
                rpy = ret.substring(1);
            }
            if (err) throw err;
            return rpy;
        }
    }

    let requestHandlers = Object.create(null);

    puerts.registerRequestHandler = function(cmd, callback) {
        requestHandlers[cmd] = callback;
    }

    function sendReply(replyId, reply, err) {
        let errMsg = err ? (typeof err == 'string' ? err : err.message) : ''
        if (replyId) {
            puerts.sendRequestSync('onReply', replyId + '#' + (errMsg ? errMsg : ('#' + reply)));
        }
    }

    function handleMessage(cmd, data, replyId) {
        let handler = requestHandlers[cmd];
        if (!handler) {
            return sendReply(replyId, null, "can not find handler for " + cmd);
        }

        if (replyId) {
            handler(data, (err, reply) => sendReply(replyId, reply, err));
        } else {
            handler(data);
        }
    }

    var lastPollTime = new Date();

    setInterval(() => {
        let now = new Date();
        //puerts.console.log('interval:' + (now - lastPollTime));
        lastPollTime = now;
        let msg = puerts.sendRequestSync('pollRequest');
        let cmd, replyId
	    if (msg) {
            try {
                //puerts.console.log('msg:' + msg);
                let firstSplit = msg.indexOf('#');
                let secondSplit = msg.indexOf('#', firstSplit + 1);
                replyId = msg.substring(0, firstSplit);
                cmd = msg.substring(firstSplit + 1, secondSplit);
                let data = msg.substring(secondSplit + 1);
                //puerts.console.warn(replyId);
                //puerts.console.log(cmd);
                //puerts.console.log(data);
                handleMessage(cmd, data, replyId);
            } catch(e) {
                if (replyId) {
                    sendReply(replyId, null, e.stack);
                } else {
                    puerts.console.error("handle " + (cmd || "unknow")  + " fail, info = " + e.stack);
                }
            }
        }
    }, 1);

}(global));
