import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

interface ToastBannerProps {
  message: string;
  position?: 'top' | 'bottom';
}

export function ToastBanner({ message, position = 'top' }: ToastBannerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      style={[
        styles.position,
        position === 'top' ? { top: insets.top + 12 } : { bottom: insets.bottom + 12 },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: colors.navigation }]}>
        <Text style={[styles.message, { color: colors.surface }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  banner: {
    maxWidth: 520,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  message: { fontSize: 14, fontWeight: '600' },
});
