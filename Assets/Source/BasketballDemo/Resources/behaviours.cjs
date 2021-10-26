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
        if (csharp_1.UnityEngine.Input.GetMouseButtonDown(0)) {
            this.pressed = Date.now();
        }
        if (csharp_1.UnityEngine.Input.GetMouseButtonUp(0) && this.pressed) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVoYXZpb3Vycy5janMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7Ozs7Ozs7Ozs7QUN0QmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsdUJBQXVCO0FBQ3ZCLGVBQWUsbUJBQU8sQ0FBQywwQ0FBYTtBQUNwQyx3QkFBd0IsbUJBQU8sQ0FBQyxrREFBaUI7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7Ozs7Ozs7Ozs7QUNoQmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QscUJBQXFCO0FBQ3JCLGlCQUFpQixtQkFBTyxDQUFDLHNCQUFRO0FBQ2pDLGlCQUFpQixtQkFBTyxDQUFDLHNCQUFRO0FBQ2pDLGVBQWUsbUJBQU8sQ0FBQywwQ0FBYTtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjs7Ozs7Ozs7OztBQ3JDQTs7Ozs7Ozs7OztBQ0FBOzs7Ozs7VUNBQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7O0FDdEJhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHFCQUFxQixHQUFHLHVCQUF1QjtBQUMvQyx3QkFBd0IsbUJBQU8sQ0FBQyxrREFBaUI7QUFDakQsaURBQWdELEVBQUUscUNBQXFDLHlDQUF5QyxFQUFDO0FBQ2pJLDBCQUEwQixtQkFBTyxDQUFDLHNEQUFtQjtBQUNyRCxtREFBa0QsRUFBRSxxQ0FBcUMsNkNBQTZDLEVBQUM7QUFDdkksaUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90c3NvdXJjZS8uL291dHB1dC9CYXNlL2Jhc2UuanMiLCJ3ZWJwYWNrOi8vdHNzb3VyY2UvLi9vdXRwdXQvSlNCYWxsQmVoYXZpb3VyLmpzIiwid2VicGFjazovL3Rzc291cmNlLy4vb3V0cHV0L0pTR2FtZU1hbmFnZXIuanMiLCJ3ZWJwYWNrOi8vdHNzb3VyY2UvZXh0ZXJuYWwgY29tbW9uanMgXCJjc2hhcnBcIiIsIndlYnBhY2s6Ly90c3NvdXJjZS9leHRlcm5hbCBjb21tb25qcyBcInB1ZXJ0c1wiIiwid2VicGFjazovL3Rzc291cmNlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3Rzc291cmNlLy4vb3V0cHV0L2VudHJ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Kc0JlaGF2aW91ciA9IHZvaWQgMDtcbmNsYXNzIEpzQmVoYXZpb3VyIHtcbiAgICBjb25zdHJ1Y3RvcihtYikge1xuICAgICAgICAvLyBtb25vLkpzXG4gICAgICAgIHRoaXMuX21iID0gbWI7XG4gICAgICAgIGlmICh0aGlzLlN0YXJ0ICE9IEpzQmVoYXZpb3VyLnByb3RvdHlwZS5TdGFydCkge1xuICAgICAgICAgICAgbWIuSnNTdGFydCA9IHRoaXMuU3RhcnQuYmluZCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5VcGRhdGUgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLlVwZGF0ZSkge1xuICAgICAgICAgICAgbWIuSnNVcGRhdGUgPSB0aGlzLlVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLk9uVHJpZ2dlckVudGVyICE9IEpzQmVoYXZpb3VyLnByb3RvdHlwZS5PblRyaWdnZXJFbnRlcikge1xuICAgICAgICAgICAgbWIuSnNPblRyaWdnZXJFbnRlciA9IHRoaXMuT25UcmlnZ2VyRW50ZXIuYmluZCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBTdGFydCgpIHsgfVxuICAgIFVwZGF0ZSgpIHsgfVxuICAgIE9uVHJpZ2dlckVudGVyKG90aGVyKSB7IH1cbn1cbmV4cG9ydHMuSnNCZWhhdmlvdXIgPSBKc0JlaGF2aW91cjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJhc2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkpTQmFsbEJlaGF2aW91ciA9IHZvaWQgMDtcbmNvbnN0IGJhc2VfMSA9IHJlcXVpcmUoXCIuL0Jhc2UvYmFzZVwiKTtcbmNvbnN0IEpTR2FtZU1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuL0pTR2FtZU1hbmFnZXJcIik7XG5jbGFzcyBKU0JhbGxCZWhhdmlvdXIgZXh0ZW5kcyBiYXNlXzEuSnNCZWhhdmlvdXIge1xuICAgIE9uVHJpZ2dlckVudGVyKHRyaWdnZXIpIHtcbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlcl8xLkpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlByZXNjb3JlVHJpZ2dlcikge1xuICAgICAgICAgICAgdGhpcy5wcmVzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlcl8xLkpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlNjb3JlZFRyaWdnZXIgJiYgdGhpcy5wcmVzY29yZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLlvpfliIZcIik7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkpTQmFsbEJlaGF2aW91ciA9IEpTQmFsbEJlaGF2aW91cjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUpTQmFsbEJlaGF2aW91ci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSlNHYW1lTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IGNzaGFycF8xID0gcmVxdWlyZShcImNzaGFycFwiKTtcbmNvbnN0IHB1ZXJ0c18xID0gcmVxdWlyZShcInB1ZXJ0c1wiKTtcbmNvbnN0IGJhc2VfMSA9IHJlcXVpcmUoXCIuL0Jhc2UvYmFzZVwiKTtcbmNsYXNzIEpTR2FtZU1hbmFnZXIgZXh0ZW5kcyBiYXNlXzEuSnNCZWhhdmlvdXIge1xuICAgIFN0YXJ0KCkge1xuICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICBKU0dhbWVNYW5hZ2VyLmluc3RhbmNlID0gdGhpcztcbiAgICB9XG4gICAgVXBkYXRlKCkge1xuICAgICAgICBjb25zdCBleHBlY3RQcmVzc1RpbWVNYXggPSAxMDAwO1xuICAgICAgICBpZiAoY3NoYXJwXzEuVW5pdHlFbmdpbmUuSW5wdXQuR2V0TW91c2VCdXR0b25Eb3duKDApKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSBEYXRlLm5vdygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjc2hhcnBfMS5Vbml0eUVuZ2luZS5JbnB1dC5HZXRNb3VzZUJ1dHRvblVwKDApICYmIHRoaXMucHJlc3NlZCkge1xuICAgICAgICAgICAgdGhpcy5zaG9vdEJhbGwoTWF0aC5taW4oZXhwZWN0UHJlc3NUaW1lTWF4LCBEYXRlLm5vdygpIC0gdGhpcy5wcmVzc2VkKSAvIGV4cGVjdFByZXNzVGltZU1heCk7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob290QmFsbChwb3dlcikge1xuICAgICAgICBjb25zdCByaWdpZGJvZHkgPSB0aGlzLmN1cnJlbnRCYWxsLkdldENvbXBvbmVudCgoMCwgcHVlcnRzXzEuJHR5cGVvZikoY3NoYXJwXzEuVW5pdHlFbmdpbmUuUmlnaWRib2R5KSk7XG4gICAgICAgIHJpZ2lkYm9keS5pc0tpbmVtYXRpYyA9IGZhbHNlO1xuICAgICAgICByaWdpZGJvZHkudmVsb2NpdHkgPSBuZXcgY3NoYXJwXzEuVW5pdHlFbmdpbmUuVmVjdG9yMygxICsgMiAqIHBvd2VyLCAzICsgNiAqIHBvd2VyLCAwKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cbiAgICBzcGF3bkJhbGwoKSB7XG4gICAgICAgIGNvbnN0IGJhbGwgPSB0aGlzLmN1cnJlbnRCYWxsID0gY3NoYXJwXzEuVW5pdHlFbmdpbmUuT2JqZWN0Lkluc3RhbnRpYXRlKHRoaXMuX21iLkJhbGxQcmVmYWIpO1xuICAgICAgICBiYWxsLnRyYW5zZm9ybS5wb3NpdGlvbiA9IHRoaXMuX21iLkJhbGxTcGF3blBvaW50LnRyYW5zZm9ybS5wb3NpdGlvbjtcbiAgICAgICAgY29uc3QgcmlnaWRib2R5ID0gYmFsbC5HZXRDb21wb25lbnQoKDAsIHB1ZXJ0c18xLiR0eXBlb2YpKGNzaGFycF8xLlVuaXR5RW5naW5lLlJpZ2lkYm9keSkpO1xuICAgICAgICByaWdpZGJvZHkuaXNLaW5lbWF0aWMgPSB0cnVlO1xuICAgIH1cbn1cbmV4cG9ydHMuSlNHYW1lTWFuYWdlciA9IEpTR2FtZU1hbmFnZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1KU0dhbWVNYW5hZ2VyLmpzLm1hcCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImNzaGFycFwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJwdWVydHNcIik7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5KU0dhbWVNYW5hZ2VyID0gZXhwb3J0cy5KU0JhbGxCZWhhdmlvdXIgPSB2b2lkIDA7XG5jb25zdCBKU0dhbWVNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi9KU0dhbWVNYW5hZ2VyXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiSlNHYW1lTWFuYWdlclwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gSlNHYW1lTWFuYWdlcl8xLkpTR2FtZU1hbmFnZXI7IH0gfSk7XG5jb25zdCBKU0JhbGxCZWhhdmlvdXJfMSA9IHJlcXVpcmUoXCIuL0pTQmFsbEJlaGF2aW91clwiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIkpTQmFsbEJlaGF2aW91clwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gSlNCYWxsQmVoYXZpb3VyXzEuSlNCYWxsQmVoYXZpb3VyOyB9IH0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZW50cnkuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9