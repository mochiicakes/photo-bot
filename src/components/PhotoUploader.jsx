import React, { useRef, useState } from 'react'
import { Upload, X, Plus } from 'lucide-react'

const PhotoUploader = ({ onUpload, photos = [], targetCount = 4 }) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Please select image files only.')
      return
    }

    // Check if adding these files would exceed the limit
    if (photos.length + imageFiles.length > targetCount) {
      alert(`You can only upload up to ${targetCount} photos. You currently have ${photos.length} photos.`)
      return
    }

    const readers = imageFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readers).then(onUpload)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removePhoto = (indexToRemove) => {
    const newPhotos = photos.filter((_, index) => index !== indexToRemove)
    onUpload(newPhotos)
  }

  const remainingSlots = targetCount - photos.length

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-stone-900 px-6 py-3 rounded-full shadow-lg border border-stone-200 dark:border-stone-700">
          <span className="text-stone-600 dark:text-stone-400 font-medium">
            {photos.length} of {targetCount} photos uploaded
          </span>
          <div className="flex gap-1">
            {Array.from({ length: targetCount }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < photos.length
                    ? 'bg-green-500'
                    : 'bg-stone-200 dark:bg-stone-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Photo thumbnails grid */}
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
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
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

      {/* Upload area */}
      {photos.length < targetCount && (
        <div
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-stone-300 dark:border-stone-600 bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 hover:border-stone-400 dark:hover:border-stone-500'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-stone-400 dark:text-stone-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-stone-600 dark:text-stone-400 mb-2">
            {photos.length === 0
              ? `Upload Your Photos (${targetCount} max)`
              : `Add More Photos (${remainingSlots} remaining)`
            }
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-500">
            Click here or drag and drop your images
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {photos.length === targetCount && (
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