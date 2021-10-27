"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSGameManager = void 0;
const csharp_1 = require("csharp");
const puerts_1 = require("puerts");
const base_1 = require("./Base/base");
class JSGameManager extends base_1.JsBehaviour {
    Start() {
        this.spawnBall();
        JSGameManager.instance = this;
    }
    Update() {
        const expectPressTimeMax = 1000;
        if (csharp_1.UnityEngine.Input.GetMouseButtonDown(0) || csharp_1.UnityEngine.Input.touchCount != 0) {
            this.pressed = Date.now();
            if (csharp_1.UnityEngine.Input.touchCount) {
                this.useTouch = true;
            }
        }
        if (this.pressed && (this.useTouch ? csharp_1.UnityEngine.Input.touchCount == 0 : csharp_1.UnityEngine.Input.GetMouseButtonUp(0))) {
            this.shootBall(Math.min(expectPressTimeMax, Date.now() - this.pressed) / expectPressTimeMax);
            this.pressed = 0;
        }
    }
    shootBall(power) {
        const rigidbody = this.currentBall.GetComponent((0, puerts_1.$typeof)(csharp_1.UnityEngine.Rigidbody));
        rigidbody.isKinematic = false;
        rigidbody.velocity = new csharp_1.UnityEngine.Vector3(1 + 2 * power, 3 + 6 * power, 0);
        setTimeout(() => {
            this.spawnBall();
        }, 500);
    }
    spawnBall() {
        const ball = this.currentBall = csharp_1.UnityEngine.Object.Instantiate(this._mb.BallPrefab);
        ball.transform.position = this._mb.BallSpawnPoint.transform.position;
        const rigidbody = ball.GetComponent((0, puerts_1.$typeof)(csharp_1.UnityEngine.Rigidbody));
        rigidbody.isKinematic = true;
    }
}
exports.JSGameManager = JSGameManager;
//# sourceMappingURL=JSGameManager.js.map