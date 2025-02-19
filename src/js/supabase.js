import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return userData;
}

// Admin functions
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

export async function getStats() {
  const { data: users } = await supabase
    .from('users')
    .select('count');
    
  const { data: totalRevenue } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'completed');
    
  const revenue = totalRevenue?.reduce((acc, order) => acc + order.total, 0) || 0;
    
  return {
    userCount: users?.[0]?.count || 0,
    totalRevenue: revenue
  };
}

export async function addProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();
    
  return { data, error };
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
    
  return { data, error };
}