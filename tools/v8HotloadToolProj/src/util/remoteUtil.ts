import { ipcMain, IpcMainEvent, ipcRenderer, IpcRendererEvent, WebContents } from "electron";

enum Channel {
    OpenDebugger,
    CloseDebugger,
    OpenDirectory,
    QueryDebugger,
    UpdateData,
    ReadData,
}

class Main {
    protected static on(channel: Channel, listener: any) {
        ipcMain.on(Channel[channel], listener);
    }
}
class Renderer {
    protected static on(channel: Channel, listener: any) {
        ipcRenderer.on(Channel[channel], listener);
    }
    protected static sendSync(channel: Channel, ...args: any[]) {
        return ipcRenderer.sendSync(Channel[channel], ...args);
    }
    protected static send(channel: Channel, ...args: any[]) {
        let callback = args.length > 0 ? args[args.length - 1] : undefined;
        if (!callback || typeof (callback) !== "function") {
            ipcRenderer.send(Channel[channel], ...args);
        } else {
            if (this.eventIndex === Number.MAX_SAFE_INTEGER) {
                this.eventIndex = 1;
            }
            let eventName = this.getReturnChannel();
            ipcRenderer.removeAllListeners(eventName);
            ipcRenderer.once(eventName, callback);
            ipcRenderer.send(Channel[channel], ...(args.slice(0, args.length - 1)), eventName);
        }
    }
    private static eventIndex = 1;
    private static getReturnChannel() {
        if (!this.eventIndex || this.eventIndex === Number.MAX_SAFE_INTEGER) {
            this.eventIndex = 1;
        }
        return "returnEventName_" + this.eventIndex++;
    }
}

export class MainRemote extends Main {
    public static handleOpenDebugger(listener: (event: IpcMainEvent, options: DebuggerData, returnEventName?: string) => void) {
        this.on(Channel.OpenDebugger, listener);
    }
    public static handleCloseDebugger(listener: (event: IpcMainEvent, options: CloseEventData, returnEventName?: string) => void) {
        this.on(Channel.CloseDebugger, listener);
    }
    public static handleQueryDebugger(listener: (event: IpcMainEvent, updateWebId: boolean, returnEventName?: string) => void) {
        this.on(Channel.QueryDebugger, listener);
    }
    public static handleOpenDirectory(listener: (event: IpcMainEvent, path: string, returnEventName?: string) => void) {
        this.on(Channel.OpenDirectory, listener);
    }
    public static handleUpdateData(listener: (event: IpcMainEvent, action: "save" | "remove", options: DebuggerData | CloseEventData, returnEventName?: string) => void) {
        this.on(Channel.UpdateData, listener);
    }
    public static handleReadData(listener: (event: IpcMainEvent, returnEventName?: string) => void) {
        this.on(Channel.ReadData, listener);
    }


    public static closeDebugger(sender: WebContents, id: string, err?: string) {
        sender.send(Channel[Channel.CloseDebugger], id, err);
    }
}

export class RendererRemote extends Renderer {
    public static openDebugger(options: DebuggerData, listener?: (event: IpcRendererEvent, err: string) => void) {
        this.send(Channel.OpenDebugger, options, listener);
    }
    public static closeDebugger(options: CloseEventData, listener?: (event: IpcRendererEvent) => void) {
        this.send(Channel.CloseDebugger, options, listener);
    }
    public static queryDebugger(updateWebId: boolean, listener?: (event: IpcRendererEvent, data: DebuggerData[]) => void) {
        this.send(Channel.QueryDebugger, updateWebId, listener);
    }
    public static openDirectory(path: string, listener: (event: IpcRendererEvent, path: string) => void) {
        this.send(Channel.OpenDirectory, path, listener);
    }
    public static updateData(action: "save" | "remove", options: DebuggerData | CloseEventData, listener?: (event: IpcRendererEvent) => void) {
        this.send(Channel.UpdateData, action, options, listener);
    }
    public static readData(listener?: (event: IpcRendererEvent, data: DebuggerData[]) => void) {
        this.send(Channel.ReadData, listener);
    }

    public static handleCloseDebugger(listener: (event: IpcRendererEvent, id: string, err?: string) => void) {
        this.on(Channel.CloseDebugger, listener);
    }
}

export type DebuggerData = {
    id: string;
    hostname: string;
    port: number;
    watchPath: string;
    files?: string[];

    name: string;
    reconnect: boolean;
    reconnectTime: number;
    checkOnStartup: boolean;
    trace: boolean;
    customScript: string;

    webContentsId?: number;     //窗口id
}
export type CloseEventData = {
    id: string;
    webContentsId?: number;     //窗口id
}