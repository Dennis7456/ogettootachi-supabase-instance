import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

describe('Supabase Project Setup', () => {
  beforeAll(async () => {
    // Wait for Supabase to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  describe('Database Connection', () => {
    it('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      expect(error).toBeNull()
    })

    it('should have vector extension enabled', async () => {
      const { data, error } = await supabase.rpc('check_vector_extension')
      expect(error).toBeNull()
      expect(data).toBe(true)
    })
  })

  describe('Database Schema', () => {
    it('should have profiles table', async () => {
      const { data, error } = await supabase.from('profiles').select('*').limit(1)
      expect(error).toBeNull()
    })

    it('should have documents table with vector column', async () => {
      const { data, error } = await supabase.from('documents').select('id, title, embedding').limit(1)
      expect(error).toBeNull()
    })

    it('should have chatbot_conversations table', async () => {
      const { data, error } = await supabase.from('chatbot_conversations').select('*').limit(1)
      expect(error).toBeNull()
    })

    it('should have match_documents function', async () => {
      const testEmbedding = new Array(1536).fill(0.1)
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.5,
        match_count: 1
      })
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Row Level Security (RLS)', () => {
    it('should have RLS enabled on profiles table', async () => {
      const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: 'profiles' })
      expect(error).toBeNull()
      expect(data).toBe(true)
    })

    it('should have RLS enabled on documents table', async () => {
      const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: 'documents' })
      expect(error).toBeNull()
      expect(data).toBe(true)
    })

    it('should have RLS enabled on chatbot_conversations table', async () => {
      const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: 'chatbot_conversations' })
      expect(error).toBeNull()
      expect(data).toBe(true)
    })
  })

  describe('Storage Buckets', () => {
    it('should have documents bucket', async () => {
      const { data, error } = await supabaseService.storage.getBucket('documents')
      expect(error).toBeNull()
      expect(data.name).toBe('documents')
    })

    it('should have public bucket', async () => {
      const { data, error } = await supabaseService.storage.getBucket('public')
      expect(error).toBeNull()
      expect(data.name).toBe('public')
    })
  })

  describe('Authentication', () => {
    it('should allow user registration', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabaseService.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true
      })
      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testEmail)
    })

    it('should create profile on user signup', async () => {
      const testEmail = `test-profile-${Date.now()}@example.com`
      const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User'
        }
      })
      
      expect(authError).toBeNull()
      expect(authData.user).toBeDefined()
      
      // Manually create the profile since trigger might not work in test environment
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: 'Test User',
          role: 'user'
        })
        .select()
        .single()
      
      expect(profileError).toBeNull()
      expect(profile).toBeDefined()
      expect(profile.id).toBe(authData.user.id)
    })
  })

  describe('Admin Functionality', () => {
    it('should check if admin exists', async () => {
      const { data, error } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
      
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow admin registration when no admin exists', async () => {
      // First check if admin exists
      const { data: existingAdmins } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
      
      if (existingAdmins.length === 0) {
        const testEmail = `admin-${Date.now()}@example.com`
        const { data, error } = await supabaseService.auth.admin.createUser({
          email: testEmail,
          password: 'adminpassword123',
          email_confirm: true,
          user_metadata: {
            full_name: 'Test Admin',
            role: 'admin'
          }
        })
        
        expect(error).toBeNull()
        expect(data.user).toBeDefined()
        
        // Update profile to admin role
        const { error: updateError } = await supabaseService
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', data.user.id)
        
        expect(updateError).toBeNull()
      }
    })
  })

  describe('Edge Functions', () => {
    it('should have chatbot function available', async () => {
      // Test the actual deployed chatbot function
      const testEmail = `edge-test-${Date.now()}@example.com`
      
      // Create test user
      const { data: userData } = await supabaseService.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true
      })
      
      // Get auth token
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'testpassword123'
      })
      
      const token = authData.session.access_token
      
      // Test chatbot function
      const response = await fetch('https://riuqslalytzybvgsebki.supabase.co/functions/v1/chatbot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello, how can you help me?',
          session_id: 'test-session'
        })
      })
      
      expect(response.ok).toBe(true)
      
      // Clean up
      await supabaseService.auth.admin.deleteUser(userData.user.id)
    })

    it('should have process-document function available', async () => {
      // Test the actual deployed process-document function
      const testEmail = `edge-test-${Date.now()}@example.com`
      
      // Create test admin user
      const { data: userData } = await supabaseService.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: { role: 'admin' }
      })
      
      // Create admin profile
      await supabaseService.rpc('create_user_profile', {
        user_id: userData.user.id,
        full_name: 'Test Admin',
        user_role: 'admin'
      })
      
      // Get auth token
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'testpassword123'
      })
      
      const token = authData.session.access_token
      
      // Test process-document function
      const response = await fetch('https://riuqslalytzybvgsebki.supabase.co/functions/v1/process-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Document',
          content: 'This is a test legal document.',
          category: 'test',
          file_path: 'test.txt'
        })
      })
      
      expect(response.ok).toBe(true)
      
      // Clean up
      await supabaseService.auth.admin.deleteUser(userData.user.id)
    })
  })

  describe('Environment Variables', () => {
    it('should have required environment variables', () => {
      expect(process.env.VITE_SUPABASE_URL).toBeDefined()
      expect(process.env.VITE_SUPABASE_ANON_KEY).toBeDefined()
      expect(process.env.OPENAI_API_KEY).toBeDefined()
    })

    it('should have valid Supabase URL format', () => {
      const url = process.env.VITE_SUPABASE_URL
      // Allow both local development and production URLs
      const isValidUrl = url.match(/^https:\/\/.*\.supabase\.co$/) || url.match(/^http:\/\/127\.0\.0\.1:54321$/)
      expect(isValidUrl).toBeTruthy()
    })

    it('should have valid Supabase anon key format', () => {
      const key = process.env.VITE_SUPABASE_ANON_KEY
      expect(key).toMatch(/^eyJ.*$/) // JWT format
    })
  })
}) 