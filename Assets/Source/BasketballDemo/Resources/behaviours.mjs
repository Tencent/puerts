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
        if (csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.GetMouseButtonDown(0) || csharp__WEBPACK_IMPORTED_MODULE_0__.UnityEngine.Input.touchCount != 0) {
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

module.exports = require("csharp");

/***/ }),

/***/ "puerts":
/*!*************************!*\
  !*** external "puerts" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("puerts");

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVoYXZpb3Vycy5tanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ3VCO0FBQ3ZCOzs7Ozs7Ozs7Ozs7Ozs7O0FDbkIwQztBQUNNO0FBQ2hELDhCQUE4QixtREFBVztBQUN6QztBQUNBLHVCQUF1QixzRkFBMEM7QUFDakU7QUFDQTtBQUNBLHVCQUF1QixvRkFBd0M7QUFDL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDMkI7QUFDM0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNicUM7QUFDSjtBQUNTO0FBQzFDLDRCQUE0QixtREFBVztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLHdFQUFvQyxPQUFPLGdFQUE0QjtBQUNuRjtBQUNBLGdCQUFnQixnRUFBNEI7QUFDNUM7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDLGdFQUE0QixRQUFRLHNFQUFrQztBQUNuSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELCtDQUFPLENBQUMseURBQXFCO0FBQ3JGO0FBQ0EsaUNBQWlDLHVEQUFtQjtBQUNwRDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSx3Q0FBd0Msa0VBQThCO0FBQ3RFO0FBQ0EsNENBQTRDLCtDQUFPLENBQUMseURBQXFCO0FBQ3pFO0FBQ0E7QUFDQTtBQUN5QjtBQUN6Qjs7Ozs7Ozs7OztBQ3JDQTs7Ozs7Ozs7OztBQ0FBOzs7Ozs7U0NBQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBOztTQUVBO1NBQ0E7O1NBRUE7U0FDQTtTQUNBOzs7OztVQ3RCQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EsaUNBQWlDLFdBQVc7VUFDNUM7VUFDQTs7Ozs7VUNQQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLHlDQUF5Qyx3Q0FBd0M7VUFDakY7VUFDQTtVQUNBOzs7OztVQ1BBOzs7OztVQ0FBO1VBQ0E7VUFDQTtVQUNBLHVEQUF1RCxpQkFBaUI7VUFDeEU7VUFDQSxnREFBZ0QsYUFBYTtVQUM3RDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOZ0Q7QUFDSTtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLDZEQUFlO0FBQzFELHlDQUF5Qyx5REFBYTtBQUNzQztBQUM1RixpQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL291dHB1dC9CYXNlL2Jhc2UuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L0pTQmFsbEJlaGF2aW91ci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvSlNHYW1lTWFuYWdlci5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgY29tbW9uanMyIFwiY3NoYXJwXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIGNvbW1vbmpzMiBcInB1ZXJ0c1wiIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvZW50cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgSnNCZWhhdmlvdXIge1xuICAgIGNvbnN0cnVjdG9yKG1iKSB7XG4gICAgICAgIC8vIG1vbm8uSnNcbiAgICAgICAgdGhpcy5fbWIgPSBtYjtcbiAgICAgICAgaWYgKHRoaXMuU3RhcnQgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLlN0YXJ0KSB7XG4gICAgICAgICAgICBtYi5Kc1N0YXJ0ID0gdGhpcy5TdGFydC5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLlVwZGF0ZSAhPSBKc0JlaGF2aW91ci5wcm90b3R5cGUuVXBkYXRlKSB7XG4gICAgICAgICAgICBtYi5Kc1VwZGF0ZSA9IHRoaXMuVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuT25UcmlnZ2VyRW50ZXIgIT0gSnNCZWhhdmlvdXIucHJvdG90eXBlLk9uVHJpZ2dlckVudGVyKSB7XG4gICAgICAgICAgICBtYi5Kc09uVHJpZ2dlckVudGVyID0gdGhpcy5PblRyaWdnZXJFbnRlci5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFN0YXJ0KCkgeyB9XG4gICAgVXBkYXRlKCkgeyB9XG4gICAgT25UcmlnZ2VyRW50ZXIob3RoZXIpIHsgfVxufVxuZXhwb3J0IHsgSnNCZWhhdmlvdXIgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJhc2UuanMubWFwIiwiaW1wb3J0IHsgSnNCZWhhdmlvdXIgfSBmcm9tICcuL0Jhc2UvYmFzZSc7XG5pbXBvcnQgeyBKU0dhbWVNYW5hZ2VyIH0gZnJvbSAnLi9KU0dhbWVNYW5hZ2VyJztcbmNsYXNzIEpTQmFsbEJlaGF2aW91ciBleHRlbmRzIEpzQmVoYXZpb3VyIHtcbiAgICBPblRyaWdnZXJFbnRlcih0cmlnZ2VyKSB7XG4gICAgICAgIGlmICh0cmlnZ2VyID09IEpTR2FtZU1hbmFnZXIuaW5zdGFuY2UuX21iLlByZXNjb3JlVHJpZ2dlcikge1xuICAgICAgICAgICAgdGhpcy5wcmVzY29yZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyaWdnZXIgPT0gSlNHYW1lTWFuYWdlci5pbnN0YW5jZS5fbWIuU2NvcmVkVHJpZ2dlciAmJiB0aGlzLnByZXNjb3JlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuW+l+WIhlwiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCB7IEpTQmFsbEJlaGF2aW91ciB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SlNCYWxsQmVoYXZpb3VyLmpzLm1hcCIsImltcG9ydCB7IFVuaXR5RW5naW5lIH0gZnJvbSAnY3NoYXJwJztcbmltcG9ydCB7ICR0eXBlb2YgfSBmcm9tICdwdWVydHMnO1xuaW1wb3J0IHsgSnNCZWhhdmlvdXIgfSBmcm9tICcuL0Jhc2UvYmFzZSc7XG5jbGFzcyBKU0dhbWVNYW5hZ2VyIGV4dGVuZHMgSnNCZWhhdmlvdXIge1xuICAgIFN0YXJ0KCkge1xuICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICBKU0dhbWVNYW5hZ2VyLmluc3RhbmNlID0gdGhpcztcbiAgICB9XG4gICAgVXBkYXRlKCkge1xuICAgICAgICBjb25zdCBleHBlY3RQcmVzc1RpbWVNYXggPSAxMDAwO1xuICAgICAgICBpZiAoVW5pdHlFbmdpbmUuSW5wdXQuR2V0TW91c2VCdXR0b25Eb3duKDApIHx8IFVuaXR5RW5naW5lLklucHV0LnRvdWNoQ291bnQgIT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChVbml0eUVuZ2luZS5JbnB1dC50b3VjaENvdW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VUb3VjaCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJlc3NlZCAmJiAodGhpcy51c2VUb3VjaCA/IFVuaXR5RW5naW5lLklucHV0LnRvdWNoQ291bnQgPT0gMCA6IFVuaXR5RW5naW5lLklucHV0LkdldE1vdXNlQnV0dG9uVXAoMCkpKSB7XG4gICAgICAgICAgICB0aGlzLnNob290QmFsbChNYXRoLm1pbihleHBlY3RQcmVzc1RpbWVNYXgsIERhdGUubm93KCkgLSB0aGlzLnByZXNzZWQpIC8gZXhwZWN0UHJlc3NUaW1lTWF4KTtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvb3RCYWxsKHBvd2VyKSB7XG4gICAgICAgIGNvbnN0IHJpZ2lkYm9keSA9IHRoaXMuY3VycmVudEJhbGwuR2V0Q29tcG9uZW50KCR0eXBlb2YoVW5pdHlFbmdpbmUuUmlnaWRib2R5KSk7XG4gICAgICAgIHJpZ2lkYm9keS5pc0tpbmVtYXRpYyA9IGZhbHNlO1xuICAgICAgICByaWdpZGJvZHkudmVsb2NpdHkgPSBuZXcgVW5pdHlFbmdpbmUuVmVjdG9yMygxICsgMiAqIHBvd2VyLCAzICsgNiAqIHBvd2VyLCAwKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNwYXduQmFsbCgpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cbiAgICBzcGF3bkJhbGwoKSB7XG4gICAgICAgIGNvbnN0IGJhbGwgPSB0aGlzLmN1cnJlbnRCYWxsID0gVW5pdHlFbmdpbmUuT2JqZWN0Lkluc3RhbnRpYXRlKHRoaXMuX21iLkJhbGxQcmVmYWIpO1xuICAgICAgICBiYWxsLnRyYW5zZm9ybS5wb3NpdGlvbiA9IHRoaXMuX21iLkJhbGxTcGF3blBvaW50LnRyYW5zZm9ybS5wb3NpdGlvbjtcbiAgICAgICAgY29uc3QgcmlnaWRib2R5ID0gYmFsbC5HZXRDb21wb25lbnQoJHR5cGVvZihVbml0eUVuZ2luZS5SaWdpZGJvZHkpKTtcbiAgICAgICAgcmlnaWRib2R5LmlzS2luZW1hdGljID0gdHJ1ZTtcbiAgICB9XG59XG5leHBvcnQgeyBKU0dhbWVNYW5hZ2VyIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1KU0dhbWVNYW5hZ2VyLmpzLm1hcCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImNzaGFycFwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJwdWVydHNcIik7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IEpTR2FtZU1hbmFnZXIgfSBmcm9tIFwiLi9KU0dhbWVNYW5hZ2VyXCI7XG5pbXBvcnQgeyBKU0JhbGxCZWhhdmlvdXIgfSBmcm9tIFwiLi9KU0JhbGxCZWhhdmlvdXJcIjtcbmZ1bmN0aW9uIG1ha2VGYWN0b3J5KGNscykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICByZXR1cm4gbmV3IGNscyguLi5hcmdzKTtcbiAgICB9O1xufVxuY29uc3QgSlNCYWxsQmVoYXZpb3VyRmFjdG9yeSA9IG1ha2VGYWN0b3J5KEpTQmFsbEJlaGF2aW91cik7XG5jb25zdCBKU0dhbWVNYW5hZ2VyRmFjdG9yeSA9IG1ha2VGYWN0b3J5KEpTR2FtZU1hbmFnZXIpO1xuZXhwb3J0IHsgSlNCYWxsQmVoYXZpb3VyRmFjdG9yeSBhcyBKU0JhbGxCZWhhdmlvdXIsIEpTR2FtZU1hbmFnZXJGYWN0b3J5IGFzIEpTR2FtZU1hbmFnZXIgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVudHJ5LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==