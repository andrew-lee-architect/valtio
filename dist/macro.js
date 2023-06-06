"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const helper_module_imports_1 = require("@babel/helper-module-imports");
const t = tslib_1.__importStar(require("@babel/types"));
const babel_plugin_macros_1 = require("babel-plugin-macros");
const macro = ({ references }) => {
    var _a;
    (_a = references.useProxy) === null || _a === void 0 ? void 0 : _a.forEach((path) => {
        var _a, _b, _c, _d, _e, _f;
        const hook = (0, helper_module_imports_1.addNamed)(path, 'useSnapshot', 'valtio');
        const proxy = (_b = (_a = path.parentPath) === null || _a === void 0 ? void 0 : _a.get('arguments.0')) === null || _b === void 0 ? void 0 : _b.node;
        if (!t.isIdentifier(proxy))
            throw new babel_plugin_macros_1.MacroError('no proxy object');
        const snap = t.identifier(`valtio_macro_snap_${proxy.name}`);
        (_d = (_c = path.parentPath) === null || _c === void 0 ? void 0 : _c.parentPath) === null || _d === void 0 ? void 0 : _d.replaceWith(t.variableDeclaration('const', [
            t.variableDeclarator(snap, t.callExpression(hook, [proxy])),
        ]));
        let inFunction = 0;
        (_f = (_e = path.parentPath) === null || _e === void 0 ? void 0 : _e.getFunctionParent()) === null || _f === void 0 ? void 0 : _f.traverse({
            Identifier(p) {
                if (inFunction === 0 && // in render
                    p.node !== proxy &&
                    p.node.name === proxy.name) {
                    p.node.name = snap.name;
                }
            },
            Function: {
                enter() {
                    ++inFunction;
                },
                exit() {
                    --inFunction;
                },
            },
        });
    });
};
exports.default = (0, babel_plugin_macros_1.createMacro)(macro, { configName: 'valtio' });
//# sourceMappingURL=macro.js.map