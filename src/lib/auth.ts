import { supabase } from './supabase';

export async function checkUserRole(requiredRole: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
    
  return data?.role === requiredRole;
}
