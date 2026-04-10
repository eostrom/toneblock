import js from '@eslint/js'
import globals from 'globals'
import solid from 'eslint-plugin-solid'
import tseslint from 'typescript-eslint'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'

export default tseslint.config(
  {
    ignores: ['dist'],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      solid.configs['flat/typescript'],
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      'no-console': 'error',
      'object-shorthand': ['error', 'always'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'solid/no-destructure': 'error',
      'solid/prefer-classlist': 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibrary,
      'jest-dom': jestDom,
    },
    rules: {
      ...testingLibrary.configs.dom.rules,
      ...jestDom.configs.recommended.rules,
    },
  },
)
