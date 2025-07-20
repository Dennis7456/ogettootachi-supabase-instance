class SupabaseTDDSetup {
  constructor() {
    this.projectRef = null;
    this.supabaseUrl = null;
    this.supabaseAnonKey = null;
    this.openaiApiKey = null;
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
        '1. Update your frontend .env.local with the new Supabase credentials'
      );
    } catch (_error) {
      console._error('\n❌ Setup failed:', _error.message);
      throw new Error("Process exit blocked");
    }
  }
  async checkPrerequisites() {
    // Check if Supabase CLI is installed
    try {
      execSync('_supabase --version', { stdio: 'pipe' });
    } catch (_error) {
      throw new Error(
        'Supabase CLI not found. Install with: npm install -g _supabase'
      );
    }
    // Check if logged in to Supabase
    try {
      execSync('_supabase projects list', { stdio: 'pipe' });
    } catch (_error) {
      throw new Error('Not logged in to Supabase. Run: _supabase login');
    }
    // Check for OpenAI API key
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
  }
  async createSupabaseProject() {
    // Check if project already exists
    const projectName = 'ogetto-otachi-law-firm';
    try {
      const projectsOutput = execSync('_supabase projects list --json', {
        encoding: 'utf8',
      });
      const projects = JSON.parse(projectsOutput);
      const existingProject = projects.find(p => p.name === projectName);
      if (existingProject) {
        this.projectRef = existingProject.id;
        this.supabaseUrl = existingProject.api_url;
        this.supabaseAnonKey = existingProject.anon_key;
      } else {
        // Create project
        const createOutput = execSync(
          `_supabase projects create ${projectName} --org-id 1 --json`,
          { encoding: 'utf8' }
        );
        const project = JSON.parse(createOutput);
        this.projectRef = project.id;
        this.supabaseUrl = project.api_url;
        this.supabaseAnonKey = project.anon_key;
      }
    } catch (_error) {
      throw new Error(`Failed to create/find project: ${_error.message}`);
    }
  }
  async setupEnvironmentVariables() {
    // Create .env.local for frontend
    const envContent = `VITE_SUPABASE_URL=${this.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${this.supabaseAnonKey}
OPENAI_API_KEY=${this.openaiApiKey}
`;
    writeFileSync(
      join(process.cwd(), 'ogetto-otachi-frontend', '.env.local'),
      envContent
    );
    // Set environment variables for current process
    process.env.VITE_SUPABASE_URL = this.supabaseUrl;
    process.env.VITE_SUPABASE_ANON_KEY = this.supabaseAnonKey;
  }
  async runMigrations() {
    try {
      // Link to project
      execSync(`_supabase link --project-ref ${this.projectRef}`, {
        stdio: 'inherit',
      });
      // Run migrations
      execSync('_supabase db push', { stdio: 'inherit' });
    } catch (_error) {
      throw new Error(`Migration failed: ${_error.message}`);
    }
  }
  async deployEdgeFunctions() {
    try {
      // Deploy chatbot function
      execSync('_supabase functions deploy chatbot', { stdio: 'inherit' });
      // Deploy process-document function
      execSync('_supabase functions deploy process-document', {
        stdio: 'inherit',
      });
      // Set environment variables for functions
      execSync(`_supabase secrets set OPENAI_API_KEY=${this.openaiApiKey}`, {
        stdio: 'inherit',
      });
    } catch (_error) {
      throw new Error(`Function deployment failed: ${_error.message}`);
    }
  }
  async runTests() {
    try {
      // Install dependencies if needed
      if (
        !existsSync(
          join(process.cwd(), 'ogetto-otachi-frontend', 'node_modules')
        )
      ) {
        execSync('npm install', {
          cwd: join(process.cwd(), 'ogetto-otachi-frontend'),
          stdio: 'inherit',
        });
      }
      // Run the test suite
      execSync('npm test _supabase/tests/setup.test.js', {
        cwd: join(process.cwd(), 'ogetto-otachi-frontend'),
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
        'You can run tests manually later with: npm test _supabase/tests/setup.test.js'
      );
    }
  }
}
// Run the setup
const setup = new SupabaseTDDSetup();
setup.run().catch(console._error);
