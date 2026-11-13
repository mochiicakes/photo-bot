import { Ban, Sun } from 'lucide-react'
import { SCREEN_LIGHTS } from '../lib/options'

// Pick a glow color for the screen-as-ring-light effect (补光).
const ScreenLightPicker = ({ value, onChange, disabled }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Screen light color">
      {SCREEN_LIGHTS.map((light) => {
        const selected = light.id === value
        return (
          <button
            key={light.id}
            role="radio"
            aria-checked={selected}
            aria-label={`Screen light: ${light.label}`}
            title={light.label}
            disabled={disabled}
            onClick={() => onChange(light.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 hover:scale-110 disabled:opacity-50 ${
              selected ? 'border-accent scale-110 shadow-lg' : 'border-line'
            } ${light.color ? '' : 'bg-surface text-ink-soft'}`}
            style={light.color ? { backgroundColor: light.color, boxShadow: selected ? `0 0 18px ${light.color}` : undefined } : undefined}
          >
            {!light.color && <Ban className="w-4 h-4" />}
          </button>
        )
      })}
    </div>
    {value !== 'off' && (
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[#3a2a20]">
        <Sun className="w-3.5 h-3.5" /> Turn your screen brightness all the way up
      </p>
    )}
  </div>
)

export default ScreenLightPicker
