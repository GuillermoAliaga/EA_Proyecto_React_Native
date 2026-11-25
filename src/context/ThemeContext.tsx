import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../config/theme';
import type { ThemeColors } from '../config/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isLoaded: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'ea.themeMode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((storedMode) => {
        if (
          active &&
          (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark')
        ) {
          setModeState(storedMode);
        }
      })
      .catch((error: unknown) => {
        console.error('No se pudo cargar la preferencia de tema.', error);
      })
      .finally(() => {
        if (active) setIsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
      setModeState(nextMode);
    } catch (error) {
      console.error('No se pudo guardar la preferencia de tema.', error);
      throw error;
    }
  }, []);

  const colors = mode === 'system'
    ? systemScheme === 'dark' ? darkTheme.colors : lightTheme.colors
    : mode === 'dark' ? darkTheme.colors : lightTheme.colors;
  const value = useMemo(
    () => ({ mode, isLoaded, colors, setMode }),
    [mode, isLoaded, colors, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
}
