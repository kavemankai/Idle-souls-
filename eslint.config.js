import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(js.configs.recommended, ...ts.configs.recommended, {
  files: ['**/*.ts'],
  languageOptions: { globals: { window: 'readonly', document: 'readonly', console: 'readonly', URLSearchParams: 'readonly', performance: 'readonly', __BUILD_SHA__: 'readonly' } },
});
