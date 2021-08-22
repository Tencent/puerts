"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const globalTray_1 = require("./globalTray");
const globalWindows_1 = require("./globalWindows");
//创建app单例模式
if (!electron_1.app.requestSingleInstanceLock()) {
    electron_1.app.exit();
}
else {
    electron_1.app.on("second-instance", (e, commandLine, workingDirectory) => {
        //运行第二个实例时, 聚焦到当前实例
        let windows = electron_1.BrowserWindow.getAllWindows();
        for (let window of windows) {
            window.show();
            window.focus();
        }
    });
    electron_1.app.on('ready', () => {
        require("./main-process/listeners");
        electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate([{
                label: "帮助",
                submenu: [
                    {
                        label: "刷新",
                        accelerator: 'F5',
                        click: () => {
                            var win = electron_1.BrowserWindow.getFocusedWindow();
                            if (win != null) {
                                win.webContents.reload();
                            }
                        }
                    },
                    {
                        label: "控制台",
                        accelerator: 'F12',
                        click: () => {
                            var win = electron_1.BrowserWindow.getFocusedWindow();
                            if (win != null) {
                                if (!win.webContents.isDevToolsOpened()) {
                                    win.webContents.openDevTools();
                                }
                                else {
                                    win.webContents.closeDevTools();
                                }
                            }
                        },
                    }
                ]
            }
        ]));
    });
    electron_1.app.whenReady().then(() => {
        globalWindows_1.globalWindows.main.openWindow();
        //globalTray.start();
    });
    electron_1.app.on("will-quit", function () {
    });
    electron_1.app.on('window-all-closed', function () {
        if (globalTray_1.globalTray.isDestroyed()) {
            electron_1.app.exit(0);
        }
    });
}
//# sourceMappingURL=app.js.map