import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js'],
    },

    js.configs.recommended,

    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        plugins: {
            '@stylistic': stylistic,
        },

        rules: {
            '@typescript-eslint/no-confusing-void-expression': 'off',

            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: {
                        attributes: false,
                    },
                },
            ],

            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],

            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        constructors: 'no-public',
                    },
                },
            ],

            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',

            '@stylistic/padding-line-between-statements': [
                'error',

                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return',
                },

                {
                    blankLine: 'always',
                    prev: ['const', 'let', 'var'],
                    next: '*',
                },

                {
                    blankLine: 'any',
                    prev: ['const', 'let', 'var'],
                    next: ['const', 'let', 'var'],
                },

                {
                    blankLine: 'always',
                    prev: '*',
                    next: ['if', 'for', 'while', 'switch', 'try'],
                },
            ],

            '@stylistic/lines-between-class-members': [
                'error',
                'always',
                {
                    exceptAfterSingleLine: true,
                },
            ],
        },
    },

    eslintConfigPrettier,
);
