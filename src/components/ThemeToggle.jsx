import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ThemeToggle = () => {
  const { isDark, setIsDark } = useTheme()

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="w-12 h-12 shrink-0 rounded-full bg-surface border border-line shadow-lg flex items-center justify-center transition-all duration-300 hover:border-gold hover:scale-105"
    >
      {isDark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-ink-soft" />}
    </button>
  )
}

export default ThemeToggle
