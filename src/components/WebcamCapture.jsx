import React, { useRef, useState, useEffect } from 'react'
import { Camera } from 'lucide-react'

const WebcamCapture = ({ onCapture }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
        setStream(mediaStream)
      } catch (err) {
        console.error('Error accessing camera:', err)
        alert('Could not access camera. Please check permissions.')
      }
    }

    init()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

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

  return (
    <div className="w-full max-w-xl rounded-xl border border-black dark:border-white bg-gray-100 dark:bg-zinc-900 p-4 transition-all">
      <div className="flex flex-col items-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="rounded-md mb-4 w-full h-auto border border-black dark:border-white"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <button
          onClick={capturePhoto}
          className="w-14 h-14 flex items-center justify-center rounded-full border border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
          aria-label="Capture Photo"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default WebcamCapture
