import { useEffect, useRef, useState } from 'react'
import { FILTERS, FILTER_CATEGORIES, getFilter } from '../lib/filters'
import FilterLayer from './FilterLayer'
import Segmented from './Segmented'

// "Original" leads every tab so users can always get back to the unfiltered photo.
const filtersIn = (category) => [FILTERS[0], ...FILTERS.filter((f) => f.category === category && f.id !== 'none')]

const initialCategory = (value) => (value === 'none' ? 'tsuki' : getFilter(value).category)

// Category tabs plus a scrollable row of filters. With `previewSrc`, each option
// shows a live filtered thumbnail of that photo.
const FilterPicker = ({ value, onChange, previewSrc, disabled }) => {
  const [category, setCategory] = useState(() => initialCategory(value))
  const [fade, setFade] = useState({ left: false, right: false })
  const rowRef = useRef(null)

  // Fade the row's edges while more filters are hidden off-screen, so it reads as scrollable.
  const updateFade = () => {
    const row = rowRef.current
    if (!row) return
    const left = row.scrollLeft > 4
    const right = row.scrollLeft + row.clientWidth < row.scrollWidth - 4
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }))
  }

  // Keep the selected filter visible when switching tabs.
  useEffect(() => {
    const row = rowRef.current
    const selected = row?.querySelector('[aria-checked="true"]')
    if (row && selected) row.scrollLeft = selected.offsetLeft - row.clientWidth / 2 + selected.clientWidth / 2
    updateFade()
  }, [category])

  useEffect(() => {
    window.addEventListener('resize', updateFade)
    return () => window.removeEventListener('resize', updateFade)
  }, [])

  const mask = `linear-gradient(to right, ${fade.left ? 'transparent, black 2.5rem' : 'black'}, ${
    fade.right ? 'black calc(100% - 2.5rem), transparent' : 'black'
  })`

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <Segmented
        size="sm"
        label="Filter style"
        value={category}
        onChange={setCategory}
        options={FILTER_CATEGORIES}
      />
      <div
        ref={rowRef}
        role="radiogroup"
        aria-label="Photo filter"
        onScroll={updateFade}
        className="relative flex gap-2 w-max max-w-full mx-auto overflow-x-auto pb-2 px-1 snap-x [scrollbar-width:thin]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {filtersIn(category).map((f) => {
          const selected = f.id === value
          return (
            <button
              key={f.id}
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(f.id)}
              className={`shrink-0 snap-start flex flex-col items-center gap-1 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
                previewSrc ? 'p-1 w-[4.75rem]' : 'px-4 py-2 text-sm whitespace-nowrap'
              } ${
                selected
                  ? 'bg-accent text-on-accent shadow-md'
                  : 'bg-surface text-ink-soft border border-line hover:border-gold hover:text-ink'
              }`}
            >
              {previewSrc && (
                <FilterLayer filter={f.id} className="w-full aspect-square rounded-lg">
                  <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                </FilterLayer>
              )}
              <span className={previewSrc ? 'text-[11px] leading-tight pb-0.5 text-center' : ''}>{f.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FilterPicker
