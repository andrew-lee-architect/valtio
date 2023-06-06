"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComputed_DEPRECATED = void 0;
const derive_1 = require("./derive");
/**
 * addComputed (DEPRECATED)
 *
 * @deprecated Please consider using `derive` or `proxyWithComputed` instead.
 */
function addComputed_DEPRECATED(proxyObject, computedFns_FAKE, targetObject = proxyObject) {
    const derivedFns = {};
    Object.keys(computedFns_FAKE).forEach((key) => {
        derivedFns[key] = (get) => computedFns_FAKE[key](get(proxyObject));
    });
    return (0, derive_1.derive)(derivedFns, { proxy: targetObject });
}
exports.addComputed_DEPRECATED = addComputed_DEPRECATED;
//# sourceMappingURL=addComputed.js.map