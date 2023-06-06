"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyWithHistory = void 0;
const vanilla_1 = require("../../vanilla");
const isObject = (x) => typeof x === 'object' && x !== null;
const deepClone = (obj) => {
    if (!isObject(obj)) {
        return obj;
    }
    const baseObject = Array.isArray(obj)
        ? []
        : Object.create(Object.getPrototypeOf(obj));
    Reflect.ownKeys(obj).forEach((key) => {
        baseObject[key] = deepClone(obj[key]);
    });
    return baseObject;
};
/**
 * proxyWithHistory
 *
 * This creates a new proxy with history support.
 * It includes following properties:
 * - value: any value (does not have to be an object)
 * - history: an array holding the history of snapshots
 * - historyIndex: the history index to the current snapshot
 * - canUndo: a function to return true if undo is available
 * - undo: a function to go back history
 * - canRedo: a function to return true if redo is available
 * - redo: a function to go forward history
 * - saveHistory: a function to save history
 *
 * [Notes]
 * Suspense/promise is not supported.
 *
 * @example
 * import { proxyWithHistory } from 'valtio/utils'
 * const state = proxyWithHistory({
 *   count: 1,
 * })
 */
function proxyWithHistory(initialValue, skipSubscribe = false) {
    const proxyObject = (0, vanilla_1.proxy)({
        value: initialValue,
        history: (0, vanilla_1.ref)({
            wip: undefined,
            snapshots: [],
            index: -1,
        }),
        canUndo: () => proxyObject.history.index > 0,
        undo: () => {
            if (proxyObject.canUndo()) {
                proxyObject.value = (proxyObject.history.wip = deepClone(proxyObject.history.snapshots[--proxyObject.history.index]));
            }
        },
        canRedo: () => proxyObject.history.index < proxyObject.history.snapshots.length - 1,
        redo: () => {
            if (proxyObject.canRedo()) {
                proxyObject.value = (proxyObject.history.wip = deepClone(proxyObject.history.snapshots[++proxyObject.history.index]));
            }
        },
        saveHistory: () => {
            proxyObject.history.snapshots.splice(proxyObject.history.index + 1);
            proxyObject.history.snapshots.push((0, vanilla_1.snapshot)(proxyObject).value);
            ++proxyObject.history.index;
        },
        subscribe: () => (0, vanilla_1.subscribe)(proxyObject, (ops) => {
            if (ops.every((op) => op[1][0] === 'value' &&
                (op[0] !== 'set' || op[2] !== proxyObject.history.wip))) {
                proxyObject.saveHistory();
            }
        }),
    });
    proxyObject.saveHistory();
    if (!skipSubscribe) {
        proxyObject.subscribe();
    }
    return proxyObject;
}
exports.proxyWithHistory = proxyWithHistory;
//# sourceMappingURL=proxyWithHistory.js.map