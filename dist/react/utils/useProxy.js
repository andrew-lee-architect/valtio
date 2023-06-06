"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProxy = void 0;
const react_1 = require("react");
const react_2 = require("../../react");
/**
 * useProxy
 *
 * Takes a proxy and returns a new proxy which you can use in both react render
 * and in callbacks. The root reference is replaced on every render, but the
 * keys (and subkeys) below it are stable until they're intentionally mutated.
 * For the best ergonomics, you can export a custom hook from your store, so you
 * don't have to figure out a separate name for the hook reference. E.g.:
 *
 * export const store = proxy(initialState)
 * export const useStore = () => useProxy(store)
 * // in the component file:
 * function Cmp() {
 *   const store = useStore()
 *   return <button onClick={() => {store.count++}}>{store.count}</button>
 * }
 *
 * @param proxy
 * @param options
 * @returns A new proxy which you can use in the render as well as in callbacks.
 */
function useProxy(proxy, options) {
    const snapshot = (0, react_2.useSnapshot)(proxy, options);
    let isRendering = true;
    (0, react_1.useLayoutEffect)(() => {
        // This is an intentional hack
        // eslint-disable-next-line react-hooks/exhaustive-deps
        isRendering = false;
    });
    return new Proxy(proxy, {
        get(target, prop) {
            return isRendering ? snapshot[prop] : target[prop];
        },
    });
}
exports.useProxy = useProxy;
//# sourceMappingURL=useProxy.js.map