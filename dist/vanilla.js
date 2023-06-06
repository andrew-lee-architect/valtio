"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_buildProxyFunction = exports.ref = exports.snapshot = exports.subscribe = exports.getVersion = exports.proxy = void 0;
const proxy_compare_1 = require("proxy-compare");
const isObject = (x) => typeof x === 'object' && x !== null;
// shared state
const GLOBAL_PROXY_STATE_MAP_KEY = '__$valtio__proxyStateMap';
const getProxyStateMap = () => {
    const scope = (typeof window !== 'undefined' ? window : global);
    if (!scope[GLOBAL_PROXY_STATE_MAP_KEY]) {
        scope[GLOBAL_PROXY_STATE_MAP_KEY] = new WeakMap();
    }
    return scope[GLOBAL_PROXY_STATE_MAP_KEY];
};
const refSet = new WeakSet();
const buildProxyFunction = (objectIs = Object.is, newProxy = (target, handler) => new Proxy(target, handler), canProxy = (x) => isObject(x) &&
    !refSet.has(x) &&
    (Array.isArray(x) || !(Symbol.iterator in x)) &&
    !(x instanceof WeakMap) &&
    !(x instanceof WeakSet) &&
    !(x instanceof Error) &&
    !(x instanceof Number) &&
    !(x instanceof Date) &&
    !(x instanceof String) &&
    !(x instanceof RegExp) &&
    !(x instanceof ArrayBuffer), defaultHandlePromise = (promise) => {
    switch (promise.status) {
        case 'fulfilled':
            return promise.value;
        case 'rejected':
            throw promise.reason;
        default:
            throw promise;
    }
}, snapCache = new WeakMap(), createSnapshot = (target, version, handlePromise = defaultHandlePromise) => {
    const cache = snapCache.get(target);
    if ((cache === null || cache === void 0 ? void 0 : cache[0]) === version) {
        return cache[1];
    }
    const snap = Array.isArray(target)
        ? []
        : Object.create(Object.getPrototypeOf(target));
    (0, proxy_compare_1.markToTrack)(snap, true); // mark to track
    snapCache.set(target, [version, snap]);
    Reflect.ownKeys(target).forEach((key) => {
        if (Object.getOwnPropertyDescriptor(snap, key)) {
            // Only the known case is Array.length so far.
            return;
        }
        const value = Reflect.get(target, key);
        const desc = {
            value,
            enumerable: true,
            // This is intentional to avoid copying with proxy-compare.
            // It's still non-writable, so it avoids assigning a value.
            configurable: true,
        };
        if (refSet.has(value)) {
            (0, proxy_compare_1.markToTrack)(value, false); // mark not to track
        }
        else if (value instanceof Promise) {
            delete desc.value;
            desc.get = () => handlePromise(value);
        }
        else if (getProxyStateMap().has(value)) {
            const [target, ensureVersion] = getProxyStateMap().get(value);
            desc.value = createSnapshot(target, ensureVersion(), handlePromise);
        }
        Object.defineProperty(snap, key, desc);
    });
    return snap;
}, proxyCache = new WeakMap(), versionHolder = [1, 1], proxyFunction = (initialObject) => {
    if (!isObject(initialObject)) {
        throw new Error('object required');
    }
    const found = proxyCache.get(initialObject);
    if (found) {
        return found;
    }
    let version = versionHolder[0];
    const listeners = new Set();
    const notifyUpdate = (op, nextVersion = ++versionHolder[0]) => {
        if (version !== nextVersion) {
            version = nextVersion;
            listeners.forEach((listener) => listener(op, nextVersion));
        }
    };
    let checkVersion = versionHolder[1];
    const ensureVersion = (nextCheckVersion = ++versionHolder[1]) => {
        if (checkVersion !== nextCheckVersion && !listeners.size) {
            checkVersion = nextCheckVersion;
            propProxyStates.forEach(([propProxyState]) => {
                const propVersion = propProxyState[1](nextCheckVersion);
                if (propVersion > version) {
                    version = propVersion;
                }
            });
        }
        return version;
    };
    const createPropListener = (prop) => (op, nextVersion) => {
        const newOp = [...op];
        newOp[1] = [prop, ...newOp[1]];
        notifyUpdate(newOp, nextVersion);
    };
    const propProxyStates = new Map();
    const addPropListener = (prop, propProxyState) => {
        if (listeners.size) {
            const remove = propProxyState[3](createPropListener(prop));
            propProxyStates.set(prop, [propProxyState, remove]);
        }
        else {
            propProxyStates.set(prop, [propProxyState]);
        }
    };
    const removePropListener = (prop) => {
        var _a;
        const entry = propProxyStates.get(prop);
        if (entry) {
            propProxyStates.delete(prop);
            (_a = entry[1]) === null || _a === void 0 ? void 0 : _a.call(entry);
        }
    };
    const addListener = (listener) => {
        listeners.add(listener);
        if (listeners.size === 1) {
            propProxyStates.forEach(([propProxyState, _prevRemove], prop) => {
                const remove = propProxyState[3](createPropListener(prop));
                propProxyStates.set(prop, [propProxyState, remove]);
            });
        }
        const removeListener = () => {
            listeners.delete(listener);
            if (listeners.size === 0) {
                propProxyStates.forEach(([propProxyState, remove], prop) => {
                    if (remove) {
                        remove();
                        propProxyStates.set(prop, [propProxyState]);
                    }
                });
            }
        };
        return removeListener;
    };
    const baseObject = Array.isArray(initialObject)
        ? []
        : Object.create(Object.getPrototypeOf(initialObject));
    const handler = {
        deleteProperty(target, prop) {
            const prevValue = Reflect.get(target, prop);
            removePropListener(prop);
            const deleted = Reflect.deleteProperty(target, prop);
            if (deleted) {
                notifyUpdate(['delete', [prop], prevValue]);
            }
            return deleted;
        },
        set(target, prop, value, receiver) {
            const hasPrevValue = Reflect.has(target, prop);
            const prevValue = Reflect.get(target, prop, receiver);
            if (hasPrevValue &&
                (objectIs(prevValue, value) ||
                    (proxyCache.has(value) &&
                        objectIs(prevValue, proxyCache.get(value))))) {
                return true;
            }
            removePropListener(prop);
            if (isObject(value)) {
                value = (0, proxy_compare_1.getUntracked)(value) || value;
            }
            let nextValue = value;
            if (value instanceof Promise) {
                value
                    .then((v) => {
                    value.status = 'fulfilled';
                    value.value = v;
                    notifyUpdate(['resolve', [prop], v]);
                })
                    .catch((e) => {
                    value.status = 'rejected';
                    value.reason = e;
                    notifyUpdate(['reject', [prop], e]);
                });
            }
            else {
                if (!getProxyStateMap().has(value) && canProxy(value)) {
                    nextValue = proxyFunction(value);
                }
                const childProxyState = !refSet.has(nextValue) && getProxyStateMap().get(nextValue);
                if (childProxyState) {
                    addPropListener(prop, childProxyState);
                }
            }
            Reflect.set(target, prop, nextValue, receiver);
            notifyUpdate(['set', [prop], value, prevValue]);
            return true;
        },
    };
    const proxyObject = newProxy(baseObject, handler);
    proxyCache.set(initialObject, proxyObject);
    const proxyState = [
        baseObject,
        ensureVersion,
        createSnapshot,
        addListener,
    ];
    getProxyStateMap().set(proxyObject, proxyState);
    Reflect.ownKeys(initialObject).forEach((key) => {
        const desc = Object.getOwnPropertyDescriptor(initialObject, key);
        if ('value' in desc) {
            proxyObject[key] = initialObject[key];
            // We need to delete desc.value because we already set it,
            // and delete desc.writable because we want to write it again.
            delete desc.value;
            delete desc.writable;
        }
        Object.defineProperty(baseObject, key, desc);
    });
    return proxyObject;
}) => [
    // public functions
    proxyFunction,
    // shared state
    getProxyStateMap(),
    refSet,
    // internal things
    objectIs,
    newProxy,
    canProxy,
    defaultHandlePromise,
    snapCache,
    createSnapshot,
    proxyCache,
    versionHolder,
];
const [defaultProxyFunction] = buildProxyFunction();
function proxy(initialObject = {}) {
    return defaultProxyFunction(initialObject);
}
exports.proxy = proxy;
function getVersion(proxyObject) {
    const proxyState = getProxyStateMap().get(proxyObject);
    return proxyState === null || proxyState === void 0 ? void 0 : proxyState[1]();
}
exports.getVersion = getVersion;
function subscribe(proxyObject, callback, notifyInSync) {
    const proxyState = getProxyStateMap().get(proxyObject);
    let promise;
    const ops = [];
    const addListener = proxyState[3];
    let isListenerActive = false;
    const listener = (op) => {
        ops.push(op);
        if (notifyInSync) {
            callback(ops.splice(0));
            return;
        }
        if (!promise) {
            promise = Promise.resolve().then(() => {
                promise = undefined;
                if (isListenerActive) {
                    callback(ops.splice(0));
                }
            });
        }
    };
    const removeListener = addListener(listener);
    isListenerActive = true;
    return () => {
        isListenerActive = false;
        removeListener();
    };
}
exports.subscribe = subscribe;
function snapshot(proxyObject, handlePromise) {
    const proxyState = getProxyStateMap().get(proxyObject);
    const [target, ensureVersion, createSnapshot] = proxyState;
    return createSnapshot(target, ensureVersion(), handlePromise);
}
exports.snapshot = snapshot;
function ref(obj) {
    refSet.add(obj);
    return obj;
}
exports.ref = ref;
exports.unstable_buildProxyFunction = buildProxyFunction;
//# sourceMappingURL=vanilla.js.map