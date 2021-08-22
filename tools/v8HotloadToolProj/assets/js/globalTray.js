"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalTray = void 0;
/**全局托盘管理
 *
 */
const path = require("path");
const electron_1 = require("electron");
const globalWindows_1 = require("./globalWindows");
class GlobalTray {
    stop() {
        if (this._tray && !this._tray.isDestroyed()) {
            this._tray.destroy();
        }
        this._tray = undefined;
    }
    start() {
        if (this._tray && !this._tray.isDestroyed())
            return;
        if (!this._trayIcon) {
            let iconPath = path.join(__dirname, "../icon/logo.ico");
            electron_1.app.getFileIcon(iconPath).then((icon) => {
                this._trayIcon = icon;
                if (icon)
                    this.start();
            });
        }
        else {
            this._create();
        }
    }
    isDestroyed() {
        return !this._tray || this._tray.isDestroyed();
    }
    _create() {
        var _a;
        let tray = this._tray = new electron_1.Tray((_a = this._trayIcon) !== null && _a !== void 0 ? _a : electron_1.NativeImage.createEmpty());
        tray.setToolTip('v8 reload tool');
        tray.setContextMenu(electron_1.Menu.buildFromTemplate([
            {
                label: '重新启动',
                click() {
                    electron_1.app.releaseSingleInstanceLock();
                    electron_1.app.removeAllListeners("second-instance");
                    electron_1.app.relaunch();
                    electron_1.app.exit(0);
                }
            },
            {
                label: '退出程序',
                click() {
                    electron_1.app.exit(0);
                }
            },
        ]));
        tray.on("double-click", function () {
            globalWindows_1.globalWindows.main.openWindow();
        });
        return tray;
    }
}
exports.globalTray = new GlobalTray();
//# sourceMappingURL=globalTray.js.map