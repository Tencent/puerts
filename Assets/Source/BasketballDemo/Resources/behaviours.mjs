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
        //@ts-ignore
        globalThis._puerts_registry && globalThis._puerts_registry.cleanup();
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVoYXZpb3Vycy5tanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ3VCO0FBQ3ZCOzs7Ozs7Ozs7Ozs7Ozs7O0FDbkIwQztBQUNNO0FBQ2hELDhCQUE4QixtREFBVztBQUN6QztBQUNBLHVCQUF1QixzRkFBMEM7QUFDakU7QUFDQTtBQUNBLHVCQUF1QixvRkFBd0M7QUFDL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDMkI7QUFDM0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNicUM7QUFDSjtBQUNTO0FBQzFDLDRCQUE0QixtREFBVztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsd0VBQW9DLE9BQU8sZ0VBQTRCO0FBQ3JHO0FBQ0EsZ0JBQWdCLGdFQUE0QjtBQUM1QztBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsZ0VBQTRCLFFBQVEsc0VBQWtDO0FBQ25IO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELCtDQUFPLENBQUMseURBQXFCO0FBQ3JGO0FBQ0EsaUNBQWlDLHVEQUFtQjtBQUNwRDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSx3Q0FBd0Msa0VBQThCO0FBQ3RFO0FBQ0EsNENBQTRDLCtDQUFPLENBQUMseURBQXFCO0FBQ3pFO0FBQ0E7QUFDQTtBQUN5QjtBQUN6Qjs7Ozs7Ozs7OztBQ3ZDQTs7Ozs7Ozs7OztBQ0FBOzs7Ozs7U0NBQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBOztTQUVBO1NBQ0E7O1NBRUE7U0FDQTtTQUNBOzs7OztVQ3RCQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EsaUNBQWlDLFdBQVc7VUFDNUM7VUFDQTs7Ozs7VUNQQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLHlDQUF5Qyx3Q0FBd0M7VUFDakY7VUFDQTtVQUNBOzs7OztVQ1BBOzs7OztVQ0FBO1VBQ0E7VUFDQTtVQUNBLHVEQUF1RCxpQkFBaUI7VUFDeEU7VUFDQSxnREFBZ0QsYUFBYTtVQUM3RDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOZ0Q7QUFDSTtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLDZEQUFlO0FBQzFELHlDQUF5Qyx5REFBYTtBQUNzQztBQUM1RixpQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL291dHB1dC9CYXNlL2Jhc2UuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L0pTQmFsbEJlaGF2aW91ci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvSlNHYW1lTWFuYWdlci5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgdmFyIFwiY3NoYXJwXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHZhciBcInB1ZXJ0c1wiIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvZW50cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgSnNCZWhhdmlvdXIge1xuICAgIGNvbnN0cnVjdG9yKG1iKSB7XG4gICAgICAgIC8vIG1vbm8uSnNcbiAgICAgICAgdGhpcy5fbWIgPSBtYjtcbiAgICAgICAgaWYgKHRoaXMuU3RhcnQgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLlN0YXJ0KSB7XG4gICAgICAgICAgICBtYi5Kc1N0YXJ0ID0gdGhpcy5TdGFydC5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLlVwZGF0ZSAhPSBKc0JlaGF2aW91ci5wcm90b3R5cGUuVXBkYXRlKSB7XG4gICAgICAgICAgICBtYi5Kc1VwZGF0ZSA9IHRoaXMuVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuT25UcmlnZ2VyRW50ZXIgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLk9uVHJpZ2dlckVudGVyKSB7XG4gICAgICAgICAgICBtYi5Kc09uVHJpZ2dlckVudGVyID0gdGhpcy5PblRyaWdnZXJFbnRlci5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFN0YXJ0KCkgeyB9XG4gICAgVXBkYXRlKCkgeyB9XG4gICAgT25UcmlnZ2VyRW50ZXIob3RoZXIpIHsgfVxufVxuZXhwb3J0IHsgSnNCZWhhdmlvdXIgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJhc2UuanMubWFwIiwiaW1wb3J0IHsgSnNCZWhhdmlvdXIgfSBmcm9tICcuL0Jhc2UvYmFzZSc7XG5pbXBvcnQgeyBKU0dhbWVNYW5hZ2VyIH0gZnJvbSAnLi9KU0dhbWVNYW5hZ2VyJztcbmNsYXNzIEpTQmFsbEJlaGF2aW91ciBleHRlbmRzIEpzQmVoYXZpb3VyIHtcbiAgICBPblRyaWdnZXJFbnRlcih0cmlnZ2VyKSB7XG4gICAgICAgIGlmICh0cmlnZ2VyID09IEpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlByZXNjb3JlVHJpZ2dlcikge1xuICAgICAgICAgICAgdGhpcy5wcmVzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlci5pbnN0YW5jZS5fbWIuU2NvcmVkVHJpZ2dlciAmJiB0aGlzLnByZXNjb3JlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuW+l+WIhlwiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCB7IEpTQmFsbEJlaGF2aW91ciB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SlNCYWxsQmVoYXZpb3VyLmpzLm1hcCIsImltcG9ydCB7IFVuaXR5RW5naW5lIH0gZnJvbSAnY3NoYXJwJztcbmltcG9ydCB7ICR0eXBlb2YgfSBmcm9tICdwdWVydHMnO1xuaW1wb3J0IHsgSnNCZWhhdmlvdXIgfSBmcm9tICcuL0Jhc2UvYmFzZSc7XG5jbGFzcyBKU0dhbWVNYW5hZ2VyIGV4dGVuZHMgSnNCZWhhdmlvdXIge1xuICAgIFN0YXJ0KCkge1xuICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICBKU0dhbWVNYW5hZ2VyLmluc3RhbmNlID0gdGhpcztcbiAgICB9XG4gICAgVXBkYXRlKCkge1xuICAgICAgICBjb25zdCBleHBlY3RQcmVzc1RpbWVNYXggPSAxMDAwO1xuICAgICAgICBpZiAoIXRoaXMucHJlc3NlZCAmJiAoVW5pdHlFbmdpbmUuSW5wdXQuR2V0TW91c2VCdXR0b25Eb3duKDApIHx8IFVuaXR5RW5naW5lLklucHV0LnRvdWNoQ291bnQgIT0gMCkpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBpZiAoVW5pdHlFbmdpbmUuSW5wdXQudG91Y2hDb3VudCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlVG91Y2ggPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByZXNzZWQgJiYgKHRoaXMudXNlVG91Y2ggPyBVbml0eUVuZ2luZS5JbnB1dC50b3VjaENvdW50ID09IDAgOiBVbml0eUVuZ2luZS5JbnB1dC5HZXRNb3VzZUJ1dHRvblVwKDApKSkge1xuICAgICAgICAgICAgdGhpcy5zaG9vdEJhbGwoTWF0aC5taW4oZXhwZWN0UHJlc3NUaW1lTWF4LCBEYXRlLm5vdygpIC0gdGhpcy5wcmVzc2VkKSAvIGV4cGVjdFByZXNzVGltZU1heCk7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICBnbG9iYWxUaGlzLl9wdWVydHNfcmVnaXN0cnkgJiYgZ2xvYmFsVGhpcy5fcHVlcnRzX3JlZ2lzdHJ5LmNsZWFudXAoKTtcbiAgICB9XG4gICAgc2hvb3RCYWxsKHBvd2VyKSB7XG4gICAgICAgIGNvbnN0IHJpZ2lkYm9keSA9IHRoaXMuY3VycmVudEJhbGwuR2V0Q29tcG9uZW50KCR0eXBlb2YoVW5pdHlFbmdpbmUuUmlnaWRib2R5KSk7XG4gICAgICAgIHJpZ2lkYm9keS5pc0tpbmVtYXRpYyA9IGZhbHNlO1xuICAgICAgICByaWdpZGJvZHkudmVsb2NpdHkgPSBuZXcgVW5pdHlFbmdpbmUuVmVjdG9yMygxICsgMiAqIHBvd2VyLCAzICsgNiAqIHBvd2VyLCAwKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cbiAgICBzcGF3bkJhbGwoKSB7XG4gICAgICAgIGNvbnN0IGJhbGwgPSB0aGlzLmN1cnJlbnRCYWxsID0gVW5pdHlFbmdpbmUuT2JqZWN0Lkluc3RhbnRpYXRlKHRoaXMuX21iLkJhbGxQcmVmYWIpO1xuICAgICAgICBiYWxsLnRyYW5zZm9ybS5wb3NpdGlvbiA9IHRoaXMuX21iLkJhbGxTcGF3blBvaW50LnRyYW5zZm9ybS5wb3NpdGlvbjtcbiAgICAgICAgY29uc3QgcmlnaWRib2R5ID0gYmFsbC5HZXRDb21wb25lbnQoJHR5cGVvZihVbml0eUVuZ2luZS5SaWdpZGJvZHkpKTtcbiAgICAgICAgcmlnaWRib2R5LmlzS2luZW1hdGljID0gdHJ1ZTtcbiAgICB9XG59XG5leHBvcnQgeyBKU0dhbWVNYW5hZ2VyIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1KU0dhbWVNYW5hZ2VyLmpzLm1hcCIsIm1vZHVsZS5leHBvcnRzID0gY3NoYXJwOyIsIm1vZHVsZS5leHBvcnRzID0gcHVlcnRzOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBKU0dhbWVNYW5hZ2VyIH0gZnJvbSBcIi4vSlNHYW1lTWFuYWdlclwiO1xuaW1wb3J0IHsgSlNCYWxsQmVoYXZpb3VyIH0gZnJvbSBcIi4vSlNCYWxsQmVoYXZpb3VyXCI7XG5mdW5jdGlvbiBtYWtlRmFjdG9yeShjbHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBjbHMoLi4uYXJncyk7XG4gICAgfTtcbn1cbmNvbnN0IEpTQmFsbEJlaGF2aW91ckZhY3RvcnkgPSBtYWtlRmFjdG9yeShKU0JhbGxCZWhhdmlvdXIpO1xuY29uc3QgSlNHYW1lTWFuYWdlckZhY3RvcnkgPSBtYWtlRmFjdG9yeShKU0dhbWVNYW5hZ2VyKTtcbmV4cG9ydCB7IEpTQmFsbEJlaGF2aW91ckZhY3RvcnkgYXMgSlNCYWxsQmVoYXZpb3VyLCBKU0dhbWVNYW5hZ2VyRmFjdG9yeSBhcyBKU0dhbWVNYW5hZ2VyIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnRyeS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=