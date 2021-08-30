import { app, BrowserWindow, Menu } from "electron";
import { globalTray } from "./globalTray";
import { globalWindows } from "./globalWindows";

//创建app单例模式
if (!app.requestSingleInstanceLock()) {
    app.exit();
} else {
    app.on("second-instance", (e, commandLine, workingDirectory) => {
        //运行第二个实例时, 聚焦到当前实例
        let windows = BrowserWindow.getAllWindows();
        for (let window of windows) {
            window.show();
            window.focus();
        }
    });

    app.on('ready', () => {
        require("./main-process/listeners");
        Menu.setApplicationMenu(Menu.buildFromTemplate([{
            label: "帮助",
            submenu: [
                {
                    label: "刷新",
                    accelerator: 'F5',
                    click: () => {
                        var win = BrowserWindow.getFocusedWindow();
                        if (win != null) {
                            win.webContents.reload();
                        }
                    }
                },
                {
                    label: "控制台",
                    accelerator: 'F12',
                    click: () => {
                        var win = BrowserWindow.getFocusedWindow();
                        if (win != null) {
                            if (!win.webContents.isDevToolsOpened()) {
                                win.webContents.openDevTools();
                            } else {
                                win.webContents.closeDevTools();
                            }
                        }
                    },
                }
            ]
        }
        ]));
    });
    app.whenReady().then(() => {
        globalWindows.main.openWindow();
        //globalTray.start();
    });

    app.on("will-quit", function () {

    });
    app.on('window-all-closed', function () {
        if (globalTray.isDestroyed()) {
            app.exit(0);
        }
    });
}

