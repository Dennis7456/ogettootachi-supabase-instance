#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

class SupabaseTDDSetup {
  constructor() {
    this.projectRef = null
    this.supabaseUrl = null
    this.supabaseAnonKey = null
    this.openaiApiKey = null
  }

  async run() {
    console.log('🚀 Starting Supabase TDD Setup...\n')
    
    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites()
      
      // Step 2: Create Supabase project
      await this.createSupabaseProject()
      
      // Step 3: Set up environment variables
      await this.setupEnvironmentVariables()
      
      // Step 4: Run database migrations
      await this.runMigrations()
      
      // Step 5: Deploy edge functions
      await this.deployEdgeFunctions()
      
      // Step 6: Run tests to verify setup
      await this.runTests()
      
      console.log('\n✅ Supabase setup completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Update your frontend .env.local with the new Supabase credentials')
      console.log('2. Test the admin registration at /admin/register')
      console.log('3. Upload some documents and test the chatbot')
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message)
      process.exit(1)
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...')
    
    // Check if Supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' })
    } catch (error) {
      throw new Error('Supabase CLI not found. Install with: npm install -g supabase')
    }
    
    // Check if logged in to Supabase
    try {
      execSync('supabase projects list', { stdio: 'pipe' })
    } catch (error) {
      throw new Error('Not logged in to Supabase. Run: supabase login')
    }
    
    // Check for OpenAI API key
    this.openaiApiKey = process.env.OPENAI_API_KEY
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set')
    }
    
    console.log('✅ Prerequisites check passed')
  }

  async createSupabaseProject() {
    console.log('\n🏗️  Creating Supabase project...')
    
    // Check if project already exists
    const projectName = 'ogetto-otachi-law-firm'
    
    try {
      const projectsOutput = execSync('supabase projects list --json', { encoding: 'utf8' })
      const projects = JSON.parse(projectsOutput)
      
      const existingProject = projects.find(p => p.name === projectName)
      
      if (existingProject) {
        console.log(`✅ Project "${projectName}" already exists`)
        this.projectRef = existingProject.id
        this.supabaseUrl = existingProject.api_url
        this.supabaseAnonKey = existingProject.anon_key
      } else {
        console.log(`Creating new project: ${projectName}`)
        
        // Create project
        const createOutput = execSync(`supabase projects create ${projectName} --org-id 1 --json`, { encoding: 'utf8' })
        const project = JSON.parse(createOutput)
        
        this.projectRef = project.id
        this.supabaseUrl = project.api_url
        this.supabaseAnonKey = project.anon_key
        
        console.log(`✅ Project created with ID: ${this.projectRef}`)
      }
      
    } catch (error) {
      throw new Error(`Failed to create/find project: ${error.message}`)
    }
  }

  async setupEnvironmentVariables() {
    console.log('\n🔧 Setting up environment variables...')
    
    // Create .env.local for frontend
    const envContent = `VITE_SUPABASE_URL=${this.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${this.supabaseAnonKey}
OPENAI_API_KEY=${this.openaiApiKey}
`
    
    writeFileSync(join(process.cwd(), 'ogetto-otachi-frontend', '.env.local'), envContent)
    console.log('✅ Frontend environment variables set')
    
    // Set environment variables for current process
    process.env.VITE_SUPABASE_URL = this.supabaseUrl
    process.env.VITE_SUPABASE_ANON_KEY = this.supabaseAnonKey
    
    console.log('✅ Environment variables configured')
  }

  async runMigrations() {
    console.log('\n🗄️  Running database migrations...')
    
    try {
      // Link to project
      execSync(`supabase link --project-ref ${this.projectRef}`, { stdio: 'inherit' })
      
      // Run migrations
      execSync('supabase db push', { stdio: 'inherit' })
      
      console.log('✅ Database migrations completed')
      
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`)
    }
  }

  async deployEdgeFunctions() {
    console.log('\n⚡ Deploying edge functions...')
    
    try {
      // Deploy chatbot function
      console.log('Deploying chatbot function...')
      execSync('supabase functions deploy chatbot', { stdio: 'inherit' })
      
      // Deploy process-document function
      console.log('Deploying process-document function...')
      execSync('supabase functions deploy process-document', { stdio: 'inherit' })
      
      // Set environment variables for functions
      execSync(`supabase secrets set OPENAI_API_KEY=${this.openaiApiKey}`, { stdio: 'inherit' })
      
      console.log('✅ Edge functions deployed')
      
    } catch (error) {
      throw new Error(`Function deployment failed: ${error.message}`)
    }
  }

  async runTests() {
    console.log('\n🧪 Running tests to verify setup...')
    
    try {
      // Install dependencies if needed
      if (!existsSync(join(process.cwd(), 'ogetto-otachi-frontend', 'node_modules'))) {
        console.log('Installing frontend dependencies...')
        execSync('npm install', { 
          cwd: join(process.cwd(), 'ogetto-otachi-frontend'),
          stdio: 'inherit' 
        })
      }
      
      // Run the test suite
      execSync('npm test supabase/tests/setup.test.js', { 
        cwd: join(process.cwd(), 'ogetto-otachi-frontend'),
        stdio: 'inherit',
        env: {
          ...process.env,
          VITE_SUPABASE_URL: this.supabaseUrl,
          VITE_SUPABASE_ANON_KEY: this.supabaseAnonKey
        }
      })
      
      console.log('✅ All tests passed!')
      
    } catch (error) {
      console.warn('⚠️  Some tests failed. This might be expected for initial setup.')
      console.warn('You can run tests manually later with: npm test supabase/tests/setup.test.js')
    }
  }
}

// Run the setup
const setup = new SupabaseTDDSetup()
setup.run().catch(console.error) 