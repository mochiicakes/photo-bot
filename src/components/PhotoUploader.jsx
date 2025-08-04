import React from 'react'

const PhotoUploader = ({ onUpload }) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const previews = files.map(file => URL.createObjectURL(file))
    onUpload(previews)
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">📁 Upload Images</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        />
        <p className="text-sm text-gray-500 mt-2 text-center">Select multiple images to add to your photo strip</p>
      </div>
    </div>
  )
}

export default PhotoUploader
