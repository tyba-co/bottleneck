"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.overwrite = exports.load = void 0;
const load = (received, defaults, onto = {}) => {
  for (const k in defaults) {
    onto[k] = received[k] != null ? received[k] : defaults[k];
  }
  return onto;
};
exports.load = load;
const overwrite = (received, defaults, onto = {}) => {
  for (const k in received) {
    if (defaults[k] !== undefined) {
      onto[k] = received[k];
    }
  }
  return onto;
};
exports.overwrite = overwrite;