import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, RectangleHorizontal, RectangleVertical, RotateCcw, Square, Upload, X } from 'lucide-react'
import { usePhotoSession } from '../context/PhotoSessionContext'
import { ASPECTS, SCREEN_LIGHTS } from '../lib/options'
import BrandHeader from '../components/BrandHeader'
import PhotoUploader from '../components/PhotoUploader'
import WebcamCapture from '../components/WebcamCapture'
import Countdown from '../components/Countdown'
import PhotoCount from '../components/PhotoCount'
import FilterPicker from '../components/FilterPicker'
import PhotoThumb from '../components/PhotoThumb'
import { BeautySliders, StrengthSlider } from '../components/LookControls'
import ScreenLightPicker from '../components/ScreenLightPicker'
import Segmented from '../components/Segmented'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ASPECT_ICONS = { portrait: RectangleVertical, square: Square, landscape: RectangleHorizontal }

const enterFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {})
}
const exitFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
}

const PhotoCapturePage = () => {
  const navigate = useNavigate()
  const {
    photos,
    targetCount,
    filter,
    filterStrength,
    smooth,
    brighten,
    aspect,
    mirror,
    update,
    addPhotos,
    removePhoto,
    clearPhotos,
    setTargetCount,
  } = usePhotoSession()
  const beauty = useMemo(() => ({ smooth, brighten }), [smooth, brighten])
  const webcamRef = useRef(null)
  const cancelRef = useRef(false)
  const mountedRef = useRef(true)
  const [mode, setMode] = useState('camera')
  const [lightId, setLightId] = useState('off')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [flashActive, setFlashActive] = useState(false)

  // Stop any running capture sequence (and leave fullscreen) when leaving the page.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelRef.current = true
      exitFullscreen()
    }
  }, [])

  const isFull = photos.length >= targetCount
  const light = SCREEN_LIGHTS.find((l) => l.id === lightId)
  const glowing = mode === 'camera' && Boolean(light?.color)

  const changeLight = (id) => {
    if (lightId === 'off' && id !== 'off') enterFullscreen()
    if (id === 'off') exitFullscreen()
    setLightId(id)
  }

  const switchMode = (next) => {
    if (next === 'upload') changeLight('off')
    setMode(next)
  }

  const goToCustomize = (delay) =>
    setTimeout(() => {
      if (mountedRef.current) navigate('/customize')
    }, delay)

  const takeShot = async () => {
    const shot = webcamRef.current?.capture()
    if (!shot) return null
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 250)
    return shot
  }

  // Without a timer: one photo per click. With a timer: count down and fill every remaining slot.
  const handleCapture = async () => {
    if (isCapturing || isFull) return
    const shots = timerSeconds > 0 ? targetCount - photos.length : 1
    cancelRef.current = false
    setIsCapturing(true)
    let taken = 0

    for (let i = 0; i < shots; i++) {
      for (let t = timerSeconds; t > 0; t--) {
        if (cancelRef.current) break
        setCountdown(t)
        await wait(1000)
      }
      setCountdown(null)
      if (cancelRef.current) break

      const blob = await takeShot()
      if (blob) {
        await addPhotos([blob])
        taken++
      }
      if (i < shots - 1) await wait(800)
    }

    setCountdown(null)
    setIsCapturing(false)
    if (!cancelRef.current && photos.length + taken >= targetCount) goToCustomize(800)
  }

  const handleUpload = async (blobs) => {
    await addPhotos(blobs)
    if (photos.length + blobs.length >= targetCount) goToCustomize(600)
  }

  const thumbClass = { square: 'w-14 h-14', landscape: 'w-16 h-12' }[aspect] ?? 'w-12 h-16'

  return (
    <div className="min-h-screen">
      {/* Screen light: the whole screen glows to light the face. */}
      {glowing && (
        <div aria-hidden="true" className="fixed inset-0 z-30 transition-colors duration-500" style={{ backgroundColor: light.color }} />
      )}
      {glowing && (
        <button
          onClick={() => changeLight('off')}
          className="fixed top-4 right-4 z-[45] inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#3a2a20] shadow-lg backdrop-blur hover:bg-white"
        >
          <X className="w-4 h-4" /> Turn off light
        </button>
      )}
      {flashActive && <div className="fixed inset-0 z-50 bg-white opacity-90 pointer-events-none" />}

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <BrandHeader />

        <div className="flex justify-center mb-8">
          <Segmented
            label="Capture mode"
            value={mode}
            onChange={switchMode}
            disabled={isCapturing}
            options={[
              { id: 'camera', label: <>Camera <span className="hidden sm:inline">カメラ</span></>, icon: Camera },
              { id: 'upload', label: <>Upload <span className="hidden sm:inline">アップロード</span></>, icon: Upload },
            ]}
          />
        </div>

        {mode === 'upload' ? (
          <>
            <PhotoUploader
              photos={photos}
              targetCount={targetCount}
              aspect={aspect}
              onAdd={handleUpload}
              onRemove={removePhoto}
            />
            {photos.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => navigate('/customize')}
                  className="btn-primary px-8 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105"
                >
                  Customize →
                </button>
              </div>
            )}
          </>
        ) : (
          <section className={`relative ${glowing ? 'z-40' : ''}`}>
            <div className="mb-6">
              <WebcamCapture
                ref={webcamRef}
                aspect={aspect}
                countdown={countdown}
                filter={filter}
                strength={filterStrength}
                beauty={beauty}
                mirror={mirror}
                onMirrorChange={(value) => update({ mirror: value })}
                disabled={isCapturing || isFull}
                onCapture={handleCapture}
                onUseUpload={() => switchMode('upload')}
              />
            </div>

            <div className="panel max-w-2xl mx-auto mb-6 space-y-5">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  Screen light <span className="text-gold">ライト</span>
                </span>
                <ScreenLightPicker value={lightId} onChange={changeLight} disabled={isCapturing} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  Photo shape <span className="text-gold">比率</span>
                </span>
                <Segmented
                  size="sm"
                  label="Photo shape"
                  value={aspect}
                  onChange={(id) => update({ aspect: id })}
                  disabled={isCapturing}
                  options={ASPECTS.map((a) => ({ id: a.id, label: a.label, icon: ASPECT_ICONS[a.id] }))}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  Filter <span className="text-gold">フィルター</span>
                </span>
                <FilterPicker value={filter} onChange={(id) => update({ filter: id })} disabled={isCapturing} />
                <StrengthSlider filter={filter} value={filterStrength} onChange={(v) => update({ filterStrength: v })} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  Beauty <span className="text-gold">美顔</span>
                </span>
                <BeautySliders smooth={smooth} brighten={brighten} onChange={update} />
              </div>
            </div>

            {/* Captured shots; tap × to retake a single one */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex gap-2 md:gap-3" aria-label={`${photos.length} of ${targetCount} photos taken`}>
                {Array.from({ length: targetCount }).map((_, i) =>
                  photos[i] ? (
                    <div key={i} className="relative">
                      <PhotoThumb
                        src={photos[i]}
                        filter={filter}
                        strength={filterStrength}
                        beauty={beauty}
                        alt={`Photo ${i + 1}`}
                        className={`${thumbClass} rounded-lg shadow border border-line`}
                      />
                      {!isCapturing && (
                        <button
                          onClick={() => removePhoto(i)}
                          aria-label={`Retake photo ${i + 1}`}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-on-accent flex items-center justify-center shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div key={i} className={`${thumbClass} rounded-lg border-2 border-dashed border-gold/50 bg-surface/40`} />
                  ),
                )}
              </div>
              <span className={`text-sm ${glowing ? 'rounded-full bg-white/70 px-3 py-0.5 text-[#3a2a20]' : 'text-ink-soft'}`}>
                {photos.length} of {targetCount} photos
                {timerSeconds > 0 && !isFull && ' · timer fills the rest automatically'}
              </span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
              <Countdown seconds={timerSeconds} onChange={setTimerSeconds} disabled={isCapturing} />
              <PhotoCount targetCount={targetCount} setTargetCount={setTargetCount} disabled={isCapturing} />
              {isCapturing ? (
                <button
                  onClick={() => {
                    cancelRef.current = true
                  }}
                  className="btn-secondary px-6 py-3 rounded-full shadow-lg font-medium"
                >
                  Cancel
                </button>
              ) : (
                photos.length > 0 && (
                  <button
                    onClick={clearPhotos}
                    className="btn-secondary inline-flex items-center gap-2 px-6 py-3 rounded-full shadow-lg font-medium transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4" /> Retake all
                  </button>
                )
              )}
              <button
                onClick={() => navigate('/customize')}
                disabled={photos.length === 0 || isCapturing}
                className="btn-primary px-8 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Customize →
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default PhotoCapturePage
