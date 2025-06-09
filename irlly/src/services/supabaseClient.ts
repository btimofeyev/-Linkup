import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjeedxxkroidsltbbhlm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZWVkeHhrcm9pZHNsdGJiaGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjU4NDMsImV4cCI6MjA2NDg0MTg0M30.y5qXu6wKJ_lm2zM-K3qz0L3dN4-DJJflBuqvOqQBvBo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});