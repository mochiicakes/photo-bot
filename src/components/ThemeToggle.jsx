import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button
        onClick={() => setIsDark(!isDark)}
        className={`px-4 py-2 rounded border text-sm transition
            bg-white text-black hover:bg-gray-200
            dark:bg-black dark:text-white dark:hover:bg-gray-800
        `}
        >
        {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};

export default ThemeToggle;