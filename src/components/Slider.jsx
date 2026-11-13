// Labelled 0–100% range slider. `value` is 0..1.
const Slider = ({ label, sublabel, value, onChange, disabled }) => (
  <label className={`flex items-center gap-3 w-full max-w-sm ${disabled ? 'opacity-50' : ''}`}>
    <span className="w-28 shrink-0 text-sm font-medium text-ink">
      {label} {sublabel && <span className="text-gold">{sublabel}</span>}
    </span>
    <input
      type="range"
      min={0}
      max={100}
      step={5}
      value={Math.round(value * 100)}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="range flex-1"
      style={{ '--pct': `${Math.round(value * 100)}%` }}
    />
    <span className="w-10 text-right text-sm tabular-nums text-ink-soft">{Math.round(value * 100)}%</span>
  </label>
)

export default Slider
