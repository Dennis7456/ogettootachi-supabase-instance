export default [
  {
    files: ['**/*.js', '**/*.mjs', '**/*.test.js', 'scripts/**/*.js', 'tests/**/*.js', '**/invitation-system-backup-*/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Add global variables used across the project
        'console': 'writable',
        'process': 'readonly',
        'fetch': 'readonly',
        
        // Timing and async globals
        'setTimeout': 'readonly',
        'setInterval': 'readonly',
        
        // Node.js specific globals
        'spawn': 'readonly',
        'promisify': 'readonly',
        'exec': 'readonly',
        
        // ES Module and Node.js path globals
        '__dirname': 'readonly',
        '__filename': 'readonly',
        'global': 'readonly',
        
        // Browser and Node.js globals
        'File': 'readonly',
        
        // Configuration and utility globals
        'config': 'readonly',
        'resolve': 'readonly',
        
        // Supabase and testing globals
        '_createClient': 'readonly',
        'createClient': 'readonly',
        
        // Testing framework globals
        'describe': 'readonly',
        'it': 'readonly',
        'expect': 'readonly',
        'beforeAll': 'readonly',
        'afterAll': 'readonly',
        'beforeEach': 'readonly',
        'afterEach': 'readonly',
      },
    },
    rules: {
      // Unused variables configuration
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      
      // Syntax and style rules
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-console': 'warn',
      'no-empty': 'error',
      'no-empty-function': 'error',
      'no-unused-expressions': 'error',
      
      // Best practices
      'no-undef': 'error',
      
      // Additional rules for cleaner code
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
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
