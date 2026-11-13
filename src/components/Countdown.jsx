import { Clock3 } from 'lucide-react'

const TIMER_OPTIONS = [0, 3, 5, 10]

// Cycles the self-timer: off → 3s → 5s → 10s → off.
const Countdown = ({ seconds, onChange, disabled }) => {
  const next = TIMER_OPTIONS[(TIMER_OPTIONS.indexOf(seconds) + 1) % TIMER_OPTIONS.length]

  return (
    <button
      onClick={() => onChange(next)}
      disabled={disabled}
      aria-label={seconds ? `Self-timer ${seconds} seconds. Click to change.` : 'Self-timer off. Click to turn on.'}
      title="Self-timer"
      className="w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-stone-900 shadow-lg border border-stone-200 dark:border-stone-700 transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {seconds === 0 ? (
        <Clock3 className="w-6 h-6 text-stone-600 dark:text-stone-400" />
      ) : (
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{seconds}s</span>
      )}
    </button>
  )
}

export default Countdown
