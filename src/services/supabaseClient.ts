import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yafdblbogdxzgjzuvfls.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_rOzmYCk_nLY9gIgisd4I_g_M--Xtuhx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface CloudWorldRecord {
  id: string;
  user_id: string;
  world_name: string;
  edition: 'java' | 'bedrock';
  r2_file_key: string;
  r2_icon_key?: string;
  file_size: number;
  sha256_hash: string;
  game_mode?: number;
  seed?: string;
  source_os: string;
  source_launcher: string;
  version_synced?: number;
  last_synced_at: string;
  created_at: string;
  updated_at?: string;
}
