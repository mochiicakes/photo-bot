import { useRef, useState } from "react"
import PhotoUploader from "./PhotoUploader"
import WebcamCapture from "./WebcamCapture"
import Countdown from "./Countdown"

const PhotoCapturePage = ({ photos, setPhotos, onNavigate }) => {
    const webcamRef = useRef(null)
    const handleUpload = (files) => {
    const newPhotos = [...photos, ...files]
    if (newPhotos.length > 4) {
        alert('You can only upload up to 4 photos.')
        return
    }
    setPhotos(newPhotos)
    }

    const handleCapture = (image) => {
    if (photos.length >= 4) {
        alert('You can only have up to 4 photos.')
        return
    }
    setPhotos(prev => [...prev, image])
    }

    const handleAutoCapture = () => {
    if (webcamRef.current) {
        webcamRef.current.capture()
    }
    }

    const clearPhotos = () => {
        setPhotos([])
    }

    const goToCustomization = () => {
        if (photos.length === 0) {
        alert('Please add some photos first!')
        return
        }
        onNavigate('customize')
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-7xl font-bold text-purple-600 mb-4" style={{fontFamily: 'Just Another Hand, cursive'}}>
          📸 Photo-Bot
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto" style={{fontFamily: 'Just Another Hand, cursive'}}>
          Welcome! Add photos or use your camera to create your own personalized photostrip
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <PhotoUploader onUpload={handleUpload} />
            <WebcamCapture ref={webcamRef} onCapture={handleCapture} />
            <Countdown seconds={5} onTimerComplete={handleAutoCapture} />

            {/* Controls */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-center text-gray-800">📊 Controls</h3>
              <div className="flex flex-col gap-3">
                <div className="text-center text-lg text-gray-600">
                  Photos: <span className="font-bold text-purple-600">{photos.length}</span>
                </div>
                <button
                  onClick={clearPhotos}
                  disabled={photos.length === 0}
                  className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
                    photos.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  🗑️ Clear All Photos
                </button>
                <button
                  onClick={goToCustomization}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-semibold text-lg"
                >
                  ✨ Create Photo Strip
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Photo Preview */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">🖼️ Photo Preview</h3>
            {photos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-lg">No photos yet. Add some to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`photo-${i}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow" 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoCapturePage