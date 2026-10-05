const javascript = require('@eslint/js');
const typescript = require('typescript-eslint');

module.exports =
[
    { ignores: ['node_modules/**', 'dist/**', 'public/**'] },
    {
        files: ['src/utils/electionPresentation.cjs', 'scripts/*election*.cjs', 'scripts/*brazil*.cjs', 'eslint.config.cjs'],
        languageOptions:
        {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: { require: 'readonly', module: 'readonly', __dirname: 'readonly', process: 'readonly', URL: 'readonly', console: 'readonly', document: 'readonly', window: 'readonly' }
        },
        rules: javascript.configs.recommended.rules
    },
    {
        files: ['src/ElectionApp.tsx', 'src/components/election/**/*.tsx', 'src/components/results/InfoSheet.tsx', 'src/utils/electionPresentation.test.ts', 'vite.config.ts'],
        languageOptions: { parser: typescript.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { '@typescript-eslint': typescript.plugin },
        rules:
        {
            ...typescript.configs.recommended[2].rules,
            '@typescript-eslint/no-require-imports': 'off'
        }
    }
];

