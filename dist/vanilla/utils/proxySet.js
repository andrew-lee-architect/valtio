"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxySet = void 0;
const vanilla_1 = require("../../vanilla");
/**
 * proxySet
 *
 * This is to create a proxy which mimic the native Set behavior.
 * The API is the same as Set API
 *
 * @example
 * import { proxySet } from 'valtio/utils'
 * const state = proxySet([1,2,3])
 * //can be used inside a proxy as well
 * const state = proxy({
 *   count: 1,
 *   set: proxySet()
 * })
 */
function proxySet(initialValues) {
    const set = (0, vanilla_1.proxy)({
        data: Array.from(new Set(initialValues)),
        has(value) {
            return this.data.indexOf(value) !== -1;
        },
        add(value) {
            let hasProxy = false;
            if (typeof value === 'object' && value !== null) {
                hasProxy = this.data.indexOf((0, vanilla_1.proxy)(value)) !== -1;
            }
            if (this.data.indexOf(value) === -1 && !hasProxy) {
                this.data.push(value);
            }
            return this;
        },
        delete(value) {
            const index = this.data.indexOf(value);
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
        forEach(cb) {
            this.data.forEach((value) => {
                cb(value, value, this);
            });
        },
        get [Symbol.toStringTag]() {
            return 'Set';
        },
        toJSON() {
            return new Set(this.data);
        },
        [Symbol.iterator]() {
            return this.data[Symbol.iterator]();
        },
        values() {
            return this.data.values();
        },
        keys() {
            // for Set.keys is an alias for Set.values()
            return this.data.values();
        },
        entries() {
            // array.entries returns [index, value] while Set [value, value]
            return new Set(this.data).entries();
        },
    });
    Object.defineProperties(set, {
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
    Object.seal(set);
    return set;
}
exports.proxySet = proxySet;
//# sourceMappingURL=proxySet.js.map