import { DebuggerData, RendererRemote } from "../../util/remoteUtil";
import { command } from "../command";

class WindowTab {
    public connecting: boolean = false;
    public waiting: boolean = false;
    public saved: boolean = false;

    public stateIcon: string = "";          //tab-pane图标

    public id: string = "";
    public name: string = "New Debugger";

    public hostname: string = "127.0.0.1";
    public port: number = 80;
    public reconnect: boolean = true;      //自动重连 
    public reconnectTime: number = 1000;
    //连接后检查全部脚本
    public checkOnStartup: boolean = true;
    public trace: boolean = true;

    //监听目录
    public watchPath: string = "";
    //匹配的文件后缀名
    public fileTypes: string[] = [".js", ".js.txt", ".jsx", ".cjs", ".json"];
    public customScript: string = "";

    constructor() {
        this.id = new Date().valueOf().toString();
        this._refreshState();
    }
    public setConnectState(connected: boolean) {
        this.connecting = connected;
        this._refreshState();
        this._startReTimer();
    }
    public setConfig(options: DebuggerData) {
        let keys = ["id", "hostname", "port", "watchPath", "name", "reconnect", "reconnectTime", "checkOnStartup", "trace", "customScript"];
        for (let key of keys) {
            let val = (<any>options)[key];
            if (val !== undefined) {
                (<any>this)[key] = val;
            }
        }
        if (options.files) this.fileTypes = options.files;
    }

    private _reconnectId: any;
    private _startReTimer() {
        if (this._reconnectId)
            return;

        const INTERVAL_TIME = 20;
        let tick: number = 0;
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
    private _stopReTimer() {
        if (this._reconnectId)
            clearInterval(this._reconnectId);
        this._reconnectId = undefined;
    }

    private _refreshState() {
        this.stateIcon = this.waiting ? "el-icon-loading" : this.connecting ? "el-icon-success" : "el-icon-error";
    }
    private _createData(): DebuggerData {
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

    private handleConnect(connect: boolean, ignoreError?: boolean) {
        this.connecting = true;
        this.waiting = true;
        this._refreshState();

        if (connect) {
            RendererRemote.openDebugger(this._createData(), (_, err) => {
                this.connecting = !err;
                this.waiting = false;
                if (err && !ignoreError) {
                    command.message("error", err);
                }
                this._refreshState();
            });
            this._startReTimer();
        }
        else {
            RendererRemote.closeDebugger({ id: this.id }, () => {
                this.connecting = false;
                this.waiting = false;

                this._refreshState();
            });
            this._stopReTimer();
        }
    }
    private handleOpenDirectory() {
        RendererRemote.openDirectory(this.watchPath, (_, path) => {
            if (path) this.watchPath = path;
        });
    }
    private handleReconnect(stat: boolean) {
        if (stat)
            this._startReTimer();
        else
            this._stopReTimer();
    }
    private handleMenu(action: string) {
        switch (action?.toLowerCase()) {
            case "save":
                this.saved = true;
                RendererRemote.updateData("save", this._createData());
                break;
            case "remove":
                this.saved = false;
                RendererRemote.updateData("remove", { id: this.id });
                break;
            case "parsed":
                break;
            case "print":
                break;
        }
    }
}
class WindowView {
    public activeId: string = "";
    public tabs: WindowTab[] = [];

    public push(...argv: WindowTab[]) {
        let usedIds = this.tabs.map(o => o.id);
        for (let id of argv.map(o => o.id)) {
            if (usedIds.indexOf(id) >= 0) {
                command.message("error", "id重复");
                return;
            }
        }
        this.tabs.push(...argv);
        if ((!this.activeId || usedIds.indexOf(this.activeId) < 0) && argv.length > 0) {
            this.activeId = this.tabs[0].id;
        }
    }
    public getTab(id: string) {
        return this.tabs.filter(o => o.id === id)[0];
    }

    private handleTabsEdit(targetId: string, action: string) {
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
                    RendererRemote.closeDebugger({ id: tab.id });
                if (tab.saved) {
                    RendererRemote.updateData("remove", { id: tab.id });
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
                command.confirm("你确实要删除此配置吗?", "提示", { type: "warning", confirm: "" }, fn);
            }
        }
    }
}

(function () {
    function convert<T>(obj: T): T {
        if (!obj || Array.isArray(obj))
            return obj;
        let result: any = {};
        for (let key of Object.keys(obj)) {
            let o = (<any>obj)[key];
            if (typeof o === "object") {
                o = convert(o);
            }
            result[key] = o;
        }
        let proto = Object.getPrototypeOf(obj);
        if (proto) {
            let keys = Object.getOwnPropertyNames(proto).filter(k => k !== "constructor");
            for (let key of keys) {
                let o: Function = (<any>obj)[key];
                if (typeof (o) === "function") {
                    result[key] = (...args: any) => o.call(result, ...args);
                } else {
                    result[key] = o;
                }
            }
        }
        return result;
    }

    let obj = convert(new WindowView());
    new Vue({ el: "#debugger-window", data: obj });

    RendererRemote.handleCloseDebugger((_, id, err) => {
        let tab = obj.getTab(id);
        if (tab) {
            tab.setConnectState(false);
            if (err && obj.activeId === id) {
                command.message("error", err);
            }
        }
    });
    RendererRemote.readData((_, data) => {
        if (!data) return;

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
    RendererRemote.queryDebugger(true, (_, data) => {
        if (!data) return;
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

