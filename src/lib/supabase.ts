import { createClient } from '@supabase/supabase-js';

export const getSupabaseUrl = (): string => {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  );
};

export const getSupabaseAnonKey = (): string => {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
};

export const isSupabaseConfigured = (): boolean => {
  // In test environment or when explicitly forced to mock
  if (import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK === 'true') {
    return false;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('placeholder') &&
    key !== 'your-anon-key' &&
    key.length > 20
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
