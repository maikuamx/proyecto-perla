import { useEffect, useRef } from 'react'
import { FiX } from 'react-icons/fi'

interface ImageZoomProps {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageZoom({ src, alt, onClose }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onClose()
    }
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50"
      >
        <FiX className="h-6 w-6" />
      </button>

      <div className="relative max-w-3xl w-full bg-white rounded-lg overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
          draggable={false}
        />
      </div>
    </div>
  )
}