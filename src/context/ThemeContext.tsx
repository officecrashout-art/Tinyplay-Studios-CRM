import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark';
  isDark: true;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    try {
      localStorage.removeItem('tp_crm_theme');
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: 'dark',
        isDark: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
