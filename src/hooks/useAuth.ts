import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'
import type { User } from '../types/user'
import toast from 'react-hot-toast'

interface SignInCredentials {
  email: string
  password: string
}

interface SignUpCredentials extends SignInCredentials {
  firstName: string
  lastName: string
}

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return null

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          return null
        }

        return profile
      } catch (error) {
        console.error('Error in auth check:', error)
        return null
      }
    },
    retry: 3,
    retryDelay: 1000,
    refetchOnMount: true,
    refetchOnReconnect: true
  })

  const signIn = useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
      if (error) throw error

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return profile
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(['user'], profile)
      toast.success('¡Bienvenido de nuevo!')
      if (profile.role === 'admin') {
        navigate('/admin')
      } else {
        const redirectPath = localStorage.getItem('redirectAfterLogin')
        if (redirectPath) {
          localStorage.removeItem('redirectAfterLogin')
          navigate(redirectPath)
        } else {
          navigate('/')
        }
      }
    },
    onError: (error) => {
      toast.error('Error al iniciar sesión: ' + error.message)
    }
  })

  const signUp = useMutation({
    mutationFn: async (credentials: SignUpCredentials) => {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      })

      if (signUpError) throw signUpError
      if (!user) throw new Error('No user returned from sign up')

      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: credentials.email,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          role: 'user'
        }])

      if (profileError) throw profileError
    },
    onSuccess: () => {
      toast.success('¡Cuenta creada exitosamente!')
      navigate('/')
    },
    onError: (error) => {
      toast.error('Error al crear la cuenta: ' + error.message)
    }
  })

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
      queryClient.clear()
      toast.success('¡Hasta pronto!')
      navigate('/')
    },
    onError: (error) => {
      toast.error('Error al cerrar sesión: ' + error.message)
    }
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          queryClient.setQueryData(['user'], profile)
        } else if (event === 'SIGNED_OUT') {
          queryClient.setQueryData(['user'], null)
          queryClient.clear()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, supabase])

  return {
    user,
    isLoading,
    error,
    signIn: signIn.mutate,
    signUp: signUp.mutate,
    signOut: signOut.mutate,
    isSigningIn: signIn.isPending,
    isSigningUp: signUp.isPending
  }
}