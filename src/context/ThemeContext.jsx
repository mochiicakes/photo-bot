import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

// index.html applies the saved/system theme before React mounts; start from that.
const getInitialTheme = () => document.documentElement.classList.contains('dark')

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {
      /* storage unavailable; theme just won't persist */
    }
  }, [isDark])

  return <ThemeContext.Provider value={{ isDark, setIsDark }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)
