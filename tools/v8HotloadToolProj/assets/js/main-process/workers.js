"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workers = void 0;
const debuggerWorker_1 = require("./util/debuggerWorker");
class Workers {
    constructor() {
        this.map = new Map();
    }
    get(options) {
        let key = options.id;
        `${options.webContentsId}-${options.id}`;
        return this.map.get(key);
    }
    create(options) {
        let key = options.id;
        `${options.webContentsId}-${options.id}`;
        let result = this.map.get(key);
        if (result) {
            result.close();
        }
        result = new debuggerWorker_1.DebuggerWorker(options);
        this.map.set(key, result);
        return result;
    }
    all() {
        return [...this.map.values()].filter(o => o.isOpend);
    }
}
exports.Workers = Workers;
//# sourceMappingURL=workers.js.map