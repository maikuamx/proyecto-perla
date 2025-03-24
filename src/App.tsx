import { Routes, Route } from 'react-router-dom'
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

function App() {
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