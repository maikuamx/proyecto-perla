import 'dotenv/config'
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";




require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SECRET_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (!error && data.user) {
    // Crear entrada en la tabla users
    const { error: userError } = await supabase
      .from('users')
      .insert([
        { 
          id: data.user.id,
          email: email,
          role: 'user'
        }
      ]);
      
    if (userError) return { error: userError };
  }
  
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (!error) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    return { data: { ...data, user: { ...data.user, ...userData } }, error: null };
  }
  
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
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
    
  const { data: orders } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'completed');
    
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
    
  return {
    userCount: userCount || 0,
    totalRevenue
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
    
  return { data: data || [], error };
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
    
  return { error };
}

// Order functions
export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      ...orderData,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();
    
  return { data, error };
}

export async function getUserOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
    
  return { data: data || [], error };
}