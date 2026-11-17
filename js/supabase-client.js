import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://msnqpbynzkklpntgdkys.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pRRSS3mFigrV_ired1UoQg_ahQQDYqU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
