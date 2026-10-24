import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist/**', '.verification/**', 'submission/**', 'original-programs/**']),
  { files: ['**/*.{js,jsx,mjs}'], extends: [js.configs.recommended], languageOptions: { globals: globals.browser } },
  { files: ['**/*.jsx'], extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { files: ['backend/**/*.js', 'case-study/experiment4/*.js', 'learning/server/**/*.mjs', 'learning/{basic,case}/*.mjs', 'tests/**/*.mjs', 'tools/**/*.mjs', '*.config.js'], languageOptions: { globals: globals.node } },
]);
