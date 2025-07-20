module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:import/recommended',
    'plugin:security/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'node',
    'import',
    'security'
  ],
  rules: {
    // Possible Errors
    'no-unused-vars': ['warn', { 
      vars: 'all', 
      args: 'after-used', 
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_'
    }],
    'no-console': 'warn',
    'no-debugger': 'warn',

    // Best Practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-proto': 'error',

    // Security
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-unsafe-regex': 'warn',
    'security/detect-object-injection': 'warn',

    // Node.js and CommonJS
    'node/no-unsupported-features/es-syntax': ['error', {
      version: '>=18.0.0',
      ignores: ['modules']
    }],
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',

    // Import
    'import/no-unresolved': 'off',
    'import/extensions': ['error', 'always', {
      'js': 'always',
      'jsx': 'always'
    }]
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx']
      }
    }
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.config.js',
    '*.config.cjs'
  ]
}; 
