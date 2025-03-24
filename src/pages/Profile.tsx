import { useState } from 'react'
import { FiUser, FiMail, FiLock, FiSave } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useMutation } from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'

export default function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      const supabase = getSupabaseClient()
      
      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: data.first_name,
          last_name: data.last_name
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      // Update password if provided
      if (data.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password
        })

        if (passwordError) throw passwordError
      }
    },
    onSuccess: () => {
      setIsEditing(false)
      alert('Perfil actualizado correctamente')
    },
    onError: (error) => {
      alert('Error al actualizar el perfil: ' + error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      alert('Las contraseñas no coinciden')
      return
    }

    updateProfile.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm font-medium text-blue-gray hover:text-dark transition-colors"
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Cambiar contraseña
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nueva contraseña
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={formData.new_password}
                          onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirmar nueva contraseña
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={formData.confirm_password}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-gray hover:bg-blue-gray/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-gray disabled:opacity-50"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2 h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}