import { filterToCss, overlayStyles } from '../lib/filters'

const POSITIONED = /\b(absolute|fixed)\b/

// Live CSS preview of a filter. `children` is the media to filter: overlays are blended
// on top and the color ops apply to the whole group (as in the export). With `base` (the
// same media, unfiltered) underneath, `strength` fades the filtered layer over it, which
// matches the export's alpha mix. Give it a size; it's `relative` unless positioned.
const FilterLayer = ({ filter, strength = 1, base, className = '', children }) => (
  <div className={`${POSITIONED.test(className) ? '' : 'relative'} overflow-hidden ${className}`}>
    {base && <div className="absolute inset-0">{base}</div>}
    <div className="absolute inset-0 isolate" style={{ filter: filterToCss(filter), opacity: strength }}>
      {children}
      {overlayStyles(filter).map((style, i) => (
        <div key={i} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={style} />
      ))}
    </div>
  </div>
)

export const FilteredImage = ({ src, filter, strength = 1, alt = '', className = '' }) => {
  const img = <img src={src} alt={alt} className="w-full h-full object-cover" />
  return (
    <FilterLayer filter={filter} strength={strength} base={strength < 1 ? img : null} className={className}>
      {img}
    </FilterLayer>
  )
}

export default FilterLayer
