// Global Deno environment types
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }

  const env: Env;
}

// Resend email types
declare module 'resend' {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: {
        from: string;
        to: string;
        subject: string;
        html: string;
      }): Promise<{
        data: { id: string };
        error: any;
      }>;
    };
  }
}

// Supabase client types
declare module '@supabase/supabase-js' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): any;
}
