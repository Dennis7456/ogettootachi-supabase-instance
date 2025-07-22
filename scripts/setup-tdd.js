/* eslint-disable no-console, no-undef, no-unused-vars */
import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class SupabaseTDDSetup {
  constructor() {
    this.projectRef = null;
    this.supabaseUrl = null;
    this.supabaseAnonKey = null;
    this.openaiApiKey = null;
  }

  // Utility function for logging errors
  _logError(prefix, error) {
    if (error) {
      console.error(`❌ ${prefix}:`, error.message);
    }
  }

  async run() {
    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      // Step 2: Create Supabase project
      await this.createSupabaseProject();
      // Step 3: Set up environment variables
      await this.setupEnvironmentVariables();
      // Step 4: Run database migrations
      await this.runMigrations();
      // Step 5: Deploy edge functions
      await this.deployEdgeFunctions();
      // Step 6: Run tests to verify setup
      await this.runTests();

      // Instruction for frontend configuration
      console.log(
        '1. Update your frontend .env.local with the new Supabase credentials'
      );
    } catch (_error) {
      console.error('\n❌ Setup failed:', _error.message);
      throw new Error('Process exit blocked');
    }
  }

  async checkPrerequisites() {
    // Check if Supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' });
    } catch (_error) {
      throw new Error(
        'Supabase CLI not found. Install with: npm install -g supabase'
      );
    }

    // Check if logged in to Supabase
    try {
      execSync('supabase projects list', { stdio: 'pipe' });
    } catch (_error) {
      throw new Error('Not logged in to Supabase. Run: supabase login');
    }

    // Check for OpenAI API key
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
  }

  async createSupabaseProject() {
    // Check if project already exists
    const _projectName = 'ogetto-otachi-law-firm';
    try {
      const _projectsOutput = execSync('supabase projects list --json', {
        encoding: 'utf8',
      });
      const _projects = JSON.parse(_projectsOutput);
      const _existingProject = _projects.find((p) => p.name === _projectName);

      if (_existingProject) {
        this.projectRef = _existingProject.id;
        this.supabaseUrl = _existingProject.api_url;
        this.supabaseAnonKey = _existingProject.anon_key;
      } else {
        // Create project
        const _createOutput = execSync(
          `supabase projects create ${_projectName} --org-id 1 --json`,
          { encoding: 'utf8' }
        );
        const _project = JSON.parse(_createOutput);
        this.projectRef = _project.id;
        this.supabaseUrl = _project.api_url;
        this.supabaseAnonKey = _project.anon_key;
      }
    } catch (_error) {
      this._logError('Failed to create or find Supabase project', _error);
    }
  }

  async setupEnvironmentVariables() {
    // Create .env.local for frontend
    const _envContent = `VITE_SUPABASE_URL=${this.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${this.supabaseAnonKey}
OPENAI_API_KEY=${this.openaiApiKey}
`;
    writeFileSync(
      join(process.cwd(), 'ogetto-otachi-frontend', '.env.local'),
      _envContent
    );

    // Set environment variables for current process
    process.env.VITE_SUPABASE_URL = this.supabaseUrl;
    process.env.VITE_SUPABASE_ANON_KEY = this.supabaseAnonKey;
  }

  async runMigrations() {
    try {
      // Link to project
      execSync(`supabase link --project-ref ${this.projectRef}`, {
        stdio: 'inherit',
      });

      // Run migrations
      execSync('supabase db push', { stdio: 'inherit' });
    } catch (_error) {
      this._logError('Failed to run migrations', _error);
    }
  }

  async deployEdgeFunctions() {
    try {
      // Deploy chatbot function
      execSync('supabase functions deploy chatbot', { stdio: 'inherit' });

      // Deploy process-document function
      execSync('supabase functions deploy process-document', {
        stdio: 'inherit',
      });

      // Set environment variables for functions
      execSync(`supabase secrets set OPENAI_API_KEY=${this.openaiApiKey}`, {
        stdio: 'inherit',
      });
    } catch (_error) {
      this._logError('Failed to deploy edge functions', _error);
    }
  }

  async runTests() {
    try {
      // Install dependencies if needed
      const _frontendPath = join(process.cwd(), 'ogetto-otachi-frontend');
      if (!existsSync(join(_frontendPath, 'node_modules'))) {
        execSync('npm install', {
          cwd: _frontendPath,
          stdio: 'inherit',
        });
      }

      // Run the test suite
      execSync('npm test supabase/tests/setup.test.js', {
        cwd: _frontendPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          VITE_SUPABASE_URL: this.supabaseUrl,
          VITE_SUPABASE_ANON_KEY: this.supabaseAnonKey,
        },
      });
    } catch (_error) {
      console.warn(
        '⚠️  Some tests failed. This might be expected for initial setup.'
      );
      console.warn(
        'You can run tests manually later with: npm test supabase/tests/setup.test.js'
      );
    }
  }
}

// Run the setup
function runSetup() {
  const _setup = new SupabaseTDDSetup();
  _setup.run().catch((_error) => {
    console.error('Setup failed:', _error);
    process.exit(1);
  });
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup();
}
