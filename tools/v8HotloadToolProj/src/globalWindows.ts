/**全局窗口管理
 * 
 */
import * as path from "path";
import { app, BrowserWindow } from "electron";
import { globalTray } from "./globalTray";

class Window {
    public get window() { return this._win; }
    private _win: BrowserWindow;
    private _htmlPath: string;
    private _iconPath: string;
    constructor(htmlPath: string, iconPath?: string) {
        this._htmlPath = htmlPath;
        this._iconPath = iconPath;
    }
    public getWindow() {
        if (!this._win || this._win.isDestroyed()) {
            let win = this._win = new BrowserWindow({
                width: 1380,
                height: 750,
                show: true,             //立即显示窗口
                frame: true,            //显示边框
                transparent: false,     //窗口透明化
                skipTaskbar: false,     //不显示任务栏窗口
                hasShadow: false,       //窗口显示阴影
                resizable: true,        //调节窗口大小
                webPreferences: {
                    //允许开启控制台
                    devTools: true,
                    //窗口集成node模块
                    nodeIntegration: true,
                    //在iframe或者child window中集成node模块
                    nodeIntegrationInSubFrames: false,
                    //集成Worker多线程模块, sandbox不能设置为true
                    nodeIntegrationInWorker: false,
                    //沙盒模式, 与Chromium OS-level沙箱兼容并禁用nodejs引擎(预加载API有限制)
                    sandbox: false,
                    //集成remote模块(远程跨进程调用)
                    enableRemoteModule: false,
                    //处理文件或链接拖动到页面上的事件
                    navigateOnDragDrop: false,
                    //启用WebSQL api
                    enableWebSQL: false,
                    //WebSecurity策略
                    webSecurity: true
                }
            });
            win.loadFile(this._htmlPath);
            win.on("close", (e) => {
                if (!globalTray.isDestroyed()) {     //阻止窗口关闭(仅隐藏)
                    e.preventDefault();
                    win.hide();
                }
            });
            //加载窗口图标
            if (this._iconPath) {
                //win.setIcon(NativeImage.createEmpty());
                app.getFileIcon(this._iconPath).then((icon) => {
                    win.setIcon(icon);
                });
            }
        }
        return this._win;
    }
    public openWindow() {
        let win = this.getWindow();
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
        return win;
    }
}

let iconPath = path.join(__dirname, "../icon/logo.ico");

export const globalWindows = {
    main: new Window("assets/html/index.html", iconPath)
}


if (app.isPackaged) {   //重定向console方法
    function pkg(obj: any, refs?: WeakMap<object, object>) {
        if (obj !== undefined && obj !== null && obj !== void 0) {
            switch (typeof (obj)) {
                case "function":
                    return "[Function " + obj?.name + "]";
                case "object":
                    refs = refs ?? new WeakMap();
                    let result: any;
                    if (refs.has(obj)) {
                        result = refs.get(obj);
                    }
                    else if (Array.isArray(obj)) {
                        result = new Array<any>();
                        refs.set(obj, result);
                        obj.forEach(v => result.push(pkg(v, refs)));
                    } else {
                        result = {};
                        refs.set(obj, result);
                        Object.keys(obj).forEach(key => result[key] = pkg(obj[key], refs));
                    }
                    return result;
            }
        }
        return obj;
    }
    function send(eventName: string, ...args: any[]) {
        let _agrs = pkg(args);
        for (let window of BrowserWindow.getAllWindows()) {
            if (window && !window.isDestroyed()) {
                window.webContents.send(eventName, "nodejs::console", ..._agrs);
            }
        }
    }

    const info = console.info, log = console.log, warn = console.warn, error = console.error;
    console.info = function () {
        info(...arguments);
        send("console.info", ...arguments);
    }
    console.log = function () {
        log(...arguments);
        send("console.log", ...arguments);
    }
    console.warn = function () {
        warn(...arguments);
        send("console.warn", ...arguments);
    }
    console.error = function () {
        error(...arguments);
        send("console.error", ...arguments);
    }
}