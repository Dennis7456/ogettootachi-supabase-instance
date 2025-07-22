export default {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    quotes: [
      'error',
      'single',
      {
        avoidEscape: false,
        allowTemplateLiterals: false,
      },
    ],
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],
    'quote-props': ['error', 'always'],
    'jsx-quotes': ['error', 'prefer-single'],
  },
};
