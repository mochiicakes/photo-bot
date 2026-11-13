import { applyFilterToImageData } from './filters'

export const LAYOUTS = [
  { id: 'strip', label: 'Strip' },
  { id: 'grid', label: '2×2 Grid', requires: 4 },
]

// Grid only makes sense with exactly four photos; fall back to a strip otherwise.
export const resolveLayout = (layout, count) => (layout === 'grid' && count === 4 ? 'grid' : 'strip')

const PHOTO_RATIO = 3 / 4
const RADIUS = 6

// Geometry in CSS pixels at scale 1.
const getGeometry = (layout, count, hasFooterText) => {
  const footer = hasFooterText ? 84 : 32
  if (layout === 'grid') {
    const width = 560
    const pad = 20
    const gap = 12
    const w = (width - pad * 2 - gap) / 2
    const h = Math.round(w * PHOTO_RATIO)
    const cells = [0, 1, 2, 3].map((i) => ({
      x: pad + (i % 2) * (w + gap),
      y: pad + Math.floor(i / 2) * (h + gap),
      w,
      h,
    }))
    const footerTop = pad + h * 2 + gap
    return { width, height: footerTop + footer, cells, footerTop, pad }
  }

  const width = 300
  const pad = 16
  const gap = 12
  const w = width - pad * 2
  const h = Math.round(w * PHOTO_RATIO)
  const cells = Array.from({ length: count }, (_, i) => ({ x: pad, y: pad + i * (h + gap), w, h }))
  const footerTop = pad + count * h + Math.max(count - 1, 0) * gap
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

// Filtering is the expensive part, so cache each photo's filtered tile per size.
const tileCache = new WeakMap()

const getTile = (img, filter, w, h) => {
  let byKey = tileCache.get(img)
  if (!byKey) {
    byKey = new Map()
    tileCache.set(img, byKey)
  }
  const key = `${filter}|${w}x${h}`
  if (byKey.has(key)) return byKey.get(key)

  const tile = document.createElement('canvas')
  tile.width = w
  tile.height = h
  const ctx = tile.getContext('2d', { willReadFrequently: true })

  // Cover-crop to the tile's aspect ratio.
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h)

  if (filter !== 'none') {
    const data = ctx.getImageData(0, 0, w, h)
    ctx.putImageData(applyFilterToImageData(data, filter), 0, 0)
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
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
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

/**
 * Draws the finished photo strip and returns a canvas.
 * `scale` multiplies the output resolution (2 for on-screen preview, 3 for export).
 */
export const renderStrip = async (photos, { layout, filter, frameColor, caption, showDate }, scale = 2) => {
  const resolved = resolveLayout(layout, photos.length)
  const text = caption.trim()
  const hasFooterText = Boolean(text) || showDate
  const geo = getGeometry(resolved, photos.length, hasFooterText)

  const [images] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    document.fonts?.load?.('400 20px "Playfair Display"').catch(() => {}),
    document.fonts?.load?.('500 11px "DM Sans"').catch(() => {}),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(geo.width * scale)
  canvas.height = Math.round(geo.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = frameColor
  ctx.fillRect(0, 0, geo.width, geo.height)

  images.forEach((img, i) => {
    const cell = geo.cells[i]
    if (!cell) return
    const tile = getTile(img, filter, Math.round(cell.w * scale), Math.round(cell.h * scale))
    ctx.save()
    roundedClip(ctx, cell.x, cell.y, cell.w, cell.h, RADIUS)
    ctx.drawImage(tile, cell.x, cell.y, cell.w, cell.h)
    ctx.restore()
  })

  if (hasFooterText) {
    const ink = isLight(frameColor) ? '41, 37, 36' : '245, 245, 244'
    const cx = geo.width / 2
    const maxWidth = geo.width - geo.pad * 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const captionY = showDate && text ? geo.footerTop + 34 : geo.footerTop + 42
    if (text) {
      ctx.fillStyle = `rgb(${ink})`
      fitFont(ctx, text, 400, '"Playfair Display", serif', 20, maxWidth)
      ctx.fillText(text, cx, captionY)
    }
    if (showDate) {
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
