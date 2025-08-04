import React from 'react'

const PhotoUploader = ({ onUpload }) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const previews = files.map(file => URL.createObjectURL(file))
    onUpload(previews)
  }

  return (
    <div className="w-full max-w-xl rounded-xl border border-black dark:border-white bg-gray-100 dark:bg-zinc-900 p-4 transition-all">
      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full p-3 text-center border border-black dark:border-white rounded-lg bg-white dark:bg-black text-black dark:text-white font-body cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-body text-center">
          Select up to 4 images to add to your photo strip
        </p>
      </div>
    </div>
  )
}

export default PhotoUploader
