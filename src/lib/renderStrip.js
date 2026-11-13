import { applyFilterToCanvas } from './filters'
import { beautify } from './beauty'
import { getAspect, resolveLayout } from './options'
import { drawMoonGlyph, moonPhase } from './moon'
import { DECORATED_STYLES, drawFrameDecor } from './frameDecor'

// Base cell width (CSS px at scale 1) per layout; height follows the photo aspect.
const cellWidthFor = (layout, count, aspect) => {
  const wide = aspect === 'landscape'
  if (layout === 'grid') return wide ? 300 : 254
  if (layout === 'horizontal') return ({ 2: 240, 3: 200, 4: 180 }[count] ?? 200) + (wide ? 60 : 0)
  return wide ? 300 : 268
}

const getGeometry = ({ layout, count, aspect, framed, decorated, hasFooterText }) => {
  const cols = layout === 'grid' ? 2 : layout === 'horizontal' ? count : 1
  const rows = layout === 'grid' ? 2 : layout === 'horizontal' ? 1 : count
  // Decorated frames get wider margins so their art has room around the photos.
  const pad = framed ? (layout === 'grid' ? 20 : 16) + (decorated ? 6 : 0) : 0
  const gap = framed ? 12 : 0
  const w = cellWidthFor(layout, count, aspect)
  const h = Math.round(w * getAspect(aspect).ratio)

  const cells = Array.from({ length: count }, (_, i) => ({
    x: pad + (i % cols) * (w + gap),
    y: pad + Math.floor(i / cols) * (h + gap),
    w,
    h,
  }))

  const width = pad * 2 + cols * w + (cols - 1) * gap
  const footerTop = pad + rows * h + (rows - 1) * gap
  const footer = framed ? (hasFooterText || decorated ? 84 : pad * 2) : 0
  return { width, height: footerTop + footer, cells, footerTop, pad }
}

const imageCache = new Map()

const loadImage = (src) => {
  if (!imageCache.has(src)) {
    if (imageCache.size > 16) imageCache.clear()
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      }),
    )
  }
  return imageCache.get(src)
}

// Beauty and filtering are the expensive parts, so cache each photo's tile per settings.
const tileCache = new WeakMap()

const coverCrop = (source, w, h) => {
  const tile = document.createElement('canvas')
  tile.width = w
  tile.height = h
  const sourceW = source.naturalWidth || source.width
  const sourceH = source.naturalHeight || source.height
  // Same center crop as the camera preview's object-cover.
  const scale = Math.max(w / sourceW, h / sourceH)
  const sw = w / scale
  const sh = h / scale
  tile.getContext('2d', { willReadFrequently: true }).drawImage(source, (sourceW - sw) / 2, (sourceH - sh) / 2, sw, sh, 0, 0, w, h)
  return tile
}

// Pipeline per photo: beauty on the full frame -> crop -> filter, mixed over the
// unfiltered photo at `filterStrength` (like the preview's opacity layer).
const getTile = (img, { filter, filterStrength = 1, smooth = 0, brighten = 0 }, w, h) => {
  let byKey = tileCache.get(img)
  if (!byKey) {
    byKey = new Map()
    tileCache.set(img, byKey)
  }
  const key = `${filter}|${filterStrength}|${smooth}|${brighten}|${w}x${h}`
  if (byKey.has(key)) return byKey.get(key)
  if (byKey.size > 24) byKey.clear()

  const tile = coverCrop(beautify(img, { smooth, brighten }), w, h)
  if (filter !== 'none' && filterStrength > 0) {
    const filtered = filterStrength >= 1 ? tile : coverCrop(tile, w, h)
    applyFilterToCanvas(filtered.getContext('2d'), w, h, filter)
    if (filtered !== tile) {
      const ctx = tile.getContext('2d')
      ctx.globalAlpha = filterStrength
      ctx.drawImage(filtered, 0, 0)
      ctx.globalAlpha = 1
    }
  }
  byKey.set(key, tile)
  return tile
}

const isLight = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

const roundedClip = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  if (r && ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
  ctx.clip()
}

const fitFont = (ctx, text, weight, family, size, maxWidth) => {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > 8 && ctx.measureText(text).width > maxWidth) {
    s -= 1
    ctx.font = `${weight} ${s}px ${family}`
  }
}

export const formatStripDate = (date = new Date()) =>
  date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()

const CAPTION_FONT = '"Zen Maru Gothic", "DM Sans", sans-serif'
const DATE_FONT = '500 11px "DM Sans", sans-serif'
const FILM_FONT = '"DSEG7 Classic", monospace'

// "13 NOV 2026", optionally followed by tonight's moon and its Japanese name.
const drawDateLine = (ctx, cx, y, ink, light, withMoon) => {
  const date = formatStripDate()
  ctx.fillStyle = `rgba(${ink}, 0.65)`
  ctx.font = DATE_FONT
  if (!withMoon) {
    ctx.fillText(date, cx, y)
    return
  }
  const phase = moonPhase()
  const r = 4.5
  const gap = 6
  const dateWidth = ctx.measureText(date).width
  ctx.font = `500 11px ${CAPTION_FONT}`
  const nameWidth = ctx.measureText(phase.ja).width
  let x = cx - (dateWidth + gap + r * 2 + gap + nameWidth) / 2

  ctx.save()
  ctx.textAlign = 'left'
  ctx.font = DATE_FONT
  ctx.fillText(date, x, y)
  x += dateWidth + gap
  drawMoonGlyph(ctx, x + r, y, r, phase.fraction, light ? '#e2a71e' : '#ffe08a', `rgba(${ink}, 0.18)`)
  x += r * 2 + gap
  ctx.font = `500 11px ${CAPTION_FONT}`
  ctx.fillText(phase.ja, x, y)
  ctx.restore()
}

// Orange disposable-camera date stamp ('26 11 13) in a photo's bottom-right corner.
const drawFilmDate = (ctx, cell) => {
  const now = new Date()
  const pad2 = (n) => String(n).padStart(2, '0')
  const digits = `${String(now.getFullYear()).slice(2)} ${pad2(now.getMonth() + 1)} ${pad2(now.getDate())}`
  const size = Math.max(7, cell.h * 0.06)
  const x = cell.x + cell.w - size * 0.8
  const y = cell.y + cell.h - size * 0.75
  ctx.save()
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ff9a2e'
  ctx.shadowColor = 'rgba(255, 110, 20, 0.85)'
  ctx.shadowBlur = size * 0.5
  ctx.font = `${size}px ${FILM_FONT}`
  ctx.fillText(digits, x, y)
  const width = ctx.measureText(digits).width
  ctx.font = `700 ${size}px "DM Sans", sans-serif`
  ctx.fillText("'", x - width - size * 0.12, y)
  ctx.restore()
}

/**
 * Draws the finished photo strip and returns a canvas.
 * `scale` multiplies the output resolution (2 for on-screen preview, 3 for export).
 */
export const renderStrip = async (
  photos,
  {
    layout,
    filter,
    filterStrength,
    smooth,
    brighten,
    frameColor,
    caption,
    showDate,
    showMoon = true,
    filmDate = false,
    aspect,
    frame,
  },
  scale = 2,
) => {
  const framed = frame !== 'none'
  const decorated = DECORATED_STYLES.includes(frame)
  const text = framed ? caption.trim() : ''
  const withDate = framed && showDate
  const withMoon = withDate && showMoon
  const hasFooterText = Boolean(text) || withDate
  const geo = getGeometry({
    layout: resolveLayout(layout, photos.length),
    count: photos.length,
    aspect,
    framed,
    decorated,
    hasFooterText,
  })

  const [images] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    text && document.fonts?.load?.(`500 20px ${CAPTION_FONT}`, text).catch(() => {}),
    withDate && document.fonts?.load?.(DATE_FONT).catch(() => {}),
    withMoon && document.fonts?.load?.(`500 11px ${CAPTION_FONT}`, moonPhase().ja).catch(() => {}),
    filmDate && document.fonts?.load?.(`20px ${FILM_FONT}`, '0123456789').catch(() => {}),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(geo.width * scale)
  canvas.height = Math.round(geo.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  if (framed) {
    ctx.fillStyle = frameColor
    ctx.fillRect(0, 0, geo.width, geo.height)
  }

  images.forEach((img, i) => {
    const cell = geo.cells[i]
    const tile = getTile(img, { filter, filterStrength, smooth, brighten }, Math.round(cell.w * scale), Math.round(cell.h * scale))
    ctx.save()
    roundedClip(ctx, cell.x, cell.y, cell.w, cell.h, framed ? 6 : 0)
    ctx.drawImage(tile, cell.x, cell.y, cell.w, cell.h)
    ctx.restore()
    if (filmDate) drawFilmDate(ctx, cell)
  })

  const light = isLight(frameColor)
  if (decorated) drawFrameDecor(ctx, frame, geo, { light })

  if (hasFooterText) {
    const ink = light ? '29, 37, 82' : '253, 253, 255'
    const cx = geo.width / 2
    const maxWidth = geo.width - geo.pad * 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const captionY = withDate && text ? geo.footerTop + 34 : geo.footerTop + 42
    if (text) {
      ctx.fillStyle = `rgb(${ink})`
      fitFont(ctx, text, 500, CAPTION_FONT, 20, maxWidth)
      ctx.fillText(text, cx, captionY)
    }
    if (withDate) drawDateLine(ctx, cx, text ? captionY + 26 : captionY, ink, light, withMoon)
  }

  return canvas
}

export const canvasToBlob = (canvas, type = 'image/png') =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type)
  })
