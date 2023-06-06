"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeKey = void 0;
const vanilla_1 = require("../../vanilla");
/**
 * subscribeKey
 *
 * The subscribeKey utility enables subscription to a primitive subproperty of a given state proxy.
 * Subscriptions created with subscribeKey will only fire when the specified property changes.
 * notifyInSync: same as the parameter to subscribe(); true disables batching of subscriptions.
 *
 * @example
 * import { subscribeKey } from 'valtio/utils'
 * subscribeKey(state, 'count', (v) => console.log('state.count has changed to', v))
 */
function subscribeKey(proxyObject, key, callback, notifyInSync) {
    let prevValue = proxyObject[key];
    return (0, vanilla_1.subscribe)(proxyObject, () => {
        const nextValue = proxyObject[key];
        if (!Object.is(prevValue, nextValue)) {
            callback((prevValue = nextValue));
        }
    }, notifyInSync);
}
exports.subscribeKey = subscribeKey;
//# sourceMappingURL=subscribeKey.js.map