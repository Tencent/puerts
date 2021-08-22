"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remoteUtil_1 = require("../../util/remoteUtil");
const command_1 = require("../command");
class WindowTab {
    constructor() {
        this.connecting = false;
        this.waiting = false;
        this.saved = false;
        this.stateIcon = ""; //tab-pane图标
        this.id = "";
        this.name = "New Debugger";
        this.hostname = "127.0.0.1";
        this.port = 80;
        this.reconnect = true; //自动重连 
        this.reconnectTime = 1000;
        //连接后检查全部脚本
        this.checkOnStartup = true;
        this.trace = true;
        //监听目录
        this.watchPath = "";
        //匹配的文件后缀名
        this.fileTypes = [".js", ".js.txt", ".jsx", ".cjs", ".json"];
        this.customScript = "";
        this.id = new Date().valueOf().toString();
        this._refreshState();
    }
    setConnectState(connected) {
        this.connecting = connected;
        this._refreshState();
        this._startReTimer();
    }
    setConfig(options) {
        let keys = ["id", "hostname", "port", "watchPath", "name", "reconnect", "reconnectTime", "checkOnStartup", "trace", "customScript"];
        for (let key of keys) {
            let val = options[key];
            if (val !== undefined) {
                this[key] = val;
            }
        }
        if (options.files)
            this.fileTypes = options.files;
    }
    _startReTimer() {
        if (this._reconnectId)
            return;
        const INTERVAL_TIME = 20;
        let tick = 0;
        this._reconnectId = setInterval(() => {
            if (this.connecting || !this.reconnect || !this.reconnectTime || this.reconnectTime < 100) {
                tick = 0;
                return;
            }
            tick -= INTERVAL_TIME;
            if (tick <= 0) {
                tick = this.reconnectTime;
                this.handleConnect(true, true);
            }
        }, INTERVAL_TIME);
    }
    _stopReTimer() {
        if (this._reconnectId)
            clearInterval(this._reconnectId);
        this._reconnectId = undefined;
    }
    _refreshState() {
        this.stateIcon = this.waiting ? "el-icon-loading" : this.connecting ? "el-icon-success" : "el-icon-error";
    }
    _createData() {
        return {
            id: this.id,
            hostname: this.hostname,
            port: this.port,
            watchPath: this.watchPath,
            files: this.fileTypes,
            name: this.name,
            reconnect: this.reconnect,
            reconnectTime: this.reconnectTime,
            checkOnStartup: this.checkOnStartup,
            trace: this.trace,
            customScript: this.customScript
        };
    }
    handleConnect(connect, ignoreError) {
        this.connecting = true;
        this.waiting = true;
        this._refreshState();
        if (connect) {
            remoteUtil_1.RendererRemote.openDebugger(this._createData(), (_, err) => {
                this.connecting = !err;
                this.waiting = false;
                if (err && !ignoreError) {
                    command_1.command.message("error", err);
                }
                this._refreshState();
            });
            this._startReTimer();
        }
        else {
            remoteUtil_1.RendererRemote.closeDebugger({ id: this.id }, () => {
                this.connecting = false;
                this.waiting = false;
                this._refreshState();
            });
            this._stopReTimer();
        }
    }
    handleOpenDirectory() {
        remoteUtil_1.RendererRemote.openDirectory(this.watchPath, (_, path) => {
            if (path)
                this.watchPath = path;
        });
    }
    handleReconnect(stat) {
        if (stat)
            this._startReTimer();
        else
            this._stopReTimer();
    }
    handleMenu(action) {
        switch (action === null || action === void 0 ? void 0 : action.toLowerCase()) {
            case "save":
                this.saved = true;
                remoteUtil_1.RendererRemote.updateData("save", this._createData());
                break;
            case "remove":
                this.saved = false;
                remoteUtil_1.RendererRemote.updateData("remove", { id: this.id });
                break;
            case "parsed":
                break;
            case "print":
                break;
        }
    }
}
class WindowView {
    constructor() {
        this.activeId = "";
        this.tabs = [];
    }
    push(...argv) {
        let usedIds = this.tabs.map(o => o.id);
        for (let id of argv.map(o => o.id)) {
            if (usedIds.indexOf(id) >= 0) {
                command_1.command.message("error", "id重复");
                return;
            }
        }
        this.tabs.push(...argv);
        if ((!this.activeId || usedIds.indexOf(this.activeId) < 0) && argv.length > 0) {
            this.activeId = this.tabs[0].id;
        }
    }
    getTab(id) {
        return this.tabs.filter(o => o.id === id)[0];
    }
    handleTabsEdit(targetId, action) {
        if (action === 'add') {
            let newTab = new WindowTab();
            newTab.name = "New Debugger";
            this.tabs.push(newTab);
            this.activeId = newTab.id;
        }
        else if (action === "remove") {
            let tab = this.tabs.filter(o => o.id === targetId)[0];
            if (!tab || tab.waiting)
                return;
            let fn = () => {
                if (tab.connecting)
                    remoteUtil_1.RendererRemote.closeDebugger({ id: tab.id });
                if (tab.saved) {
                    remoteUtil_1.RendererRemote.updateData("remove", { id: tab.id });
                }
                let tabs = this.tabs, activeId = this.activeId;
                if (activeId === targetId) {
                    let index = tabs.indexOf(tab);
                    let nextTab = tabs[index + 1] || tabs[index - 1];
                    if (nextTab)
                        activeId = nextTab.id;
                }
                this.activeId = activeId;
                this.tabs = tabs.filter(tab => tab.id !== targetId);
            };
            if (!tab.saved)
                fn();
            else {
                command_1.command.confirm("你确实要删除此配置吗?", "提示", { type: "warning", confirm: "" }, fn);
            }
        }
    }
}
(function () {
    function convert(obj) {
        if (!obj || Array.isArray(obj))
            return obj;
        let result = {};
        for (let key of Object.keys(obj)) {
            let o = obj[key];
            if (typeof o === "object") {
                o = convert(o);
            }
            result[key] = o;
        }
        let proto = Object.getPrototypeOf(obj);
        if (proto) {
            let keys = Object.getOwnPropertyNames(proto).filter(k => k !== "constructor");
            for (let key of keys) {
                let o = obj[key];
                if (typeof (o) === "function") {
                    result[key] = (...args) => o.call(result, ...args);
                }
                else {
                    result[key] = o;
                }
            }
        }
        return result;
    }
    let obj = convert(new WindowView());
    new Vue({ el: "#debugger-window", data: obj });
    remoteUtil_1.RendererRemote.handleCloseDebugger((_, id, err) => {
        let tab = obj.getTab(id);
        if (tab) {
            tab.setConnectState(false);
            if (err && obj.activeId === id) {
                command_1.command.message("error", err);
            }
        }
    });
    remoteUtil_1.RendererRemote.readData((_, data) => {
        if (!data)
            return;
        for (let _data of data) {
            let tab = obj.getTab(_data.id), created = false;
            if (!tab) {
                tab = new WindowTab();
                created = true;
            }
            tab.saved = true;
            tab.setConfig(_data);
            if (created) {
                obj.push(tab);
            }
        }
    });
    remoteUtil_1.RendererRemote.queryDebugger(true, (_, data) => {
        if (!data)
            return;
        for (let _data of data) {
            let tab = obj.getTab(_data.id), created = false;
            if (!tab) {
                tab = new WindowTab();
                created = true;
            }
            tab.waiting = false;
            tab.setConnectState(true);
            tab.setConfig(_data);
            if (created) {
                obj.push(tab);
            }
        }
        if (obj.tabs.length === 0) {
            let tab = new WindowTab();
            tab.hostname = "127.0.0.1";
            tab.port = 10086;
            tab.watchPath = "your project path";
            obj.push(tab);
        }
    });
})();
//# sourceMappingURL=window.js.map