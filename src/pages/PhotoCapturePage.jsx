// PhotoCapturePage.jsx
import { useRef, useState, useEffect } from "react"
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from 'framer-motion'
import CustomizationPage from "./CustomizationPage"
import ThemeToggle from "../components/ThemeToggle"
import PhotoUploader from "../components/PhotoUploader"
import WebcamCapture from "../components/WebcamCapture"
import Countdown from "../components/Countdown"
import PhotoCount from "../components/PhotoCount"

const PhotoCapturePage = () => {
  const { isDark } = useTheme();
  const webcamRef = useRef(null)
  const countdownRef = useRef(null)
  const [photos, setPhotos] = useState([])
  const [mode, setMode] = useState("camera")
  const [targetCount, setTargetCount] = useState(4)
  const [countdownActive, setCountdownActive] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const [currentPage, setCurrentPage] = useState('capture')
  const [currentCountdown, setCurrentCountdown] = useState(null)

  const handleUpload = (files) => {
    if (Array.isArray(files) && typeof files[0] === 'string') {
      const newPhotos = [...photos, ...files]
      if (newPhotos.length > targetCount) {
        alert(`You can only upload up to ${targetCount} photos.`)
        return
      }
      setPhotos(newPhotos)
      if (newPhotos.length === targetCount) {
        setTimeout(() => setCurrentPage('customize'), 500)
      }
    } else {
      setPhotos(files)
    }
  }

  const triggerFlash = () => {
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 300)
  }

  const handleCapture = (image) => {
    if (photos.length >= 4) return
    const newPhotos = [...photos, image]
    setPhotos(newPhotos)
    
    if (newPhotos.length === targetCount) {
      setTimeout(() => setCurrentPage('customize'), 800)
    }
  }

  const handleAutoCapture = () => {
    if (webcamRef.current) {
      const img = webcamRef.current.capturePhoto()
      if (img) {
        triggerFlash()
        handleCapture(img)
      }
    }
  }

  const handleCountdownSequence = async () => {
    setCountdownActive(true)

    for (let i = 0; i < targetCount; i++) {
      if (photos.length + i >= 4) break

      await new Promise((resolve) => {
        const proceed = () => {
          setCurrentCountdown(null) // Clear countdown
          triggerFlash()
          handleAutoCapture()
          resolve()
        }

        if (countdownRef.current?.hasCountdown()) {
          // Show countdown on video
          const countdownSeconds = countdownRef.current.getCurrentTime?.() || 3
          let timeLeft = countdownSeconds

          const countdownInterval = setInterval(() => {
            setCurrentCountdown(timeLeft)
            timeLeft--

            if (timeLeft < 0) {
              clearInterval(countdownInterval)
              proceed()
            }
          }, 1000)

          setCurrentCountdown(countdownSeconds)
        } else {
          proceed()
        }
      })

      if (i < targetCount - 1) {
        await new Promise(res => setTimeout(res, 1000))
      }
    }

    setCountdownActive(false)
    setCurrentCountdown(null)
  }

  if (currentPage === 'customize') {
    return <CustomizationPage photos={photos} onNavigate={() => setCurrentPage('capture')} />
  }

  return (
    <div className={`min-h-screen transition-all duration-500`}>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 transition-all duration-500">

        {/* Flash overlay */}
        {flashActive && (
          <div className="fixed inset-0 z-50 bg-white opacity-90 pointer-events-none transition-opacity duration-300" />
        )}

        {/* Countdown overlay */}
        {countdownActive && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="text-8xl font-bold text-white drop-shadow-2xl animate-pulse">
              📸
            </div>
          </div>
        )}

        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-6xl font-light tracking-wide text-stone-800 dark:text-stone-100 mb-2">
                PHOTO
              </h1>
              <h2 className="text-2xl font-light text-stone-600 dark:text-stone-400 tracking-widest">
                STUDIO
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle/>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center gap-6 mb-12">
            <button
              onClick={() => setMode("camera")}
              className={`px-8 py-4 rounded-full font-medium transition-all duration-300 ${
                mode === "camera" 
                  ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-xl" 
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:shadow-lg"
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`px-8 py-4 rounded-full font-medium transition-all duration-300 ${
                mode === "upload" 
                  ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-xl" 
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:shadow-lg"
              }`}
            >
              Upload Photos
            </button>
          </div>

          {/* Main Content */}
          <div className="flex justify-center mb-8">
            {mode === "camera" ? (
              <WebcamCapture
              ref={webcamRef}
              countdownTime={currentCountdown}
              onClickCapture={() => {
                if (countdownRef.current?.hasCountdown()) {
                  handleCountdownSequence()
                } else {
                  const img = webcamRef.current?.capturePhoto()
                  if (img) {
                    triggerFlash()
                    handleCapture(img)
                  }
                }
              }}
            />
            ) : (
            <PhotoUploader 
              onUpload={handleUpload} 
              photos={photos} 
              targetCount={targetCount} 
              />
            )}
          </div>

          {/* Camera Controls */}
          {mode === "camera" && (
            <>
              {/* Progress indicator */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-white dark:bg-stone-900 px-6 py-3 rounded-full shadow-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-stone-600 dark:text-stone-400 font-medium">
                    {photos.length} of {targetCount} photos
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: targetCount }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < photos.length
                            ? 'bg-stone-600 dark:bg-stone-400'
                            : 'bg-stone-200 dark:bg-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex justify-center items-center gap-6">
                <Countdown ref={countdownRef} />
                <PhotoCount targetCount={targetCount} setTargetCount={setTargetCount} />
                <button
                  onClick={() => setCurrentPage('customize')}
                  className="px-8 py-3 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 font-medium transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  Customize →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhotoCapturePage
