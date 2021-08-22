import { ipcRenderer } from "electron";

type MessageType = "success" | "warning" | "info" | "error";
class Command {
    private static _element: Vue;
    private get element() {
        if (!Command._element) {
            let app = document.createElement("div");
            app.id = "app";
            document.querySelector("body").append(app);
            Command._element = new Vue({ el: "#app", data: {} });
        }
        return Command._element;
    }
    public message(type: MessageType, content: string) {
        this.element.$message({
            message: content,
            type: type
        });
    }
    public confirm(content: string, title: string,
        options: { confirm: string, cancel?: string, type: MessageType },
        confirmFn: () => void,
        cancelFn?: () => void) {
        this.element.$confirm(content, title, {
            confirmButtonText: options.confirm,
            cancelButtonText: options.cancel,
            type: options.type
        }).then(() => {
            if (confirmFn) confirmFn();
        }).catch(() => {
            if (cancelFn) cancelFn();
        });
    }
    public alert(content: string, title: string,
        confirmName: string,
        confirmCB?: (action: "confirm" | "cancel") => void) {
        this.element.$alert(content, title, {
            confirmButtonText: confirmName,
            callback: (action: any) => {
                if (confirmCB) confirmCB(action);
            }
        });
    }
    public loading(options?: { lock?: boolean, text?: string, icon?: string, background?: string }): { close: () => void } {
        return this.element.$loading({
            lock: options?.lock ?? true,
            text: options?.text,
            spinner: options?.icon ?? 'el-icon-loading',
            background: options?.background ?? 'rgba(0, 0, 0, 0.7)'
        });
    }
}

export const command = new Command();

ipcRenderer.on("console.info", (event, ...args: any[]) => {
    console.info(args);
});
ipcRenderer.on("console.log", (event, ...args: any[]) => {
    console.log(args);
});
ipcRenderer.on("console.warn", (event, ...args: any[]) => {
    console.warn(args);
});
ipcRenderer.on("console.error", (event, ...args: any[]) => {
    console.error(args);
});

declare global {
    class Vue {
        constructor(options: { el: string, data: object });

        $message(...args: any[]): Promise<any>;
        $confirm(...args: any[]): Promise<any>;
        $alert(...args: any[]): Promise<any>;
        $loading(...args: any[]): { close(): void };
    }
}