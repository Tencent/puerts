"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsBehaviour = void 0;
class JsBehaviour {
    constructor(mb) {
        // mono.Js
        this._mb = mb;
        if (this.Start != JsBehaviour.prototype.Start) {
            mb.JsStart = this.Start.bind(this);
        }
        if (this.Update != JsBehaviour.prototype.Update) {
            mb.JsUpdate = this.Update.bind(this);
        }
        if (this.OnTriggerEnter != JsBehaviour.prototype.OnTriggerEnter) {
            mb.JsOnTriggerEnter = this.OnTriggerEnter.bind(this);
        }
    }
    Start() { }
    Update() { }
    OnTriggerEnter(other) { }
}
exports.JsBehaviour = JsBehaviour;
//# sourceMappingURL=base.js.map