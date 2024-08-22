/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || globalThis || (function () { return this; }());

const WebSocketPP = global.WebSocketPP;
//global.WebSocketPP = undefined;

class EventTarget {
  constructor() {
    this.listeners = {};
  }

  addEventListener(type, callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  removeEventListener(type, callback) {
    if (!(type in this.listeners)) {
      return;
    }
    const stack = this.listeners[type];
    for (let i = 0; i < stack.length; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1);
        return;
      }
    }
  }

  dispatchEvent(ev) {
    if (!(ev.type in this.listeners)) {
      return true;
    }
    const stack = this.listeners[ev.type].slice();

    for (let i = 0; i < stack.length; i++) {
      stack[i].call(this, ev);
    }
    return !ev.defaultPrevented;
  }
}

const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

const poll_ws_objects = [];

class WebSocket extends EventTarget {
    constructor(url, protocols) {
        super();
        if (protocols) throw new Error('do not support protocols argument');
        this._raw = new WebSocketPP(url);
        this._url = url;
        // !!do not raise exception in handles.
        this._raw.setHandles(
        ()=> {
            this._readyState = WebSocket.OPEN;
            this._addPendingEvent({type:'open'});
        }, 
        (data) => {
            this._addPendingEvent({type:'message', data:data, origin:this._url});
        }, 
        (code, reason) => {
            this._cleanup();
            this._addPendingEvent({type:'close', code:code, reason: reason});
        }, 
        () => {
            this._addPendingEvent({type:'error'});
            this._cleanup();
            this._addPendingEvent({type:'close', code:1006, reason: ""});
        });
        
        this._readyState = WebSocket.CONNECTING;
        this._tid = setInterval(() => this._poll(), 1);
        this._pendingEvents = [];
    }
    
    get url() {
        return this._url;
    }
    
    get readyState() {
        return this._readyState;
    }
    
    send(data) {
        if (this._readyState !== WebSocket.OPEN) {
          throw new Error(`WebSocket is not open: readyState ${this._readyState} (${readyStates[this._readyState]})`);
        }
        this._raw.send(data);
    }
    
    _cleanup() {
        this._readyState = WebSocket.CLOSING;
    }
    
    _addPendingEvent(ev) {
        this._pendingEvents.push(ev);
    }
    
    _poll() {
        if (this._pendingEvents.length === 0 && this._readyState != WebSocket.CLOSING) {
            this._raw.poll();
        } 
        const ev = this._pendingEvents.shift();
        if (ev) this.dispatchEvent(ev);
        if (this._pendingEvents.length === 0 && this._readyState == WebSocket.CLOSING) {
            this._raw = undefined;
            clearInterval(this._tid);
            this._readyState = WebSocket.CLOSED;
        }
    }
    
    close(code, data) {
        try {
            this._raw.close(code, data);
        } catch(e) {}
        this._cleanup();
    }
    
}

for (let i = 0; i < readyStates.length; i++) {
    Object.defineProperty(WebSocket, readyStates[i], {
        enumerable: true,
        value: i
    });
    
    Object.defineProperty(WebSocket.prototype, readyStates[i], {
        enumerable: true,
        value: i
    });
}

global.WebSocket = WebSocket;

