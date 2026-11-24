import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';

interface ToastBannerProps {
  message: string;
  position?: 'top' | 'bottom';
}

export function ToastBanner({ message, position = 'top' }: ToastBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      style={[
        styles.position,
        position === 'top' ? { top: insets.top + 12 } : { bottom: insets.bottom + 12 },
      ]}
    >
      <View style={styles.banner}>
        <Text style={styles.message}>{message}</Text>
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
    backgroundColor: theme.colors.navigation,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  message: { color: theme.colors.surface, fontSize: 14, fontWeight: '600' },
});
