import { filterToCss, overlayStyles } from '../lib/filters'

const POSITIONED = /\b(absolute|fixed)\b/

// Wraps an image or video and applies a filter's live CSS preview: blend-mode overlays
// on top of the media, with the color ops applied to the whole group (as in the export).
// Callers may position it themselves (e.g. `absolute inset-0`); otherwise it's `relative`
// so the overlays stay inside it.
const FilterLayer = ({ filter, className = '', children }) => (
  <div
    className={`${POSITIONED.test(className) ? '' : 'relative'} overflow-hidden isolate ${className}`}
    style={{ filter: filterToCss(filter) }}
  >
    {children}
    {overlayStyles(filter).map((style, i) => (
      <div key={i} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={style} />
    ))}
  </div>
)

export default FilterLayer
