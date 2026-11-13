import { useRef, useState } from 'react'
import { Upload, X, Plus } from 'lucide-react'

const MAX_DIMENSION = 1600

// Downscale big uploads so they store compactly and render fast.
const fileToBlob = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`Could not read ${file.name}`))), 'image/jpeg', 0.9)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}`))
    }
    img.src = url
  })

const PhotoUploader = ({ onAdd, onRemove, photos, targetCount, aspect = 'portrait' }) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const remainingSlots = targetCount - photos.length
  const shapeClass = { square: 'aspect-square', landscape: 'aspect-[4/3]' }[aspect] ?? 'aspect-[3/4]'

  const handleFiles = async (files) => {
    setError('')
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      setError('Please choose image files (JPG, PNG, HEIC, etc.).')
      return
    }
    if (imageFiles.length > remainingSlots) {
      setError(
        `You can add ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'}. Only the first ${remainingSlots} were added.`,
      )
    }

    setBusy(true)
    try {
      const results = await Promise.allSettled(imageFiles.slice(0, remainingSlots).map(fileToBlob))
      const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      if (ok.length < results.length) setError('Some photos couldn’t be read by your browser and were skipped.')
      if (ok.length) onAdd(ok)
    } finally {
      setBusy(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-surface px-6 py-3 rounded-full shadow-lg border border-line">
          <span className="text-ink-soft font-medium">
            {photos.length} of {targetCount} photos uploaded
          </span>
          <div className="flex gap-1">
            {Array.from({ length: targetCount }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < photos.length ? 'bg-accent' : 'bg-line'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className={`w-full object-cover rounded-xl border-2 border-line shadow-md ${shapeClass}`}
              />
              <button
                onClick={() => onRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -top-2 -right-2 w-7 h-7 bg-accent text-on-accent rounded-full flex items-center justify-center shadow transition-opacity duration-200 hover:bg-accent-strong opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
            </div>
          ))}

          {Array.from({ length: remainingSlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className={`w-full border-2 border-dashed border-line rounded-xl flex items-center justify-center bg-surface/60 ${shapeClass}`}
            >
              <Plus className="w-8 h-8 text-gold" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-center text-sm text-accent">
          {error}
        </p>
      )}

      {remainingSlots > 0 && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose photos to upload"
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? 'border-accent bg-accent/10'
              : 'border-line bg-surface/70 hover:border-gold'
          } ${busy ? 'opacity-60 pointer-events-none' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gold mx-auto mb-4" />
          <p className="text-lg font-medium text-ink mb-2">
            {busy
              ? 'Preparing photos…'
              : photos.length === 0
                ? `Upload your photos (${targetCount} max)`
                : `Add more photos (${remainingSlots} remaining)`}
          </p>
          <p className="text-sm text-ink-soft">Tap to choose, or drag and drop images here</p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
        </div>
      )}

      {remainingSlots === 0 && (
        <div className="text-center p-6 bg-accent/10 rounded-2xl border border-accent/30">
          <div className="text-accent font-medium">
            All {targetCount} photos uploaded! Ready to customize.
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUploader
