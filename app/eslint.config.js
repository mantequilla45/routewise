// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'ios/*', 'android/*'],
  },
  {
    rules: {
      // Debug logging belongs behind __DEV__ or should be removed before commit.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // eslint-config-expo registers the TypeScript plugin for TS files only.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
