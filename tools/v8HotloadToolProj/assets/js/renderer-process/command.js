"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const electron_1 = require("electron");
class Command {
    get element() {
        if (!Command._element) {
            let app = document.createElement("div");
            app.id = "app";
            document.querySelector("body").append(app);
            Command._element = new Vue({ el: "#app", data: {} });
        }
        return Command._element;
    }
    message(type, content) {
        this.element.$message({
            message: content,
            type: type
        });
    }
    confirm(content, title, options, confirmFn, cancelFn) {
        this.element.$confirm(content, title, {
            confirmButtonText: options.confirm,
            cancelButtonText: options.cancel,
            type: options.type
        }).then(() => {
            if (confirmFn)
                confirmFn();
        }).catch(() => {
            if (cancelFn)
                cancelFn();
        });
    }
    alert(content, title, confirmName, confirmCB) {
        this.element.$alert(content, title, {
            confirmButtonText: confirmName,
            callback: (action) => {
                if (confirmCB)
                    confirmCB(action);
            }
        });
    }
    loading(options) {
        var _a, _b, _c;
        return this.element.$loading({
            lock: (_a = options === null || options === void 0 ? void 0 : options.lock) !== null && _a !== void 0 ? _a : true,
            text: options === null || options === void 0 ? void 0 : options.text,
            spinner: (_b = options === null || options === void 0 ? void 0 : options.icon) !== null && _b !== void 0 ? _b : 'el-icon-loading',
            background: (_c = options === null || options === void 0 ? void 0 : options.background) !== null && _c !== void 0 ? _c : 'rgba(0, 0, 0, 0.7)'
        });
    }
}
exports.command = new Command();
electron_1.ipcRenderer.on("console.info", (event, ...args) => {
    console.info(args);
});
electron_1.ipcRenderer.on("console.log", (event, ...args) => {
    console.log(args);
});
electron_1.ipcRenderer.on("console.warn", (event, ...args) => {
    console.warn(args);
});
electron_1.ipcRenderer.on("console.error", (event, ...args) => {
    console.error(args);
});
//# sourceMappingURL=command.js.map