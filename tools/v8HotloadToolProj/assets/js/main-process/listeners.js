"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const electron_1 = require("electron");
const remoteUtil_1 = require("../util/remoteUtil");
const workers_1 = require("./workers");
const savedData_1 = require("./savedData");
let storeDataPath = path.join(electron_1.app.getPath("userData"), "/DebuggerData");
console.log("storeDataPath: " + storeDataPath);
const saved = new savedData_1.SavedData(storeDataPath);
const workers = new workers_1.Workers();
remoteUtil_1.MainRemote.handleOpenDebugger((event, options, returnEventName) => __awaiter(void 0, void 0, void 0, function* () {
    options.webContentsId = event.sender.id;
    console.log("open:\t" + JSON.stringify(options));
    let worker = workers.create(options);
    let err = yield worker.open();
    event.returnValue = err;
    if (returnEventName) {
        event.sender.send(returnEventName, err);
    }
}));
remoteUtil_1.MainRemote.handleCloseDebugger((event, options, returnEventName) => __awaiter(void 0, void 0, void 0, function* () {
    options.webContentsId = event.sender.id;
    console.log("close:\t" + JSON.stringify(options));
    let worker = workers.get(options);
    if (worker) {
        yield worker.close();
    }
    event.returnValue = 0;
    if (returnEventName) {
        event.sender.send(returnEventName, 0);
    }
}));
remoteUtil_1.MainRemote.handleQueryDebugger((event, updateWebId, returnEventName) => {
    let data = workers.all().map(o => o.options);
    if (updateWebId) {
        data.forEach(o => o.webContentsId = event.sender.id);
    }
    event.returnValue = data;
    if (returnEventName) {
        event.sender.send(returnEventName, data);
    }
});
remoteUtil_1.MainRemote.handleOpenDirectory((event, path, returnEventName) => __awaiter(void 0, void 0, void 0, function* () {
    path = path && fs.existsSync(path) ? path.replace(/\//g, "\\") : undefined;
    //作为模态窗口打开
    let result = yield electron_1.dialog.showOpenDialog(electron_1.BrowserWindow.getFocusedWindow(), {
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
}));
remoteUtil_1.MainRemote.handleUpdateData((event, action, options, returnEventName) => {
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
remoteUtil_1.MainRemote.handleReadData((event, returnEventName) => {
    let result;
    let jsonData = saved.all();
    if (jsonData && jsonData.length > 0) {
        result = jsonData.map(json => json ? JSON.parse(json) : undefined).filter(o => !!o);
    }
    event.returnValue = result;
    if (returnEventName) {
        event.sender.send(returnEventName, result);
    }
});
//# sourceMappingURL=listeners.js.map