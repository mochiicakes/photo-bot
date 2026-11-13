import { FILTERS, filterToCss } from '../lib/filters'

// Row of filter choices. With `previewSrc`, each option shows a filtered thumbnail.
const FilterPicker = ({ value, onChange, previewSrc, disabled }) => (
  <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Photo filter">
    {FILTERS.map((f) => {
      const selected = f.id === value
      return (
        <button
          key={f.id}
          role="radio"
          aria-checked={selected}
          disabled={disabled}
          onClick={() => onChange(f.id)}
          className={`flex flex-col items-center gap-1 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
            previewSrc ? 'p-1' : 'px-4 py-2'
          } ${
            selected
              ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-md'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:shadow'
          }`}
        >
          {previewSrc && (
            <img
              src={previewSrc}
              alt=""
              className="w-14 h-14 object-cover rounded-lg"
              style={{ filter: filterToCss(f.id) }}
            />
          )}
          <span className={previewSrc ? 'text-xs pb-0.5' : ''}>{f.label}</span>
        </button>
      )
    })}
  </div>
)

export default FilterPicker
