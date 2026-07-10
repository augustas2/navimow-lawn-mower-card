import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**", "coverage/**", "eslint.config.js"],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    eslintConfigPrettier,
    {
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/no-misused-promises": [
                "error",
                { checksVoidReturn: { attributes: false } },
            ],
        },
    },
);
