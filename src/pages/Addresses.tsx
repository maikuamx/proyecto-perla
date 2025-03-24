import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiMapPin, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zip_code: string
  phone: string
  instructions?: string
}

export default function Addresses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const addAddress = useMutation({
    mutationFn: async (data: Omit<Address, 'id'>) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('addresses')
        .insert([{
          ...data,
          user_id: user?.id
        }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setShowForm(false)
      setEditingAddress(null)
    }
  })

  const updateAddress = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Omit<Address, 'id'> }) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('addresses')
        .update(data)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setShowForm(false)
      setEditingAddress(null)
    }
  })

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    }
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const addressData = {
      name: formData.get('name') as string,
      street: formData.get('street') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip_code: formData.get('zip_code') as string,
      phone: formData.get('phone') as string,
      instructions: formData.get('instructions') as string
    }

    if (editingAddress) {
      await updateAddress.mutateAsync({ id: editingAddress.id, data: addressData })
    } else {
      await addAddress.mutateAsync(addressData)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-gray border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Direcciones</h1>
          <button
            onClick={() => {
              setEditingAddress(null)
              setShowForm(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-gray hover:bg-blue-gray/90"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nueva Dirección
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de la dirección
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingAddress?.name}
                    placeholder="Ej: Casa, Oficina"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={editingAddress?.phone}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Calle y número
                  </label>
                  <input
                    type="text"
                    name="street"
                    required
                    defaultValue={editingAddress?.street}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    defaultValue={editingAddress?.city}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    defaultValue={editingAddress?.state}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    required
                    defaultValue={editingAddress?.zip_code}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Instrucciones de entrega (opcional)
                  </label>
                  <textarea
                    name="instructions"
                    rows={3}
                    defaultValue={editingAddress?.instructions}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                    placeholder="Ej: Tocar el timbre, edificio azul, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingAddress(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addAddress.isPending || updateAddress.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-gray hover:bg-blue-gray/90 disabled:opacity-50"
                >
                  {addAddress.isPending || updateAddress.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar dirección'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {addresses?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay direcciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              Añade una dirección para tus envíos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses?.map(address => (
              <div key={address.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FiMapPin className="h-5 w-5 text-blue-gray" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {address.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAddress(address)
                        setShowForm(true)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-gray"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de eliminar esta dirección?')) {
                          deleteAddress.mutate(address.id)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-gray-600">{address.street}</p>
                  <p className="text-gray-600">
                    {address.city}, {address.state} {address.zip_code}
                  </p>
                  <p className="text-gray-600">{address.phone}</p>
                  {address.instructions && (
                    <p className="text-sm text-gray-500 mt-2">
                      {address.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}