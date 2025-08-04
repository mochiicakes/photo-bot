import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
        const saved = localStorage.getItem('theme');
        return saved ? JSON.parse(saved) : false;
    } catch {
        return false;
    }
    });

  useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', JSON.stringify(isDark));
        console.log("isDark:", isDark);
    }, [isDark]);


  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
