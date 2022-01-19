/******/ var __webpack_modules__ = ({

/***/ "./output/Base/base.js":
/*!*****************************!*\
  !*** ./output/Base/base.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JsBehaviour": () => (/* binding */ JsBehaviour)
/* harmony export */ });
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

//# sourceMappingURL=base.js.map

/***/ }),

/***/ "./output/JSBallBehaviour.js":
/*!***********************************!*\
  !*** ./output/JSBallBehaviour.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JSBallBehaviour": () => (/* binding */ JSBallBehaviour)
/* harmony export */ });
/* harmony import */ var _Base_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Base/base */ "./output/Base/base.js");
/* harmony import */ var _JSGameManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./JSGameManager */ "./output/JSGameManager.js");


class JSBallBehaviour extends _Base_base__WEBPACK_IMPORTED_MODULE_0__.JsBehaviour {
    OnTriggerEnter(trigger) {
        if (trigger == _JSGameManager__WEBPACK_IMPORTED_MODULE_1__.JSGameManager.instance._mb.PrescoreTrigger) {
            this.prescore = true;
        }
        if (trigger == _JSGameManager__WEBPACK_IMPORTED_MODULE_1__.JSGameManager.instance._mb.ScoredTrigger && this.prescore) {
            console.log("得分");
        }
    }
}

//# sourceMappingURL=JSBallBehaviour.js.map

/***/ }),

/***/ "./output/JSGameManager.js":
/*!*********************************!*\
  !*** ./output/JSGameManager.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JSGameManager": () => (/* binding */ JSGameManager)
/* harmony export */ });
/* harmony import */ var csharp__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! csharp */ "csharp");
/* harmony import */ var csharp__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(csharp__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var puerts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! puerts */ "puerts");
/* harmony import */ var puerts__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(puerts__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _Base_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Base/base */ "./output/Base/base.js");



class JSGameManager extends _Base_base__WEBPACK_IMPORTED_MODULE_2__.JsBehaviour {
    Start() {
        this.spawnBall();
        JSGameManager.instance = this;
    }
    Update() {
        const expectPressTimeMax = 1000;
        if (!this.pressed && (csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.GetMouseButtonDown(0) || csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.touchCount != 0)) {
            this.pressed = Date.now();
            if (csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.touchCount) {
                this.useTouch = true;
            }
        }
        if (this.pressed && (this.useTouch ? csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.touchCount == 0 : csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.GetMouseButtonUp(0))) {
            this.shootBall(Math.min(expectPressTimeMax, Date.now() - this.pressed) / expectPressTimeMax);
            this.pressed = 0;
        }
    }
    shootBall(power) {
        const rigidbody = this.currentBall.GetComponent((0,puerts__WEBPACK_IMPORTED_MODULE_1__.$typeof)(csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Rigidbody));
        rigidbody.isKinematic = false;
        rigidbody.velocity = new csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Vector3(1 + 2 * power, 3 + 6 * power, 0);
        setTimeout(() => {
            this.spawnBall();
        }, 500);
    }
    spawnBall() {
        const ball = this.currentBall = csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Object.Instantiate(this._mb.BallPrefab);
        ball.transform.position = this._mb.BallSpawnPoint.transform.position;
        const rigidbody = ball.GetComponent((0,puerts__WEBPACK_IMPORTED_MODULE_1__.$typeof)(csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Rigidbody));
        rigidbody.isKinematic = true;
    }
}

//# sourceMappingURL=JSGameManager.js.map

/***/ }),

/***/ "csharp":
/*!*************************!*\
  !*** external "csharp" ***!
  \*************************/
/***/ ((module) => {

module.exports = csharp;

/***/ }),

/***/ "puerts":
/*!*************************!*\
  !*** external "puerts" ***!
  \*************************/
/***/ ((module) => {

module.exports = puerts;

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*************************!*\
  !*** ./output/entry.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JSBallBehaviour": () => (/* binding */ JSBallBehaviourFactory),
/* harmony export */   "JSGameManager": () => (/* binding */ JSGameManagerFactory)
/* harmony export */ });
/* harmony import */ var _JSGameManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./JSGameManager */ "./output/JSGameManager.js");
/* harmony import */ var _JSBallBehaviour__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./JSBallBehaviour */ "./output/JSBallBehaviour.js");


function makeFactory(cls) {
    return function (...args) {
        return new cls(...args);
    };
}
const JSBallBehaviourFactory = makeFactory(_JSBallBehaviour__WEBPACK_IMPORTED_MODULE_1__.JSBallBehaviour);
const JSGameManagerFactory = makeFactory(_JSGameManager__WEBPACK_IMPORTED_MODULE_0__.JSGameManager);

//# sourceMappingURL=entry.js.map
})();

var __webpack_exports__JSBallBehaviour = __webpack_exports__.JSBallBehaviour;
var __webpack_exports__JSGameManager = __webpack_exports__.JSGameManager;
export { __webpack_exports__JSBallBehaviour as JSBallBehaviour, __webpack_exports__JSGameManager as JSGameManager };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVoYXZpb3Vycy5tanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ3VCO0FBQ3ZCOzs7Ozs7Ozs7Ozs7Ozs7O0FDbkIwQztBQUNNO0FBQ2hELDhCQUE4QixtREFBVztBQUN6QztBQUNBLHVCQUF1QixzRkFBMEM7QUFDakU7QUFDQTtBQUNBLHVCQUF1QixvRkFBd0M7QUFDL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDMkI7QUFDM0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNicUM7QUFDSjtBQUNTO0FBQzFDLDRCQUE0QixtREFBVztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsd0VBQW9DLE9BQU8sZ0VBQTRCO0FBQ3JHO0FBQ0EsZ0JBQWdCLGdFQUE0QjtBQUM1QztBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsZ0VBQTRCLFFBQVEsc0VBQWtDO0FBQ25IO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3REFBd0QsK0NBQU8sQ0FBQyx5REFBcUI7QUFDckY7QUFDQSxpQ0FBaUMsdURBQW1CO0FBQ3BEO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLHdDQUF3QyxrRUFBOEI7QUFDdEU7QUFDQSw0Q0FBNEMsK0NBQU8sQ0FBQyx5REFBcUI7QUFDekU7QUFDQTtBQUNBO0FBQ3lCO0FBQ3pCOzs7Ozs7Ozs7O0FDckNBOzs7Ozs7Ozs7O0FDQUE7Ozs7OztTQ0FBO1NBQ0E7O1NBRUE7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7O1NBRUE7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7Ozs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQSxpQ0FBaUMsV0FBVztVQUM1QztVQUNBOzs7OztVQ1BBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EseUNBQXlDLHdDQUF3QztVQUNqRjtVQUNBO1VBQ0E7Ozs7O1VDUEE7Ozs7O1VDQUE7VUFDQTtVQUNBO1VBQ0EsdURBQXVELGlCQUFpQjtVQUN4RTtVQUNBLGdEQUFnRCxhQUFhO1VBQzdEOzs7Ozs7Ozs7Ozs7Ozs7OztBQ05nRDtBQUNJO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsNkRBQWU7QUFDMUQseUNBQXlDLHlEQUFhO0FBQ3NDO0FBQzVGLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L0Jhc2UvYmFzZS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvSlNCYWxsQmVoYXZpb3VyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9KU0dhbWVNYW5hZ2VyLmpzIiwid2VicGFjazovLy9leHRlcm5hbCB2YXIgXCJjc2hhcnBcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgdmFyIFwicHVlcnRzXCIiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovLy8uL291dHB1dC9lbnRyeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBKc0JlaGF2aW91ciB7XHJcbiAgICBjb25zdHJ1Y3RvcihtYikge1xyXG4gICAgICAgIC8vIG1vbm8uSnNcclxuICAgICAgICB0aGlzLl9tYiA9IG1iO1xyXG4gICAgICAgIGlmICh0aGlzLlN0YXJ0ICE9IEpzQmVoYXZpb3VyLnByb3RvdHlwZS5TdGFydCkge1xyXG4gICAgICAgICAgICBtYi5Kc1N0YXJ0ID0gdGhpcy5TdGFydC5iaW5kKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5VcGRhdGUgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLlVwZGF0ZSkge1xyXG4gICAgICAgICAgICBtYi5Kc1VwZGF0ZSA9IHRoaXMuVXBkYXRlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLk9uVHJpZ2dlckVudGVyICE9IEpzQmVoYXZpb3VyLnByb3RvdHlwZS5PblRyaWdnZXJFbnRlcikge1xyXG4gICAgICAgICAgICBtYi5Kc09uVHJpZ2dlckVudGVyID0gdGhpcy5PblRyaWdnZXJFbnRlci5iaW5kKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFN0YXJ0KCkgeyB9XHJcbiAgICBVcGRhdGUoKSB7IH1cclxuICAgIE9uVHJpZ2dlckVudGVyKG90aGVyKSB7IH1cclxufVxyXG5leHBvcnQgeyBKc0JlaGF2aW91ciB9O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYXNlLmpzLm1hcCIsImltcG9ydCB7IEpzQmVoYXZpb3VyIH0gZnJvbSAnLi9CYXNlL2Jhc2UnO1xyXG5pbXBvcnQgeyBKU0dhbWVNYW5hZ2VyIH0gZnJvbSAnLi9KU0dhbWVNYW5hZ2VyJztcclxuY2xhc3MgSlNCYWxsQmVoYXZpb3VyIGV4dGVuZHMgSnNCZWhhdmlvdXIge1xyXG4gICAgT25UcmlnZ2VyRW50ZXIodHJpZ2dlcikge1xyXG4gICAgICAgIGlmICh0cmlnZ2VyID09IEpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlByZXNjb3JlVHJpZ2dlcikge1xyXG4gICAgICAgICAgICB0aGlzLnByZXNjb3JlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlci5pbnN0YW5jZS5fbWIuU2NvcmVkVHJpZ2dlciAmJiB0aGlzLnByZXNjb3JlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5b6X5YiGXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnQgeyBKU0JhbGxCZWhhdmlvdXIgfTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SlNCYWxsQmVoYXZpb3VyLmpzLm1hcCIsImltcG9ydCB7IFVuaXR5RW5naW5lIH0gZnJvbSAnY3NoYXJwJztcclxuaW1wb3J0IHsgJHR5cGVvZiB9IGZyb20gJ3B1ZXJ0cyc7XHJcbmltcG9ydCB7IEpzQmVoYXZpb3VyIH0gZnJvbSAnLi9CYXNlL2Jhc2UnO1xyXG5jbGFzcyBKU0dhbWVNYW5hZ2VyIGV4dGVuZHMgSnNCZWhhdmlvdXIge1xyXG4gICAgU3RhcnQoKSB7XHJcbiAgICAgICAgdGhpcy5zcGF3bkJhbGwoKTtcclxuICAgICAgICBKU0dhbWVNYW5hZ2VyLmluc3RhbmNlID0gdGhpcztcclxuICAgIH1cclxuICAgIFVwZGF0ZSgpIHtcclxuICAgICAgICBjb25zdCBleHBlY3RQcmVzc1RpbWVNYXggPSAxMDAwO1xyXG4gICAgICAgIGlmICghdGhpcy5wcmVzc2VkICYmIChVbml0eUVuZ2luZS5JbnB1dC5HZXRNb3VzZUJ1dHRvbkRvd24oMCkgfHwgVW5pdHlFbmdpbmUuSW5wdXQudG91Y2hDb3VudCAhPSAwKSkge1xyXG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICBpZiAoVW5pdHlFbmdpbmUuSW5wdXQudG91Y2hDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VUb3VjaCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMucHJlc3NlZCAmJiAodGhpcy51c2VUb3VjaCA/IFVuaXR5RW5naW5lLklucHV0LnRvdWNoQ291bnQgPT0gMCA6IFVuaXR5RW5naW5lLklucHV0LkdldE1vdXNlQnV0dG9uVXAoMCkpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvb3RCYWxsKE1hdGgubWluKGV4cGVjdFByZXNzVGltZU1heCwgRGF0ZS5ub3coKSAtIHRoaXMucHJlc3NlZCkgLyBleHBlY3RQcmVzc1RpbWVNYXgpO1xyXG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNob290QmFsbChwb3dlcikge1xyXG4gICAgICAgIGNvbnN0IHJpZ2lkYm9keSA9IHRoaXMuY3VycmVudEJhbGwuR2V0Q29tcG9uZW50KCR0eXBlb2YoVW5pdHlFbmdpbmUuUmlnaWRib2R5KSk7XHJcbiAgICAgICAgcmlnaWRib2R5LmlzS2luZW1hdGljID0gZmFsc2U7XHJcbiAgICAgICAgcmlnaWRib2R5LnZlbG9jaXR5ID0gbmV3IFVuaXR5RW5naW5lLlZlY3RvcjMoMSArIDIgKiBwb3dlciwgMyArIDYgKiBwb3dlciwgMCk7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Bhd25CYWxsKCk7XHJcbiAgICAgICAgfSwgNTAwKTtcclxuICAgIH1cclxuICAgIHNwYXduQmFsbCgpIHtcclxuICAgICAgICBjb25zdCBiYWxsID0gdGhpcy5jdXJyZW50QmFsbCA9IFVuaXR5RW5naW5lLk9iamVjdC5JbnN0YW50aWF0ZSh0aGlzLl9tYi5CYWxsUHJlZmFiKTtcclxuICAgICAgICBiYWxsLnRyYW5zZm9ybS5wb3NpdGlvbiA9IHRoaXMuX21iLkJhbGxTcGF3blBvaW50LnRyYW5zZm9ybS5wb3NpdGlvbjtcclxuICAgICAgICBjb25zdCByaWdpZGJvZHkgPSBiYWxsLkdldENvbXBvbmVudCgkdHlwZW9mKFVuaXR5RW5naW5lLlJpZ2lkYm9keSkpO1xyXG4gICAgICAgIHJpZ2lkYm9keS5pc0tpbmVtYXRpYyA9IHRydWU7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IHsgSlNHYW1lTWFuYWdlciB9O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1KU0dhbWVNYW5hZ2VyLmpzLm1hcCIsIm1vZHVsZS5leHBvcnRzID0gY3NoYXJwOyIsIm1vZHVsZS5leHBvcnRzID0gcHVlcnRzOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBKU0dhbWVNYW5hZ2VyIH0gZnJvbSBcIi4vSlNHYW1lTWFuYWdlclwiO1xyXG5pbXBvcnQgeyBKU0JhbGxCZWhhdmlvdXIgfSBmcm9tIFwiLi9KU0JhbGxCZWhhdmlvdXJcIjtcclxuZnVuY3Rpb24gbWFrZUZhY3RvcnkoY2xzKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICByZXR1cm4gbmV3IGNscyguLi5hcmdzKTtcclxuICAgIH07XHJcbn1cclxuY29uc3QgSlNCYWxsQmVoYXZpb3VyRmFjdG9yeSA9IG1ha2VGYWN0b3J5KEpTQmFsbEJlaGF2aW91cik7XHJcbmNvbnN0IEpTR2FtZU1hbmFnZXJGYWN0b3J5ID0gbWFrZUZhY3RvcnkoSlNHYW1lTWFuYWdlcik7XHJcbmV4cG9ydCB7IEpTQmFsbEJlaGF2aW91ckZhY3RvcnkgYXMgSlNCYWxsQmVoYXZpb3VyLCBKU0dhbWVNYW5hZ2VyRmFjdG9yeSBhcyBKU0dhbWVNYW5hZ2VyIH07XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVudHJ5LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==