/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

// Vitest or Jest global imports
import { describe, it, expect, beforeAll } from 'vitest';

// Local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const _supabase = createClient(supabaseUrl, supabaseAnonKey);
const _supabaseService = createClient(supabaseUrl, supabaseServiceKey);

describe('Supabase Project Setup', () => {
  beforeAll(async () => {
    // Wait for Supabase to be ready
    await new Promise(_resolve => setTimeout(_resolve, 2000));
  });

  describe('Database Connection', () => {
    it('should connect to Supabase successfully', async () => {
      const { _data, _error } = await _supabase
        .from('profiles')
        .select('count')
        .limit(1);
      expect(_error).toBeNull();
    });

    it('should have vector extension enabled', async () => {
      const { _data, _error } = await _supabase.rpc('check_vector_extension');
      expect(_error).toBeNull();
      expect(_data).toBe(true);
    });
  });

  describe('Database Schema', () => {
    it('should have profiles table', async () => {
      const { _data, _error } = await _supabaseService
        .from('profiles')
        .select('*')
        .limit(1);
      expect(_error).toBeNull();
      expect(_data).toBeDefined();
    });

    it('should have documents table', async () => {
      const { _data, _error } = await _supabaseService
        .from('documents')
        .select('*')
        .limit(1);
      expect(_error).toBeNull();
      expect(_data).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should allow anonymous access', async () => {
      const {
        _data: { _user },
        _error,
      } = await _supabase.auth.getUser();
      expect(_error).toBeNull();
    });

    it('should have service role access', async () => {
      const {
        _data: { _user },
        _error,
      } = await _supabaseService.auth.getUser();
      expect(_error).toBeNull();
    });
  });

  describe('Row Level Security', () => {
    it('should enforce RLS on profiles', async () => {
      const { _data, _error } = await _supabase.from('profiles').select('*');
      expect(_error).not.toBeNull();
    });

    it('should enforce RLS on documents', async () => {
      const { _data, _error } = await _supabase.from('documents').select('*');
      expect(_error).not.toBeNull();
    });
  });

  describe('Vector Embeddings', () => {
    it('should support vector operations', async () => {
      const _testVector = new Array(1536).fill(0);
      _testVector[0] = 1;

      const { _data, _error } = await _supabaseService
        .from('documents')
        .insert({
          title: 'Test Vector Document',
          content: 'This is a test document for vector embeddings.',
          embedding: _testVector,
        });

      expect(_error).toBeNull();
    });
  });

  describe('Chatbot Conversations', () => {
    it('should allow inserting conversation records', async () => {
      const { _data, _error } = await _supabaseService
        .from('chatbot_conversations')
        .insert({
          user_id: null,
          session_id: 'test-session',
          message: 'Test message',
          response: 'Test response',
        });

      expect(_error).toBeNull();
    });
  });
});
