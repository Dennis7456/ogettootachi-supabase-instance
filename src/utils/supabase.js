const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

class SupabaseClient {
  constructor() {
    if (!SupabaseClient.instance) {
      const { url, anonKey, serviceRoleKey } = config.supabase;
      
      if (!url || !anonKey) {
        throw new Error('Supabase URL and anon key are required');
      }
      
      this.client = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
      
      // Create admin client with service role key if available
      if (serviceRoleKey) {
        this.adminClient = createClient(url, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      }
      
      SupabaseClient.instance = this;
    }
    
    return SupabaseClient.instance;
  }
  
  getClient() {
    return this.client;
  }
  
  getAdminClient() {
    if (!this.adminClient) {
      throw new Error('Service role key is required for admin operations');
    }
    return this.adminClient;
  }
}

module.exports = new SupabaseClient();
