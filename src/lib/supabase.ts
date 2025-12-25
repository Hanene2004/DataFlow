import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/['"]/g, '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/['"]/g, '');

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  (supabaseAnonKey.startsWith('ey') || supabaseAnonKey.includes('ey')); // More flexible check

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
    from: () => ({
      insert: async () => {
        console.warn('Supabase not configured: Data will not be saved');
        return { error: { message: 'Supabase not configured' } };
      },
      select: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      signInWithPassword: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      signOut: async () => { },
    },
  } as unknown as ReturnType<typeof createClient>;

export interface Dataset {
  id: string;
  user_id: string;
  filename: string;
  data: Record<string, unknown>[];
  row_count: number;
  column_count: number;
  columns: string[];
  uploaded_at: string;
  created_at: string;
}
