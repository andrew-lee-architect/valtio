"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.underive = exports.derive = exports.unstable_deriveSubscriptions = void 0;
const vanilla_1 = require("../../vanilla");
const sourceObjectMap = new WeakMap();
const derivedObjectMap = new WeakMap();
const markPending = (sourceObject, callback) => {
    const sourceObjectEntry = sourceObjectMap.get(sourceObject);
    if (sourceObjectEntry) {
        sourceObjectEntry[0].forEach((subscription) => {
            const { d: derivedObject } = subscription;
            if (sourceObject !== derivedObject) {
                markPending(derivedObject);
            }
        });
        ++sourceObjectEntry[2]; // pendingCount
        if (callback) {
            sourceObjectEntry[3].add(callback); // pendingCallbacks
        }
    }
};
// has side effect (even though used in Array.map)
const checkPending = (sourceObject, callback) => {
    const sourceObjectEntry = sourceObjectMap.get(sourceObject);
    if (sourceObjectEntry === null || sourceObjectEntry === void 0 ? void 0 : sourceObjectEntry[2]) {
        sourceObjectEntry[3].add(callback); // pendingCallbacks
        return true;
    }
    return false;
};
const unmarkPending = (sourceObject) => {
    const sourceObjectEntry = sourceObjectMap.get(sourceObject);
    if (sourceObjectEntry) {
        --sourceObjectEntry[2]; // pendingCount
        if (!sourceObjectEntry[2]) {
            sourceObjectEntry[3].forEach((callback) => callback());
            sourceObjectEntry[3].clear(); // pendingCallbacks
        }
        sourceObjectEntry[0].forEach((subscription) => {
            const { d: derivedObject } = subscription;
            if (sourceObject !== derivedObject) {
                unmarkPending(derivedObject);
            }
        });
    }
};
const addSubscription = (subscription) => {
    const { s: sourceObject, d: derivedObject } = subscription;
    let derivedObjectEntry = derivedObjectMap.get(derivedObject);
    if (!derivedObjectEntry) {
        derivedObjectEntry = [new Set()];
        derivedObjectMap.set(subscription.d, derivedObjectEntry);
    }
    derivedObjectEntry[0].add(subscription);
    let sourceObjectEntry = sourceObjectMap.get(sourceObject);
    if (!sourceObjectEntry) {
        const subscriptions = new Set();
        const unsubscribe = (0, vanilla_1.subscribe)(sourceObject, (ops) => {
            subscriptions.forEach((subscription) => {
                const { d: derivedObject, c: callback, n: notifyInSync, i: ignoreKeys, } = subscription;
                if (sourceObject === derivedObject &&
                    ops.every((op) => op[1].length === 1 && ignoreKeys.includes(op[1][0]))) {
                    // only setting derived properties
                    return;
                }
                if (subscription.p) {
                    // already scheduled
                    return;
                }
                markPending(sourceObject, callback);
                if (notifyInSync) {
                    unmarkPending(sourceObject);
                }
                else {
                    subscription.p = Promise.resolve().then(() => {
                        delete subscription.p; // promise
                        unmarkPending(sourceObject);
                    });
                }
            });
        }, true);
        sourceObjectEntry = [subscriptions, unsubscribe, 0, new Set()];
        sourceObjectMap.set(sourceObject, sourceObjectEntry);
    }
    sourceObjectEntry[0].add(subscription);
};
const removeSubscription = (subscription) => {
    const { s: sourceObject, d: derivedObject } = subscription;
    const derivedObjectEntry = derivedObjectMap.get(derivedObject);
    derivedObjectEntry === null || derivedObjectEntry === void 0 ? void 0 : derivedObjectEntry[0].delete(subscription);
    if ((derivedObjectEntry === null || derivedObjectEntry === void 0 ? void 0 : derivedObjectEntry[0].size) === 0) {
        derivedObjectMap.delete(derivedObject);
    }
    const sourceObjectEntry = sourceObjectMap.get(sourceObject);
    if (sourceObjectEntry) {
        const [subscriptions, unsubscribe] = sourceObjectEntry;
        subscriptions.delete(subscription);
        if (!subscriptions.size) {
            unsubscribe();
            sourceObjectMap.delete(sourceObject);
        }
    }
};
const listSubscriptions = (derivedObject) => {
    const derivedObjectEntry = derivedObjectMap.get(derivedObject);
    if (derivedObjectEntry) {
        return Array.from(derivedObjectEntry[0]); // NOTE do we need to copy?
    }
    return [];
};
// NOTE This is experimentally exported.
// The availability is not guaranteed, and it will be renamed,
// changed or removed without any notice in future versions.
// It's not expected to use this in production.
exports.unstable_deriveSubscriptions = {
    add: addSubscription,
    remove: removeSubscription,
    list: listSubscriptions,
};
/**
 * derive
 *
 * This creates derived properties and attaches them
 * to a new proxy object or an existing proxy object.
 *
 * @example
 * import { proxy } from 'valtio'
 * import { derive } from 'valtio/utils'
 *
 * const state = proxy({
 *   count: 1,
 * })
 *
 * const derivedState = derive({
 *   doubled: (get) => get(state).count * 2,
 * })
 *
 * derive({
 *   tripled: (get) => get(state).count * 3,
 * }, {
 *   proxy: state,
 * })
 */
function derive(derivedFns, options) {
    const proxyObject = ((options === null || options === void 0 ? void 0 : options.proxy) || (0, vanilla_1.proxy)({}));
    const notifyInSync = !!(options === null || options === void 0 ? void 0 : options.sync);
    const derivedKeys = Object.keys(derivedFns);
    derivedKeys.forEach((key) => {
        if (Object.getOwnPropertyDescriptor(proxyObject, key)) {
            throw new Error('object property already defined');
        }
        const fn = derivedFns[key];
        let lastDependencies = null;
        const evaluate = () => {
            if (lastDependencies) {
                if (Array.from(lastDependencies)
                    .map(([p]) => checkPending(p, evaluate))
                    .some((isPending) => isPending)) {
                    // some dependencies are pending
                    return;
                }
                if (Array.from(lastDependencies).every(([p, entry]) => (0, vanilla_1.getVersion)(p) === entry.v)) {
                    // no dependencies are changed
                    return;
                }
            }
            const dependencies = new Map();
            const get = (p) => {
                dependencies.set(p, { v: (0, vanilla_1.getVersion)(p) });
                return p;
            };
            const value = fn(get);
            const subscribeToDependencies = () => {
                dependencies.forEach((entry, p) => {
                    var _a;
                    const lastSubscription = (_a = lastDependencies === null || lastDependencies === void 0 ? void 0 : lastDependencies.get(p)) === null || _a === void 0 ? void 0 : _a.s;
                    if (lastSubscription) {
                        entry.s = lastSubscription;
                    }
                    else {
                        const subscription = {
                            s: p,
                            d: proxyObject,
                            k: key,
                            c: evaluate,
                            n: notifyInSync,
                            i: derivedKeys, // ignoringKeys
                        };
                        addSubscription(subscription);
                        entry.s = subscription;
                    }
                });
                lastDependencies === null || lastDependencies === void 0 ? void 0 : lastDependencies.forEach((entry, p) => {
                    if (!dependencies.has(p) && entry.s) {
                        removeSubscription(entry.s);
                    }
                });
                lastDependencies = dependencies;
            };
            if (value instanceof Promise) {
                value.finally(subscribeToDependencies);
            }
            else {
                subscribeToDependencies();
            }
            proxyObject[key] = value;
        };
        evaluate();
    });
    return proxyObject;
}
exports.derive = derive;
/**
 * underive
 *
 * This stops derived properties to evaluate.
 * It will stop all (or specified by `keys` option) subscriptions.
 * If you specify `delete` option, it will delete the properties
 * and you can attach new derived properties.
 *
 * @example
 * import { proxy } from 'valtio'
 * import { derive, underive } from 'valtio/utils'
 *
 * const state = proxy({
 *   count: 1,
 * })
 *
 * const derivedState = derive({
 *   doubled: (get) => get(state).count * 2,
 * })
 *
 * underive(derivedState)
 */
function underive(proxyObject, options) {
    const keysToDelete = (options === null || options === void 0 ? void 0 : options.delete) ? new Set() : null;
    listSubscriptions(proxyObject).forEach((subscription) => {
        const { k: key } = subscription;
        if (!(options === null || options === void 0 ? void 0 : options.keys) || options.keys.includes(key)) {
            removeSubscription(subscription);
            if (keysToDelete) {
                keysToDelete.add(key);
            }
        }
    });
    if (keysToDelete) {
        keysToDelete.forEach((key) => {
            delete proxyObject[key];
        });
    }
}
exports.underive = underive;
//# sourceMappingURL=derive.js.map