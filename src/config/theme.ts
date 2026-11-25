export interface ThemeColors {
  primary: string;
  text: string;
  textSecondary: string;
  background: string;
  surface: string;
  border: string;
  danger: string;
  navigation: string;
  navigationActive: string;
}

export const lightTheme: { colors: ThemeColors } = {
  colors: {
    primary: '#3949ab',
    text: '#1f2933',
    textSecondary: '#616e7c',
    background: '#f4f5f7',
    surface: '#ffffff',
    border: '#d9dde3',
    danger: '#c62828',
    navigation: '#1f2937',
    navigationActive: '#3b82f6',
  },
};

export const darkTheme: { colors: ThemeColors } = {
  colors: {
    primary: '#9fa8da',
    text: '#f3f4f6',
    textSecondary: '#b0b8c2',
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    danger: '#ef5350',
    navigation: '#0b1220',
    navigationActive: '#90caf9',
  },
};

export const theme = lightTheme;
