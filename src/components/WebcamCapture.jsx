import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Camera, CameraOff, FlipHorizontal2, RotateCcw, SwitchCamera, Upload } from 'lucide-react'
import FilterLayer from './FilterLayer'
import { createBeautyRenderer, fitSize } from '../lib/beauty'

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

// Live quality tiers (processing size + smoothing samples). We step down when frames lag.
const QUALITY_TIERS = [
  { maxSide: 1280, rings: 4 },
  { maxSide: 960, rings: 3 },
  { maxSide: 720, rings: 2 },
]
const WARMUP_FRAMES = 45

const overlayButtonClass =
  'w-10 h-10 rounded-full flex items-center justify-center bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-40'

const WebcamCapture = ({
  ref,
  onCapture,
  countdown,
  filter,
  strength = 1,
  beauty,
  mirror = true,
  onMirrorChange,
  disabled,
  onUseUpload,
  aspect = 'portrait',
}) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const liveRef = useRef(null) // beauty output (WebGL), shown under the filter
  const baseRef = useRef(null) // 2D copy of it, shown unfiltered under the filter strength fade
  const rendererRef = useRef(null)
  const settingsRef = useRef({ beauty, strength })
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [facing, setFacing] = useState('user')
  const [canSwitch, setCanSwitch] = useState(false)

  useImperativeHandle(ref, () => ({
    // Resolves to a JPEG Blob of the current frame, flipped only if the preview is mirrored.
    capture: () =>
      new Promise((resolve) => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || !video.videoWidth) return resolve(null)
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        if (mirror) {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0)
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      }),
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
      .getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then(async (s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setStatus('ready')
        // Devices are only fully listed once permission is granted.
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [])
        if (active) setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1)
      })
      .catch((err) => {
        if (!active) return
        setStatus(err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'denied' : 'unavailable')
      })

    // Always release the camera when leaving the page or switching cameras.
    return () => {
      active = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [attempt, facing])

  const switchCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    // Selfies read naturally mirrored; the back camera shouldn't be.
    onMirrorChange?.(next === 'user')
  }

  useEffect(() => {
    settingsRef.current = { beauty, strength }
  }, [beauty, strength])

  // Live pipeline: each camera frame -> beauty shader -> canvas (+ an unfiltered copy).
  useEffect(() => {
    if (status !== 'ready') return
    const video = videoRef.current
    const live = liveRef.current
    const base = baseRef.current
    if (rendererRef.current === null) {
      try {
        rendererRef.current = createBeautyRenderer(live) ?? false
      } catch {
        rendererRef.current = false
      }
    }
    const renderer = rendererRef.current
    const liveCtx = renderer ? null : live.getContext('2d') // no WebGL: plain copy, no beauty
    const baseCtx = base.getContext('2d')
    const useVideoCallback = 'requestVideoFrameCallback' in video
    const frameRate = video.srcObject?.getVideoTracks?.()[0]?.getSettings?.().frameRate || 30
    const expected = 1000 / frameRate
    let stopped = false
    let handle
    let tier = 0
    let frames = 0
    let avgInterval = expected
    let last = 0

    const draw = (now = performance.now()) => {
      if (stopped) return
      if (video.videoWidth) {
        // Step quality down when frames arrive much slower than the camera delivers them.
        if (last) avgInterval = avgInterval * 0.9 + (now - last) * 0.1
        last = now
        if (++frames > WARMUP_FRAMES && avgInterval > expected * 1.5 && tier < QUALITY_TIERS.length - 1) {
          tier++
          frames = 0
          avgInterval = expected
        }

        const { maxSide, rings } = QUALITY_TIERS[tier]
        const { width, height } = fitSize(video, maxSide)
        const { beauty: settings, strength: mix } = settingsRef.current
        if (renderer) {
          renderer.render(video, width, height, settings, rings)
        } else {
          if (live.width !== width) live.width = width
          if (live.height !== height) live.height = height
          liveCtx.drawImage(video, 0, 0, width, height)
        }
        if (mix < 1) {
          if (base.width !== width) base.width = width
          if (base.height !== height) base.height = height
          baseCtx.drawImage(live, 0, 0)
        }
      }
      handle = useVideoCallback ? video.requestVideoFrameCallback(draw) : requestAnimationFrame(draw)
    }
    draw()

    return () => {
      stopped = true
      if (useVideoCallback) video.cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
    }
  }, [status])

  const error = ERROR_COPY[status]
  const mediaClass = `absolute inset-0 w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`

  return (
    <div className={`relative mx-auto w-full ${WIDTH_CLASS[aspect] ?? WIDTH_CLASS.portrait}`}>
      <div className="relative overflow-hidden rounded-3xl bg-surface p-2 shadow-2xl border border-line">
        <div className={`relative w-full overflow-hidden rounded-2xl bg-paper-deep ${ASPECT_CLASS[aspect] ?? ASPECT_CLASS.portrait}`}>
          {/* Source only; what you see is the processed canvas. Kept rendered so it keeps decoding. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute w-px h-px opacity-0 pointer-events-none"
          />
          <FilterLayer
            filter={filter}
            strength={strength}
            base={<canvas ref={baseRef} className={mediaClass} />}
            className={`absolute inset-0 ${status === 'ready' ? '' : 'invisible'}`}
          >
            <canvas ref={liveRef} className={mediaClass} />
          </FilterLayer>
          <canvas ref={canvasRef} className="hidden" />

          {status === 'ready' && (
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {canSwitch && (
                <button onClick={switchCamera} disabled={disabled} className={overlayButtonClass} aria-label="Switch camera" title="Switch camera">
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => onMirrorChange?.(!mirror)}
                disabled={disabled}
                aria-pressed={mirror}
                aria-label={mirror ? 'Mirror on' : 'Mirror off'}
                title={mirror ? 'Mirror on' : 'Mirror off'}
                className={`${overlayButtonClass} ${mirror ? '' : 'ring-2 ring-white/70'}`}
              >
                <FlipHorizontal2 className="w-5 h-5" />
              </button>
            </div>
          )}

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
