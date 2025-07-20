module.exports = {
  '*.{js,jsx}': [
    './lint-fix.sh',
    'prettier --write'
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write'
  ]
}; 