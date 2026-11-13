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

// Portrait gets a narrower box so the whole frame fits on a laptop screen.
const WIDTH_CLASS = { portrait: 'max-w-[26rem]', square: 'max-w-[30rem]', landscape: 'max-w-[38rem]' }
const ASPECT_CLASS = { portrait: 'aspect-[3/4]', square: 'aspect-square', landscape: 'aspect-[4/3]' }

const WebcamCapture = ({ ref, onCapture, countdown, filterCss, disabled, onUseUpload, aspect = 'portrait' }) => {
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
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
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
    <div className={`relative mx-auto w-full ${WIDTH_CLASS[aspect] ?? WIDTH_CLASS.portrait}`}>
      <div className="relative overflow-hidden rounded-3xl bg-surface p-2 shadow-2xl border border-line">
        <div className={`relative w-full overflow-hidden rounded-2xl bg-paper-deep ${ASPECT_CLASS[aspect] ?? ASPECT_CLASS.portrait}`}>
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
            <div className="absolute inset-0 flex items-center justify-center text-ink-soft">
              <Camera className="w-10 h-10 animate-pulse" aria-label="Starting camera" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <CameraOff className="w-10 h-10 text-ink-soft" />
              <div>
                <p className="text-lg font-medium text-ink">{error.title}</p>
                <p className="mt-1 text-sm text-ink-soft max-w-sm">{error.body}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setAttempt((a) => a + 1)}
                  className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow transition"
                >
                  <RotateCcw className="w-4 h-4" /> Try again
                </button>
                <button
                  onClick={onUseUpload}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition"
                >
                  <Upload className="w-4 h-4" /> Upload photos
                </button>
              </div>
            </div>
          )}

          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20" aria-live="assertive">
              <div key={countdown} className="font-header text-8xl md:text-9xl font-bold text-white drop-shadow-2xl animate-pulse">
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
              className="w-20 h-20 bg-surface rounded-full shadow-xl border-4 border-line hover:border-gold hover:scale-105 transition-all duration-300 flex items-center justify-center group disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
              aria-label="Take photo"
            >
              <div className="w-13 h-13 bg-accent rounded-full flex items-center justify-center group-hover:bg-accent-strong transition-all duration-300">
                <Camera className="w-7 h-7 text-on-accent" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebcamCapture
