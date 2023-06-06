"use strict";
/// <reference types="react/experimental" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSnapshot = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const proxy_compare_1 = require("proxy-compare");
// import { useSyncExternalStore } from 'use-sync-external-store/shim'
// This doesn't work in ESM, because use-sync-external-store only exposes CJS.
// See: https://github.com/pmndrs/valtio/issues/452
// The following is a workaround until ESM is supported.
// eslint-disable-next-line import/extensions
const shim_1 = tslib_1.__importDefault(require("use-sync-external-store/shim"));
const vanilla_1 = require("./vanilla");
const { use } = react_1.default;
const { useSyncExternalStore } = shim_1.default;
// This is required only for performance.
// Ref: https://github.com/pmndrs/valtio/issues/519
const targetCache = new WeakMap();
/**
 * useSnapshot
 *
 * Create a local snapshot that catches changes. This hook actually returns a wrapped snapshot in a proxy for
 * render optimization instead of a plain object compared to `snapshot()` method.
 * Rule of thumb: read from snapshots, mutate the source.
 * The component will only re-render when the parts of the state you access have changed, it is render-optimized.
 *
 * @example A
 * function Counter() {
 *   const snap = useSnapshot(state)
 *   return (
 *     <div>
 *       {snap.count}
 *       <button onClick={() => ++state.count}>+1</button>
 *     </div>
 *   )
 * }
 *
 * [Notes]
 * Every object inside your proxy also becomes a proxy (if you don't use "ref"), so you can also use them to create
 * the local snapshot as seen on example B.
 *
 * @example B
 * function ProfileName() {
 *   const snap = useSnapshot(state.profile)
 *   return (
 *     <div>
 *       {snap.name}
 *     </div>
 *   )
 * }
 *
 * Beware that you still can replace the child proxy with something else so it will break your snapshot. You can see
 * above what happens with the original proxy when you replace the child proxy.
 *
 * > console.log(state)
 * { profile: { name: "valtio" } }
 * > childState = state.profile
 * > console.log(childState)
 * { name: "valtio" }
 * > state.profile.name = "react"
 * > console.log(childState)
 * { name: "react" }
 * > state.profile = { name: "new name" }
 * > console.log(childState)
 * { name: "react" }
 * > console.log(state)
 * { profile: { name: "new name" } }
 *
 * `useSnapshot()` depends on the original reference of the child proxy so if you replace it with a new one, the component
 * that is subscribed to the old proxy won't receive new updates because it is still subscribed to the old one.
 *
 * In this case we recommend the example C or D. On both examples you don't need to worry with re-render,
 * because it is render-optimized.
 *
 * @example C
 * const snap = useSnapshot(state)
 * return (
 *   <div>
 *     {snap.profile.name}
 *   </div>
 * )
 *
 * @example D
 * const { profile } = useSnapshot(state)
 * return (
 *   <div>
 *     {profile.name}
 *   </div>
 * )
 */
function useSnapshot(proxyObject, options) {
    const notifyInSync = options === null || options === void 0 ? void 0 : options.sync;
    const lastSnapshot = (0, react_1.useRef)();
    const lastAffected = (0, react_1.useRef)();
    let inRender = true;
    const currSnapshot = useSyncExternalStore((0, react_1.useCallback)((callback) => {
        const unsub = (0, vanilla_1.subscribe)(proxyObject, callback, notifyInSync);
        callback(); // Note: do we really need this?
        return unsub;
    }, [proxyObject, notifyInSync]), () => {
        const nextSnapshot = (0, vanilla_1.snapshot)(proxyObject, use);
        try {
            if (!inRender &&
                lastSnapshot.current &&
                lastAffected.current &&
                !(0, proxy_compare_1.isChanged)(lastSnapshot.current, nextSnapshot, lastAffected.current, new WeakMap())) {
                // not changed
                return lastSnapshot.current;
            }
        }
        catch (e) {
            // ignore if a promise or something is thrown
        }
        return nextSnapshot;
    }, () => (0, vanilla_1.snapshot)(proxyObject, use));
    inRender = false;
    const currAffected = new WeakMap();
    (0, react_1.useEffect)(() => {
        lastSnapshot.current = currSnapshot;
        lastAffected.current = currAffected;
    });
    const proxyCache = (0, react_1.useMemo)(() => new WeakMap(), []); // per-hook proxyCache
    return (0, proxy_compare_1.createProxy)(currSnapshot, currAffected, proxyCache, targetCache);
}
exports.useSnapshot = useSnapshot;
//# sourceMappingURL=react.js.map