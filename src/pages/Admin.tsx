import { useEffect, useState } from 'react'
import { FiUsers, FiDollarSign, FiShoppingBag, FiBox, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'
import type { Product } from '../types/product'

interface Stats {
  userCount: number
  totalRevenue: number
  completedOrders: number
  activeProducts: number
  revenueData: Array<{
    date: string
    total: number
  }>
}

interface ProductFormData {
  name: string
  description: string
  price: number
  category: string
  size?: string
  stock_quantity: number
  images: string[]
}

export default function Admin() {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()
  const [selectedPeriod, setSelectedPeriod] = useState(7)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { data: orders } = await supabase
        .from('orders')
        .select('total, status, created_at')

      const completedOrders = orders?.filter(order => order.status === 'completed') || []
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      return {
        userCount: userCount || 0,
        totalRevenue: totalRevenue || 0,
        completedOrders: completedOrders.length,
        activeProducts: productCount || 0,
        revenueData: completedOrders.map(order => ({
          date: order.created_at,
          total: order.total
        }))
      }
    }
  })

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Add product mutation
  const addProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...data,
          created_at: new Date().toISOString()
        }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setShowProductForm(false)
      setUploadedImages([])
    }
  })

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: ProductFormData }) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowProductForm(false)
      setEditingProduct(null)
      setUploadedImages([])
    }
  })

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    }
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxImages = 5

    if (uploadedImages.length + files.length > maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setUploadedImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      size: formData.get('size') as string || null,
      stock_quantity: parseInt(formData.get('stock_quantity') as string),
      images: uploadedImages
    }

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, data: productData })
    } else {
      await addProduct.mutateAsync(productData)
    }
  }

  useEffect(() => {
    document.title = 'Panel de Administración - Sapphirus'
  }, [])

  if (isLoadingStats || isLoadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-gray border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="mt-2 text-gray-500">
            {new Date().toLocaleDateString('es-MX', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-gray/10 rounded-full">
                <FiUsers className="h-6 w-6 text-blue-gray" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Usuarios Totales</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats?.userCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-gray/10 rounded-full">
                <FiDollarSign className="h-6 w-6 text-blue-gray" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Ingresos Totales</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  }).format(stats?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-gray/10 rounded-full">
                <FiShoppingBag className="h-6 w-6 text-blue-gray" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pedidos Completados</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats?.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-gray/10 rounded-full">
                <FiBox className="h-6 w-6 text-blue-gray" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Productos Activos</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats?.activeProducts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Ingresos Mensuales</h2>
              <div className="flex gap-2">
                {[7, 30, 365].map(days => (
                  <button
                    key={days}
                    onClick={() => setSelectedPeriod(days)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedPeriod === days
                        ? 'bg-blue-gray text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {days === 7 ? '7 días' : days === 30 ? '30 días' : '1 año'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.revenueData
                    .filter(entry => {
                      const date = new Date(entry.date)
                      const daysAgo = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
                      return daysAgo <= selectedPeriod
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(entry => (
                      <tr key={entry.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN'
                          }).format(entry.total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Gestión de Productos</h2>
              <button
                onClick={() => {
                  setEditingProduct(null)
                  setShowProductForm(true)
                  setUploadedImages([])
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-gray hover:bg-blue-gray/90"
              >
                <FiPlus className="mr-2 h-5 w-5" />
                Nuevo Producto
              </button>
            </div>

            {showProductForm && (
              <form onSubmit={handleSubmit} className="mb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      defaultValue={editingProduct?.name}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Categoría
                    </label>
                    <select
                      name="category"
                      id="category"
                      required
                      defaultValue={editingProduct?.category}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                    >
                      <option value="">Seleccionar categoría</option>
                      <option value="clothing">Ropa</option>
                      <option value="shoes">Zapatos</option>
                      <option value="accessories">Accesorios</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Precio
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      step="0.01"
                      required
                      defaultValue={editingProduct?.price}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                    />
                  </div>

                  <div>
                    <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">
                      Cantidad en Stock
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      id="stock_quantity"
                      min="0"
                      required
                      defaultValue={editingProduct?.stock_quantity}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                    />
                  </div>

                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                      Talla (opcional)
                    </label>
                    <input
                      type="text"
                      name="size"
                      id="size"
                      defaultValue={editingProduct?.size || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    required
                    defaultValue={editingProduct?.description}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-gray focus:ring-blue-gray"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Imágenes del Producto
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                        >
                          <FiTrash2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                    {uploadedImages.length < 5 && (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer text-center p-4"
                        >
                          <FiPlus className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm font-medium text-gray-600">
                            Agregar imagen
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Formatos aceptados: JPG, PNG. Máximo 5 imágenes.
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false)
                      setEditingProduct(null)
                      setUploadedImages([])
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addProduct.isPending || updateProduct.isPending}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-gray hover:bg-blue-gray/90 disabled:opacity-50"
                  >
                    {addProduct.isPending || updateProduct.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Guardando...
                      </div>
                    ) : (
                      <>
                        {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map(product => (
                <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.size && (
                        <span className="text-sm text-gray-500">
                          Talla: {product.size}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock_quantity}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowProductForm(true)
                            setUploadedImages(product.images)
                          }}
                          className="p-2 text-blue-gray hover:text-dark transition-colors"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                              deleteProduct.mutate(product.id)
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}