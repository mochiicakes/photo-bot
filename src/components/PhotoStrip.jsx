import React from 'react'

const PhotoStrip = ({ photos }) => {
  if (photos.length === 0) return null

  return (
    <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded shadow-lg">
      <div className="flex flex-col gap-2">
        {photos.map((src, i) => (
          <div key={i} className="w-48 h-64 overflow-hidden rounded border">
            <img
              src={src}
              alt={`strip-photo-${i}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PhotoStrip
