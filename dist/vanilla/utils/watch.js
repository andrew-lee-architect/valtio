"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watch = void 0;
const vanilla_1 = require("../../vanilla");
let currentCleanups;
/**
 * watch
 *
 * Creates a reactive effect that automatically tracks proxy objects and
 * reevaluates everytime one of the tracked proxy objects updates. It returns
 * a cleanup function to stop the reactive effect from reevaluating.
 *
 * Callback is invoked immediately to detect the tracked objects.
 *
 * Callback passed to `watch` receives a `get` function that "tracks" the
 * passed proxy object.
 *
 * Watch callbacks may return an optional cleanup function, which is evaluated
 * whenever the callback reevaluates or when the cleanup function returned by
 * `watch` is evaluated.
 *
 * `watch` calls inside `watch` are also automatically tracked and cleaned up
 * whenever the parent `watch` reevaluates.
 *
 * @param callback
 * @returns A cleanup function that stops the callback from reevaluating and
 * also performs cleanups registered into `watch`.
 */
function watch(callback, options) {
    let alive = true;
    const cleanups = new Set();
    const subscriptions = new Map();
    const cleanup = () => {
        if (alive) {
            alive = false;
            cleanups.forEach((clean) => clean());
            cleanups.clear();
            subscriptions.forEach((unsubscribe) => unsubscribe());
            subscriptions.clear();
        }
    };
    const revalidate = () => {
        if (!alive) {
            return;
        }
        cleanups.forEach((clean) => clean());
        cleanups.clear();
        const proxiesToSubscribe = new Set();
        // Setup watch context, this allows us to automatically capture
        // watch cleanups if the watch callback itself has watch calls.
        const parent = currentCleanups;
        currentCleanups = cleanups;
        // Ensures that the parent is reset if the callback throws an error.
        try {
            const cleanupReturn = callback((proxyObject) => {
                proxiesToSubscribe.add(proxyObject);
                return proxyObject;
            });
            // If there's a cleanup, we add this to the cleanups set
            if (cleanupReturn) {
                cleanups.add(cleanupReturn);
            }
        }
        finally {
            currentCleanups = parent;
        }
        // Unsubscribe old subscriptions
        subscriptions.forEach((unsubscribe, proxyObject) => {
            if (proxiesToSubscribe.has(proxyObject)) {
                // Already subscribed
                proxiesToSubscribe.delete(proxyObject);
            }
            else {
                subscriptions.delete(proxyObject);
                unsubscribe();
            }
        });
        // Subscribe to new proxies
        proxiesToSubscribe.forEach((proxyObject) => {
            const unsubscribe = (0, vanilla_1.subscribe)(proxyObject, revalidate, options === null || options === void 0 ? void 0 : options.sync);
            subscriptions.set(proxyObject, unsubscribe);
        });
    };
    // If there's a parent watch call, we attach this watch's
    // cleanup to the parent.
    if (currentCleanups) {
        currentCleanups.add(cleanup);
    }
    // Invoke effect to create subscription list
    revalidate();
    return cleanup;
}
exports.watch = watch;
//# sourceMappingURL=watch.js.map