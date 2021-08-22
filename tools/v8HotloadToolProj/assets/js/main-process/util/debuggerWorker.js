"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebuggerWorker = void 0;
const chokidar = require("chokidar");
const electron_1 = require("electron");
const remoteUtil_1 = require("../../util/remoteUtil");
const debugger_1 = require("./debugger");
class DebuggerWorker {
    constructor(options) {
        this._disconnectHandler = () => {
            this.close();
            let { webContentsId, id } = this._options;
            electron_1.BrowserWindow.getAllWindows()
                .filter(o => o.webContents.id === webContentsId)
                .map(o => o.webContents)
                .forEach(sender => {
                remoteUtil_1.MainRemote.closeDebugger(sender, id);
            });
        };
        this._options = options;
        if (!options.files || options.files.length === 0)
            options.files = [".js"];
        this._debugger = new debugger_1.Debugger({
            trace: options.trace,
            checkOnStartup: options.checkOnStartup
        });
        this._debugger.on("disconnect", this._disconnectHandler);
    }
    get isOpend() { return this._debugger && this._debugger.isOpend; }
    get options() { return this._options; }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            this.close();
            let err = yield this._debugger.open(this._options.hostname, this._options.port, true);
            if (!err) {
                let watcher = this._watcher = chokidar.watch(this._options.watchPath);
                watcher.on("change", (path, stats) => {
                    if (!path || !this._allowExtension(path))
                        return;
                    this._debugger.update(path);
                });
            }
            return err;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._watcher) {
                this._watcher.unwatch(this._options.watchPath);
                this._watcher.close();
                this._watcher = undefined;
            }
            yield this._debugger.close();
        });
    }
    _allowExtension(path) {
        if (!this._options.files || this._options.files.length === 0)
            return true;
        for (let file of this._options.files) {
            if (path.endsWith(file))
                return true;
        }
        return false;
    }
}
exports.DebuggerWorker = DebuggerWorker;
//# sourceMappingURL=debuggerWorker.js.map