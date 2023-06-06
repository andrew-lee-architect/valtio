"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideValtioMacro = exports.valtioMacro = void 0;
const tslib_1 = require("tslib");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const babelModuleImports = tslib_1.__importStar(require("@babel/helper-module-imports"));
const t = tslib_1.__importStar(require("@babel/types"));
const plugin = tslib_1.__importStar(require("aslemammad-vite-plugin-macro"));
const babelMacro = tslib_1.__importStar(require("babel-plugin-macros"));
const { defineMacro, defineMacroProvider, createMacroPlugin } = 
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
('default' in plugin ? plugin.default : plugin);
// const {} = plugin.default as typeof import('aslemammad-vite-plugin-macro')
exports.valtioMacro = defineMacro(`useProxy`)
    .withSignature(`<T extends object>(proxyObject: T): void`)
    .withHandler((ctx) => {
    var _a, _b, _c, _d;
    const { path, args } = ctx;
    const hook = babelModuleImports.addNamed(path, 'useSnapshot', 'valtio');
    const proxy = (_a = args[0]) === null || _a === void 0 ? void 0 : _a.node;
    if (!t.isIdentifier(proxy)) {
        throw new babelMacro.MacroError('no proxy object');
    }
    const snap = t.identifier(`valtio_macro_snap_${proxy.name}`);
    (_b = path.parentPath) === null || _b === void 0 ? void 0 : _b.replaceWith(t.variableDeclaration('const', [
        t.variableDeclarator(snap, t.callExpression(hook, [proxy])),
    ]));
    let inFunction = 0;
    (_d = (_c = path.parentPath) === null || _c === void 0 ? void 0 : _c.getFunctionParent()) === null || _d === void 0 ? void 0 : _d.traverse({
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
function provideValtioMacro() {
    return defineMacroProvider({
        id: 'valtio/macro',
        exports: {
            'valtio/macro': {
                macros: [exports.valtioMacro],
            },
        },
    });
}
exports.provideValtioMacro = provideValtioMacro;
/**
 * @deprecated Use useProxy hook instead.
 */
const macroPlugin = createMacroPlugin({}).use(provideValtioMacro());
exports.default = macroPlugin;
//# sourceMappingURL=vite.js.map