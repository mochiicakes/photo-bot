import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Columns2,
  Columns3,
  Download,
  Frame,
  LayoutGrid,
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  Rows2,
  Rows3,
  Rows4,
  Share2,
  Square,
  SquareDashed,
} from 'lucide-react'
import { usePhotoSession } from '../context/PhotoSessionContext'
import { renderStrip, canvasToBlob } from '../lib/renderStrip'
import { ASPECTS, FRAME_COLORS, FRAME_STYLES, layoutsFor, resolveLayout } from '../lib/options'
import FilterPicker from '../components/FilterPicker'
import { BeautySliders, StrengthSlider } from '../components/LookControls'
import { useBeautySrc } from '../lib/useBeautySrc'
import BrandHeader from '../components/BrandHeader'
import Segmented from '../components/Segmented'

const ASPECT_ICONS = { portrait: RectangleVertical, square: Square, landscape: RectangleHorizontal }
const FRAME_ICONS = { classic: Frame, none: SquareDashed }
const ROW_ICONS = { 1: RectangleVertical, 2: Rows2, 3: Rows3, 4: Rows4 }
const layoutIcon = (id, count) => {
  if (id === 'grid') return LayoutGrid
  if (id === 'horizontal') return count === 3 ? Columns3 : Columns2
  return ROW_ICONS[count]
}

const fileName = () => `tsuki-cam-${new Date().toISOString().slice(0, 10)}.png`

const canShareFiles = () => {
  try {
    return Boolean(navigator.canShare?.({ files: [new File([''], 'strip.png', { type: 'image/png' })] }))
  } catch {
    return false
  }
}

const PanelTitle = ({ children, ja }) => (
  <h3 className="panel-title">
    {children} <small>{ja}</small>
  </h3>
)

const CustomizationPage = () => {
  const navigate = useNavigate()
  const {
    photos,
    filter,
    filterStrength,
    smooth,
    brighten,
    layout,
    aspect,
    frame,
    frameColor,
    caption,
    showDate,
    update,
    clearPhotos,
  } = usePhotoSession()
  const previewRef = useRef(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const shareSupported = useMemo(canShareFiles, [])

  const options = useMemo(
    () => ({ layout, filter, filterStrength, smooth, brighten, frameColor, caption, showDate, aspect, frame }),
    [layout, filter, filterStrength, smooth, brighten, frameColor, caption, showDate, aspect, frame],
  )
  const previewSrc = useBeautySrc(photos[0], { smooth, brighten })
  const framed = frame !== 'none'
  const count = photos.length
  const activeLayout = resolveLayout(layout, count)
  const availableLayouts = layoutsFor(count)

  useEffect(() => {
    if (photos.length === 0) return
    let cancelled = false
    // Short debounce so dragging a slider doesn't re-render the strip on every tick.
    const timer = setTimeout(() => {
      renderStrip(photos, options, 2)
        .then((canvas) => {
          const target = previewRef.current
          if (cancelled || !target) return
          target.width = canvas.width
          target.height = canvas.height
          target.style.maxWidth = `min(100%, ${canvas.width / 2}px)`
          target.getContext('2d').drawImage(canvas, 0, 0)
        })
        .catch(() => !cancelled && setError('Could not render the preview.'))
    }, 60)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [photos, options])

  if (count === 0) return <Navigate to="/capture" replace />

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
    <div className="min-h-screen px-4 py-6 md:p-8">
      <main className="container mx-auto">
        <BrandHeader />
        <h2 className="font-header text-2xl md:text-3xl font-bold text-ink mb-2">
          Customize <span className="text-gold text-xl md:text-2xl">かざる</span>
        </h2>
        <button
          onClick={() => navigate('/capture')}
          className="mb-8 text-ink-soft hover:text-accent font-medium transition-colors duration-200"
        >
          ← Back to camera
        </button>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
          {/* Preview first on mobile */}
          <div className="flex justify-center items-start lg:order-2">
            <canvas
              ref={previewRef}
              aria-label="Photo strip preview"
              role="img"
              className="shadow-2xl w-auto h-auto"
              style={{ maxHeight: '78vh' }}
            />
          </div>

          <div className="space-y-6 lg:order-1">
            <section className="panel">
              <PanelTitle ja="レイアウト">Layout</PanelTitle>
              <div className="space-y-4">
                <Segmented
                  size="sm"
                  label="Photo shape"
                  value={aspect}
                  onChange={(id) => update({ aspect: id })}
                  options={ASPECTS.map((a) => ({ id: a.id, label: a.label, icon: ASPECT_ICONS[a.id] }))}
                />
                <div>
                  <Segmented
                    size="sm"
                    label="Layout"
                    value={activeLayout}
                    onChange={(id) => update({ layout: id })}
                    options={availableLayouts.map((l) => ({
                      id: l.id,
                      label: count === 1 ? 'Single' : l.label,
                      icon: layoutIcon(l.id, count),
                    }))}
                  />
                  {count !== 4 && (
                    <p className="mt-2 text-xs text-ink-soft">Take 4 photos to unlock the collage layout.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="panel">
              <PanelTitle ja="フィルター">Filter</PanelTitle>
              <FilterPicker value={filter} onChange={(id) => update({ filter: id })} previewSrc={previewSrc} />
              <div className="mt-3 flex justify-center">
                <StrengthSlider filter={filter} value={filterStrength} onChange={(v) => update({ filterStrength: v })} />
              </div>
            </section>

            <section className="panel">
              <PanelTitle ja="美顔">Beauty</PanelTitle>
              <BeautySliders smooth={smooth} brighten={brighten} onChange={update} />
            </section>

            <section className="panel">
              <PanelTitle ja="フレーム">Frame</PanelTitle>
              <Segmented
                size="sm"
                label="Frame style"
                value={frame}
                onChange={(id) => update({ frame: id })}
                options={FRAME_STYLES.map((f) => ({ id: f.id, label: f.label, icon: FRAME_ICONS[f.id] }))}
              />
              {framed && (
                <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="Frame color">
                  {FRAME_COLORS.map(({ value, name }) => (
                    <button
                      key={value}
                      role="radio"
                      aria-checked={frameColor === value}
                      aria-label={name}
                      title={name}
                      onClick={() => update({ frameColor: value })}
                      className={`w-10 h-10 rounded-full border-4 transition-all duration-200 hover:scale-110 ${
                        frameColor === value ? 'border-accent shadow-lg' : 'border-line'
                      }`}
                      style={{ backgroundColor: value }}
                    />
                  ))}
                  <label
                    className="relative w-10 h-10 rounded-full border-4 border-line overflow-hidden cursor-pointer hover:scale-110 transition-all duration-200"
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
              )}
            </section>

            <section className="panel">
              <PanelTitle ja="ひとこと">Caption</PanelTitle>
              <input
                type="text"
                value={caption}
                maxLength={40}
                disabled={!framed}
                onChange={(e) => update({ caption: e.target.value })}
                placeholder="Write a caption… ひとこと"
                aria-label="Caption"
                className="w-full p-4 border border-line rounded-xl bg-paper text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-200 disabled:opacity-50"
              />
              <label className={`mt-4 flex items-center gap-3 text-ink ${framed ? 'cursor-pointer' : 'opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={showDate}
                  disabled={!framed}
                  onChange={(e) => update({ showDate: e.target.checked })}
                  className="w-5 h-5 accent-[var(--accent)]"
                />
                Show today’s date
              </label>
              {!framed && <p className="mt-3 text-xs text-ink-soft">Captions and dates appear on framed strips.</p>}
            </section>
          </div>

          <div className="space-y-6 lg:order-3">
            <section className="panel">
              <PanelTitle ja="保存">Save your strip</PanelTitle>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={busy !== null}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-60"
                >
                  <Download className="w-5 h-5" />
                  {busy === 'download' ? 'Preparing…' : 'Download PNG'}
                </button>
                {shareSupported && (
                  <button
                    onClick={handleShare}
                    disabled={busy !== null}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-60"
                  >
                    <Share2 className="w-5 h-5" />
                    {busy === 'share' ? 'Preparing…' : 'Share'}
                  </button>
                )}
                <button
                  onClick={startOver}
                  className="w-full inline-flex items-center justify-center gap-2 text-ink-soft px-6 py-3 rounded-xl hover:bg-paper-deep hover:text-ink transition-all duration-200 font-medium"
                >
                  <RotateCcw className="w-4 h-4" /> Start over
                </button>
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm text-accent">
                  {error}
                </p>
              )}
              <p className="mt-4 text-xs text-ink-soft">Your photos stay on this device. Nothing is uploaded.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CustomizationPage
