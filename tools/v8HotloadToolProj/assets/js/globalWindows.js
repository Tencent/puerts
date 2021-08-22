"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalWindows = void 0;
/**全局窗口管理
 *
 */
const path = require("path");
const electron_1 = require("electron");
const globalTray_1 = require("./globalTray");
class Window {
    constructor(htmlPath, iconPath) {
        this._htmlPath = htmlPath;
        this._iconPath = iconPath;
    }
    get window() { return this._win; }
    getWindow() {
        if (!this._win || this._win.isDestroyed()) {
            let win = this._win = new electron_1.BrowserWindow({
                width: 1380,
                height: 750,
                show: true,
                frame: true,
                transparent: false,
                skipTaskbar: false,
                hasShadow: false,
                resizable: true,
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
                if (!globalTray_1.globalTray.isDestroyed()) { //阻止窗口关闭(仅隐藏)
                    e.preventDefault();
                    win.hide();
                }
            });
            //加载窗口图标
            if (this._iconPath) {
                //win.setIcon(NativeImage.createEmpty());
                electron_1.app.getFileIcon(this._iconPath).then((icon) => {
                    win.setIcon(icon);
                });
            }
        }
        return this._win;
    }
    openWindow() {
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
exports.globalWindows = {
    main: new Window("assets/html/index.html", iconPath)
};
if (electron_1.app.isPackaged) { //重定向console方法
    function pkg(obj, refs) {
        if (obj !== undefined && obj !== null && obj !== void 0) {
            switch (typeof (obj)) {
                case "function":
                    return "[Function " + (obj === null || obj === void 0 ? void 0 : obj.name) + "]";
                case "object":
                    refs = refs !== null && refs !== void 0 ? refs : new WeakMap();
                    let result;
                    if (refs.has(obj)) {
                        result = refs.get(obj);
                    }
                    else if (Array.isArray(obj)) {
                        result = new Array();
                        refs.set(obj, result);
                        obj.forEach(v => result.push(pkg(v, refs)));
                    }
                    else {
                        result = {};
                        refs.set(obj, result);
                        Object.keys(obj).forEach(key => result[key] = pkg(obj[key], refs));
                    }
                    return result;
            }
        }
        return obj;
    }
    function send(eventName, ...args) {
        let _agrs = pkg(args);
        for (let key of Object.keys(exports.globalWindows)) {
            let window = exports.globalWindows[key];
            if (window instanceof electron_1.BrowserWindow && !window.isDestroyed()) {
                window.webContents.send(eventName, "nodejs::console", ..._agrs);
            }
        }
    }
    const info = console.info, log = console.log, warn = console.warn, error = console.error;
    console.info = function () {
        info(...arguments);
        send("console.info", ...arguments);
    };
    console.log = function () {
        log(...arguments);
        send("console.log", ...arguments);
    };
    console.warn = function () {
        warn(...arguments);
        send("console.warn", ...arguments);
    };
    console.error = function () {
        error(...arguments);
        send("console.error", ...arguments);
    };
}
//# sourceMappingURL=globalWindows.js.map