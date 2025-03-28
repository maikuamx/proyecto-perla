import { useQuery } from '@tanstack/react-query'
import { FiPackage, FiClock, FiCheck, FiX, FiDownload } from 'react-icons/fi'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { FaWhatsapp } from 'react-icons/fa'
import { generateOrderPDF } from '../utils/pdf'

interface OrderItem {
  product_id: string
  quantity: number
  price: number
  products: {
    name: string
    images: string[]
  }
}

interface OrderResponse {
  id: string
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  items: OrderItem[]
}

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

  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuario no autenticado')

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        throw error
      }

      return (data as unknown as OrderResponse[]).map(order => ({
        ...order,
        items: order.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          name: item.products.name,
          image: item.products.images[0]
        }))
      }))
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: 1000
  })

  const shareViaWhatsApp = (order: Order) => {
    try {
      // Generate PDF
      const pdf = generateOrderPDF(order)
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // Create message
      const message = `¡Hola! Quiero consultar sobre mi pedido #${order.id.slice(0, 8)}

Fecha: ${new Date(order.created_at).toLocaleDateString('es-MX')}
Estado: ${statusLabels[order.status]}

Productos:
${order.items.map(item => `- ${item.quantity}x ${item.name} ($${item.price.toFixed(2)})`).join('\n')}

Total: $${order.total.toFixed(2)}

Adjunto el PDF con los detalles completos del pedido.

¿Podrías ayudarme con información sobre la entrega?`

      // Open WhatsApp with message
      const whatsappUrl = `https://wa.me/526141336763?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      // Download PDF
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `pedido-${order.id.slice(0, 8)}.pdf`
      link.click()

      // Clean up
      URL.revokeObjectURL(pdfUrl)
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error)
      toast.error('Error al compartir por WhatsApp')
    }
  }

  const downloadPDF = (order: Order) => {
    try {
      const pdf = generateOrderPDF(order)
      pdf.save(`pedido-${order.id.slice(0, 8)}.pdf`)
      toast.success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FiX className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar los pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Por favor, intenta recargar la página
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-gray border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

        {!orders?.length ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aún no has realizado ningún pedido
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
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
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${statusColors[order.status]}`}>
                          <StatusIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadPDF(order)}
                          className="p-2 text-gray-500 hover:text-blue-gray transition-colors"
                          title="Descargar PDF"
                        >
                          <FiDownload className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => shareViaWhatsApp(order)}
                          className="p-2 text-gray-500 hover:text-green-500 transition-colors"
                          title="Compartir por WhatsApp"
                        >
                          <FaWhatsapp className="h-5 w-5" />
                        </button>
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