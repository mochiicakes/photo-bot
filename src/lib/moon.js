// Moon phase from the mean synodic month, measured from a known new moon.
// Accurate to within about a day, which is plenty for a date stamp.

const SYNODIC_DAYS = 29.530588853
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 2000-01-06 18:14 UTC
const DAY_MS = 24 * 60 * 60 * 1000

const PHASES = [
  { key: 'new', en: 'New moon', ja: '新月' },
  { key: 'waxing-crescent', en: 'Crescent', ja: '三日月' },
  { key: 'first-quarter', en: 'First quarter', ja: '上弦の月' },
  { key: 'waxing-gibbous', en: 'Waxing gibbous', ja: '十三夜' },
  { key: 'full', en: 'Full moon', ja: '満月' },
  { key: 'waning-gibbous', en: 'Waning gibbous', ja: '寝待月' },
  { key: 'last-quarter', en: 'Last quarter', ja: '下弦の月' },
  { key: 'waning-crescent', en: 'Waning crescent', ja: '有明月' },
]

/**
 * `fraction` runs 0 → 1 through the cycle (0 new, 0.5 full); `age` is days since new moon.
 */
export const moonPhase = (date = new Date()) => {
  const days = (date.getTime() - REFERENCE_NEW_MOON) / DAY_MS
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS
  const fraction = age / SYNODIC_DAYS
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2
  return { age, fraction, illumination, ...PHASES[Math.round(fraction * 8) % 8] }
}

/** True within ±1.5 days of the full moon. */
export const isFullMoonNight = (date = new Date()) => Math.abs(moonPhase(date).age - SYNODIC_DAYS / 2) <= 1.5

/**
 * Draws the moon as it looks for `fraction`: a dark disc, the lit half, then the
 * terminator ellipse (dark for crescents, lit for gibbous phases).
 */
export const drawMoonGlyph = (ctx, cx, cy, r, fraction, lit, dark) => {
  const waxing = fraction < 0.5
  const k = Math.cos(2 * Math.PI * fraction) // 1 = new, -1 = full
  ctx.save()
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = lit
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !waxing)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = k > 0 ? dark : lit
  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(0.01, r * Math.abs(k)), r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
