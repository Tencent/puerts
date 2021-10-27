/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./output/Base/base.js":
/*!*****************************!*\
  !*** ./output/Base/base.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
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

/***/ }),

/***/ "./output/JSBallBehaviour.js":
/*!***********************************!*\
  !*** ./output/JSBallBehaviour.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JSBallBehaviour = void 0;
const base_1 = __webpack_require__(/*! ./Base/base */ "./output/Base/base.js");
const JSGameManager_1 = __webpack_require__(/*! ./JSGameManager */ "./output/JSGameManager.js");
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
//# sourceMappingURL=JSBallBehaviour.js.map

/***/ }),

/***/ "./output/JSGameManager.js":
/*!*********************************!*\
  !*** ./output/JSGameManager.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JSGameManager = void 0;
const csharp_1 = __webpack_require__(/*! csharp */ "csharp");
const puerts_1 = __webpack_require__(/*! puerts */ "puerts");
const base_1 = __webpack_require__(/*! ./Base/base */ "./output/Base/base.js");
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

/***/ }),

/***/ "csharp":
/*!*************************!*\
  !*** external "csharp" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("csharp");

/***/ }),

/***/ "puerts":
/*!*************************!*\
  !*** external "puerts" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("puerts");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*************************!*\
  !*** ./output/entry.js ***!
  \*************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JSGameManager = exports.JSBallBehaviour = void 0;
const JSGameManager_1 = __webpack_require__(/*! ./JSGameManager */ "./output/JSGameManager.js");
Object.defineProperty(exports, "JSGameManager", ({ enumerable: true, get: function () { return JSGameManager_1.JSGameManager; } }));
const JSBallBehaviour_1 = __webpack_require__(/*! ./JSBallBehaviour */ "./output/JSBallBehaviour.js");
Object.defineProperty(exports, "JSBallBehaviour", ({ enumerable: true, get: function () { return JSBallBehaviour_1.JSBallBehaviour; } }));
//# sourceMappingURL=entry.js.map
})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVoYXZpb3Vycy5janMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7Ozs7Ozs7Ozs7QUN0QmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsdUJBQXVCO0FBQ3ZCLGVBQWUsbUJBQU8sQ0FBQywwQ0FBYTtBQUNwQyx3QkFBd0IsbUJBQU8sQ0FBQyxrREFBaUI7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7Ozs7Ozs7Ozs7QUNoQmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QscUJBQXFCO0FBQ3JCLGlCQUFpQixtQkFBTyxDQUFDLHNCQUFRO0FBQ2pDLGlCQUFpQixtQkFBTyxDQUFDLHNCQUFRO0FBQ2pDLGVBQWUsbUJBQU8sQ0FBQywwQ0FBYTtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjs7Ozs7Ozs7OztBQ3hDQTs7Ozs7Ozs7OztBQ0FBOzs7Ozs7VUNBQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7O0FDdEJhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHFCQUFxQixHQUFHLHVCQUF1QjtBQUMvQyx3QkFBd0IsbUJBQU8sQ0FBQyxrREFBaUI7QUFDakQsaURBQWdELEVBQUUscUNBQXFDLHlDQUF5QyxFQUFDO0FBQ2pJLDBCQUEwQixtQkFBTyxDQUFDLHNEQUFtQjtBQUNyRCxtREFBa0QsRUFBRSxxQ0FBcUMsNkNBQTZDLEVBQUM7QUFDdkksaUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90c3NvdXJjZS8uL291dHB1dC9CYXNlL2Jhc2UuanMiLCJ3ZWJwYWNrOi8vdHNzb3VyY2UvLi9vdXRwdXQvSlNCYWxsQmVoYXZpb3VyLmpzIiwid2VicGFjazovL3Rzc291cmNlLy4vb3V0cHV0L0pTR2FtZU1hbmFnZXIuanMiLCJ3ZWJwYWNrOi8vdHNzb3VyY2UvZXh0ZXJuYWwgY29tbW9uanMgXCJjc2hhcnBcIiIsIndlYnBhY2s6Ly90c3NvdXJjZS9leHRlcm5hbCBjb21tb25qcyBcInB1ZXJ0c1wiIiwid2VicGFjazovL3Rzc291cmNlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3Rzc291cmNlLy4vb3V0cHV0L2VudHJ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Kc0JlaGF2aW91ciA9IHZvaWQgMDtcbmNsYXNzIEpzQmVoYXZpb3VyIHtcbiAgICBjb25zdHJ1Y3RvcihtYikge1xuICAgICAgICAvLyBtb25vLkpzXG4gICAgICAgIHRoaXMuX21iID0gbWI7XG4gICAgICAgIGlmICh0aGlzLlN0YXJ0ICE9IEpzQmVoYXZpb3VyLnByb3RvdHlwZS5TdGFydCkge1xuICAgICAgICAgICAgbWIuSnNTdGFydCA9IHRoaXMuU3RhcnQuYmluZCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5VcGRhdGUgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLlVwZGF0ZSkge1xuICAgICAgICAgICAgbWIuSnNVcGRhdGUgPSB0aGlzLlVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLk9uVHJpZ2dlckVudGVyICE9IEpzQmVoYXZpb3VyLnByb3RvdHlwZS5PblRyaWdnZXJFbnRlcikge1xuICAgICAgICAgICAgbWIuSnNPblRyaWdnZXJFbnRlciA9IHRoaXMuT25UcmlnZ2VyRW50ZXIuYmluZCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBTdGFydCgpIHsgfVxuICAgIFVwZGF0ZSgpIHsgfVxuICAgIE9uVHJpZ2dlckVudGVyKG90aGVyKSB7IH1cbn1cbmV4cG9ydHMuSnNCZWhhdmlvdXIgPSBKc0JlaGF2aW91cjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJhc2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkpTQmFsbEJlaGF2aW91ciA9IHZvaWQgMDtcbmNvbnN0IGJhc2VfMSA9IHJlcXVpcmUoXCIuL0Jhc2UvYmFzZVwiKTtcbmNvbnN0IEpTR2FtZU1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuL0pTR2FtZU1hbmFnZXJcIik7XG5jbGFzcyBKU0JhbGxCZWhhdmlvdXIgZXh0ZW5kcyBiYXNlXzEuSnNCZWhhdmlvdXIge1xuICAgIE9uVHJpZ2dlckVudGVyKHRyaWdnZXIpIHtcbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlcl8xLkpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlByZXNjb3JlVHJpZ2dlcikge1xuICAgICAgICAgICAgdGhpcy5wcmVzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlcl8xLkpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlNjb3JlZFRyaWdnZXIgJiYgdGhpcy5wcmVzY29yZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLlvpfliIZcIik7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkpTQmFsbEJlaGF2aW91ciA9IEpTQmFsbEJlaGF2aW91cjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUpTQmFsbEJlaGF2aW91ci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSlNHYW1lTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IGNzaGFycF8xID0gcmVxdWlyZShcImNzaGFycFwiKTtcbmNvbnN0IHB1ZXJ0c18xID0gcmVxdWlyZShcInB1ZXJ0c1wiKTtcbmNvbnN0IGJhc2VfMSA9IHJlcXVpcmUoXCIuL0Jhc2UvYmFzZVwiKTtcbmNsYXNzIEpTR2FtZU1hbmFnZXIgZXh0ZW5kcyBiYXNlXzEuSnNCZWhhdmlvdXIge1xuICAgIFN0YXJ0KCkge1xuICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICBKU0dhbWVNYW5hZ2VyLmluc3RhbmNlID0gdGhpcztcbiAgICB9XG4gICAgVXBkYXRlKCkge1xuICAgICAgICBjb25zdCBleHBlY3RQcmVzc1RpbWVNYXggPSAxMDAwO1xuICAgICAgICBpZiAoY3NoYXJwXzEuVW5pdHlFbmdpbmUuSW5wdXQuR2V0TW91c2VCdXR0b25Eb3duKDApIHx8IGNzaGFycF8xLlVuaXR5RW5naW5lLklucHV0LnRvdWNoQ291bnQgIT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChjc2hhcnBfMS5Vbml0eUVuZ2luZS5JbnB1dC50b3VjaENvdW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VUb3VjaCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJlc3NlZCAmJiAodGhpcy51c2VUb3VjaCA/IGNzaGFycF8xLlVuaXR5RW5naW5lLklucHV0LnRvdWNoQ291bnQgPT0gMCA6IGNzaGFycF8xLlVuaXR5RW5naW5lLklucHV0LkdldE1vdXNlQnV0dG9uVXAoMCkpKSB7XG4gICAgICAgICAgICB0aGlzLnNob290QmFsbChNYXRoLm1pbihleHBlY3RQcmVzc1RpbWVNYXgsIERhdGUubm93KCkgLSB0aGlzLnByZXNzZWQpIC8gZXhwZWN0UHJlc3NUaW1lTWF4KTtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvb3RCYWxsKHBvd2VyKSB7XG4gICAgICAgIGNvbnN0IHJpZ2lkYm9keSA9IHRoaXMuY3VycmVudEJhbGwuR2V0Q29tcG9uZW50KCgwLCBwdWVydHNfMS4kdHlwZW9mKShjc2hhcnBfMS5Vbml0eUVuZ2luZS5SaWdpZGJvZHkpKTtcbiAgICAgICAgcmlnaWRib2R5LmlzS2luZW1hdGljID0gZmFsc2U7XG4gICAgICAgIHJpZ2lkYm9keS52ZWxvY2l0eSA9IG5ldyBjc2hhcnBfMS5Vbml0eUVuZ2luZS5WZWN0b3IzKDEgKyAyICogcG93ZXIsIDMgKyA2ICogcG93ZXIsIDApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3Bhd25CYWxsKCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxuICAgIHNwYXduQmFsbCgpIHtcbiAgICAgICAgY29uc3QgYmFsbCA9IHRoaXMuY3VycmVudEJhbGwgPSBjc2hhcnBfMS5Vbml0eUVuZ2luZS5PYmplY3QuSW5zdGFudGlhdGUodGhpcy5fbWIuQmFsbFByZWZhYik7XG4gICAgICAgIGJhbGwudHJhbnNmb3JtLnBvc2l0aW9uID0gdGhpcy5fbWIuQmFsbFNwYXduUG9pbnQudHJhbnNmb3JtLnBvc2l0aW9uO1xuICAgICAgICBjb25zdCByaWdpZGJvZHkgPSBiYWxsLkdldENvbXBvbmVudCgoMCwgcHVlcnRzXzEuJHR5cGVvZikoY3NoYXJwXzEuVW5pdHlFbmdpbmUuUmlnaWRib2R5KSk7XG4gICAgICAgIHJpZ2lkYm9keS5pc0tpbmVtYXRpYyA9IHRydWU7XG4gICAgfVxufVxuZXhwb3J0cy5KU0dhbWVNYW5hZ2VyID0gSlNHYW1lTWFuYWdlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUpTR2FtZU1hbmFnZXIuanMubWFwIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiY3NoYXJwXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInB1ZXJ0c1wiKTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkpTR2FtZU1hbmFnZXIgPSBleHBvcnRzLkpTQmFsbEJlaGF2aW91ciA9IHZvaWQgMDtcbmNvbnN0IEpTR2FtZU1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuL0pTR2FtZU1hbmFnZXJcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJKU0dhbWVNYW5hZ2VyXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBKU0dhbWVNYW5hZ2VyXzEuSlNHYW1lTWFuYWdlcjsgfSB9KTtcbmNvbnN0IEpTQmFsbEJlaGF2aW91cl8xID0gcmVxdWlyZShcIi4vSlNCYWxsQmVoYXZpb3VyXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiSlNCYWxsQmVoYXZpb3VyXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBKU0JhbGxCZWhhdmlvdXJfMS5KU0JhbGxCZWhhdmlvdXI7IH0gfSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnRyeS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=