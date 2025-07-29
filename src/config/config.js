require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  env,
  isDev: env === 'development',
  isTest: env === 'test',
  port: process.env.PORT || 3001,
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  logs: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

const envConfig = {
  development: {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },
  test: {
    supabase: {
      url: process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL,
      anonKey: process.env.TEST_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },
  production: {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },
};

// Validate required configuration
const requiredConfig = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

requiredConfig.forEach((key) => {
  if (!process.env[key] && env !== 'test') {
    throw new Error(`Environment variable ${key} is required`);
  }
});

module.exports = {
  ...baseConfig,
  ...envConfig[env],
};
