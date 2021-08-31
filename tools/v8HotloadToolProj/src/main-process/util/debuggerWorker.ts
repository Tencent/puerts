import * as chokidar from "chokidar";
import { BrowserWindow } from "electron";
import { MainRemote, DebuggerData } from "../../util/remoteUtil";
import { Debugger } from "./debugger";

export class DebuggerWorker {
    public get isOpend() { return this._debugger && this._debugger.isOpend; }
    public get options() { return this._options; }

    private _debugger: Debugger;
    private _watcher: chokidar.FSWatcher;
    private _options: DebuggerData;

    constructor(options: DebuggerData) {
        this._options = options;
        if (!options.files || options.files.length === 0)
            options.files = [".js"];

        this._debugger = new Debugger({
            trace: options.trace,
            checkOnStartup: options.checkOnStartup
        });
        this._debugger.on("disconnect", this._disconnectHandler);
    }
    public async open() {
        this.close();

        let err = await this._debugger.open(this._options.hostname, this._options.port, true);
        if (!err) {
            let watcher = this._watcher = chokidar.watch(this._options.watchPath);
            watcher.on("change", (path, stats) => {
                if (!path || !this._allowExtension(path))
                    return;
                this._debugger.update(path);
            });
        }
        return err;
    }
    public async close() {
        if (this._watcher) {
            this._watcher.unwatch(this._options.watchPath);
            this._watcher.close();
            this._watcher = undefined;
        }
        await this._debugger.close();
    }

    private _allowExtension(path: string) {
        if (!this._options.files || this._options.files.length === 0)
            return true;
        for (let file of this._options.files) {
            if (path.endsWith(file))
                return true;
        }
        return false;
    }

    private _disconnectHandler = () => {
        this.close();
        let { webContentsId, id } = this._options;
        BrowserWindow.getAllWindows()
            .filter(o => o.webContents.id === webContentsId)
            .map(o => o.webContents)
            .forEach(sender => {
                MainRemote.closeDebugger(sender, id);
            })
    };
}