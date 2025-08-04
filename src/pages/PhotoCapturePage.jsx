import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import PhotoUploader from "../components/PhotoUploader"
import WebcamCapture from "../components/WebcamCapture"
import Countdown from "../components/Countdown"
import PhotoCount from "../components/PhotoCount"

const PhotoCapturePage = ({ photos, setPhotos, onNavigate, setTargetCount, targetCount }) => {
  const webcamRef = useRef(null)
  const [mode, setMode] = useState("camera")
  const [capturedCount, setCapturedCount] = useState(0)
  const [countdownActive, setCountdownActive] = useState(false)
  const navigate = useNavigate()

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
      alert('You can only have up to 4 photos.');
      return;
    }
    const newPhotos = [...photos, image];
    setPhotos(newPhotos);
    if (newPhotos.length === targetCount) {
      setTimeout(() => navigate('/customize'), 300);
    }
  };

  const handleAutoCapture = () => {
    if (webcamRef.current) {
      const canvas = document.createElement("canvas")
      const video = webcamRef.current.querySelector("video")
      if (!video) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0)

      const imageSrc = canvas.toDataURL("image/png")
      handleCapture(imageSrc)
    }
  }

  const startCaptureSequence = async () => {
    setCountdownActive(true)
    for (let i = 0; i < targetCount; i++) {
      await new Promise(resolve => setTimeout(resolve, (i === 0 ? 0 : 3000)))
      handleAutoCapture()
    }
    setCountdownActive(false)
  }

  const goToCustomization = () => {
    if (photos.length < targetCount) {
      alert(`Please capture ${targetCount} photos before continuing.`)
      return
    }
    onNavigate('customize')
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-all px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-5xl font-header tracking-wide">Photo-Bot</h1>
        <div className="flex flex-col items-end gap-2">
          <ThemeToggle />
          <div className="space-y-1 cursor-pointer">
            <div className="w-6 h-0.5 bg-black dark:bg-white"></div>
            <div className="w-6 h-0.5 bg-black dark:bg-white"></div>
            <div className="w-6 h-0.5 bg-black dark:bg-white"></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setMode("camera")}
          className={`border px-4 py-2 rounded font-body transition ${
            mode === "camera"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
          }`}
        >
          Camera
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`border px-4 py-2 rounded font-body transition ${
            mode === "upload"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
          }`}
        >
          Upload Images
        </button>
      </div>

      {/* Active View */}
      <div className="flex justify-center">
        {mode === "camera" ? (
          <div className="w-full max-w-xl">
            <WebcamCapture ref={webcamRef} onCapture={handleCapture} />
          </div>
        ) : (
          <PhotoUploader onUpload={handleUpload} />
        )}
      </div>

      {/* Bottom Controls – only shown in Camera mode */}
      {mode === "camera" && (
        <div className="flex justify-between items-center w-full max-w-xl mx-auto mt-6">
          <div className="flex gap-4">
            <Countdown onReady={startCaptureSequence} />
            <PhotoCount targetCount={targetCount} setTargetCount={setTargetCount} />
          </div>
          <button
            onClick={goToCustomization}
            className="px-6 py-2 border border-black dark:border-white font-body rounded hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
          >
            Filter (Coming Soon)
          </button>
        </div>
      )}
    </div>
  )
}

export default PhotoCapturePage
