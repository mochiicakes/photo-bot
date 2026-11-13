// Pill-style single-choice control. Options: { id, label, icon?, disabled?, title? }.
const Segmented = ({ options, value, onChange, label, disabled, size = 'md' }) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1 shadow-sm"
  >
    {options.map(({ id, label: text, icon: Icon, disabled: optDisabled, title }) => {
      const selected = id === value
      return (
        <button
          key={id}
          role="radio"
          aria-checked={selected}
          disabled={disabled || optDisabled}
          title={title}
          onClick={() => onChange(id)}
          className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
          } ${selected ? 'bg-accent text-on-accent shadow' : 'text-ink-soft hover:text-ink'}`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {text}
        </button>
      )
    })}
  </div>
)

export default Segmented
