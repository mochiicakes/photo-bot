import { drawMoonGlyph, isFullMoonNight } from './moon'

// Vector decorations for the special frame styles. They're drawn only in the frame's
// margins and footer (never over photos), in strip base units (the canvas is pre-scaled).

// Small deterministic RNG so a frame looks the same in preview and export.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// Points inside the margin band around the photos and the footer corners.
const marginPoints = (geo, count, seed) => {
  const rand = rng(seed)
  const { width, footerTop, pad } = geo
  const points = []
  for (let i = 0; i < count; i++) {
    const side = Math.floor(rand() * 4)
    const inset = pad / 2
    let x
    let y
    if (side === 0) [x, y] = [inset, pad + rand() * (footerTop - pad * 2)]
    else if (side === 1) [x, y] = [width - inset, pad + rand() * (footerTop - pad * 2)]
    else if (side === 2) [x, y] = [pad + rand() * (width - pad * 2), inset]
    else {
      // footer corners, away from the centred caption
      const left = rand() < 0.5
      x = left ? pad + rand() * width * 0.18 : width - pad - rand() * width * 0.18
      y = footerTop + 14 + rand() * Math.max(8, geo.height - footerTop - 28)
    }
    points.push({ x, y, r: rand(), a: rand() * Math.PI * 2 })
  }
  return points
}

const sparkle = (ctx, x, y, s) => {
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.quadraticCurveTo(x, y, x + s, y)
  ctx.quadraticCurveTo(x, y, x, y + s)
  ctx.quadraticCurveTo(x, y, x - s, y)
  ctx.quadraticCurveTo(x, y, x, y - s)
  ctx.fill()
}

const petal = (ctx, x, y, s, angle) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, s)
  ctx.bezierCurveTo(-s * 0.9, s * 0.2, -s * 0.6, -s * 0.9, -s * 0.12, -s)
  ctx.lineTo(0, -s * 0.72) // the notch at the tip of a cherry petal
  ctx.lineTo(s * 0.12, -s)
  ctx.bezierCurveTo(s * 0.6, -s * 0.9, s * 0.9, s * 0.2, 0, s)
  ctx.fill()
  ctx.restore()
}

const grass = (ctx, x, baseY, h, lean, color) => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, baseY)
  ctx.quadraticCurveTo(x + lean * 0.3, baseY - h * 0.6, x + lean, baseY - h)
  ctx.stroke()
  // susuki plume
  ctx.globalAlpha = 0.85
  for (let i = 0; i < 5; i++) {
    const t = 0.7 + i * 0.07
    const px = x + lean * t * t
    const py = baseY - h * t
    ctx.beginPath()
    ctx.ellipse(px + 3, py + 1, 4, 1.4, 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

const STAR_INK = (light) => (light ? '#e2a71e' : '#ffe9a8')

const decorators = {
  stars: (ctx, geo, { light }) => {
    ctx.fillStyle = STAR_INK(light)
    for (const p of marginPoints(geo, 18, 7)) {
      ctx.globalAlpha = 0.55 + p.r * 0.45
      sparkle(ctx, p.x, p.y, 2.5 + p.r * Math.min(4.5, geo.pad * 0.28))
    }
    ctx.globalAlpha = 1
  },

  sakura: (ctx, geo) => {
    const colors = ['#f7a8c4', '#ffc7da', '#f48fb1']
    marginPoints(geo, 20, 11).forEach((p, i) => {
      ctx.fillStyle = colors[i % colors.length]
      ctx.globalAlpha = 0.75 + p.r * 0.25
      petal(ctx, p.x, p.y, 3 + p.r * Math.min(4, geo.pad * 0.25), p.a)
    })
    ctx.globalAlpha = 1
  },

  tsukimi: (ctx, geo, { light }) => {
    const { width, height, footerTop, pad } = geo
    const baseY = height - pad * 0.6
    const ink = light ? '#b08a3e' : '#e8d6a4'
    ctx.fillStyle = ink
    for (let i = 0; i < 4; i++) grass(ctx, pad + 6 + i * 7, baseY, 34 + (i % 2) * 10, 10 + i * 3, ink)
    const moonR = Math.min(18, (height - footerTop) * 0.24)
    ctx.save()
    ctx.shadowColor = 'rgba(255, 220, 120, 0.8)'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ffe08a'
    ctx.beginPath()
    ctx.arc(width - pad - moonR - 4, footerTop + (height - footerTop) / 2, moonR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = STAR_INK(light)
    for (const p of marginPoints(geo, 8, 3).filter((q) => q.y < footerTop)) sparkle(ctx, p.x, p.y, 2.5 + p.r * 2.5)
  },

  fullmoon: (ctx, geo, { light }) => {
    const { width, height, footerTop, pad } = geo
    const r = Math.min(24, (height - footerTop) * 0.3)
    const cx = pad + r + 6
    const cy = footerTop + (height - footerTop) / 2
    ctx.save()
    ctx.shadowColor = 'rgba(255, 225, 140, 0.9)'
    ctx.shadowBlur = 18
    drawMoonGlyph(ctx, cx, cy, r, 0.5, '#ffe08a', '#ffe08a')
    ctx.restore()
    // soft craters
    ctx.fillStyle = 'rgba(214, 170, 70, 0.35)'
    for (const [dx, dy, cr] of [[-0.3, -0.25, 0.18], [0.25, 0.1, 0.13], [-0.05, 0.4, 0.1]]) {
      ctx.beginPath()
      ctx.arc(cx + dx * r, cy + dy * r, cr * r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = STAR_INK(light)
    sparkle(ctx, width - pad - 14, footerTop + 22, 5)
    sparkle(ctx, width - pad - 30, height - pad - 8, 3)
    for (const p of marginPoints(geo, 10, 5).filter((q) => q.y < footerTop)) sparkle(ctx, p.x, p.y, 2 + p.r * 2.5)
  },
}

export const DECORATED_STYLES = Object.keys(decorators)

export const drawFrameDecor = (ctx, style, geo, opts) => decorators[style]?.(ctx, geo, opts)

/** Which decorated style is "in season" today (shown with a 旬 badge). */
export const seasonalStyles = (date = new Date()) => {
  const month = date.getMonth()
  const styles = []
  if (month === 2 || month === 3) styles.push('sakura')
  if (month === 8 || month === 9) styles.push('tsukimi')
  if (isFullMoonNight(date)) styles.push('fullmoon')
  return styles
}
