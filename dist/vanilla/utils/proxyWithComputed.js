"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyWithComputed_DEPRECATED = void 0;
const vanilla_1 = require("../../vanilla");
/**
 * proxyWithComputed (DEPRECATED)
 *
 * @deprecated Please follow "Computed Properties" guide in docs.
 */
function proxyWithComputed_DEPRECATED(initialObject, computedFns) {
    ;
    Object.keys(computedFns).forEach((key) => {
        if (Object.getOwnPropertyDescriptor(initialObject, key)) {
            throw new Error('object property already defined');
        }
        const computedFn = computedFns[key];
        const { get, set } = (typeof computedFn === 'function' ? { get: computedFn } : computedFn);
        const desc = {};
        desc.get = () => get((0, vanilla_1.snapshot)(proxyObject));
        if (set) {
            desc.set = (newValue) => set(proxyObject, newValue);
        }
        Object.defineProperty(initialObject, key, desc);
    });
    const proxyObject = (0, vanilla_1.proxy)(initialObject);
    return proxyObject;
}
exports.proxyWithComputed_DEPRECATED = proxyWithComputed_DEPRECATED;
//# sourceMappingURL=proxyWithComputed.js.map