"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererRemote = exports.MainRemote = void 0;
const electron_1 = require("electron");
var Channel;
(function (Channel) {
    Channel[Channel["OpenDebugger"] = 0] = "OpenDebugger";
    Channel[Channel["CloseDebugger"] = 1] = "CloseDebugger";
    Channel[Channel["OpenDirectory"] = 2] = "OpenDirectory";
    Channel[Channel["QueryDebugger"] = 3] = "QueryDebugger";
    Channel[Channel["UpdateData"] = 4] = "UpdateData";
    Channel[Channel["ReadData"] = 5] = "ReadData";
})(Channel || (Channel = {}));
class Main {
    static on(channel, listener) {
        electron_1.ipcMain.on(Channel[channel], listener);
    }
}
class Renderer {
    static on(channel, listener) {
        electron_1.ipcRenderer.on(Channel[channel], listener);
    }
    static sendSync(channel, ...args) {
        return electron_1.ipcRenderer.sendSync(Channel[channel], ...args);
    }
    static send(channel, ...args) {
        let callback = args.length > 0 ? args[args.length - 1] : undefined;
        if (!callback || typeof (callback) !== "function") {
            electron_1.ipcRenderer.send(Channel[channel], ...args);
        }
        else {
            if (this.eventIndex === Number.MAX_SAFE_INTEGER) {
                this.eventIndex = 1;
            }
            let eventName = this.getReturnChannel();
            electron_1.ipcRenderer.removeAllListeners(eventName);
            electron_1.ipcRenderer.once(eventName, callback);
            electron_1.ipcRenderer.send(Channel[channel], ...(args.slice(0, args.length - 1)), eventName);
        }
    }
    static getReturnChannel() {
        if (!this.eventIndex || this.eventIndex === Number.MAX_SAFE_INTEGER) {
            this.eventIndex = 1;
        }
        return "returnEventName_" + this.eventIndex++;
    }
}
Renderer.eventIndex = 1;
class MainRemote extends Main {
    static handleOpenDebugger(listener) {
        this.on(Channel.OpenDebugger, listener);
    }
    static handleCloseDebugger(listener) {
        this.on(Channel.CloseDebugger, listener);
    }
    static handleQueryDebugger(listener) {
        this.on(Channel.QueryDebugger, listener);
    }
    static handleOpenDirectory(listener) {
        this.on(Channel.OpenDirectory, listener);
    }
    static handleUpdateData(listener) {
        this.on(Channel.UpdateData, listener);
    }
    static handleReadData(listener) {
        this.on(Channel.ReadData, listener);
    }
    static closeDebugger(sender, id, err) {
        sender.send(Channel[Channel.CloseDebugger], id, err);
    }
}
exports.MainRemote = MainRemote;
class RendererRemote extends Renderer {
    static openDebugger(options, listener) {
        this.send(Channel.OpenDebugger, options, listener);
    }
    static closeDebugger(options, listener) {
        this.send(Channel.CloseDebugger, options, listener);
    }
    static queryDebugger(updateWebId, listener) {
        this.send(Channel.QueryDebugger, updateWebId, listener);
    }
    static openDirectory(path, listener) {
        this.send(Channel.OpenDirectory, path, listener);
    }
    static updateData(action, options, listener) {
        this.send(Channel.UpdateData, action, options, listener);
    }
    static readData(listener) {
        this.send(Channel.ReadData, listener);
    }
    static handleCloseDebugger(listener) {
        this.on(Channel.CloseDebugger, listener);
    }
}
exports.RendererRemote = RendererRemote;
//# sourceMappingURL=remoteUtil.js.map