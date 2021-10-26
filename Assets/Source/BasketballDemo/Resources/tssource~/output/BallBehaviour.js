"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSBallBehaviour = void 0;
const base_1 = require("./Base/base");
const JSGameManager_1 = require("./JSGameManager");
class JSBallBehaviour extends base_1.JsBehaviour {
    OnTriggerEnter(trigger) {
        if (trigger == JSGameManager_1.JSGameManager.instance._mb.PrescoreTrigger) {
            this.prescore = true;
        }
        if (trigger == JSGameManager_1.JSGameManager.instance._mb.ScoredTrigger && this.prescore) {
            console.log("得分");
        }
    }
}
exports.JSBallBehaviour = JSBallBehaviour;
//# sourceMappingURL=BallBehaviour.js.map