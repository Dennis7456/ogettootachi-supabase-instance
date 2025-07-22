// @ts-check
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-node';

export default [
  {
    // Global configuration for all JavaScript files
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Add global variables used across the project
        console: 'writable',
        process: 'readonly',
        fetch: 'readonly',
        fs: 'readonly',
        path: 'readonly',
      },
    },
    rules: {
      // Unused variables configuration
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Syntax and style rules
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-console': 'warn',
      'no-empty': 'error',

      // Best practices
      'no-undef': 'error',
      'no-unused-expressions': 'error',
      'no-empty-function': 'error',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'backups/',
      '**/*.config.js',
      '**/*.md',
      '**/*.json',
      '.git/',
      '.husky/',
      '**/*.log',
      'coverage/',
      'test-results/',
      'playwright-report/',
    ],
  },
];
