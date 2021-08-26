import * as fs from "fs";
import * as path from "path";

export class SavedData {
    private _dirpath: string;
    constructor(dirpath: string) {
        dirpath = dirpath.replace(/\\/g, "/");
        if (dirpath.endsWith("/")) dirpath += "/";
        this._dirpath = dirpath;
    }
    public read(name: string) {
        let path = this._path(name);
        if (fs.existsSync(path))
            return fs.readFileSync(path).toString("utf-8");
        return undefined;
    }
    public remove(name: string) {
        let path = this._path(name);
        if (fs.existsSync(path))
            fs.unlinkSync(path);
    }
    public save(name: string, content: string) {
        fs.writeFileSync(this._path(name), content);
    }
    public all() {
        let result = new Array<string>();
        this._check();
        fs.readdirSync(this._dirpath).forEach(name => {
            result.push(this.read(name));
        });
        return result;
    }
    private _check() {
        if (!fs.existsSync(this._dirpath)) {
            fs.mkdirSync(this._dirpath);
        }
    }
    private _path(name: string) {
        this._check();
        return path.join(this._dirpath, name);
    }
}
