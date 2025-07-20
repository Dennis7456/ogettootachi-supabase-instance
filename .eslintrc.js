module.exports = {
  root: true
  env: {
    node: true
    es2021: true
  }
  extends: ['eslint:recommended']
  parserOptions: {
    ecmaVersion: 'latest'
    sourceType: 'module'
  }
  rules: {
    'no-unused-vars': [
      'warn'
      {
        vars: 'all'
        args: 'after-used'
        ignoreRestSiblings: true
        argsIgnorePattern: '^_'
      }
    ]
    'no-console': 'warn'
    'no-debugger': 'warn'
  }
  ignorePatterns: [
    'node_modules/'
    'dist/'
    'build/'
    'coverage/'
    '*.config.js'
    '*.config.cjs'
  ]
};
