import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aczsouypqgjlrqdmrtwq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjenNvdXlwcWdqbHJxZG1ydHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDQ0MzUsImV4cCI6MjEwMjY4MDQzNX0.3SCk-WeS9T5sTPP8R9McTXq5WY43cigcUC9H5kEAf7c';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing from environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
