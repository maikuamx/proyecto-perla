import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Catalog from './pages/Catalog'
import Cart from './pages/Cart'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Addresses from './pages/Addresses'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import { getSupabaseClient } from './lib/supabase'

function App() {
  const location = useLocation()
  const queryClient = useQueryClient()

  // Reset query cache and refetch data on navigation
  useEffect(() => {
    const handleNavigation = async () => {
      try {
        // Verify Supabase connection
        const supabase = getSupabaseClient()
        const { error } = await supabase.from('products').select('id').limit(1)
        
        if (error) {
          console.error('Supabase connection error:', error)
          // Invalidate all queries to trigger refetch
          queryClient.invalidateQueries()
          return
        }

        // Prefetch common data
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['products'],
            queryFn: async () => {
              const { data } = await supabase
                .from('products')
                .select('*')
                .gt('stock_quantity', 0)
                .order('created_at', { ascending: false })
              return data
            }
          }),
          queryClient.prefetchQuery({
            queryKey: ['user'],
            queryFn: async () => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session?.user) return null

              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

              return profile
            }
          })
        ])
      } catch (error) {
        console.error('Error during navigation:', error)
        queryClient.invalidateQueries()
      }
    }

    handleNavigation()
  }, [location.pathname, queryClient])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/addresses" element={
          <ProtectedRoute>
            <Addresses />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default App