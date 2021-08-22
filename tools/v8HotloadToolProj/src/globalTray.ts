/**全局托盘管理
 * 
 */
import * as path from "path";
import { app, Menu, NativeImage, Tray } from "electron";
import { globalWindows } from "./globalWindows";

class GlobalTray {
    private _trayIcon: NativeImage;
    private _tray: Tray;

    public stop() {
        if (this._tray && !this._tray.isDestroyed()) {
            this._tray.destroy();
        }
        this._tray = undefined;
    }
    public start() {
        if (this._tray && !this._tray.isDestroyed())
            return;

        if (!this._trayIcon) {
            let iconPath = path.join(__dirname, "../icon/logo.ico");
            app.getFileIcon(iconPath).then((icon) => {
                this._trayIcon = icon;
                if (icon) this.start();
            });
        }
        else {
            this._create();
        }
    }

    public isDestroyed() {
        return !this._tray || this._tray.isDestroyed();
    }

    private _create() {
        let tray = this._tray = new Tray(this._trayIcon ?? NativeImage.createEmpty());
        tray.setToolTip('v8 reload tool');
        tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: '重新启动',
                click() {
                    app.releaseSingleInstanceLock();
                    app.removeAllListeners("second-instance");
                    app.relaunch();
                    app.exit(0);
                }
            },
            {
                label: '退出程序',
                click() {
                    app.exit(0);
                }
            },
        ]));
        tray.on("double-click", function () {
            globalWindows.main.openWindow();
        });
        return tray;
    }
}

export const globalTray = new GlobalTray();