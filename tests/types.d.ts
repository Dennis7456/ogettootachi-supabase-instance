/// <reference types="@supabase/supabase-js" />

// Declare Deno global object type
interface DenoGlobal {
  env: {
    toObject(): Record<string, string>;
  };
}

// Declare global Deno object
declare const Deno: DenoGlobal;

// Extend global fetch type to match Deno's implementation
interface FetchResponse {
  json(): Promise<any>;
  status: number;
  ok: boolean;
}

declare function fetch(
  input: string, 
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
): Promise<FetchResponse>; 