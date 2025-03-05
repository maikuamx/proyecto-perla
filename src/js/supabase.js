import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_PUBLIC;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API base URL
const API_URL = 'http://localhost:3000/api';

// Auth functions
export async function signUp(email, password, firstName, lastName) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    localStorage.setItem('token', data.session.access_token);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  localStorage.removeItem('token');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { ...user, ...profile };
  } catch (error) {
    localStorage.removeItem('token');
    return null;
  }
}

// Product functions
export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return await response.json();
}

export async function getProductsByCategory(category) {
  const response = await fetch(`${API_URL}/products/category/${category}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return await response.json();
}

// Admin functions
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

export async function addProduct(productData) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return await response.json();
}

export async function updateProduct(id, updates) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return await response.json();
}

export async function deleteProduct(id) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
}

// Cart functions
export async function saveCart(items) {
  const user = await getCurrentUser();
  if (!user) {
    localStorage.setItem('cart', JSON.stringify(items));
    return;
  }

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
}

export async function getCart() {
  const user = await getCurrentUser();
  if (!user) {
    return JSON.parse(localStorage.getItem('cart')) || { items: [] };
  }

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/cart`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return await response.json();
}

// Checkout functions
export async function createCheckoutSession(items) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const { url } = await response.json();
  window.location.href = url;
}