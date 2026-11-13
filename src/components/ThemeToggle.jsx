import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ThemeToggle = () => {
  const { isDark, setIsDark } = useTheme()

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="w-12 h-12 shrink-0 rounded-full bg-white dark:bg-stone-900 shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-stone-600" />}
    </button>
  )
}

export default ThemeToggle
