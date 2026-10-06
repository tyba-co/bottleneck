/**
  * This file contains the full Bottleneck library (MIT) compiled to ES5.
  * https://github.com/SGrondin/bottleneck
  * It also contains the regenerator-runtime (MIT), necessary for Babel-generated ES5 code to execute promise and async/await code.
  * See the following link for Copyright and License information:
  * https://github.com/facebook/regenerator/blob/master/packages/regenerator-runtime/runtime.js
  */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Bottleneck = factory());
}(this, (function () { 'use strict';

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	function getCjsExportFromNamespace (n) {
		return n && n['default'] || n;
	}

	var runtime = createCommonjsModule(function (module) {
	/**
	 * Copyright (c) 2014-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	!(function(global) {

	  var Op = Object.prototype;
	  var hasOwn = Op.hasOwnProperty;
	  var undefined; // More compressible than void 0.
	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
	  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
	  var runtime = global.regeneratorRuntime;
	  if (runtime) {
	    {
	      // If regeneratorRuntime is defined globally and we're in a module,
	      // make the exports object identical to regeneratorRuntime.
	      module.exports = runtime;
	    }
	    // Don't bother evaluating the rest of this file if the runtime was
	    // already defined globally.
	    return;
	  }

	  // Define the runtime globally (as expected by generated code) as either
	  // module.exports (if we're in a module) or a new, empty object.
	  runtime = global.regeneratorRuntime = module.exports;

	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
	    var generator = Object.create(protoGenerator.prototype);
	    var context = new Context(tryLocsList || []);

	    // The ._invoke method unifies the implementations of the .next,
	    // .throw, and .return methods.
	    generator._invoke = makeInvokeMethod(innerFn, self, context);

	    return generator;
	  }
	  runtime.wrap = wrap;

	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }

	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";

	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};

	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}

	  // This is a polyfill for %IteratorPrototype% for environments that
	  // don't natively support it.
	  var IteratorPrototype = {};
	  IteratorPrototype[iteratorSymbol] = function () {
	    return this;
	  };

	  var getProto = Object.getPrototypeOf;
	  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	  if (NativeIteratorPrototype &&
	      NativeIteratorPrototype !== Op &&
	      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
	    // This environment has a native %IteratorPrototype%; use it instead
	    // of the polyfill.
	    IteratorPrototype = NativeIteratorPrototype;
	  }

	  var Gp = GeneratorFunctionPrototype.prototype =
	    Generator.prototype = Object.create(IteratorPrototype);
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunctionPrototype[toStringTagSymbol] =
	    GeneratorFunction.displayName = "GeneratorFunction";

	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function(method) {
	      prototype[method] = function(arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }

	  runtime.isGeneratorFunction = function(genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor
	      ? ctor === GeneratorFunction ||
	        // For the native GeneratorFunction constructor, the best we can
	        // do is to check its .name property.
	        (ctor.displayName || ctor.name) === "GeneratorFunction"
	      : false;
	  };

	  runtime.mark = function(genFun) {
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	    } else {
	      genFun.__proto__ = GeneratorFunctionPrototype;
	      if (!(toStringTagSymbol in genFun)) {
	        genFun[toStringTagSymbol] = "GeneratorFunction";
	      }
	    }
	    genFun.prototype = Object.create(Gp);
	    return genFun;
	  };

	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `hasOwn.call(value, "__await")` to determine if the yielded value is
	  // meant to be awaited.
	  runtime.awrap = function(arg) {
	    return { __await: arg };
	  };

	  function AsyncIterator(generator) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value &&
	            typeof value === "object" &&
	            hasOwn.call(value, "__await")) {
	          return Promise.resolve(value.__await).then(function(value) {
	            invoke("next", value, resolve, reject);
	          }, function(err) {
	            invoke("throw", err, resolve, reject);
	          });
	        }

	        return Promise.resolve(value).then(function(unwrapped) {
	          // When a yielded Promise is resolved, its final value becomes
	          // the .value of the Promise<{value,done}> result for the
	          // current iteration.
	          result.value = unwrapped;
	          resolve(result);
	        }, function(error) {
	          // If a rejected Promise was yielded, throw the rejection back
	          // into the async generator function so it can be handled there.
	          return invoke("throw", error, resolve, reject);
	        });
	      }
	    }

	    var previousPromise;

	    function enqueue(method, arg) {
	      function callInvokeWithMethodAndArg() {
	        return new Promise(function(resolve, reject) {
	          invoke(method, arg, resolve, reject);
	        });
	      }

	      return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(
	          callInvokeWithMethodAndArg,
	          // Avoid propagating failures to Promises returned by later
	          // invocations of the iterator.
	          callInvokeWithMethodAndArg
	        ) : callInvokeWithMethodAndArg();
	    }

	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }

	  defineIteratorMethods(AsyncIterator.prototype);
	  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
	    return this;
	  };
	  runtime.AsyncIterator = AsyncIterator;

	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
	    var iter = new AsyncIterator(
	      wrap(innerFn, outerFn, self, tryLocsList)
	    );

	    return runtime.isGeneratorFunction(outerFn)
	      ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function(result) {
	          return result.done ? result.value : iter.next();
	        });
	  };

	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;

	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }

	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }

	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }

	      context.method = method;
	      context.arg = arg;

	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          var delegateResult = maybeInvokeDelegate(delegate, context);
	          if (delegateResult) {
	            if (delegateResult === ContinueSentinel) continue;
	            return delegateResult;
	          }
	        }

	        if (context.method === "next") {
	          // Setting context._sent for legacy support of Babel's
	          // function.sent implementation.
	          context.sent = context._sent = context.arg;

	        } else if (context.method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw context.arg;
	          }

	          context.dispatchException(context.arg);

	        } else if (context.method === "return") {
	          context.abrupt("return", context.arg);
	        }

	        state = GenStateExecuting;

	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done
	            ? GenStateCompleted
	            : GenStateSuspendedYield;

	          if (record.arg === ContinueSentinel) {
	            continue;
	          }

	          return {
	            value: record.arg,
	            done: context.done
	          };

	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(context.arg) call above.
	          context.method = "throw";
	          context.arg = record.arg;
	        }
	      }
	    };
	  }

	  // Call delegate.iterator[context.method](context.arg) and handle the
	  // result, either by returning a { value, done } result from the
	  // delegate iterator, or by modifying context.method and context.arg,
	  // setting context.delegate to null, and returning the ContinueSentinel.
	  function maybeInvokeDelegate(delegate, context) {
	    var method = delegate.iterator[context.method];
	    if (method === undefined) {
	      // A .throw or .return when the delegate iterator has no .throw
	      // method always terminates the yield* loop.
	      context.delegate = null;

	      if (context.method === "throw") {
	        if (delegate.iterator.return) {
	          // If the delegate iterator has a return method, give it a
	          // chance to clean up.
	          context.method = "return";
	          context.arg = undefined;
	          maybeInvokeDelegate(delegate, context);

	          if (context.method === "throw") {
	            // If maybeInvokeDelegate(context) changed context.method from
	            // "return" to "throw", let that override the TypeError below.
	            return ContinueSentinel;
	          }
	        }

	        context.method = "throw";
	        context.arg = new TypeError(
	          "The iterator does not provide a 'throw' method");
	      }

	      return ContinueSentinel;
	    }

	    var record = tryCatch(method, delegate.iterator, context.arg);

	    if (record.type === "throw") {
	      context.method = "throw";
	      context.arg = record.arg;
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    var info = record.arg;

	    if (! info) {
	      context.method = "throw";
	      context.arg = new TypeError("iterator result is not an object");
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    if (info.done) {
	      // Assign the result of the finished delegate to the temporary
	      // variable specified by delegate.resultName (see delegateYield).
	      context[delegate.resultName] = info.value;

	      // Resume execution at the desired location (see delegateYield).
	      context.next = delegate.nextLoc;

	      // If context.method was "throw" but the delegate handled the
	      // exception, let the outer generator proceed normally. If
	      // context.method was "next", forget context.arg since it has been
	      // "consumed" by the delegate iterator. If context.method was
	      // "return", allow the original .return call to continue in the
	      // outer generator.
	      if (context.method !== "return") {
	        context.method = "next";
	        context.arg = undefined;
	      }

	    } else {
	      // Re-yield the result returned by the delegate method.
	      return info;
	    }

	    // The delegate iterator is finished, so forget it and continue with
	    // the outer generator.
	    context.delegate = null;
	    return ContinueSentinel;
	  }

	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);

	  Gp[toStringTagSymbol] = "Generator";

	  // A Generator should always return itself as the iterator object when the
	  // @@iterator function is called on it. Some browsers' implementations of the
	  // iterator prototype chain incorrectly implement this, causing the Generator
	  // object to not be returned from this call. This ensures that doesn't happen.
	  // See https://github.com/facebook/regenerator/issues/274 for more details.
	  Gp[iteratorSymbol] = function() {
	    return this;
	  };

	  Gp.toString = function() {
	    return "[object Generator]";
	  };

	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };

	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }

	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }

	    this.tryEntries.push(entry);
	  }

	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }

	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }

	  runtime.keys = function(object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();

	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }

	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };

	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }

	      if (typeof iterable.next === "function") {
	        return iterable;
	      }

	      if (!isNaN(iterable.length)) {
	        var i = -1, next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }

	          next.value = undefined;
	          next.done = true;

	          return next;
	        };

	        return next.next = next;
	      }
	    }

	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  runtime.values = values;

	  function doneResult() {
	    return { value: undefined, done: true };
	  }

	  Context.prototype = {
	    constructor: Context,

	    reset: function(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      // Resetting context._sent for legacy support of Babel's
	      // function.sent implementation.
	      this.sent = this._sent = undefined;
	      this.done = false;
	      this.delegate = null;

	      this.method = "next";
	      this.arg = undefined;

	      this.tryEntries.forEach(resetTryEntry);

	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" &&
	              hasOwn.call(this, name) &&
	              !isNaN(+name.slice(1))) {
	            this[name] = undefined;
	          }
	        }
	      }
	    },

	    stop: function() {
	      this.done = true;

	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }

	      return this.rval;
	    },

	    dispatchException: function(exception) {
	      if (this.done) {
	        throw exception;
	      }

	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;

	        if (caught) {
	          // If the dispatched exception was caught by a catch block,
	          // then let that catch block handle the exception normally.
	          context.method = "next";
	          context.arg = undefined;
	        }

	        return !! caught;
	      }

	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;

	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }

	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");

	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }

	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },

	    abrupt: function(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev &&
	            hasOwn.call(entry, "finallyLoc") &&
	            this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }

	      if (finallyEntry &&
	          (type === "break" ||
	           type === "continue") &&
	          finallyEntry.tryLoc <= arg &&
	          arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }

	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;

	      if (finallyEntry) {
	        this.method = "next";
	        this.next = finallyEntry.finallyLoc;
	        return ContinueSentinel;
	      }

	      return this.complete(record);
	    },

	    complete: function(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }

	      if (record.type === "break" ||
	          record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = this.arg = record.arg;
	        this.method = "return";
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }

	      return ContinueSentinel;
	    },

	    finish: function(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },

	    "catch": function(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }

	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },

	    delegateYield: function(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };

	      if (this.method === "next") {
	        // Deliberately forget the last sent value so that we don't
	        // accidentally pass it on to the delegate.
	        this.arg = undefined;
	      }

	      return ContinueSentinel;
	    }
	  };
	})(
	  // In sloppy mode, unbound `this` refers to the global object, fallback to
	  // Function constructor if we're in global strict mode. That is sadly a form
	  // of indirect eval which violates Content Security Policy.
	  (function() {
	    return this || (typeof self === "object" && self);
	  })() || Function("return this")()
	);
	});

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

	var tslib_1 = {
	    __extends: __extends,
	    __assign: __assign,
	    __rest: __rest,
	    __decorate: __decorate,
	    __param: __param,
	    __esDecorate: __esDecorate,
	    __runInitializers: __runInitializers,
	    __propKey: __propKey,
	    __setFunctionName: __setFunctionName,
	    __metadata: __metadata,
	    __awaiter: __awaiter,
	    __generator: __generator,
	    __createBinding: __createBinding,
	    __exportStar: __exportStar,
	    __values: __values,
	    __read: __read,
	    __spread: __spread,
	    __spreadArrays: __spreadArrays,
	    __spreadArray: __spreadArray,
	    __await: __await,
	    __asyncGenerator: __asyncGenerator,
	    __asyncDelegator: __asyncDelegator,
	    __asyncValues: __asyncValues,
	    __makeTemplateObject: __makeTemplateObject,
	    __importStar: __importStar,
	    __importDefault: __importDefault,
	    __classPrivateFieldGet: __classPrivateFieldGet,
	    __classPrivateFieldSet: __classPrivateFieldSet,
	    __classPrivateFieldIn: __classPrivateFieldIn,
	    __addDisposableResource: __addDisposableResource,
	    __disposeResources: __disposeResources,
	    __rewriteRelativeImportExtension: __rewriteRelativeImportExtension,
	};

	var parser = createCommonjsModule(function (module, exports) {

	  Object.defineProperty(exports, "__esModule", {
	    value: true
	  });
	  exports.overwrite = exports.load = void 0;
	  var load = function load(received, defaults) {
	    var onto = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	    for (var k in defaults) {
	      onto[k] = received[k] != null ? received[k] : defaults[k];
	    }
	    return onto;
	  };
	  exports.load = load;
	  var overwrite = function overwrite(received, defaults) {
	    var onto = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	    for (var k in received) {
	      if (defaults[k] !== undefined) {
	        onto[k] = received[k];
	      }
	    }
	    return onto;
	  };
	  exports.overwrite = overwrite;
	});
	unwrapExports(parser);
	var parser_1 = parser.overwrite;
	var parser_2 = parser.load;

	function _typeof(o) {
	  "@babel/helpers - typeof";

	  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof(o);
	}
	function _classCallCheck(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
	  }
	}
	function _createClass(e, r, t) {
	  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey(t) {
	  var i = _toPrimitive(t, "string");
	  return "symbol" == _typeof(i) ? i : i + "";
	}
	function _toPrimitive(t, r) {
	  if ("object" != _typeof(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var DLList = /*#__PURE__*/function () {
	  function DLList(incr, decr) {
	    _classCallCheck(this, DLList);
	    this.incr = incr;
	    this.decr = decr;
	    this._first = null;
	    this._last = null;
	    this.length = 0;
	  }
	  return _createClass(DLList, [{
	    key: "push",
	    value: function push(value) {
	      var _a;
	      this.length++;
	      (_a = this.incr) === null || _a === void 0 ? void 0 : _a.call(this);
	      var node = {
	        value: value,
	        prev: this._last,
	        next: null
	      };
	      if (this._last) {
	        this._last.next = node;
	        this._last = node;
	      } else {
	        this._first = this._last = node;
	      }
	    }
	  }, {
	    key: "shift",
	    value: function shift() {
	      var _a;
	      if (!this._first) {
	        return;
	      }
	      this.length--;
	      (_a = this.decr) === null || _a === void 0 ? void 0 : _a.call(this);
	      var value = this._first.value;
	      this._first = this._first.next;
	      if (this._first) {
	        this._first.prev = null;
	      } else {
	        this._last = null;
	      }
	      return value;
	    }
	  }, {
	    key: "first",
	    value: function first() {
	      var _a;
	      return (_a = this._first) === null || _a === void 0 ? void 0 : _a.value;
	    }
	  }, {
	    key: "getArray",
	    value: function getArray() {
	      var result = [];
	      var node = this._first;
	      while (node) {
	        result.push(node.value);
	        node = node.next;
	      }
	      return result;
	    }
	  }, {
	    key: "forEachShift",
	    value: function forEachShift(cb) {
	      var node = this.shift();
	      while (node !== undefined) {
	        cb(node);
	        node = this.shift();
	      }
	    }
	  }, {
	    key: "debug",
	    value: function debug() {
	      var _a, _b;
	      var result = [];
	      var node = this._first;
	      while (node) {
	        result.push({
	          value: node.value,
	          prev: (_a = node.prev) === null || _a === void 0 ? void 0 : _a.value,
	          next: (_b = node.next) === null || _b === void 0 ? void 0 : _b.value
	        });
	        node = node.next;
	      }
	      return result;
	    }
	  }]);
	}();
	var DLList_1 = DLList;

	function _typeof$1(o) {
	  "@babel/helpers - typeof";

	  return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$1(o);
	}
	function _regenerator() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () {
	    return this;
	  }), _regeneratorDefine2(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2(e, r, n, t);
	}
	function _classCallCheck$1(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$1(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$1(o.key), o);
	  }
	}
	function _createClass$1(e, r, t) {
	  return r && _defineProperties$1(e.prototype, r), t && _defineProperties$1(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$1(t) {
	  var i = _toPrimitive$1(t, "string");
	  return "symbol" == _typeof$1(i) ? i : i + "";
	}
	function _toPrimitive$1(t, r) {
	  if ("object" != _typeof$1(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$1(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var Events = /*#__PURE__*/function () {
	  function Events(instance) {
	    var _this = this;
	    _classCallCheck$1(this, Events);
	    this.instance = instance;
	    this._events = {};
	    if (this.instance.on || this.instance.once || this.instance.removeAllListeners) {
	      throw new Error("An Emitter already exists for this object");
	    }
	    this.instance.on = function (name, cb) {
	      return _this._addListener(name, "many", cb);
	    };
	    this.instance.once = function (name, cb) {
	      return _this._addListener(name, "once", cb);
	    };
	    this.instance.removeAllListeners = function (name) {
	      if (name != null) {
	        delete _this._events[name];
	      } else {
	        _this._events = {};
	      }
	    };
	  }
	  return _createClass$1(Events, [{
	    key: "_addListener",
	    value: function _addListener(name, status, cb) {
	      if (!this._events[name]) {
	        this._events[name] = [];
	      }
	      this._events[name].push({
	        cb: cb,
	        status: status
	      });
	      return this.instance;
	    }
	  }, {
	    key: "listenerCount",
	    value: function listenerCount(name) {
	      return this._events[name] ? this._events[name].length : 0;
	    }
	  }, {
	    key: "trigger",
	    value: function trigger(name) {
	      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	        args[_key - 1] = arguments[_key];
	      }
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator().m(function _callee2() {
	        var _this2 = this;
	        var promises, results, _t2;
	        return _regenerator().w(function (_context2) {
	          while (1) switch (_context2.p = _context2.n) {
	            case 0:
	              _context2.p = 0;
	              if (name !== "debug") {
	                this.trigger("debug", "Event triggered: ".concat(name), args);
	              }
	              if (this._events[name]) {
	                _context2.n = 1;
	                break;
	              }
	              return _context2.a(2);
	            case 1:
	              this._events[name] = this._events[name].filter(function (listener) {
	                return listener.status !== "none";
	              });
	              promises = this._events[name].map(function (listener) {
	                return tslib_1.__awaiter(_this2, void 0, void 0, /*#__PURE__*/_regenerator().m(function _callee() {
	                  var _a, _a2, returned, _t;
	                  return _regenerator().w(function (_context) {
	                    while (1) switch (_context.p = _context.n) {
	                      case 0:
	                        if (!(listener.status === "none")) {
	                          _context.n = 1;
	                          break;
	                        }
	                        return _context.a(2);
	                      case 1:
	                        if (listener.status === "once") {
	                          listener.status = "none";
	                        }
	                        _context.p = 2;
	                        returned = (_a = listener.cb) === null || _a === void 0 ? void 0 : (_a2 = _a).call.apply(_a2, [listener].concat(args));
	                        if (!(typeof (returned === null || returned === void 0 ? void 0 : returned.then) === "function")) {
	                          _context.n = 4;
	                          break;
	                        }
	                        _context.n = 3;
	                        return returned;
	                      case 3:
	                        return _context.a(2, _context.v);
	                      case 4:
	                        return _context.a(2, returned);
	                      case 5:
	                        _context.n = 7;
	                        break;
	                      case 6:
	                        _context.p = 6;
	                        _t = _context.v;
	                        if (name !== "error") {
	                          this.trigger("error", _t);
	                        }
	                        return _context.a(2, null);
	                      case 7:
	                        return _context.a(2);
	                    }
	                  }, _callee, this, [[2, 6]]);
	                }));
	              });
	              _context2.n = 2;
	              return Promise.all(promises);
	            case 2:
	              results = _context2.v;
	              return _context2.a(2, results.find(function (x) {
	                return x != null;
	              }));
	            case 3:
	              _context2.p = 3;
	              _t2 = _context2.v;
	              if (name !== "error") {
	                this.trigger("error", _t2);
	              }
	              return _context2.a(2, null);
	          }
	        }, _callee2, this, [[0, 3]]);
	      }));
	    }
	  }]);
	}();
	var Events_1 = Events;

	function _typeof$2(o) {
	  "@babel/helpers - typeof";

	  return _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$2(o);
	}
	function _createForOfIteratorHelper(r, e) {
	  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (!t) {
	    if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
	      t && (r = t);
	      var _n = 0,
	        F = function F() {};
	      return {
	        s: F,
	        n: function n() {
	          return _n >= r.length ? {
	            done: !0
	          } : {
	            done: !1,
	            value: r[_n++]
	          };
	        },
	        e: function e(r) {
	          throw r;
	        },
	        f: F
	      };
	    }
	    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	  }
	  var o,
	    a = !0,
	    u = !1;
	  return {
	    s: function s() {
	      t = t.call(r);
	    },
	    n: function n() {
	      var r = t.next();
	      return a = r.done, r;
	    },
	    e: function e(r) {
	      u = !0, o = r;
	    },
	    f: function f() {
	      try {
	        a || null == t["return"] || t["return"]();
	      } finally {
	        if (u) throw o;
	      }
	    }
	  };
	}
	function _unsupportedIterableToArray(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	  }
	}
	function _arrayLikeToArray(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _classCallCheck$2(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$2(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$2(o.key), o);
	  }
	}
	function _createClass$2(e, r, t) {
	  return r && _defineProperties$2(e.prototype, r), t && _defineProperties$2(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$2(t) {
	  var i = _toPrimitive$2(t, "string");
	  return "symbol" == _typeof$2(i) ? i : i + "";
	}
	function _toPrimitive$2(t, r) {
	  if ("object" != _typeof$2(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$2(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var Queues = /*#__PURE__*/function () {
	  function Queues(num_priorities) {
	    var _this = this;
	    _classCallCheck$2(this, Queues);
	    this._length = 0;
	    this.Events = new Events_1(this);
	    this._lists = [];
	    for (var i = 0; i < num_priorities; i++) {
	      this._lists.push(new DLList_1(function () {
	        return _this.incr();
	      }, function () {
	        return _this.decr();
	      }));
	    }
	  }
	  return _createClass$2(Queues, [{
	    key: "incr",
	    value: function incr() {
	      if (this._length++ === 0) {
	        this.Events.trigger("leftzero");
	      }
	    }
	  }, {
	    key: "decr",
	    value: function decr() {
	      if (--this._length === 0) {
	        this.Events.trigger("zero");
	      }
	    }
	  }, {
	    key: "push",
	    value: function push(job) {
	      this._lists[job.options.priority].push(job);
	    }
	  }, {
	    key: "queued",
	    value: function queued(priority) {
	      return priority != null ? this._lists[priority].length : this._length;
	    }
	  }, {
	    key: "shiftAll",
	    value: function shiftAll(fn) {
	      this._lists.forEach(function (list) {
	        return list.forEachShift(fn);
	      });
	    }
	  }, {
	    key: "getFirst",
	    value: function getFirst() {
	      var arr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._lists;
	      var _iterator = _createForOfIteratorHelper(arr),
	        _step;
	      try {
	        for (_iterator.s(); !(_step = _iterator.n()).done;) {
	          var list = _step.value;
	          if (list.length > 0) {
	            return list;
	          }
	        }
	      } catch (err) {
	        _iterator.e(err);
	      } finally {
	        _iterator.f();
	      }
	      return new DLList_1();
	    }
	  }, {
	    key: "shiftLastFrom",
	    value: function shiftLastFrom(priority) {
	      var reversedLists = this._lists.slice(priority).reverse();
	      return this.getFirst(reversedLists).shift();
	    }
	  }]);
	}();
	var Queues_1 = Queues;

	function _typeof$3(o) {
	  "@babel/helpers - typeof";

	  return _typeof$3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$3(o);
	}
	function _defineProperties$3(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$3(o.key), o);
	  }
	}
	function _createClass$3(e, r, t) {
	  return r && _defineProperties$3(e.prototype, r), t && _defineProperties$3(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$3(t) {
	  var i = _toPrimitive$3(t, "string");
	  return "symbol" == _typeof$3(i) ? i : i + "";
	}
	function _toPrimitive$3(t, r) {
	  if ("object" != _typeof$3(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$3(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	function _classCallCheck$3(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _callSuper(t, o, e) {
	  return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
	}
	function _possibleConstructorReturn(t, e) {
	  if (e && ("object" == _typeof$3(e) || "function" == typeof e)) return e;
	  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
	  return _assertThisInitialized(t);
	}
	function _assertThisInitialized(e) {
	  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  return e;
	}
	function _inherits(t, e) {
	  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
	  t.prototype = Object.create(e && e.prototype, {
	    constructor: {
	      value: t,
	      writable: !0,
	      configurable: !0
	    }
	  }), Object.defineProperty(t, "prototype", {
	    writable: !1
	  }), e && _setPrototypeOf(t, e);
	}
	function _wrapNativeSuper(t) {
	  var r = "function" == typeof Map ? new Map() : void 0;
	  return _wrapNativeSuper = function _wrapNativeSuper(t) {
	    if (null === t || !_isNativeFunction(t)) return t;
	    if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function");
	    if (void 0 !== r) {
	      if (r.has(t)) return r.get(t);
	      r.set(t, Wrapper);
	    }
	    function Wrapper() {
	      return _construct(t, arguments, _getPrototypeOf(this).constructor);
	    }
	    return Wrapper.prototype = Object.create(t.prototype, {
	      constructor: {
	        value: Wrapper,
	        enumerable: !1,
	        writable: !0,
	        configurable: !0
	      }
	    }), _setPrototypeOf(Wrapper, t);
	  }, _wrapNativeSuper(t);
	}
	function _construct(t, e, r) {
	  if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
	  var o = [null];
	  o.push.apply(o, e);
	  var p = new (t.bind.apply(t, o))();
	  return r && _setPrototypeOf(p, r.prototype), p;
	}
	function _isNativeReflectConstruct() {
	  try {
	    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
	  } catch (t) {}
	  return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
	    return !!t;
	  })();
	}
	function _isNativeFunction(t) {
	  try {
	    return -1 !== Function.toString.call(t).indexOf("[native code]");
	  } catch (n) {
	    return "function" == typeof t;
	  }
	}
	function _setPrototypeOf(t, e) {
	  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
	    return t.__proto__ = e, t;
	  }, _setPrototypeOf(t, e);
	}
	function _getPrototypeOf(t) {
	  return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
	    return t.__proto__ || Object.getPrototypeOf(t);
	  }, _getPrototypeOf(t);
	}
	var BottleneckError = /*#__PURE__*/function (_Error) {
	  function BottleneckError() {
	    _classCallCheck$3(this, BottleneckError);
	    return _callSuper(this, BottleneckError, arguments);
	  }
	  _inherits(BottleneckError, _Error);
	  return _createClass$3(BottleneckError);
	}(/*#__PURE__*/_wrapNativeSuper(Error));
	var BottleneckError_1 = BottleneckError;

	function _typeof$4(o) {
	  "@babel/helpers - typeof";

	  return _typeof$4 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$4(o);
	}
	function _regenerator$1() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$1(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$1(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$1(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$1(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$1(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$1(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$1(u), _regeneratorDefine2$1(u, o, "Generator"), _regeneratorDefine2$1(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$1(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$1 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$1(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$1 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$1(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$1(e, r, n, t);
	}
	function _toConsumableArray(r) {
	  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray$1(r) || _nonIterableSpread();
	}
	function _nonIterableSpread() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$1(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$1(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$1(r, a) : void 0;
	  }
	}
	function _iterableToArray(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$1(r);
	}
	function _arrayLikeToArray$1(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _classCallCheck$4(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$4(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$4(o.key), o);
	  }
	}
	function _createClass$4(e, r, t) {
	  return r && _defineProperties$4(e.prototype, r), t && _defineProperties$4(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$4(t) {
	  var i = _toPrimitive$4(t, "string");
	  return "symbol" == _typeof$4(i) ? i : i + "";
	}
	function _toPrimitive$4(t, r) {
	  if ("object" != _typeof$4(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$4(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var NUM_PRIORITIES = 10;
	var DEFAULT_PRIORITY = 5;
	var parser$2 = tslib_1.__importStar(parser);
	var Job = /*#__PURE__*/function () {
	  function Job(task, args, options, jobDefaults, rejectOnDrop, Events, _states, Promise) {
	    var _this = this;
	    _classCallCheck$4(this, Job);
	    this.task = task;
	    this.args = args;
	    this.rejectOnDrop = rejectOnDrop;
	    this.Events = Events;
	    this._states = _states;
	    this.Promise = Promise;
	    this.retryCount = 0;
	    this.options = parser$2.load(options, jobDefaults);
	    this.options.priority = this._sanitizePriority(this.options.priority);
	    if (this.options.id === jobDefaults.id) {
	      this.options.id = "".concat(this.options.id, "-").concat(this._randomIndex());
	    }
	    this.promise = new this.Promise(function (resolve, reject) {
	      _this._resolve = resolve;
	      _this._reject = reject;
	    });
	  }
	  return _createClass$4(Job, [{
	    key: "_sanitizePriority",
	    value: function _sanitizePriority(priority) {
	      var sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
	      if (sProperty < 0) return 0;
	      if (sProperty > NUM_PRIORITIES - 1) return NUM_PRIORITIES - 1;
	      return sProperty;
	    }
	  }, {
	    key: "_randomIndex",
	    value: function _randomIndex() {
	      return Math.random().toString(36).slice(2);
	    }
	  }, {
	    key: "doDrop",
	    value: function doDrop() {
	      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	        error = _ref.error,
	        _ref$message = _ref.message,
	        message = _ref$message === void 0 ? "This job has been dropped by Bottleneck" : _ref$message;
	      if (this._states.remove(this.options.id)) {
	        if (this.rejectOnDrop) {
	          this._reject(error !== null && error !== void 0 ? error : new BottleneckError_1(message));
	        }
	        this.Events.trigger("dropped", {
	          args: this.args,
	          options: this.options,
	          task: this.task,
	          promise: this.promise
	        });
	        return true;
	      } else {
	        return false;
	      }
	    }
	  }, {
	    key: "_assertStatus",
	    value: function _assertStatus(expected) {
	      var status = this._states.jobStatus(this.options.id);
	      if (!(status === expected || expected === "DONE" && status === null)) {
	        throw new BottleneckError_1("Invalid job status ".concat(status, ", expected ").concat(expected, ". Please open an issue at https://github.com/SGrondin/bottleneck/issues"));
	      }
	    }
	  }, {
	    key: "doReceive",
	    value: function doReceive() {
	      this._states.start(this.options.id);
	      this.Events.trigger("received", {
	        args: this.args,
	        options: this.options
	      });
	    }
	  }, {
	    key: "doQueue",
	    value: function doQueue(reachedHWM, blocked) {
	      this._assertStatus("RECEIVED");
	      this._states.next(this.options.id);
	      this.Events.trigger("queued", {
	        args: this.args,
	        options: this.options,
	        reachedHWM: reachedHWM,
	        blocked: blocked
	      });
	    }
	  }, {
	    key: "doRun",
	    value: function doRun() {
	      if (this.retryCount === 0) {
	        this._assertStatus("QUEUED");
	        this._states.next(this.options.id);
	      } else {
	        this._assertStatus("EXECUTING");
	      }
	      this.Events.trigger("scheduled", {
	        args: this.args,
	        options: this.options
	      });
	    }
	  }, {
	    key: "doExecute",
	    value: function doExecute(chained, clearGlobalState, run, free) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$1().m(function _callee() {
	        var eventInfo, passed, _t, _t2;
	        return _regenerator$1().w(function (_context) {
	          while (1) switch (_context.p = _context.n) {
	            case 0:
	              if (this.retryCount === 0) {
	                this._assertStatus("RUNNING");
	                this._states.next(this.options.id);
	              } else {
	                this._assertStatus("EXECUTING");
	              }
	              eventInfo = {
	                args: this.args,
	                options: this.options,
	                retryCount: this.retryCount
	              };
	              this.Events.trigger("executing", eventInfo);
	              _context.p = 1;
	              if (!(chained != null)) {
	                _context.n = 3;
	                break;
	              }
	              _context.n = 2;
	              return chained.schedule.apply(chained, [this.options, this.task].concat(_toConsumableArray(this.args)));
	            case 2:
	              _t = _context.v;
	              _context.n = 5;
	              break;
	            case 3:
	              _context.n = 4;
	              return this.task.apply(this, _toConsumableArray(this.args));
	            case 4:
	              _t = _context.v;
	            case 5:
	              passed = _t;
	              if (!clearGlobalState()) {
	                _context.n = 7;
	                break;
	              }
	              this.doDone(eventInfo);
	              _context.n = 6;
	              return free(this.options, eventInfo);
	            case 6:
	              this._assertStatus("DONE");
	              this._resolve(passed);
	            case 7:
	              _context.n = 9;
	              break;
	            case 8:
	              _context.p = 8;
	              _t2 = _context.v;
	              this._onFailure(_t2, eventInfo, clearGlobalState, run, free);
	            case 9:
	              return _context.a(2);
	          }
	        }, _callee, this, [[1, 8]]);
	      }));
	    }
	  }, {
	    key: "doExpire",
	    value: function doExpire(clearGlobalState, run, free) {
	      if (this._states.jobStatus(this.options.id) === "RUNNING") {
	        this._states.next(this.options.id);
	      }
	      this._assertStatus("EXECUTING");
	      var eventInfo = {
	        args: this.args,
	        options: this.options,
	        retryCount: this.retryCount
	      };
	      var error = new BottleneckError_1("This job timed out after ".concat(this.options.expiration, " ms."));
	      this._onFailure(error, eventInfo, clearGlobalState, run, free);
	    }
	  }, {
	    key: "_onFailure",
	    value: function _onFailure(error, eventInfo, clearGlobalState, run, free) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$1().m(function _callee2() {
	        var retry, retryAfter;
	        return _regenerator$1().w(function (_context2) {
	          while (1) switch (_context2.n) {
	            case 0:
	              if (!clearGlobalState()) {
	                _context2.n = 4;
	                break;
	              }
	              _context2.n = 1;
	              return this.Events.trigger("failed", error, eventInfo);
	            case 1:
	              retry = _context2.v;
	              if (!(retry != null)) {
	                _context2.n = 2;
	                break;
	              }
	              retryAfter = ~~retry;
	              this.Events.trigger("retry", "Retrying ".concat(this.options.id, " after ").concat(retryAfter, " ms"), eventInfo);
	              this.retryCount++;
	              run(retryAfter);
	              _context2.n = 4;
	              break;
	            case 2:
	              this.doDone(eventInfo);
	              _context2.n = 3;
	              return free(this.options, eventInfo);
	            case 3:
	              this._assertStatus("DONE");
	              this._reject(error);
	            case 4:
	              return _context2.a(2);
	          }
	        }, _callee2, this);
	      }));
	    }
	  }, {
	    key: "doDone",
	    value: function doDone(eventInfo) {
	      this._assertStatus("EXECUTING");
	      this._states.next(this.options.id);
	      this.Events.trigger("done", eventInfo);
	    }
	  }]);
	}();
	var Job_1 = Job;

	function _typeof$5(o) {
	  "@babel/helpers - typeof";

	  return _typeof$5 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$5(o);
	}
	function _regenerator$2() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$2(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$2(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$2(u), _regeneratorDefine2$2(u, o, "Generator"), _regeneratorDefine2$2(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$2(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$2 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$2(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$2 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$2(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$2(e, r, n, t);
	}
	function _classCallCheck$5(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$5(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$5(o.key), o);
	  }
	}
	function _createClass$5(e, r, t) {
	  return r && _defineProperties$5(e.prototype, r), t && _defineProperties$5(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$5(t) {
	  var i = _toPrimitive$5(t, "string");
	  return "symbol" == _typeof$5(i) ? i : i + "";
	}
	function _toPrimitive$5(t, r) {
	  if ("object" != _typeof$5(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$5(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var parser$3 = tslib_1.__importStar(parser);
	var LocalDatastore = /*#__PURE__*/function () {
	  function LocalDatastore(instance, storeOptions, storeInstanceOptions) {
	    _classCallCheck$5(this, LocalDatastore);
	    this.instance = instance;
	    this.storeOptions = storeOptions;
	    this.clients = {};
	    this._running = 0;
	    this._done = 0;
	    this._unblockTime = 0;
	    this.clientId = this.instance._randomIndex();
	    parser$3.load(storeInstanceOptions, storeInstanceOptions, this);
	    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
	    this.ready = this.Promise.resolve();
	    this._startHeartbeat();
	  }
	  return _createClass$5(LocalDatastore, [{
	    key: "_startHeartbeat",
	    value: function _startHeartbeat() {
	      var _this = this;
	      if (!this.heartbeat && (this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null || this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null)) {
	        this.heartbeat = setInterval(function () {
	          var now = Date.now();
	          if (_this.storeOptions.reservoirRefreshInterval != null && now >= _this._lastReservoirRefresh + _this.storeOptions.reservoirRefreshInterval) {
	            _this._lastReservoirRefresh = now;
	            _this.storeOptions.reservoir = _this.storeOptions.reservoirRefreshAmount;
	            _this.instance._drainAll(_this.computeCapacity());
	          }
	          if (_this.storeOptions.reservoirIncreaseInterval != null && now >= _this._lastReservoirIncrease + _this.storeOptions.reservoirIncreaseInterval) {
	            var _this$storeOptions = _this.storeOptions,
	              amount = _this$storeOptions.reservoirIncreaseAmount,
	              maximum = _this$storeOptions.reservoirIncreaseMaximum,
	              reservoir = _this$storeOptions.reservoir;
	            _this._lastReservoirIncrease = now;
	            var incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
	            if (incr > 0) {
	              _this.storeOptions.reservoir += incr;
	              _this.instance._drainAll(_this.computeCapacity());
	            }
	          }
	        }, this.heartbeatInterval);
	        if (this.heartbeat.unref) {
	          this.heartbeat.unref();
	        }
	      } else if (this.heartbeat) {
	        clearInterval(this.heartbeat);
	      }
	    }
	  }, {
	    key: "__publish__",
	    value: function __publish__(message) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee() {
	        return _regenerator$2().w(function (_context) {
	          while (1) switch (_context.n) {
	            case 0:
	              _context.n = 1;
	              return this.yieldLoop();
	            case 1:
	              this.instance.Events.trigger("message", message.toString());
	            case 2:
	              return _context.a(2);
	          }
	        }, _callee, this);
	      }));
	    }
	  }, {
	    key: "__disconnect__",
	    value: function __disconnect__(flush) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee2() {
	        return _regenerator$2().w(function (_context2) {
	          while (1) switch (_context2.n) {
	            case 0:
	              _context2.n = 1;
	              return this.yieldLoop();
	            case 1:
	              if (this.heartbeat) {
	                clearInterval(this.heartbeat);
	              }
	              return _context2.a(2, this.Promise.resolve());
	          }
	        }, _callee2, this);
	      }));
	    }
	  }, {
	    key: "yieldLoop",
	    value: function yieldLoop() {
	      var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
	      return new this.Promise(function (resolve) {
	        return setTimeout(resolve, t);
	      });
	    }
	  }, {
	    key: "computePenalty",
	    value: function computePenalty() {
	      var _a;
	      return (_a = this.storeOptions.penalty) !== null && _a !== void 0 ? _a : 15 * this.storeOptions.minTime || 5000;
	    }
	  }, {
	    key: "__updateSettings__",
	    value: function __updateSettings__(options) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee3() {
	        return _regenerator$2().w(function (_context3) {
	          while (1) switch (_context3.n) {
	            case 0:
	              _context3.n = 1;
	              return this.yieldLoop();
	            case 1:
	              parser$3.overwrite(options, options, this.storeOptions);
	              this._startHeartbeat();
	              this.instance._drainAll(this.computeCapacity());
	              return _context3.a(2, true);
	          }
	        }, _callee3, this);
	      }));
	    }
	  }, {
	    key: "__running__",
	    value: function __running__() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee4() {
	        return _regenerator$2().w(function (_context4) {
	          while (1) switch (_context4.n) {
	            case 0:
	              _context4.n = 1;
	              return this.yieldLoop();
	            case 1:
	              return _context4.a(2, this._running);
	          }
	        }, _callee4, this);
	      }));
	    }
	  }, {
	    key: "__queued__",
	    value: function __queued__() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee5() {
	        return _regenerator$2().w(function (_context5) {
	          while (1) switch (_context5.n) {
	            case 0:
	              _context5.n = 1;
	              return this.yieldLoop();
	            case 1:
	              return _context5.a(2, this.instance.queued());
	          }
	        }, _callee5, this);
	      }));
	    }
	  }, {
	    key: "__done__",
	    value: function __done__() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee6() {
	        return _regenerator$2().w(function (_context6) {
	          while (1) switch (_context6.n) {
	            case 0:
	              _context6.n = 1;
	              return this.yieldLoop();
	            case 1:
	              return _context6.a(2, this._done);
	          }
	        }, _callee6, this);
	      }));
	    }
	  }, {
	    key: "__groupCheck__",
	    value: function __groupCheck__(time) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee7() {
	        return _regenerator$2().w(function (_context7) {
	          while (1) switch (_context7.n) {
	            case 0:
	              _context7.n = 1;
	              return this.yieldLoop();
	            case 1:
	              return _context7.a(2, this._nextRequest + this.timeout < time);
	          }
	        }, _callee7, this);
	      }));
	    }
	  }, {
	    key: "computeCapacity",
	    value: function computeCapacity() {
	      var _this$storeOptions2 = this.storeOptions,
	        maxConcurrent = _this$storeOptions2.maxConcurrent,
	        reservoir = _this$storeOptions2.reservoir;
	      if (maxConcurrent != null && reservoir != null) {
	        return Math.min(maxConcurrent - this._running, reservoir);
	      } else if (maxConcurrent != null) {
	        return maxConcurrent - this._running;
	      } else if (reservoir != null) {
	        return reservoir;
	      } else {
	        return null;
	      }
	    }
	  }, {
	    key: "conditionsCheck",
	    value: function conditionsCheck(weight) {
	      var capacity = this.computeCapacity();
	      return capacity == null || weight <= capacity;
	    }
	  }, {
	    key: "__incrementReservoir__",
	    value: function __incrementReservoir__(incr) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee8() {
	        var reservoir;
	        return _regenerator$2().w(function (_context8) {
	          while (1) switch (_context8.n) {
	            case 0:
	              _context8.n = 1;
	              return this.yieldLoop();
	            case 1:
	              reservoir = this.storeOptions.reservoir += incr;
	              this.instance._drainAll(this.computeCapacity());
	              return _context8.a(2, reservoir);
	          }
	        }, _callee8, this);
	      }));
	    }
	  }, {
	    key: "__currentReservoir__",
	    value: function __currentReservoir__() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee9() {
	        return _regenerator$2().w(function (_context9) {
	          while (1) switch (_context9.n) {
	            case 0:
	              _context9.n = 1;
	              return this.yieldLoop();
	            case 1:
	              return _context9.a(2, this.storeOptions.reservoir);
	          }
	        }, _callee9, this);
	      }));
	    }
	  }, {
	    key: "isBlocked",
	    value: function isBlocked(now) {
	      return this._unblockTime >= now;
	    }
	  }, {
	    key: "check",
	    value: function check(weight, now) {
	      return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
	    }
	  }, {
	    key: "__check__",
	    value: function __check__(weight) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee0() {
	        var now;
	        return _regenerator$2().w(function (_context0) {
	          while (1) switch (_context0.n) {
	            case 0:
	              _context0.n = 1;
	              return this.yieldLoop();
	            case 1:
	              now = Date.now();
	              return _context0.a(2, this.check(weight, now));
	          }
	        }, _callee0, this);
	      }));
	    }
	  }, {
	    key: "__register__",
	    value: function __register__(index, weight, expiration) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee1() {
	        var now, wait;
	        return _regenerator$2().w(function (_context1) {
	          while (1) switch (_context1.n) {
	            case 0:
	              _context1.n = 1;
	              return this.yieldLoop();
	            case 1:
	              now = Date.now();
	              if (!this.conditionsCheck(weight)) {
	                _context1.n = 2;
	                break;
	              }
	              this._running += weight;
	              if (this.storeOptions.reservoir != null) {
	                this.storeOptions.reservoir -= weight;
	              }
	              wait = Math.max(this._nextRequest - now, 0);
	              this._nextRequest = now + wait + this.storeOptions.minTime;
	              return _context1.a(2, {
	                success: true,
	                wait: wait,
	                reservoir: this.storeOptions.reservoir
	              });
	            case 2:
	              return _context1.a(2, {
	                success: false
	              });
	            case 3:
	              return _context1.a(2);
	          }
	        }, _callee1, this);
	      }));
	    }
	  }, {
	    key: "strategyIsBlock",
	    value: function strategyIsBlock() {
	      return this.storeOptions.strategy === 3;
	    }
	  }, {
	    key: "__submit__",
	    value: function __submit__(queueLength, weight) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee10() {
	        var now, reachedHWM, blocked;
	        return _regenerator$2().w(function (_context10) {
	          while (1) switch (_context10.n) {
	            case 0:
	              _context10.n = 1;
	              return this.yieldLoop();
	            case 1:
	              if (!(this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent)) {
	                _context10.n = 2;
	                break;
	              }
	              throw new BottleneckError_1("Impossible to add a job having a weight of ".concat(weight, " to a limiter having a maxConcurrent setting of ").concat(this.storeOptions.maxConcurrent));
	            case 2:
	              now = Date.now();
	              reachedHWM = this.storeOptions.highWater != null && queueLength === this.storeOptions.highWater && !this.check(weight, now);
	              blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
	              if (blocked) {
	                this._unblockTime = now + this.computePenalty();
	                this._nextRequest = this._unblockTime + this.storeOptions.minTime;
	                this.instance._dropAllQueued();
	              }
	              return _context10.a(2, {
	                reachedHWM: reachedHWM,
	                blocked: blocked,
	                strategy: this.storeOptions.strategy
	              });
	          }
	        }, _callee10, this);
	      }));
	    }
	  }, {
	    key: "__free__",
	    value: function __free__(index, weight) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$2().m(function _callee11() {
	        return _regenerator$2().w(function (_context11) {
	          while (1) switch (_context11.n) {
	            case 0:
	              _context11.n = 1;
	              return this.yieldLoop();
	            case 1:
	              this._running -= weight;
	              this._done += weight;
	              this.instance._drainAll(this.computeCapacity());
	              return _context11.a(2, {
	                running: this._running
	              });
	          }
	        }, _callee11, this);
	      }));
	    }
	  }]);
	}();
	var LocalDatastore_1 = LocalDatastore;

	var lua = {
		"blacklist_client.lua": "local blacklist = ARGV[num_static_argv + 1]\n\nif redis.call('zscore', client_last_seen_key, blacklist) then\n  redis.call('zadd', client_last_seen_key, 0, blacklist)\nend\n\n\nreturn {}\n",
		"check.lua": "local weight = tonumber(ARGV[num_static_argv + 1])\n\nlocal capacity = process_tick(now, false)['capacity']\nlocal nextRequest = tonumber(redis.call('hget', settings_key, 'nextRequest'))\n\nreturn conditions_check(capacity, weight) and nextRequest - now <= 0\n",
		"conditions_check.lua": "local conditions_check = function (capacity, weight)\n  return capacity == nil or weight <= capacity\nend\n",
		"current_reservoir.lua": "return process_tick(now, false)['reservoir']\n",
		"done.lua": "process_tick(now, false)\n\nreturn tonumber(redis.call('hget', settings_key, 'done'))\n",
		"free.lua": "local index = ARGV[num_static_argv + 1]\n\nredis.call('zadd', job_expirations_key, 0, index)\n\nreturn process_tick(now, false)['running']\n",
		"get_time.lua": "redis.replicate_commands()\n\nlocal get_time = function ()\n  local time = redis.call('time')\n\n  return tonumber(time[1]..string.sub(time[2], 1, 3))\nend\n",
		"group_check.lua": "return not (redis.call('exists', settings_key) == 1)\n",
		"heartbeat.lua": "process_tick(now, true)\n",
		"increment_reservoir.lua": "local incr = tonumber(ARGV[num_static_argv + 1])\n\nredis.call('hincrby', settings_key, 'reservoir', incr)\n\nlocal reservoir = process_tick(now, true)['reservoir']\n\nlocal groupTimeout = tonumber(redis.call('hget', settings_key, 'groupTimeout'))\nrefresh_expiration(0, 0, groupTimeout)\n\nreturn reservoir\n",
		"init.lua": "local clear = tonumber(ARGV[num_static_argv + 1])\nlocal limiter_version = ARGV[num_static_argv + 2]\nlocal num_local_argv = num_static_argv + 2\n\nif clear == 1 then\n  redis.call('del', unpack(KEYS))\nend\n\nif redis.call('exists', settings_key) == 0 then\n  -- Create\n  local args = {'hmset', settings_key}\n\n  for i = num_local_argv + 1, #ARGV do\n    table.insert(args, ARGV[i])\n  end\n\n  redis.call(unpack(args))\n  redis.call('hmset', settings_key,\n    'nextRequest', now,\n    'lastReservoirRefresh', now,\n    'lastReservoirIncrease', now,\n    'running', 0,\n    'done', 0,\n    'unblockTime', 0,\n    'capacityPriorityCounter', 0\n  )\n\nelse\n  -- Apply migrations\n  local settings = redis.call('hmget', settings_key,\n    'id',\n    'version'\n  )\n  local id = settings[1]\n  local current_version = settings[2]\n\n  if current_version ~= limiter_version then\n    local version_digits = {}\n    for k, v in string.gmatch(current_version, \"([^.]+)\") do\n      table.insert(version_digits, tonumber(k))\n    end\n\n    -- 2.10.0\n    if version_digits[2] < 10 then\n      redis.call('hsetnx', settings_key, 'reservoirRefreshInterval', '')\n      redis.call('hsetnx', settings_key, 'reservoirRefreshAmount', '')\n      redis.call('hsetnx', settings_key, 'lastReservoirRefresh', '')\n      redis.call('hsetnx', settings_key, 'done', 0)\n      redis.call('hset', settings_key, 'version', '2.10.0')\n    end\n\n    -- 2.11.1\n    if version_digits[2] < 11 or (version_digits[2] == 11 and version_digits[3] < 1) then\n      if redis.call('hstrlen', settings_key, 'lastReservoirRefresh') == 0 then\n        redis.call('hmset', settings_key,\n          'lastReservoirRefresh', now,\n          'version', '2.11.1'\n        )\n      end\n    end\n\n    -- 2.14.0\n    if version_digits[2] < 14 then\n      local old_running_key = 'b_'..id..'_running'\n      local old_executing_key = 'b_'..id..'_executing'\n\n      if redis.call('exists', old_running_key) == 1 then\n        redis.call('rename', old_running_key, job_weights_key)\n      end\n      if redis.call('exists', old_executing_key) == 1 then\n        redis.call('rename', old_executing_key, job_expirations_key)\n      end\n      redis.call('hset', settings_key, 'version', '2.14.0')\n    end\n\n    -- 2.15.2\n    if version_digits[2] < 15 or (version_digits[2] == 15 and version_digits[3] < 2) then\n      redis.call('hsetnx', settings_key, 'capacityPriorityCounter', 0)\n      redis.call('hset', settings_key, 'version', '2.15.2')\n    end\n\n    -- 2.17.0\n    if version_digits[2] < 17 then\n      redis.call('hsetnx', settings_key, 'clientTimeout', 10000)\n      redis.call('hset', settings_key, 'version', '2.17.0')\n    end\n\n    -- 2.18.0\n    if version_digits[2] < 18 then\n      redis.call('hsetnx', settings_key, 'reservoirIncreaseInterval', '')\n      redis.call('hsetnx', settings_key, 'reservoirIncreaseAmount', '')\n      redis.call('hsetnx', settings_key, 'reservoirIncreaseMaximum', '')\n      redis.call('hsetnx', settings_key, 'lastReservoirIncrease', now)\n      redis.call('hset', settings_key, 'version', '2.18.0')\n    end\n\n  end\n\n  process_tick(now, false)\nend\n\nlocal groupTimeout = tonumber(redis.call('hget', settings_key, 'groupTimeout'))\nrefresh_expiration(0, 0, groupTimeout)\n\nreturn {}\n",
		"process_tick.lua": "local process_tick = function (now, always_publish)\n\n  local compute_capacity = function (maxConcurrent, running, reservoir)\n    if maxConcurrent ~= nil and reservoir ~= nil then\n      return math.min((maxConcurrent - running), reservoir)\n    elseif maxConcurrent ~= nil then\n      return maxConcurrent - running\n    elseif reservoir ~= nil then\n      return reservoir\n    else\n      return nil\n    end\n  end\n\n  local settings = redis.call('hmget', settings_key,\n    'id',\n    'maxConcurrent',\n    'running',\n    'reservoir',\n    'reservoirRefreshInterval',\n    'reservoirRefreshAmount',\n    'lastReservoirRefresh',\n    'reservoirIncreaseInterval',\n    'reservoirIncreaseAmount',\n    'reservoirIncreaseMaximum',\n    'lastReservoirIncrease',\n    'capacityPriorityCounter',\n    'clientTimeout'\n  )\n  local id = settings[1]\n  local maxConcurrent = tonumber(settings[2])\n  local running = tonumber(settings[3])\n  local reservoir = tonumber(settings[4])\n  local reservoirRefreshInterval = tonumber(settings[5])\n  local reservoirRefreshAmount = tonumber(settings[6])\n  local lastReservoirRefresh = tonumber(settings[7])\n  local reservoirIncreaseInterval = tonumber(settings[8])\n  local reservoirIncreaseAmount = tonumber(settings[9])\n  local reservoirIncreaseMaximum = tonumber(settings[10])\n  local lastReservoirIncrease = tonumber(settings[11])\n  local capacityPriorityCounter = tonumber(settings[12])\n  local clientTimeout = tonumber(settings[13])\n\n  local initial_capacity = compute_capacity(maxConcurrent, running, reservoir)\n\n  --\n  -- Process 'running' changes\n  --\n  local expired = redis.call('zrangebyscore', job_expirations_key, '-inf', '('..now)\n\n  if #expired > 0 then\n    redis.call('zremrangebyscore', job_expirations_key, '-inf', '('..now)\n\n    local flush_batch = function (batch, acc)\n      local weights = redis.call('hmget', job_weights_key, unpack(batch))\n                      redis.call('hdel',  job_weights_key, unpack(batch))\n      local clients = redis.call('hmget', job_clients_key, unpack(batch))\n                      redis.call('hdel',  job_clients_key, unpack(batch))\n\n      -- Calculate sum of removed weights\n      for i = 1, #weights do\n        acc['total'] = acc['total'] + (tonumber(weights[i]) or 0)\n      end\n\n      -- Calculate sum of removed weights by client\n      local client_weights = {}\n      for i = 1, #clients do\n        local removed = tonumber(weights[i]) or 0\n        if removed > 0 then\n          acc['client_weights'][clients[i]] = (acc['client_weights'][clients[i]] or 0) + removed\n        end\n      end\n    end\n\n    local acc = {\n      ['total'] = 0,\n      ['client_weights'] = {}\n    }\n    local batch_size = 1000\n\n    -- Compute changes to Zsets and apply changes to Hashes\n    for i = 1, #expired, batch_size do\n      local batch = {}\n      for j = i, math.min(i + batch_size - 1, #expired) do\n        table.insert(batch, expired[j])\n      end\n\n      flush_batch(batch, acc)\n    end\n\n    -- Apply changes to Zsets\n    if acc['total'] > 0 then\n      redis.call('hincrby', settings_key, 'done', acc['total'])\n      running = tonumber(redis.call('hincrby', settings_key, 'running', -acc['total']))\n    end\n\n    for client, weight in pairs(acc['client_weights']) do\n      redis.call('zincrby', client_running_key, -weight, client)\n    end\n  end\n\n  --\n  -- Process 'reservoir' changes\n  --\n  local reservoirRefreshActive = reservoirRefreshInterval ~= nil and reservoirRefreshAmount ~= nil\n  if reservoirRefreshActive and now >= lastReservoirRefresh + reservoirRefreshInterval then\n    reservoir = reservoirRefreshAmount\n    redis.call('hmset', settings_key,\n      'reservoir', reservoir,\n      'lastReservoirRefresh', now\n    )\n  end\n\n  local reservoirIncreaseActive = reservoirIncreaseInterval ~= nil and reservoirIncreaseAmount ~= nil\n  if reservoirIncreaseActive and now >= lastReservoirIncrease + reservoirIncreaseInterval then\n    local num_intervals = math.floor((now - lastReservoirIncrease) / reservoirIncreaseInterval)\n    local incr = reservoirIncreaseAmount * num_intervals\n    if reservoirIncreaseMaximum ~= nil then\n      incr = math.min(incr, reservoirIncreaseMaximum - (reservoir or 0))\n    end\n    if incr > 0 then\n      reservoir = (reservoir or 0) + incr\n    end\n    redis.call('hmset', settings_key,\n      'reservoir', reservoir,\n      'lastReservoirIncrease', lastReservoirIncrease + (num_intervals * reservoirIncreaseInterval)\n    )\n  end\n\n  --\n  -- Clear unresponsive clients\n  --\n  local unresponsive = redis.call('zrangebyscore', client_last_seen_key, '-inf', (now - clientTimeout))\n  local unresponsive_lookup = {}\n  local terminated_clients = {}\n  for i = 1, #unresponsive do\n    unresponsive_lookup[unresponsive[i]] = true\n    if tonumber(redis.call('zscore', client_running_key, unresponsive[i])) == 0 then\n      table.insert(terminated_clients, unresponsive[i])\n    end\n  end\n  if #terminated_clients > 0 then\n    redis.call('zrem', client_running_key,         unpack(terminated_clients))\n    redis.call('hdel', client_num_queued_key,      unpack(terminated_clients))\n    redis.call('zrem', client_last_registered_key, unpack(terminated_clients))\n    redis.call('zrem', client_last_seen_key,       unpack(terminated_clients))\n  end\n\n  --\n  -- Broadcast capacity changes\n  --\n  local final_capacity = compute_capacity(maxConcurrent, running, reservoir)\n\n  if always_publish or (initial_capacity ~= nil and final_capacity == nil) then\n    -- always_publish or was not unlimited, now unlimited\n    redis.call('publish', 'b_'..id, 'capacity:'..(final_capacity or ''))\n\n  elseif initial_capacity ~= nil and final_capacity ~= nil and final_capacity > initial_capacity then\n    -- capacity was increased\n    -- send the capacity message to the limiter having the lowest number of running jobs\n    -- the tiebreaker is the limiter having not registered a job in the longest time\n\n    local lowest_concurrency_value = nil\n    local lowest_concurrency_clients = {}\n    local lowest_concurrency_last_registered = {}\n    local client_concurrencies = redis.call('zrange', client_running_key, 0, -1, 'withscores')\n\n    for i = 1, #client_concurrencies, 2 do\n      local client = client_concurrencies[i]\n      local concurrency = tonumber(client_concurrencies[i+1])\n\n      if (\n        lowest_concurrency_value == nil or lowest_concurrency_value == concurrency\n      ) and (\n        not unresponsive_lookup[client]\n      ) and (\n        tonumber(redis.call('hget', client_num_queued_key, client)) > 0\n      ) then\n        lowest_concurrency_value = concurrency\n        table.insert(lowest_concurrency_clients, client)\n        local last_registered = tonumber(redis.call('zscore', client_last_registered_key, client))\n        table.insert(lowest_concurrency_last_registered, last_registered)\n      end\n    end\n\n    if #lowest_concurrency_clients > 0 then\n      local position = 1\n      local earliest = lowest_concurrency_last_registered[1]\n\n      for i,v in ipairs(lowest_concurrency_last_registered) do\n        if v < earliest then\n          position = i\n          earliest = v\n        end\n      end\n\n      local next_client = lowest_concurrency_clients[position]\n      redis.call('publish', 'b_'..id,\n        'capacity-priority:'..(final_capacity or '')..\n        ':'..next_client..\n        ':'..capacityPriorityCounter\n      )\n      redis.call('hincrby', settings_key, 'capacityPriorityCounter', '1')\n    else\n      redis.call('publish', 'b_'..id, 'capacity:'..(final_capacity or ''))\n    end\n  end\n\n  return {\n    ['capacity'] = final_capacity,\n    ['running'] = running,\n    ['reservoir'] = reservoir\n  }\nend\n",
		"queued.lua": "local clientTimeout = tonumber(redis.call('hget', settings_key, 'clientTimeout'))\nlocal valid_clients = redis.call('zrangebyscore', client_last_seen_key, (now - clientTimeout), 'inf')\nlocal client_queued = redis.call('hmget', client_num_queued_key, unpack(valid_clients))\n\nlocal sum = 0\nfor i = 1, #client_queued do\n  sum = sum + tonumber(client_queued[i])\nend\n\nreturn sum\n",
		"refresh_expiration.lua": "local refresh_expiration = function (now, nextRequest, groupTimeout)\n\n  if groupTimeout ~= nil then\n    local ttl = (nextRequest + groupTimeout) - now\n\n    for i = 1, #KEYS do\n      redis.call('pexpire', KEYS[i], ttl)\n    end\n  end\n\nend\n",
		"refs.lua": "local settings_key = KEYS[1]\nlocal job_weights_key = KEYS[2]\nlocal job_expirations_key = KEYS[3]\nlocal job_clients_key = KEYS[4]\nlocal client_running_key = KEYS[5]\nlocal client_num_queued_key = KEYS[6]\nlocal client_last_registered_key = KEYS[7]\nlocal client_last_seen_key = KEYS[8]\n\nlocal now = tonumber(ARGV[1])\nlocal client = ARGV[2]\n\nlocal num_static_argv = 2\n",
		"register.lua": "local index = ARGV[num_static_argv + 1]\nlocal weight = tonumber(ARGV[num_static_argv + 2])\nlocal expiration = tonumber(ARGV[num_static_argv + 3])\n\nlocal state = process_tick(now, false)\nlocal capacity = state['capacity']\nlocal reservoir = state['reservoir']\n\nlocal settings = redis.call('hmget', settings_key,\n  'nextRequest',\n  'minTime',\n  'groupTimeout'\n)\nlocal nextRequest = tonumber(settings[1])\nlocal minTime = tonumber(settings[2])\nlocal groupTimeout = tonumber(settings[3])\n\nif conditions_check(capacity, weight) then\n\n  redis.call('hincrby', settings_key, 'running', weight)\n  redis.call('hset', job_weights_key, index, weight)\n  if expiration ~= nil then\n    redis.call('zadd', job_expirations_key, now + expiration, index)\n  end\n  redis.call('hset', job_clients_key, index, client)\n  redis.call('zincrby', client_running_key, weight, client)\n  redis.call('hincrby', client_num_queued_key, client, -1)\n  redis.call('zadd', client_last_registered_key, now, client)\n\n  local wait = math.max(nextRequest - now, 0)\n  local newNextRequest = now + wait + minTime\n\n  if reservoir == nil then\n    redis.call('hset', settings_key,\n      'nextRequest', newNextRequest\n    )\n  else\n    reservoir = reservoir - weight\n    redis.call('hmset', settings_key,\n      'reservoir', reservoir,\n      'nextRequest', newNextRequest\n    )\n  end\n\n  refresh_expiration(now, newNextRequest, groupTimeout)\n\n  return {true, wait, reservoir}\n\nelse\n  return {false}\nend\n",
		"register_client.lua": "local queued = tonumber(ARGV[num_static_argv + 1])\n\n-- Could have been re-registered concurrently\nif not redis.call('zscore', client_last_seen_key, client) then\n  redis.call('zadd', client_running_key, 0, client)\n  redis.call('hset', client_num_queued_key, client, queued)\n  redis.call('zadd', client_last_registered_key, 0, client)\nend\n\nredis.call('zadd', client_last_seen_key, now, client)\n\nreturn {}\n",
		"running.lua": "return process_tick(now, false)['running']\n",
		"submit.lua": "local queueLength = tonumber(ARGV[num_static_argv + 1])\nlocal weight = tonumber(ARGV[num_static_argv + 2])\n\nlocal capacity = process_tick(now, false)['capacity']\n\nlocal settings = redis.call('hmget', settings_key,\n  'id',\n  'maxConcurrent',\n  'highWater',\n  'nextRequest',\n  'strategy',\n  'unblockTime',\n  'penalty',\n  'minTime',\n  'groupTimeout'\n)\nlocal id = settings[1]\nlocal maxConcurrent = tonumber(settings[2])\nlocal highWater = tonumber(settings[3])\nlocal nextRequest = tonumber(settings[4])\nlocal strategy = tonumber(settings[5])\nlocal unblockTime = tonumber(settings[6])\nlocal penalty = tonumber(settings[7])\nlocal minTime = tonumber(settings[8])\nlocal groupTimeout = tonumber(settings[9])\n\nif maxConcurrent ~= nil and weight > maxConcurrent then\n  return redis.error_reply('OVERWEIGHT:'..weight..':'..maxConcurrent)\nend\n\nlocal reachedHWM = (highWater ~= nil and queueLength == highWater\n  and not (\n    conditions_check(capacity, weight)\n    and nextRequest - now <= 0\n  )\n)\n\nlocal blocked = strategy == 3 and (reachedHWM or unblockTime >= now)\n\nif blocked then\n  local computedPenalty = penalty\n  if computedPenalty == nil then\n    if minTime == 0 then\n      computedPenalty = 5000\n    else\n      computedPenalty = 15 * minTime\n    end\n  end\n\n  local newNextRequest = now + computedPenalty + minTime\n\n  redis.call('hmset', settings_key,\n    'unblockTime', now + computedPenalty,\n    'nextRequest', newNextRequest\n  )\n\n  local clients_queued_reset = redis.call('hkeys', client_num_queued_key)\n  local queued_reset = {}\n  for i = 1, #clients_queued_reset do\n    table.insert(queued_reset, clients_queued_reset[i])\n    table.insert(queued_reset, 0)\n  end\n  redis.call('hmset', client_num_queued_key, unpack(queued_reset))\n\n  redis.call('publish', 'b_'..id, 'blocked:')\n\n  refresh_expiration(now, newNextRequest, groupTimeout)\nend\n\nif not blocked and not reachedHWM then\n  redis.call('hincrby', client_num_queued_key, client, 1)\nend\n\nreturn {reachedHWM, blocked, strategy}\n",
		"update_settings.lua": "local args = {'hmset', settings_key}\n\nfor i = num_static_argv + 1, #ARGV do\n  table.insert(args, ARGV[i])\nend\n\nredis.call(unpack(args))\n\nprocess_tick(now, true)\n\nlocal groupTimeout = tonumber(redis.call('hget', settings_key, 'groupTimeout'))\nrefresh_expiration(0, 0, groupTimeout)\n\nreturn {}\n",
		"validate_client.lua": "if not redis.call('zscore', client_last_seen_key, client) then\n  return redis.error_reply('UNKNOWN_CLIENT')\nend\n\nredis.call('zadd', client_last_seen_key, now, client)\n",
		"validate_keys.lua": "if not (redis.call('exists', settings_key) == 1) then\n  return redis.error_reply('SETTINGS_KEY_NOT_FOUND')\nend\n"
	};

	var lua$1 = /*#__PURE__*/Object.freeze({
		default: lua
	});

	var lua$2 = getCjsExportFromNamespace(lua$1);

	var Scripts = createCommonjsModule(function (module, exports) {

	  function _toConsumableArray(r) {
	    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
	  }
	  function _nonIterableSpread() {
	    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	  }
	  function _unsupportedIterableToArray(r, a) {
	    if (r) {
	      if ("string" == typeof r) return _arrayLikeToArray(r, a);
	      var t = {}.toString.call(r).slice(8, -1);
	      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	    }
	  }
	  function _iterableToArray(r) {
	    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	  }
	  function _arrayWithoutHoles(r) {
	    if (Array.isArray(r)) return _arrayLikeToArray(r);
	  }
	  function _arrayLikeToArray(r, a) {
	    (null == a || a > r.length) && (a = r.length);
	    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	    return n;
	  }
	  Object.defineProperty(exports, "__esModule", {
	    value: true
	  });
	  exports.payload = exports.keys = exports.names = exports.allKeys = void 0;
	  var headers = {
	    refs: lua$2["refs.lua"],
	    validate_keys: lua$2["validate_keys.lua"],
	    validate_client: lua$2["validate_client.lua"],
	    refresh_expiration: lua$2["refresh_expiration.lua"],
	    process_tick: lua$2["process_tick.lua"],
	    conditions_check: lua$2["conditions_check.lua"],
	    get_time: lua$2["get_time.lua"]
	  };
	  var allKeys = function allKeys(id) {
	    return [
	    // HASH
	    "b_".concat(id, "_settings"),
	    // HASH
	    // job index -> weight
	    "b_".concat(id, "_job_weights"),
	    // ZSET
	    // job index -> expiration
	    "b_".concat(id, "_job_expirations"),
	    // HASH
	    // job index -> client
	    "b_".concat(id, "_job_clients"),
	    // ZSET
	    // client -> sum running
	    "b_".concat(id, "_client_running"),
	    // HASH
	    // client -> num queued
	    "b_".concat(id, "_client_num_queued"),
	    // ZSET
	    // client -> last job registered
	    "b_".concat(id, "_client_last_registered"),
	    // ZSET
	    // client -> last seen
	    "b_".concat(id, "_client_last_seen")];
	  };
	  exports.allKeys = allKeys;
	  var templates = {
	    init: {
	      keys: exports.allKeys,
	      headers: ["process_tick"],
	      refresh_expiration: true,
	      code: lua$2["init.lua"]
	    },
	    group_check: {
	      keys: exports.allKeys,
	      headers: [],
	      refresh_expiration: false,
	      code: lua$2["group_check.lua"]
	    },
	    register_client: {
	      keys: exports.allKeys,
	      headers: ["validate_keys"],
	      refresh_expiration: false,
	      code: lua$2["register_client.lua"]
	    },
	    blacklist_client: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client"],
	      refresh_expiration: false,
	      code: lua$2["blacklist_client.lua"]
	    },
	    heartbeat: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: false,
	      code: lua$2["heartbeat.lua"]
	    },
	    update_settings: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: true,
	      code: lua$2["update_settings.lua"]
	    },
	    running: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: false,
	      code: lua$2["running.lua"]
	    },
	    queued: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client"],
	      refresh_expiration: false,
	      code: lua$2["queued.lua"]
	    },
	    done: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: false,
	      code: lua$2["done.lua"]
	    },
	    check: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick", "conditions_check"],
	      refresh_expiration: false,
	      code: lua$2["check.lua"]
	    },
	    submit: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick", "conditions_check"],
	      refresh_expiration: true,
	      code: lua$2["submit.lua"]
	    },
	    register: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick", "conditions_check"],
	      refresh_expiration: true,
	      code: lua$2["register.lua"]
	    },
	    free: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: true,
	      code: lua$2["free.lua"]
	    },
	    current_reservoir: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: false,
	      code: lua$2["current_reservoir.lua"]
	    },
	    increment_reservoir: {
	      keys: exports.allKeys,
	      headers: ["validate_keys", "validate_client", "process_tick"],
	      refresh_expiration: true,
	      code: lua$2["increment_reservoir.lua"]
	    }
	  };
	  exports.names = Object.keys(templates);
	  var keys = function keys(name, id) {
	    return templates[name].keys(id);
	  };
	  exports.keys = keys;
	  var payload = function payload(name) {
	    var template = templates[name];
	    return [headers.refs].concat(_toConsumableArray(template.headers.map(function (h) {
	      return headers[h];
	    })), _toConsumableArray(template.refresh_expiration ? [headers.refresh_expiration] : [""]), [template.code]).join("\n");
	  };
	  exports.payload = payload;
	});
	unwrapExports(Scripts);
	var Scripts_1 = Scripts.payload;
	var Scripts_2 = Scripts.keys;
	var Scripts_3 = Scripts.names;
	var Scripts_4 = Scripts.allKeys;

	function _typeof$6(o) {
	  "@babel/helpers - typeof";

	  return _typeof$6 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$6(o);
	}
	function _toConsumableArray$1(r) {
	  return _arrayWithoutHoles$1(r) || _iterableToArray$1(r) || _unsupportedIterableToArray$2(r) || _nonIterableSpread$1();
	}
	function _nonIterableSpread$1() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArray$1(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles$1(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$2(r);
	}
	function _slicedToArray(r, e) {
	  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray$2(r, e) || _nonIterableRest();
	}
	function _nonIterableRest() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$2(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$2(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$2(r, a) : void 0;
	  }
	}
	function _arrayLikeToArray$2(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _iterableToArrayLimit(r, l) {
	  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (null != t) {
	    var e,
	      n,
	      i,
	      u,
	      a = [],
	      f = !0,
	      o = !1;
	    try {
	      if (i = (t = t.call(r)).next, 0 === l) {
	        if (Object(t) !== t) return;
	        f = !1;
	      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
	    } catch (r) {
	      o = !0, n = r;
	    } finally {
	      try {
	        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
	      } finally {
	        if (o) throw n;
	      }
	    }
	    return a;
	  }
	}
	function _arrayWithHoles(r) {
	  if (Array.isArray(r)) return r;
	}
	function _regenerator$3() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$3(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$3(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$3(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$3(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$3(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$3(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$3(u), _regeneratorDefine2$3(u, o, "Generator"), _regeneratorDefine2$3(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$3(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$3 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$3(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$3 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$3(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$3(e, r, n, t);
	}
	function _classCallCheck$6(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$6(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$6(o.key), o);
	  }
	}
	function _createClass$6(e, r, t) {
	  return r && _defineProperties$6(e.prototype, r), t && _defineProperties$6(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$6(t) {
	  var i = _toPrimitive$6(t, "string");
	  return "symbol" == _typeof$6(i) ? i : i + "";
	}
	function _toPrimitive$6(t, r) {
	  if ("object" != _typeof$6(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$6(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var parser$4 = tslib_1.__importStar(parser);
	var Scripts$2 = tslib_1.__importStar(Scripts);
	var RedisConnection = /*#__PURE__*/function () {
	  function RedisConnection() {
	    var _this = this;
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    _classCallCheck$6(this, RedisConnection);
	    var _a, _b, _c;
	    this.datastore = "redis";
	    this.defaults = {
	      Redis: null,
	      clientOptions: {},
	      client: null,
	      Promise: Promise,
	      Events: null
	    };
	    this.limiters = {};
	    this.shas = {};
	    this.terminated = false;
	    parser$4.load(options, this.defaults, this);
	    this.Redis = (_a = this.Redis) !== null && _a !== void 0 ? _a : eval("require")("redis"); // Obfuscated or else Webpack/Angular will try to inline the optional redis module
	    this.Events = (_b = this.Events) !== null && _b !== void 0 ? _b : new Events_1(this);
	    this.client = (_c = this.client) !== null && _c !== void 0 ? _c : this.Redis.createClient(this.defaults.clientOptions);
	    this.subscriber = this.client.duplicate();
	    this.ready = Promise.all([this._setup(this.client, false), this._setup(this.subscriber, true)]).then(function () {
	      return _this._loadScripts();
	    }).then(function () {
	      return {
	        client: _this.client,
	        subscriber: _this.subscriber
	      };
	    });
	  }
	  return _createClass$6(RedisConnection, [{
	    key: "_setup",
	    value: function _setup(client, sub) {
	      var _this2 = this;
	      client.setMaxListeners(0);
	      return new this.Promise(function (resolve, reject) {
	        client.on("error", function (e) {
	          return _this2.Events.trigger("error", e);
	        });
	        if (sub) {
	          client.on("message", function (channel, message) {
	            var _a;
	            (_a = _this2.limiters[channel]) === null || _a === void 0 ? void 0 : _a._store.onMessage(channel, message);
	          });
	        }
	        if (client.ready) {
	          resolve();
	        } else {
	          client.once("ready", resolve);
	        }
	      });
	    }
	  }, {
	    key: "_loadScript",
	    value: function _loadScript(name) {
	      var _this3 = this;
	      return new this.Promise(function (resolve, reject) {
	        var payload = Scripts$2.payload(name);
	        _this3.client.multi([["script", "load", payload]]).exec(function (err, replies) {
	          if (err != null) {
	            return reject(err);
	          }
	          _this3.shas[name] = replies[0];
	          resolve(replies[0]);
	        });
	      });
	    }
	  }, {
	    key: "_loadScripts",
	    value: function _loadScripts() {
	      var _this4 = this;
	      return Promise.all(Scripts$2.names.map(function (k) {
	        return _this4._loadScript(k);
	      }));
	    }
	  }, {
	    key: "__runCommand__",
	    value: function __runCommand__(cmd) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$3().m(function _callee() {
	        var _this5 = this;
	        return _regenerator$3().w(function (_context) {
	          while (1) switch (_context.n) {
	            case 0:
	              _context.n = 1;
	              return this.ready;
	            case 1:
	              return _context.a(2, new this.Promise(function (resolve, reject) {
	                _this5.client.multi([cmd]).exec_atomic(function (err, replies) {
	                  if (err != null) {
	                    reject(err);
	                  } else {
	                    resolve(replies[0]);
	                  }
	                });
	              }));
	          }
	        }, _callee, this);
	      }));
	    }
	    /**
	     * @param {string} pattern
	     * @returns {Promise<string[]>}
	     */
	  }, {
	    key: "__scanKeys__",
	    value: function __scanKeys__(pattern) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$3().m(function _callee2() {
	        var keys, cursor, _yield$this$__runComm, _yield$this$__runComm2, next, found;
	        return _regenerator$3().w(function (_context2) {
	          while (1) switch (_context2.n) {
	            case 0:
	              keys = [];
	              cursor = "0";
	            case 1:
	              _context2.n = 2;
	              return this.__runCommand__(["scan", cursor, "match", pattern, "count", 10000]);
	            case 2:
	              _yield$this$__runComm = _context2.v;
	              _yield$this$__runComm2 = _slicedToArray(_yield$this$__runComm, 2);
	              next = _yield$this$__runComm2[0];
	              found = _yield$this$__runComm2[1];
	              cursor = next;
	              keys.push.apply(keys, _toConsumableArray$1(found));
	            case 3:
	              if (cursor !== "0") {
	                _context2.n = 1;
	                break;
	              }
	            case 4:
	              return _context2.a(2, keys);
	          }
	        }, _callee2, this);
	      }));
	    }
	  }, {
	    key: "__addLimiter__",
	    value: function __addLimiter__(instance) {
	      var _this6 = this;
	      return Promise.all([instance.channel(), instance.channel_client()].map(function (channel) {
	        return new _this6.Promise(function (resolve, reject) {
	          var _handler = function handler(chan) {
	            if (chan === channel) {
	              _this6.subscriber.removeListener("subscribe", _handler);
	              _this6.limiters[channel] = instance;
	              resolve();
	            }
	          };
	          _this6.subscriber.on("subscribe", _handler);
	          _this6.subscriber.subscribe(channel);
	        });
	      }));
	    }
	  }, {
	    key: "__removeLimiter__",
	    value: function __removeLimiter__(instance) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$3().m(function _callee4() {
	        var _this7 = this;
	        return _regenerator$3().w(function (_context4) {
	          while (1) switch (_context4.n) {
	            case 0:
	              return _context4.a(2, Promise.all([instance.channel(), instance.channel_client()].map(function (channel) {
	                return tslib_1.__awaiter(_this7, void 0, void 0, /*#__PURE__*/_regenerator$3().m(function _callee3() {
	                  var _this8 = this;
	                  return _regenerator$3().w(function (_context3) {
	                    while (1) switch (_context3.n) {
	                      case 0:
	                        if (this.terminated) {
	                          _context3.n = 1;
	                          break;
	                        }
	                        _context3.n = 1;
	                        return new this.Promise(function (resolve, reject) {
	                          _this8.subscriber.unsubscribe(channel, function (err, chan) {
	                            if (err != null) {
	                              return reject(err);
	                            }
	                            if (chan === channel) {
	                              return resolve();
	                            }
	                          });
	                        });
	                      case 1:
	                        delete this.limiters[channel];
	                      case 2:
	                        return _context3.a(2);
	                    }
	                  }, _callee3, this);
	                }));
	              })));
	          }
	        }, _callee4);
	      }));
	    }
	  }, {
	    key: "__scriptArgs__",
	    value: function __scriptArgs__(name, id, args, cb) {
	      var keys = Scripts$2.keys(name, id);
	      return [this.shas[name], keys.length].concat(_toConsumableArray$1(keys), _toConsumableArray$1(args), [cb]);
	    }
	  }, {
	    key: "__scriptFn__",
	    value: function __scriptFn__(name) {
	      return this.client.evalsha.bind(this.client);
	    }
	  }, {
	    key: "disconnect",
	    value: function disconnect() {
	      var flush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
	      for (var _i = 0, _Object$keys = Object.keys(this.limiters); _i < _Object$keys.length; _i++) {
	        var k = _Object$keys[_i];
	        clearInterval(this.limiters[k]._store.heartbeat);
	      }
	      this.limiters = {};
	      this.terminated = true;
	      this.client.end(flush);
	      this.subscriber.end(flush);
	      return this.Promise.resolve();
	    }
	  }]);
	}();
	var RedisConnection_1 = RedisConnection;

	function _typeof$7(o) {
	  "@babel/helpers - typeof";

	  return _typeof$7 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$7(o);
	}
	function _toConsumableArray$2(r) {
	  return _arrayWithoutHoles$2(r) || _iterableToArray$2(r) || _unsupportedIterableToArray$3(r) || _nonIterableSpread$2();
	}
	function _nonIterableSpread$2() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArray$2(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles$2(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$3(r);
	}
	function _createForOfIteratorHelper$1(r, e) {
	  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (!t) {
	    if (Array.isArray(r) || (t = _unsupportedIterableToArray$3(r)) || e && r && "number" == typeof r.length) {
	      t && (r = t);
	      var _n = 0,
	        F = function F() {};
	      return {
	        s: F,
	        n: function n() {
	          return _n >= r.length ? {
	            done: !0
	          } : {
	            done: !1,
	            value: r[_n++]
	          };
	        },
	        e: function e(r) {
	          throw r;
	        },
	        f: F
	      };
	    }
	    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	  }
	  var o,
	    a = !0,
	    u = !1;
	  return {
	    s: function s() {
	      t = t.call(r);
	    },
	    n: function n() {
	      var r = t.next();
	      return a = r.done, r;
	    },
	    e: function e(r) {
	      u = !0, o = r;
	    },
	    f: function f() {
	      try {
	        a || null == t["return"] || t["return"]();
	      } finally {
	        if (u) throw o;
	      }
	    }
	  };
	}
	function _regenerator$4() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$4(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$4(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$4(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$4(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$4(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$4(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$4(u), _regeneratorDefine2$4(u, o, "Generator"), _regeneratorDefine2$4(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$4(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$4 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$4(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$4 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$4(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$4(e, r, n, t);
	}
	function _slicedToArray$1(r, e) {
	  return _arrayWithHoles$1(r) || _iterableToArrayLimit$1(r, e) || _unsupportedIterableToArray$3(r, e) || _nonIterableRest$1();
	}
	function _nonIterableRest$1() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$3(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$3(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$3(r, a) : void 0;
	  }
	}
	function _arrayLikeToArray$3(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _iterableToArrayLimit$1(r, l) {
	  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (null != t) {
	    var e,
	      n,
	      i,
	      u,
	      a = [],
	      f = !0,
	      o = !1;
	    try {
	      if (i = (t = t.call(r)).next, 0 === l) {
	        if (Object(t) !== t) return;
	        f = !1;
	      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
	    } catch (r) {
	      o = !0, n = r;
	    } finally {
	      try {
	        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
	      } finally {
	        if (o) throw n;
	      }
	    }
	    return a;
	  }
	}
	function _arrayWithHoles$1(r) {
	  if (Array.isArray(r)) return r;
	}
	function _classCallCheck$7(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$7(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$7(o.key), o);
	  }
	}
	function _createClass$7(e, r, t) {
	  return r && _defineProperties$7(e.prototype, r), t && _defineProperties$7(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$7(t) {
	  var i = _toPrimitive$7(t, "string");
	  return "symbol" == _typeof$7(i) ? i : i + "";
	}
	function _toPrimitive$7(t, r) {
	  if ("object" != _typeof$7(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$7(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var parser$5 = tslib_1.__importStar(parser);
	var Scripts$3 = tslib_1.__importStar(Scripts);
	var IORedisConnection = /*#__PURE__*/function () {
	  function IORedisConnection() {
	    var _this = this;
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    _classCallCheck$7(this, IORedisConnection);
	    var _a, _b, _c;
	    this.datastore = "ioredis";
	    this.defaults = {
	      Redis: null,
	      clientOptions: {},
	      clusterNodes: null,
	      client: null,
	      Promise: Promise,
	      Events: null
	    };
	    this.limiters = {};
	    this.terminated = false;
	    parser$5.load(options, this.defaults, this);
	    this.Redis = (_a = this.Redis) !== null && _a !== void 0 ? _a : eval("require")("ioredis"); // Obfuscated or else Webpack/Angular will try to inline the optional ioredis module
	    this.Events = (_b = this.Events) !== null && _b !== void 0 ? _b : new Events_1(this);
	    if (this.clusterNodes != null) {
	      this.client = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
	      this.subscriber = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
	    } else if (this.client != null && !this.client.duplicate) {
	      this.subscriber = new this.Redis.Cluster(this.client.startupNodes, this.client.options);
	    } else {
	      this.client = (_c = this.client) !== null && _c !== void 0 ? _c : new this.Redis(this.clientOptions);
	      this.subscriber = this.client.duplicate();
	    }
	    this.ready = Promise.all([this._setup(this.client, false), this._setup(this.subscriber, true)]).then(function () {
	      _this._loadScripts();
	      return {
	        client: _this.client,
	        subscriber: _this.subscriber
	      };
	    });
	  }
	  return _createClass$7(IORedisConnection, [{
	    key: "_setup",
	    value: function _setup(client, sub) {
	      var _this2 = this;
	      client.setMaxListeners(0);
	      return new this.Promise(function (resolve, reject) {
	        client.on("error", function (e) {
	          return _this2.Events.trigger("error", e);
	        });
	        if (sub) {
	          client.on("message", function (channel, message) {
	            var _a;
	            (_a = _this2.limiters[channel]) === null || _a === void 0 ? void 0 : _a._store.onMessage(channel, message);
	          });
	        }
	        if (client.status === "ready") {
	          resolve();
	        } else {
	          client.once("ready", resolve);
	        }
	      });
	    }
	  }, {
	    key: "_loadScripts",
	    value: function _loadScripts() {
	      var _this3 = this;
	      Scripts$3.names.forEach(function (name) {
	        _this3.client.defineCommand(name, {
	          lua: Scripts$3.payload(name)
	        });
	      });
	    }
	  }, {
	    key: "__runCommand__",
	    value: function __runCommand__(cmd) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$4().m(function _callee() {
	        var _yield$this$client$pi, _yield$this$client$pi2, _yield$this$client$pi3, _, deleted;
	        return _regenerator$4().w(function (_context) {
	          while (1) switch (_context.n) {
	            case 0:
	              _context.n = 1;
	              return this.ready;
	            case 1:
	              _context.n = 2;
	              return this.client.pipeline([cmd]).exec();
	            case 2:
	              _yield$this$client$pi = _context.v;
	              _yield$this$client$pi2 = _slicedToArray$1(_yield$this$client$pi, 1);
	              _yield$this$client$pi3 = _slicedToArray$1(_yield$this$client$pi2[0], 2);
	              _ = _yield$this$client$pi3[0];
	              deleted = _yield$this$client$pi3[1];
	              return _context.a(2, deleted);
	          }
	        }, _callee, this);
	      }));
	    }
	    /**
	     * Scans every master, since on Redis Cluster a SCAN only covers the node that receives it
	     * @param {string} pattern
	     * @returns {Promise<string[]>}
	     */
	  }, {
	    key: "__scanKeys__",
	    value: function __scanKeys__(pattern) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$4().m(function _callee2() {
	        var nodes, keys, _iterator, _step, node, cursor, _yield$node$scan, _yield$node$scan2, next, found, _t;
	        return _regenerator$4().w(function (_context2) {
	          while (1) switch (_context2.p = _context2.n) {
	            case 0:
	              _context2.n = 1;
	              return this.ready;
	            case 1:
	              nodes = typeof this.client.nodes === "function" ? this.client.nodes("master") : [this.client];
	              keys = [];
	              _iterator = _createForOfIteratorHelper$1(nodes);
	              _context2.p = 2;
	              _iterator.s();
	            case 3:
	              if ((_step = _iterator.n()).done) {
	                _context2.n = 8;
	                break;
	              }
	              node = _step.value;
	              cursor = "0";
	            case 4:
	              _context2.n = 5;
	              return node.scan(cursor, "MATCH", pattern, "COUNT", 10000);
	            case 5:
	              _yield$node$scan = _context2.v;
	              _yield$node$scan2 = _slicedToArray$1(_yield$node$scan, 2);
	              next = _yield$node$scan2[0];
	              found = _yield$node$scan2[1];
	              cursor = next;
	              keys.push.apply(keys, _toConsumableArray$2(found));
	            case 6:
	              if (cursor !== "0") {
	                _context2.n = 4;
	                break;
	              }
	            case 7:
	              _context2.n = 3;
	              break;
	            case 8:
	              _context2.n = 10;
	              break;
	            case 9:
	              _context2.p = 9;
	              _t = _context2.v;
	              _iterator.e(_t);
	            case 10:
	              _context2.p = 10;
	              _iterator.f();
	              return _context2.f(10);
	            case 11:
	              return _context2.a(2, keys);
	          }
	        }, _callee2, this, [[2, 9, 10, 11]]);
	      }));
	    }
	  }, {
	    key: "__addLimiter__",
	    value: function __addLimiter__(instance) {
	      var _this4 = this;
	      return Promise.all([instance.channel(), instance.channel_client()].map(function (channel) {
	        return new _this4.Promise(function (resolve, reject) {
	          _this4.subscriber.subscribe(channel, function () {
	            _this4.limiters[channel] = instance;
	            resolve();
	          });
	        });
	      }));
	    }
	  }, {
	    key: "__removeLimiter__",
	    value: function __removeLimiter__(instance) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$4().m(function _callee3() {
	        var channels, _i, _channels, channel;
	        return _regenerator$4().w(function (_context3) {
	          while (1) switch (_context3.n) {
	            case 0:
	              channels = [instance.channel(), instance.channel_client()];
	              _i = 0, _channels = channels;
	            case 1:
	              if (!(_i < _channels.length)) {
	                _context3.n = 4;
	                break;
	              }
	              channel = _channels[_i];
	              if (this.terminated) {
	                _context3.n = 2;
	                break;
	              }
	              _context3.n = 2;
	              return this.subscriber.unsubscribe(channel);
	            case 2:
	              delete this.limiters[channel];
	            case 3:
	              _i++;
	              _context3.n = 1;
	              break;
	            case 4:
	              return _context3.a(2);
	          }
	        }, _callee3, this);
	      }));
	    }
	  }, {
	    key: "__scriptArgs__",
	    value: function __scriptArgs__(name, id, args, cb) {
	      var keys = Scripts$3.keys(name, id);
	      return [keys.length].concat(_toConsumableArray$2(keys), _toConsumableArray$2(args), [cb]);
	    }
	  }, {
	    key: "__scriptFn__",
	    value: function __scriptFn__(name) {
	      return this.client[name].bind(this.client);
	    }
	  }, {
	    key: "disconnect",
	    value: function disconnect() {
	      var flush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
	      for (var _i2 = 0, _Object$keys = Object.keys(this.limiters); _i2 < _Object$keys.length; _i2++) {
	        var k = _Object$keys[_i2];
	        clearInterval(this.limiters[k]._store.heartbeat);
	      }
	      this.limiters = {};
	      this.terminated = true;
	      if (flush) {
	        return Promise.all([this.client.quit(), this.subscriber.quit()]).then(function () {
	          return undefined;
	        });
	      } else {
	        this.client.disconnect();
	        this.subscriber.disconnect();
	        return this.Promise.resolve();
	      }
	    }
	  }]);
	}();
	var IORedisConnection_1 = IORedisConnection;

	function _typeof$8(o) {
	  "@babel/helpers - typeof";

	  return _typeof$8 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$8(o);
	}
	function _toConsumableArray$3(r) {
	  return _arrayWithoutHoles$3(r) || _iterableToArray$3(r) || _unsupportedIterableToArray$4(r) || _nonIterableSpread$3();
	}
	function _nonIterableSpread$3() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArray$3(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles$3(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$4(r);
	}
	function _slicedToArray$2(r, e) {
	  return _arrayWithHoles$2(r) || _iterableToArrayLimit$2(r, e) || _unsupportedIterableToArray$4(r, e) || _nonIterableRest$2();
	}
	function _nonIterableRest$2() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$4(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$4(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$4(r, a) : void 0;
	  }
	}
	function _arrayLikeToArray$4(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _iterableToArrayLimit$2(r, l) {
	  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (null != t) {
	    var e,
	      n,
	      i,
	      u,
	      a = [],
	      f = !0,
	      o = !1;
	    try {
	      if (i = (t = t.call(r)).next, 0 === l) {
	        if (Object(t) !== t) return;
	        f = !1;
	      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
	    } catch (r) {
	      o = !0, n = r;
	    } finally {
	      try {
	        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
	      } finally {
	        if (o) throw n;
	      }
	    }
	    return a;
	  }
	}
	function _arrayWithHoles$2(r) {
	  if (Array.isArray(r)) return r;
	}
	function _regenerator$5() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$5(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$5(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$5(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$5(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$5(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$5(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$5(u), _regeneratorDefine2$5(u, o, "Generator"), _regeneratorDefine2$5(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$5(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$5 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$5(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$5 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$5(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$5(e, r, n, t);
	}
	function _classCallCheck$8(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$8(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$8(o.key), o);
	  }
	}
	function _createClass$8(e, r, t) {
	  return r && _defineProperties$8(e.prototype, r), t && _defineProperties$8(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$8(t) {
	  var i = _toPrimitive$8(t, "string");
	  return "symbol" == _typeof$8(i) ? i : i + "";
	}
	function _toPrimitive$8(t, r) {
	  if ("object" != _typeof$8(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$8(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var parser$6 = tslib_1.__importStar(parser);
	var RedisDatastore = /*#__PURE__*/function () {
	  function RedisDatastore(instance, storeOptions, storeInstanceOptions) {
	    var _this = this;
	    _classCallCheck$8(this, RedisDatastore);
	    var _a;
	    this.instance = instance;
	    this.storeOptions = storeOptions;
	    this.capacityPriorityCounters = {};
	    this.originalId = this.instance.id;
	    this.clientId = this.instance._randomIndex();
	    parser$6.load(storeInstanceOptions, storeInstanceOptions, this);
	    this.clients = {};
	    this.sharedConnection = storeInstanceOptions.connection != null;
	    this.connection = (_a = storeInstanceOptions.connection) !== null && _a !== void 0 ? _a : this.instance.datastore === "redis" ? new RedisConnection_1({
	      Redis: this.Redis,
	      clientOptions: this.clientOptions,
	      Promise: this.Promise,
	      Events: this.instance.Events
	    }) : this.instance.datastore === "ioredis" ? new IORedisConnection_1({
	      Redis: this.Redis,
	      clientOptions: this.clientOptions,
	      clusterNodes: this.clusterNodes,
	      Promise: this.Promise,
	      Events: this.instance.Events
	    }) : function () {
	      throw new Error("Invalid datastore");
	    }();
	    this.instance.connection = this.connection;
	    this.instance.datastore = this.connection.datastore;
	    this.ready = this.connection.ready.then(function (clients) {
	      _this.clients = clients;
	      return _this.runScript("init", _this.prepareInitSettings(_this.clearDatastore));
	    }).then(function () {
	      return _this.connection.__addLimiter__(_this.instance);
	    }).then(function () {
	      return _this.runScript("register_client", [_this.instance.queued()]);
	    }).then(function () {
	      _this.heartbeat = setInterval(function () {
	        _this.runScript("heartbeat", [])["catch"](function (e) {
	          return _this.instance.Events.trigger("error", e);
	        });
	      }, _this.heartbeatInterval);
	      if (_this.heartbeat.unref) {
	        _this.heartbeat.unref();
	      }
	      return _this.clients;
	    });
	  }
	  return _createClass$8(RedisDatastore, [{
	    key: "__publish__",
	    value: function __publish__(message) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee() {
	        var _yield$this$ready, client;
	        return _regenerator$5().w(function (_context) {
	          while (1) switch (_context.n) {
	            case 0:
	              _context.n = 1;
	              return this.ready;
	            case 1:
	              _yield$this$ready = _context.v;
	              client = _yield$this$ready.client;
	              client.publish(this.instance.channel(), "message:".concat(message.toString()));
	            case 2:
	              return _context.a(2);
	          }
	        }, _callee, this);
	      }));
	    }
	  }, {
	    key: "onMessage",
	    value: function onMessage(channel, message) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee3() {
	        var _this2 = this;
	        var pos, _ref, type, data, _data$split, _data$split2, rawCapacity, priorityClient, counter, capacity, drained, newCapacity, _t2;
	        return _regenerator$5().w(function (_context3) {
	          while (1) switch (_context3.p = _context3.n) {
	            case 0:
	              _context3.p = 0;
	              pos = message.indexOf(":");
	              _ref = [message.slice(0, pos), message.slice(pos + 1)], type = _ref[0], data = _ref[1];
	              if (!(type === "capacity")) {
	                _context3.n = 2;
	                break;
	              }
	              _context3.n = 1;
	              return this.instance._drainAll(data.length > 0 ? ~~data : undefined);
	            case 1:
	              _context3.n = 9;
	              break;
	            case 2:
	              if (!(type === "capacity-priority")) {
	                _context3.n = 7;
	                break;
	              }
	              _data$split = data.split(":"), _data$split2 = _slicedToArray$2(_data$split, 3), rawCapacity = _data$split2[0], priorityClient = _data$split2[1], counter = _data$split2[2];
	              capacity = rawCapacity.length > 0 ? ~~rawCapacity : undefined;
	              if (!(priorityClient === this.clientId)) {
	                _context3.n = 5;
	                break;
	              }
	              _context3.n = 3;
	              return this.instance._drainAll(capacity);
	            case 3:
	              drained = _context3.v;
	              newCapacity = capacity != null ? capacity - (drained || 0) : "";
	              _context3.n = 4;
	              return this.clients.client.publish(this.instance.channel(), "capacity-priority:".concat(newCapacity, "::").concat(counter));
	            case 4:
	              _context3.n = 6;
	              break;
	            case 5:
	              if (priorityClient === "") {
	                clearTimeout(this.capacityPriorityCounters[counter]);
	                delete this.capacityPriorityCounters[counter];
	                this.instance._drainAll(capacity);
	              } else {
	                this.capacityPriorityCounters[counter] = setTimeout(function () {
	                  return tslib_1.__awaiter(_this2, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee2() {
	                    var _t;
	                    return _regenerator$5().w(function (_context2) {
	                      while (1) switch (_context2.p = _context2.n) {
	                        case 0:
	                          _context2.p = 0;
	                          delete this.capacityPriorityCounters[counter];
	                          _context2.n = 1;
	                          return this.runScript("blacklist_client", [priorityClient]);
	                        case 1:
	                          _context2.n = 2;
	                          return this.instance._drainAll(capacity);
	                        case 2:
	                          _context2.n = 4;
	                          break;
	                        case 3:
	                          _context2.p = 3;
	                          _t = _context2.v;
	                          this.instance.Events.trigger("error", _t);
	                        case 4:
	                          return _context2.a(2);
	                      }
	                    }, _callee2, this, [[0, 3]]);
	                  }));
	                }, 1000);
	              }
	            case 6:
	              _context3.n = 9;
	              break;
	            case 7:
	              if (!(type === "message")) {
	                _context3.n = 8;
	                break;
	              }
	              this.instance.Events.trigger("message", data);
	              _context3.n = 9;
	              break;
	            case 8:
	              if (!(type === "blocked")) {
	                _context3.n = 9;
	                break;
	              }
	              _context3.n = 9;
	              return this.instance._dropAllQueued();
	            case 9:
	              _context3.n = 11;
	              break;
	            case 10:
	              _context3.p = 10;
	              _t2 = _context3.v;
	              this.instance.Events.trigger("error", _t2);
	            case 11:
	              return _context3.a(2);
	          }
	        }, _callee3, this, [[0, 10]]);
	      }));
	    }
	  }, {
	    key: "__disconnect__",
	    value: function __disconnect__(flush) {
	      if (this.heartbeat) {
	        clearInterval(this.heartbeat);
	      }
	      if (this.sharedConnection) {
	        return this.connection.__removeLimiter__(this.instance).then(function () {});
	      } else {
	        return this.connection.disconnect(flush);
	      }
	    }
	  }, {
	    key: "runScript",
	    value: function runScript(name, args) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee4() {
	        var _this3 = this;
	        return _regenerator$5().w(function (_context4) {
	          while (1) switch (_context4.n) {
	            case 0:
	              if (!(name !== "init" && name !== "register_client")) {
	                _context4.n = 1;
	                break;
	              }
	              _context4.n = 1;
	              return this.ready;
	            case 1:
	              return _context4.a(2, new this.Promise(function (resolve, reject) {
	                var all_args = [Date.now(), _this3.clientId].concat(_toConsumableArray$3(args));
	                _this3.instance.Events.trigger("debug", "Calling Redis script: ".concat(name, ".lua"), all_args);
	                var arr = _this3.connection.__scriptArgs__(name, _this3.originalId, all_args, function (err, replies) {
	                  if (err != null) {
	                    return reject(err);
	                  }
	                  return resolve(replies);
	                });
	                _this3.connection.__scriptFn__(name).apply(void 0, _toConsumableArray$3(arr));
	              })["catch"](function (e) {
	                if (e.message.match(/^(.*\s)?SETTINGS_KEY_NOT_FOUND$/) != null) {
	                  if (name === "heartbeat") {
	                    return _this3.Promise.resolve();
	                  } else {
	                    return _this3.runScript("init", _this3.prepareInitSettings(false)).then(function () {
	                      return _this3.runScript(name, args);
	                    });
	                  }
	                } else if (e.message.match(/^(.*\s)?UNKNOWN_CLIENT$/) != null) {
	                  return _this3.runScript("register_client", [_this3.instance.queued()]).then(function () {
	                    return _this3.runScript(name, args);
	                  });
	                } else {
	                  return _this3.Promise.reject(e);
	                }
	              }));
	          }
	        }, _callee4, this);
	      }));
	    }
	  }, {
	    key: "prepareArray",
	    value: function prepareArray(arr) {
	      return arr.map(function (x) {
	        return x != null ? x.toString() : "";
	      });
	    }
	  }, {
	    key: "prepareObject",
	    value: function prepareObject(obj) {
	      var arr = [];
	      for (var _i = 0, _Object$entries = Object.entries(obj); _i < _Object$entries.length; _i++) {
	        var _Object$entries$_i = _slicedToArray$2(_Object$entries[_i], 2),
	          k = _Object$entries$_i[0],
	          v = _Object$entries$_i[1];
	        arr.push(k, v != null ? v.toString() : "");
	      }
	      return arr;
	    }
	  }, {
	    key: "prepareInitSettings",
	    value: function prepareInitSettings(clear) {
	      var args = this.prepareObject(Object.assign(Object.assign({}, this.storeOptions), {
	        id: this.originalId,
	        version: this.instance.version,
	        groupTimeout: this.timeout,
	        clientTimeout: this.clientTimeout
	      }));
	      args.unshift(clear ? "1" : "0", this.instance.version);
	      return args;
	    }
	  }, {
	    key: "convertBool",
	    value: function convertBool(b) {
	      return !!b;
	    }
	  }, {
	    key: "__updateSettings__",
	    value: function __updateSettings__(options) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee5() {
	        return _regenerator$5().w(function (_context5) {
	          while (1) switch (_context5.n) {
	            case 0:
	              _context5.n = 1;
	              return this.runScript("update_settings", this.prepareObject(options));
	            case 1:
	              parser$6.overwrite(options, options, this.storeOptions);
	            case 2:
	              return _context5.a(2);
	          }
	        }, _callee5, this);
	      }));
	    }
	  }, {
	    key: "__running__",
	    value: function __running__() {
	      return this.runScript("running", []);
	    }
	  }, {
	    key: "__queued__",
	    value: function __queued__() {
	      return this.runScript("queued", []);
	    }
	  }, {
	    key: "__done__",
	    value: function __done__() {
	      return this.runScript("done", []);
	    }
	  }, {
	    key: "__groupCheck__",
	    value: function __groupCheck__() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee6() {
	        var _t3;
	        return _regenerator$5().w(function (_context6) {
	          while (1) switch (_context6.n) {
	            case 0:
	              _t3 = this;
	              _context6.n = 1;
	              return this.runScript("group_check", []);
	            case 1:
	              return _context6.a(2, _t3.convertBool.call(_t3, _context6.v));
	          }
	        }, _callee6, this);
	      }));
	    }
	  }, {
	    key: "__incrementReservoir__",
	    value: function __incrementReservoir__(incr) {
	      return this.runScript("increment_reservoir", [incr]);
	    }
	  }, {
	    key: "__currentReservoir__",
	    value: function __currentReservoir__() {
	      return this.runScript("current_reservoir", []);
	    }
	  }, {
	    key: "__check__",
	    value: function __check__(weight) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee7() {
	        var _t4;
	        return _regenerator$5().w(function (_context7) {
	          while (1) switch (_context7.n) {
	            case 0:
	              _t4 = this;
	              _context7.n = 1;
	              return this.runScript("check", this.prepareArray([weight]));
	            case 1:
	              return _context7.a(2, _t4.convertBool.call(_t4, _context7.v));
	          }
	        }, _callee7, this);
	      }));
	    }
	  }, {
	    key: "__register__",
	    value: function __register__(index, weight, expiration) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee8() {
	        var _yield$this$runScript, _yield$this$runScript2, success, wait, reservoir;
	        return _regenerator$5().w(function (_context8) {
	          while (1) switch (_context8.n) {
	            case 0:
	              _context8.n = 1;
	              return this.runScript("register", this.prepareArray([index, weight, expiration]));
	            case 1:
	              _yield$this$runScript = _context8.v;
	              _yield$this$runScript2 = _slicedToArray$2(_yield$this$runScript, 3);
	              success = _yield$this$runScript2[0];
	              wait = _yield$this$runScript2[1];
	              reservoir = _yield$this$runScript2[2];
	              return _context8.a(2, {
	                success: this.convertBool(success),
	                wait: wait,
	                reservoir: reservoir
	              });
	          }
	        }, _callee8, this);
	      }));
	    }
	  }, {
	    key: "__submit__",
	    value: function __submit__(queueLength, weight) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee9() {
	        var _yield$this$runScript3, _yield$this$runScript4, reachedHWM, blocked, strategy, error, overweight, _overweight, _weight, maxConcurrent, _t5;
	        return _regenerator$5().w(function (_context9) {
	          while (1) switch (_context9.p = _context9.n) {
	            case 0:
	              _context9.p = 0;
	              _context9.n = 1;
	              return this.runScript("submit", this.prepareArray([queueLength, weight]));
	            case 1:
	              _yield$this$runScript3 = _context9.v;
	              _yield$this$runScript4 = _slicedToArray$2(_yield$this$runScript3, 3);
	              reachedHWM = _yield$this$runScript4[0];
	              blocked = _yield$this$runScript4[1];
	              strategy = _yield$this$runScript4[2];
	              return _context9.a(2, {
	                reachedHWM: this.convertBool(reachedHWM),
	                blocked: this.convertBool(blocked),
	                strategy: strategy
	              });
	            case 2:
	              _context9.p = 2;
	              _t5 = _context9.v;
	              error = _t5;
	              overweight = error.message.match(/^(?:.*\s)?OVERWEIGHT:(\d+):(\d+)$/);
	              if (!(overweight != null)) {
	                _context9.n = 3;
	                break;
	              }
	              _overweight = _slicedToArray$2(overweight, 3), _weight = _overweight[1], maxConcurrent = _overweight[2];
	              throw new BottleneckError_1("Impossible to add a job having a weight of ".concat(_weight, " to a limiter having a maxConcurrent setting of ").concat(maxConcurrent));
	            case 3:
	              throw _t5;
	            case 4:
	              return _context9.a(2);
	          }
	        }, _callee9, this, [[0, 2]]);
	      }));
	    }
	  }, {
	    key: "__free__",
	    value: function __free__(index, weight) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$5().m(function _callee0() {
	        var running;
	        return _regenerator$5().w(function (_context0) {
	          while (1) switch (_context0.n) {
	            case 0:
	              _context0.n = 1;
	              return this.runScript("free", this.prepareArray([index]));
	            case 1:
	              running = _context0.v;
	              return _context0.a(2, {
	                running: running
	              });
	          }
	        }, _callee0, this);
	      }));
	    }
	  }]);
	}();
	var RedisDatastore_1 = RedisDatastore;

	function _typeof$9(o) {
	  "@babel/helpers - typeof";

	  return _typeof$9 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$9(o);
	}
	function _classCallCheck$9(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$9(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$9(o.key), o);
	  }
	}
	function _createClass$9(e, r, t) {
	  return r && _defineProperties$9(e.prototype, r), t && _defineProperties$9(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$9(t) {
	  var i = _toPrimitive$9(t, "string");
	  return "symbol" == _typeof$9(i) ? i : i + "";
	}
	function _toPrimitive$9(t, r) {
	  if ("object" != _typeof$9(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$9(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var States = /*#__PURE__*/function () {
	  function States(status) {
	    _classCallCheck$9(this, States);
	    this.status = status;
	    this._jobs = {};
	    this.counts = this.status.map(function () {
	      return 0;
	    });
	  }
	  return _createClass$9(States, [{
	    key: "next",
	    value: function next(id) {
	      var current = this._jobs[id];
	      var next = current + 1;
	      if (current != null && next < this.status.length) {
	        this.counts[current]--;
	        this.counts[next]++;
	        this._jobs[id]++;
	      } else if (current != null) {
	        this.counts[current]--;
	        delete this._jobs[id];
	      }
	    }
	  }, {
	    key: "start",
	    value: function start(id) {
	      var initial = 0;
	      this._jobs[id] = initial;
	      this.counts[initial]++;
	    }
	  }, {
	    key: "remove",
	    value: function remove(id) {
	      var current = this._jobs[id];
	      if (current != null) {
	        this.counts[current]--;
	        delete this._jobs[id];
	      }
	      return current != null;
	    }
	  }, {
	    key: "jobStatus",
	    value: function jobStatus(id) {
	      var _a;
	      return (_a = this.status[this._jobs[id]]) !== null && _a !== void 0 ? _a : null;
	    }
	  }, {
	    key: "statusJobs",
	    value: function statusJobs(status) {
	      var _this = this;
	      if (status != null) {
	        var pos = this.status.indexOf(status);
	        if (pos < 0) {
	          throw new BottleneckError_1("status must be one of ".concat(this.status.join(', ')));
	        }
	        return Object.keys(this._jobs).filter(function (k) {
	          return _this._jobs[k] === pos;
	        });
	      } else {
	        return Object.keys(this._jobs);
	      }
	    }
	  }, {
	    key: "statusCounts",
	    value: function statusCounts() {
	      var _this2 = this;
	      return this.counts.reduce(function (acc, v, i) {
	        acc[_this2.status[i]] = v;
	        return acc;
	      }, {});
	    }
	  }]);
	}();
	var States_1 = States;

	function _typeof$a(o) {
	  "@babel/helpers - typeof";

	  return _typeof$a = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$a(o);
	}
	function _regenerator$6() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$6(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$6(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$6(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$6(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$6(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$6(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$6(u), _regeneratorDefine2$6(u, o, "Generator"), _regeneratorDefine2$6(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$6(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$6 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$6(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$6 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$6(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$6(e, r, n, t);
	}
	function _toConsumableArray$4(r) {
	  return _arrayWithoutHoles$4(r) || _iterableToArray$4(r) || _unsupportedIterableToArray$5(r) || _nonIterableSpread$4();
	}
	function _nonIterableSpread$4() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$5(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$5(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$5(r, a) : void 0;
	  }
	}
	function _iterableToArray$4(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles$4(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$5(r);
	}
	function _arrayLikeToArray$5(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _classCallCheck$a(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$a(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$a(o.key), o);
	  }
	}
	function _createClass$a(e, r, t) {
	  return r && _defineProperties$a(e.prototype, r), t && _defineProperties$a(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$a(t) {
	  var i = _toPrimitive$a(t, "string");
	  return "symbol" == _typeof$a(i) ? i : i + "";
	}
	function _toPrimitive$a(t, r) {
	  if ("object" != _typeof$a(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$a(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var Sync = /*#__PURE__*/function () {
	  function Sync(name, Promise) {
	    var _this = this;
	    _classCallCheck$a(this, Sync);
	    this.name = name;
	    this.Promise = Promise;
	    this._running = 0;
	    this.schedule = function (task) {
	      var resolve;
	      var reject;
	      var promise = new _this.Promise(function (_resolve, _reject) {
	        resolve = _resolve;
	        reject = _reject;
	      });
	      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	        args[_key - 1] = arguments[_key];
	      }
	      _this._queue.push({
	        task: task,
	        args: args,
	        resolve: resolve,
	        reject: reject
	      });
	      _this._tryToRun();
	      return promise;
	    };
	    this._queue = new DLList_1();
	  }
	  return _createClass$a(Sync, [{
	    key: "isEmpty",
	    value: function isEmpty() {
	      return this._queue.length === 0;
	    }
	  }, {
	    key: "_tryToRun",
	    value: function _tryToRun() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$6().m(function _callee() {
	        var _this$_queue$shift, task, args, resolve, reject, cb, returned, _t;
	        return _regenerator$6().w(function (_context) {
	          while (1) switch (_context.p = _context.n) {
	            case 0:
	              if (!(this._running < 1 && this._queue.length > 0)) {
	                _context.n = 5;
	                break;
	              }
	              this._running++;
	              _this$_queue$shift = this._queue.shift(), task = _this$_queue$shift.task, args = _this$_queue$shift.args, resolve = _this$_queue$shift.resolve, reject = _this$_queue$shift.reject;
	              _context.p = 1;
	              _context.n = 2;
	              return task.apply(void 0, _toConsumableArray$4(args));
	            case 2:
	              returned = _context.v;
	              cb = function cb() {
	                return resolve(returned);
	              };
	              _context.n = 4;
	              break;
	            case 3:
	              _context.p = 3;
	              _t = _context.v;
	              cb = function cb() {
	                return reject(_t);
	              };
	            case 4:
	              this._running--;
	              this._tryToRun();
	              cb();
	            case 5:
	              return _context.a(2);
	          }
	        }, _callee, this, [[1, 3]]);
	      }));
	    }
	  }]);
	}();
	var Sync_1 = Sync;

	var version = "2.19.6";
	var version$1 = {
		version: version
	};

	var version$2 = /*#__PURE__*/Object.freeze({
		version: version,
		default: version$1
	});

	function _typeof$b(o) {
	  "@babel/helpers - typeof";

	  return _typeof$b = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$b(o);
	}
	function _slicedToArray$3(r, e) {
	  return _arrayWithHoles$3(r) || _iterableToArrayLimit$3(r, e) || _unsupportedIterableToArray$6(r, e) || _nonIterableRest$3();
	}
	function _nonIterableRest$3() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArrayLimit$3(r, l) {
	  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (null != t) {
	    var e,
	      n,
	      i,
	      u,
	      a = [],
	      f = !0,
	      o = !1;
	    try {
	      if (i = (t = t.call(r)).next, 0 === l) {
	        if (Object(t) !== t) return;
	        f = !1;
	      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
	    } catch (r) {
	      o = !0, n = r;
	    } finally {
	      try {
	        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
	      } finally {
	        if (o) throw n;
	      }
	    }
	    return a;
	  }
	}
	function _arrayWithHoles$3(r) {
	  if (Array.isArray(r)) return r;
	}
	function _regenerator$7() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$7(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$7(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$7(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$7(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$7(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$7(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$7(u), _regeneratorDefine2$7(u, o, "Generator"), _regeneratorDefine2$7(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$7(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$7 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$7(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$7 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$7(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$7(e, r, n, t);
	}
	function _toConsumableArray$5(r) {
	  return _arrayWithoutHoles$5(r) || _iterableToArray$5(r) || _unsupportedIterableToArray$6(r) || _nonIterableSpread$5();
	}
	function _nonIterableSpread$5() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$6(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$6(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$6(r, a) : void 0;
	  }
	}
	function _iterableToArray$5(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles$5(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$6(r);
	}
	function _arrayLikeToArray$6(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _classCallCheck$b(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$b(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$b(o.key), o);
	  }
	}
	function _createClass$b(e, r, t) {
	  return r && _defineProperties$b(e.prototype, r), t && _defineProperties$b(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$b(t) {
	  var i = _toPrimitive$b(t, "string");
	  return "symbol" == _typeof$b(i) ? i : i + "";
	}
	function _toPrimitive$b(t, r) {
	  if ("object" != _typeof$b(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$b(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var parser$7 = tslib_1.__importStar(parser);
	var Events_1$1 = tslib_1.__importDefault(Events_1);
	var RedisConnection_1$1 = tslib_1.__importDefault(RedisConnection_1);
	var IORedisConnection_1$1 = tslib_1.__importDefault(IORedisConnection_1);
	var Scripts$4 = tslib_1.__importStar(Scripts);
	var Group = /*#__PURE__*/function () {
	  function Group() {
	    var _this = this;
	    var limiterOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    _classCallCheck$b(this, Group);
	    this.limiterOptions = limiterOptions;
	    this.defaults = {
	      timeout: 1000 * 60 * 5,
	      connection: null,
	      Promise: Promise,
	      id: "group-key"
	    };
	    this.instances = {};
	    this.deleteKey = function () {
	      for (var _len = arguments.length, args_1 = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
	        args_1[_key2] = arguments[_key2];
	      }
	      return tslib_1.__awaiter(_this, [].concat(args_1), void 0, function () {
	        var _this2 = this;
	        var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
	        return /*#__PURE__*/_regenerator$7().m(function _callee() {
	          var instance, deleted;
	          return _regenerator$7().w(function (_context) {
	            while (1) switch (_context.n) {
	              case 0:
	                instance = _this2.instances[key];
	                deleted = 0;
	                if (!_this2.connection) {
	                  _context.n = 2;
	                  break;
	                }
	                _context.n = 1;
	                return _this2.connection.__runCommand__(["del"].concat(_toConsumableArray$5(Scripts$4.allKeys("".concat(_this2.id, "-").concat(key)))));
	              case 1:
	                deleted = _context.v;
	              case 2:
	                if (!(instance != null)) {
	                  _context.n = 3;
	                  break;
	                }
	                delete _this2.instances[key];
	                _context.n = 3;
	                return instance.disconnect();
	              case 3:
	                return _context.a(2, instance != null || deleted > 0);
	            }
	          }, _callee);
	        })();
	      });
	    };
	    parser$7.load(this.limiterOptions, this.defaults, this);
	    this.Events = new Events_1$1["default"](this);
	    this.Bottleneck = Bottleneck_1;
	    this._startAutoCleanup();
	    this.sharedConnection = this.connection != null;
	    if (this.connection == null) {
	      if (this.limiterOptions.datastore === "redis") {
	        this.connection = new RedisConnection_1$1["default"](Object.assign(Object.assign({}, this.limiterOptions), {
	          Events: this.Events
	        }));
	      } else if (this.limiterOptions.datastore === "ioredis") {
	        this.connection = new IORedisConnection_1$1["default"](Object.assign(Object.assign({}, this.limiterOptions), {
	          Events: this.Events
	        }));
	      }
	    }
	  }
	  return _createClass$b(Group, [{
	    key: "key",
	    value: function key() {
	      var _this3 = this;
	      var _key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
	      var _a;
	      return (_a = this.instances[_key]) !== null && _a !== void 0 ? _a : function () {
	        var limiter = _this3.instances[_key] = new _this3.Bottleneck(Object.assign(Object.assign({}, _this3.limiterOptions), {
	          id: "".concat(_this3.id, "-").concat(_key),
	          timeout: _this3.timeout,
	          connection: _this3.connection
	        }));
	        _this3.Events.trigger("created", limiter, _key);
	        return limiter;
	      }();
	    }
	  }, {
	    key: "limiters",
	    value: function limiters() {
	      var _this4 = this;
	      return Object.keys(this.instances).map(function (k) {
	        return {
	          key: k,
	          limiter: _this4.instances[k]
	        };
	      });
	    }
	  }, {
	    key: "keys",
	    value: function keys() {
	      return Object.keys(this.instances);
	    }
	  }, {
	    key: "clusterKeys",
	    value: function clusterKeys() {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$7().m(function _callee2() {
	        var start, end, settingsKeys;
	        return _regenerator$7().w(function (_context2) {
	          while (1) switch (_context2.n) {
	            case 0:
	              if (!(this.connection == null)) {
	                _context2.n = 1;
	                break;
	              }
	              return _context2.a(2, this.Promise.resolve(this.keys()));
	            case 1:
	              start = "b_".concat(this.id, "-").length;
	              end = "_settings".length;
	              _context2.n = 2;
	              return this.connection.__scanKeys__("b_".concat(this.id, "-*_settings"));
	            case 2:
	              settingsKeys = _context2.v;
	              return _context2.a(2, settingsKeys.map(function (k) {
	                return k.slice(start, -end);
	              }));
	          }
	        }, _callee2, this);
	      }));
	    }
	  }, {
	    key: "_startAutoCleanup",
	    value: function _startAutoCleanup() {
	      var _this5 = this;
	      if (this.interval) {
	        clearInterval(this.interval);
	      }
	      this.interval = setInterval(function () {
	        return tslib_1.__awaiter(_this5, void 0, void 0, /*#__PURE__*/_regenerator$7().m(function _callee3() {
	          var time, _i, _Object$entries, _Object$entries$_i, k, v, _t;
	          return _regenerator$7().w(function (_context3) {
	            while (1) switch (_context3.p = _context3.n) {
	              case 0:
	                time = Date.now();
	                _i = 0, _Object$entries = Object.entries(this.instances);
	              case 1:
	                if (!(_i < _Object$entries.length)) {
	                  _context3.n = 7;
	                  break;
	                }
	                _Object$entries$_i = _slicedToArray$3(_Object$entries[_i], 2), k = _Object$entries$_i[0], v = _Object$entries$_i[1];
	                _context3.p = 2;
	                _context3.n = 3;
	                return v._store.__groupCheck__(time);
	              case 3:
	                if (!_context3.v) {
	                  _context3.n = 4;
	                  break;
	                }
	                this.deleteKey(k);
	              case 4:
	                _context3.n = 6;
	                break;
	              case 5:
	                _context3.p = 5;
	                _t = _context3.v;
	                v.Events.trigger("error", _t);
	              case 6:
	                _i++;
	                _context3.n = 1;
	                break;
	              case 7:
	                return _context3.a(2);
	            }
	          }, _callee3, this, [[2, 5]]);
	        }));
	      }, this.timeout / 2);
	      if (this.interval.unref) {
	        this.interval.unref();
	      }
	    }
	  }, {
	    key: "updateSettings",
	    value: function updateSettings() {
	      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	      parser$7.overwrite(options, this.defaults, this);
	      parser$7.overwrite(options, options, this.limiterOptions);
	      if (options.timeout != null) {
	        this._startAutoCleanup();
	      }
	    }
	  }, {
	    key: "disconnect",
	    value: function disconnect() {
	      var flush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
	      var _a;
	      if (!this.sharedConnection) {
	        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.disconnect(flush);
	      }
	    }
	  }]);
	}();
	var Group_1 = Group;

	function _typeof$c(o) {
	  "@babel/helpers - typeof";

	  return _typeof$c = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$c(o);
	}
	function _classCallCheck$c(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$c(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$c(o.key), o);
	  }
	}
	function _createClass$c(e, r, t) {
	  return r && _defineProperties$c(e.prototype, r), t && _defineProperties$c(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$c(t) {
	  var i = _toPrimitive$c(t, "string");
	  return "symbol" == _typeof$c(i) ? i : i + "";
	}
	function _toPrimitive$c(t, r) {
	  if ("object" != _typeof$c(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$c(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var parser$8 = tslib_1.__importStar(parser);
	var Batcher = /*#__PURE__*/function () {
	  function Batcher() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    _classCallCheck$c(this, Batcher);
	    this.options = options;
	    this.defaults = {
	      maxTime: null,
	      maxSize: null,
	      Promise: Promise
	    };
	    this._arr = [];
	    parser$8.load(this.options, this.defaults, this);
	    this.Events = new Events_1(this);
	    this._resetPromise();
	    this._lastFlush = Date.now();
	  }
	  return _createClass$c(Batcher, [{
	    key: "_resetPromise",
	    value: function _resetPromise() {
	      var _this = this;
	      this._promise = new this.Promise(function (res) {
	        _this._resolve = res;
	      });
	    }
	  }, {
	    key: "_flush",
	    value: function _flush() {
	      if (this._timeout) {
	        clearTimeout(this._timeout);
	      }
	      this._lastFlush = Date.now();
	      this._resolve();
	      this.Events.trigger("batch", this._arr);
	      this._arr = [];
	      this._resetPromise();
	    }
	  }, {
	    key: "add",
	    value: function add(data) {
	      var _this2 = this;
	      this._arr.push(data);
	      var ret = this._promise;
	      if (this._arr.length === this.maxSize) {
	        this._flush();
	      } else if (this.maxTime != null && this._arr.length === 1) {
	        this._timeout = setTimeout(function () {
	          _this2._flush();
	        }, this.maxTime);
	      }
	      return ret;
	    }
	  }]);
	}();
	var Batcher_1 = Batcher;

	var require$$1 = getCjsExportFromNamespace(version$2);

	function _toConsumableArray$6(r) {
	  return _arrayWithoutHoles$6(r) || _iterableToArray$6(r) || _unsupportedIterableToArray$7(r) || _nonIterableSpread$6();
	}
	function _nonIterableSpread$6() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _arrayWithoutHoles$6(r) {
	  if (Array.isArray(r)) return _arrayLikeToArray$7(r);
	}
	function _toArray(r) {
	  return _arrayWithHoles$4(r) || _iterableToArray$6(r) || _unsupportedIterableToArray$7(r) || _nonIterableRest$4();
	}
	function _iterableToArray$6(r) {
	  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _slicedToArray$4(r, e) {
	  return _arrayWithHoles$4(r) || _iterableToArrayLimit$4(r, e) || _unsupportedIterableToArray$7(r, e) || _nonIterableRest$4();
	}
	function _nonIterableRest$4() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray$7(r, a) {
	  if (r) {
	    if ("string" == typeof r) return _arrayLikeToArray$7(r, a);
	    var t = {}.toString.call(r).slice(8, -1);
	    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$7(r, a) : void 0;
	  }
	}
	function _arrayLikeToArray$7(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	function _iterableToArrayLimit$4(r, l) {
	  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (null != t) {
	    var e,
	      n,
	      i,
	      u,
	      a = [],
	      f = !0,
	      o = !1;
	    try {
	      if (i = (t = t.call(r)).next, 0 === l) {
	        if (Object(t) !== t) return;
	        f = !1;
	      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
	    } catch (r) {
	      o = !0, n = r;
	    } finally {
	      try {
	        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
	      } finally {
	        if (o) throw n;
	      }
	    }
	    return a;
	  }
	}
	function _arrayWithHoles$4(r) {
	  if (Array.isArray(r)) return r;
	}
	function _typeof$d(o) {
	  "@babel/helpers - typeof";

	  return _typeof$d = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof$d(o);
	}
	function _regenerator$8() {
	  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,
	    t,
	    r = "function" == typeof Symbol ? Symbol : {},
	    n = r.iterator || "@@iterator",
	    o = r.toStringTag || "@@toStringTag";
	  function i(r, n, o, i) {
	    var c = n && n.prototype instanceof Generator ? n : Generator,
	      u = Object.create(c.prototype);
	    return _regeneratorDefine2$8(u, "_invoke", function (r, n, o) {
	      var i,
	        c,
	        u,
	        f = 0,
	        p = o || [],
	        y = !1,
	        G = {
	          p: 0,
	          n: 0,
	          v: e,
	          a: d,
	          f: d.bind(e, 4),
	          d: function d(t, r) {
	            return i = t, c = 0, u = e, G.n = r, a;
	          }
	        };
	      function d(r, n) {
	        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
	          var o,
	            i = p[t],
	            d = G.p,
	            l = i[2];
	          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
	        }
	        if (o || r > 1) return a;
	        throw y = !0, n;
	      }
	      return function (o, p, l) {
	        if (f > 1) throw TypeError("Generator is already running");
	        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
	          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
	          try {
	            if (f = 2, i) {
	              if (c || (o = "next"), t = i[o]) {
	                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
	                if (!t.done) return t;
	                u = t.value, c < 2 && (c = 0);
	              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
	              i = e;
	            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
	          } catch (t) {
	            i = e, c = 1, u = t;
	          } finally {
	            f = 1;
	          }
	        }
	        return {
	          value: t,
	          done: y
	        };
	      };
	    }(r, o, i), !0), u;
	  }
	  var a = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  t = Object.getPrototypeOf;
	  var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2$8(t = {}, n, function () {
	      return this;
	    }), t),
	    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	  function f(e) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2$8(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2$8(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2$8(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2$8(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2$8(u), _regeneratorDefine2$8(u, o, "Generator"), _regeneratorDefine2$8(u, n, function () {
	    return this;
	  }), _regeneratorDefine2$8(u, "toString", function () {
	    return "[object Generator]";
	  }), (_regenerator$8 = function _regenerator() {
	    return {
	      w: i,
	      m: f
	    };
	  })();
	}
	function _regeneratorDefine2$8(e, r, n, t) {
	  var i = Object.defineProperty;
	  try {
	    i({}, "", {});
	  } catch (e) {
	    i = 0;
	  }
	  _regeneratorDefine2$8 = function _regeneratorDefine(e, r, n, t) {
	    function o(r, n) {
	      _regeneratorDefine2$8(e, r, function (e) {
	        return this._invoke(r, n, e);
	      });
	    }
	    r ? i ? i(e, r, {
	      value: n,
	      enumerable: !t,
	      configurable: !t,
	      writable: !t
	    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	  }, _regeneratorDefine2$8(e, r, n, t);
	}
	function _classCallCheck$d(a, n) {
	  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties$d(e, r) {
	  for (var t = 0; t < r.length; t++) {
	    var o = r[t];
	    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey$d(o.key), o);
	  }
	}
	function _createClass$d(e, r, t) {
	  return r && _defineProperties$d(e.prototype, r), t && _defineProperties$d(e, t), Object.defineProperty(e, "prototype", {
	    writable: !1
	  }), e;
	}
	function _toPropertyKey$d(t) {
	  var i = _toPrimitive$d(t, "string");
	  return "symbol" == _typeof$d(i) ? i : i + "";
	}
	function _toPrimitive$d(t, r) {
	  if ("object" != _typeof$d(t) || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r || "default");
	    if ("object" != _typeof$d(i)) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	var NUM_PRIORITIES$1 = 10;
	var DEFAULT_PRIORITY$1 = 5;
	var parser$9 = tslib_1.__importStar(parser);
	var Bottleneck = /*#__PURE__*/function () {
	  function Bottleneck() {
	    var _this = this;
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    _classCallCheck$d(this, Bottleneck);
	    this.strategy = Bottleneck.strategy;
	    this.BottleneckError = Bottleneck.BottleneckError;
	    this.jobDefaults = {
	      priority: DEFAULT_PRIORITY$1,
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
	    this._addToQueue = function (job) {
	      return tslib_1.__awaiter(_this, void 0, void 0, /*#__PURE__*/_regenerator$8().m(function _callee() {
	        var args, options, reachedHWM, blocked, strategy, result, shifted, _t;
	        return _regenerator$8().w(function (_context) {
	          while (1) switch (_context.p = _context.n) {
	            case 0:
	              args = job.args, options = job.options;
	              _context.p = 1;
	              _context.n = 2;
	              return this._store.__submit__(this.queued(), options.weight);
	            case 2:
	              result = _context.v;
	              reachedHWM = result.reachedHWM;
	              blocked = result.blocked;
	              strategy = result.strategy;
	              _context.n = 4;
	              break;
	            case 3:
	              _context.p = 3;
	              _t = _context.v;
	              this.Events.trigger("debug", "Could not queue ".concat(options.id), {
	                args: args,
	                options: options,
	                error: _t
	              });
	              job.doDrop({
	                error: _t
	              });
	              return _context.a(2, false);
	            case 4:
	              if (!blocked) {
	                _context.n = 5;
	                break;
	              }
	              job.doDrop();
	              return _context.a(2, true);
	            case 5:
	              if (!reachedHWM) {
	                _context.n = 6;
	                break;
	              }
	              if (strategy === Bottleneck.strategy.LEAK) {
	                shifted = this._queues.shiftLastFrom(options.priority);
	              } else if (strategy === Bottleneck.strategy.OVERFLOW_PRIORITY) {
	                shifted = this._queues.shiftLastFrom(options.priority + 1);
	              } else if (strategy === Bottleneck.strategy.OVERFLOW) {
	                shifted = job;
	              }
	              if (shifted != null) {
	                shifted.doDrop();
	              }
	              if (!(shifted == null || strategy === Bottleneck.strategy.OVERFLOW)) {
	                _context.n = 6;
	                break;
	              }
	              if (shifted == null) {
	                job.doDrop();
	              }
	              return _context.a(2, reachedHWM);
	            case 6:
	              job.doQueue(reachedHWM, blocked);
	              this._queues.push(job);
	              _context.n = 7;
	              return this._drainAll();
	            case 7:
	              return _context.a(2, reachedHWM);
	          }
	        }, _callee, this, [[1, 3]]);
	      }));
	    };
	    // Initialize static version if not set
	    if (!Bottleneck.version) {
	      Bottleneck.version = require$$1.version;
	    }
	    this.version = Bottleneck.version;
	    for (var _len = arguments.length, invalid = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      invalid[_key - 1] = arguments[_key];
	    }
	    this._validateOptions(options, invalid);
	    parser$9.load(options, this.instanceDefaults, this);
	    this._queues = new Queues_1(NUM_PRIORITIES$1);
	    this._states = new States_1(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
	    this.Events = new Events_1(this);
	    this._submitLock = new Sync_1("submit", this.Promise);
	    this._registerLock = new Sync_1("register", this.Promise);
	    var storeOptions = parser$9.load(options, this.storeDefaults, {});
	    this._store = this.datastore === "redis" || this.datastore === "ioredis" || this.connection != null ? function () {
	      var storeInstanceOptions = parser$9.load(options, _this.redisStoreDefaults, {});
	      return new RedisDatastore_1(_this, storeOptions, storeInstanceOptions);
	    }() : this.datastore === "local" ? function () {
	      var storeInstanceOptions = parser$9.load(options, _this.localStoreDefaults, {});
	      return new LocalDatastore_1(_this, storeOptions, storeInstanceOptions);
	    }() : function () {
	      throw new Bottleneck.BottleneckError("Invalid datastore type: ".concat(_this.datastore));
	    }();
	    this._queues.on("leftzero", function () {
	      var _a, _b;
	      return (_b = (_a = _this._store.heartbeat) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.call(_a);
	    });
	    this._queues.on("zero", function () {
	      var _a, _b;
	      return (_b = (_a = _this._store.heartbeat) === null || _a === void 0 ? void 0 : _a.unref) === null || _b === void 0 ? void 0 : _b.call(_a);
	    });
	  }
	  return _createClass$d(Bottleneck, [{
	    key: "_validateOptions",
	    value: function _validateOptions(options, invalid) {
	      if (options == null || _typeof$d(options) !== "object" || invalid.length !== 0) {
	        throw new Bottleneck.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
	      }
	    }
	  }, {
	    key: "ready",
	    value: function ready() {
	      return this._store.ready;
	    }
	  }, {
	    key: "clients",
	    value: function clients() {
	      return this._store.clients;
	    }
	  }, {
	    key: "channel",
	    value: function channel() {
	      return "b_".concat(this.id);
	    }
	  }, {
	    key: "channel_client",
	    value: function channel_client() {
	      return "b_".concat(this.id, "_").concat(this._store.clientId);
	    }
	  }, {
	    key: "publish",
	    value: function publish(message) {
	      this._store.__publish__(message);
	    }
	  }, {
	    key: "disconnect",
	    value: function disconnect() {
	      var flush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
	      return this._store.__disconnect__(flush);
	    }
	  }, {
	    key: "chain",
	    value: function chain(limiter) {
	      this._limiter = limiter;
	      return this;
	    }
	  }, {
	    key: "queued",
	    value: function queued(priority) {
	      return this._queues.queued(priority);
	    }
	  }, {
	    key: "clusterQueued",
	    value: function clusterQueued() {
	      return this._store.__queued__();
	    }
	  }, {
	    key: "empty",
	    value: function empty() {
	      return this.queued() === 0 && this._submitLock.isEmpty();
	    }
	  }, {
	    key: "running",
	    value: function running() {
	      return this._store.__running__();
	    }
	  }, {
	    key: "done",
	    value: function done() {
	      return this._store.__done__();
	    }
	  }, {
	    key: "jobStatus",
	    value: function jobStatus(id) {
	      return this._states.jobStatus(id);
	    }
	  }, {
	    key: "jobs",
	    value: function jobs(status) {
	      return this._states.statusJobs(status);
	    }
	  }, {
	    key: "counts",
	    value: function counts() {
	      return this._states.statusCounts();
	    }
	  }, {
	    key: "_randomIndex",
	    value: function _randomIndex() {
	      return Math.random().toString(36).slice(2);
	    }
	  }, {
	    key: "check",
	    value: function check() {
	      var weight = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
	      return this._store.__check__(weight);
	    }
	  }, {
	    key: "_clearGlobalState",
	    value: function _clearGlobalState(index) {
	      if (this._scheduled[index] != null) {
	        clearTimeout(this._scheduled[index].expiration);
	        delete this._scheduled[index];
	        return true;
	      } else {
	        return false;
	      }
	    }
	  }, {
	    key: "_free",
	    value: function _free(index, job, options, eventInfo) {
	      return tslib_1.__awaiter(this, void 0, void 0, /*#__PURE__*/_regenerator$8().m(function _callee2() {
	        var _yield$this$_store$__, running, _t2;
	        return _regenerator$8().w(function (_context2) {
	          while (1) switch (_context2.p = _context2.n) {
	            case 0:
	              _context2.p = 0;
	              _context2.n = 1;
	              return this._store.__free__(index, options.weight);
	            case 1:
	              _yield$this$_store$__ = _context2.v;
	              running = _yield$this$_store$__.running;
	              this.Events.trigger("debug", "Freed ".concat(options.id), eventInfo);
	              if (running === 0 && this.empty()) {
	                this.Events.trigger("idle");
	              }
	              _context2.n = 3;
	              break;
	            case 2:
	              _context2.p = 2;
	              _t2 = _context2.v;
	              this.Events.trigger("error", _t2);
	            case 3:
	              return _context2.a(2);
	          }
	        }, _callee2, this, [[0, 2]]);
	      }));
	    }
	  }, {
	    key: "_run",
	    value: function _run(index, job, wait) {
	      var _this2 = this;
	      job.doRun();
	      var clearGlobalState = this._clearGlobalState.bind(this, index);
	      var run = this._run.bind(this, index, job);
	      var free = this._free.bind(this, index, job);
	      this._scheduled[index] = {
	        timeout: setTimeout(function () {
	          job.doExecute(_this2._limiter, clearGlobalState, run, free);
	        }, wait),
	        expiration: job.options.expiration != null ? setTimeout(function () {
	          job.doExpire(clearGlobalState, run, free);
	        }, wait + job.options.expiration) : undefined,
	        job: job
	      };
	    }
	  }, {
	    key: "_drainOne",
	    value: function _drainOne(capacity) {
	      var _this3 = this;
	      return this._registerLock.schedule(function () {
	        return tslib_1.__awaiter(_this3, void 0, void 0, /*#__PURE__*/_regenerator$8().m(function _callee3() {
	          var queue, next, options, args, index, _yield$this$_store$__2, success, wait, reservoir, empty;
	          return _regenerator$8().w(function (_context3) {
	            while (1) switch (_context3.n) {
	              case 0:
	                if (!(this.queued() === 0)) {
	                  _context3.n = 1;
	                  break;
	                }
	                return _context3.a(2, null);
	              case 1:
	                queue = this._queues.getFirst();
	                next = queue.first();
	                if (!(next == null)) {
	                  _context3.n = 2;
	                  break;
	                }
	                return _context3.a(2, null);
	              case 2:
	                options = next.options, args = next.args;
	                if (!(capacity != null && options.weight > capacity)) {
	                  _context3.n = 3;
	                  break;
	                }
	                return _context3.a(2, null);
	              case 3:
	                this.Events.trigger("debug", "Draining ".concat(options.id), {
	                  args: args,
	                  options: options
	                });
	                index = this._randomIndex();
	                _context3.n = 4;
	                return this._store.__register__(index, options.weight, options.expiration);
	              case 4:
	                _yield$this$_store$__2 = _context3.v;
	                success = _yield$this$_store$__2.success;
	                wait = _yield$this$_store$__2.wait;
	                reservoir = _yield$this$_store$__2.reservoir;
	                this.Events.trigger("debug", "Drained ".concat(options.id), {
	                  success: success,
	                  args: args,
	                  options: options
	                });
	                if (!success) {
	                  _context3.n = 5;
	                  break;
	                }
	                queue.shift();
	                empty = this.empty();
	                if (empty) {
	                  this.Events.trigger("empty");
	                }
	                if (reservoir === 0) {
	                  this.Events.trigger("depleted", empty);
	                }
	                this._run(index, next, wait);
	                return _context3.a(2, options.weight);
	              case 5:
	                return _context3.a(2, null);
	              case 6:
	                return _context3.a(2);
	            }
	          }, _callee3, this);
	        }));
	      });
	    }
	  }, {
	    key: "_drainAll",
	    value: function _drainAll(capacity_1) {
	      return tslib_1.__awaiter(this, arguments, void 0, function (capacity) {
	        var _this4 = this;
	        var total = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	        return /*#__PURE__*/_regenerator$8().m(function _callee4() {
	          var drained, newCapacity, _t3;
	          return _regenerator$8().w(function (_context4) {
	            while (1) switch (_context4.p = _context4.n) {
	              case 0:
	                _context4.p = 0;
	                _context4.n = 1;
	                return _this4._drainOne(capacity);
	              case 1:
	                drained = _context4.v;
	                if (!(drained != null)) {
	                  _context4.n = 2;
	                  break;
	                }
	                newCapacity = capacity != null ? capacity - drained : capacity;
	                return _context4.a(2, _this4._drainAll(newCapacity, total + drained));
	              case 2:
	                return _context4.a(2, total);
	              case 3:
	                _context4.n = 5;
	                break;
	              case 4:
	                _context4.p = 4;
	                _t3 = _context4.v;
	                _this4.Events.trigger("error", _t3);
	                return _context4.a(2, total);
	              case 5:
	                return _context4.a(2);
	            }
	          }, _callee4, null, [[0, 4]]);
	        })();
	      });
	    }
	  }, {
	    key: "_dropAllQueued",
	    value: function _dropAllQueued(message) {
	      this._queues.shiftAll(function (job) {
	        return job.doDrop({
	          message: message
	        });
	      });
	    }
	  }, {
	    key: "stop",
	    value: function stop() {
	      var _this5 = this;
	      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	      options = parser$9.load(options, this.stopDefaults);
	      var waitForExecuting = function waitForExecuting(at) {
	        var finished = function finished() {
	          var counts = _this5._states.counts;
	          return counts[0] + counts[1] + counts[2] + counts[3] === at;
	        };
	        return new _this5.Promise(function (resolve) {
	          if (finished()) {
	            resolve();
	          } else {
	            var handler = function handler() {
	              if (finished()) {
	                _this5.Events.instance.removeAllListeners("done");
	                resolve();
	              }
	            };
	            _this5.Events.instance.on("done", handler);
	          }
	        });
	      };
	      var done = options.dropWaitingJobs ? function () {
	        _this5._run = function (index, next) {
	          return next.doDrop({
	            message: options.dropErrorMessage
	          });
	        };
	        _this5._drainOne = function () {
	          return _this5.Promise.resolve(null);
	        };
	        return _this5._registerLock.schedule(function () {
	          return _this5._submitLock.schedule(function () {
	            for (var _i = 0, _Object$entries = Object.entries(_this5._scheduled); _i < _Object$entries.length; _i++) {
	              var _Object$entries$_i = _slicedToArray$4(_Object$entries[_i], 2),
	                k = _Object$entries$_i[0],
	                v = _Object$entries$_i[1];
	              if (_this5.jobStatus(v.job.options.id) === "RUNNING") {
	                clearTimeout(v.timeout);
	                clearTimeout(v.expiration);
	                v.job.doDrop({
	                  message: options.dropErrorMessage
	                });
	              }
	            }
	            _this5._dropAllQueued(options.dropErrorMessage);
	            return waitForExecuting(0);
	          });
	        });
	      }() : this.schedule({
	        priority: NUM_PRIORITIES$1 - 1,
	        weight: 0
	      }, function () {
	        return waitForExecuting(1);
	      });
	      this._receive = function (job) {
	        job._reject(new Bottleneck.BottleneckError(options.enqueueErrorMessage));
	        return Promise.resolve();
	      };
	      this.stop = function () {
	        return _this5.Promise.reject(new Bottleneck.BottleneckError("stop() has already been called"));
	      };
	      return done;
	    }
	  }, {
	    key: "_receive",
	    value: function _receive(job) {
	      if (this._states.jobStatus(job.options.id) != null) {
	        job._reject(new Bottleneck.BottleneckError("A job with the same id already exists (id=".concat(job.options.id, ")")));
	        return Promise.resolve(false);
	      } else {
	        job.doReceive();
	        return this._submitLock.schedule(this._addToQueue, job);
	      }
	    }
	  }, {
	    key: "submit",
	    value: function submit() {
	      var _this6 = this;
	      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        args[_key2] = arguments[_key2];
	      }
	      var fn, options, cb;
	      if (typeof args[0] === "function") {
	        var _args5 = args;
	        var _args6 = _toArray(_args5);
	        fn = _args6[0];
	        args = _args6.slice(1);
	        cb = args.pop();
	        options = parser$9.load({}, this.jobDefaults);
	      } else {
	        var _args7 = args;
	        var _args8 = _toArray(_args7);
	        options = _args8[0];
	        fn = _args8[1];
	        args = _args8.slice(2);
	        cb = args.pop();
	        options = parser$9.load(options, this.jobDefaults);
	      }
	      var task = function task() {
	        for (var _len3 = arguments.length, taskArgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	          taskArgs[_key3] = arguments[_key3];
	        }
	        return new _this6.Promise(function (resolve, reject) {
	          fn.apply(void 0, taskArgs.concat([function () {
	            for (var _len4 = arguments.length, cbArgs = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	              cbArgs[_key4] = arguments[_key4];
	            }
	            if (cbArgs[0] != null) {
	              reject(cbArgs);
	            } else {
	              resolve(cbArgs);
	            }
	          }]));
	        });
	      };
	      var job = new Job_1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
	      job.promise.then(function (args) {
	        return cb === null || cb === void 0 ? void 0 : cb.apply(void 0, _toConsumableArray$6(args));
	      })["catch"](function (args) {
	        if (Array.isArray(args)) {
	          cb === null || cb === void 0 ? void 0 : cb.apply(void 0, _toConsumableArray$6(args));
	        } else {
	          cb === null || cb === void 0 ? void 0 : cb(args);
	        }
	      });
	      return this._receive(job);
	    }
	  }, {
	    key: "schedule",
	    value: function schedule() {
	      for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	        args[_key5] = arguments[_key5];
	      }
	      var task, options;
	      if (typeof args[0] === "function") {
	        var _args9 = args;
	        var _args0 = _toArray(_args9);
	        task = _args0[0];
	        args = _args0.slice(1);
	        options = {};
	      } else {
	        var _args1 = args;
	        var _args10 = _toArray(_args1);
	        options = _args10[0];
	        task = _args10[1];
	        args = _args10.slice(2);
	      }
	      var job = new Job_1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
	      this._receive(job);
	      return job.promise;
	    }
	  }, {
	    key: "wrap",
	    value: function wrap(fn) {
	      var schedule = this.schedule.bind(this);
	      var wrapped = function wrapped() {
	        for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
	          args[_key6] = arguments[_key6];
	        }
	        return schedule.apply(void 0, [fn.bind(this)].concat(args));
	      };
	      wrapped.withOptions = function (options) {
	        for (var _len7 = arguments.length, args = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
	          args[_key7 - 1] = arguments[_key7];
	        }
	        return schedule.apply(void 0, [options, fn].concat(args));
	      };
	      return wrapped;
	    }
	  }, {
	    key: "updateSettings",
	    value: function updateSettings() {
	      return tslib_1.__awaiter(this, arguments, void 0, function () {
	        var _this7 = this;
	        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	        return /*#__PURE__*/_regenerator$8().m(function _callee5() {
	          return _regenerator$8().w(function (_context5) {
	            while (1) switch (_context5.n) {
	              case 0:
	                _context5.n = 1;
	                return _this7._store.__updateSettings__(parser$9.overwrite(options, _this7.storeDefaults));
	              case 1:
	                parser$9.overwrite(options, _this7.instanceDefaults, _this7);
	                return _context5.a(2, _this7);
	            }
	          }, _callee5);
	        })();
	      });
	    }
	  }, {
	    key: "currentReservoir",
	    value: function currentReservoir() {
	      return this._store.__currentReservoir__();
	    }
	  }, {
	    key: "incrementReservoir",
	    value: function incrementReservoir() {
	      var incr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
	      return this._store.__incrementReservoir__(incr);
	    }
	  }]);
	}(); // Static properties
	Bottleneck["default"] = Bottleneck;
	Bottleneck.Events = Events_1;
	Bottleneck.strategy = {
	  LEAK: 1,
	  OVERFLOW: 2,
	  OVERFLOW_PRIORITY: 4,
	  BLOCK: 3
	};
	Bottleneck.BottleneckError = BottleneckError_1;
	Bottleneck.Group = Group_1;
	Bottleneck.RedisConnection = RedisConnection_1;
	Bottleneck.IORedisConnection = IORedisConnection_1;
	Bottleneck.Batcher = Batcher_1;
	// Set static version
	try {
	  Bottleneck.version = Bottleneck.prototype.version = require$$1.version;
	} catch (e) {
	  // Fallback if version.json doesn't exist
	  Bottleneck.version = Bottleneck.prototype.version = "2.19.6";
	}
	var Bottleneck_1 = Bottleneck;

	var es5 = Bottleneck_1;

	return es5;

})));
