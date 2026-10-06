/**
  * This file contains the Bottleneck library (MIT), compiled to ES2017, and without Clustering support.
  * https://github.com/SGrondin/bottleneck
  */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Bottleneck = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
	  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
	  var f = n.default;
		if (typeof f == "function") {
			var a = function a () {
				var isInstance = false;
	      try {
	        isInstance = this instanceof a;
	      } catch {}
				if (isInstance) {
	        return Reflect.construct(f, arguments, this.constructor);
				}
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	/******************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

	var extendStatics = function(d, b) {
	  extendStatics = Object.setPrototypeOf ||
	      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	  return extendStatics(d, b);
	};

	function __extends(d, b) {
	  if (typeof b !== "function" && b !== null)
	      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	  extendStatics(d, b);
	  function __() { this.constructor = d; }
	  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var __assign = function() {
	  __assign = Object.assign || function __assign(t) {
	      for (var s, i = 1, n = arguments.length; i < n; i++) {
	          s = arguments[i];
	          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
	      }
	      return t;
	  };
	  return __assign.apply(this, arguments);
	};

	function __rest(s, e) {
	  var t = {};
	  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	      t[p] = s[p];
	  if (s != null && typeof Object.getOwnPropertySymbols === "function")
	      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
	          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
	              t[p[i]] = s[p[i]];
	      }
	  return t;
	}

	function __decorate(decorators, target, key, desc) {
	  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	  return c > 3 && r && Object.defineProperty(target, key, r), r;
	}

	function __param(paramIndex, decorator) {
	  return function (target, key) { decorator(target, key, paramIndex); }
	}

	function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	  function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
	  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	  var _, done = false;
	  for (var i = decorators.length - 1; i >= 0; i--) {
	      var context = {};
	      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
	      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
	      context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
	      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
	      if (kind === "accessor") {
	          if (result === void 0) continue;
	          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
	          if (_ = accept(result.get)) descriptor.get = _;
	          if (_ = accept(result.set)) descriptor.set = _;
	          if (_ = accept(result.init)) initializers.unshift(_);
	      }
	      else if (_ = accept(result)) {
	          if (kind === "field") initializers.unshift(_);
	          else descriptor[key] = _;
	      }
	  }
	  if (target) Object.defineProperty(target, contextIn.name, descriptor);
	  done = true;
	}
	function __runInitializers(thisArg, initializers, value) {
	  var useValue = arguments.length > 2;
	  for (var i = 0; i < initializers.length; i++) {
	      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	  }
	  return useValue ? value : void 0;
	}
	function __propKey(x) {
	  return typeof x === "symbol" ? x : "".concat(x);
	}
	function __setFunctionName(f, name, prefix) {
	  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
	  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
	}
	function __metadata(metadataKey, metadataValue) {
	  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
	}

	function __awaiter(thisArg, _arguments, P, generator) {
	  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	  return new (P || (P = Promise))(function (resolve, reject) {
	      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	      step((generator = generator.apply(thisArg, _arguments || [])).next());
	  });
	}

	function __generator(thisArg, body) {
	  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
	  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	  function verb(n) { return function (v) { return step([n, v]); }; }
	  function step(op) {
	      if (f) throw new TypeError("Generator is already executing.");
	      while (g && (g = 0, op[0] && (_ = 0)), _) try {
	          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
	          if (y = 0, t) op = [op[0] & 2, t.value];
	          switch (op[0]) {
	              case 0: case 1: t = op; break;
	              case 4: _.label++; return { value: op[1], done: false };
	              case 5: _.label++; y = op[1]; op = [0]; continue;
	              case 7: op = _.ops.pop(); _.trys.pop(); continue;
	              default:
	                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                  if (t[2]) _.ops.pop();
	                  _.trys.pop(); continue;
	          }
	          op = body.call(thisArg, _);
	      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	  }
	}

	var __createBinding = Object.create ? (function(o, m, k, k2) {
	  if (k2 === undefined) k2 = k;
	  var desc = Object.getOwnPropertyDescriptor(m, k);
	  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	  }
	  Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	  if (k2 === undefined) k2 = k;
	  o[k2] = m[k];
	});

	function __exportStar(m, o) {
	  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
	}

	function __values(o) {
	  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
	  if (m) return m.call(o);
	  if (o && typeof o.length === "number") return {
	      next: function () {
	          if (o && i >= o.length) o = void 0;
	          return { value: o && o[i++], done: !o };
	      }
	  };
	  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
	}

	function __read(o, n) {
	  var m = typeof Symbol === "function" && o[Symbol.iterator];
	  if (!m) return o;
	  var i = m.call(o), r, ar = [], e;
	  try {
	      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
	  }
	  catch (error) { e = { error: error }; }
	  finally {
	      try {
	          if (r && !r.done && (m = i["return"])) m.call(i);
	      }
	      finally { if (e) throw e.error; }
	  }
	  return ar;
	}

	/** @deprecated */
	function __spread() {
	  for (var ar = [], i = 0; i < arguments.length; i++)
	      ar = ar.concat(__read(arguments[i]));
	  return ar;
	}

	/** @deprecated */
	function __spreadArrays() {
	  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
	  for (var r = Array(s), k = 0, i = 0; i < il; i++)
	      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
	          r[k] = a[j];
	  return r;
	}

	function __spreadArray(to, from, pack) {
	  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	      if (ar || !(i in from)) {
	          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	          ar[i] = from[i];
	      }
	  }
	  return to.concat(ar || Array.prototype.slice.call(from));
	}

	function __await(v) {
	  return this instanceof __await ? (this.v = v, this) : new __await(v);
	}

	function __asyncGenerator(thisArg, _arguments, generator) {
	  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	  var g = generator.apply(thisArg, _arguments || []), i, q = [];
	  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
	  function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
	  function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
	  function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
	  function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
	  function fulfill(value) { resume("next", value); }
	  function reject(value) { resume("throw", value); }
	  function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
	}

	function __asyncDelegator(o) {
	  var i, p;
	  return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
	  function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
	}

	function __asyncValues(o) {
	  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	  var m = o[Symbol.asyncIterator], i;
	  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
	  function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
	  function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
	}

	function __makeTemplateObject(cooked, raw) {
	  if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
	  return cooked;
	}
	var __setModuleDefault = Object.create ? (function(o, v) {
	  Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	  o["default"] = v;
	};

	var ownKeys = function(o) {
	  ownKeys = Object.getOwnPropertyNames || function (o) {
	    var ar = [];
	    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	    return ar;
	  };
	  return ownKeys(o);
	};

	function __importStar(mod) {
	  if (mod && mod.__esModule) return mod;
	  var result = {};
	  if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	  __setModuleDefault(result, mod);
	  return result;
	}

	function __importDefault(mod) {
	  return (mod && mod.__esModule) ? mod : { default: mod };
	}

	function __classPrivateFieldGet(receiver, state, kind, f) {
	  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
	  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
	  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
	}

	function __classPrivateFieldSet(receiver, state, value, kind, f) {
	  if (kind === "m") throw new TypeError("Private method is not writable");
	  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
	  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
	  return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
	}

	function __classPrivateFieldIn(state, receiver) {
	  if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
	  return typeof state === "function" ? receiver === state : state.has(receiver);
	}

	function __addDisposableResource(env, value, async) {
	  if (value !== null && value !== void 0) {
	    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
	    var dispose, inner;
	    if (async) {
	      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
	      dispose = value[Symbol.asyncDispose];
	    }
	    if (dispose === void 0) {
	      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
	      dispose = value[Symbol.dispose];
	      if (async) inner = dispose;
	    }
	    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
	    if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
	    env.stack.push({ value: value, dispose: dispose, async: async });
	  }
	  else if (async) {
	    env.stack.push({ async: true });
	  }
	  return value;
	}

	var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
	  var e = new Error(message);
	  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
	};

	function __disposeResources(env) {
	  function fail(e) {
	    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
	    env.hasError = true;
	  }
	  var r, s = 0;
	  function next() {
	    while (r = env.stack.pop()) {
	      try {
	        if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
	        if (r.dispose) {
	          var result = r.dispose.call(r.value);
	          if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
	        }
	        else s |= 1;
	      }
	      catch (e) {
	        fail(e);
	      }
	    }
	    if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
	    if (env.hasError) throw env.error;
	  }
	  return next();
	}

	function __rewriteRelativeImportExtension(path, preserveJsx) {
	  if (typeof path === "string" && /^\.\.?\//.test(path)) {
	      return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
	          return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
	      });
	  }
	  return path;
	}

	var tslib_es6 = {
	  __extends,
	  __assign,
	  __rest,
	  __decorate,
	  __param,
	  __esDecorate,
	  __runInitializers,
	  __propKey,
	  __setFunctionName,
	  __metadata,
	  __awaiter,
	  __generator,
	  __createBinding,
	  __exportStar,
	  __values,
	  __read,
	  __spread,
	  __spreadArrays,
	  __spreadArray,
	  __await,
	  __asyncGenerator,
	  __asyncDelegator,
	  __asyncValues,
	  __makeTemplateObject,
	  __importStar,
	  __importDefault,
	  __classPrivateFieldGet,
	  __classPrivateFieldSet,
	  __classPrivateFieldIn,
	  __addDisposableResource,
	  __disposeResources,
	  __rewriteRelativeImportExtension,
	};

	var tslib_es6$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		__addDisposableResource: __addDisposableResource,
		get __assign () { return __assign; },
		__asyncDelegator: __asyncDelegator,
		__asyncGenerator: __asyncGenerator,
		__asyncValues: __asyncValues,
		__await: __await,
		__awaiter: __awaiter,
		__classPrivateFieldGet: __classPrivateFieldGet,
		__classPrivateFieldIn: __classPrivateFieldIn,
		__classPrivateFieldSet: __classPrivateFieldSet,
		__createBinding: __createBinding,
		__decorate: __decorate,
		__disposeResources: __disposeResources,
		__esDecorate: __esDecorate,
		__exportStar: __exportStar,
		__extends: __extends,
		__generator: __generator,
		__importDefault: __importDefault,
		__importStar: __importStar,
		__makeTemplateObject: __makeTemplateObject,
		__metadata: __metadata,
		__param: __param,
		__propKey: __propKey,
		__read: __read,
		__rest: __rest,
		__rewriteRelativeImportExtension: __rewriteRelativeImportExtension,
		__runInitializers: __runInitializers,
		__setFunctionName: __setFunctionName,
		__spread: __spread,
		__spreadArray: __spreadArray,
		__spreadArrays: __spreadArrays,
		__values: __values,
		default: tslib_es6
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(tslib_es6$1);

	var parser = {};

	var hasRequiredParser;

	function requireParser () {
		if (hasRequiredParser) return parser;
		hasRequiredParser = 1;
		Object.defineProperty(parser, "__esModule", { value: true });
		parser.overwrite = parser.load = void 0;
		const load = (received, defaults, onto = {}) => {
		    for (const k in defaults) {
		        onto[k] = received[k] != null ? received[k] : defaults[k];
		    }
		    return onto;
		};
		parser.load = load;
		const overwrite = (received, defaults, onto = {}) => {
		    for (const k in received) {
		        if (defaults[k] !== undefined) {
		            onto[k] = received[k];
		        }
		    }
		    return onto;
		};
		parser.overwrite = overwrite;
		
		return parser;
	}

	var DLList_1;
	var hasRequiredDLList;

	function requireDLList () {
		if (hasRequiredDLList) return DLList_1;
		hasRequiredDLList = 1;
		class DLList {
		    constructor(incr, decr) {
		        this.incr = incr;
		        this.decr = decr;
		        this._first = null;
		        this._last = null;
		        this.length = 0;
		    }
		    push(value) {
		        var _a;
		        this.length++;
		        (_a = this.incr) === null || _a === void 0 ? void 0 : _a.call(this);
		        const node = { value, prev: this._last, next: null };
		        if (this._last) {
		            this._last.next = node;
		            this._last = node;
		        }
		        else {
		            this._first = this._last = node;
		        }
		    }
		    shift() {
		        var _a;
		        if (!this._first) {
		            return;
		        }
		        this.length--;
		        (_a = this.decr) === null || _a === void 0 ? void 0 : _a.call(this);
		        const value = this._first.value;
		        this._first = this._first.next;
		        if (this._first) {
		            this._first.prev = null;
		        }
		        else {
		            this._last = null;
		        }
		        return value;
		    }
		    first() {
		        var _a;
		        return (_a = this._first) === null || _a === void 0 ? void 0 : _a.value;
		    }
		    getArray() {
		        const result = [];
		        let node = this._first;
		        while (node) {
		            result.push(node.value);
		            node = node.next;
		        }
		        return result;
		    }
		    forEachShift(cb) {
		        let node = this.shift();
		        while (node !== undefined) {
		            cb(node);
		            node = this.shift();
		        }
		    }
		    debug() {
		        var _a, _b;
		        const result = [];
		        let node = this._first;
		        while (node) {
		            result.push({
		                value: node.value,
		                prev: (_a = node.prev) === null || _a === void 0 ? void 0 : _a.value,
		                next: (_b = node.next) === null || _b === void 0 ? void 0 : _b.value,
		            });
		            node = node.next;
		        }
		        return result;
		    }
		}
		DLList_1 = DLList;
		
		return DLList_1;
	}

	var Events_1;
	var hasRequiredEvents;

	function requireEvents () {
		if (hasRequiredEvents) return Events_1;
		hasRequiredEvents = 1;
		class Events {
		    constructor(instance) {
		        this.instance = instance;
		        this._events = {};
		        if (this.instance.on || this.instance.once || this.instance.removeAllListeners) {
		            throw new Error("An Emitter already exists for this object");
		        }
		        this.instance.on = (name, cb) => this._addListener(name, "many", cb);
		        this.instance.once = (name, cb) => this._addListener(name, "once", cb);
		        this.instance.removeAllListeners = (name) => {
		            if (name != null) {
		                delete this._events[name];
		            }
		            else {
		                this._events = {};
		            }
		        };
		    }
		    _addListener(name, status, cb) {
		        if (!this._events[name]) {
		            this._events[name] = [];
		        }
		        this._events[name].push({ cb, status });
		        return this.instance;
		    }
		    listenerCount(name) {
		        return this._events[name] ? this._events[name].length : 0;
		    }
		    async trigger(name, ...args) {
		        try {
		            if (name !== "debug") {
		                this.trigger("debug", `Event triggered: ${name}`, args);
		            }
		            if (!this._events[name]) {
		                return;
		            }
		            this._events[name] = this._events[name].filter(listener => listener.status !== "none");
		            const promises = this._events[name].map(async (listener) => {
		                var _a;
		                if (listener.status === "none") {
		                    return;
		                }
		                if (listener.status === "once") {
		                    listener.status = "none";
		                }
		                try {
		                    const returned = (_a = listener.cb) === null || _a === void 0 ? void 0 : _a.call(listener, ...args);
		                    if (typeof (returned === null || returned === void 0 ? void 0 : returned.then) === "function") {
		                        return await returned;
		                    }
		                    else {
		                        return returned;
		                    }
		                }
		                catch (e) {
		                    if (name !== "error") {
		                        this.trigger("error", e);
		                    }
		                    return null;
		                }
		            });
		            const results = await Promise.all(promises);
		            return results.find(x => x != null);
		        }
		        catch (e) {
		            if (name !== "error") {
		                this.trigger("error", e);
		            }
		            return null;
		        }
		    }
		}
		Events_1 = Events;
		
		return Events_1;
	}

	var Queues_1;
	var hasRequiredQueues;

	function requireQueues () {
		if (hasRequiredQueues) return Queues_1;
		hasRequiredQueues = 1;
		const DLList = requireDLList();
		const Events = requireEvents();
		class Queues {
		    constructor(num_priorities) {
		        this._length = 0;
		        this.Events = new Events(this);
		        this._lists = [];
		        for (let i = 0; i < num_priorities; i++) {
		            this._lists.push(new DLList(() => this.incr(), () => this.decr()));
		        }
		    }
		    incr() {
		        if (this._length++ === 0) {
		            this.Events.trigger("leftzero");
		        }
		    }
		    decr() {
		        if (--this._length === 0) {
		            this.Events.trigger("zero");
		        }
		    }
		    push(job) {
		        this._lists[job.options.priority].push(job);
		    }
		    queued(priority) {
		        return priority != null ? this._lists[priority].length : this._length;
		    }
		    shiftAll(fn) {
		        this._lists.forEach(list => list.forEachShift(fn));
		    }
		    getFirst(arr = this._lists) {
		        for (const list of arr) {
		            if (list.length > 0) {
		                return list;
		            }
		        }
		        return new DLList();
		    }
		    shiftLastFrom(priority) {
		        const reversedLists = this._lists.slice(priority).reverse();
		        return this.getFirst(reversedLists).shift();
		    }
		}
		Queues_1 = Queues;
		
		return Queues_1;
	}

	var BottleneckError_1;
	var hasRequiredBottleneckError;

	function requireBottleneckError () {
		if (hasRequiredBottleneckError) return BottleneckError_1;
		hasRequiredBottleneckError = 1;
		class BottleneckError extends Error {
		}
		BottleneckError_1 = BottleneckError;
		
		return BottleneckError_1;
	}

	var Job_1;
	var hasRequiredJob;

	function requireJob () {
		if (hasRequiredJob) return Job_1;
		hasRequiredJob = 1;
		const tslib_1 = require$$0;
		const NUM_PRIORITIES = 10;
		const DEFAULT_PRIORITY = 5;
		const parser = tslib_1.__importStar(requireParser());
		const BottleneckError = requireBottleneckError();
		class Job {
		    constructor(task, args, options, jobDefaults, rejectOnDrop, Events, _states, Promise) {
		        this.task = task;
		        this.args = args;
		        this.rejectOnDrop = rejectOnDrop;
		        this.Events = Events;
		        this._states = _states;
		        this.Promise = Promise;
		        this.retryCount = 0;
		        this.options = parser.load(options, jobDefaults);
		        this.options.priority = this._sanitizePriority(this.options.priority);
		        if (this.options.id === jobDefaults.id) {
		            this.options.id = `${this.options.id}-${this._randomIndex()}`;
		        }
		        this.promise = new this.Promise((resolve, reject) => {
		            this._resolve = resolve;
		            this._reject = reject;
		        });
		    }
		    _sanitizePriority(priority) {
		        const sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
		        if (sProperty < 0)
		            return 0;
		        if (sProperty > NUM_PRIORITIES - 1)
		            return NUM_PRIORITIES - 1;
		        return sProperty;
		    }
		    _randomIndex() {
		        return Math.random().toString(36).slice(2);
		    }
		    doDrop({ error, message = "This job has been dropped by Bottleneck" } = {}) {
		        if (this._states.remove(this.options.id)) {
		            if (this.rejectOnDrop) {
		                this._reject(error !== null && error !== void 0 ? error : new BottleneckError(message));
		            }
		            this.Events.trigger("dropped", {
		                args: this.args,
		                options: this.options,
		                task: this.task,
		                promise: this.promise
		            });
		            return true;
		        }
		        else {
		            return false;
		        }
		    }
		    _assertStatus(expected) {
		        const status = this._states.jobStatus(this.options.id);
		        if (!(status === expected || (expected === "DONE" && status === null))) {
		            throw new BottleneckError(`Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`);
		        }
		    }
		    doReceive() {
		        this._states.start(this.options.id);
		        this.Events.trigger("received", { args: this.args, options: this.options });
		    }
		    doQueue(reachedHWM, blocked) {
		        this._assertStatus("RECEIVED");
		        this._states.next(this.options.id);
		        this.Events.trigger("queued", { args: this.args, options: this.options, reachedHWM, blocked });
		    }
		    doRun() {
		        if (this.retryCount === 0) {
		            this._assertStatus("QUEUED");
		            this._states.next(this.options.id);
		        }
		        else {
		            this._assertStatus("EXECUTING");
		        }
		        this.Events.trigger("scheduled", { args: this.args, options: this.options });
		    }
		    async doExecute(chained, clearGlobalState, run, free) {
		        if (this.retryCount === 0) {
		            this._assertStatus("RUNNING");
		            this._states.next(this.options.id);
		        }
		        else {
		            this._assertStatus("EXECUTING");
		        }
		        const eventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
		        this.Events.trigger("executing", eventInfo);
		        try {
		            const passed = chained != null
		                ? await chained.schedule(this.options, this.task, ...this.args)
		                : await this.task(...this.args);
		            if (clearGlobalState()) {
		                this.doDone(eventInfo);
		                await free(this.options, eventInfo);
		                this._assertStatus("DONE");
		                this._resolve(passed);
		            }
		        }
		        catch (error) {
		            this._onFailure(error, eventInfo, clearGlobalState, run, free);
		        }
		    }
		    doExpire(clearGlobalState, run, free) {
		        if (this._states.jobStatus(this.options.id) === "RUNNING") {
		            this._states.next(this.options.id);
		        }
		        this._assertStatus("EXECUTING");
		        const eventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
		        const error = new BottleneckError(`This job timed out after ${this.options.expiration} ms.`);
		        this._onFailure(error, eventInfo, clearGlobalState, run, free);
		    }
		    async _onFailure(error, eventInfo, clearGlobalState, run, free) {
		        if (clearGlobalState()) {
		            const retry = await this.Events.trigger("failed", error, eventInfo);
		            if (retry != null) {
		                const retryAfter = ~~retry;
		                this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
		                this.retryCount++;
		                run(retryAfter);
		            }
		            else {
		                this.doDone(eventInfo);
		                await free(this.options, eventInfo);
		                this._assertStatus("DONE");
		                this._reject(error);
		            }
		        }
		    }
		    doDone(eventInfo) {
		        this._assertStatus("EXECUTING");
		        this._states.next(this.options.id);
		        this.Events.trigger("done", eventInfo);
		    }
		}
		Job_1 = Job;
		
		return Job_1;
	}

	var LocalDatastore_1;
	var hasRequiredLocalDatastore;

	function requireLocalDatastore () {
		if (hasRequiredLocalDatastore) return LocalDatastore_1;
		hasRequiredLocalDatastore = 1;
		const tslib_1 = require$$0;
		const parser = tslib_1.__importStar(requireParser());
		const BottleneckError = requireBottleneckError();
		class LocalDatastore {
		    constructor(instance, storeOptions, storeInstanceOptions) {
		        this.instance = instance;
		        this.storeOptions = storeOptions;
		        this.clients = {};
		        this._running = 0;
		        this._done = 0;
		        this._unblockTime = 0;
		        this.clientId = this.instance._randomIndex();
		        parser.load(storeInstanceOptions, storeInstanceOptions, this);
		        this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
		        this.ready = this.Promise.resolve();
		        this._startHeartbeat();
		    }
		    _startHeartbeat() {
		        if (!this.heartbeat &&
		            ((this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null) ||
		                (this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null))) {
		            this.heartbeat = setInterval(() => {
		                const now = Date.now();
		                if (this.storeOptions.reservoirRefreshInterval != null &&
		                    now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
		                    this._lastReservoirRefresh = now;
		                    this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
		                    this.instance._drainAll(this.computeCapacity());
		                }
		                if (this.storeOptions.reservoirIncreaseInterval != null &&
		                    now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
		                    const { reservoirIncreaseAmount: amount, reservoirIncreaseMaximum: maximum, reservoir } = this.storeOptions;
		                    this._lastReservoirIncrease = now;
		                    const incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
		                    if (incr > 0) {
		                        this.storeOptions.reservoir += incr;
		                        this.instance._drainAll(this.computeCapacity());
		                    }
		                }
		            }, this.heartbeatInterval);
		            if (this.heartbeat.unref) {
		                this.heartbeat.unref();
		            }
		        }
		        else if (this.heartbeat) {
		            clearInterval(this.heartbeat);
		        }
		    }
		    async __publish__(message) {
		        await this.yieldLoop();
		        this.instance.Events.trigger("message", message.toString());
		    }
		    async __disconnect__(flush) {
		        await this.yieldLoop();
		        if (this.heartbeat) {
		            clearInterval(this.heartbeat);
		        }
		        return this.Promise.resolve();
		    }
		    yieldLoop(t = 0) {
		        return new this.Promise((resolve) => setTimeout(resolve, t));
		    }
		    computePenalty() {
		        var _a;
		        return (_a = this.storeOptions.penalty) !== null && _a !== void 0 ? _a : (15 * this.storeOptions.minTime || 5000);
		    }
		    async __updateSettings__(options) {
		        await this.yieldLoop();
		        parser.overwrite(options, options, this.storeOptions);
		        this._startHeartbeat();
		        this.instance._drainAll(this.computeCapacity());
		        return true;
		    }
		    async __running__() {
		        await this.yieldLoop();
		        return this._running;
		    }
		    async __queued__() {
		        await this.yieldLoop();
		        return this.instance.queued();
		    }
		    async __done__() {
		        await this.yieldLoop();
		        return this._done;
		    }
		    async __groupCheck__(time) {
		        await this.yieldLoop();
		        return (this._nextRequest + this.timeout) < time;
		    }
		    computeCapacity() {
		        const { maxConcurrent, reservoir } = this.storeOptions;
		        if (maxConcurrent != null && reservoir != null) {
		            return Math.min(maxConcurrent - this._running, reservoir);
		        }
		        else if (maxConcurrent != null) {
		            return maxConcurrent - this._running;
		        }
		        else if (reservoir != null) {
		            return reservoir;
		        }
		        else {
		            return null;
		        }
		    }
		    conditionsCheck(weight) {
		        const capacity = this.computeCapacity();
		        return capacity == null || weight <= capacity;
		    }
		    async __incrementReservoir__(incr) {
		        await this.yieldLoop();
		        const reservoir = (this.storeOptions.reservoir += incr);
		        this.instance._drainAll(this.computeCapacity());
		        return reservoir;
		    }
		    async __currentReservoir__() {
		        await this.yieldLoop();
		        return this.storeOptions.reservoir;
		    }
		    isBlocked(now) {
		        return this._unblockTime >= now;
		    }
		    check(weight, now) {
		        return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
		    }
		    async __check__(weight) {
		        await this.yieldLoop();
		        const now = Date.now();
		        return this.check(weight, now);
		    }
		    async __register__(index, weight, expiration) {
		        await this.yieldLoop();
		        const now = Date.now();
		        if (this.conditionsCheck(weight)) {
		            this._running += weight;
		            if (this.storeOptions.reservoir != null) {
		                this.storeOptions.reservoir -= weight;
		            }
		            const wait = Math.max(this._nextRequest - now, 0);
		            this._nextRequest = now + wait + this.storeOptions.minTime;
		            return { success: true, wait, reservoir: this.storeOptions.reservoir };
		        }
		        else {
		            return { success: false };
		        }
		    }
		    strategyIsBlock() {
		        return this.storeOptions.strategy === 3;
		    }
		    async __submit__(queueLength, weight) {
		        await this.yieldLoop();
		        if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
		            throw new BottleneckError(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
		        }
		        const now = Date.now();
		        const reachedHWM = this.storeOptions.highWater != null &&
		            queueLength === this.storeOptions.highWater &&
		            !this.check(weight, now);
		        const blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
		        if (blocked) {
		            this._unblockTime = now + this.computePenalty();
		            this._nextRequest = this._unblockTime + this.storeOptions.minTime;
		            this.instance._dropAllQueued();
		        }
		        return { reachedHWM, blocked, strategy: this.storeOptions.strategy };
		    }
		    async __free__(index, weight) {
		        await this.yieldLoop();
		        this._running -= weight;
		        this._done += weight;
		        this.instance._drainAll(this.computeCapacity());
		        return { running: this._running };
		    }
		}
		LocalDatastore_1 = LocalDatastore;
		
		return LocalDatastore_1;
	}

	var RedisDatastore = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

	var RedisDatastore$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: RedisDatastore
	});

	var require$$5 = /*@__PURE__*/getAugmentedNamespace(RedisDatastore$1);

	var States_1;
	var hasRequiredStates;

	function requireStates () {
		if (hasRequiredStates) return States_1;
		hasRequiredStates = 1;
		const BottleneckError = requireBottleneckError();
		class States {
		    constructor(status) {
		        this.status = status;
		        this._jobs = {};
		        this.counts = this.status.map(() => 0);
		    }
		    next(id) {
		        const current = this._jobs[id];
		        const next = current + 1;
		        if (current != null && next < this.status.length) {
		            this.counts[current]--;
		            this.counts[next]++;
		            this._jobs[id]++;
		        }
		        else if (current != null) {
		            this.counts[current]--;
		            delete this._jobs[id];
		        }
		    }
		    start(id) {
		        const initial = 0;
		        this._jobs[id] = initial;
		        this.counts[initial]++;
		    }
		    remove(id) {
		        const current = this._jobs[id];
		        if (current != null) {
		            this.counts[current]--;
		            delete this._jobs[id];
		        }
		        return current != null;
		    }
		    jobStatus(id) {
		        var _a;
		        return (_a = this.status[this._jobs[id]]) !== null && _a !== void 0 ? _a : null;
		    }
		    statusJobs(status) {
		        if (status != null) {
		            const pos = this.status.indexOf(status);
		            if (pos < 0) {
		                throw new BottleneckError(`status must be one of ${this.status.join(', ')}`);
		            }
		            return Object.keys(this._jobs).filter(k => this._jobs[k] === pos);
		        }
		        else {
		            return Object.keys(this._jobs);
		        }
		    }
		    statusCounts() {
		        return this.counts.reduce((acc, v, i) => {
		            acc[this.status[i]] = v;
		            return acc;
		        }, {});
		    }
		}
		States_1 = States;
		
		return States_1;
	}

	var Sync_1;
	var hasRequiredSync;

	function requireSync () {
		if (hasRequiredSync) return Sync_1;
		hasRequiredSync = 1;
		const DLList = requireDLList();
		class Sync {
		    constructor(name, Promise) {
		        this.name = name;
		        this.Promise = Promise;
		        this._running = 0;
		        this.schedule = (task, ...args) => {
		            let resolve;
		            let reject;
		            const promise = new this.Promise((_resolve, _reject) => {
		                resolve = _resolve;
		                reject = _reject;
		            });
		            this._queue.push({ task, args, resolve: resolve, reject: reject });
		            this._tryToRun();
		            return promise;
		        };
		        this._queue = new DLList();
		    }
		    isEmpty() {
		        return this._queue.length === 0;
		    }
		    async _tryToRun() {
		        if (this._running < 1 && this._queue.length > 0) {
		            this._running++;
		            const { task, args, resolve, reject } = this._queue.shift();
		            let cb;
		            try {
		                const returned = await task(...args);
		                cb = () => resolve(returned);
		            }
		            catch (error) {
		                cb = () => reject(error);
		            }
		            this._running--;
		            this._tryToRun();
		            cb();
		        }
		    }
		}
		Sync_1 = Sync;
		
		return Sync_1;
	}

	var RedisConnection = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

	var RedisConnection$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: RedisConnection
	});

	var require$$11 = /*@__PURE__*/getAugmentedNamespace(RedisConnection$1);

	var Scripts = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

	var Scripts$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: Scripts
	});

	var require$$4 = /*@__PURE__*/getAugmentedNamespace(Scripts$1);

	var Group_1;
	var hasRequiredGroup;

	function requireGroup () {
		if (hasRequiredGroup) return Group_1;
		hasRequiredGroup = 1;
		const tslib_1 = require$$0;
		const parser = tslib_1.__importStar(requireParser());
		const Events_1 = tslib_1.__importDefault(requireEvents());
		const RedisConnection_1 = tslib_1.__importDefault(require$$11);
		const Scripts = tslib_1.__importStar(require$$4);
		class Group {
		    constructor(limiterOptions = {}) {
		        this.limiterOptions = limiterOptions;
		        this.defaults = {
		            timeout: 1000 * 60 * 5,
		            connection: null,
		            Promise: Promise,
		            id: "group-key"
		        };
		        this.instances = {};
		        this.deleteKey = async (key = "") => {
		            const instance = this.instances[key];
		            let deleted = 0;
		            if (this.connection) {
		                deleted = await this.connection.__runCommand__(["del", ...Scripts.allKeys(`${this.id}-${key}`)]);
		            }
		            if (instance != null) {
		                delete this.instances[key];
		                await instance.disconnect();
		            }
		            return instance != null || deleted > 0;
		        };
		        parser.load(this.limiterOptions, this.defaults, this);
		        this.Events = new Events_1.default(this);
		        this.Bottleneck = requireBottleneck();
		        this._startAutoCleanup();
		        this.sharedConnection = this.connection != null;
		        if (this.connection == null && this.limiterOptions.datastore === "redis") {
		            this.connection = new RedisConnection_1.default({ ...this.limiterOptions, Events: this.Events });
		        }
		    }
		    key(key = "") {
		        var _a;
		        return (_a = this.instances[key]) !== null && _a !== void 0 ? _a : (() => {
		            const limiter = this.instances[key] = new this.Bottleneck({
		                ...this.limiterOptions,
		                id: `${this.id}-${key}`,
		                timeout: this.timeout,
		                connection: this.connection
		            });
		            this.Events.trigger("created", limiter, key);
		            return limiter;
		        })();
		    }
		    limiters() {
		        return Object.keys(this.instances).map(k => ({ key: k, limiter: this.instances[k] }));
		    }
		    keys() {
		        return Object.keys(this.instances);
		    }
		    async clusterKeys() {
		        if (this.connection == null) {
		            return this.Promise.resolve(this.keys());
		        }
		        const start = `b_${this.id}-`.length;
		        const end = "_settings".length;
		        const settingsKeys = await this.connection.__scanKeys__(`b_${this.id}-*_settings`);
		        return settingsKeys.map(k => k.slice(start, -end));
		    }
		    _startAutoCleanup() {
		        if (this.interval) {
		            clearInterval(this.interval);
		        }
		        this.interval = setInterval(async () => {
		            const time = Date.now();
		            for (const [k, v] of Object.entries(this.instances)) {
		                try {
		                    if (await v._store.__groupCheck__(time)) {
		                        this.deleteKey(k);
		                    }
		                }
		                catch (e) {
		                    v.Events.trigger("error", e);
		                }
		            }
		        }, this.timeout / 2);
		        if (this.interval.unref) {
		            this.interval.unref();
		        }
		    }
		    updateSettings(options = {}) {
		        parser.overwrite(options, this.defaults, this);
		        parser.overwrite(options, options, this.limiterOptions);
		        if (options.timeout != null) {
		            this._startAutoCleanup();
		        }
		    }
		    disconnect(flush = true) {
		        var _a;
		        if (!this.sharedConnection) {
		            (_a = this.connection) === null || _a === void 0 ? void 0 : _a.disconnect(flush);
		        }
		    }
		}
		Group_1 = Group;
		
		return Group_1;
	}

	var Batcher_1;
	var hasRequiredBatcher;

	function requireBatcher () {
		if (hasRequiredBatcher) return Batcher_1;
		hasRequiredBatcher = 1;
		const tslib_1 = require$$0;
		const parser = tslib_1.__importStar(requireParser());
		const Events = requireEvents();
		class Batcher {
		    constructor(options = {}) {
		        this.options = options;
		        this.defaults = {
		            maxTime: null,
		            maxSize: null,
		            Promise: Promise
		        };
		        this._arr = [];
		        parser.load(this.options, this.defaults, this);
		        this.Events = new Events(this);
		        this._resetPromise();
		        this._lastFlush = Date.now();
		    }
		    _resetPromise() {
		        this._promise = new this.Promise((res) => {
		            this._resolve = res;
		        });
		    }
		    _flush() {
		        if (this._timeout) {
		            clearTimeout(this._timeout);
		        }
		        this._lastFlush = Date.now();
		        this._resolve();
		        this.Events.trigger("batch", this._arr);
		        this._arr = [];
		        this._resetPromise();
		    }
		    add(data) {
		        this._arr.push(data);
		        const ret = this._promise;
		        if (this._arr.length === this.maxSize) {
		            this._flush();
		        }
		        else if (this.maxTime != null && this._arr.length === 1) {
		            this._timeout = setTimeout(() => {
		                this._flush();
		            }, this.maxTime);
		        }
		        return ret;
		    }
		}
		Batcher_1 = Batcher;
		
		return Batcher_1;
	}

	var version = "2.19.7";
	var require$$13 = {
		version: version
	};

	var Bottleneck_1;
	var hasRequiredBottleneck;

	function requireBottleneck () {
		if (hasRequiredBottleneck) return Bottleneck_1;
		hasRequiredBottleneck = 1;
		const tslib_1 = require$$0;
		const NUM_PRIORITIES = 10;
		const DEFAULT_PRIORITY = 5;
		const parser = tslib_1.__importStar(requireParser());
		const Queues = requireQueues();
		const Job = requireJob();
		const LocalDatastore = requireLocalDatastore();
		const RedisDatastore = require$$5;
		const Events = requireEvents();
		const States = requireStates();
		const Sync = requireSync();
		class Bottleneck {
		    constructor(options = {}, ...invalid) {
		        this.strategy = Bottleneck.strategy;
		        this.BottleneckError = Bottleneck.BottleneckError;
		        this.jobDefaults = {
		            priority: DEFAULT_PRIORITY,
		            weight: 1,
		            expiration: null,
		            id: "<no-id>"
		        };
		        this.storeDefaults = {
		            maxConcurrent: null,
		            minTime: 0,
		            highWater: null,
		            strategy: Bottleneck.strategy.LEAK,
		            penalty: null,
		            reservoir: null,
		            reservoirRefreshInterval: null,
		            reservoirRefreshAmount: null,
		            reservoirIncreaseInterval: null,
		            reservoirIncreaseAmount: null,
		            reservoirIncreaseMaximum: null
		        };
		        this.localStoreDefaults = {
		            Promise: Promise,
		            timeout: null,
		            heartbeatInterval: 250
		        };
		        this.redisStoreDefaults = {
		            Promise: Promise,
		            timeout: null,
		            heartbeatInterval: 5000,
		            clientTimeout: 10000,
		            Redis: null,
		            clientOptions: {},
		            clusterNodes: null,
		            clearDatastore: false,
		            connection: null
		        };
		        this.instanceDefaults = {
		            datastore: "local",
		            connection: null,
		            id: "<no-id>",
		            rejectOnDrop: true,
		            trackDoneStatus: false,
		            Promise: Promise
		        };
		        this.stopDefaults = {
		            enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
		            dropWaitingJobs: true,
		            dropErrorMessage: "This limiter has been stopped."
		        };
		        this._scheduled = {};
		        this._limiter = null;
		        this._addToQueue = async (job) => {
		            const { args, options } = job;
		            let reachedHWM, blocked, strategy;
		            try {
		                const result = await this._store.__submit__(this.queued(), options.weight);
		                reachedHWM = result.reachedHWM;
		                blocked = result.blocked;
		                strategy = result.strategy;
		            }
		            catch (error) {
		                this.Events.trigger("debug", `Could not queue ${options.id}`, { args, options, error });
		                job.doDrop({ error });
		                return false;
		            }
		            if (blocked) {
		                job.doDrop();
		                return true;
		            }
		            else if (reachedHWM) {
		                let shifted;
		                if (strategy === Bottleneck.strategy.LEAK) {
		                    shifted = this._queues.shiftLastFrom(options.priority);
		                }
		                else if (strategy === Bottleneck.strategy.OVERFLOW_PRIORITY) {
		                    shifted = this._queues.shiftLastFrom(options.priority + 1);
		                }
		                else if (strategy === Bottleneck.strategy.OVERFLOW) {
		                    shifted = job;
		                }
		                if (shifted != null) {
		                    shifted.doDrop();
		                }
		                if (shifted == null || strategy === Bottleneck.strategy.OVERFLOW) {
		                    if (shifted == null) {
		                        job.doDrop();
		                    }
		                    return reachedHWM;
		                }
		            }
		            job.doQueue(reachedHWM, blocked);
		            this._queues.push(job);
		            await this._drainAll();
		            return reachedHWM;
		        };
		        this.version = Bottleneck.version;
		        this._validateOptions(options, invalid);
		        parser.load(options, this.instanceDefaults, this);
		        this._queues = new Queues(NUM_PRIORITIES);
		        this._states = new States(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
		        this.Events = new Events(this);
		        this._submitLock = new Sync("submit", this.Promise);
		        this._registerLock = new Sync("register", this.Promise);
		        const storeOptions = parser.load(options, this.storeDefaults, {});
		        if (this.datastore === "ioredis") {
		            throw new Bottleneck.BottleneckError('The "ioredis" datastore was removed in 3.0.0. Use datastore "redis" with node-redis v4, and "clusterNodes" for Redis Cluster.');
		        }
		        this._store =
		            this.datastore === "redis" || this.connection != null
		                ? (() => {
		                    const storeInstanceOptions = parser.load(options, this.redisStoreDefaults, {});
		                    return new RedisDatastore(this, storeOptions, storeInstanceOptions);
		                })()
		                : this.datastore === "local"
		                    ? (() => {
		                        const storeInstanceOptions = parser.load(options, this.localStoreDefaults, {});
		                        return new LocalDatastore(this, storeOptions, storeInstanceOptions);
		                    })()
		                    : (() => {
		                        throw new Bottleneck.BottleneckError(`Invalid datastore type: ${this.datastore}`);
		                    })();
		        this._queues.on("leftzero", () => { var _a, _b; return (_b = (_a = this._store.heartbeat) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.call(_a); });
		        this._queues.on("zero", () => { var _a, _b; return (_b = (_a = this._store.heartbeat) === null || _a === void 0 ? void 0 : _a.unref) === null || _b === void 0 ? void 0 : _b.call(_a); });
		    }
		    _validateOptions(options, invalid) {
		        if (options == null || typeof options !== "object" || invalid.length !== 0) {
		            throw new Bottleneck.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
		        }
		    }
		    ready() {
		        return this._store.ready;
		    }
		    clients() {
		        return this._store.clients;
		    }
		    channel() {
		        return `b_${this.id}`;
		    }
		    channel_client() {
		        return `b_${this.id}_${this._store.clientId}`;
		    }
		    publish(message) {
		        this._store.__publish__(message);
		    }
		    disconnect(flush = true) {
		        return this._store.__disconnect__(flush);
		    }
		    chain(limiter) {
		        this._limiter = limiter;
		        return this;
		    }
		    queued(priority) {
		        return this._queues.queued(priority);
		    }
		    clusterQueued() {
		        return this._store.__queued__();
		    }
		    empty() {
		        return this.queued() === 0 && this._submitLock.isEmpty();
		    }
		    running() {
		        return this._store.__running__();
		    }
		    done() {
		        return this._store.__done__();
		    }
		    jobStatus(id) {
		        return this._states.jobStatus(id);
		    }
		    jobs(status) {
		        return this._states.statusJobs(status);
		    }
		    counts() {
		        return this._states.statusCounts();
		    }
		    _randomIndex() {
		        return Math.random().toString(36).slice(2);
		    }
		    check(weight = 1) {
		        return this._store.__check__(weight);
		    }
		    _clearGlobalState(index) {
		        if (this._scheduled[index] != null) {
		            clearTimeout(this._scheduled[index].expiration);
		            delete this._scheduled[index];
		            return true;
		        }
		        else {
		            return false;
		        }
		    }
		    async _free(index, job, options, eventInfo) {
		        try {
		            const { running } = await this._store.__free__(index, options.weight);
		            this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
		            if (running === 0 && this.empty()) {
		                this.Events.trigger("idle");
		            }
		        }
		        catch (e) {
		            this.Events.trigger("error", e);
		        }
		    }
		    _run(index, job, wait) {
		        job.doRun();
		        const clearGlobalState = this._clearGlobalState.bind(this, index);
		        const run = this._run.bind(this, index, job);
		        const free = this._free.bind(this, index, job);
		        this._scheduled[index] = {
		            timeout: setTimeout(() => {
		                job.doExecute(this._limiter, clearGlobalState, run, free);
		            }, wait),
		            expiration: job.options.expiration != null ? setTimeout(() => {
		                job.doExpire(clearGlobalState, run, free);
		            }, wait + job.options.expiration) : undefined,
		            job: job
		        };
		    }
		    _drainOne(capacity) {
		        return this._registerLock.schedule(async () => {
		            if (this.queued() === 0) {
		                return null;
		            }
		            const queue = this._queues.getFirst();
		            const next = queue.first();
		            if (next == null) {
		                return null;
		            }
		            const { options, args } = next;
		            if (capacity != null && options.weight > capacity) {
		                return null;
		            }
		            this.Events.trigger("debug", `Draining ${options.id}`, { args, options });
		            const index = this._randomIndex();
		            const { success, wait, reservoir } = await this._store.__register__(index, options.weight, options.expiration);
		            this.Events.trigger("debug", `Drained ${options.id}`, { success, args, options });
		            if (success) {
		                queue.shift();
		                const empty = this.empty();
		                if (empty) {
		                    this.Events.trigger("empty");
		                }
		                if (reservoir === 0) {
		                    this.Events.trigger("depleted", empty);
		                }
		                this._run(index, next, wait);
		                return options.weight;
		            }
		            else {
		                return null;
		            }
		        });
		    }
		    async _drainAll(capacity, total = 0) {
		        try {
		            const drained = await this._drainOne(capacity);
		            if (drained != null) {
		                const newCapacity = capacity != null ? capacity - drained : capacity;
		                return this._drainAll(newCapacity, total + drained);
		            }
		            else {
		                return total;
		            }
		        }
		        catch (e) {
		            this.Events.trigger("error", e);
		            return total;
		        }
		    }
		    _dropAllQueued(message) {
		        this._queues.shiftAll((job) => job.doDrop({ message }));
		    }
		    stop(options = {}) {
		        options = parser.load(options, this.stopDefaults);
		        const waitForExecuting = (at) => {
		            const finished = () => {
		                const counts = this._states.counts;
		                return counts[0] + counts[1] + counts[2] + counts[3] === at;
		            };
		            return new this.Promise((resolve) => {
		                if (finished()) {
		                    resolve();
		                }
		                else {
		                    const handler = () => {
		                        if (finished()) {
		                            this.Events.instance.removeAllListeners("done");
		                            resolve();
		                        }
		                    };
		                    this.Events.instance.on("done", handler);
		                }
		            });
		        };
		        const done = options.dropWaitingJobs
		            ? (() => {
		                this._run = (index, next) => next.doDrop({ message: options.dropErrorMessage });
		                this._drainOne = () => this.Promise.resolve(null);
		                return this._registerLock.schedule(() => this._submitLock.schedule(() => {
		                    for (const [k, v] of Object.entries(this._scheduled)) {
		                        if (this.jobStatus(v.job.options.id) === "RUNNING") {
		                            clearTimeout(v.timeout);
		                            clearTimeout(v.expiration);
		                            v.job.doDrop({ message: options.dropErrorMessage });
		                        }
		                    }
		                    this._dropAllQueued(options.dropErrorMessage);
		                    return waitForExecuting(0);
		                }));
		            })()
		            : this.schedule({ priority: NUM_PRIORITIES - 1, weight: 0 }, () => waitForExecuting(1));
		        this._receive = (job) => {
		            job._reject(new Bottleneck.BottleneckError(options.enqueueErrorMessage));
		            return Promise.resolve();
		        };
		        this.stop = () => this.Promise.reject(new Bottleneck.BottleneckError("stop() has already been called"));
		        return done;
		    }
		    _receive(job) {
		        if (this._states.jobStatus(job.options.id) != null) {
		            job._reject(new Bottleneck.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
		            return Promise.resolve(false);
		        }
		        else {
		            job.doReceive();
		            return this._submitLock.schedule(this._addToQueue, job);
		        }
		    }
		    submit(...args) {
		        let fn, options, cb;
		        if (typeof args[0] === "function") {
		            [fn, ...args] = args;
		            cb = args.pop();
		            options = parser.load({}, this.jobDefaults);
		        }
		        else {
		            [options, fn, ...args] = args;
		            cb = args.pop();
		            options = parser.load(options, this.jobDefaults);
		        }
		        const task = (...taskArgs) => {
		            return new this.Promise((resolve, reject) => {
		                fn(...taskArgs, (...cbArgs) => {
		                    if (cbArgs[0] != null) {
		                        reject(cbArgs);
		                    }
		                    else {
		                        resolve(cbArgs);
		                    }
		                });
		            });
		        };
		        const job = new Job(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
		        job.promise
		            .then((args) => cb === null || cb === void 0 ? void 0 : cb(...args))
		            .catch((args) => {
		            if (Array.isArray(args)) {
		                cb === null || cb === void 0 ? void 0 : cb(...args);
		            }
		            else {
		                cb === null || cb === void 0 ? void 0 : cb(args);
		            }
		        });
		        return this._receive(job);
		    }
		    schedule(...args) {
		        let task, options;
		        if (typeof args[0] === "function") {
		            [task, ...args] = args;
		            options = {};
		        }
		        else {
		            [options, task, ...args] = args;
		        }
		        const job = new Job(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
		        this._receive(job);
		        return job.promise;
		    }
		    wrap(fn) {
		        const schedule = this.schedule.bind(this);
		        const wrapped = function (...args) { return schedule(fn.bind(this), ...args); };
		        wrapped.withOptions = (options, ...args) => schedule(options, fn, ...args);
		        return wrapped;
		    }
		    async updateSettings(options = {}) {
		        await this._store.__updateSettings__(parser.overwrite(options, this.storeDefaults));
		        parser.overwrite(options, this.instanceDefaults, this);
		        return this;
		    }
		    currentReservoir() {
		        return this._store.__currentReservoir__();
		    }
		    incrementReservoir(incr = 0) {
		        return this._store.__incrementReservoir__(incr);
		    }
		}
		// Static properties
		Bottleneck.default = Bottleneck;
		Bottleneck.Events = Events;
		Bottleneck.strategy = { LEAK: 1, OVERFLOW: 2, OVERFLOW_PRIORITY: 4, BLOCK: 3 };
		Bottleneck.BottleneckError = requireBottleneckError();
		Bottleneck.Group = requireGroup();
		Bottleneck.RedisConnection = require$$11;
		Bottleneck.Batcher = requireBatcher();
		Bottleneck.version = Bottleneck.prototype.version = require$$13.version;
		Bottleneck_1 = Bottleneck;
		
		return Bottleneck_1;
	}

	var lib;
	var hasRequiredLib;

	function requireLib () {
		if (hasRequiredLib) return lib;
		hasRequiredLib = 1;
		lib = requireBottleneck();
		
		return lib;
	}

	var libExports = requireLib();
	var index = /*@__PURE__*/getDefaultExportFromCjs(libExports);

	return index;

}));
