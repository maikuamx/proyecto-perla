import jsPDF from 'jspdf'
import type { Order } from '../types/order'

export function generateOrderPDF(order: Order) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Add logo
  const logoWidth = 50
  const logoHeight = 20
  doc.addImage('/logo-black.png', 'PNG', (pageWidth - logoWidth) / 2, margin, logoWidth, logoHeight)

  // Add title
  doc.setFontSize(20)
  doc.text('Orden de Compra', pageWidth / 2, margin + logoHeight + 10, { align: 'center' })

  // Add order details
  doc.setFontSize(12)
  doc.text(`Pedido #${order.id.slice(0, 8)}`, margin, margin + logoHeight + 30)
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString('es-MX')}`, margin, margin + logoHeight + 40)
  doc.text(`Estado: ${getStatusLabel(order.status)}`, margin, margin + logoHeight + 50)

  // Add items table
  let y = margin + logoHeight + 70
  doc.setFontSize(14)
  doc.text('Productos:', margin, y)
  y += 10

  doc.setFontSize(12)
  order.items.forEach(item => {
    doc.text(`${item.quantity}x ${item.name}`, margin, y)
    doc.text(`$${item.price.toFixed(2)}`, pageWidth - margin - 30, y, { align: 'right' })
    y += 10
  })

  // Add total
  y += 10
  doc.setFontSize(14)
  doc.text('Total:', margin, y)
  doc.text(`$${order.total.toFixed(2)}`, pageWidth - margin - 30, y, { align: 'right' })

  // Add footer
  const footerY = doc.internal.pageSize.getHeight() - margin
  doc.setFontSize(10)
  doc.text('Sapphirus - Tienda de artículos Americanos', pageWidth / 2, footerY - 10, { align: 'center' })
  doc.text('Tel: +52 614 133 6763', pageWidth / 2, footerY, { align: 'center' })

  return doc
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  }
  return labels[status] || status
}