import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

// Simple context for light mode only
interface ThemeContextType {
  // Keep the interface but force light theme
  theme: 'light';
  setTheme: (theme: 'light') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string; // Keep prop for compatibility but ignore it
  storageKey?: string;   // Keep prop for compatibility but ignore it
};

export function ThemeProvider({ 
  children 
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
    // Force document to use light theme
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  if (!mounted) {
    // Prevent theme flash by not rendering until client-side
    return <>{children}</>;
  }

  // Create a simple light-mode-only context value
  const value: ThemeContextType = {
    theme: 'light',
    setTheme: () => {} // No-op function since we're forcing light mode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};