"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedData = void 0;
const fs = require("fs");
const path = require("path");
class SavedData {
    constructor(dirpath) {
        dirpath = dirpath.replace(/\\/g, "/");
        if (dirpath.endsWith("/"))
            dirpath += "/";
        this._dirpath = dirpath;
    }
    read(name) {
        let path = this._path(name);
        if (fs.existsSync(path))
            return fs.readFileSync(path).toString("utf-8");
        return undefined;
    }
    remove(name) {
        let path = this._path(name);
        if (fs.existsSync(path))
            fs.unlinkSync(path);
    }
    save(name, content) {
        fs.writeFileSync(this._path(name), content);
    }
    all() {
        let result = new Array();
        this._check();
        fs.readdirSync(this._dirpath).forEach(name => {
            result.push(this.read(name));
        });
        return result;
    }
    _check() {
        if (!fs.existsSync(this._dirpath)) {
            fs.mkdirSync(this._dirpath);
        }
    }
    _path(name) {
        this._check();
        return path.join(this._dirpath, name);
    }
}
exports.SavedData = SavedData;
//# sourceMappingURL=savedData.js.map