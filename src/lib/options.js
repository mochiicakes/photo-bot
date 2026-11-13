// Photo shape. `ratio` is height / width.
export const ASPECTS = [
  { id: 'portrait', label: '3:4', ratio: 4 / 3 },
  { id: 'square', label: '1:1', ratio: 1 },
]

export const getAspect = (id) => ASPECTS.find((a) => a.id === id) ?? ASPECTS[0]

// Which layouts make sense for each photo count.
export const LAYOUTS = [
  { id: 'vertical', label: 'Strip', counts: [1, 2, 3, 4] },
  { id: 'horizontal', label: 'Side by side', counts: [2, 3] },
  { id: 'grid', label: 'Collage', counts: [4] },
]

export const layoutsFor = (count) => LAYOUTS.filter((l) => l.counts.includes(count))

export const resolveLayout = (layout, count) =>
  layoutsFor(count).some((l) => l.id === layout) ? layout : 'vertical'

export const FRAME_STYLES = [
  { id: 'classic', label: 'Framed' },
  { id: 'none', label: 'No frame' },
]

export const FRAME_COLORS = [
  { value: '#f6efe3', name: 'Rice paper' },
  { value: '#ffffff', name: 'White' },
  { value: '#1f1a17', name: 'Ink' },
  { value: '#b8322a', name: 'Vermilion' },
  { value: '#f8c9d8', name: 'Blush' },
  { value: '#ddd0f5', name: 'Lilac' },
  { value: '#cfe2f7', name: 'Sky' },
  { value: '#cfdfcf', name: 'Celadon' },
]

// Screen light (补光): the screen glows a soft color to light the face, Xiaohongshu-style.
export const SCREEN_LIGHTS = [
  { id: 'off', label: 'Off' },
  { id: 'pink', label: 'Pink', color: '#ffa3c8' },
  { id: 'lilac', label: 'Lilac', color: '#cba6ff' },
  { id: 'blue', label: 'Blue', color: '#9ccfff' },
  { id: 'white', label: 'White', color: '#fff8ef' },
]
