import { useEffect, useState } from 'react'
import { beautify, isBeautyActive } from './beauty'

const THUMB_SIDE = 480

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/**
 * Returns `src` with the beauty pass applied (as an object URL), for small previews.
 * Falls back to the original `src` while processing or when beauty is off.
 */
export const useBeautySrc = (src, { smooth = 0, brighten = 0 }) => {
  const [result, setResult] = useState({ key: null, url: null })
  const active = Boolean(src) && isBeautyActive({ smooth, brighten })
  const key = `${src}|${smooth}|${brighten}`

  useEffect(() => {
    if (!active) return
    let cancelled = false
    let url = null
    // Debounced so dragging a slider doesn't reprocess on every tick.
    const timer = setTimeout(async () => {
      try {
        const canvas = beautify(await loadImage(src), { smooth, brighten }, THUMB_SIDE)
        if (cancelled || !canvas.toBlob) return
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return
          url = URL.createObjectURL(blob)
          setResult({ key, url })
        }, 'image/jpeg', 0.9)
      } catch {
        /* keep showing the original */
      }
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
  }, [active, src, smooth, brighten, key])

  if (!active) return src
  return result.key === key ? result.url : src
}
