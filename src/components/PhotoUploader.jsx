import { useRef, useState } from 'react'
import { Upload, X, Plus } from 'lucide-react'

const MAX_DIMENSION = 1600

// Downscale big uploads so they fit comfortably in sessionStorage and render fast.
const fileToDataUrl = (file) =>
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
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}`))
    }
    img.src = url
  })

const PhotoUploader = ({ onAdd, onRemove, photos, targetCount }) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const remainingSlots = targetCount - photos.length

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
      const results = await Promise.allSettled(imageFiles.slice(0, remainingSlots).map(fileToDataUrl))
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
        <div className="inline-flex items-center gap-2 bg-white dark:bg-stone-900 px-6 py-3 rounded-full shadow-lg border border-stone-200 dark:border-stone-700">
          <span className="text-stone-600 dark:text-stone-400 font-medium">
            {photos.length} of {targetCount} photos uploaded
          </span>
          <div className="flex gap-1">
            {Array.from({ length: targetCount }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < photos.length ? 'bg-green-500' : 'bg-stone-200 dark:bg-stone-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-xl border-2 border-stone-200 dark:border-stone-700 shadow-md"
              />
              <button
                onClick={() => onRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow transition-opacity duration-200 hover:bg-red-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
            </div>
          ))}

          {Array.from({ length: remainingSlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-full h-32 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl flex items-center justify-center bg-stone-50 dark:bg-stone-800"
            >
              <Plus className="w-8 h-8 text-stone-400 dark:text-stone-500" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-center text-sm text-amber-700 dark:text-amber-400">
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
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-stone-300 dark:border-stone-600 bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 hover:border-stone-400 dark:hover:border-stone-500'
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
          <Upload className="w-12 h-12 text-stone-400 dark:text-stone-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-stone-600 dark:text-stone-400 mb-2">
            {busy
              ? 'Preparing photos…'
              : photos.length === 0
                ? `Upload your photos (${targetCount} max)`
                : `Add more photos (${remainingSlots} remaining)`}
          </p>
          <p className="text-sm text-stone-500">Tap to choose, or drag and drop images here</p>

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
        <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="text-green-600 dark:text-green-400 font-medium">
            All {targetCount} photos uploaded! Ready to customize.
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUploader
