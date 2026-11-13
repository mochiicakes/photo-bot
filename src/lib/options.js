// Photo shape. `ratio` is height / width.
export const ASPECTS = [
  { id: 'portrait', label: '3:4', ratio: 4 / 3 },
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'landscape', label: '4:3', ratio: 3 / 4 },
]

export const getAspect = (id) => ASPECTS.find((a) => a.id === id) ?? ASPECTS[0]

// Which layouts make sense for each photo count.
export const LAYOUTS = [
  { id: 'vertical', label: 'Vertical', counts: [1, 2, 3, 4] },
  { id: 'horizontal', label: 'Horizontal', counts: [2, 3, 4] },
  { id: 'grid', label: 'Collage', counts: [4] },
]

export const layoutsFor = (count) => LAYOUTS.filter((l) => l.counts.includes(count))

export const resolveLayout = (layout, count) =>
  layoutsFor(count).some((l) => l.id === layout) ? layout : 'vertical'

export const FRAME_STYLES = [
  { id: 'classic', label: 'Framed' },
  { id: 'stars', label: 'Stars 星' },
  { id: 'sakura', label: 'Sakura 桜' },
  { id: 'tsukimi', label: 'Tsukimi 月見' },
  { id: 'fullmoon', label: 'Full moon 満月' },
  { id: 'none', label: 'No frame' },
]

export const FRAME_COLORS = [
  { value: '#fdfdff', name: 'Moon white' },
  { value: '#fff3d6', name: 'Cream' },
  { value: '#141b3a', name: 'Night' },
  { value: '#ffd76a', name: 'Moon yellow' },
  { value: '#f8c9d8', name: 'Sakura' },
  { value: '#ddd0f5', name: 'Lilac' },
  { value: '#cfe2f7', name: 'Sky' },
  { value: '#d9e6c8', name: 'Matcha' },
]

// Screen light: the screen glows a soft color to light the face, Xiaohongshu-style.
export const SCREEN_LIGHTS = [
  { id: 'off', label: 'Off' },
  { id: 'pink', label: 'Pink', color: '#ffa3c8' },
  { id: 'lilac', label: 'Lilac', color: '#b78aff' },
  { id: 'blue', label: 'Blue', color: '#7cb8ff' },
  { id: 'white', label: 'White', color: '#fff8ef' },
]
