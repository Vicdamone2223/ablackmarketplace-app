// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing env vars. Check .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
} else {
  // Helpful once on app boot
  console.log('[Supabase] URL loaded:', supabaseUrl);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
