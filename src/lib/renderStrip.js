import { applyFilterToCanvas } from './filters'
import { beautify } from './beauty'
import { getAspect, resolveLayout } from './options'

// Base cell width (CSS px at scale 1) per layout; height follows the photo aspect.
const cellWidthFor = (layout, count, aspect) => {
  const wide = aspect === 'landscape'
  if (layout === 'grid') return wide ? 300 : 254
  if (layout === 'horizontal') return (count === 3 ? 200 : 240) + (wide ? 60 : 0)
  return wide ? 300 : 268
}

const getGeometry = ({ layout, count, aspect, framed, hasFooterText }) => {
  const cols = layout === 'grid' ? 2 : layout === 'horizontal' ? count : 1
  const rows = layout === 'grid' ? 2 : layout === 'horizontal' ? 1 : count
  const pad = framed ? (layout === 'grid' ? 20 : 16) : 0
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
  const footer = framed ? (hasFooterText ? 84 : pad * 2) : 0
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

/**
 * Draws the finished photo strip and returns a canvas.
 * `scale` multiplies the output resolution (2 for on-screen preview, 3 for export).
 */
export const renderStrip = async (
  photos,
  { layout, filter, filterStrength, smooth, brighten, frameColor, caption, showDate, aspect, frame },
  scale = 2,
) => {
  const framed = frame !== 'none'
  const text = framed ? caption.trim() : ''
  const withDate = framed && showDate
  const hasFooterText = Boolean(text) || withDate
  const geo = getGeometry({
    layout: resolveLayout(layout, photos.length),
    count: photos.length,
    aspect,
    framed,
    hasFooterText,
  })

  const [images] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    text && document.fonts?.load?.(`500 20px ${CAPTION_FONT}`, text).catch(() => {}),
    withDate && document.fonts?.load?.('500 11px "DM Sans"').catch(() => {}),
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
  })

  if (hasFooterText) {
    const ink = isLight(frameColor) ? '29, 37, 82' : '253, 253, 255'
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
    if (withDate) {
      ctx.fillStyle = `rgba(${ink}, 0.65)`
      ctx.font = '500 11px "DM Sans", sans-serif'
      ctx.fillText(formatStripDate(), cx, text ? captionY + 26 : captionY)
    }
  }

  return canvas
}

export const canvasToBlob = (canvas, type = 'image/png') =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type)
  })
