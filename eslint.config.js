// @ts-check
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-node';

export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      // Disable all rules
      'no-unused-vars': 'off',
      semi: 'off',
      quotes: 'off',
      'no-console': 'off',
      'no-empty': 'off',
      'no-undef': 'off',
      'no-unused-expressions': 'off',
      'no-empty-function': 'off',
    },
  },
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
