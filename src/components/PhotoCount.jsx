import { useEffect, useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'

const OPTIONS = [1, 2, 3, 4]

const PhotoCount = ({ targetCount, setTargetCount, disabled }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="w-14 h-14 flex items-center justify-center rounded-full bg-surface border border-line shadow-lg text-ink-soft transition-all duration-300 hover:border-gold hover:text-ink hover:scale-105 relative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        aria-label={`Number of photos: ${targetCount}`}
        aria-expanded={open}
        title="Number of photos"
      >
        <ImageIcon className="w-6 h-6" />
        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent text-on-accent text-xs rounded-full flex items-center justify-center font-medium">
          {targetCount}
        </span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-surface border border-line rounded-xl shadow-xl z-10 flex overflow-hidden">
          {OPTIONS.map((num) => (
            <button
              key={num}
              onClick={() => {
                setTargetCount(num)
                setOpen(false)
              }}
              aria-pressed={num === targetCount}
              className={`px-4 py-2 text-sm transition-all duration-200 ${
                num === targetCount ? 'bg-accent text-on-accent' : 'text-ink-soft hover:bg-paper-deep hover:text-ink'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PhotoCount
