import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Camera } from 'lucide-react'

const WebcamCapture = forwardRef(({ onClickCapture, countdownTime }, ref) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)

  useImperativeHandle(ref, () => ({
    captureElement: () => videoRef.current,
    capturePhoto: () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const video = videoRef.current

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        return canvas.toDataURL('image/png')
      }
      return null
    }
  }))

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

  return (
        <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 p-2 shadow-2xl border border-stone-200 dark:border-stone-700">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto rounded-2xl"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Countdown overlay on video */}
        {countdownTime && countdownTime > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-2xl">
            <div className="text-9xl font-bold text-white drop-shadow-2xl animate-pulse">
              {countdownTime}
            </div>
          </div>
        )}

        {/* Elegant capture button */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            onClick={onClickCapture}
            className="w-20 h-20 bg-white dark:bg-stone-900 rounded-full shadow-xl border-4 border-stone-200 dark:border-stone-600 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
            aria-label="Capture Photo"
          >
            <div className="w-13 h-13 bg-gradient-to-br from-stone-600 to-stone-800 dark:from-stone-300 dark:to-stone-100 rounded-full flex items-center justify-center group-hover:from-stone-700 group-hover:to-stone-900 dark:group-hover:from-stone-200 dark:group-hover:to-stone-50 transition-all duration-300">
              <Camera className="w-7 h-7 text-white dark:text-stone-900" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
})

export default WebcamCapture
