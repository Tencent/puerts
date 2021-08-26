import { CloseEventData, DebuggerData } from "../util/remoteUtil";
import { DebuggerWorker } from "./util/debuggerWorker";

export class Workers {
    private map = new Map<string, DebuggerWorker>()
    public get(options?: CloseEventData) {
        let key = options.id; `${options.webContentsId}-${options.id}`;
        return this.map.get(key);
    }
    public create(options: DebuggerData) {
        let key = options.id; `${options.webContentsId}-${options.id}`;
        let result = this.map.get(key);
        if (result) {
            result.close();
        }
        result = new DebuggerWorker(options);
        this.map.set(key, result);
        return result;
    }
    public all() {
        return [... this.map.values()].filter(o => o.isOpend);
    }
}