import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, X } from 'lucide-react'
import { usePhotoSession } from '../context/PhotoSessionContext'
import { filterToCss } from '../lib/filters'
import ThemeToggle from '../components/ThemeToggle'
import PhotoUploader from '../components/PhotoUploader'
import WebcamCapture from '../components/WebcamCapture'
import Countdown from '../components/Countdown'
import PhotoCount from '../components/PhotoCount'
import FilterPicker from '../components/FilterPicker'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const modeButtonClass = (active) =>
  `px-6 md:px-8 py-3 md:py-4 rounded-full font-medium transition-all duration-300 ${
    active
      ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-xl'
      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:shadow-lg'
  }`

const PhotoCapturePage = () => {
  const navigate = useNavigate()
  const { photos, targetCount, filter, update, addPhotos, removePhoto, clearPhotos, setTargetCount } = usePhotoSession()
  const webcamRef = useRef(null)
  const cancelRef = useRef(false)
  const mountedRef = useRef(true)
  const [mode, setMode] = useState('camera')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [flashActive, setFlashActive] = useState(false)

  // Stop any running capture sequence when leaving the page.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelRef.current = true
    }
  }, [])

  const isFull = photos.length >= targetCount

  const goToCustomize = (delay) =>
    setTimeout(() => {
      if (mountedRef.current) navigate('/customize')
    }, delay)

  const takeShot = () => {
    const img = webcamRef.current?.capture()
    if (img) {
      setFlashActive(true)
      setTimeout(() => setFlashActive(false), 250)
    }
    return img
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

      const img = takeShot()
      if (img) {
        addPhotos([img])
        taken++
      }
      if (i < shots - 1) await wait(800)
    }

    setCountdown(null)
    setIsCapturing(false)
    if (!cancelRef.current && photos.length + taken >= targetCount) goToCustomize(800)
  }

  const cancelSequence = () => {
    cancelRef.current = true
  }

  const handleUpload = (newPhotos) => {
    addPhotos(newPhotos)
    if (photos.length + newPhotos.length >= targetCount) goToCustomize(600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 transition-colors duration-500">
      {flashActive && <div className="fixed inset-0 z-50 bg-white opacity-90 pointer-events-none" />}

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <header className="flex justify-between items-start gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-wide text-stone-800 dark:text-stone-100 mb-1 md:mb-2">
              PHOTO
            </h1>
            <p className="font-header text-lg md:text-2xl font-light text-stone-600 dark:text-stone-400 tracking-widest">
              STUDIO
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8 md:mb-12">
          <button onClick={() => setMode('camera')} className={modeButtonClass(mode === 'camera')} disabled={isCapturing}>
            Camera
          </button>
          <button onClick={() => setMode('upload')} className={modeButtonClass(mode === 'upload')} disabled={isCapturing}>
            Upload Photos
          </button>
        </div>

        <div className="flex justify-center mb-6">
          {mode === 'camera' ? (
            <WebcamCapture
              ref={webcamRef}
              countdown={countdown}
              filterCss={filterToCss(filter)}
              disabled={isCapturing || isFull}
              onCapture={handleCapture}
              onUseUpload={() => setMode('upload')}
            />
          ) : (
            <PhotoUploader photos={photos} targetCount={targetCount} onAdd={handleUpload} onRemove={removePhoto} />
          )}
        </div>

        {mode === 'camera' && (
          <>
            <div className="mb-6">
              <FilterPicker value={filter} onChange={(id) => update({ filter: id })} disabled={isCapturing} />
            </div>

            {/* Captured shots; tap × to retake a single one */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex gap-2 md:gap-3" aria-label={`${photos.length} of ${targetCount} photos taken`}>
                {Array.from({ length: targetCount }).map((_, i) =>
                  photos[i] ? (
                    <div key={i} className="relative">
                      <img
                        src={photos[i]}
                        alt={`Photo ${i + 1}`}
                        className="w-16 h-12 md:w-20 md:h-15 object-cover rounded-lg shadow border border-stone-200 dark:border-stone-700"
                        style={{ filter: filterToCss(filter) }}
                      />
                      {!isCapturing && (
                        <button
                          onClick={() => removePhoto(i)}
                          aria-label={`Retake photo ${i + 1}`}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 flex items-center justify-center shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="w-16 h-12 md:w-20 md:h-15 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600"
                    />
                  ),
                )}
              </div>
              <span className="text-sm text-stone-600 dark:text-stone-400">
                {photos.length} of {targetCount} photos
                {timerSeconds > 0 && !isFull && ' · timer fills the rest automatically'}
              </span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
              <Countdown seconds={timerSeconds} onChange={setTimerSeconds} disabled={isCapturing} />
              <PhotoCount targetCount={targetCount} setTargetCount={setTargetCount} disabled={isCapturing} />
              {isCapturing ? (
                <button
                  onClick={cancelSequence}
                  className="px-6 py-3 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 font-medium"
                >
                  Cancel
                </button>
              ) : (
                photos.length > 0 && (
                  <button
                    onClick={clearPhotos}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 font-medium transition-all duration-300 hover:shadow-xl"
                  >
                    <RotateCcw className="w-4 h-4" /> Retake all
                  </button>
                )
              )}
              <button
                onClick={() => navigate('/customize')}
                disabled={photos.length === 0 || isCapturing}
                className="px-8 py-3 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-full shadow-lg font-medium transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Customize →
              </button>
            </div>
          </>
        )}

        {mode === 'upload' && photos.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/customize')}
              className="px-8 py-3 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-full shadow-lg font-medium transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              Customize →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default PhotoCapturePage
