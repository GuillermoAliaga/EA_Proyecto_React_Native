import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { theme } from '../../config/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles = {
  primary: { backgroundColor: theme.colors.primary, color: theme.colors.surface },
  secondary: { backgroundColor: theme.colors.border, color: theme.colors.text },
  danger: { backgroundColor: theme.colors.danger, color: theme.colors.surface },
  ghost: { backgroundColor: 'transparent', color: theme.colors.primary },
} as const;

export function AppButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const colors = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.backgroundColor },
        pressed && !loading && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.color} />
      ) : (
        <Text style={[styles.label, { color: colors.color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
});
