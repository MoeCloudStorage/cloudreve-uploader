import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from 'rollup-plugin-typescript2'
import {terser} from 'rollup-plugin-terser'

import pkg from './package.json'

const extensions = ['.ts']
const noDeclarationFiles = {compilerOptions: {declaration: false}}

const babelRuntimeVersion = pkg.dependencies['@babel/runtime'].replace(
    /^[^0-9]*/,
    ''
)

const makeExternalPredicate = externalArr => {
    if (externalArr.length === 0) {
        return () => false
    }
    const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
    return id => pattern.test(id)
}

export default [
    // CommonJS
    {
        input: 'src/index.ts',
        output: {file: 'lib/main.js', format: 'cjs', indent: false},
        external: makeExternalPredicate([
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {})
        ]),
        plugins: [
            nodeResolve({
                extensions
            }),
            typescript({useTsconfigDeclarationDir: true}),
            babel({
                extensions,
                plugins: [
                    ['@babel/plugin-transform-runtime', {version: babelRuntimeVersion}],
                    "@babel/plugin-proposal-nullish-coalescing-operator",
                    "@babel/plugin-proposal-optional-chaining"
                ],
                babelHelpers: 'runtime'
            })
        ]
    },

    // ES
    {
        input: 'src/index.ts',
        output: {file: 'es/main.js', format: 'es', indent: false},
        external: makeExternalPredicate([
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {})
        ]),
        plugins: [
            nodeResolve({
                extensions
            }),
            typescript({tsconfigOverride: noDeclarationFiles}),
            babel({
                extensions,
                plugins: [
                    [
                        '@babel/plugin-transform-runtime',
                        {version: babelRuntimeVersion, useESModules: true}
                    ],
                    "@babel/plugin-proposal-nullish-coalescing-operator",
                    "@babel/plugin-proposal-optional-chaining"
                ],
                babelHelpers: 'runtime'
            })
        ]
    },

    // ES for Browsers
    {
        input: 'src/index.ts',
        output: {file: 'es/main.mjs', format: 'es', indent: false},
        plugins: [
            nodeResolve({
                extensions
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production'),
                preventAssignment: true
            }),
            typescript({tsconfigOverride: noDeclarationFiles}),
            babel({
                extensions,
                exclude: 'node_modules/**',
                skipPreflightCheck: true,
                plugins: ["@babel/plugin-proposal-nullish-coalescing-operator",
                    "@babel/plugin-proposal-optional-chaining"]
            }),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    warnings: false
                }
            })
        ]
    },

    // UMD Development
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/main.js',
            format: 'umd',
            name: 'CloudreveUploader',
            indent: false
        },
        plugins: [
            nodeResolve({
                extensions
            }),
            typescript({tsconfigOverride: noDeclarationFiles}),
            babel({
                extensions,
                exclude: 'node_modules/**',
                plugins: ["@babel/plugin-proposal-nullish-coalescing-operator",
                    "@babel/plugin-proposal-optional-chaining"]
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify('development'),
                preventAssignment: true
            })
        ]
    },

    // UMD Production
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/main.min.js',
            format: 'umd',
            name: 'CloudreveUploader',
            indent: false
        },
        plugins: [
            nodeResolve({
                extensions
            }),
            typescript({tsconfigOverride: noDeclarationFiles}),
            babel({
                extensions,
                exclude: 'node_modules/**',
                skipPreflightCheck: true,
                plugins: ["@babel/plugin-proposal-nullish-coalescing-operator",
                    "@babel/plugin-proposal-optional-chaining"]
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production'),
                preventAssignment: true
            }),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    warnings: false
                }
            })
        ]
    }
]