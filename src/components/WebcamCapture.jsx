import React, { useRef, useState } from 'react'
import Webcam from 'react-webcam'

const WebcamCapture = ({ onCapture }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCapturing(true)
    } catch (err) {
      console.error('Error accessing camera:', err)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      const imageSrc = canvas.toDataURL('image/png')
      onCapture(imageSrc)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">📷 Camera</h3>
        {isCapturing ? (
          <div className="flex flex-col items-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded-lg mb-4 max-w-full border-2 border-gray-300"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
              >
                📸 Capture
              </button>
              <button
                onClick={stopCamera}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold text-lg"
              >
                ❌ Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={startCamera}
              className="bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
            >
              📹 Use Camera
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebcamCapture
