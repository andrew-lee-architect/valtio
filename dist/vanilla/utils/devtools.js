"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devtools = void 0;
const vanilla_1 = require("../../vanilla");
const DEVTOOLS = Symbol();
/**
 * devtools
 *
 * This is to connect with [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools).
 * Limitation: Only plain objects/values are supported.
 *
 * @example
 * import { devtools } from 'valtio/utils'
 * const state = proxy({ count: 0, text: 'hello' })
 * const unsub = devtools(state, { name: 'state name', enabled: true })
 */
function devtools(proxyObject, options) {
    if (typeof options === 'string') {
        console.warn('string name option is deprecated, use { name }. https://github.com/pmndrs/valtio/pull/400');
        options = { name: options };
    }
    const { enabled, name = '' } = options || {};
    let extension;
    try {
        extension = enabled && window.__REDUX_DEVTOOLS_EXTENSION__;
    }
    catch (_a) {
        // ignored
    }
    if (!extension) {
        if (enabled) {
            console.warn('[Warning] Please install/enable Redux devtools extension');
        }
        return;
    }
    let isTimeTraveling = false;
    const devtools = extension.connect({ name });
    const unsub1 = (0, vanilla_1.subscribe)(proxyObject, (ops) => {
        const action = ops
            .filter(([_, path]) => path[0] !== DEVTOOLS)
            .map(([op, path]) => `${op}:${path.map(String).join('.')}`)
            .join(', ');
        if (!action) {
            return;
        }
        if (isTimeTraveling) {
            isTimeTraveling = false;
        }
        else {
            const snapWithoutDevtools = Object.assign({}, (0, vanilla_1.snapshot)(proxyObject));
            delete snapWithoutDevtools[DEVTOOLS];
            devtools.send({
                type: action,
                updatedAt: new Date().toLocaleString(),
            }, snapWithoutDevtools);
        }
    });
    const unsub2 = devtools.subscribe((message) => {
        var _a, _b, _c, _d, _e, _f;
        if (message.type === 'ACTION' && message.payload) {
            try {
                Object.assign(proxyObject, JSON.parse(message.payload));
            }
            catch (e) {
                console.error('please dispatch a serializable value that JSON.parse() and proxy() support\n', e);
            }
        }
        if (message.type === 'DISPATCH' && message.state) {
            if (((_a = message.payload) === null || _a === void 0 ? void 0 : _a.type) === 'JUMP_TO_ACTION' ||
                ((_b = message.payload) === null || _b === void 0 ? void 0 : _b.type) === 'JUMP_TO_STATE') {
                isTimeTraveling = true;
                const state = JSON.parse(message.state);
                Object.assign(proxyObject, state);
            }
            ;
            proxyObject[DEVTOOLS] = message;
        }
        else if (message.type === 'DISPATCH' &&
            ((_c = message.payload) === null || _c === void 0 ? void 0 : _c.type) === 'COMMIT') {
            devtools.init((0, vanilla_1.snapshot)(proxyObject));
        }
        else if (message.type === 'DISPATCH' &&
            ((_d = message.payload) === null || _d === void 0 ? void 0 : _d.type) === 'IMPORT_STATE') {
            const actions = (_e = message.payload.nextLiftedState) === null || _e === void 0 ? void 0 : _e.actionsById;
            const computedStates = ((_f = message.payload.nextLiftedState) === null || _f === void 0 ? void 0 : _f.computedStates) || [];
            isTimeTraveling = true;
            computedStates.forEach(({ state }, index) => {
                const action = actions[index] || 'No action found';
                Object.assign(proxyObject, state);
                if (index === 0) {
                    devtools.init((0, vanilla_1.snapshot)(proxyObject));
                }
                else {
                    devtools.send(action, (0, vanilla_1.snapshot)(proxyObject));
                }
            });
        }
    });
    devtools.init((0, vanilla_1.snapshot)(proxyObject));
    return () => {
        unsub1();
        unsub2 === null || unsub2 === void 0 ? void 0 : unsub2();
    };
}
exports.devtools = devtools;
//# sourceMappingURL=devtools.js.map