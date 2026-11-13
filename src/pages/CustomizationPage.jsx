import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Download, Share2, RotateCcw } from 'lucide-react'
import { usePhotoSession } from '../context/PhotoSessionContext'
import { LAYOUTS, renderStrip, canvasToBlob } from '../lib/renderStrip'
import FilterPicker from '../components/FilterPicker'
import ThemeToggle from '../components/ThemeToggle'

const FRAME_COLORS = [
  { value: '#f5f5f4', name: 'Stone' },
  { value: '#1c1917', name: 'Charcoal' },
  { value: '#fecaca', name: 'Rose' },
  { value: '#ddd6fe', name: 'Lavender' },
  { value: '#bbf7d0', name: 'Mint' },
  { value: '#fef3c7', name: 'Butter' },
]

const panelClass = 'bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-lg border border-stone-200 dark:border-stone-700'
const panelTitleClass = 'text-xl font-medium mb-4 text-stone-800 dark:text-stone-200'

const fileName = () => `photo-bot-${new Date().toISOString().slice(0, 10)}.png`

const canShareFiles = () => {
  try {
    return Boolean(navigator.canShare?.({ files: [new File([''], 'strip.png', { type: 'image/png' })] }))
  } catch {
    return false
  }
}

const CustomizationPage = () => {
  const navigate = useNavigate()
  const { photos, filter, layout, frameColor, caption, showDate, update, clearPhotos } = usePhotoSession()
  const previewRef = useRef(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const shareSupported = useMemo(canShareFiles, [])

  const options = useMemo(
    () => ({ layout, filter, frameColor, caption, showDate }),
    [layout, filter, frameColor, caption, showDate],
  )

  useEffect(() => {
    if (photos.length === 0) return
    let cancelled = false
    renderStrip(photos, options, 2)
      .then((canvas) => {
        const target = previewRef.current
        if (cancelled || !target) return
        target.width = canvas.width
        target.height = canvas.height
        target.getContext('2d').drawImage(canvas, 0, 0)
      })
      .catch(() => !cancelled && setError('Could not render the preview.'))
    return () => {
      cancelled = true
    }
  }, [photos, options])

  if (photos.length === 0) return <Navigate to="/capture" replace />

  const exportBlob = async () => canvasToBlob(await renderStrip(photos, options, 3))

  const handleDownload = async () => {
    setError('')
    setBusy('download')
    try {
      const url = URL.createObjectURL(await exportBlob())
      const link = document.createElement('a')
      link.download = fileName()
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError('Failed to create your strip. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const handleShare = async () => {
    setError('')
    setBusy('share')
    try {
      const file = new File([await exportBlob()], fileName(), { type: 'image/png' })
      await navigator.share({ files: [file], title: 'My photo strip' })
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Sharing failed. Try downloading instead.')
    } finally {
      setBusy(null)
    }
  }

  const startOver = () => {
    clearPhotos()
    navigate('/capture')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 px-4 py-6 md:p-8">
      <main className="container mx-auto">
        <header className="relative text-center mb-8 md:mb-12">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl md:text-5xl font-light text-stone-800 dark:text-stone-100 mb-4 tracking-wide px-14">
            CUSTOMIZE YOUR STRIP
          </h1>
          <button
            onClick={() => navigate('/capture')}
            className="text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 text-lg font-medium transition-colors duration-200"
          >
            ← Back to camera
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Preview first on mobile */}
          <div className="flex justify-center items-start lg:order-2">
            <canvas
              ref={previewRef}
              aria-label="Photo strip preview"
              role="img"
              className="rounded-lg shadow-2xl h-auto"
              style={{ width: layout === 'grid' && photos.length === 4 ? 'min(100%, 420px)' : 'min(100%, 280px)' }}
            />
          </div>

          <div className="space-y-6 lg:order-1">
            <section className={panelClass}>
              <h2 className={panelTitleClass}>Filter</h2>
              <FilterPicker value={filter} onChange={(id) => update({ filter: id })} previewSrc={photos[0]} />
            </section>

            <section className={panelClass}>
              <h2 className={panelTitleClass}>Layout</h2>
              <div className="flex gap-3">
                {LAYOUTS.map((l) => {
                  const unavailable = l.requires && photos.length !== l.requires
                  const selected = !unavailable && (layout === l.id || (l.id === 'strip' && photos.length !== 4))
                  return (
                    <button
                      key={l.id}
                      onClick={() => update({ layout: l.id })}
                      disabled={unavailable}
                      aria-pressed={selected}
                      title={unavailable ? `Needs exactly ${l.requires} photos` : undefined}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-md'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
              {photos.length !== 4 && (
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">The grid layout needs 4 photos.</p>
              )}
            </section>

            <section className={panelClass}>
              <h2 className={panelTitleClass}>Frame color</h2>
              <div className="flex flex-wrap gap-3 justify-center" role="radiogroup" aria-label="Frame color">
                {FRAME_COLORS.map(({ value, name }) => (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={frameColor === value}
                    aria-label={name}
                    title={name}
                    onClick={() => update({ frameColor: value })}
                    className={`w-11 h-11 rounded-full border-4 transition-all duration-200 hover:scale-110 ${
                      frameColor === value
                        ? 'border-stone-800 dark:border-stone-200 shadow-lg'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                    style={{ backgroundColor: value }}
                  />
                ))}
                <label
                  className="relative w-11 h-11 rounded-full border-4 border-stone-300 dark:border-stone-600 overflow-hidden cursor-pointer hover:scale-110 transition-all duration-200"
                  title="Custom color"
                  style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                >
                  <span className="sr-only">Custom frame color</span>
                  <input
                    type="color"
                    value={frameColor}
                    onChange={(e) => update({ frameColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </section>

            <section className={panelClass}>
              <h2 className={panelTitleClass}>Caption</h2>
              <input
                type="text"
                value={caption}
                maxLength={40}
                onChange={(e) => update({ caption: e.target.value })}
                placeholder="Enter your caption..."
                aria-label="Caption"
                className="w-full p-4 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all duration-200 text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-800 placeholder-stone-400 dark:placeholder-stone-500"
              />
              <label className="mt-4 flex items-center gap-3 text-stone-700 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => update({ showDate: e.target.checked })}
                  className="w-5 h-5 accent-stone-800 dark:accent-stone-300"
                />
                Show today’s date
              </label>
            </section>
          </div>

          <div className="space-y-6 lg:order-3">
            <section className={panelClass}>
              <h2 className={panelTitleClass}>Save your strip</h2>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={busy !== null}
                  className="w-full inline-flex items-center justify-center gap-2 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 px-6 py-4 rounded-xl hover:bg-stone-900 dark:hover:bg-white transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                  <Download className="w-5 h-5" />
                  {busy === 'download' ? 'Preparing…' : 'Download PNG'}
                </button>
                {shareSupported && (
                  <button
                    onClick={handleShare}
                    disabled={busy !== null}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 px-6 py-4 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-60"
                  >
                    <Share2 className="w-5 h-5" />
                    {busy === 'share' ? 'Preparing…' : 'Share'}
                  </button>
                )}
                <button
                  onClick={startOver}
                  className="w-full inline-flex items-center justify-center gap-2 text-stone-600 dark:text-stone-400 px-6 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200 font-medium"
                >
                  <RotateCcw className="w-4 h-4" /> Start over
                </button>
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
                Your photos stay on this device. Nothing is uploaded.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CustomizationPage
