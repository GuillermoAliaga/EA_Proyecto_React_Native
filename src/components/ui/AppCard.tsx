import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function AppCard({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
