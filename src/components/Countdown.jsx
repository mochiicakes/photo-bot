import { useState } from "react"

const Countdown = ({ seconds, onTimerComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [isActive, setIsActive] = useState(false)

  const startTimer = () => {
    setIsActive(true)
    setTimeLeft(seconds)
    
    const interval = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(interval)
          setIsActive(false)
          onTimerComplete?.()
          return 0
        }
        return time - 1
      })
    }, 1000)
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 text-center">
        <h3 className="text-xl font-bold mb-4 text-gray-800">⏰ Timer</h3>
        <div className="text-4xl font-bold mb-4 text-blue-600">{timeLeft}s</div>
        <button
          onClick={startTimer}
          disabled={isActive}
          className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
            isActive
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {isActive ? '⏱️ Running...' : '▶️ Start Timer'}
        </button>
      </div>
    </div>
  )
}

export default Countdown;