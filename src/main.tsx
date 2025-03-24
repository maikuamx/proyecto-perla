import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { initSupabase } from './lib/supabase'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false
    }
  }
})

// Initialize Supabase before rendering
initSupabase()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4CAF50',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#f44336',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>,
    )
  })
  .catch(error => {
    console.error('Failed to initialize application:', error)
    // Show error message to user
    document.body.innerHTML = `
      <div style="
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div>
          <h1 style="color: #1a1a1a; margin-bottom: 16px;">
            Error al inicializar la aplicación
          </h1>
          <p style="color: #666;">
            Por favor, intenta recargar la página. Si el problema persiste, 
            contacta al soporte técnico.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              margin-top: 24px;
              padding: 12px 24px;
              background: #708090;
              color: white;
              border: none;
              border-radius: 9999px;
              cursor: pointer;
            "
          >
            Recargar página
          </button>
        </div>
      </div>
    `
  })