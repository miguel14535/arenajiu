import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SUPABASE URL:', supabaseUrl);
console.log('SUPABASE KEY:', supabaseKey?.substring(0, 20));
console.log('SUPABASE CONFIGURADO:', !!supabaseUrl && !!supabaseKey);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);