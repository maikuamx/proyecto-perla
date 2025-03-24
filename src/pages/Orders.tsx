import { useQuery } from '@tanstack/react-query'
import { FiPackage, FiClock, FiCheck, FiX } from 'react-icons/fi'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Order {
  id: string
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  items: Array<{
    product_id: string
    quantity: number
    price: number
    name: string
    image: string
  }>
}

const statusIcons = {
  pending: FiClock,
  processing: FiPackage,
  completed: FiCheck,
  cancelled: FiX
}

const statusColors = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  cancelled: 'text-red-500'
}

const statusLabels = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}

export default function Orders() {
  const { user } = useAuth()

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total,
          items:order_items (
            product_id,
            quantity,
            price,
            products (
              name,
              images
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          name: item.products.name,
          image: item.products.images[0]
        }))
      }))
    },
    enabled: !!user
  })

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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

        {orders?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aún no has realizado ningún pedido
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders?.map(order => {
              const StatusIcon = statusIcons[order.status]
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 ${statusColors[order.status]}`}>
                        <StatusIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {statusLabels[order.status]}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 -mx-6 px-6 py-4">
                      {order.items.map(item => (
                        <div key={item.product_id} className="flex items-center py-4 gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              Cantidad: {item.quantity}
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900">
                          Total
                        </span>
                        <span className="text-base font-medium text-gray-900">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}