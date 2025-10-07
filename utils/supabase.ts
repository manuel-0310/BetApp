import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bytomvfocnjwbfprllso.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dG9tdmZvY25qd2JmcHJsbHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDY4MDUsImV4cCI6MjA3MzYyMjgwNX0.wcRV7OsOzv19x0Y5ZJmuuhCBWvNLAq0YdPqXdC_X_BA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, 
    },
  },
});
