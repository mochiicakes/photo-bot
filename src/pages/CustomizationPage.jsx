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
  X,
  ZoomIn,
} from 'lucide-react'
import { usePhotoSession } from '../context/PhotoSessionContext'
import { renderStrip, canvasToBlob } from '../lib/renderStrip'
import { ASPECTS, FRAME_COLORS, FRAME_STYLES, layoutsFor, resolveLayout } from '../lib/options'
import FilterPicker from '../components/FilterPicker'
import { BeautySliders, StrengthSlider } from '../components/LookControls'
import { useBeautySrc } from '../lib/useBeautySrc'
import { trackEvent } from '../lib/analytics'
import { seasonalStyles } from '../lib/frameDecor'
import { moonPhase } from '../lib/moon'
import BrandHeader from '../components/BrandHeader'
import Segmented from '../components/Segmented'

const ASPECT_ICONS = { portrait: RectangleVertical, square: Square, landscape: RectangleHorizontal }
const FRAME_ICONS = { classic: Frame, none: SquareDashed }

const Checkbox = ({ checked, onChange, disabled, children }) => (
  <label className={`mt-3 flex items-center gap-3 text-ink ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 accent-[var(--accent)]"
    />
    {children}
  </label>
)
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
    showMoon,
    filmDate,
    update,
    clearPhotos,
    hydrated,
  } = usePhotoSession()
  const previewRef = useRef(null)
  const paneRef = useRef(null)
  const [stripRatio, setStripRatio] = useState(null) // height / width of the rendered strip
  const [previewWidth, setPreviewWidth] = useState({ px: null, scrolls: false })
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [zoomUrl, setZoomUrl] = useState(null)
  const shareSupported = useMemo(canShareFiles, [])

  const options = useMemo(
    () => ({
      layout,
      filter,
      filterStrength,
      smooth,
      brighten,
      frameColor,
      caption,
      showDate,
      showMoon,
      filmDate,
      aspect,
      frame,
    }),
    [layout, filter, filterStrength, smooth, brighten, frameColor, caption, showDate, showMoon, filmDate, aspect, frame],
  )
  const previewSrc = useBeautySrc(photos[0], { smooth, brighten })
  const framed = frame !== 'none'
  const inSeason = useMemo(() => seasonalStyles(), [])
  const tonight = useMemo(() => moonPhase(), [])
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
          setStripRatio(canvas.height / canvas.width)
            target.getContext('2d').drawImage(canvas, 0, 0)
        })
        .catch(() => !cancelled && setError('Could not render the preview.'))
    }, 60)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [photos, options])

  // Fit the strip to the preview pane; very tall strips keep a readable width and scroll
  // inside the pane instead of shrinking to a sliver.
  useEffect(() => {
    const pane = paneRef.current
    if (!pane || !stripRatio) return
    const MIN_TALL_WIDTH = 300
    const measure = () => {
      const style = getComputedStyle(pane)
      const innerW = pane.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const fixedHeight = pane.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      // On mobile the pane is capped at 65vh rather than a fixed height.
      const innerH = window.matchMedia('(min-width: 1024px)').matches ? fixedHeight : window.innerHeight * 0.65 - 32
      const fitWidth = innerH / stripRatio
      const px = Math.floor(Math.min(innerW, Math.max(fitWidth, Math.min(MIN_TALL_WIDTH, innerW))))
      setPreviewWidth({ px, scrolls: px * stripRatio > innerH + 1 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [stripRatio, hydrated])

  if (!hydrated) return null
  if (count === 0) return <Navigate to="/capture" replace />

  const exportBlob = async () => canvasToBlob(await renderStrip(photos, options, 3))

  // Which looks people actually use (no photo data).
  const saveDetails = () => ({
    filter,
    layout: activeLayout,
    shape: aspect,
    frame,
    photos: count,
    beauty: smooth > 0 || brighten > 0,
  })

  const handleDownload = async () => {
    setError('')
    setBusy('download')
    try {
      const url = URL.createObjectURL(await exportBlob())
      const link = document.createElement('a')
      link.download = fileName()
      link.href = url
      link.click()
      trackEvent('download', saveDetails())
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
      trackEvent('share', saveDetails())
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Sharing failed. Try downloading instead.')
    } finally {
      setBusy(null)
    }
  }

  // Larger, scrollable view of the strip (rendered at export quality).
  const openZoom = async () => {
    try {
      setZoomUrl(URL.createObjectURL(await exportBlob()))
    } catch {
      setError('Could not open the larger view.')
    }
  }
  const closeZoom = () => {
    if (zoomUrl) URL.revokeObjectURL(zoomUrl)
    setZoomUrl(null)
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-10 max-w-7xl mx-auto items-start">
          {/* Preview (first on mobile); sticks beside the options on desktop. */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <div className="relative rounded-3xl border border-line bg-surface/40">
              <div
                ref={paneRef}
                className="flex justify-center overflow-y-auto overscroll-contain p-4 max-h-[65vh] lg:max-h-none lg:h-[calc(100vh-13rem)] lg:min-h-[24rem] [scrollbar-width:thin]"
              >
                <button
                  type="button"
                  onClick={openZoom}
                  aria-label="View strip larger"
                  className={`shrink-0 cursor-zoom-in ${previewWidth.scrolls ? '' : 'my-auto'}`}
                  style={{ width: previewWidth.px ? `${previewWidth.px}px` : undefined }}
                >
                  <canvas
                    ref={previewRef}
                    aria-label="Photo strip preview"
                    role="img"
                    className="block w-full h-auto shadow-2xl"
                  />
                </button>
              </div>
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                <ZoomIn className="w-3.5 h-3.5" /> Tap to view larger
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                disabled={busy !== null}
                className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-60 ${shareSupported ? '' : 'col-span-2'}`}
              >
                <Download className="w-5 h-5" />
                {busy === 'download' ? 'Preparing…' : 'Download PNG'}
              </button>
              {shareSupported && (
                <button
                  onClick={handleShare}
                  disabled={busy !== null}
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-60"
                >
                  <Share2 className="w-5 h-5" />
                  {busy === 'share' ? 'Preparing…' : 'Share'}
                </button>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-accent text-center">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
              <span>Your photos stay on this device. Nothing is uploaded.</span>
              <button
                onClick={startOver}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium hover:bg-paper-deep hover:text-ink transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start over
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
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
                <PanelTitle ja="美顔">Beauty</PanelTitle>
                <BeautySliders smooth={smooth} brighten={brighten} onChange={update} />
              </section>
              <section className="panel sm:col-span-2">
                <PanelTitle ja="フィルター">Filter</PanelTitle>
                <FilterPicker value={filter} onChange={(id) => update({ filter: id })} previewSrc={previewSrc} />
                <div className="mt-3 flex justify-center">
                  <StrengthSlider filter={filter} value={filterStrength} onChange={(v) => update({ filterStrength: v })} />
                </div>
              </section>
              <section className="panel">
                <PanelTitle ja="フレーム">Frame</PanelTitle>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Frame style">
                  {FRAME_STYLES.map((f) => {
                    const Icon = FRAME_ICONS[f.id]
                    const selected = frame === f.id
                    const badge = f.id === 'fullmoon' && inSeason.includes('fullmoon') ? '今夜だけ' : inSeason.includes(f.id) ? '旬' : null
                    return (
                      <button
                        key={f.id}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update({ frame: f.id })}
                        className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          selected ? 'bg-accent text-on-accent shadow' : 'bg-paper text-ink-soft border border-line hover:border-gold hover:text-ink'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {f.label}
                        {badge && (
                          <span className="absolute -top-2 -right-1 rounded-full bg-gold px-1.5 text-[10px] leading-4 text-[#1d2552] shadow">
                            {badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
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
                <div className="mt-1">
                  <Checkbox checked={showDate} disabled={!framed} onChange={(v) => update({ showDate: v })}>
                    Show today’s date
                  </Checkbox>
                  <Checkbox checked={showMoon} disabled={!framed || !showDate} onChange={(v) => update({ showMoon: v })}>
                    Add tonight’s moon <span className="text-gold">{tonight.ja}</span>
                  </Checkbox>
                  <Checkbox checked={filmDate} onChange={(v) => update({ filmDate: v })}>
                    Film date stamp <span className="text-gold">日付</span>
                  </Checkbox>
                </div>
                {!framed && <p className="mt-3 text-xs text-ink-soft">Captions and the date line appear on framed strips.</p>}
              </section>
          </div>
        </div>
      </main>

      {zoomUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Strip preview"
          onClick={closeZoom}
          onKeyDown={(e) => e.key === 'Escape' && closeZoom()}
          tabIndex={-1}
          ref={(el) => el?.focus()}
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/85 p-6 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={closeZoom}
            aria-label="Close"
            className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={zoomUrl} alt="Your photo strip" className="my-auto h-auto w-auto max-w-[min(92vw,34rem)] shadow-2xl" />
        </div>
      )}
    </div>
  )
}

export default CustomizationPage
