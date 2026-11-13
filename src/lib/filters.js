// Each filter is a list of CSS filter functions. The same list drives the live
// CSS preview and the pixel pass used when rendering the strip, so exports match
// what users see (Safari doesn't support ctx.filter, so we can't rely on it).
export const FILTERS = [
  { id: 'none', label: 'Original', ops: [] },
  { id: 'bw', label: 'B&W', ops: [['grayscale', 1], ['contrast', 1.1]] },
  { id: 'sepia', label: 'Sepia', ops: [['sepia', 0.8], ['contrast', 1.05]] },
  { id: 'warm', label: 'Warm', ops: [['sepia', 0.2], ['saturate', 1.3], ['brightness', 1.05]] },
  { id: 'vintage', label: 'Vintage', ops: [['sepia', 0.4], ['contrast', 0.9], ['saturate', 0.8], ['brightness', 1.05]] },
  { id: 'bold', label: 'Bold', ops: [['contrast', 1.3], ['saturate', 1.25]] },
]

export const getFilter = (id) => FILTERS.find((f) => f.id === id) ?? FILTERS[0]

export const filterToCss = (id) => {
  const { ops } = getFilter(id)
  if (ops.length === 0) return 'none'
  return ops.map(([name, v]) => (name === 'hue-rotate' ? `${name}(${v}deg)` : `${name}(${v})`)).join(' ')
}

// Color matrices from the Filter Effects spec, row-major 3x3, plus an offset (0-255).
const OPS = {
  grayscale: (a) => {
    const i = 1 - a
    return {
      m: [
        0.2126 + 0.7874 * i, 0.7152 - 0.7152 * i, 0.0722 - 0.0722 * i,
        0.2126 - 0.2126 * i, 0.7152 + 0.2848 * i, 0.0722 - 0.0722 * i,
        0.2126 - 0.2126 * i, 0.7152 - 0.7152 * i, 0.0722 + 0.9278 * i,
      ],
      o: 0,
    }
  },
  sepia: (a) => {
    const i = 1 - a
    return {
      m: [
        0.393 + 0.607 * i, 0.769 - 0.769 * i, 0.189 - 0.189 * i,
        0.349 - 0.349 * i, 0.686 + 0.314 * i, 0.168 - 0.168 * i,
        0.272 - 0.272 * i, 0.534 - 0.534 * i, 0.131 + 0.869 * i,
      ],
      o: 0,
    }
  },
  saturate: (s) => ({
    m: [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
    ],
    o: 0,
  }),
  'hue-rotate': (deg) => {
    const r = (deg * Math.PI) / 180
    const c = Math.cos(r)
    const s = Math.sin(r)
    return {
      m: [
        0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
        0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
        0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
      ],
      o: 0,
    }
  },
  brightness: (b) => ({ m: [b, 0, 0, 0, b, 0, 0, 0, b], o: 0 }),
  contrast: (c) => ({ m: [c, 0, 0, 0, c, 0, 0, 0, c], o: 127.5 * (1 - c) }),
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)

// Applies the filter in place. Ops run one after another with clamping in between,
// the same way browsers chain CSS filter functions.
export const applyFilterToImageData = (imageData, id) => {
  const { ops } = getFilter(id)
  if (ops.length === 0) return imageData
  const d = imageData.data
  for (const [name, value] of ops) {
    const { m, o } = OPS[name](value)
    for (let p = 0; p < d.length; p += 4) {
      const r = d[p]
      const g = d[p + 1]
      const b = d[p + 2]
      d[p] = clamp(m[0] * r + m[1] * g + m[2] * b + o)
      d[p + 1] = clamp(m[3] * r + m[4] * g + m[5] * b + o)
      d[p + 2] = clamp(m[6] * r + m[7] * g + m[8] * b + o)
    }
  }
  return imageData
}
