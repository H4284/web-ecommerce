import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS — never import this into client components.
 */
export function createSupabaseAdmin(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  cached ??= createSupabaseAdmin();
  return cached;
}
