// A filter is a list of overlays (colors/gradients blended over the photo) followed by
// CSS filter functions (ops). The same definition drives the live CSS preview and the
// canvas export, so saved strips match what users see (Safari lacks ctx.filter, so ops
// are applied pixel by pixel). Overlays are drawn first, then ops run on the result,
// matching CSS where `filter` on a wrapper applies after its children are blended.
//
// Colors are [r, g, b, a]; `null` in a gradient means transparent. Gradient stops are
// [color, position] with position as a fraction (may exceed 1) or omitted (CSS rules).
//
// "Classic" looks are adapted from CSSgram by Una Kravets (MIT): https://github.com/una/CSSgram

const solid = (blend, color, opacity) => ({ blend, fill: color, opacity })
const radial = (blend, stops, { at = [0.5, 0.5], opacity } = {}) => ({ blend, fill: { type: 'radial', at, stops }, opacity })
const linear = (blend, dir, stops, opacity) => ({ blend, fill: { type: 'linear', dir, stops }, opacity })

export const FILTER_CATEGORIES = [
  { id: 'tsuki', label: 'Tsuki 月' },
  { id: 'classic', label: 'Classic' },
  { id: 'basic', label: 'Basic' },
]

export const FILTERS = [
  { id: 'none', label: 'Original', category: 'basic', ops: [] },

  // Tsuki originals: soft, airy looks inspired by Japanese/Xiaohongshu photo trends.
  {
    id: 'clear', label: 'Toumei 透明', category: 'tsuki',
    ops: [['brightness', 1.1], ['contrast', 0.9], ['saturate', 0.95]],
    overlays: [solid('soft-light', [225, 238, 255, 1], 0.5), solid('screen', [220, 235, 255, 0.18])],
  },
  {
    id: 'cream', label: 'Cream', category: 'tsuki',
    ops: [['brightness', 1.06], ['contrast', 0.92], ['saturate', 0.9]],
    overlays: [solid('soft-light', [255, 226, 196, 1], 0.6), solid('screen', [255, 240, 225, 0.12])],
  },
  {
    id: 'sakura', label: 'Sakura 桜', category: 'tsuki',
    ops: [['brightness', 1.05], ['saturate', 1.05]],
    overlays: [solid('soft-light', [255, 183, 206, 1], 0.55), solid('screen', [255, 214, 228, 0.1])],
  },
  {
    id: 'moonlight', label: 'Moonlight 月光', category: 'tsuki',
    ops: [['saturate', 0.8], ['contrast', 0.95], ['brightness', 1.05]],
    overlays: [solid('soft-light', [110, 135, 215, 1], 0.55), solid('screen', [40, 50, 110, 0.15])],
  },
  {
    id: 'peach', label: 'Peach 桃', category: 'tsuki',
    ops: [['brightness', 1.04], ['saturate', 1.1]],
    overlays: [solid('soft-light', [255, 180, 140, 1], 0.5)],
  },
  {
    id: 'dreamy', label: 'Yume 夢', category: 'tsuki',
    ops: [['brightness', 1.1], ['contrast', 0.85], ['saturate', 1.15]],
    overlays: [
      radial('screen', [[[255, 255, 255, 0.28], 0], [null, 0.8]]),
      solid('soft-light', [230, 200, 255, 1], 0.4),
    ],
  },
  {
    id: 'film', label: 'Film', category: 'tsuki',
    ops: [['contrast', 0.9], ['saturate', 0.85], ['sepia', 0.1]],
    overlays: [solid('lighten', [38, 44, 58, 1]), solid('soft-light', [240, 220, 180, 1], 0.35)],
  },
  {
    id: 'showa', label: 'Showa 昭和', category: 'tsuki',
    ops: [['sepia', 0.35], ['contrast', 1.1], ['saturate', 0.8]],
    overlays: [radial('multiply', [[null, 0.6], [[60, 30, 10, 0.55], 1.3]]), solid('lighten', [40, 30, 25, 1])],
  },
  {
    id: 'neon', label: 'Neon', category: 'tsuki',
    ops: [['contrast', 1.15], ['saturate', 1.3], ['hue-rotate', -8]],
    overlays: [linear('soft-light', 'to bottom', [[[255, 90, 190, 1]], [[70, 120, 255, 1]]], 0.45)],
  },
  {
    id: 'matcha', label: 'Matcha 抹茶', category: 'tsuki',
    ops: [['brightness', 1.05], ['saturate', 0.9]],
    overlays: [solid('soft-light', [190, 220, 170, 1], 0.5)],
  },

  // Classic photo-app looks (CSSgram).
  { id: '1977', label: '1977', category: 'classic', ops: [['contrast', 1.1], ['brightness', 1.1], ['saturate', 1.3]], overlays: [solid('screen', [243, 106, 188, 0.3])] },
  { id: 'aden', label: 'Aden', category: 'classic', ops: [['hue-rotate', -20], ['contrast', 0.9], ['saturate', 0.85], ['brightness', 1.2]], overlays: [linear('darken', 'to right', [[[66, 10, 14, 0.2]], [null]])] },
  { id: 'brannan', label: 'Brannan', category: 'classic', ops: [['sepia', 0.5], ['contrast', 1.4]], overlays: [solid('lighten', [161, 44, 199, 0.31])] },
  { id: 'brooklyn', label: 'Brooklyn', category: 'classic', ops: [['contrast', 0.9], ['brightness', 1.1]], overlays: [radial('overlay', [[[168, 223, 193, 0.4], 0.7], [[196, 183, 200, 1]]])] },
  { id: 'clarendon', label: 'Clarendon', category: 'classic', ops: [['contrast', 1.2], ['saturate', 1.35]], overlays: [solid('overlay', [127, 187, 227, 0.2])] },
  { id: 'earlybird', label: 'Earlybird', category: 'classic', ops: [['contrast', 0.9], ['sepia', 0.2]], overlays: [radial('overlay', [[[208, 186, 142, 1], 0.2], [[54, 3, 9, 1], 0.85], [[29, 2, 16, 1], 1]])] },
  { id: 'gingham', label: 'Gingham', category: 'classic', ops: [['brightness', 1.05], ['hue-rotate', -10]], overlays: [solid('soft-light', [230, 230, 250, 1])] },
  { id: 'hudson', label: 'Hudson', category: 'classic', ops: [['brightness', 1.2], ['contrast', 0.9], ['saturate', 1.1]], overlays: [radial('multiply', [[[166, 177, 255, 1], 0.5], [[52, 33, 52, 1]]], { opacity: 0.5 })] },
  { id: 'inkwell', label: 'Inkwell', category: 'classic', ops: [['sepia', 0.3], ['contrast', 1.1], ['brightness', 1.1], ['grayscale', 1]] },
  { id: 'kelvin', label: 'Kelvin', category: 'classic', ops: [], overlays: [solid('color-dodge', [56, 44, 52, 1]), solid('overlay', [183, 125, 33, 1])] },
  { id: 'lark', label: 'Lark', category: 'classic', ops: [['contrast', 0.9]], overlays: [solid('color-dodge', [34, 37, 63, 1]), solid('darken', [242, 242, 242, 0.8])] },
  { id: 'lofi', label: 'Lo-Fi', category: 'classic', ops: [['saturate', 1.1], ['contrast', 1.5]], overlays: [radial('multiply', [[null, 0.7], [[34, 34, 34, 1], 1.5]])] },
  { id: 'maven', label: 'Maven', category: 'classic', ops: [['sepia', 0.25], ['brightness', 0.95], ['contrast', 0.95], ['saturate', 1.5]], overlays: [solid('hue', [3, 230, 26, 0.2])] },
  { id: 'mayfair', label: 'Mayfair', category: 'classic', ops: [['contrast', 1.1], ['saturate', 1.1]], overlays: [radial('overlay', [[[255, 255, 255, 0.8]], [[255, 200, 200, 0.6]], [[17, 17, 17, 1], 0.6]], { at: [0.4, 0.4], opacity: 0.4 })] },
  { id: 'moon', label: 'Moon', category: 'classic', ops: [['grayscale', 1], ['contrast', 1.1], ['brightness', 1.1]], overlays: [solid('soft-light', [160, 160, 160, 1]), solid('lighten', [56, 56, 56, 1])] },
  { id: 'nashville', label: 'Nashville', category: 'classic', ops: [['sepia', 0.2], ['contrast', 1.2], ['brightness', 1.05], ['saturate', 1.2]], overlays: [solid('darken', [247, 176, 153, 0.56]), solid('lighten', [0, 70, 150, 0.4])] },
  { id: 'perpetua', label: 'Perpetua', category: 'classic', ops: [], overlays: [linear('soft-light', 'to bottom', [[[0, 91, 154, 1]], [[230, 193, 61, 1]]], 0.5)] },
  { id: 'reyes', label: 'Reyes', category: 'classic', ops: [['sepia', 0.22], ['brightness', 1.1], ['contrast', 0.85], ['saturate', 0.75]], overlays: [solid('soft-light', [239, 205, 173, 1], 0.5)] },
  { id: 'rise', label: 'Rise', category: 'classic', ops: [['brightness', 1.05], ['sepia', 0.2], ['contrast', 0.9], ['saturate', 0.9]], overlays: [radial('multiply', [[[236, 205, 169, 0.15], 0.55], [[50, 30, 7, 0.4]]]), radial('overlay', [[[232, 197, 152, 0.8]], [null, 0.9]], { opacity: 0.6 })] },
  { id: 'slumber', label: 'Slumber', category: 'classic', ops: [['saturate', 0.66], ['brightness', 1.05]], overlays: [solid('lighten', [69, 41, 12, 0.4]), solid('soft-light', [125, 105, 24, 0.5])] },
  { id: 'stinson', label: 'Stinson', category: 'classic', ops: [['contrast', 0.75], ['saturate', 0.85], ['brightness', 1.15]], overlays: [solid('soft-light', [240, 149, 128, 0.2])] },
  { id: 'toaster', label: 'Toaster', category: 'classic', ops: [['contrast', 1.5], ['brightness', 0.9]], overlays: [radial('screen', [[[128, 78, 15, 1]], [[59, 0, 59, 1]]])] },
  { id: 'valencia', label: 'Valencia', category: 'classic', ops: [['contrast', 1.08], ['brightness', 1.08], ['sepia', 0.08]], overlays: [solid('exclusion', [58, 3, 57, 1], 0.5)] },
  { id: 'walden', label: 'Walden', category: 'classic', ops: [['brightness', 1.1], ['hue-rotate', -10], ['sepia', 0.3], ['saturate', 1.6]], overlays: [solid('screen', [0, 68, 204, 1], 0.3)] },
  { id: 'willow', label: 'Willow', category: 'classic', ops: [['grayscale', 0.5], ['contrast', 0.95], ['brightness', 0.9]], overlays: [solid('color', [216, 205, 203, 1])] },
  { id: 'xpro2', label: 'X-Pro II', category: 'classic', ops: [['sepia', 0.3]], overlays: [radial('color-burn', [[[230, 231, 224, 1], 0.4], [[43, 42, 161, 0.6], 1.1]])] },

  // Basic adjustments.
  { id: 'bw', label: 'B&W', category: 'basic', ops: [['grayscale', 1], ['contrast', 1.1]] },
  { id: 'sepia', label: 'Sepia', category: 'basic', ops: [['sepia', 0.8], ['contrast', 1.05]] },
  { id: 'warm', label: 'Warm', category: 'basic', ops: [['sepia', 0.2], ['saturate', 1.3], ['brightness', 1.05]] },
  { id: 'vintage', label: 'Vintage', category: 'basic', ops: [['sepia', 0.4], ['contrast', 0.9], ['saturate', 0.8], ['brightness', 1.05]] },
  { id: 'bold', label: 'Bold', category: 'basic', ops: [['contrast', 1.3], ['saturate', 1.25]] },
]

const BY_ID = new Map(FILTERS.map((f) => [f.id, f]))

export const getFilter = (id) => BY_ID.get(id) ?? FILTERS[0]

export const filterToCss = (id) => {
  const { ops } = getFilter(id)
  if (ops.length === 0) return 'none'
  return ops.map(([name, v]) => (name === 'hue-rotate' ? `${name}(${v}deg)` : `${name}(${v})`)).join(' ')
}

// --- Gradient helpers shared by CSS and canvas ---------------------------------

const rgba = ([r, g, b, a]) => `rgba(${r}, ${g}, ${b}, ${a})`

// Fill in CSS default stop positions and turn `null` (transparent) into the
// neighbouring color at alpha 0, which is how CSS interpolates `transparent`.
const normalizeStops = (stops) => {
  const out = stops.map(([color, pos]) => ({ color, pos }))
  if (out[0].pos == null) out[0].pos = 0
  if (out[out.length - 1].pos == null) out[out.length - 1].pos = 1
  for (let i = 1; i < out.length - 1; i++) {
    if (out[i].pos != null) continue
    let j = i
    while (out[j].pos == null) j++
    const start = out[i - 1].pos
    const step = (out[j].pos - start) / (j - i + 1)
    for (let k = i; k < j; k++) out[k].pos = start + step * (k - i + 1)
  }
  for (let i = 1; i < out.length; i++) out[i].pos = Math.max(out[i].pos, out[i - 1].pos)
  return out.map((s, i) => {
    if (s.color) return { color: s.color, pos: s.pos }
    const near = out[i + 1]?.color ?? out[i - 1]?.color ?? [0, 0, 0, 0]
    return { color: [near[0], near[1], near[2], 0], pos: s.pos }
  })
}

const GRADIENT_STEPS = 12

const lerpPremultiplied = (c0, c1, t) => {
  const a = c0[3] + (c1[3] - c0[3]) * t
  if (a === 0) return [0, 0, 0, 0]
  const ch = (k) => Math.round((c0[k] * c0[3] + (c1[k] * c1[3] - c0[k] * c0[3]) * t) / a)
  return [ch(0), ch(1), ch(2), +a.toFixed(4)]
}

const LINEAR_DIRS ={ 'to right': [0, 0, 1, 0], 'to bottom': [0, 0, 0, 1] }

const fillToCss = (fill) => {
  if (Array.isArray(fill)) return rgba(fill)
  const stops = normalizeStops(fill.stops)
    .map((s) => `${rgba(s.color)} ${+(s.pos * 100).toFixed(2)}%`)
    .join(', ')
  if (fill.type === 'linear') return `linear-gradient(${fill.dir}, ${stops})`
  const [x, y] = fill.at
  return `radial-gradient(circle farthest-corner at ${x * 100}% ${y * 100}%, ${stops})`
}

const fillToCanvas = (ctx, fill, w, h) => {
  if (Array.isArray(fill)) return rgba(fill)
  const stops = normalizeStops(fill.stops)
  let gradient
  let span = 1
  if (fill.type === 'linear') {
    const [x0, y0, x1, y1] = LINEAR_DIRS[fill.dir]
    gradient = ctx.createLinearGradient(x0 * w, y0 * h, x1 * w, y1 * h)
  } else {
    const cx = fill.at[0] * w
    const cy = fill.at[1] * h
    const radius = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy))
    // Canvas stops must be within 0..1, so stretch the radius to cover stops past 100%.
    span = Math.max(1, stops[stops.length - 1].pos)
    gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * span)
  }
  // CSS interpolates gradients with premultiplied alpha; canvas doesn't. Add
  // in-between stops computed the CSS way so semi-transparent gradients match.
  const add = (pos, color) => gradient.addColorStop(Math.min(1, Math.max(0, pos / span)), rgba(color))
  stops.forEach((s, i) => {
    add(s.pos, s.color)
    const next = stops[i + 1]
    if (!next || next.color[3] === s.color[3]) return
    for (let k = 1; k < GRADIENT_STEPS; k++) {
      const t = k / GRADIENT_STEPS
      add(s.pos + (next.pos - s.pos) * t, lerpPremultiplied(s.color, next.color, t))
    }
  })
  return gradient
}

/** Inline styles for the overlay layers of a filter, for live CSS previews. */
export const overlayStyles = (id) =>
  (getFilter(id).overlays ?? []).map((o) => ({
    background: fillToCss(o.fill),
    mixBlendMode: o.blend,
    opacity: o.opacity ?? 1,
  }))

// --- Pixel pipeline ------------------------------------------------------------

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

// Applies the ops in place. Ops run one after another with clamping in between,
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

/** Applies a filter (overlays, then ops) to everything already drawn on the canvas. */
export const applyFilterToCanvas = (ctx, w, h, id) => {
  const filter = getFilter(id)
  if (filter.overlays?.length) {
    ctx.save()
    for (const o of filter.overlays) {
      ctx.globalCompositeOperation = o.blend
      ctx.globalAlpha = o.opacity ?? 1
      ctx.fillStyle = fillToCanvas(ctx, o.fill, w, h)
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
  }
  if (filter.ops.length) {
    const data = ctx.getImageData(0, 0, w, h)
    ctx.putImageData(applyFilterToImageData(data, id), 0, 0)
  }
}
