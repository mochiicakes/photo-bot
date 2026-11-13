import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Camera, CameraOff, RotateCcw, Upload } from 'lucide-react'

const ERROR_COPY = {
  denied: {
    title: 'Camera access is blocked',
    body: 'Allow camera access in your browser’s site settings, then try again. Or upload photos instead.',
  },
  unavailable: {
    title: 'No camera found',
    body: 'We couldn’t find a camera on this device, or it’s in use by another app. You can upload photos instead.',
  },
}

const WebcamCapture = ({ ref, onCapture, countdown, filterCss, disabled, onUseUpload }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useImperativeHandle(ref, () => ({
    // Returns a mirrored JPEG of the current frame (matches the mirrored preview), or null.
    capture: () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !video.videoWidth) return null
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0)
      return canvas.toDataURL('image/jpeg', 0.92)
    },
  }))

  useEffect(() => {
    let active = true
    let stream = null

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }

    setStatus('loading')
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setStatus('ready')
      })
      .catch((err) => {
        if (!active) return
        setStatus(err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'denied' : 'unavailable')
      })

    // Always release the camera when leaving the page.
    return () => {
      active = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [attempt])

  const error = ERROR_COPY[status]

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 p-2 shadow-2xl border border-stone-200 dark:border-stone-700">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-300 dark:bg-stone-950">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${status === 'ready' ? '' : 'invisible'}`}
            style={{ filter: filterCss }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center text-stone-500 dark:text-stone-400">
              <Camera className="w-10 h-10 animate-pulse" aria-label="Starting camera" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <CameraOff className="w-10 h-10 text-stone-500 dark:text-stone-400" />
              <div>
                <p className="text-lg font-medium text-stone-800 dark:text-stone-100">{error.title}</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 max-w-sm">{error.body}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setAttempt((a) => a + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 shadow hover:shadow-lg transition"
                >
                  <RotateCcw className="w-4 h-4" /> Try again
                </button>
                <button
                  onClick={onUseUpload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow hover:shadow-lg transition"
                >
                  <Upload className="w-4 h-4" /> Upload photos
                </button>
              </div>
            </div>
          )}

          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20" aria-live="assertive">
              <div key={countdown} className="text-8xl md:text-9xl font-bold text-white drop-shadow-2xl animate-pulse">
                {countdown}
              </div>
            </div>
          )}
        </div>

        {status === 'ready' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              onClick={onCapture}
              disabled={disabled}
              className="w-20 h-20 bg-white dark:bg-stone-900 rounded-full shadow-xl border-4 border-stone-200 dark:border-stone-600 hover:scale-105 transition-all duration-300 flex items-center justify-center group disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
              aria-label="Take photo"
            >
              <div className="w-13 h-13 bg-gradient-to-br from-stone-600 to-stone-800 dark:from-stone-300 dark:to-stone-100 rounded-full flex items-center justify-center group-hover:from-stone-700 group-hover:to-stone-900 dark:group-hover:from-stone-200 dark:group-hover:to-stone-50 transition-all duration-300">
                <Camera className="w-7 h-7 text-white dark:text-stone-900" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebcamCapture
