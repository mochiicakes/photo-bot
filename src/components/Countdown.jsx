import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Clock3 } from 'lucide-react'

const COUNTDOWN_VALUES = [3, 5, 10]

const Countdown = forwardRef((_, ref) => {
  const COUNTDOWN_VALUES = [3, 5, 10]
  const [modeIndex, setModeIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [onFinishCallback, setOnFinishCallback] = useState(null)

  const currentSeconds = COUNTDOWN_VALUES[modeIndex] || null

  useImperativeHandle(ref, () => ({
    start: (callback) => {
      if (modeIndex === -1) {
        callback?.()
      } else {
        setOnFinishCallback(() => callback)
        setTimeLeft(currentSeconds)
        setIsRunning(true)
      }
    },
    hasCountdown: () => modeIndex !== -1,
    getCurrentTime: () => timeLeft
  }))

  useEffect(() => {
    if (!isRunning || timeLeft === null) return

    if (timeLeft === 0) {
      setIsRunning(false)
      setTimeLeft(null)
      onFinishCallback?.()
      return
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [isRunning, timeLeft, onFinishCallback])

  const cycleMode = () => {
    if (isRunning) return
    const next = (modeIndex + 1) % (COUNTDOWN_VALUES.length + 1)
    setModeIndex(next === COUNTDOWN_VALUES.length ? -1 : next)
  }

  return (
    <button
      onClick={cycleMode}
      disabled={isRunning}
      className={`w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-stone-900 shadow-lg border border-stone-200 dark:border-stone-700 transition-all duration-300 hover:shadow-xl hover:scale-105 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Timer Settings"
    >
      {modeIndex === -1 ? (
        <Clock3 className="w-6 h-6 text-stone-600 dark:text-stone-400" />
      ) : (
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{COUNTDOWN_VALUES[modeIndex]}s</span>
      )}
    </button>
  )
})

export default Countdown