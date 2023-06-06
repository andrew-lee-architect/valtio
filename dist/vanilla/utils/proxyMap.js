"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyMap = void 0;
const vanilla_1 = require("../../vanilla");
/**
 * proxyMap
 *
 * This is to create a proxy which mimic the native Map behavior.
 * The API is the same as Map API
 *
 * @example
 * import { proxyMap } from 'valtio/utils'
 * const state = proxyMap([["key", "value"]])
 *
 * //can be used inside a proxy as well
 * const state = proxy({
 *   count: 1,
 *   map: proxyMap()
 * })
 *
 * // When using an object as a key, you can wrap it with `ref` so it's not proxied
 * // this is useful if you want to preserve the key equality
 * import { ref } from 'valtio'
 *
 * const key = ref({})
 * state.set(key, "value")
 * state.get(key) //value
 *
 * const key = {}
 * state.set(key, "value")
 * state.get(key) //undefined
 */
function proxyMap(entries) {
    const map = (0, vanilla_1.proxy)({
        data: Array.from(entries || []),
        has(key) {
            return this.data.some((p) => p[0] === key);
        },
        set(key, value) {
            const record = this.data.find((p) => p[0] === key);
            if (record) {
                record[1] = value;
            }
            else {
                this.data.push([key, value]);
            }
            return this;
        },
        get(key) {
            var _a;
            return (_a = this.data.find((p) => p[0] === key)) === null || _a === void 0 ? void 0 : _a[1];
        },
        delete(key) {
            const index = this.data.findIndex((p) => p[0] === key);
            if (index === -1) {
                return false;
            }
            this.data.splice(index, 1);
            return true;
        },
        clear() {
            this.data.splice(0);
        },
        get size() {
            return this.data.length;
        },
        toJSON() {
            return new Map(this.data);
        },
        forEach(cb) {
            this.data.forEach((p) => {
                cb(p[1], p[0], this);
            });
        },
        keys() {
            return this.data.map((p) => p[0]).values();
        },
        values() {
            return this.data.map((p) => p[1]).values();
        },
        entries() {
            return new Map(this.data).entries();
        },
        get [Symbol.toStringTag]() {
            return 'Map';
        },
        [Symbol.iterator]() {
            return this.entries();
        },
    });
    Object.defineProperties(map, {
        data: {
            enumerable: false,
        },
        size: {
            enumerable: false,
        },
        toJSON: {
            enumerable: false,
        },
    });
    Object.seal(map);
    return map;
}
exports.proxyMap = proxyMap;
//# sourceMappingURL=proxyMap.js.map