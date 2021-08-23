import * as fs from "fs";
import * as path from "path";
import { app, BrowserWindow, dialog } from "electron";
import { DebuggerData, MainRemote } from "../util/remoteUtil";
import { Workers } from "./workers";
import { SavedData } from "./savedData";

let storeDataPath = path.join(app.getPath("userData"), "/DebuggerData");
console.log("storeDataPath: " + storeDataPath);

const saved = new SavedData(storeDataPath);
const workers = new Workers();

MainRemote.handleOpenDebugger(async (event, options, returnEventName) => {
    options.webContentsId = event.sender.id;
    console.log("open:\t" + JSON.stringify(options));

    let worker = workers.create(options);
    let err = await worker.open();

    event.returnValue = err;
    if (returnEventName) {
        event.sender.send(returnEventName, err);
    }
});
MainRemote.handleCloseDebugger(async (event, options, returnEventName) => {
    options.webContentsId = event.sender.id;
    console.log("close:\t" + JSON.stringify(options));

    let worker = workers.get(options);
    if (worker) {
        await worker.close();
    }
    event.returnValue = 0;
    if (returnEventName) {
        event.sender.send(returnEventName, 0);
    }
});
MainRemote.handleQueryDebugger((event, updateWebId, returnEventName) => {
    let data = workers.all().map(o => o.options);
    if (updateWebId) {
        data.forEach(o => o.webContentsId = event.sender.id);
    }

    event.returnValue = data;
    if (returnEventName) {
        event.sender.send(returnEventName, data);
    }
});

MainRemote.handleOpenDirectory(async (event, path, returnEventName) => {
    path = path && fs.existsSync(path) ? path.replace(/\//g, "\\") : undefined;
    //作为模态窗口打开
    let result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: "Select Folder",
        buttonLabel: "Select",
        defaultPath: path,
        properties: ["openDirectory", "createDirectory"],
    });
    path = undefined;
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        path = result.filePaths[0].replace(/\\/g, "/");
    }

    event.returnValue = path;
    if (returnEventName) {
        event.sender.send(returnEventName, path);
    }
});
MainRemote.handleUpdateData((event, action, options, returnEventName) => {
    switch (action) {
        case "remove":
            saved.remove(options.id);
            break;
        case "save":
            saved.save(options.id, JSON.stringify(options));
            break;
    }
    event.returnValue = 0;
    if (returnEventName) {
        event.sender.send(returnEventName, 0);
    }
});
MainRemote.handleReadData((event, returnEventName) => {
    let result: DebuggerData[];
    let jsonData = saved.all();
    if (jsonData && jsonData.length > 0) {
        result = jsonData.map(json => json ? JSON.parse(json) as DebuggerData : undefined).filter(o => !!o);
    }

    event.returnValue = result;
    if (returnEventName) {
        event.sender.send(returnEventName, result);
    }
});