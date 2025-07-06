import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ClickUpSettings {
  id: string;
  created_at: string;
  api_key: string;
  list_id: string; 
  list_id_clientes_produtos?: string;
  list_id_produtos?: string;
  list_id_requests: string; 
  updated_at?: string;
}
